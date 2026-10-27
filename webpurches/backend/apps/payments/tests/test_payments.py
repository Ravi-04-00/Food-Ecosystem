import json
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.orders.models import Order, OrderItem
from apps.products.models import Restaurant
from apps.payments.models import Payment, Transaction, PaymentWebhook
from apps.payments.razorpay_service import razorpay_service

User = get_user_model()


class Phase14PaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Customer A
        self.customer = User.objects.create_user(
            username='raj_customer_phase14',
            email='raj.phase14@example.com',
            password='TestPassword123!',
            first_name='Raj',
            last_name='Kumar',
            role='CUSTOMER'
        )

        # Create Customer B (Attacker / Unauthorized user)
        self.other_customer = User.objects.create_user(
            username='intruder_phase14',
            email='intruder.phase14@example.com',
            password='TestPassword123!',
            first_name='Sneaky',
            last_name='User',
            role='CUSTOMER'
        )

        # Create Restaurant Owner & Restaurant
        self.restaurant_owner = User.objects.create_user(
            username='chef_vikram_phase14',
            email='vikram.phase14@example.com',
            password='TestPassword123!',
            role='RESTAURANT_OWNER'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Royal Spice Kitchen',
            owner_name='Chef Vikram',
            address='123 Brigade Road, Bengaluru'
        )

        # Create Order for Customer A
        self.order = Order.objects.create(
            order_number='ORD-PHASE14-9988',
            customer=self.customer,
            restaurant=self.restaurant,
            item_total=Decimal('420.00'),
            subtotal=Decimal('420.00'),
            delivery_fee=Decimal('30.00'),
            packaging_fee=Decimal('15.00'),
            platform_fee=Decimal('10.00'),
            taxes=Decimal('0.00'),
            discount=Decimal('0.00'),
            grand_total=Decimal('475.00'),
            total=Decimal('475.00'),
            status='PLACED',
            payment_status='PAYMENT_PENDING',
            payment_method='UPI'
        )

    # 1. Payment initialization uses backend-calculated amount & ignores frontend amount tampering
    def test_payment_initialization_uses_backend_calculated_amount(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/payments/initialize/', {
            'order_id': self.order.id,
            'amount': '1.00',  # Tampered amount attempt by malicious frontend
            'payment_method': 'UPI'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertTrue(data['success'])
        self.assertEqual(data['amount'], '475.00')
        self.assertEqual(data['amount_minor_units'], 47500)
        self.assertEqual(data['currency'], 'INR')
        self.assertIn('provider_order_id', data)
        self.assertTrue(data['provider_order_id'].startswith('order_'))

        # Check DB Payment record
        payment = Payment.objects.get(provider_order_id=data['provider_order_id'])
        self.assertEqual(payment.order, self.order)
        self.assertEqual(payment.amount, Decimal('475.00'))
        self.assertEqual(payment.amount_minor_units, 47500)
        self.assertEqual(payment.status, 'PAYMENT_PENDING')

    # 2. Customer cannot initialize payment for another customer's order
    def test_customer_cannot_initialize_payment_for_other_customer_order(self):
        self.client.force_authenticate(user=self.other_customer)
        response = self.client.post('/api/payments/initialize/', {
            'order_id': self.order.id
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Unauthorized', response.data['error'])

    # 3. Successful provider verification marks payment PAID
    def test_successful_provider_verification_marks_payment_paid(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']
        provider_payment_id = 'pay_test_valid_9988'

        valid_signature = razorpay_service.generate_test_checkout_signature(
            provider_order_id=provider_order_id,
            provider_payment_id=provider_payment_id
        )

        verify_res = self.client.post('/api/payments/verify/', {
            'razorpay_order_id': provider_order_id,
            'razorpay_payment_id': provider_payment_id,
            'razorpay_signature': valid_signature
        }, format='json')

        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data['success'])

        payment = Payment.objects.get(provider_order_id=provider_order_id)
        self.assertEqual(payment.status, 'PAID')
        self.assertEqual(payment.payment_status, 'PAID')
        self.assertEqual(payment.provider_payment_id, provider_payment_id)
        self.assertIsNotNone(payment.verified_at)

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PAID')
        self.assertEqual(self.order.payment, payment)

        # Check Transaction ledger
        txn = Transaction.objects.filter(payment=payment).first()
        self.assertIsNotNone(txn)
        self.assertEqual(txn.transaction_type, 'CHARGE')
        self.assertEqual(txn.transaction_id, provider_payment_id)
        self.assertTrue(txn.is_success)

    # 4. Invalid provider signatures are rejected
    def test_invalid_provider_signatures_are_rejected(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']

        verify_res = self.client.post('/api/payments/verify/', {
            'razorpay_order_id': provider_order_id,
            'razorpay_payment_id': 'pay_fake_attacker',
            'razorpay_signature': 'invalid_forged_signature_hex_12345'
        }, format='json')

        self.assertEqual(verify_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(verify_res.data['success'])

        payment = Payment.objects.get(provider_order_id=provider_order_id)
        self.assertEqual(payment.status, 'FAILED')
        self.assertEqual(payment.failure_code, 'BAD_SIGNATURE')

        self.order.refresh_from_db()
        self.assertNotEqual(self.order.payment_status, 'PAID')

    # 5. Invalid webhook signatures are rejected
    def test_invalid_webhook_signatures_are_rejected(self):
        webhook_payload = json.dumps({
            'event': 'payment.captured',
            'id': 'evt_invalid_sig_123'
        }).encode('utf-8')

        response = self.client.post(
            '/api/payments/webhook/',
            data=webhook_payload,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE='forged_tampered_sig'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid webhook signature', response.data['error'])

    # 6. Valid webhook payment captured marks payment PAID
    def test_valid_webhook_payment_captured_marks_payment_paid(self):
        # First initialize payment
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']

        payload_dict = {
            'id': 'evt_rzp_hook_1010',
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_hook_settled_1010',
                        'order_id': provider_order_id,
                        'amount': 47500,
                        'currency': 'INR',
                        'status': 'captured'
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode('utf-8')
        valid_signature = razorpay_service.generate_test_webhook_signature(raw_body)

        # Unauthenticated webhook post from payment gateway
        self.client.logout()
        response = self.client.post(
            '/api/payments/webhook/',
            data=raw_body,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE=valid_signature
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')

        payment = Payment.objects.get(provider_order_id=provider_order_id)
        self.assertEqual(payment.status, 'PAID')
        self.assertEqual(payment.provider_payment_id, 'pay_hook_settled_1010')

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PAID')

    # 7. Duplicate webhooks do not duplicate state changes (Idempotency)
    def test_duplicate_webhooks_do_not_duplicate_state_changes(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']

        payload_dict = {
            'id': 'evt_duplicate_test_202',
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_dup_202',
                        'order_id': provider_order_id,
                        'amount': 47500,
                        'currency': 'INR'
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode('utf-8')
        sig = razorpay_service.generate_test_webhook_signature(raw_body)

        self.client.logout()
        res1 = self.client.post('/api/payments/webhook/', data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Send second time with identical event id
        res2 = self.client.post('/api/payments/webhook/', data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertIn('Duplicate event acknowledged', res2.data['message'])

        # Verify only 1 webhook log recorded
        webhook_count = PaymentWebhook.objects.filter(event_id='evt_duplicate_test_202').count()
        self.assertEqual(webhook_count, 1)

    # 8. Delayed webhooks update the payment safely
    def test_delayed_webhooks_update_payment_safely(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']

        payment = Payment.objects.get(provider_order_id=provider_order_id)
        self.assertEqual(payment.status, 'PAYMENT_PENDING')

        # Delayed webhook arriving after customer browser was closed
        payload_dict = {
            'id': 'evt_delayed_webhook_303',
            'event': 'order.paid',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_delayed_303',
                        'order_id': provider_order_id,
                        'amount': 47500,
                        'currency': 'INR'
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode('utf-8')
        sig = razorpay_service.generate_test_webhook_signature(raw_body)

        self.client.logout()
        res = self.client.post('/api/payments/webhook/', data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.assertEqual(payment.status, 'PAID')

    # 9. Failed payments do not overwrite PAID status
    def test_failed_payments_do_not_overwrite_paid_status(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']

        # Settle as PAID first
        valid_sig = razorpay_service.generate_test_checkout_signature(provider_order_id, 'pay_settled_first_404')
        self.client.post('/api/payments/verify/', {
            'razorpay_order_id': provider_order_id,
            'razorpay_payment_id': 'pay_settled_first_404',
            'razorpay_signature': valid_sig
        })

        payment = Payment.objects.get(provider_order_id=provider_order_id)
        self.assertEqual(payment.status, 'PAID')

        # Now simulate a late failure report or webhook
        fail_res = self.client.post('/api/payments/failure/', {
            'provider_order_id': provider_order_id,
            'error_code': 'BAD_NETWORK',
            'error_description': 'Client network failed after payment'
        })
        self.assertEqual(fail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(fail_res.data['status'], 'PAID')

        payment.refresh_from_db()
        self.assertEqual(payment.status, 'PAID')
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PAID')

    # 10. Payment amount and currency mismatches are rejected
    def test_payment_amount_and_currency_mismatches_are_rejected(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        provider_order_id = init_res.data['provider_order_id']

        # Webhook with wrong amount (e.g., 10000 paise instead of 47500)
        mismatch_payload = {
            'id': 'evt_mismatch_amount_505',
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_mismatch_505',
                        'order_id': provider_order_id,
                        'amount': 10000,
                        'currency': 'INR'
                    }
                }
            }
        }
        raw_body = json.dumps(mismatch_payload).encode('utf-8')
        sig = razorpay_service.generate_test_webhook_signature(raw_body)

        self.client.logout()
        res = self.client.post('/api/payments/webhook/', data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        payment = Payment.objects.get(provider_order_id=provider_order_id)
        self.assertNotEqual(payment.status, 'PAID')
        self.assertEqual(payment.failure_code, 'AMOUNT_MISMATCH')

    # 11. Network timeout does not create duplicate orders; reuses pending payment
    def test_network_timeout_or_retries_reuse_pending_payment(self):
        self.client.force_authenticate(user=self.customer)
        res1 = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        order_count_before = Order.objects.count()
        payment_order_id_1 = res1.data['provider_order_id']

        # Retry initializing payment for the same order
        res2 = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        order_count_after = Order.objects.count()
        payment_order_id_2 = res2.data['provider_order_id']

        # Food order count MUST remain strictly the same
        self.assertEqual(order_count_before, order_count_after)
        # Payment attempt is reused to prevent duplicate gateway transactions
        self.assertEqual(payment_order_id_1, payment_order_id_2)

    # 12. Secrets are absent from frontend bundles and API responses
    def test_secrets_are_absent_from_api_responses(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})
        response_text = json.dumps(res.data)

        secret_key = razorpay_service.key_secret
        webhook_secret = razorpay_service.webhook_secret

        self.assertNotIn(secret_key, response_text)
        self.assertNotIn(webhook_secret, response_text)
        self.assertIn('key_id', res.data)  # Only public key ID is allowed

    # 13. Customer can check payment status securely
    def test_payment_status_inquiry_for_authorized_customer(self):
        self.client.force_authenticate(user=self.customer)
        init_res = self.client.post('/api/payments/initialize/', {'order_id': self.order.id})

        status_res = self.client.get(f'/api/payments/status/{self.order.id}/')
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)
        self.assertEqual(status_res.data['order_number'], self.order.order_number)
        self.assertEqual(status_res.data['payment']['provider_order_id'], init_res.data['provider_order_id'])

        # Attacker cannot check customer's payment status
        self.client.force_authenticate(user=self.other_customer)
        attacker_res = self.client.get(f'/api/payments/status/{self.order.id}/')
        self.assertEqual(attacker_res.status_code, status.HTTP_403_FORBIDDEN)
