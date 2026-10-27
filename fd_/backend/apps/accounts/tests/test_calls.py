"""Callback-request workflow tests (no telephony provider; internal workflow only)."""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import CallRequest
from apps.core_tests.factories import create_test_user


class CallRequestTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='call_cust_1', email='call1@testfd.io')
        self.other = create_test_user(
            role='CUSTOMER', username='call_cust_2', email='call2@testfd.io')
        self.admin = create_test_user(
            role='ADMIN', username='call_admin_1', email='calladmin1@testfd.io')
        self.client.force_authenticate(user=self.customer)

    def _create(self, **over):
        body = {'topic': 'ORDER_HELP', 'phone': '9876543210', 'subject': 'Help me'}
        body.update(over)
        return self.client.post('/api/calls/calls/', body, format='json')

    def test_create_and_list_own(self):
        res = self._create()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'REQUESTED')
        self.assertTrue(res.data['request_number'].startswith('CALL-'))
        self.assertEqual(res.data['phone'], '9876543210')
        res = self.client.get('/api/calls/calls/')
        self.assertEqual(len(res.data['calls']), 1)

    def test_phone_masked_for_others_admin_sees_full(self):
        self._create()
        self.client.force_authenticate(user=self.other)
        res = self.client.get('/api/calls/calls/')
        self.assertEqual(res.data['calls'], [])
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/calls/calls/admin/')
        self.assertEqual(res.data['calls'][0]['phone'], '9876543210')

    def test_invalid_phone_and_topic_rejected(self):
        res = self._create(phone='123')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self._create(topic='NOPE')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_and_unauth(self):
        cid = self._create().data['id']
        self.client.force_authenticate(user=self.other)
        res = self.client.post(f'/api/calls/calls/{cid}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        anon = APIClient()
        res = anon.get('/api/calls/calls/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/calls/calls/{cid}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'CANCELLED')

    def test_admin_transitions_and_gates(self):
        cid = self._create().data['id']
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/calls/calls/admin/{cid}/status/', {'status': 'ASSIGNED'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/calls/calls/admin/{cid}/status/', {'status': 'PAID'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(f'/api/calls/calls/admin/{cid}/status/', {'status': 'COMPLETED'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(f'/api/calls/calls/admin/{cid}/status/', {'status': 'ASSIGNED'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f'/api/calls/calls/admin/{cid}/status/', {'status': 'CALLING'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f'/api/calls/calls/admin/{cid}/status/', {
            'status': 'COMPLETED', 'outcome': 'RESOLVED', 'outcome_notes': 'Called back OK'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        call = CallRequest.objects.get(id=cid)
        self.assertEqual(call.outcome, 'RESOLVED')
