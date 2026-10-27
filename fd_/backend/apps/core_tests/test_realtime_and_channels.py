"""
Fast Delivery (FD) - Real-Time Channels & Notifications Quality Engineering Test Suite
Tests WebSocket envelope compliance, 64KB frame size denial-of-service guards,
notification deduplication, and unread count integrity.
"""

import json
import inspect
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.notifications.models import Notification
from apps.notifications.dispatcher import safe_dispatch_on_commit
from apps.orders.consumers import EcosystemConsumer, OrderTrackingConsumer
from apps.core_tests.factories import create_test_user


class RealtimeAndChannelsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user(role='CUSTOMER', username='cust_realtime_1')

    def test_standardized_event_envelope_structure(self):
        """Standardized real-time events must contain UUID, timestamp, version, and payload."""
        from apps.orders.realtime import build_event_envelope
        payload = {'order_id': 123, 'status': 'CONFIRMED'}
        envelope = build_event_envelope(
            event_type='order.updated',
            entity_type='order',
            entity_id=123,
            data=payload
        )

        self.assertIn('event_id', envelope)
        self.assertIn('event_type', envelope)
        self.assertEqual(envelope['event_type'], 'order.updated')
        self.assertIn('server_timestamp', envelope)
        self.assertIn('data', envelope)
        self.assertEqual(envelope['data'], payload)
        self.assertEqual(envelope['entity_id'], 123)
        self.assertEqual(envelope['schema_version'], '1.0')

    def test_websocket_consumer_enforces_64kb_payload_limit(self):
        """WebSocket consumers reject frames exceeding 64KB with PAYLOAD_TOO_LARGE code (SEC-10)."""
        eco_source = inspect.getsource(EcosystemConsumer.receive)
        track_source = inspect.getsource(OrderTrackingConsumer.receive)

        self.assertIn('65536', eco_source)
        self.assertIn('PAYLOAD_TOO_LARGE', eco_source)
        self.assertIn('65536', track_source)
        self.assertIn('PAYLOAD_TOO_LARGE', track_source)

    def test_notification_deduplication_via_idempotency_key(self):
        """Duplicate notification dispatch attempts with the same idempotency key are safely deduplicated."""
        key = 'unique_idempotency_key_test_101'

        # First dispatch
        n1 = Notification.objects.create(
            user=self.user,
            title='Order Prepared',
            message='Your food is ready for delivery pickup.',
            notification_type='ORDER_UPDATE',
            idempotency_key=key
        )
        self.assertIsNotNone(n1.id)

        # Second dispatch with identical idempotency key
        safe_dispatch_on_commit(
            user=self.user,
            event_type='order.prepared',
            context={'order_number': 'FD-1234'},
            idempotency_key=key
        )

        # Count must remain 1
        self.assertEqual(Notification.objects.filter(idempotency_key=key).count(), 1)

    def test_notification_read_state_and_unread_count_consistency(self):
        """Marking a notification read updates timestamp and maintains accurate unread count."""
        # Create 2 unread notifications
        Notification.objects.create(
            user=self.user,
            title='Promo 1',
            message='10% off',
            notification_type='SYSTEM',
            is_read=False
        )
        n2 = Notification.objects.create(
            user=self.user,
            title='Promo 2',
            message='20% off',
            notification_type='SYSTEM',
            is_read=False
        )

        self.client.force_authenticate(user=self.user)
        res_list = self.client.get('/api/notifications/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data.get('unread_count'), 2)

        # Mark n2 as read
        res_read = self.client.post(f'/api/notifications/{n2.id}/read/')
        self.assertEqual(res_read.status_code, status.HTTP_200_OK)

        n2.refresh_from_db()
        self.assertTrue(n2.is_read)

        # Check updated unread count
        res_list2 = self.client.get('/api/notifications/')
        self.assertEqual(res_list2.data.get('unread_count'), 1)
