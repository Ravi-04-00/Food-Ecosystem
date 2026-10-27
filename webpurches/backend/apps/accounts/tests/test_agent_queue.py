"""Support-agent queue tests (flag-only access, never superuser)."""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import SupportTicket
from apps.core_tests.factories import create_test_user


class AgentQueueTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='agentq_cust_1', email='agentq1@testfd.io')
        self.agent = create_test_user(
            role='CUSTOMER', username='agentq_agent_1', email='agent1@testfd.io')
        self.agent.is_support_agent = True
        self.agent.save()
        self.other_agent = create_test_user(
            role='CUSTOMER', username='agentq_agent_2', email='agent2@testfd.io')
        self.other_agent.is_support_agent = True
        self.other_agent.save()
        self.ticket = SupportTicket.objects.create(
            ticket_number='T-AGENT-001', user=self.customer,
            subject='Cold food', description='Arrived cold',
            category='DAMAGED_FOOD', status='OPEN')

    def test_non_agent_blocked(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get('/api/support/agent/queue/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_queue_claim_reply_flow(self):
        self.client.force_authenticate(user=self.agent)
        res = self.client.get('/api/support/agent/queue/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['unassigned_pool']), 1)

        res = self.client.post('/api/support/agent/tickets/T-AGENT-001/claim/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'IN_PROGRESS')

        res = self.client.post('/api/support/agent/tickets/T-AGENT-001/reply/',
                               {'message': 'Resending fresh item'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        res = self.client.get('/api/support/agent/queue/')
        self.assertEqual(len(res.data['assigned_to_me']), 1)
        self.assertEqual(len(res.data['unassigned_pool']), 0)

    def test_other_agent_cannot_steal_or_reply(self):
        self.client.force_authenticate(user=self.agent)
        self.client.post('/api/support/agent/tickets/T-AGENT-001/claim/')
        self.client.force_authenticate(user=self.other_agent)
        res = self.client.post('/api/support/agent/tickets/T-AGENT-001/claim/')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        res = self.client.post('/api/support/agent/tickets/T-AGENT-001/reply/',
                               {'message': 'Hi'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.get('/api/support/agent/tickets/T-AGENT-001/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_agent_has_no_admin_powers(self):
        self.assertFalse(self.agent.is_staff)
        self.assertFalse(self.agent.is_superuser)
        self.client.force_authenticate(user=self.agent)
        res = self.client.get('/api/adminpanel/overview/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_agent_call_queue_scoped(self):
        self.client.force_authenticate(user=self.agent)
        res = self.client.get('/api/support/agent/calls/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.client.force_authenticate(user=self.customer)
        res = self.client.get('/api/support/agent/calls/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
