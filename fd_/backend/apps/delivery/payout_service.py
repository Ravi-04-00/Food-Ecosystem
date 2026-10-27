"""
Phase 3A: Rider payout ledger services (INTERNAL LEDGER only).

Mirrors apps.payments.commission_service patterns:
- One RiderEarning per delivered order (OneToOne + get_or_create).
- Batch only ACCRUED + unsettled + DELIVERED entries under select_for_update.
- Server-validated state transitions; PAID requires verified provider UTR.
- All amounts from Order.delivery_fee (approved formula); tip/bonus/penalty = 0.
No real money movement happens here.
"""
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.delivery.models import RiderEarning, RiderPayout, RiderPayoutAdjustment


def quantize_money(amount):
    try:
        return Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except Exception:
        return Decimal('0.00')


def rider_ledger_summary(user):
    """Authoritative ledger totals for the earnings/ response (additive)."""
    from django.db.models import Sum, Count
    earnings = RiderEarning.objects.filter(rider=user)
    payouts = RiderPayout.objects.filter(rider=user)
    return {
        'accrued_total': str(earnings.filter(status='ACCRUED').aggregate(s=Sum('net_amount'))['s'] or 0),
        'settled_total': str(earnings.filter(status='SETTLED').aggregate(s=Sum('net_amount'))['s'] or 0),
        'earning_count': earnings.count(),
        'payout_count': payouts.count(),
        'currency': 'INR',
        'provider': 'INTERNAL_LEDGER',
    }


def _audit(actor, action, target_id, details):
    try:
        from apps.adminpanel.permissions import create_admin_audit_log
        create_admin_audit_log(
            actor=actor, action=action, target_model='RiderPayout',
            target_id=target_id, details=details,
            reason='Rider payout ledger operation.',
        )
    except Exception:
        pass


def accrue_rider_earning(order, rider=None):
    """
    Creates one RiderEarning for a delivered order. Idempotent:
    repeated calls return the existing row (OneToOne + get_or_create).
    Returns the earning, or None if the order is ineligible.
    """
    rider = rider or getattr(order, 'rider', None)
    if not order or getattr(order, 'status', None) != 'DELIVERED':
        return None
    if not rider or not getattr(rider, 'id', None):
        return None
    fee = quantize_money(getattr(order, 'delivery_fee', 0) or 0)
    with transaction.atomic():
        try:
            earning, _ = RiderEarning.objects.get_or_create(
                order=order,
                defaults={
                    'rider': rider,
                    'order_number': getattr(order, 'order_number', str(order.id)),
                    'delivery_fee_snapshot': fee,
                    'tip_amount': Decimal('0.00'),
                    'bonus_amount': Decimal('0.00'),
                    'penalty_deduction': Decimal('0.00'),
                    'net_amount': fee,
                    'status': 'ACCRUED',
                },
            )
        except IntegrityError:
            # Lost a concurrent race: the winner's row is the single earning.
            earning = RiderEarning.objects.get(order=order)
        return earning


def create_rider_payout_batch(rider, period_start, period_end, created_by=None, notes=''):
    """Batches all eligible ACCRUED entries into a PENDING payout (admin only at view layer)."""
    from django.db.models import Sum
    with transaction.atomic():
        eligible = RiderEarning.objects.select_for_update().filter(
            rider=rider, status='ACCRUED', payout__isnull=True,
            order__status='DELIVERED',
        )
        count = eligible.count()
        if count == 0:
            raise ValueError('No eligible accrued rider earnings to batch.')
        totals = eligible.aggregate(
            gross=Sum('delivery_fee_snapshot'), tips=Sum('tip_amount'),
            bonus=Sum('bonus_amount'), penalty=Sum('penalty_deduction'),
            net=Sum('net_amount'),
        )
        ref = 'RP-%s-%s' % (timezone.now().strftime('%Y%m%d'), uuid4().hex[:6].upper())
        payout = RiderPayout.objects.create(
            payout_reference=ref, rider=rider,
            period_start=period_start, period_end=period_end,
            trip_count=count,
            gross_delivery_fees=quantize_money(totals['gross'] or 0),
            total_tips=quantize_money(totals['tips'] or 0),
            total_bonuses=quantize_money(totals['bonus'] or 0),
            total_penalties=quantize_money(totals['penalty'] or 0),
            total_adjustments=Decimal('0.00'),
            net_payout_amount=quantize_money(totals['net'] or 0),
            status='PENDING', payout_provider='INTERNAL_LEDGER',
            created_by=created_by, notes=notes or '',
        )
        eligible.update(payout=payout, status='SETTLED', updated_at=timezone.now())
        _audit(created_by, 'RIDER_PAYOUT_BATCH_CREATED', payout.id, {
            'reference': ref, 'rider_id': rider.id, 'trip_count': count,
            'net': str(payout.net_payout_amount),
            'period': [str(period_start), str(period_end)],
        })
        return payout


