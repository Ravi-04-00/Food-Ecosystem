import csv
import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.http import HttpResponse

from apps.accounts.models import AuditLog
from apps.adminpanel.models import PlatformConfig
from apps.orders.models import Order
from apps.payments.models import (
    Payment,
    Transaction as TxnModel,
    PaymentWebhook,
    RestaurantCommission,
    RestaurantSettlement,
    SettlementAdjustment
)
from apps.products.models import Restaurant

logger = logging.getLogger(__name__)

ROUNDING = Decimal('0.01')


def quantize_money(amount: Decimal | float | int | str) -> Decimal:
    """Safely round monetary amounts using Decimal ROUND_HALF_UP to 2 decimal places."""
    try:
        dec = Decimal(str(amount))
        return dec.quantize(ROUNDING, rounding=ROUND_HALF_UP)
    except Exception:
        return Decimal('0.00')


def get_active_commission_config():
    """
    Retrieves the authoritative platform commission rules from PlatformConfig.
    Defaults to 18.00% if unconfigured.
    """
    config_obj = PlatformConfig.objects.filter(key='system_settings').first()
    rate = Decimal('18.00')
    fixed_fee = Decimal('0.00')

    if config_obj and isinstance(config_obj.value, dict):
        val = config_obj.value
        if 'platform_commission_percentage' in val:
            try:
                rate = Decimal(str(val['platform_commission_percentage']))
            except Exception:
                pass
        if 'platform_commission_fixed_fee' in val:
            try:
                fixed_fee = Decimal(str(val['platform_commission_fixed_fee']))
            except Exception:
                pass

    return rate, fixed_fee


def calculate_order_commission(order: Order, override_rate=None, override_fixed_fee=None) -> dict:
    """
    Calculates platform commission and net restaurant earnings explicitly on the backend.
    
    Formula:
      - Calculation Base: eligible food item subtotal (order.item_total or order.subtotal)
      - Exclusions: delivery_fee, taxes, customer platform_fee are strictly excluded from commission base.
      - Packaging Fee: credited to merchant packaging costs.
      - Commission Amount: round((Base * Rate%) / 100 + FixedFee, 2)
      - Net Restaurant Payable: (Base + PackagingFee) - Commission Amount - Refunds
    """
    active_rate, active_fixed = get_active_commission_config()
    rate = quantize_money(override_rate if override_rate is not None else active_rate)
    fixed_fee = quantize_money(override_fixed_fee if override_fixed_fee is not None else active_fixed)

    # Base: Food Item Subtotal
    base = quantize_money(order.item_total or order.subtotal or Decimal('0.00'))
    packaging_fee = quantize_money(order.packaging_fee or Decimal('0.00'))

    # Ineligible orders (Cancelled, unverified payment, etc.)
    is_paid = order.payment_status in ['PAID', 'VERIFIED_PAID', 'COMPLETED']
    is_delivered = order.status in ['DELIVERED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVING']

    if not is_paid or order.status == 'CANCELLED' or order.payment_status in ['FAILED', 'CANCELLED']:
        return {
            'is_eligible': False,
            'calculation_base': base,
            'packaging_fee': packaging_fee,
            'rate_percentage': rate,
            'fixed_fee': fixed_fee,
            'commission_amount': Decimal('0.00'),
            'tax_on_commission': Decimal('0.00'),
            'net_restaurant_amount': Decimal('0.00'),
            'refund_deduction': Decimal('0.00'),
            'status': 'CANCELLED' if order.status == 'CANCELLED' else 'ACCRUED'
        }

    # Decimal-safe calculation
    commission_raw = (base * (rate / Decimal('100.00'))) + fixed_fee
    commission_amount = quantize_money(commission_raw)

    # Net restaurant amount
    net_restaurant_amount = quantize_money(base + packaging_fee - commission_amount)

    refund_deduction = Decimal('0.00')
    status_label = 'ACCRUED'
    if order.payment_status == 'REFUNDED':
        refund_deduction = base + packaging_fee
        commission_amount = Decimal('0.00')
        net_restaurant_amount = Decimal('0.00')
        status_label = 'REFUNDED'
    elif order.payment_status == 'PARTIALLY_REFUNDED':
        # Deduct reported refund amount from net
        payment = order.payments.order_by('-created_at').first()
        if payment and payment.refund_amount:
            refund_deduction = quantize_money(payment.refund_amount)
            net_restaurant_amount = quantize_money(max(Decimal('0.00'), net_restaurant_amount - refund_deduction))

    return {
        'is_eligible': True,
        'calculation_base': base,
        'packaging_fee': packaging_fee,
        'rate_percentage': rate,
        'fixed_fee': fixed_fee,
        'commission_amount': commission_amount,
        'tax_on_commission': Decimal('0.00'),
        'net_restaurant_amount': net_restaurant_amount,
        'refund_deduction': refund_deduction,
        'status': status_label
    }


