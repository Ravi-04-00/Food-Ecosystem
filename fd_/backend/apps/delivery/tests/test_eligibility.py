"""Assignment eligibility: suspended/offline/unapproved riders blocked everywhere."""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.delivery.models import DeliveryAssignment
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_category,
    create_test_food,
    create_test_order,
    create_test_rider,
)


class AssignmentEligibilityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='elig_cust_1', email='elig1@testfd.io')
        self.owner = create_test_user(
            role='SHOP', username='elig_owner_1', email='eligowner1@testfd.io')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Elig Kitchen')
        category = create_test_category(name='Elig Cat')
        self.food = create_test_food(
            restaurant=self.restaurant, category=category, name='Elig Dish',
            price=Decimal('150.00'))
        self.rider = create_test_user(
            role='DELIVERY_PARTNER', username='elig_rider_1', email='eligrider1@testfd.io')
        create_test_rider(user=self.rider, is_online=True)

    def _ready_order(self, **over):
        kw = {'customer': self.customer, 'restaurant': self.restaurant,
              'status': 'READY_FOR_PICKUP'}
        kw.update(over)
        return create_test_order(**kw)

    def test_suspended_rider_blocked_from_jobs(self):
        self.rider.is_active = False
        self.rider.save()
        self.client.force_authenticate(user=self.rider)
        res = self.client.get('/api/delivery/jobs/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unapproved_rider_blocked_from_legacy_accept(self):
        self.rider.delivery_profile.verification_status = 'PENDING'
        self.rider.delivery_profile.is_verified = False
        self.rider.delivery_profile.save()
        order = self._ready_order()
        self.client.force_authenticate(user=self.rider)
        res = self.client.post(f'/api/delivery/requests/{order.id}/accept/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(DeliveryAssignment.objects.filter(order=order).count(), 0)

    def test_legacy_accept_records_assignment_without_status_jump(self):
        order = self._ready_order()
        self.client.force_authenticate(user=self.rider)
        res = self.client.post(f'/api/delivery/requests/{order.id}/accept/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'READY_FOR_PICKUP')
        self.assertEqual(order.rider, self.rider)
        assignment = DeliveryAssignment.objects.get(order=order)
        self.assertEqual(assignment.status, 'ACCEPTED')
        self.assertEqual(assignment.delivery_partner, self.rider)

    def test_customer_cannot_use_legacy_accept(self):
        order = self._ready_order()
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/delivery/requests/{order.id}/accept/')
        self.assertIn(res.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
