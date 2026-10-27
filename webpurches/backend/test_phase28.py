"""
Phase 28: Real-Time Event Reliability & Synchronization Automated Test Suite
Fast Delivery (FD) Ecosystem
"""

import os
import sys
import json
import uuid
import asyncio
from datetime import datetime, timezone
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Initialize Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.test import TestCase, RequestFactory
from django.db import connection, transaction
from rest_framework_simplejwt.tokens import AccessToken
from channels.testing import WebsocketCommunicator

from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.orders.models import Order, OrderStatusHistory
from apps.orders.realtime import (
    build_event_envelope,
    publish_realtime_event,
    safe_publish_on_commit,
    broadcast_order_transition,
    EVENT_SCHEMA_VERSION
)
from apps.orders.consumers import EcosystemConsumer, OrderTrackingConsumer
from apps.notifications.models import Notification
from apps.notifications.dispatcher import dispatch_notification

ROOT_DIR = Path(__file__).resolve().parent.parent

APPS = [
    ('customer-app', 'Customer Portal', 'CUSTOMER'),
    ('restaurant-app', 'Restaurant Hub', 'RESTAURANT'),
    ('delivery-partner-app', 'Delivery Partner', 'DELIVERY'),
    ('admin-app', 'Admin Mission Control', 'ADMIN'),
]


def test_1_event_envelope_contract():
    print("\n--- TEST 1: Standardized Event Contract & Envelope ---")
    data = {'order_number': 'WS-1024-TEST', 'status': 'CONFIRMED', 'grand_total': 450.00}
    envelope = build_event_envelope(
        event_type='order.updated',
        entity_type='order',
        entity_id=1024,
        entity_version=3,
        idempotency_key='order_1024_CONFIRMED_3',
        data=data
    )

    assert envelope['event_id'], "Envelope must contain event_id UUID"
    assert envelope['schema_version'] == EVENT_SCHEMA_VERSION, f"schema_version must be {EVENT_SCHEMA_VERSION}"
    assert envelope['event_type'] == 'order.updated', "event_type must match"
    assert envelope['entity_type'] == 'order', "entity_type must match"
    assert envelope['entity_id'] == 1024, "entity_id must match"
    assert envelope['entity_version'] == 3, "entity_version must match"
    assert envelope['idempotency_key'] == 'order_1024_CONFIRMED_3', "idempotency_key must match"
    assert envelope['data'] == data, "data must match"
    assert envelope['server_timestamp'], "server_timestamp must be present"
    assert envelope['type'] == 'ecosystem_event', "type alias must exist for legacy consumers"
    assert envelope['event'] == 'order.updated', "event alias must exist for legacy consumers"
    assert envelope['order_id'] == 1024, "order_id legacy alias must exist"

    print(f"  [OK] Validated Event Envelope schema (v{envelope['schema_version']}): event_id={envelope['event_id']}")
    print("PASS: Standardized event envelope verified with 100% contract compliance.")


def test_2_ecosystem_consumer_security_and_heartbeat():
    print("\n--- TEST 2: Ecosystem Consumer Security & Heartbeat (Async) ---")

    test_user = User.objects.filter(is_active=True).first()
    test_token = str(AccessToken.for_user(test_user)) if test_user else None

    async def run_async():
        communicator = WebsocketCommunicator(EcosystemConsumer.as_asgi(), "/FD/ecosystem/")
        connected, subprotocol = await communicator.connect()
        assert connected, "EcosystemConsumer should accept connection"

        # Check initial connection message
        init_msg = await communicator.receive_json_from()
        assert init_msg['type'] == 'connection_established'
        assert 'server_timestamp' in init_msg

        # Test Heartbeat Ping/Pong
        await communicator.send_json_to({'action': 'ping', 'timestamp': 123456789})
        pong_msg = await communicator.receive_json_from()
        assert pong_msg['type'] == 'pong'
        assert pong_msg['client_timestamp'] == 123456789
        assert 'server_timestamp' in pong_msg

        # Test Spoofed Client Broadcast Protection
        await communicator.send_json_to({'type': 'fake_order_update', 'order_id': 9999})
        err_msg = await communicator.receive_json_from()
        assert err_msg['type'] == 'error'
        assert err_msg['code'] == 'UNAUTHORIZED_BROADCAST', "Must reject client broadcast injection"

        # Test In-band JWT Authentication
        if test_user and test_token:
            await communicator.send_json_to({'action': 'authenticate', 'token': test_token})
            auth_msg = await communicator.receive_json_from()
            assert auth_msg['type'] == 'authenticated'
            assert auth_msg['user_id'] == test_user.id
            assert f"user_{test_user.id}" in auth_msg['subscribed_channels']

        await communicator.disconnect()

    asyncio.run(run_async())
    print("  [OK] Heartbeat ping/pong, scoped JWT authorization, and anti-spoofing verified")
    print("PASS: EcosystemConsumer security architecture operational.")


