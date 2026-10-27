"""
Fast Delivery (FD) - Delivery & Dispatch Quality Engineering Test Suite
Tests online toggle, competing job acceptance, OTP verification boundaries,
and delivery completion workflows.
"""

from decimal import Decimal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.orders.models import Order
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_order,
    create_test_rider
)


class DeliveryAndDispatchTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(role='CUSTOMER', username='cust_deliv_1')
        self.restaurant = create_test_restaurant(name='Dispatch Hub')
        self.rider_user1 = create_test_user(role='DELIVERY', username='rider_deliv_1')
        self.rider1 = create_test_rider(user=self.rider_user1, is_online=True)
        self.rider_user2 = create_test_user(role='DELIVERY', username='rider_deliv_2')
        self.rider2 = create_test_rider(user=self.rider_user2, is_online=True)
        self.order = create_test_order(customer=self.customer, restaurant=self.restaurant, status='CONFIRMED')

    def test_rider_online_status_toggle(self):
        """Rider can toggle online/offline availability status."""
        self.client.force_authenticate(user=self.rider_user1)
        res = self.client.post('/api/delivery/toggle-status/', {'is_online': False})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.rider1.refresh_from_db()
        self.assertFalse(self.rider1.is_online)

        res2 = self.client.post('/api/delivery/toggle-status/', {'is_online': True})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.rider1.refresh_from_db()
        self.assertTrue(self.rider1.is_online)

    def test_competing_order_acceptance_prevents_duplicate_assignment(self):
        """When two riders compete for the same order, only the first succeeds."""
        self.order.status = 'READY'
        self.order.save(update_fields=['status'])

        # Rider 1 accepts the order
        self.client.force_authenticate(user=self.rider_user1)
        res1 = self.client.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        self.order.refresh_from_db()
        self.assertEqual(self.order.rider, self.rider_user1)

        # Rider 2 attempts to accept the same order
        self.client.force_authenticate(user=self.rider_user2)
        res2 = self.client.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('already', res2.data.get('error', '').lower())

        # Ensure order rider was NOT overwritten
        self.order.refresh_from_db()
        self.assertEqual(self.order.rider, self.rider_user1)

    def test_unauthenticated_otp_verification_rejected(self):
        """Unauthenticated caller cannot verify OTP (SEC-02)."""
        res = self.client.post(f'/api/orders/{self.order.id}/verify-otp/', {'otp': '8492'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthorized_user_forbidden_from_verifying_delivery_otp(self):
        """Customer or unassigned rider is forbidden from verifying OTP (SEC-02)."""
        self.order.rider = self.rider_user1
        self.order.status = 'ON_THE_WAY'
        self.order.save()

        # Customer attempts to verify OTP
        self.client.force_authenticate(user=self.customer)
        res_cust = self.client.post(f'/api/orders/{self.order.id}/verify-otp/', {'otp': '8492'})
        self.assertEqual(res_cust.status_code, status.HTTP_403_FORBIDDEN)

        # Unassigned rider attempts to verify OTP
        self.client.force_authenticate(user=self.rider_user2)
        res_other = self.client.post(f'/api/orders/{self.order.id}/verify-otp/', {'otp': '8492'})
        self.assertEqual(res_other.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_otp_rejected(self):
        """Assigned rider providing wrong OTP receives HTTP 400."""
        self.order.rider = self.rider_user1
        self.order.otp = '9999'
        self.order.status = 'ON_THE_WAY'
        self.order.save()

        self.client.force_authenticate(user=self.rider_user1)
        res = self.client.post(f'/api/orders/{self.order.id}/verify-otp/', {'otp': '1111'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.order.refresh_from_db()
        self.assertNotEqual(self.order.status, 'DELIVERED')

    def test_valid_otp_completes_delivery(self):
        """Assigned rider providing matching OTP completes delivery and marks order DELIVERED."""
        self.order.rider = self.rider_user1
        self.order.otp = '7421'
        self.order.status = 'ON_THE_WAY'
        self.order.save()

        self.client.force_authenticate(user=self.rider_user1)
        res = self.client.post(f'/api/orders/{self.order.id}/verify-otp/', {'otp': '7421'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('success'))

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'DELIVERED')
        self.assertEqual(self.order.payment_status, 'COMPLETED')