def record_or_update_order_commission(order: Order, override_rate=None) -> RestaurantCommission | None:
    """
    Creates or updates the RestaurantCommission record for an order.
    Snapshots the commission rate at calculation time.
    """
    if not order.restaurant:
        return None

    calc = calculate_order_commission(order, override_rate=override_rate)

    commission, created = RestaurantCommission.objects.get_or_create(
        order=order,
        defaults={
            'restaurant': order.restaurant,
            'order_number': order.order_number,
            'calculation_base': calc['calculation_base'],
            'packaging_fee': calc['packaging_fee'],
            'rate_percentage': calc['rate_percentage'],
            'fixed_fee': calc['fixed_fee'],
            'commission_amount': calc['commission_amount'],
            'tax_on_commission': calc['tax_on_commission'],
            'net_restaurant_amount': calc['net_restaurant_amount'],
            'refund_deduction': calc['refund_deduction'],
            'status': calc['status']
        }
    )

    if not created:
        # If not settled yet, update based on latest order status
        if commission.status != 'SETTLED':
            commission.calculation_base = calc['calculation_base']
            commission.packaging_fee = calc['packaging_fee']
            commission.commission_amount = calc['commission_amount']
            commission.net_restaurant_amount = calc['net_restaurant_amount']
            commission.refund_deduction = calc['refund_deduction']
            commission.status = calc['status']
            commission.save(update_fields=[
                'calculation_base', 'packaging_fee', 'commission_amount',
                'net_restaurant_amount', 'refund_deduction', 'status', 'updated_at'
            ])

    return commission


def get_restaurant_earnings_summary(restaurant: Restaurant, date_from=None, date_to=None) -> dict:
    """
    Generates a comprehensive, verified earnings and settlement summary for a specific restaurant.
    Distinguishes:
      - estimated_earnings: orders in preparation / en route
      - finalized_earnings: delivered orders ready for settlement
      - pending_settlement: amount currently in unsettled / processing batches
      - completed_payout: amount verified and paid in completed settlements
    """
    # 1. Base query for delivered commissions
    commissions = RestaurantCommission.objects.filter(restaurant=restaurant)
    if date_from:
        commissions = commissions.filter(order__created_at__date__gte=date_from)
    if date_to:
        commissions = commissions.filter(order__created_at__date__lte=date_to)

    # 2. Aggregations on finalized orders
    finalized_entries = commissions.filter(
        order__status='DELIVERED',
        order__payment_status__in=['PAID', 'VERIFIED_PAID', 'COMPLETED']
    )

    gross_sales = finalized_entries.aggregate(val=Sum('calculation_base'))['val'] or Decimal('0.00')
    packaging_fees = finalized_entries.aggregate(val=Sum('packaging_fee'))['val'] or Decimal('0.00')
    platform_commission = finalized_entries.aggregate(val=Sum('commission_amount'))['val'] or Decimal('0.00')
    refund_deductions = finalized_entries.aggregate(val=Sum('refund_deduction'))['val'] or Decimal('0.00')
    finalized_net = finalized_entries.aggregate(val=Sum('net_restaurant_amount'))['val'] or Decimal('0.00')

    # 3. Estimated earnings on in-flight / preparing orders
    in_flight_orders = Order.objects.filter(
        restaurant=restaurant,
        status__in=['PLACED', 'CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVING'],
        payment_status__in=['PAID', 'VERIFIED_PAID', 'COMPLETED', 'PAYMENT_PENDING']
    )
    if date_from:
        in_flight_orders = in_flight_orders.filter(created_at__date__gte=date_from)
    if date_to:
        in_flight_orders = in_flight_orders.filter(created_at__date__lte=date_to)

    estimated_gross = in_flight_orders.aggregate(val=Sum('item_total'))['val'] or Decimal('0.00')
    active_rate, _ = get_active_commission_config()
    estimated_commission = quantize_money(estimated_gross * (active_rate / Decimal('100.00')))
    estimated_earnings = quantize_money(estimated_gross - estimated_commission)

    # 4. Settlement aggregates
    settlements = RestaurantSettlement.objects.filter(restaurant=restaurant)
    if date_from:
        settlements = settlements.filter(period_start__gte=date_from)
    if date_to:
        settlements = settlements.filter(period_end__lte=date_to)

    pending_settlement = settlements.filter(status__in=['PENDING', 'PROCESSING']).aggregate(val=Sum('net_payout_amount'))['val'] or Decimal('0.00')
    completed_payout = settlements.filter(status='PAID').aggregate(val=Sum('net_payout_amount'))['val'] or Decimal('0.00')

    # 5. Adjustments total
    adjustments_total = SettlementAdjustment.objects.filter(restaurant=restaurant).aggregate(val=Sum('amount'))['val'] or Decimal('0.00')

    # Unsettled ready balance
    unsettled_balance = finalized_entries.filter(status='ACCRUED', settlement__isnull=True).aggregate(val=Sum('net_restaurant_amount'))['val'] or Decimal('0.00')

    return {
        'restaurant_id': restaurant.id,
        'restaurant_name': restaurant.name,
        'currency': 'INR',
        'metrics': {
            'gross_order_value': quantize_money(gross_sales),
            'packaging_fees': quantize_money(packaging_fees),
            'platform_commission': quantize_money(platform_commission),
            'refund_deductions': quantize_money(refund_deductions),
            'adjustments': quantize_money(adjustments_total),
            'finalized_earnings': quantize_money(finalized_net),
            'estimated_earnings': quantize_money(estimated_earnings),
            'unsettled_balance': quantize_money(unsettled_balance),
            'pending_settlement': quantize_money(pending_settlement),
            'completed_payout': quantize_money(completed_payout),
            'order_count': finalized_entries.count()
        },
        'active_commission_rate': str(active_rate)
    }


