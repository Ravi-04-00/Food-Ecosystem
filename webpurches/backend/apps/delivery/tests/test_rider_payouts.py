"""
Phase 3A: Rider payout ledger tests (INTERNAL LEDGER only).

Covers: accrual formula, eligibility, idempotent/repeated completion,
concurrent accrual, shift-checkout replay, rider isolation, admin-only
batching, totals, double-batch block, transition validation, UTR gate,
reversal audit. No real money movement.
"""
import threading
from datetime import time
from decimal import Decimal

from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.delivery.models import RiderEarning, RiderPayout
from apps.delivery.payout_service import accrue_rider_earning
from apps.orders.models import Order
from apps.shifts.models import ShiftSlot, Shift, ShiftBooking, CheckIn
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_order,
)


def _make_rider(username='rider_payout_1', email='rider_payout_1@testfd.io'):
    return create_test_user(role='DELIVERY_PARTNER', username=username, email=email)


def _make_admin(username='admin_payout_1', email='admin_payout_1@testfd.io'):
    return create_test_user(role='ADMIN', username=username, email=email)


class RiderPayoutLedgerTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(role='CUSTOMER', username='cust_payout_1', email='cust_payout_1@testfd.io')
        self.owner = create_test_user(role='SHOP', username='owner_payout_1', email='owner_payout_1@testfd.io')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Payout Kitchen')
        self.rider = _make_rider()
        self.rider2 = _make_rider(username='rider_payout_2', email='rider_payout_2@testfd.io')
        self.admin = _make_admin()

    def _delivered_order(self, rider=None, fee=Decimal('35.00')):
        order = create_test_order(customer=self.customer, restaurant=self.restaurant, status='PLACED')
        order.delivery_fee = fee
        order.rider = rider or self.rider
        order.status = 'DELIVERED'
        order.save()
        return order

    # 1. Correct accrual using verified formula ---------------------------
    def test_delivered_order_accrues_one_earning_equal_to_delivery_fee(self):
        order = self._delivered_order(fee=Decimal('42.50'))
        earning = RiderEarning.objects.filter(order=order).first()
        self.assertIsNotNone(earning)
        self.assertEqual(earning.rider, self.rider)
        self.assertEqual(earning.delivery_fee_snapshot, Decimal('42.50'))
        self.assertEqual(earning.net_amount, Decimal('42.50'))
        self.assertEqual(earning.tip_amount, Decimal('0.00'))
        self.assertEqual(earning.status, 'ACCRUED')

    # 2. Ineligible orders --------------------------------------------------
    def test_non_delivered_order_accrues_nothing(self):
        order = create_test_order(customer=self.customer, restaurant=self.restaurant, status='PREPARING')
        order.rider = self.rider
        order.save()
        self.assertIsNone(accrue_rider_earning(order))
        self.assertEqual(RiderEarning.objects.filter(order=order).count(), 0)

    def test_delivered_order_without_rider_accrues_nothing(self):
        order = create_test_order(customer=self.customer, restaurant=self.restaurant, status='PLACED')
        order.status = 'DELIVERED'
        order.save()
        self.assertEqual(RiderEarning.objects.filter(order=order).count(), 0)

    # 3/4. Repeated completion safe ----------------------------------------
    def test_repeated_completion_keeps_single_earning(self):
        order = self._delivered_order()
        first = RiderEarning.objects.get(order=order)
        order.save()  # second DELIVERED save (signal re-fires)
        second = accrue_rider_earning(order)
        self.assertEqual(first.id, second.id)
        self.assertEqual(RiderEarning.objects.filter(order=order).count(), 1)

    # 7. Rider isolation ----------------------------------------------------
    def test_rider_cannot_read_another_riders_payout(self):
        order = self._delivered_order()
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
            'period_start': str(timezone.localdate()),
            'period_end': str(timezone.localdate()),
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        ref = res.data['payout']['payout_reference']

        self.client.force_authenticate(user=self.rider2)
        res = self.client.get(f'/api/delivery/payouts/{ref}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        res = self.client.get('/api/delivery/payouts/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['payouts'], [])

    # 8. Non-admin blocked ---------------------------------------------------
    def test_non_admin_cannot_create_batch_or_transition(self):
        self._delivered_order()
        self.client.force_authenticate(user=self.rider)
        res = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        batch = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
        }).data['payout']
        self.client.force_authenticate(user=self.rider)
        res = self.client.post(
            f"/api/delivery/admin/payouts/{batch['payout_reference']}/status/",
            {'status': 'PROCESSING'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # 9/10/11. Batch totals, double-batch block, transitions, UTR gate -------
    def test_batch_totals_match_and_double_batch_blocked(self):
        self._delivered_order(fee=Decimal('30.00'))
        self._delivered_order(fee=Decimal('45.00'))
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
            'period_start': str(timezone.localdate()),
            'period_end': str(timezone.localdate()),
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        payout = res.data['payout']
        self.assertEqual(payout['trip_count'], 2)
        self.assertEqual(Decimal(payout['net_payout_amount']), Decimal('75.00'))

        res2 = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_rejected_and_utr_gate_enforced(self):
        self._delivered_order()
        self.client.force_authenticate(user=self.admin)
        ref = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
        }).data['payout']['payout_reference']

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {'status': 'PAID'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {'status': 'REVERSED'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {'status': 'PROCESSING'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {'status': 'PAID'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {
            'status': 'PAID', 'provider_utr': 'UTR-TEST-0001'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['payout']['status'], 'PAID')

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/adjustments/', {
            'adjustment_type': 'MANUAL_CORRECTION', 'amount': '10.00', 'reason': 'late tweak'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_failed_and_reversed_paths_keep_audit(self):
        self._delivered_order()
        self.client.force_authenticate(user=self.admin)
        ref = self.client.post('/api/delivery/admin/payouts/create-batch/', {
            'rider_id': self.rider.id,
        }).data['payout']['payout_reference']

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {
            'status': 'FAILED', 'reason': 'bank holiday'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {'status': 'PENDING'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {'status': 'PROCESSING'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {
            'status': 'PAID', 'provider_utr': 'UTR-TEST-0002'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f'/api/delivery/admin/payouts/{ref}/status/', {
            'status': 'REVERSED', 'reason': 'duplicate bank entry'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        payout = RiderPayout.objects.get(payout_reference=ref)
        self.assertEqual(payout.adjustments.count(), 1)

    def test_rider_earnings_endpoint_shows_ledger(self):
        self._delivered_order(fee=Decimal('35.00'))
        self.client.force_authenticate(user=self.rider)
        res = self.client.get('/api/delivery/earnings/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('ledger', res.data)
        self.assertEqual(res.data['ledger']['accrued_total'], '35.00')


class RiderEarningConcurrencyTestCase(TransactionTestCase):
    def test_concurrent_accrual_creates_single_earning(self):
        customer = create_test_user(role='CUSTOMER', username='cust_conc_1', email='cust_conc_1@testfd.io')
        owner = create_test_user(role='SHOP', username='owner_conc_1', email='owner_conc_1@testfd.io')
        restaurant = create_test_restaurant(owner=owner, name='Conc Kitchen')
        rider = _make_rider(username='rider_conc_1', email='rider_conc_1@testfd.io')
        order = create_test_order(customer=customer, restaurant=restaurant, status='PLACED')
        order.delivery_fee = Decimal('35.00')
        order.rider = rider
        order.status = 'DELIVERED'
        order.save()
        order_id = order.id
        rider_id = rider.id

        from apps.accounts.models import User

        results = []
        errors = []

        def worker():
            try:
                from apps.delivery.payout_service import accrue_rider_earning as accrue
                o = Order.objects.get(id=order_id)
                r = User.objects.get(id=rider_id)
                results.append(accrue(o, r).id)
            except Exception as exc:  # noqa: BLE001 - collected below
                errors.append(exc)

        threads = [threading.Thread(target=worker) for _ in range(8)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(errors, [])
        self.assertEqual(RiderEarning.objects.filter(order_id=order_id).count(), 1)
        self.assertEqual(len(set(results)), 1)


class ShiftCheckoutIdempotencyTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rider = _make_rider(username='rider_shift_1', email='rider_shift_1@testfd.io')
        slot = ShiftSlot.objects.create(
            name='Morning', slot_type='MORNING',
            start_time=time(6, 0), end_time=time(12, 0), multiplier=Decimal('1.0'))
        from datetime import date
        shift = Shift.objects.create(slot=slot, date=date.today())
        self.booking = ShiftBooking.objects.create(
            shift=shift, rider=self.rider, date=date.today(), status='BOOKED')
        CheckIn.objects.create(
            booking=self.booking, rider=self.rider,
            check_in_lat=Decimal('13.0827'), check_in_lng=Decimal('80.2707'),
            status='ACTIVE')

    def test_repeated_checkout_credits_once(self):
        from apps.delivery.models import DeliveryPartner
        self.client.force_authenticate(user=self.rider)
        partner, _ = DeliveryPartner.objects.get_or_create(
            user=self.rider, defaults={'vehicle_number': 'KA-01-T-0001'})
        partner.today_earnings = Decimal('0.00')
        partner.total_earnings = Decimal('0.00')
        partner.save()

        res1 = self.client.post('/api/shifts/check-out/', {'booking_id': self.booking.id})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        first_earned = Decimal(str(res1.data['shift_earnings']))

        res2 = self.client.post('/api/shifts/check-out/', {'booking_id': self.booking.id})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data.get('already_completed'))
        self.assertEqual(Decimal(str(res2.data['shift_earnings'])), first_earned)

        partner.refresh_from_db()
        self.assertEqual(partner.today_earnings, first_earned)
        self.assertEqual(partner.total_earnings, first_earned)
