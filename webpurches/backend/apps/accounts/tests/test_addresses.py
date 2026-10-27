"""Customer delivery-address API tests: validation, ownership, default logic."""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Address
from apps.core_tests.factories import create_test_user


def _payload(**over):
    data = {
        'label': 'Home',
        'full_name': 'Test Customer',
        'street': '12, MG Road',
        'city': 'Chennai',
        'state': 'Tamil Nadu',
        'pincode': '600001',
        'phone': '9876543210',
    }
    data.update(over)
    return data


class CustomerAddressTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='addr_cust_1', email='addr1@testfd.io')
        self.other = create_test_user(
            role='CUSTOMER', username='addr_cust_2', email='addr2@testfd.io')
        self.client.force_authenticate(user=self.customer)

    def test_create_valid_address(self):
        res = self.client.post('/api/accounts/addresses/', _payload(), format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['is_default'])
        # Persistence: fetch again
        res = self.client.get('/api/accounts/addresses/')
        self.assertEqual(len(res.data['results'] if isinstance(res.data, dict) else res.data), 1)

    def test_invalid_pincode_rejected(self):
        for bad in ['123', 'ABCDEF', '000000', '60001']:
            res = self.client.post('/api/accounts/addresses/', _payload(pincode=bad), format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, bad)

    def test_invalid_phone_rejected(self):
        for bad in ['123', 'abcdefg Hij', '1234567890123456']:
            res = self.client.post('/api/accounts/addresses/', _payload(phone=bad), format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, bad)

    def test_missing_fields_rejected(self):
        res = self.client.post('/api/accounts/addresses/',
                               _payload(full_name='', street=''), format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_rejected(self):
        anon = APIClient()
        res = anon.post('/api/accounts/addresses/', _payload(), format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        res = anon.get('/api/accounts/addresses/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_and_default_switch(self):
        a1 = self.client.post('/api/accounts/addresses/', _payload(), format='json').data
        a2 = self.client.post('/api/accounts/addresses/',
                              _payload(label='Work', pincode='600002'), format='json').data
        res = self.client.patch(f"/api/accounts/addresses/{a1['id']}/",
                                {'phone': '9999999999'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f"/api/accounts/addresses/{a2['id']}/set-default/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        a1o = Address.objects.get(id=a1['id'])
        a2o = Address.objects.get(id=a2['id'])
        self.assertFalse(a1o.is_default)
        self.assertTrue(a2o.is_default)

    def test_delete_and_ownership(self):
        addr = self.client.post('/api/accounts/addresses/', _payload(), format='json').data
        self.client.force_authenticate(user=self.other)
        res = self.client.get(f"/api/accounts/addresses/{addr['id']}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        res = self.client.delete(f"/api/accounts/addresses/{addr['id']}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.client.force_authenticate(user=self.customer)
        res = self.client.delete(f"/api/accounts/addresses/{addr['id']}/")
        self.assertIn(res.status_code, (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT))
        self.assertFalse(Address.objects.filter(id=addr['id']).exists())
