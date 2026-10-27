"""Scheduled orders: slots, booking rules, cancellation, release, idempotency."""
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.orders.models import DeliverySlot, ScheduledOrder, Order
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_category,
    create_test_food,
    create_test_address,
)


def _slot(restaurant, start_in_hours=3, capacity=10, cutoff=60, hours=2):
    now = timezone.now()
    return DeliverySlot.objects.create(
        restaurant=restaurant, slot_start=now + timedelta(hours=start_in_hours),
        slot_end=now + timedelta(hours=start_in_hours + hours),
        capacity=capacity, cutoff_minutes=cutoff, is_active=True)


class ScheduledOrderTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='sched_cust_1', email='sched1@testfd.io')
        self.other = create_test_user(
            role='CUSTOMER', username='sched_cust_2', email='sched2@testfd.io')
        self.owner = create_test_user(
            role='SHOP', username='sched_owner_1', email='schedowner1@testfd.io')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Sched Kitchen')
        self.restaurant.verification_status = 'APPROVED'
        self.restaurant.is_verified = True
        self.restaurant.save()
        category = create_test_category(name='Sched Cat')
        self.food = create_test_food(
            restaurant=self.restaurant, category=category, name='Sched Biryani',
            price=Decimal('200.00'), stock=10)
        self.address = create_test_address(user=self.customer)
        self.client.force_authenticate(user=self.customer)

    def _book(self, slot, **over):
        body = {'restaurant_id': self.restaurant.id, 'slot_id': slot.id,
                'items': [{'food_item_id': self.food.id, 'quantity': 1}],
                'address_id': self.address.id}
        body.update(over)
        return self.client.post('/api/orders/scheduled/', body, format='json')

    def test_book_list_cancel(self):
        slot = _slot(self.restaurant)
        res = self._book(slot)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'CONFIRMED')
        res = self.client.get('/api/orders/scheduled/')
        self.assertEqual(len(res.data['scheduled_orders']), 1)
        sid = res.data['scheduled_orders'][0]['id']
        res = self.client.post(f'/api/orders/scheduled/{sid}/cancel/', {'reason': 'change of plans'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'CANCELLED')

    def test_idempotent_create(self):
        slot = _slot(self.restaurant)
        key = 'SCH-TEST-0001'
        r1 = self._book(slot, idempotency_key=key)
        r2 = self._book(slot, idempotency_key=key)
        self.assertEqual(r1.data['id'], r2.data['id'])
        self.assertEqual(ScheduledOrder.objects.filter(idempotency_key=key).count(), 1)

    def test_capacity_and_cutoff_enforced(self):
        slot = _slot(self.restaurant, capacity=1)
        self.assertEqual(self._book(slot).status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(user=self.other)
        other_addr = create_test_address(user=self.other)
        res = self.client.post('/api/orders/scheduled/', {
            'restaurant_id': self.restaurant.id, 'slot_id': slot.id,
            'items': [{'food_item_id': self.food.id, 'quantity': 1}],
            'address_id': other_addr.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        late = _slot(self.restaurant, start_in_hours=0, cutoff=120)
        self.client.force_authenticate(user=self.customer)
        res = self._book(late)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_user_cannot_cancel(self):
        slot = _slot(self.restaurant)
        sid = self._book(slot).data['id']
        self.client.force_authenticate(user=self.other)
        res = self.client.post(f'/api/orders/scheduled/{sid}/cancel/', {})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_release_creates_real_order(self):
        from apps.orders.scheduling import release_due_scheduled_orders
        slot = _slot(self.restaurant)
        sid = self._book(slot).data['id']
        DeliverySlot.objects.filter(id=slot.id).update(
            slot_start=timezone.now() - timedelta(minutes=5))
        result = release_due_scheduled_orders()
        self.assertEqual(len(result['released']), 1)
        sch = ScheduledOrder.objects.get(id=sid)
        self.assertEqual(sch.status, 'RELEASED')
        self.assertIsNotNone(sch.released_order_id)
        order = Order.objects.get(id=sch.released_order_id)
        self.assertEqual(order.status, 'PLACED')
        self.assertEqual(order.customer, self.customer)

    def test_release_stockout_expires(self):
        from apps.orders.scheduling import release_due_scheduled_orders
        slot = _slot(self.restaurant)
        sid = self._book(slot).data['id']
        self.food.stock = 0
        self.food.save()
        DeliverySlot.objects.filter(id=slot.id).update(
            slot_start=timezone.now() - timedelta(minutes=5))
        result = release_due_scheduled_orders()
        self.assertEqual(len(result['released']), 0)
        self.assertEqual(len(result['expired']), 1)
        self.assertEqual(ScheduledOrder.objects.get(id=sid).status, 'EXPIRED')

    def test_restaurant_creates_slot(self):
        self.client.force_authenticate(user=self.owner)
        start = timezone.now() + timedelta(days=1)
        res = self.client.post('/api/orders/slots/create/', {
            'slot_start': start.isoformat(),
            'slot_end': (start + timedelta(hours=2)).isoformat(),
            'capacity': 5, 'cutoff_minutes': 30}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/orders/slots/create/', {
            'slot_start': start.isoformat(),
            'slot_end': (start + timedelta(hours=2)).isoformat()}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
