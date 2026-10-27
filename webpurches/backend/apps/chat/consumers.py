"""
Order/ticket chat WebSocket consumer (Phase 8).

- In-band JWT authentication (same convention as EcosystemConsumer).
- subscribe_chat {conversation_id} only for participants.
- chat_send {conversation_id, content} persists to the DB first, then
  broadcasts to chat_conversation_<id>. Client broadcasts are rejected.
- 64 KB payload guard, group cleanup on disconnect.
"""
import json
from datetime import datetime, timezone

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User
from apps.chat.models import Conversation, Message

MAX_MESSAGE_LEN = 5000


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = None
        self.joined_groups = set()
        await self.accept()
        scope_user = self.scope.get('user')
        if scope_user and scope_user.is_authenticated:
            self.user = scope_user
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'channel': 'chat',
            'authenticated': bool(self.user),
            'server_timestamp': datetime.now(timezone.utc).isoformat(),
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
            return await self._error('PAYLOAD_TOO_LARGE', 'Payload exceeds 64 KB limit.')
        try:
            data = json.loads(text_data)
        except Exception:
            return await self._error('MALFORMED_JSON', 'Malformed JSON string.')

        action = data.get('action') or data.get('type')
        if action == 'ping':
            return await self.send(text_data=json.dumps({
                'type': 'pong',
                'client_timestamp': data.get('timestamp'),
                'server_timestamp': datetime.now(timezone.utc).isoformat(),
            }))
        if action in ('authenticate', 'auth', 'login'):
            user = await self._authenticate_token(data.get('token'))
            if not user:
                return await self.send(text_data=json.dumps({
                    'type': 'auth_error',
                    'message': 'Invalid or expired authentication token.',
                }))
            self.user = user
            return await self.send(text_data=json.dumps({
                'type': 'authenticated',
                'user_id': user.id,
                'server_timestamp': datetime.now(timezone.utc).isoformat(),
            }))
        if action in ('subscribe_chat', 'subscribe'):
            return await self._handle_subscribe(data)
        if action in ('chat_send', 'send_message'):
            return await self._handle_send(data)
        return await self._error('UNKNOWN_ACTION', 'Unknown action: %s' % action)

    async def _error(self, code, message):
        await self.send(text_data=json.dumps({'type': 'error', 'code': code, 'message': message}))

    async def _handle_subscribe(self, data):
        conv_id = data.get('conversation_id')
        if not self.user and data.get('token'):
            self.user = await self._authenticate_token(data.get('token'))
        ok, err, conv = await self._authorize_conversation(conv_id)
        if not ok:
            return await self.send(text_data=json.dumps({
                'type': 'subscription_error',
                'conversation_id': conv_id,
                'error': err or 'Unauthorized chat subscription.',
            }))
        group = 'chat_conversation_%s' % conv.id
        await self.channel_layer.group_add(group, self.channel_name)
        self.joined_groups.add(group)
        history = await self._recent_messages(conv.id, limit=30)
        return await self.send(text_data=json.dumps({
            'type': 'subscribed',
            'conversation_id': conv.id,
            'history': history,
            'server_timestamp': datetime.now(timezone.utc).isoformat(),
        }))

    async def _handle_send(self, data):
        conv_id = data.get('conversation_id')
        content = (data.get('content') or '').strip()
        if not self.user and data.get('token'):
            self.user = await self._authenticate_token(data.get('token'))
        ok, err, conv = await self._authorize_conversation(conv_id)
        if not ok:
            return await self.send(text_data=json.dumps({
                'type': 'message_error',
                'conversation_id': conv_id,
                'error': err or 'Unauthorized.',
            }))
        if not content:
            return await self.send(text_data=json.dumps({
                'type': 'message_error', 'error': 'Message content is required.'}))
        if len(content) > MAX_MESSAGE_LEN:
            return await self.send(text_data=json.dumps({
                'type': 'message_error', 'error': 'Message too long.'}))
        msg = await self._persist_message(conv.id, self.user.id, content)
        payload = {
            'type': 'chat_message',
            'conversation_id': conv.id,
            'message': msg,
            'server_timestamp': datetime.now(timezone.utc).isoformat(),
        }
        await self.channel_layer.group_send(
            'chat_conversation_%s' % conv.id,
            {'type': 'chat_event', 'payload': payload})

    async def chat_event(self, event):
        await self.send(text_data=json.dumps(event.get('payload', {})))

    @database_sync_to_async
    def _authenticate_token(self, token_str):
        try:
            access = AccessToken(token_str)
            return User.objects.filter(id=access['user_id'], is_active=True).first()
        except Exception:
            return None

    @database_sync_to_async
    def _authorize_conversation(self, conv_id):
        if not self.user:
            return False, 'Authentication required.', None
        try:
            conv_id = int(conv_id)
        except (TypeError, ValueError):
            return False, 'conversation_id is required.', None
        conv = Conversation.objects.filter(id=conv_id).first()
        if not conv:
            return False, 'Conversation not found.', None
        if not conv.is_participant(self.user):
            return False, 'You are not a participant of this conversation.', None
        return True, None, conv

    @database_sync_to_async
    def _recent_messages(self, conv_id, limit=30):
        msgs = Message.objects.filter(conversation_id=conv_id).select_related(
            'sender').order_by('-timestamp')[:limit]
        return [self._msg_dict(m) for m in reversed(list(msgs))]

    @database_sync_to_async
    def _persist_message(self, conv_id, user_id, content):
        msg = Message.objects.create(
            conversation_id=conv_id, sender_id=user_id, content=content)
        return self._msg_dict(msg)

    @staticmethod
    def _msg_dict(m):
        sender = getattr(m, 'sender', None)
        ts = getattr(m, 'timestamp', None)
        return {
            'id': m.id,
            'conversation_id': m.conversation_id,
            'sender_id': m.sender_id,
            'sender': sender.username if sender else '',
            'content': m.content,
            'is_read': m.is_read,
            'timestamp': ts.isoformat() if ts else None,
        }
