"""Admin manual creation: restaurants + partners (duplicates blocked, audited)."""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner
from apps.core_tests.factories import create_test_user


class AdminCreateTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_test_user(
            role='ADMIN', username='adm_create_1', email='admcreate1@testfd.io')
        self.rider = create_test_user(
            role='CUSTOMER', username='adm_create_r1', email='admcreater1@testfd.io')
        self.client.force_authenticate(user=self.admin)

    def test_create_restaurant_with_new_owner(self):
        res = self.client.post('/api/adminpanel/restaurants/create/', {
            'name': 'Admin Made Kitchen', 'owner_name': 'Owner One',
            'email': 'ownerone@testfd.io', 'phone': '9000000001',
            'password': 'Strong123!', 'address': '1, Test Road'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        r = Restaurant.objects.get(name='Admin Made Kitchen')
        self.assertEqual(r.verification_status, 'PENDING')
        self.assertFalse(r.is_open)
        # Duplicate name blocked
        res = self.client.post('/api/adminpanel/restaurants/create/', {
            'name': 'admin made kitchen', 'owner_name': 'Owner Two',
            'email': 'ownertwo@testfd.io', 'phone': '9000000002',
            'password': 'Strong123!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Duplicate email blocked
        res = self.client.post('/api/adminpanel/restaurants/create/', {
            'name': 'Another Kitchen', 'owner_name': 'Owner Three',
            'email': 'ownerone@testfd.io', 'phone': '9000000003',
            'password': 'Strong123!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_restaurant_non_admin_blocked(self):
        self.client.force_authenticate(user=self.rider)
        res = self.client.post('/api/adminpanel/restaurants/create/', {
            'name': 'Sneaky Kitchen', 'owner_name': 'X',
            'email': 'sneaky@testfd.io', 'phone': '9876543210',
            'password': 'Strong123!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_partner(self):
        res = self.client.post('/api/adminpanel/partners/create/', {
            'full_name': 'Rider One', 'email': 'riderone@testfd.io',
            'phone': '9000000011', 'password': 'Strong123!',
            'vehicle_number': 'KA-01-T-1111'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        p = DeliveryPartner.objects.get(user__email='riderone@testfd.io')
        self.assertEqual(p.verification_status, 'PENDING')
        self.assertTrue(User.objects.get(email='riderone@testfd.io').check_password('Strong123!'))
        # Duplicate vehicle blocked
        res = self.client.post('/api/adminpanel/partners/create/', {
            'full_name': 'Rider Two', 'email': 'ridertwo@testfd.io',
            'phone': '9000000012', 'password': 'Strong123!',
            'vehicle_number': 'KA-01-T-1111'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Non-admin blocked
        self.client.force_authenticate(user=self.rider)
        res = self.client.post('/api/adminpanel/partners/create/', {
            'full_name': 'Rider X', 'email': 'riderx@testfd.io',
            'phone': '9000000013', 'password': 'Strong123!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