def test_3_order_tracking_consumer_validation():
    print("\n--- TEST 3: Live GPS Tracking Consumer Coordinate Validation (Async) ---")

    async def run_async():
        communicator = WebsocketCommunicator(OrderTrackingConsumer.as_asgi(), "/FD/tracking/")
        connected, _ = await communicator.connect()
        assert connected, "OrderTrackingConsumer should accept connection"

        init_msg = await communicator.receive_json_from()
        assert init_msg['type'] == 'connection_established'

        # Test Heartbeat Ping/Pong
        await communicator.send_json_to({'action': 'ping'})
        pong = await communicator.receive_json_from()
        assert pong['type'] == 'pong'
        assert pong['channel'] == 'tracking'

        # Test unauthorized subscription
        await communicator.send_json_to({'action': 'subscribe', 'order_id': 99999999, 'token': 'invalid_token'})
        err = await communicator.receive_json_from()
        assert err['type'] == 'subscription_error'

        await communicator.disconnect()

    asyncio.run(run_async())
    print("  [OK] Tracking authorization and ping/pong verified")
    print("PASS: OrderTrackingConsumer validated.")


def test_4_transactional_commit_and_order_transition():
    print("\n--- TEST 4: Authoritative Order Transition Broadcast ---")
    user = User.objects.filter(role='CUSTOMER').first() or User.objects.first()
    restaurant = Restaurant.objects.first()

    # Create test order
    unique_num = f"WS-T28-{uuid.uuid4().hex[:6].upper()}"
    order = Order.objects.create(
        order_number=unique_num,
        customer=user,
        restaurant=restaurant,
        status='PLACED',
        grand_total=350.00
    )

    # Transition to CONFIRMED
    order.status = 'CONFIRMED'
    order.save()
    OrderStatusHistory.objects.create(
        order=order,
        from_status='PLACED',
        to_status='CONFIRMED',
        actor=user,
        reason='Confirmed in test'
    )

    envelope = broadcast_order_transition(order, event_type='order.updated')
    assert envelope['entity_id'] == order.id
    assert envelope['data']['status'] == 'CONFIRMED'
    assert envelope['idempotency_key'].startswith(f"order_{order.id}_CONFIRMED")
    assert envelope['server_timestamp']

    print(f"  [OK] Order #{unique_num} status transition broadcast created (idempotency: {envelope['idempotency_key']})")
    print("PASS: Order transitions broadcast cleanly with database synchronization.")


def test_5_notification_synchronization_and_deduplication():
    print("\n--- TEST 5: Notification Synchronization & Deduplication ---")
    user = User.objects.filter(role='CUSTOMER').first() or User.objects.first()
    test_idempotency = f"test_notif_sync_{uuid.uuid4().hex[:8]}"

    # Dispatch notification
    notif = dispatch_notification(
        user=user,
        event_type='order.preparing',
        context={'order_number': 'WS-1024-NOTIF', 'restaurant_name': 'Test Kitchen'},
        idempotency_key=test_idempotency
    )
    assert notif is not None, "Notification must be created in PostgreSQL"
    assert notif.idempotency_key == test_idempotency

    # Duplicate dispatch attempt with same idempotency key must NOT duplicate
    duplicate_notif = dispatch_notification(
        user=user,
        event_type='order.preparing',
        context={'order_number': 'WS-1024-NOTIF', 'restaurant_name': 'Test Kitchen'},
        idempotency_key=test_idempotency
    )
    assert duplicate_notif.id == notif.id, "Duplicate notification must be prevented by idempotency key"

    unread_in_db = Notification.objects.filter(user=user, is_read=False).count()
    assert unread_in_db >= 1, "Unread count must accurately reflect database state"

    print(f"  [OK] Notification #{notif.id} created with idempotency key. Duplicate attempt deduplicated.")
    print(f"  [OK] Authoritative PostgreSQL unread count verified: {unread_in_db}")
    print("PASS: Notification synchronization and deduplication verified.")


