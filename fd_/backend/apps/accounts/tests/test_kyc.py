"""
Role-based KYC tests: draft/resume, upload validation, ownership,
approve/reject + reason, resubmission, self-approval block.
"""
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import PartnerKYC
from apps.core_tests.factories import create_test_user


def _png(name='doc.png'):
    buf = BytesIO()
    Image.new('RGB', (10, 10), color='white').save(buf, format='PNG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')


def _pdf(name='doc.pdf'):
    return SimpleUploadedFile(
        name, b'%PDF-1.4 fake pdf body for tests', content_type='application/pdf')


class PartnerKYCTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rider = create_test_user(
            role='DELIVERY_PARTNER', username='kyc_rider_1', email='kyc_rider_1@testfd.io')
        self.rider2 = create_test_user(
            role='DELIVERY_PARTNER', username='kyc_rider_2', email='kyc_rider_2@testfd.io')
        self.owner = create_test_user(
            role='RESTAURANT', username='kyc_owner_1', email='kyc_owner_1@testfd.io')
        self.customer = create_test_user(
            role='CUSTOMER', username='kyc_cust_1', email='kyc_cust_1@testfd.io')
        self.admin = create_test_user(
            role='ADMIN', username='kyc_admin_1', email='kyc_admin_1@testfd.io')

    def test_customer_kyc_not_required(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get('/api/kyc/status/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(res.data['kyc_required'])

    def test_draft_save_and_resume_merges(self):
        self.client.force_authenticate(user=self.rider)
        res = self.client.get('/api/kyc/status/')
        self.assertEqual(res.data['status'], 'NOT_STARTED')

        res = self.client.patch('/api/kyc/draft/', {
            'data': {'bank_holder': 'Test Rider'}}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'INCOMPLETE')

        res = self.client.patch('/api/kyc/draft/', {
            'data': {'bank_account': '501000111222'}}, format='json')
        self.assertEqual(res.data['data']['bank_holder'], 'Test Rider')
        self.assertEqual(res.data['data']['bank_account'], '501000111222')

    def test_upload_validation(self):
        self.client.force_authenticate(user=self.rider)
        res = self.client.post('/api/kyc/documents/', {
            'doc_type': 'dl_front', 'file': _png()})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        bad = SimpleUploadedFile('evil.txt', b'not an image', content_type='text/plain')
        res = self.client.post('/api/kyc/documents/', {
            'doc_type': 'dl_back', 'file': bad})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.post('/api/kyc/documents/', {
            'doc_type': 'fssai_cert', 'file': _pdf()})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_gate_consent_docs_fields(self):
        self.client.force_authenticate(user=self.rider)
        res = self.client.post('/api/kyc/submit/', {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        docs = {'dl_front': _png('a.png'), 'dl_back': _png('b.png'),
                'vehicle_rc': _pdf('rc.pdf'), 'bank_proof': _pdf('bank.pdf')}
        for dtype, f in docs.items():
            res = self.client.post('/api/kyc/documents/', {'doc_type': dtype, 'file': f})
            self.assertEqual(res.status_code, status.HTTP_201_CREATED, dtype)
        self.client.patch('/api/kyc/draft/', {'data': {
            'bank_holder': 'R', 'bank_account': '1', 'bank_ifsc': 'HDFC0001',
            'emergency_name': 'E', 'emergency_phone': '9999999999'}}, format='json')
        res = self.client.post('/api/kyc/submit/', {'consent_given': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'PENDING')

        res = self.client.post('/api/kyc/documents/', {'doc_type': 'insurance', 'file': _pdf()})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_document_ownership(self):
        self.client.force_authenticate(user=self.rider)
        doc_id = self.client.post('/api/kyc/documents/', {
            'doc_type': 'dl_front', 'file': _png()}).data['id']

        self.client.force_authenticate(user=self.rider2)
        res = self.client.delete(f'/api/kyc/documents/{doc_id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        res = self.client.get(f'/api/kyc/documents/{doc_id}/download/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.rider)
        res = self.client.get(f'/api/kyc/documents/{doc_id}/download/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_admin_approve_reject_resubmit(self):
        self.client.force_authenticate(user=self.rider)
        for dtype, f in {'dl_front': _png('a.png'), 'dl_back': _png('b.png'),
                         'vehicle_rc': _pdf(), 'bank_proof': _pdf()}.items():
            self.client.post('/api/kyc/documents/', {'doc_type': dtype, 'file': f})
        self.client.patch('/api/kyc/draft/', {'data': {
            'bank_holder': 'R', 'bank_account': '1', 'bank_ifsc': 'HDFC0001',
            'emergency_name': 'E', 'emergency_phone': '9999999999'}}, format='json')
        self.client.post('/api/kyc/submit/', {'consent_given': True}, format='json')

        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/kyc/admin/pending/')
        self.assertTrue(any(a['user_id'] == self.rider.id for a in res.data['applications']))

        res = self.client.post(f'/api/kyc/admin/{self.rider.id}/reject/', {'reason': 'x'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(
            f'/api/kyc/admin/{self.rider.id}/reject/', {'reason': 'DL photo blurry'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'REJECTED')

        self.client.force_authenticate(user=self.rider)
        res = self.client.post('/api/kyc/submit/', {'consent_given': True}, format='json')
        self.assertEqual(res.data['status'], 'PENDING')

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/kyc/admin/{self.rider.id}/approve/', {})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'APPROVED')
        kyc = PartnerKYC.objects.get(user=self.rider)
        self.assertEqual(kyc.reviewed_by, self.admin)

    def test_self_approval_blocked(self):
        self.admin.role = 'DELIVERY_PARTNER'
        self.admin.save()
        self.client.force_authenticate(user=self.admin)
        self.client.patch('/api/kyc/draft/', {'data': {'bank_holder': 'A'}}, format='json')
        res = self.client.post(f'/api/kyc/admin/{self.admin.id}/approve/', {})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_request_info_and_resubmit(self):
        self.client.force_authenticate(user=self.rider)
        for dtype, f in {'dl_front': _png('a.png'), 'dl_back': _png('b.png'),
                         'vehicle_rc': _pdf(), 'bank_proof': _pdf()}.items():
            self.client.post('/api/kyc/documents/', {'doc_type': dtype, 'file': f})
        self.client.patch('/api/kyc/draft/', {'data': {
            'bank_holder': 'R', 'bank_account': '1', 'bank_ifsc': 'HDFC0001',
            'emergency_name': 'E', 'emergency_phone': '9999999999'}}, format='json')
        self.client.post('/api/kyc/submit/', {'consent_given': True}, format='json')

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/kyc/admin/{self.rider.id}/request-info/', {'reason': 'x'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(
            f'/api/kyc/admin/{self.rider.id}/request-info/',
            {'reason': 'DL back photo is blurry, please re-upload'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'MORE_INFO_REQUIRED')

        # User can edit + re-upload + resubmit (not stuck)
        self.client.force_authenticate(user=self.rider)
        res = self.client.get('/api/kyc/status/')
        self.assertEqual(res.data['status'], 'MORE_INFO_REQUIRED')
        res = self.client.post('/api/kyc/documents/', {
            'doc_type': 'dl_back', 'file': _png('b2.png')})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        res = self.client.post('/api/kyc/submit/', {}, format='json')
        self.assertEqual(res.data['status'], 'PENDING')

        # Request-info on approved app blocked
        self.client.force_authenticate(user=self.admin)
        self.client.post(f'/api/kyc/admin/{self.rider.id}/approve/', {})
        res = self.client.post(
            f'/api/kyc/admin/{self.rider.id}/request-info/', {'reason': 'late note'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
