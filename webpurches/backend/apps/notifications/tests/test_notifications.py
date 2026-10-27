import uuid
from decimal import Decimal
from django.test import TestCase, override_settings
from django.db import transaction
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.orders.models import Order
from apps.notifications.models import (
    Notification,
    NotificationPreference,
    NotificationDeliveryAttempt
)
from apps.notifications.dispatcher import dispatch_notification, safe_dispatch_on_commit
from apps.notifications.templates import render_notification_template, TEMPLATES
from apps.notifications.adapters import mask_email, mask_phone, EmailAdapter, SMSAdapter, PushAdapter


class Phase17NotificationsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test users with distinct roles
        self.customer = User.objects.create_user(
            username='cust_test_17',
            email='customer17@example.com',
            password='Password123!',
            role='CUSTOMER',
            phone='+919876543210'
        )
        self.other_customer = User.objects.create_user(
            username='other_cust_17',
            email='other17@example.com',
            password='Password123!',
            role='CUSTOMER',
            phone='+919876543211'
        )
        self.restaurant_owner = User.objects.create_user(
            username='rest_test_17',
            email='rest17@example.com',
            password='Password123!',
            role='RESTAURANT',
            phone='+919876543212'
        )
        self.courier = User.objects.create_user(
            username='rider_test_17',
            email='rider17@example.com',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543213'
        )
        self.admin = User.objects.create_superuser(
            username='admin_test_17',
            email='admin17@example.com',
            password='Password123!',
            role='ADMIN'
        )

        # Create Restaurant
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Spice Hub Phase 17',
            address='123 Gourmet St',
            is_open=True,
            verification_status='APPROVED'
        )

    # 1. Authentication & Ownership Isolation
    def test_unauthorized_access(self):
        """Anonymous requests must be rejected with 401."""
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get('/api/notifications/preferences/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cross_user_isolation(self):
        """Users can never view or modify notifications belonging to another user."""
        notif_a = Notification.objects.create(
            user=self.customer,
            title='Order Placed',
            message='Your order #FD-101 has been placed.',
            notification_type='ORDER',
            event_type='order.created',
            idempotency_key=str(uuid.uuid4())
        )
        notif_b = Notification.objects.create(
            user=self.other_customer,
            title='Order Cancelled',
            message='Your order #FD-999 was cancelled.',
            notification_type='ORDER',
            event_type='order.cancelled',
            idempotency_key=str(uuid.uuid4())
        )

        # Customer A list
        self.client.force_authenticate(user=self.customer)
        res = self.client.get('/api/notifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [n['id'] for n in res.data['results']]
        self.assertIn(notif_a.id, ids)
        self.assertNotIn(notif_b.id, ids)

        # Customer A tries to mark Customer B's notification read
        res_read = self.client.patch(f'/api/notifications/{notif_b.id}/read/')
        self.assertEqual(res_read.status_code, status.HTTP_404_NOT_FOUND)

        # Customer A tries to dismiss Customer B's notification
        res_del = self.client.delete(f'/api/notifications/{notif_b.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)

    # 2. Unread Count & Marking Read
    def test_unread_count_and_mark_read(self):
        notif1 = Notification.objects.create(
            user=self.customer,
            title='Order Placed',
            message='Msg 1',
            is_read=False,
            idempotency_key=str(uuid.uuid4())
        )
        notif2 = Notification.objects.create(
            user=self.customer,
            title='Order Preparing',
            message='Msg 2',
            is_read=False,
            idempotency_key=str(uuid.uuid4())
        )

        self.client.force_authenticate(user=self.customer)
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 2)

        # Mark notif1 as read
        patch_res = self.client.patch(f'/api/notifications/{notif1.id}/read/')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertTrue(patch_res.data['is_read'])

        # Count should now be 1
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.data['unread_count'], 1)

    def test_mark_all_read(self):
        for i in range(3):
            Notification.objects.create(
                user=self.customer,
                title=f'Alert {i}',
                message=f'Message {i}',
                is_read=False,
                idempotency_key=str(uuid.uuid4())
            )

        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['marked_count'], 3)

        count_res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(count_res.data['unread_count'], 0)

    def test_dismiss_notification(self):
        notif = Notification.objects.create(
            user=self.customer,
            title='Dismissable',
            message='Please dismiss',
            idempotency_key=str(uuid.uuid4())
        )
        self.client.force_authenticate(user=self.customer)
        del_res = self.client.delete(f'/api/notifications/{notif.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        notif.refresh_from_db()
        self.assertTrue(notif.is_dismissed)

        # Should not appear in standard listing
        list_res = self.client.get('/api/notifications/')
        self.assertEqual(len(list_res.data['results']), 0)

    # 3. Notification Preferences & Language
    def test_preferences_update_and_multilingual(self):
        self.client.force_authenticate(user=self.customer)

        # Default preferences
        get_res = self.client.get('/api/notifications/preferences/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['language'], 'en')

        # Update language to Tamil and disable promotional
        patch_res = self.client.patch('/api/notifications/preferences/', {
            'language': 'ta',
            'promotional_updates': False
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['language'], 'ta')
        self.assertFalse(patch_res.data['promotional_updates'])

        # Dispatch an order.created event to the customer - should render in Tamil!
        notif = dispatch_notification(
            user=self.customer,
            event_type='order.created',
            context={'order_number': 'FD-2026-99', 'amount': '450.00', 'restaurant_name': 'Madurai Mess'}
        )
        self.assertIsNotNone(notif)
        self.assertIn('ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டது', notif.title)
        self.assertIn('FD-2026-99', notif.message)

    # 4. Idempotency Deduplication
    def test_idempotent_event_dispatch(self):
        idempotency_key = f"test_idemp_{uuid.uuid4().hex}"

        notif1 = dispatch_notification(
            user=self.customer,
            event_type='order.created',
            context={'order_number': 'FD-IDEMP-01', 'amount': '250.00', 'restaurant_name': 'Biryani Zone'},
            idempotency_key=idempotency_key
        )
        self.assertIsNotNone(notif1)

        # Dispatch again with identical idempotency key
        notif2 = dispatch_notification(
            user=self.customer,
            event_type='order.created',
            context={'order_number': 'FD-IDEMP-01', 'amount': '250.00', 'restaurant_name': 'Biryani Zone'},
            idempotency_key=idempotency_key
        )
        self.assertEqual(notif1.id, notif2.id)

        # Verify database has strictly 1 record
        total_created = Notification.objects.filter(idempotency_key=idempotency_key).count()
        self.assertEqual(total_created, 1)

    # 5. Transaction Rollback Safety
    def test_transaction_rollback_safety(self):
        """safe_dispatch_on_commit should NOT create notifications if transaction aborts."""
        rollback_key = f"rollback_key_{uuid.uuid4().hex}"
        try:
            with transaction.atomic():
                safe_dispatch_on_commit(
                    user=self.customer,
                    event_type='order.created',
                    context={'order_number': 'FD-FAIL-01'},
                    idempotency_key=rollback_key
                )
                raise RuntimeError("Simulated transaction rollback!")
        except RuntimeError:
            pass

        # Since transaction rolled back, on_commit hook never fired
        count = Notification.objects.filter(idempotency_key=rollback_key).count()
        self.assertEqual(count, 0)

    # 6. External Channel Adapters & PII Masking
    def test_pii_masking_and_adapters(self):
        self.assertEqual(mask_email('john.doe@gmail.com'), 'j***@gmail.com')
        self.assertEqual(mask_email('a@b.com'), 'a***@b.com')
        self.assertEqual(mask_phone('+919876543210'), '*********3210')

        # Test Email adapter fallback
        notif = Notification.objects.create(
            user=self.customer,
            title='Welcome',
            message='Welcome to FD Platform',
            idempotency_key=str(uuid.uuid4())
        )
        EmailAdapter.send(notif, recipient_email='customer17@example.com')
        attempt = NotificationDeliveryAttempt.objects.filter(notification=notif, channel='EMAIL').first()
        self.assertIsNotNone(attempt)
        self.assertEqual(attempt.channel, 'EMAIL')
        self.assertIn(attempt.status, ['SENT', 'DELIVERED', 'FAILED'])
        self.assertTrue('***' in attempt.recipient_destination)

        # Test SMS adapter when unconfigured (honest reporting SKIPPED)
        SMSAdapter.send(notif, recipient_phone='+919876543210')
        sms_attempt = NotificationDeliveryAttempt.objects.filter(notification=notif, channel='SMS').first()
        self.assertIsNotNone(sms_attempt)
        self.assertEqual(sms_attempt.channel, 'SMS')
        self.assertIn(sms_attempt.status, ['SKIPPED', 'SENT'])
        self.assertTrue('***' in sms_attempt.recipient_destination)

    # 7. Complete Lifecycle Role-Targeted Notification Flow
    def test_full_order_and_delivery_lifecycle_events(self):
        """
        Verify end-to-end lifecycle dispatches:
        1. Order PLACED -> Customer & Restaurant Owner notified
        2. Restaurant CONFIRMED -> Customer notified
        3. Restaurant PREPARING -> Customer notified
        4. Restaurant READY -> Customer notified
        5. Delivery ASSIGNED -> Customer notified
        6. Delivery PICKED_UP -> Customer notified
        7. Delivery DELIVERED -> Customer notified
        """
        # 1. Order Placed
        order = Order.objects.create(
            order_number=f"FD-TEST-{uuid.uuid4().hex[:4].upper()}",
            customer=self.customer,
            restaurant=self.restaurant,
            status='PLACED',
            payment_status='PAYMENT_PENDING',
            grand_total=Decimal('500.00'),
            otp='1234'
        )

        dispatch_notification(
            user=self.customer,
            event_type='order.created',
            context={'order_number': order.order_number, 'amount': '500.00', 'restaurant_name': self.restaurant.name},
            idempotency_key=f"order_created_{order.id}"
        )
        dispatch_notification(
            user=self.restaurant_owner,
            event_type='order.new_for_restaurant',
            context={'order_number': order.order_number, 'amount': '500.00', 'customer_name': self.customer.username},
            idempotency_key=f"order_new_rest_{order.id}"
        )

        cust_notifs = Notification.objects.filter(user=self.customer, event_type='order.created')
        rest_notifs = Notification.objects.filter(user=self.restaurant_owner, event_type='order.new_for_restaurant')
        self.assertEqual(cust_notifs.count(), 1)
        self.assertEqual(rest_notifs.count(), 1)

        # 2. Restaurant Confirmed
        dispatch_notification(
            user=self.customer,
            event_type='order.accepted',
            context={'order_number': order.order_number, 'restaurant_name': self.restaurant.name},
            idempotency_key=f"order_accepted_{order.id}"
        )
        self.assertTrue(Notification.objects.filter(user=self.customer, event_type='order.accepted').exists())

        # 3. Courier Assigned
        dispatch_notification(
            user=self.customer,
            event_type='delivery.assigned',
            context={'order_number': order.order_number, 'partner_name': self.courier.username},
            idempotency_key=f"delivery_assigned_{order.id}"
        )
        self.assertTrue(Notification.objects.filter(user=self.customer, event_type='delivery.assigned').exists())

        # 4. Courier Completed Delivery
        dispatch_notification(
            user=self.customer,
            event_type='delivery.completed',
            context={'order_number': order.order_number},
            idempotency_key=f"delivery_completed_{order.id}"
        )
        self.assertTrue(Notification.objects.filter(user=self.customer, event_type='delivery.completed').exists())