VALID_PAYOUT_TRANSITIONS = {
    'PENDING': ['PROCESSING', 'FAILED'],
    'PROCESSING': ['PAID', 'FAILED', 'PENDING'],
    'FAILED': ['PENDING', 'PROCESSING'],
    'PAID': ['REVERSED'],
}


def transition_rider_payout(payout, target_status, actor=None, reason='', provider_reference='', provider_utr=''):
    """Server-validated payout state transition with locking and audit."""
    target_status = (target_status or '').upper()
    with transaction.atomic():
        payout = RiderPayout.objects.select_for_update().get(id=payout.id)
        current = payout.status
        allowed = VALID_PAYOUT_TRANSITIONS.get(current, [])
        if target_status not in allowed:
            raise ValueError(
                'Cannot transition rider payout %s -> %s. Allowed: %s.'
                % (current, target_status, allowed)
            )
        if target_status == 'PAID':
            utr = (provider_utr or '').strip() or (provider_reference or '').strip()
            if not utr:
                raise ValueError('Marking a rider payout PAID requires a verified provider UTR/reference.')
            payout.provider_utr = utr
            if (provider_reference or '').strip():
                payout.provider_reference = provider_reference.strip()
            payout.verified_by = actor
            payout.payout_completed_at = timezone.now()
        elif target_status == 'PROCESSING':
            payout.approved_by = actor
            payout.payout_initiated_at = timezone.now()
            if (provider_reference or '').strip():
                payout.provider_reference = provider_reference.strip()
        elif target_status == 'FAILED':
            payout.failure_reason = reason or 'Payout attempt failed.'
        elif target_status == 'REVERSED':
            if not (reason or '').strip():
                raise ValueError('Reversing a rider payout requires a reason.')
            payout.failure_reason = 'REVERSED: %s' % reason.strip()
            RiderPayoutAdjustment.objects.create(
                payout=payout, rider=payout.rider,
                adjustment_type='MANUAL_CORRECTION',
                amount=-(payout.net_payout_amount or Decimal('0.00')),
                reason='Reversal of %s: %s' % (payout.payout_reference, reason.strip()),
                authorized_by=actor,
            )
        payout.status = target_status
        payout.save()
        _audit(actor, 'RIDER_PAYOUT_STATUS_%s' % target_status, payout.id, {
            'reference': payout.payout_reference, 'from': current, 'to': target_status,
            'reason': reason, 'provider_utr': payout.provider_utr,
        })
        return payout


def add_rider_payout_adjustment(payout, adjustment_type, amount, reason, actor=None):
    """Manual ledger correction. Blocked once PAID; reason mandatory."""
    if not (reason or '').strip():
        raise ValueError('Payout adjustment requires a reason.')
    with transaction.atomic():
        payout = RiderPayout.objects.select_for_update().get(id=payout.id)
        if payout.status == 'PAID':
            raise ValueError('Cannot adjust a PAID payout; reverse it with a reason instead.')
        adj = RiderPayoutAdjustment.objects.create(
            payout=payout, rider=payout.rider,
            adjustment_type=adjustment_type, amount=quantize_money(amount),
            reason=reason.strip(), authorized_by=actor,
        )
        payout.total_adjustments = quantize_money(
            (payout.total_adjustments or Decimal('0.00')) + adj.amount)
        payout.net_payout_amount = quantize_money(
            (payout.net_payout_amount or Decimal('0.00')) + adj.amount)
        payout.save(update_fields=['total_adjustments', 'net_payout_amount', 'updated_at'])
        _audit(actor, 'RIDER_PAYOUT_ADJUSTMENT_ADDED', payout.id, {
            'reference': payout.payout_reference, 'type': adjustment_type,
            'amount': str(adj.amount), 'reason': reason.strip(),
        })
        return adj
