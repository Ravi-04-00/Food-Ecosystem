"""Order chat tests: REST membership + persisted WebSocket messaging."""
import json

from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.chat.models import Conversation, Message
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_order,
)


def _jwt(user):
    return str(RefreshToken.for_user(user).access_token)


class ChatRestTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='chat_cust_1', email='chat1@testfd.io')
        self.owner = create_test_user(
            role='SHOP', username='chat_owner_1', email='chatowner1@testfd.io')
        self.stranger = create_test_user(
            role='CUSTOMER', username='chat_stranger_1', email='chatstr1@testfd.io')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Chat Kitchen')
        self.order = create_test_order(
            customer=self.customer, restaurant=self.restaurant, status='PREPARING')
        self.client.force_authenticate(user=self.customer)

    def test_create_order_conversation_and_message(self):
        res = self.client.post('/api/chat/conversations/', {
            'customer': self.customer.id, 'seller': self.owner.id,
            'order': self.order.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        cid = res.data['id']

        res = self.client.post('/api/chat/messages/', {
            'conversation': cid, 'content': 'Where is my order?'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        res = self.client.get(f'/api/chat/messages/?conversation={cid}')
        self.assertEqual(len(res.data['results'] if isinstance(res.data, dict) else res.data), 1)

    def test_stranger_isolated(self):
        conv = Conversation.objects.create(
            customer=self.customer, seller=self.owner, order=self.order)
        self.client.force_authenticate(user=self.stranger)
        res = self.client.get(f'/api/chat/messages/?conversation={conv.id}')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(len(items), 0)
        res = self.client.post('/api/chat/messages/', {
            'conversation': conv.id, 'content': 'Hijack'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_link_requires_visibility(self):
        self.client.force_authenticate(user=self.stranger)
        res = self.client.post('/api/chat/conversations/', {
            'customer': self.stranger.id, 'seller': self.owner.id,
            'order': self.order.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_read_receipt(self):
        conv = Conversation.objects.create(
            customer=self.customer, seller=self.owner, order=self.order)
        msg = Message.objects.create(conversation=conv, sender=self.owner, content='On the way')
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(f'/api/chat/messages/{msg.id}/read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/chat/messages/{msg.id}/read/')
        self.assertTrue(res.data['is_read'])


class ChatWebSocketTestCase(TransactionTestCase):
    def test_subscribe_send_persist_and_isolation(self):
        from config.asgi import application  # noqa: E402

        customer = create_test_user(
            role='CUSTOMER', username='chatws_cust_1', email='chatws1@testfd.io')
        owner = create_test_user(
            role='SHOP', username='chatws_owner_1', email='chatwsowner1@testfd.io')
        stranger = create_test_user(
            role='CUSTOMER', username='chatws_str_1', email='chatwsstr1@testfd.io')
        restaurant = create_test_restaurant(owner=owner, name='WS Kitchen')
        order = create_test_order(customer=customer, restaurant=restaurant, status='PREPARING')
        conv = Conversation.objects.create(customer=customer, seller=owner, order=order)
        customer_token = _jwt(customer)
        stranger_token = _jwt(stranger)

        async def scenario():
            comm = WebsocketCommunicator(application, '/FD/chat/')
            connected, _ = await comm.connect()
            assert connected
            msg = await comm.receive_json_from()
            assert msg['type'] == 'connection_established'

            # Unauthenticated subscribe rejected
            await comm.send_json_to({'action': 'subscribe_chat', 'conversation_id': conv.id})
            resp = await comm.receive_json_from()
            assert resp['type'] == 'subscription_error', resp

            # Auth + subscribe + history
            await comm.send_json_to({'action': 'authenticate', 'token': customer_token})
            resp = await comm.receive_json_from()
            assert resp['type'] == 'authenticated', resp
            await comm.send_json_to({'action': 'subscribe_chat', 'conversation_id': conv.id})
            resp = await comm.receive_json_from()
            assert resp['type'] == 'subscribed', resp
            assert resp['conversation_id'] == conv.id

            # Send persists + broadcasts back
            await comm.send_json_to(
                {'action': 'chat_send', 'conversation_id': conv.id, 'content': 'Hello kitchen'})
            resp = await comm.receive_json_from()
            assert resp['type'] == 'chat_message', resp
            assert resp['message']['content'] == 'Hello kitchen'
            await comm.disconnect()

            # Stranger blocked even with valid token
            comm2 = WebsocketCommunicator(application, '/FD/chat/')
            await comm2.connect()
            await comm2.receive_json_from()
            await comm2.send_json_to({'action': 'authenticate', 'token': stranger_token})
            await comm2.receive_json_from()
            await comm2.send_json_to(
                {'action': 'chat_send', 'conversation_id': conv.id, 'content': 'Hijack'})
            resp = await comm2.receive_json_from()
            assert resp['type'] == 'message_error', resp
            await comm2.disconnect()

        import asyncio
        asyncio.run(scenario())
        self.assertEqual(Message.objects.filter(conversation=conv).count(), 1)
        self.assertEqual(Message.objects.get(conversation=conv).content, 'Hello kitchen')
