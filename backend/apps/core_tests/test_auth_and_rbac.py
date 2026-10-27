"""
Fast Delivery (FD) - Authentication & Role-Based Access Control (RBAC) Test Suite
Tests JWT issuance, refresh, registration validation, role lockout, and strict object-level isolation.
"""

from decimal import Decimal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_order,
    create_test_rider
)


class AuthenticationAndRBACTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer1 = create_test_user(role='CUSTOMER', username='cust_auth_1', email='cust1@testfd.io')
        self.customer2 = create_test_user(role='CUSTOMER', username='cust_auth_2', email='cust2@testfd.io')
        self.restaurant_owner1 = create_test_user(role='SHOP', username='owner_auth_1', email='owner1@testfd.io')
        self.restaurant_owner2 = create_test_user(role='SHOP', username='owner_auth_2', email='owner2@testfd.io')
        self.restaurant1 = create_test_restaurant(owner=self.restaurant_owner1, name='Spice Fusion')
        self.restaurant2 = create_test_restaurant(owner=self.restaurant_owner2, name='Burger Hub')
        self.rider = create_test_rider()
        self.admin = create_test_user(role='ADMIN', username='admin_auth_1', email='admin1@testfd.io')

    # --------------------------------------------------------------------------
    # 1. Authentication Tests
    # --------------------------------------------------------------------------
    def test_successful_login_returns_jwt_tokens(self):
        """Valid credentials return access and refresh JWT tokens."""
        res = self.client.post('/api/auth/login/', {
            'username': 'cust_auth_1',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', res.data)
        self.assertIn('refresh_token', res.data)
        self.assertEqual(res.data.get('user', {}).get('role'), 'CUSTOMER')

    def test_invalid_login_rejected(self):
        """Invalid credentials return HTTP 401 Unauthorized."""
        res = self.client.post('/api/auth/login/', {
            'username': 'cust_auth_1',
            'password': 'WrongPassword999!'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_registration_success(self):
        """Valid customer registration creates active user with role CUSTOMER."""
        res = self.client.post('/api/auth/register/customer/', {
            'full_name': 'Ravi Kumar',
            'email': 'ravi.new@testfd.io',
            'phone': '9876543219',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'address': '22 Gandhi Road, Chennai'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='ravi.new@testfd.io').exists())

    def test_duplicate_registration_rejected(self):
        """Registering with an existing email returns HTTP 400 Bad Request."""
        res = self.client.post('/api/auth/register/customer/', {
            'full_name': 'Duplicate User',
            'email': 'cust1@testfd.io',
            'phone': '9876543218',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'address': '22 Gandhi Road, Chennai'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_role_escalation_blocked_on_public_endpoint(self):
        """Public register endpoint forbids role 'ADMIN' (SEC-06)."""
        res = self.client.post('/api/auth/register/', {
            'username': 'evil_admin',
            'email': 'evil_admin@testfd.io',
            'password': 'StrongPassword123!',
            'role': 'ADMIN'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(email='evil_admin@testfd.io').exists())

    def test_jwt_token_refresh(self):
        """Valid refresh token yields a new valid access token."""
        login_res = self.client.post('/api/auth/login/', {
            'username': 'cust_auth_1',
            'password': 'Password123!'
        })
        refresh_token = login_res.data.get('refresh_token') or login_res.data.get('tokens', {}).get('refresh')
        self.assertTrue(refresh_token)

        res = self.client.post('/api/auth/token/refresh/', {
            'refresh': refresh_token
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_unauthenticated_protected_endpoint_rejected(self):
        """Anonymous requests to protected endpoints return HTTP 401."""
        res = self.client.get('/api/orders/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --------------------------------------------------------------------------
    # 2. RBAC & Object-Level Isolation Tests
    # --------------------------------------------------------------------------
    def test_customer_cannot_view_another_customers_order(self):
        """Customer 2 cannot view details of an order placed by Customer 1."""
        order = create_test_order(customer=self.customer1, restaurant=self.restaurant1)

        # Customer 2 attempts to view Customer 1's order
        self.client.force_authenticate(user=self.customer2)
        res = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 1 can view their own order
        self.client.force_authenticate(user=self.customer1)
        res_own = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(res_own.status_code, status.HTTP_200_OK)

    def test_restaurant_owner_cannot_access_foreign_payouts(self):
        """Restaurant Owner 2 cannot view Restaurant 1 payouts (SEC-04)."""
        self.client.force_authenticate(user=self.restaurant_owner2)
        res = self.client.get(f'/api/restaurants/{self.restaurant1.id}/payouts/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_restaurant_owner_cannot_export_foreign_orders_csv(self):
        """Restaurant Owner 2 cannot export orders CSV for Restaurant 1 (SEC-04)."""
        self.client.force_authenticate(user=self.restaurant_owner2)
        res = self.client.get(f'/api/restaurants/{self.restaurant1.id}/export-orders-csv/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_access_ecosystem_telemetry(self):
        """Customers and riders are forbidden from ecosystem telemetry (SEC-03)."""
        self.client.force_authenticate(user=self.customer1)
        res = self.client.get('/api/admin/ecosystem-telemetry/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get('/api/admin/ecosystem-telemetry/')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

    def test_customer_cannot_trigger_refund(self):
        """Only administrators can trigger payment refunds (SEC-01)."""
        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/payments/refund/', {'order_id': 999, 'amount': 100})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
