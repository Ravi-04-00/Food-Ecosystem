"""
Fast Delivery (FD) - Payments & Webhooks Quality Engineering Test Suite
Tests Razorpay order initialization, signature verification, webhook deduplication,
and admin-only refunds with immutable audit logs.
Uses 100% mocked providers without real credentials or external financial network calls.
"""

import json
import uuid
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.orders.models import Order
from apps.payments.models import Payment, PaymentWebhook
from apps.accounts.models import AuditLog, Wallet
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_order
)


class PaymentsAndWebhooksTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(role='CUSTOMER', username='cust_pay_1')
        self.other_customer = create_test_user(role='CUSTOMER', username='cust_pay_2')
        self.admin = create_test_user(role='ADMIN', username='admin_pay_1')
        self.restaurant = create_test_restaurant(name='Payment Bistro')
        self.order = create_test_order(customer=self.customer, restaurant=self.restaurant, grand_total=Decimal('350.00'))

    # --------------------------------------------------------------------------
    # 1. Payment Initialization & Verification
    # --------------------------------------------------------------------------
    @patch('apps.payments.razorpay_service.razorpay_service.create_order')
    def test_payment_initialization_creates_pending_payment(self, mock_create_order):
        """Customer initiates payment; server computes minor units (paisa) and creates Payment record."""
        mock_create_order.return_value = {
            'id': 'order_mock_rzp_12345',
            'amount': 35000,
            'currency': 'INR',
            'status': 'created'
        }

        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/payments/initialize/', {
            'order_id': self.order.id,
            'payment_method': 'UPI'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['provider_order_id'], 'order_mock_rzp_12345')
        self.assertEqual(res.data['currency'], 'INR')
        self.assertEqual(res.data['amount_minor_units'], 35000)

        # Verify Payment record in DB
        payment = Payment.objects.get(provider_order_id='order_mock_rzp_12345')
        self.assertEqual(payment.order, self.order)
        self.assertEqual(payment.status, 'PAYMENT_PENDING')

    def test_unauthorized_customer_cannot_initialize_foreign_order_payment(self):
        """Customer 2 cannot initialize payment for Customer 1's order."""
        self.client.force_authenticate(user=self.other_customer)
        res = self.client.post('/api/payments/initialize/', {
            'order_id': self.order.id,
            'payment_method': 'CARD'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @patch('apps.payments.razorpay_service.razorpay_service.verify_checkout_signature')
    def test_successful_payment_verification_updates_order_to_paid(self, mock_verify):
        """Valid cryptographic HMAC signature transitions payment and order to PAID."""
        mock_verify.return_value = True

        # Pre-create pending payment
        payment = Payment.objects.create(
            order=self.order,
            provider_order_id='order_mock_verify_777',
            amount=Decimal('350.00'),
            amount_minor_units=35000,
            currency='INR',
            status='PENDING'
        )

        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/payments/verify/', {
            'razorpay_order_id': 'order_mock_verify_777',
            'razorpay_payment_id': 'pay_mock_success_888',
            'razorpay_signature': 'valid_mock_hmac_signature'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

        payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(payment.status, 'PAID')
        self.assertEqual(self.order.payment_status, 'PAID')

    @patch('apps.payments.razorpay_service.razorpay_service.verify_checkout_signature')
    def test_invalid_signature_marks_payment_failed(self, mock_verify):
        """Invalid cryptographic signature marks payment FAILED and preserves order as PAYMENT_PENDING."""
        mock_verify.return_value = False

        payment = Payment.objects.create(
            order=self.order,
            provider_order_id='order_mock_fail_999',
            amount=Decimal('350.00'),
            amount_minor_units=35000,
            currency='INR',
            status='PENDING'
        )

        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/payments/verify/', {
            'razorpay_order_id': 'order_mock_fail_999',
            'razorpay_payment_id': 'pay_tampered_111',
            'razorpay_signature': 'invalid_forged_signature'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(payment.status, 'FAILED')
        self.assertEqual(self.order.payment_status, 'PAYMENT_PENDING')

    # --------------------------------------------------------------------------
    # 2. Webhooks & Replay Protection
    # --------------------------------------------------------------------------
    @patch('apps.payments.razorpay_service.razorpay_service.verify_webhook_signature')
    def test_webhook_signature_verification_and_replay_deduplication(self, mock_verify):
        """Webhook verifies HMAC signature and deduplicates replay events safely."""
        mock_verify.return_value = True

        payment = Payment.objects.create(
            order=self.order,
            provider_order_id='order_webhook_test_01',
            amount=Decimal('350.00'),
            amount_minor_units=35000,
            currency='INR',
            status='PENDING'
        )

        webhook_event_id = f"evt_test_{uuid.uuid4().hex[:8]}"
        payload = {
            'event': 'payment.captured',
            'id': webhook_event_id,
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_webhook_999',
                        'order_id': 'order_webhook_test_01',
                        'amount': 35000,
                        'currency': 'INR',
                        'status': 'captured'
                    }
                }
            }
        }
        body_json = json.dumps(payload)

        # First delivery
        res1 = self.client.post(
            '/api/payments/webhook/',
            data=body_json,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE='valid_mock_webhook_sig'
        )
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.assertEqual(payment.status, 'PAID')

        # Replay duplicate delivery
        res2 = self.client.post(
            '/api/payments/webhook/',
            data=body_json,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE='valid_mock_webhook_sig'
        )
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertIn('already processed', res2.data.get('message', '').lower())

    @patch('apps.payments.razorpay_service.razorpay_service.verify_webhook_signature')
    def test_webhook_with_invalid_signature_rejected(self, mock_verify):
        """Webhook with invalid signature returns HTTP 400."""
        mock_verify.return_value = False

        res = self.client.post(
            '/api/payments/webhook/',
            data=json.dumps({'event': 'payment.captured'}),
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE='tampered_signature'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # --------------------------------------------------------------------------
    # 3. Admin Refunds & Audit Logging
    # --------------------------------------------------------------------------
    def test_admin_authorized_refund_creates_audit_log(self):
        """Admin can issue refund; creates immutable AuditLog record (SEC-01)."""
        self.order.status = 'CANCELLED'
        self.order.payment_status = 'PAID'
        self.order.save()

        # Ensure order has a settled payment record
        Payment.objects.create(
            order=self.order,
            provider_order_id='rf_test_order_pay_1',
            amount=Decimal('350.00'),
            amount_minor_units=35000,
            currency='INR',
            status='PAID'
        )

        initial_balance = self.customer.wallet.balance
        initial_audit_count = AuditLog.objects.count()

        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/payments/refund/', {
            'order_id': self.order.id,
            'amount': 350.00,
            'reason': 'Quality complaint verified by support'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify wallet credited
        self.customer.wallet.refresh_from_db()
        self.assertEqual(self.customer.wallet.balance, initial_balance + Decimal('350.00'))

        # Verify AuditLog created
        self.assertEqual(AuditLog.objects.count(), initial_audit_count + 1)
        latest_audit = AuditLog.objects.latest('timestamp')
        self.assertEqual(latest_audit.action, 'PAYMENT_REFUND_PROCESSED')
        self.assertEqual(latest_audit.actor, self.admin)
