from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import Profile, Address, AuditLog
from apps.products.models import Restaurant, FoodItem
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment
from apps.adminpanel.models import PlatformConfig

User = get_user_model()


class Phase16AdminManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Admin User
        self.admin = User.objects.create_user(
            username='master_admin_p16',
            email='admin.p16@wsfood.io',
            password='AdminPassword123!',
            first_name='Master',
            last_name='Commander',
            role='ADMIN',
            is_staff=True,
            is_superuser=True
        )

        # 2. Customer User
        self.customer = User.objects.create_user(
            username='arjun_customer_p16',
            email='arjun.p16@example.com',
            password='Password123!',
            first_name='Arjun',
            last_name='Mehta',
            phone='+91 98765 44332',
            role='CUSTOMER'
        )
        self.customer_profile = Profile.objects.create(
            user=self.customer,
            full_name='Arjun Mehta',
            phone='+91 98765 44332',
            address='Penthouse 702, Skyline Residency'
        )

        # 3. Restaurant Owner & Restaurant
        self.restaurant_owner = User.objects.create_user(
            username='chef_vikram_p16',
            email='vikram.p16@example.com',
            password='Password123!',
            first_name='Vikram',
            role='RESTAURANT_OWNER'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Spice Route Bistro',
            owner_name='Chef Vikram',
            address='120 100ft Road, Indiranagar, Bengaluru',
            verification_status='PENDING',
            is_verified=False,
            is_open=True
        )

        # 4. Delivery Partner User & Profile
        self.rider_user = User.objects.create_user(
            username='rider_rahul_p16',
            email='rahul.p16@example.com',
            password='Password123!',
            first_name='Rahul',
            phone='+91 98765 11223',
            role='DELIVERY'
        )
        self.partner = DeliveryPartner.objects.create(
            user=self.rider_user,
            vehicle_type='Bike',
            vehicle_number='KA-03-FD-7788',
            verification_status='PENDING',
            is_verified=False,
            is_online=True
        )

        # 5. Active Order
        self.order = Order.objects.create(
            order_number='ORD-PHASE16-8801',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user,
            status='PREPARING',
            payment_status='PAID',
            item_total=Decimal('420.00'),
            delivery_fee=Decimal('35.00'),
            taxes=Decimal('21.00'),
            platform_fee=Decimal('15.00'),
            grand_total=Decimal('491.00'),
            total=Decimal('491.00'),
            delivery_address_text='Penthouse 702, Skyline Residency, HAL 2nd Stage'
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            food_name_snapshot='Dum Biryani Handi',
            unit_price_snapshot=Decimal('420.00'),
            quantity=1,
            item_total=Decimal('420.00')
        )

        # 6. Payment Record
        self.payment = Payment.objects.create(
            order=self.order,
            payment_provider='RAZORPAY',
            provider_order_id='order_p16_rzp_99001',
            provider_payment_id='pay_p16_rzp_99001',
            amount=Decimal('491.00'),
            status='PAID',
            payment_method='UPI'
        )

    # 1. Unauthenticated users cannot access Admin APIs
    def test_unauthenticated_user_cannot_access_admin_endpoints(self):
        endpoints = [
            '/api/adminpanel/overview/',
            '/api/adminpanel/customers/',
            '/api/adminpanel/restaurants/',
            '/api/adminpanel/partners/',
            '/api/adminpanel/orders/',
            '/api/adminpanel/payments/',
            '/api/adminpanel/reports/summary/',
            '/api/adminpanel/settings/',
            '/api/adminpanel/audit-logs/'
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {url} did not enforce authentication."
            )

    # 2. Customers, Restaurants, and Delivery Partners cannot access Admin APIs
    def test_non_admin_roles_cannot_access_admin_endpoints(self):
        unauthorized_users = [self.customer, self.restaurant_owner, self.rider_user]
        for user in unauthorized_users:
            self.client.force_authenticate(user=user)
            response = self.client.get('/api/adminpanel/overview/')
            self.assertEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"User {user.email} with role {user.role} was not rejected with 403 Forbidden."
            )

    # 3. Admin can access overview KPIs with real PostgreSQL aggregations
    def test_admin_can_access_overview_kpis(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/adminpanel/overview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        kpis = response.data['kpis']
        self.assertGreaterEqual(kpis['total_customers'], 1)
        self.assertGreaterEqual(kpis['total_restaurants'], 1)
        self.assertGreaterEqual(kpis['pending_restaurant_applications'], 1)
        self.assertGreaterEqual(kpis['total_delivery_partners'], 1)
        self.assertGreaterEqual(kpis['active_orders'], 1)
        self.assertEqual(kpis['payments']['paid_count'], 1)
        self.assertEqual(kpis['payments']['paid_total'], 491.00)
        self.assertIn('orders_over_time', response.data)
        self.assertIn('order_status_distribution', response.data)
        self.assertIn('recent_orders', response.data)

    # 4. Customer management: search, pagination, and suspension with reason
    def test_customer_management_search_and_suspension(self):
        self.client.force_authenticate(user=self.admin)

        # Search
        res_search = self.client.get(f'/api/adminpanel/customers/?q={self.customer.email}')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(res_search.data['count'], 1)
        cust_entry = res_search.data['results'][0]
        self.assertEqual(cust_entry['email'], self.customer.email)
        self.assertNotIn('password', cust_entry)

        # Suspension requires reason
        res_no_reason = self.client.post(f'/api/adminpanel/customers/{self.customer.id}/toggle-status/', {
            'is_active': False
        })
        self.assertEqual(res_no_reason.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason is required', res_no_reason.data['error'])

        # Valid suspension
        res_suspend = self.client.post(f'/api/adminpanel/customers/{self.customer.id}/toggle-status/', {
            'is_active': False,
            'reason': 'Customer requested voluntary account pause.'
        })
        self.assertEqual(res_suspend.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

        # Check Audit Log
        audit = AuditLog.objects.filter(target_model='User', target_id=str(self.customer.id)).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.action, 'CUSTOMER_SUSPENDED')
        self.assertEqual(audit.actor, self.admin)
        self.assertIn('voluntary account pause', audit.details['reason'])

    # 5. Admin cannot self-lockout or suspend privileged accounts
    def test_admin_cannot_self_lockout(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/adminpanel/customers/{self.admin.id}/toggle-status/', {
            'is_active': False,
            'reason': 'Attempting accidental self suspension.'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot suspend their own account', res.data['error'])

    # 6. Restaurant management: approval queue and verification
    def test_restaurant_verification_and_audit(self):
        self.client.force_authenticate(user=self.admin)

        # Verify restaurant list filter
        res_pending = self.client.get('/api/adminpanel/restaurants/?verification_status=PENDING')
        self.assertEqual(res_pending.status_code, status.HTTP_200_OK)
        self.assertTrue(any(r['id'] == self.restaurant.id for r in res_pending.data['results']))

        # Approve application
        res_approve = self.client.post(f'/api/adminpanel/restaurants/{self.restaurant.id}/verify/', {
            'status': 'APPROVED',
            'reason': 'Valid FSSAI license and health inspection documentation verified.'
        })
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)
        self.restaurant.refresh_from_db()
        self.assertEqual(self.restaurant.verification_status, 'APPROVED')
        self.assertTrue(self.restaurant.is_verified)

        # Audit log verified
        audit = AuditLog.objects.filter(target_model='Restaurant', target_id=str(self.restaurant.id)).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.action, 'RESTAURANT_APPROVED')

    # 7. Delivery Partner management: onboarding verification and suspension
    def test_delivery_partner_verification_and_suspension(self):
        self.client.force_authenticate(user=self.admin)

        # Approve partner onboarding
        res_approve = self.client.post(f'/api/adminpanel/partners/{self.partner.id}/verify/', {
            'status': 'APPROVED',
            'reason': 'Commercial driving license and EV registration verified.'
        })
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)
        self.partner.refresh_from_db()
        self.assertEqual(self.partner.verification_status, 'APPROVED')
        self.assertTrue(self.partner.is_verified)

        # Suspend partner with reason
        res_suspend = self.client.post(f'/api/adminpanel/partners/{self.partner.id}/toggle-status/', {
            'is_active': False,
            'reason': 'Vehicle maintenance scheduled.'
        })
        self.assertEqual(res_suspend.status_code, status.HTTP_200_OK)
        self.rider_user.refresh_from_db()
        self.assertFalse(self.rider_user.is_active)

    # 8. Order management: search, filters, and status intervention
    def test_order_status_intervention_with_history(self):
        self.client.force_authenticate(user=self.admin)

        # Search order
        res_search = self.client.get(f'/api/adminpanel/orders/?q={self.order.order_number}')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(res_search.data['count'], 1)

        # Intervene status
        res_intervene = self.client.post(f'/api/adminpanel/orders/{self.order.id}/status-intervention/', {
            'to_status': 'CANCELLED',
            'reason': 'Kitchen ingredient power outage reported by merchant.'
        })
        self.assertEqual(res_intervene.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'CANCELLED')
        self.assertIn('Kitchen ingredient power outage', self.order.cancellation_reason)

        # Verify OrderStatusHistory record
        history = OrderStatusHistory.objects.filter(order=self.order, to_status='CANCELLED').first()
        self.assertIsNotNone(history)
        self.assertEqual(history.actor_role, 'ADMIN')
        self.assertEqual(history.actor, self.admin)
        self.assertIn('power outage', history.reason)

    # 9. Payment records reconciliation and separation of status
    def test_payment_management_and_reconciliation(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(f'/api/adminpanel/payments/{self.payment.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        self.assertEqual(data['provider_order_id'], 'order_p16_rzp_99001')
        self.assertEqual(data['status'], 'PAID')
        self.assertEqual(float(data['amount']), 491.00)
        # Verify secret keys are not exposed
        self.assertNotIn('secret', str(data))
        self.assertNotIn('key_secret', str(data))

    # 10. Reports summary and CSV export streaming with PII masking
    def test_reports_summary_and_csv_export(self):
        self.client.force_authenticate(user=self.admin)

        # Summary
        res_sum = self.client.get('/api/adminpanel/reports/summary/')
        self.assertEqual(res_sum.status_code, status.HTTP_200_OK)
        self.assertIn('orders_summary', res_sum.data)
        self.assertIn('payments_by_status', res_sum.data)

        # CSV Export
        res_csv = self.client.get('/api/adminpanel/reports/export-csv/?report_type=orders')
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv['Content-Type'], 'text/csv; charset=utf-8')
        content = res_csv.content.decode('utf-8')
        self.assertIn('Order Number', content)
        self.assertIn(self.order.order_number, content)
        # Ensure customer phone/email not leaked directly in CSV customer column
        self.assertNotIn(self.customer.phone, content)

    # 11. Platform Settings management and validation
    def test_platform_settings_management(self):
        self.client.force_authenticate(user=self.admin)

        # Get settings
        res_get = self.client.get('/api/adminpanel/settings/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertIn('platform_commission_percentage', res_get.data['settings'])

        # Update valid settings
        res_patch = self.client.patch('/api/adminpanel/settings/', {
            'platform_commission_percentage': 15.5,
            'base_delivery_fee': 40.0,
            'reason': 'Adjusted fee corridor for Q4 operations.'
        })
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['settings']['platform_commission_percentage'], 15.5)

        # Validate out-of-bounds rejection
        res_invalid = self.client.patch('/api/adminpanel/settings/', {
            'platform_commission_percentage': 85.0  # > 50%
        })
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot exceed 50%', res_invalid.data['error'])

    # 12. Audit logs are immutable and accessible to Admin
    def test_audit_logs_read_only(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/adminpanel/audit-logs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Attempt to POST (mutation) is forbidden
        res_mutate = self.client.post('/api/adminpanel/audit-logs/', {'action': 'FAKE_ACTION'})
        self.assertEqual(res_mutate.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