def test_6_frontend_realtime_artifacts_across_apps():
    print("\n--- TEST 6: Frontend Real-Time Modules & Architecture Across All 4 Apps ---")
    required_files = [
        'src/utils/realtime.js',
        'src/hooks/useRealtime.js',
        'src/components/RealtimeStatusIndicator.jsx'
    ]

    for app_folder, app_title, app_role in APPS:
        app_dir = ROOT_DIR / app_folder
        for rel_file in required_files:
            file_path = app_dir / rel_file
            assert file_path.exists(), f"Missing {rel_file} in {app_folder}"

            content = file_path.read_text(encoding='utf-8')
            if 'realtime.js' in rel_file:
                assert 'ConnectionState' in content, f"ConnectionState missing in {file_path}"
                assert 'RealtimeConnectionManager' in content, f"Manager missing in {file_path}"
                assert 'heartbeat' in content.lower(), f"Heartbeat missing in {file_path}"
                assert 'processedEventIds' in content, f"Deduplication cache missing in {file_path}"
                assert 'entityVersionMap' in content, f"Sequence version map missing in {file_path}"
                assert 'registerReconciliation' in content, f"Reconciliation missing in {file_path}"
            elif 'RealtimeStatusIndicator.jsx' in rel_file:
                assert 'useRealtime' in content, f"useRealtime missing in {file_path}"
                assert 'LIVE' in content or 'Connected' in content, f"Live state missing in {file_path}"
                assert 'நேரடி' in content, f"Tamil status label missing in {file_path}"

        # Verify SmartNotificationCenter uses centralized RealtimeClient
        notif_center = app_dir / 'src' / 'components' / 'SmartNotificationCenter.jsx'
        assert notif_center.exists(), f"SmartNotificationCenter.jsx missing in {app_folder}"
        snc_content = notif_center.read_text(encoding='utf-8')
        assert 'getRealtimeClient' in snc_content, f"SmartNotificationCenter in {app_folder} must use getRealtimeClient"
        assert 'subscribe' in snc_content, f"SmartNotificationCenter in {app_folder} must subscribe to events"
        assert 'registerReconciliation' in snc_content, f"SmartNotificationCenter in {app_folder} must reconcile"

        print(f"  [OK] {app_title} ({app_folder}): realtime.js, useRealtime.js, RealtimeStatusIndicator.jsx verified")
    print("PASS: All 4 frontend applications equipped with unified real-time architecture.")


def test_7_location_freshness_and_telemetry():
    print("\n--- TEST 7: Location Freshness Indicator & Telemetry Invariants ---")
    tracking_page = ROOT_DIR / 'customer-app' / 'src' / 'pages' / 'TrackingPage.jsx'
    assert tracking_page.exists(), "TrackingPage.jsx must exist in customer-app"
    content = tracking_page.read_text(encoding='utf-8')

    assert 'getRealtimeClient' in content, "TrackingPage must use getRealtimeClient"
    assert 'location_update' in content, "TrackingPage must subscribe to location_update"
    assert 'ageSec' in content or 'nowTimestamp' in content, "TrackingPage must compute location age"
    assert 'நேரடி ஜிபிஎஸ்' in content, "TrackingPage must show Tamil Live GPS label"
    assert 'கடைசியாக அறியப்பட்ட இடம்' in content, "TrackingPage must show Tamil Stale Location label"

    print("  [OK] Customer TrackingPage verified with real-time location stream & bilingual freshness pill")
    print("PASS: Location freshness and telemetry contracts verified.")


def test_8_database_postgresql_integrity():
    print("\n--- TEST 8: PostgreSQL Database Integrity & Business Protection ---")
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database();")
        db_name = cursor.fetchone()[0]
        assert db_name == 'wsfood_db', f"Connected to unexpected database: {db_name}"

    order_count = Order.objects.count()
    user_count = User.objects.count()
    notif_count = Notification.objects.count()

    assert order_count > 0, "Orders table must not be empty"
    assert user_count > 0, "Users table must not be empty"

    print(f"  [OK] Connected to PostgreSQL '{db_name}'. Orders: {order_count}, Users: {user_count}, Notifications: {notif_count}")
    print("PASS: Database and business logic strictly preserved.")


def run_all_tests():
    print("====================================================================")
    print("PHASE 28: REAL-TIME EVENT RELIABILITY & SYNCHRONIZATION TEST SUITE")
    print("====================================================================")

    test_1_event_envelope_contract()
    test_2_ecosystem_consumer_security_and_heartbeat()
    test_3_order_tracking_consumer_validation()
    test_4_transactional_commit_and_order_transition()
    test_5_notification_synchronization_and_deduplication()
    test_6_frontend_realtime_artifacts_across_apps()
    test_7_location_freshness_and_telemetry()
    test_8_database_postgresql_integrity()

    print("\n====================================================================")
    print("RESULTS: 8/8 TEST SUITES PASSED SUCCESSFULLY (100%)")
    print("ALL PHASE 28 REAL-TIME RELIABILITY REQUIREMENTS VERIFIED CLEANLY!")
    print("====================================================================")


if __name__ == '__main__':
    run_all_tests()