def create_settlement_batch(
    restaurant: Restaurant,
    period_start,
    period_end,
    created_by=None,
    notes=''
) -> RestaurantSettlement:
    """
    Creates an atomic, audited settlement batch grouping all unsettled, accrued commission entries.
    Locks entries with select_for_update() to prevent double settlement or race conditions.
    """
    with transaction.atomic():
        # 1. Lock and fetch eligible accrued commissions
        eligible_commissions = RestaurantCommission.objects.select_for_update().filter(
            restaurant=restaurant,
            status='ACCRUED',
            settlement__isnull=True,
            order__status='DELIVERED',
            order__payment_status__in=['PAID', 'VERIFIED_PAID', 'COMPLETED'],
            order__created_at__date__gte=period_start,
            order__created_at__date__lte=period_end
        )

        count = eligible_commissions.count()
        if count == 0:
            raise ValueError(f"No eligible unsettled delivered orders found for {restaurant.name} between {period_start} and {period_end}.")

        # 2. Compute aggregate sums
        gross_sales = eligible_commissions.aggregate(val=Sum('calculation_base'))['val'] or Decimal('0.00')
        packaging_fees = eligible_commissions.aggregate(val=Sum('packaging_fee'))['val'] or Decimal('0.00')
        commission_deducted = eligible_commissions.aggregate(val=Sum('commission_amount'))['val'] or Decimal('0.00')
        net_payout = eligible_commissions.aggregate(val=Sum('net_restaurant_amount'))['val'] or Decimal('0.00')

        # 3. Generate unique settlement reference: SET-YYYYMMDD-XXXX
        ref_uuid = uuid.uuid4().hex[:6].upper()
        date_str = timezone.now().strftime('%Y%m%d')
        ref = f"SET-{date_str}-{ref_uuid}"

        settlement = RestaurantSettlement.objects.create(
            settlement_reference=ref,
            restaurant=restaurant,
            period_start=period_start,
            period_end=period_end,
            currency='INR',
            order_count=count,
            gross_sales_amount=quantize_money(gross_sales),
            total_packaging_fees=quantize_money(packaging_fees),
            total_commission_deducted=quantize_money(commission_deducted),
            total_adjustments=Decimal('0.00'),
            net_payout_amount=quantize_money(net_payout),
            status='PENDING',
            payout_provider='INTERNAL_LEDGER',
            notes=notes,
            created_by=created_by
        )

        # 4. Link entries to settlement and mark as SETTLED
        eligible_commissions.update(
            settlement=settlement,
            status='SETTLED',
            updated_at=timezone.now()
        )

        # 5. Audit log
        AuditLog.objects.create(
            actor=created_by,
            action='SETTLEMENT_BATCH_CREATED',
            target_model='RestaurantSettlement',
            target_id=str(settlement.id),
            ip_address='127.0.0.1',
            details={
                'settlement_reference': ref,
                'restaurant_id': restaurant.id,
                'order_count': count,
                'net_payout_amount': str(net_payout),
                'period': f"{period_start} to {period_end}"
            }
        )

        return settlement


