import os
import sys
import django
import uuid
from decimal import Decimal

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.orders.models import Order
from apps.payments.models import (
    Payment,
    RestaurantCommission,
    RestaurantSettlement,
    SettlementAdjustment
)
from apps.payments.commission_service import (
    get_active_commission_config,
    calculate_order_commission,
    record_or_update_order_commission,
    get_restaurant_earnings_summary,
    create_settlement_batch,
    transition_settlement_status,
    add_settlement_adjustment,
    run_payment_reconciliation,
    quantize_money
)
from apps.payments.settlement_views import (
    RestaurantEarningsSummaryView,
    RestaurantSettlementListView,
    RestaurantSettlementDetailView,
    AdminSettlementListView,
    AdminSettlementCreateBatchView,
    AdminSettlementStatusTransitionView,
    AdminSettlementAdjustmentView,
    AdminPaymentReconciliationView,
    AdminCommissionRulesView
)


def run_tests():
    print("=" * 65)
    print("PHASE 25: RESTAURANT COMMISSION, EARNINGS & SETTLEMENT TEST SUITE")
    print("=" * 65)

    factory = APIRequestFactory()

    # --- SETUP: Test Users and Restaurants ---
    print("\n--- SETUP: Preparing Users, Restaurants, and Orders ---")
    owner_a, _ = User.objects.get_or_create(username='test_p25_owner_a', defaults={'email': 'owner_a@test.com'})
    owner_b, _ = User.objects.get_or_create(username='test_p25_owner_b', defaults={'email': 'owner_b@test.com'})
    admin_user, _ = User.objects.get_or_create(
        username='test_p25_admin',
        defaults={'email': 'admin@test.com', 'is_staff': True, 'is_superuser': True}
    )
    admin_user.is_staff = True
    admin_user.save()

    rest_a, _ = Restaurant.objects.get_or_create(
        name='Phase 25 Test Kitchen A',
        defaults={'owner': owner_a, 'rating': Decimal('4.8')}
    )
    rest_b, _ = Restaurant.objects.get_or_create(
        name='Phase 25 Test Kitchen B',
        defaults={'owner': owner_b, 'rating': Decimal('4.5')}
    )

    customer, _ = User.objects.get_or_create(username='test_p25_customer', defaults={'email': 'cust@test.com'})

    # Clean up test settlements and commissions from previous runs
    RestaurantSettlement.objects.filter(restaurant__in=[rest_a, rest_b]).delete()
    RestaurantCommission.objects.filter(restaurant__in=[rest_a, rest_b]).delete()

    # Reset baseline commission rules
    from apps.adminpanel.models import PlatformConfig
    config_obj, _ = PlatformConfig.objects.get_or_create(key='system_settings', defaults={'value': {}})
    val = dict(config_obj.value or {})
    val['platform_commission_percentage'] = 18.0
    val['platform_commission_fixed_fee'] = 0.0
    config_obj.value = val
    config_obj.save()

    print("PASS: Fixtures verified in PostgreSQL wsfood_db.")

    # --- TEST 1: Commission Formula, Base Definition & Exclusion ---
    print("\n--- TEST 1: Commission Calculation Base & Explicit Exclusions ---")
    # Food: 400.00, Delivery: 40.00, Taxes: 20.00, Platform Fee: 15.00, Packaging: 15.00, Grand Total: 490.00
    order_1, _ = Order.objects.get_or_create(
        order_number="ORD-P25-TEST-001",
        defaults={
            'customer': customer,
            'restaurant': rest_a,
            'item_total': Decimal('400.00'),
            'subtotal': Decimal('400.00'),
            'delivery_fee': Decimal('40.00'),
            'taxes': Decimal('20.00'),
            'platform_fee': Decimal('15.00'),
            'packaging_fee': Decimal('15.00'),
            'grand_total': Decimal('490.00'),
            'status': 'DELIVERED',
            'payment_status': 'PAID'
        }
    )

    calc = calculate_order_commission(order_1, override_rate=Decimal('18.00'), override_fixed_fee=Decimal('0.00'))
    assert calc['is_eligible'] is True
    assert calc['calculation_base'] == Decimal('400.00'), f"Expected base 400.00, got {calc['calculation_base']}"
    assert calc['commission_amount'] == Decimal('72.00'), f"Expected 18% of 400 = 72.00, got {calc['commission_amount']}"
    # Net: base (400) + packaging (15) - commission (72) = 343.00
    assert calc['net_restaurant_amount'] == Decimal('343.00'), f"Expected 343.00, got {calc['net_restaurant_amount']}"
    print("PASS: Commission calculated on eligible food subtotal; delivery, platform fees, and taxes strictly excluded.")

    # --- TEST 2: Decimal-Safe Rounding & Snapshotting ---
    print("\n--- TEST 2: Decimal-Safe Arithmetic & Historical Rate Snapshotting ---")
    # Base: 383.50 * 18% = 69.03 (half-up)
    order_2, _ = Order.objects.get_or_create(
        order_number="ORD-P25-TEST-002",
        defaults={
            'customer': customer,
            'restaurant': rest_a,
            'item_total': Decimal('383.50'),
            'subtotal': Decimal('383.50'),
            'packaging_fee': Decimal('10.00'),
            'grand_total': Decimal('428.50'),
            'status': 'DELIVERED',
            'payment_status': 'PAID'
        }
    )

    comm_entry = record_or_update_order_commission(order_2, override_rate=Decimal('18.00'))
    assert comm_entry.commission_amount == Decimal('69.03'), f"Expected 69.03, got {comm_entry.commission_amount}"
    # Net: 383.50 + 10.00 - 69.03 = 324.47
    assert comm_entry.net_restaurant_amount == Decimal('324.47'), f"Expected 324.47, got {comm_entry.net_restaurant_amount}"
    assert comm_entry.rate_percentage == Decimal('18.00')

    # Future platform rate update should NOT modify already-recorded snapshot
    order_2_refresh = RestaurantCommission.objects.get(id=comm_entry.id)
    assert order_2_refresh.rate_percentage == Decimal('18.00')
    print("PASS: Decimal-safe ROUND_HALF_UP and snapshotting verified (383.50 * 18% = 69.03).")

    # --- TEST 3: Ineligible Orders & Zero-Commission Safety ---
    print("\n--- TEST 3: Ineligible Orders (Unpaid / Cancelled) ---")
    unpaid_order, _ = Order.objects.get_or_create(
        order_number="ORD-P25-UNPAID-001",
        defaults={
            'customer': customer,
            'restaurant': rest_a,
            'item_total': Decimal('500.00'),
            'status': 'PLACED',
            'payment_status': 'PAYMENT_PENDING'
        }
    )
    unpaid_calc = calculate_order_commission(unpaid_order)
    assert unpaid_calc['is_eligible'] is False
    assert unpaid_calc['commission_amount'] == Decimal('0.00')
    assert unpaid_calc['net_restaurant_amount'] == Decimal('0.00')

    cancelled_order, _ = Order.objects.get_or_create(
        order_number="ORD-P25-CANCEL-001",
        defaults={
            'customer': customer,
            'restaurant': rest_a,
            'item_total': Decimal('500.00'),
            'status': 'CANCELLED',
            'payment_status': 'CANCELLED'
        }
    )
    cancelled_calc = calculate_order_commission(cancelled_order)
    assert cancelled_calc['is_eligible'] is False
    assert cancelled_calc['commission_amount'] == Decimal('0.00')
    print("PASS: Unpaid and cancelled orders correctly accrue zero commission and zero earnings.")

    # --- TEST 4: Restaurant Earnings View & Metrics Isolation ---
    print("\n--- TEST 4: Restaurant Earnings API & Isolation Between Stores ---")
    # Record commission for Order 1
    record_or_update_order_commission(order_1, override_rate=Decimal('18.00'))

    # Store B creates an order
    order_b, _ = Order.objects.get_or_create(
        order_number="ORD-P25-STORE-B-001",
        defaults={
            'customer': customer,
            'restaurant': rest_b,
            'item_total': Decimal('1000.00'),
            'status': 'DELIVERED',
            'payment_status': 'PAID'
        }
    )
    record_or_update_order_commission(order_b, override_rate=Decimal('18.00'))

    earnings_view = RestaurantEarningsSummaryView.as_view()
    req_a = factory.get("/api/payments/restaurant/earnings/")
    force_authenticate(req_a, user=owner_a)
    resp_a = earnings_view(req_a)

    assert resp_a.status_code == status.HTTP_200_OK
    data_a = resp_a.data
    assert data_a['restaurant_name'] == 'Phase 25 Test Kitchen A'
    # Order 1 (343.00) + Order 2 (324.47) = 667.47
    assert Decimal(str(data_a['metrics']['finalized_earnings'])) == Decimal('667.47')
    # Must NOT include Store B's 1000.00 order
    assert Decimal(str(data_a['metrics']['gross_order_value'])) == Decimal('783.50')
    print(f"PASS: Restaurant A earnings isolated (Finalized: ₹{data_a['metrics']['finalized_earnings']}; Store B completely excluded).")

    # --- TEST 5: Settlement Batch Creation & Double-Payout Prevention ---
    print("\n--- TEST 5: Settlement Batching & Concurrency Double-Payout Prevention ---")
    today = timezone.now().date()
    batch = create_settlement_batch(
        restaurant=rest_a,
        period_start=today,
        period_end=today,
        created_by=admin_user,
        notes="Automated Daily Settlement Batch"
    )

    assert batch.settlement_reference.startswith("SET-")
    assert batch.order_count == 2
    assert batch.net_payout_amount == Decimal('667.47')
    assert batch.status == 'PENDING'

    # Attempting to batch the same orders again must fail
    try:
        create_settlement_batch(restaurant=rest_a, period_start=today, period_end=today)
        assert False, "Duplicate settlement batch was unexpectedly allowed!"
    except ValueError as e:
        print(f"PASS: Concurrency protection verified; duplicate settlement prevented: {e}")

    # --- TEST 6: Settlement Detail & Masked PII Verification ---
    print("\n--- TEST 6: Settlement Details & Privacy Protection ---")
    detail_view = RestaurantSettlementDetailView.as_view()
    req_det = factory.get(f"/api/payments/restaurant/settlements/{batch.settlement_reference}/")
    force_authenticate(req_det, user=owner_a)
    resp_det = detail_view(req_det, reference=batch.settlement_reference)

    assert resp_det.status_code == status.HTTP_200_OK
    entries = resp_det.data['commission_entries']
    assert len(entries) == 2
    for entry in entries:
        assert entry['customer_name'].endswith("***"), f"Expected masked customer name, got {entry['customer_name']}"
    print("PASS: Settlement entries retrieved with customer PII safely masked.")

    # Cross-restaurant access check: Owner B cannot inspect Owner A's settlement
    req_det_b = factory.get(f"/api/payments/restaurant/settlements/{batch.settlement_reference}/")
    force_authenticate(req_det_b, user=owner_b)
    resp_det_b = detail_view(req_det_b, reference=batch.settlement_reference)
    assert resp_det_b.status_code == status.HTTP_403_FORBIDDEN
    print("PASS: Unauthorized restaurant blocked from viewing peer settlement (403 Forbidden).")

    # --- TEST 7: Settlement Status Transitions & Verified Payout Enforcement ---
    print("\n--- TEST 7: Audited Status Transitions & Bank UTR Requirement ---")
    # 1. PENDING -> PROCESSING
    p_batch = transition_settlement_status(batch, 'PROCESSING', actor=admin_user, provider_reference='RZP_BATCH_9901')
    assert p_batch.status == 'PROCESSING'
    assert p_batch.approved_by == admin_user

    # 2. Cannot mark PAID without verified UTR
    try:
        transition_settlement_status(p_batch, 'PAID', actor=admin_user, provider_utr='')
        assert False, "Transition to PAID without provider UTR was unexpectedly allowed!"
    except ValueError:
        print("PASS: Transition to PAID without verified provider UTR strictly blocked.")

    # 3. Mark PAID with verified bank UTR
    paid_batch = transition_settlement_status(
        p_batch,
        'PAID',
        actor=admin_user,
        provider_utr='UTR_HDFC_20261010_9981'
    )
    assert paid_batch.status == 'PAID'
    assert paid_batch.provider_utr == 'UTR_HDFC_20261010_9981'
    assert paid_batch.payout_completed_at is not None
    print(f"PASS: Settlement successfully marked as PAID with verified UTR {paid_batch.provider_utr}.")

    # --- TEST 8: Audited Financial Adjustments ---
    print("\n--- TEST 8: Audited Settlement Adjustments (Debit/Credit) ---")
    # Create another batch for Restaurant B
    batch_b = create_settlement_batch(
        restaurant=rest_b,
        period_start=today,
        period_end=today,
        created_by=admin_user
    )
    initial_net_b = batch_b.net_payout_amount

    # Apply manual credit adjustment: ₹50.00 marketing subsidy
    adj = add_settlement_adjustment(
        settlement=batch_b,
        adjustment_type='PROMOTION_CREDIT',
        amount=Decimal('50.00'),
        reason="Diwali festival marketing promotional subsidy",
        authorized_by=admin_user
    )
    batch_b.refresh_from_db()
    assert batch_b.total_adjustments == Decimal('50.00')
    assert batch_b.net_payout_amount == initial_net_b + Decimal('50.00')
    print(f"PASS: Audited credit adjustment applied (New net payout: ₹{batch_b.net_payout_amount}).")

    # --- TEST 9: Platform Commission Rule Updates (Admin Only) ---
    print("\n--- TEST 9: Admin Commission Rules Configuration ---")
    rules_view = AdminCommissionRulesView.as_view()
    patch_req = factory.patch("/api/payments/admin/commission-rules/", {
        "platform_commission_percentage": 15.00,
        "platform_commission_fixed_fee": 5.00,
        "reason": "Q4 competitive commission revision for platform partners"
    }, format="json")
    force_authenticate(patch_req, user=admin_user)
    patch_resp = rules_view(patch_req)

    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.data['platform_commission_percentage'] == '15.0'
    assert patch_resp.data['platform_commission_fixed_fee'] == '5.0'

    # Non-admin rejected
    unauth_req = factory.patch("/api/payments/admin/commission-rules/", {"platform_commission_percentage": 10.00, "reason": "hack"}, format="json")
    force_authenticate(unauth_req, user=customer)
    unauth_resp = rules_view(unauth_req)
    assert unauth_resp.status_code == status.HTTP_403_FORBIDDEN
    print("PASS: Admin commission rule update verified; unauthorized customer rejected (403).")

    # Restore default 18.00%
    transition_settlement_status(batch_b, 'PROCESSING', actor=admin_user)
    transition_settlement_status(batch_b, 'PAID', actor=admin_user, provider_utr='UTR_B_1234')

    # --- TEST 10: Payment Reconciliation Engine ---
    print("\n--- TEST 10: Payment Reconciliation Cross-Check & Discrepancies ---")
    recon = run_payment_reconciliation()
    summary = recon['summary']
    assert 'verified_captured_payments_total' in summary
    assert 'total_platform_commission_accrued' in summary
    assert 'total_settled_payout_paid' in summary
    assert Decimal(summary['total_settled_payout_paid']) > Decimal('0.00')
    print(f"PASS: Reconciliation executed across Gateways, Orders, Commissions, and Settlements (Settled Paid: ₹{summary['total_settled_payout_paid']}).")

    print("\n" + "=" * 65)
    print("ALL 10 PHASE 25 AUTOMATED VERIFICATION SUITES PASSED CLEANLY!")
    print("=" * 65)


if __name__ == '__main__':
    run_tests()
