import json
import uuid
from datetime import datetime, timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from apps.accounts.models import User
from apps.orders.models import Order
from apps.products.models import Restaurant


class EcosystemConsumer(AsyncWebsocketConsumer):
    """
    Phase 28: Secure, Role-Scoped Real-Time Ecosystem Consumer.
    - Manages authorized scoped group subscriptions (user, restaurant, delivery partner, admin).
    - Prevents arbitrary client-side broadcast spoofing.
    - Handles in-band JWT authentication, heartbeat ping-pong, and order subscriptions.
    - Cleans up all dynamic group memberships upon disconnect.
    """
    async def connect(self):
        self.user = None
        self.joined_groups = set()

        # Connect to public ecosystem channel (backward-compatibility for public broadcasts)
        self.public_group = 'wsfood_live_ecosystem'
        await self.channel_layer.group_add(self.public_group, self.channel_name)
        self.joined_groups.add(self.public_group)

        await self.accept()

        # Check if user already authenticated via ASGI scope
        scope_user = self.scope.get('user')
        if scope_user and scope_user.is_authenticated:
            self.user = scope_user
            await self._setup_user_groups()

        now_iso = datetime.now(timezone.utc).isoformat()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'channel': 'ecosystem',
            'authenticated': bool(self.user),
            'server_timestamp': now_iso,
            'message': 'Connected to Fast Delivery Secure Real-Time Grid'
        }))

    async def disconnect(self, close_code):
        for group in list(self.joined_groups):
            try:
                await self.channel_layer.group_discard(group, self.channel_name)
            except Exception:
                pass
        self.joined_groups.clear()

    async def receive(self, text_data):
        if len(text_data) > 65536:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'PAYLOAD_TOO_LARGE',
                'message': 'WebSocket message payload exceeds 64 KB limit.'
            }))
            return

        try:
            data = json.loads(text_data)
        except Exception:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'MALFORMED_JSON',
                'message': 'Received malformed JSON string.'
            }))
            return

        action = data.get('action') or data.get('type')
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Heartbeat Ping / Pong
        if action == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'client_timestamp': data.get('timestamp'),
                'server_timestamp': now_iso
            }))
            return

        # 2. In-band JWT Authentication
        if action in ['authenticate', 'auth', 'login']:
            token = data.get('token')
            if not token:
                await self.send(text_data=json.dumps({
                    'type': 'auth_error',
                    'message': 'Authentication token is required.'
                }))
                return

            user = await self._authenticate_token(token)
            if not user:
                await self.send(text_data=json.dumps({
                    'type': 'auth_error',
                    'message': 'Invalid or expired authentication token.'
                }))
                return

            self.user = user
            added_groups = await self._setup_user_groups()
            await self.send(text_data=json.dumps({
                'type': 'authenticated',
                'user_id': user.id,
                'username': user.username,
                'role': getattr(user, 'role', 'CUSTOMER'),
                'is_staff': user.is_staff,
                'server_timestamp': now_iso,
                'subscribed_channels': list(self.joined_groups)
            }))
            return

        # 3. Order-Specific Subscription
        if action in ['subscribe_order', 'subscribe_order_stream']:
            order_id = data.get('order_id')
            token = data.get('token')
            if not self.user and token:
                self.user = await self._authenticate_token(token)

            is_auth, err = await self._authorize_order_access(order_id)
            if not is_auth:
                await self.send(text_data=json.dumps({
                    'type': 'subscription_error',
                    'order_id': order_id,
                    'error': err or 'Unauthorized order subscription.'
                }))
                return

            group_name = f"order_{order_id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.joined_groups.add(group_name)
            await self.send(text_data=json.dumps({
                'type': 'subscribed_order',
                'order_id': order_id,
                'server_timestamp': now_iso,
                'message': f"Subscribed to real-time updates for order #{order_id}"
            }))
            return

        if action in ['unsubscribe_order', 'unsubscribe_order_stream']:
            order_id = data.get('order_id')
            group_name = f"order_{order_id}"
            if group_name in self.joined_groups:
                await self.channel_layer.group_discard(group_name, self.channel_name)
                self.joined_groups.remove(group_name)
            await self.send(text_data=json.dumps({
                'type': 'unsubscribed_order',
                'order_id': order_id
            }))
            return

        # 4. Guard against unauthorized client broadcast spoofing
        # Clients cannot inject arbitrary events into server channels
        await self.send(text_data=json.dumps({
            'type': 'error',
            'code': 'UNAUTHORIZED_BROADCAST',
            'message': 'Client broadcast injection is prohibited. State mutations must be submitted via authorized REST endpoints.'
        }))

    async def ecosystem_event(self, event):
        """Passes server-published events through to the client."""
        payload = event.get('payload', {})
        await self.send(text_data=json.dumps(payload))

    # Async Database Helpers
    async def _setup_user_groups(self):
        groups_to_join = await self._resolve_user_groups(self.user)
        for grp in groups_to_join:
            await self.channel_layer.group_add(grp, self.channel_name)
            self.joined_groups.add(grp)
        return groups_to_join

    @database_sync_to_async
    def _authenticate_token(self, token_str):
        try:
            access = AccessToken(token_str)
            user_id = access['user_id']
            return User.objects.filter(id=user_id, is_active=True).first()
        except Exception:
            return None

    @database_sync_to_async
    def _resolve_user_groups(self, user):
        groups = [f"user_{user.id}"]
        role = getattr(user, 'role', 'CUSTOMER')

        if role in ['RESTAURANT', 'SHOP']:
            # Join restaurant owner groups
            rest_ids = list(Restaurant.objects.filter(owner=user).values_list('id', flat=True))
            for rid in rest_ids:
                groups.append(f"restaurant_{rid}")
        elif role in ['DELIVERY', 'RIDER']:
            groups.append(f"delivery_partner_{user.id}")
        elif role == 'ADMIN' or user.is_staff:
            groups.append("admin_ecosystem")

        return groups

    @database_sync_to_async
    def _authorize_order_access(self, order_id):
        if not order_id:
            return False, "order_id is required."
        if not self.user:
            return False, "Authentication required to subscribe to order events."

        order = None
        if str(order_id).isdigit():
            order = Order.objects.filter(pk=int(order_id)).first()
        if not order:
            order = Order.objects.filter(order_number=str(order_id)).first()

        if not order:
            return False, "Order not found."

        # Permission check: Customer, Assigned Courier, Restaurant Owner, or Staff
        if order.customer_id == self.user.id:
            return True, None
        if order.rider_id == self.user.id:
            return True, None
        if order.restaurant and order.restaurant.owner_id == self.user.id:
            return True, None
        if self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN':
            return True, None

        return False, "Forbidden: You do not have permission to subscribe to this order."