def transition_settlement_status(
    settlement: RestaurantSettlement,
    target_status: str,
    actor=None,
    reason='',
    provider_reference='',
    provider_utr=''
) -> RestaurantSettlement:
    """
    Safely transitions a settlement's status with concurrency locking and validation.
    Enforces that marking as PAID requires a verified provider UTR / bank reference.
    """
    valid_transitions = {
        'PENDING': ['PROCESSING', 'FAILED'],
        'PROCESSING': ['PAID', 'FAILED', 'PENDING'],
        'FAILED': ['PENDING', 'PROCESSING'],
        'PAID': ['REVERSED']
    }

    with transaction.atomic():
        locked_settlement = RestaurantSettlement.objects.select_for_update().get(id=settlement.id)
        current = locked_settlement.status

        allowed = valid_transitions.get(current, [])
        if target_status not in allowed:
            raise ValueError(f"Cannot transition settlement from {current} to {target_status}. Allowed: {allowed}")

        if target_status == 'PAID':
            # Mandatory verification proof
            utr = provider_utr.strip() or provider_reference.strip()
            if not utr:
                raise ValueError("Marking settlement as PAID requires a verified provider UTR or settlement transaction reference.")
            locked_settlement.provider_utr = utr
            locked_settlement.verified_by = actor
            locked_settlement.payout_completed_at = timezone.now()

        elif target_status == 'PROCESSING':
            locked_settlement.approved_by = actor
            locked_settlement.payout_initiated_at = timezone.now()
            if provider_reference:
                locked_settlement.provider_reference = provider_reference

        elif target_status == 'FAILED':
            locked_settlement.failure_reason = reason or 'Payout attempt failed.'

        elif target_status == 'REVERSED':
            if not reason:
                raise ValueError("Reversing a paid settlement requires an explicit audit reason.")
            locked_settlement.failure_reason = f"REVERSED: {reason}"
            # Compensating adjustment
            SettlementAdjustment.objects.create(
                settlement=locked_settlement,
                restaurant=locked_settlement.restaurant,
                adjustment_type='MANUAL_CORRECTION',
                amount=-locked_settlement.net_payout_amount,
                reason=f"Compensating debit for reversed settlement #{locked_settlement.settlement_reference}: {reason}",
                authorized_by=actor
            )

        locked_settlement.status = target_status
        locked_settlement.save()

        # Audit
        AuditLog.objects.create(
            actor=actor,
            action=f"SETTLEMENT_STATUS_{target_status}",
            target_model='RestaurantSettlement',
            target_id=str(locked_settlement.id),
            ip_address='127.0.0.1',
            details={
                'settlement_reference': locked_settlement.settlement_reference,
                'from_status': current,
                'to_status': target_status,
                'reason': reason,
                'provider_utr': provider_utr
            }
        )

        return locked_settlement


def add_settlement_adjustment(
    settlement: RestaurantSettlement,
    adjustment_type: str,
    amount: Decimal,
    reason: str,
    authorized_by=None
) -> SettlementAdjustment:
    """
    Applies an audited adjustment (credit or debit) to a settlement.
    Recalculates settlement net payout atomically.
    """
    if not reason.strip():
        raise ValueError("Adjustment reason is strictly mandatory for financial audit compliance.")

    with transaction.atomic():
        locked = RestaurantSettlement.objects.select_for_update().get(id=settlement.id)
        if locked.status == 'PAID':
            raise ValueError("Cannot adjust an already settled and paid batch. Create a compensating adjustment on an open settlement.")

        adj_amount = quantize_money(amount)
        adj = SettlementAdjustment.objects.create(
            settlement=locked,
            restaurant=locked.restaurant,
            adjustment_type=adjustment_type,
            amount=adj_amount,
            reason=reason,
            authorized_by=authorized_by
        )

        locked.total_adjustments = quantize_money(locked.total_adjustments + adj_amount)
        locked.net_payout_amount = quantize_money(locked.net_payout_amount + adj_amount)
        locked.save(update_fields=['total_adjustments', 'net_payout_amount', 'updated_at'])

        AuditLog.objects.create(
            actor=authorized_by,
            action='SETTLEMENT_ADJUSTMENT_ADDED',
            target_model='SettlementAdjustment',
            target_id=str(adj.id),
            ip_address='127.0.0.1',
            details={
                'settlement_reference': locked.settlement_reference,
                'adjustment_id': adj.id,
                'amount': str(adj_amount),
                'reason': reason
            }
        )

        return adj


