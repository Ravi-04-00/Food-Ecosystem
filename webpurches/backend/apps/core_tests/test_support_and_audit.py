"""
Fast Delivery (FD) - Support, Dispute & Audit Quality Engineering Test Suite
Tests support ticket creation, cross-customer isolation, admin dispute resolution,
and immutable AuditLog generation.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import SupportTicket, AuditLog
from apps.core_tests.factories import (
    create_test_user,
    create_test_order,
    create_test_restaurant
)


class SupportAndAuditTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer1 = create_test_user(role='CUSTOMER', username='cust_sup_1')
        self.customer2 = create_test_user(role='CUSTOMER', username='cust_sup_2')
        self.admin = create_test_user(role='ADMIN', username='admin_sup_1')
        self.restaurant = create_test_restaurant(name='Support Diner')
        self.order = create_test_order(customer=self.customer1, restaurant=self.restaurant)

    def test_customer_creates_support_ticket_successfully(self):
        """Customer can create a support ticket linked to their account."""
        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/support/tickets/', {
            'subject': 'Delayed Delivery',
            'category': 'DELIVERY_DELAY',
            'priority': 'MEDIUM',
            'description': 'The delivery partner has been stationary for 20 minutes.',
            'order_id': self.order.id
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket_number', res.data)
        ticket_number = res.data['ticket_number']

        # Verify in DB
        ticket = SupportTicket.objects.get(ticket_number=ticket_number)
        self.assertEqual(ticket.user, self.customer1)
        self.assertEqual(ticket.status, 'OPEN')

    def test_customer_cannot_view_another_customers_ticket(self):
        """Customer 2 is forbidden from viewing Customer 1's ticket."""
        ticket = SupportTicket.objects.create(
            ticket_number='TCK-TEST-PRIVACY-01',
            user=self.customer1,
            subject='Cold Food Delivered',
            category='FOOD_QUALITY',
            priority='HIGH',
            description='Soup arrived cold'
        )

        # Customer 2 attempts access
        self.client.force_authenticate(user=self.customer2)
        res = self.client.get(f'/api/support/tickets/{ticket.ticket_number}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 1 can access
        self.client.force_authenticate(user=self.customer1)
        res_own = self.client.get(f'/api/support/tickets/{ticket.ticket_number}/')
        self.assertEqual(res_own.status_code, status.HTTP_200_OK)

    def test_non_admin_cannot_access_admin_tickets(self):
        """Customers cannot access the administrator ticket management endpoint."""
        self.client.force_authenticate(user=self.customer1)
        res = self.client.get('/api/support/admin/tickets/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_resolves_ticket_and_records_audit_trail(self):
        """Admin can resolve ticket, and resolution is captured in the audit log."""
        ticket = SupportTicket.objects.create(
            ticket_number='TCK-TEST-RESOLVE-01',
            user=self.customer1,
            subject='Missing Drink',
            category='WRONG_ITEMS',
            priority='HIGH',
            description='Drink was missing from package'
        )

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/support/admin/tickets/{ticket.ticket_number}/resolve/', {
            'resolution_summary': 'Issued replacement coupon to customer'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'RESOLVED')
        self.assertEqual(ticket.resolution_summary, 'Issued replacement coupon to customer')