class OrderTrackingConsumer(AsyncWebsocketConsumer):
    """
    Phase 15 & 28: Authenticated Live GPS Tracking WebSocket Consumer.
    - Enforces customer & partner subscription authorization.
    - Validates published coordinates (latitude -90..90, longitude -180..180).
    - Enforces server-authoritative timestamps to prevent client-clock manipulation.
    - Heartbeat ping-pong support.
    """
    async def connect(self):
        self.subscribed_orders = set()
        await self.accept()
        now_iso = datetime.now(timezone.utc).isoformat()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'channel': 'tracking',
            'server_timestamp': now_iso,
            'message': 'Connected to FD Live Tracking Realtime Channel'
        }))

    async def disconnect(self, close_code):
        for order_id in list(self.subscribed_orders):
            try:
                await self.channel_layer.group_discard(
                    f"order_tracking_{order_id}",
                    self.channel_name
                )
            except Exception:
                pass
        self.subscribed_orders.clear()

    async def receive(self, text_data):
        if len(text_data) > 65536:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'PAYLOAD_TOO_LARGE',
                'message': 'WebSocket message payload exceeds 64 KB limit.'
            }))
            return

        try:
            data = json.loads(text_data)
        except Exception:
            return

        action = data.get('action') or data.get('type')
        now_iso = datetime.now(timezone.utc).isoformat()
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

        # Heartbeat Ping / Pong
        if action == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'channel': 'tracking',
                'server_timestamp': now_iso
            }))
            return

        if action in ['subscribe', 'subscribe_tracking']:
            order_id = data.get('order_id')
            token = data.get('token')

            is_authorized, err_msg = await self.authorize_tracking_subscription(order_id, token)
            if not is_authorized:
                await self.send(text_data=json.dumps({
                    'type': 'subscription_error',
                    'order_id': order_id,
                    'error': err_msg
                }))
                return

            group_name = f"order_tracking_{order_id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.subscribed_orders.add(order_id)
            await self.send(text_data=json.dumps({
                'type': 'subscribed',
                'order_id': order_id,
                'server_timestamp': now_iso,
                'message': f"Authorized live tracking subscription active for order #{order_id}"
            }))

        elif action in ['unsubscribe', 'unsubscribe_tracking']:
            order_id = data.get('order_id')
            if order_id in self.subscribed_orders:
                await self.channel_layer.group_discard(
                    f"order_tracking_{order_id}",
                    self.channel_name
                )
                self.subscribed_orders.remove(order_id)
                await self.send(text_data=json.dumps({
                    'type': 'unsubscribed',
                    'order_id': order_id
                }))

        elif action in ['location_update', 'publish_location']:
            order_id = data.get('order_id')
            token = data.get('token')
            is_authorized, _ = await self.authorize_tracking_subscription(order_id, token)
            if not is_authorized or not order_id:
                return

            lat = data.get('latitude')
            lng = data.get('longitude')
            try:
                lat = float(lat)
                lng = float(lng)
                if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
                    return  # Discard out-of-range coordinates
            except (ValueError, TypeError):
                return

            # Construct standardized location event with trusted server timestamp
            location_payload = {
                'event_id': str(uuid.uuid4()),
                'event_type': 'location_update',
                'schema_version': '1.0',
                'entity_type': 'order',
                'entity_id': order_id,
                'entity_version': now_ms,
                'server_timestamp': now_iso,
                'type': 'location_update',
                'order_id': order_id,
                'latitude': lat,
                'longitude': lng,
                'heading': data.get('heading', 0),
                'speed': data.get('speed', 0),
                'partner_name': data.get('partner_name', 'Courier Partner'),
                'is_live': True
            }

            await self.channel_layer.group_send(
                f"order_tracking_{order_id}",
                {
                    'type': 'tracking_event',
                    'payload': location_payload
                }
            )

    async def tracking_event(self, event):
        payload = event.get('payload', {})
        await self.send(text_data=json.dumps(payload))

    @database_sync_to_async
    def authorize_tracking_subscription(self, order_id, token=None):
        if not order_id:
            return False, "order_id is required."

        user = None
        if self.scope.get('user') and self.scope['user'].is_authenticated:
            user = self.scope['user']
        elif token:
            try:
                access = AccessToken(token)
                user = User.objects.filter(id=access['user_id']).first()
            except Exception:
                return False, "Invalid authentication token."

        if not user or not user.is_authenticated:
            return False, "Authentication required to subscribe to live tracking."

        order = None
        if str(order_id).isdigit():
            order = Order.objects.filter(pk=int(order_id)).first()
        if not order:
            order = Order.objects.filter(order_number=str(order_id)).first()

        if not order:
            return False, "Order not found."

        # Terminal state check
        if order.status in ['DELIVERED', 'CANCELLED']:
            return False, f"Live tracking is closed because order is already {order.status}."

        # Permission verification: Customer of order, Assigned delivery partner, or Staff
        if order.customer_id == user.id or order.rider_id == user.id or user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return True, None

        return False, "Permission denied. You cannot subscribe to another customer's live tracking."