def run_payment_reconciliation(start_date=None, end_date=None) -> dict:
    """
    Reconciles internal Order, Payment, Commission, and Settlement records against payment gateway records.
    Identifies:
      1. Missing gateway records for paid orders
      2. Payment vs Order amount mismatches
      3. Delivered paid orders missing commission entries
      4. Settlement batch sum discrepancies
      5. Unsettled completed orders
    """
    mismatches = []
    
    # 1. Payment vs Order Mismatches
    payments = Payment.objects.filter(status='PAID').select_related('order')
    if start_date:
        payments = payments.filter(created_at__date__gte=start_date)
    if end_date:
        payments = payments.filter(created_at__date__lte=end_date)

    verified_captured_total = Decimal('0.00')

    for p in payments:
        verified_captured_total += quantize_money(p.amount)
        order = p.order
        if not order:
            mismatches.append({
                'category': 'ORPHAN_PAYMENT',
                'severity': 'HIGH',
                'affected_reference': f"Payment #{p.id} ({p.provider_payment_id})",
                'difference_amount': str(p.amount),
                'description': 'Payment record has no linked order.',
                'recommended_action': 'Investigate orphan payment; refund or associate with customer order.'
            })
            continue

        order_total = quantize_money(order.grand_total or order.total)
        payment_amount = quantize_money(p.amount)

        if abs(order_total - payment_amount) > Decimal('0.05'):
            mismatches.append({
                'category': 'AMOUNT_MISMATCH',
                'severity': 'HIGH',
                'affected_reference': f"Order #{order.order_number}",
                'difference_amount': str(abs(order_total - payment_amount)),
                'description': f"Order total (₹{order_total}) does not match captured payment amount (₹{payment_amount}).",
                'recommended_action': 'Verify payment gateway charge ID and inspect applied discount or delivery fee snapshot.'
            })

    # 2. Orders marked PAID without verified Payment
    paid_orders = Order.objects.filter(payment_status='PAID').prefetch_related('payments')
    if start_date:
        paid_orders = paid_orders.filter(created_at__date__gte=start_date)
    if end_date:
        paid_orders = paid_orders.filter(created_at__date__lte=end_date)

    for o in paid_orders:
        has_paid_payment = o.payments.filter(status='PAID').exists()
        if not has_paid_payment:
            mismatches.append({
                'category': 'MISSING_GATEWAY_RECORD',
                'severity': 'MEDIUM',
                'affected_reference': f"Order #{o.order_number}",
                'difference_amount': str(o.grand_total or o.total),
                'description': 'Order status is marked PAID but has no verified PAID Payment record in gateway vault.',
                'recommended_action': 'Check webhook arrival logs and query Razorpay provider API for transaction status.'
            })

    # 3. Delivered Orders without Commission Entries
    delivered_orders = Order.objects.filter(
        status='DELIVERED',
        payment_status__in=['PAID', 'VERIFIED_PAID', 'COMPLETED']
    ).select_related('restaurant')
    if start_date:
        delivered_orders = delivered_orders.filter(created_at__date__gte=start_date)
    if end_date:
        delivered_orders = delivered_orders.filter(created_at__date__lte=end_date)

    for do in delivered_orders:
        if not hasattr(do, 'commission_entry'):
            # Auto-reconcile by recording commission
            record_or_update_order_commission(do)

    # 4. Settlement Batch Integrity Check
    settlements = RestaurantSettlement.objects.all().prefetch_related('commission_entries', 'adjustments')
    if start_date:
        settlements = settlements.filter(created_at__date__gte=start_date)
    if end_date:
        settlements = settlements.filter(created_at__date__lte=end_date)

    for s in settlements:
        entries = s.commission_entries.all()
        actual_gross = quantize_money(entries.aggregate(val=Sum('calculation_base'))['val'] or Decimal('0.00'))
        actual_comm = quantize_money(entries.aggregate(val=Sum('commission_amount'))['val'] or Decimal('0.00'))
        actual_net = quantize_money(entries.aggregate(val=Sum('net_restaurant_amount'))['val'] or Decimal('0.00'))
        adj_sum = quantize_money(s.adjustments.aggregate(val=Sum('amount'))['val'] or Decimal('0.00'))

        expected_payout = quantize_money(actual_net + adj_sum)

        if abs(quantize_money(s.net_payout_amount) - expected_payout) > Decimal('0.05'):
            mismatches.append({
                'category': 'SETTLEMENT_SUM_MISMATCH',
                'severity': 'CRITICAL',
                'affected_reference': f"Settlement #{s.settlement_reference}",
                'difference_amount': str(abs(s.net_payout_amount - expected_payout)),
                'description': f"Batch recorded payout (₹{s.net_payout_amount}) does not match sum of underlying entries (₹{expected_payout}).",
                'recommended_action': 'Place settlement batch on hold, review attached entries, and create compensating adjustment.'
            })

    # Summary Statistics
    unsettled_count = RestaurantCommission.objects.filter(status='ACCRUED', settlement__isnull=True).count()
    unsettled_amount = quantize_money(RestaurantCommission.objects.filter(status='ACCRUED', settlement__isnull=True).aggregate(val=Sum('net_restaurant_amount'))['val'] or Decimal('0.00'))

    total_commission_earned = quantize_money(RestaurantCommission.objects.aggregate(val=Sum('commission_amount'))['val'] or Decimal('0.00'))
    total_settled_payout = quantize_money(RestaurantSettlement.objects.filter(status='PAID').aggregate(val=Sum('net_payout_amount'))['val'] or Decimal('0.00'))

    return {
        'reconciliation_timestamp': timezone.now().isoformat(),
        'period': {
            'start_date': str(start_date or 'ALL'),
            'end_date': str(end_date or 'ALL')
        },
        'summary': {
            'verified_captured_payments_total': str(quantize_money(verified_captured_total)),
            'total_platform_commission_accrued': str(total_commission_earned),
            'total_settled_payout_paid': str(total_settled_payout),
            'unsettled_accrued_orders_count': unsettled_count,
            'unsettled_accrued_amount': str(unsettled_amount),
            'total_discrepancies_found': len(mismatches),
            'critical_discrepancies': sum(1 for m in mismatches if m['severity'] in ['CRITICAL', 'HIGH'])
        },
        'discrepancies': mismatches
    }


def export_settlement_statement_csv(restaurant: Restaurant, date_from=None, date_to=None) -> HttpResponse:
    """Exports an authenticated restaurant's verified settlement statement as CSV."""
    response = HttpResponse(content_type='text/csv')
    date_tag = timezone.now().strftime('%Y%m%d')
    response['Content-Disposition'] = f'attachment; filename="settlement_statement_{restaurant.id}_{date_tag}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Settlement Reference', 'Period Start', 'Period End', 'Order Count',
        'Gross Sales (INR)', 'Packaging Fees (INR)', 'Commission Deducted (INR)',
        'Adjustments (INR)', 'Net Payout (INR)', 'Status', 'UTR / Bank Ref', 'Created At'
    ])

    settlements = RestaurantSettlement.objects.filter(restaurant=restaurant).order_by('-created_at')
    if date_from:
        settlements = settlements.filter(period_start__gte=date_from)
    if date_to:
        settlements = settlements.filter(period_end__lte=date_to)

    for s in settlements:
        writer.writerow([
            s.settlement_reference,
            s.period_start,
            s.period_end,
            s.order_count,
            str(s.gross_sales_amount),
            str(s.total_packaging_fees),
            str(s.total_commission_deducted),
            str(s.total_adjustments),
            str(s.net_payout_amount),
            s.status,
            s.provider_utr or s.provider_reference or 'N/A',
            s.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])

    return response


def export_reconciliation_csv(recon_data: dict) -> HttpResponse:
    """Exports the admin reconciliation discrepancies report as CSV."""
    response = HttpResponse(content_type='text/csv')
    date_tag = timezone.now().strftime('%Y%m%d')
    response['Content-Disposition'] = f'attachment; filename="payment_reconciliation_audit_{date_tag}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Category', 'Severity', 'Affected Reference', 'Difference Amount (INR)',
        'Description', 'Recommended Review Action'
    ])

    for item in recon_data.get('discrepancies', []):
        writer.writerow([
            item['category'],
            item['severity'],
            item['affected_reference'],
            item['difference_amount'],
            item['description'],
            item['recommended_action']
        ])

    return response
