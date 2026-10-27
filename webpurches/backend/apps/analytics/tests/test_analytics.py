import json
from datetime import datetime, timedelta
from decimal import Decimal
import pytz

from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem, Category
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.coupons.models import Coupon, CouponRedemption
from apps.reviews.models import Review
from apps.accounts.models import AuditLog
from apps.analytics.metric_definitions import METRIC_DEFINITIONS, REPORTING_TIMEZONE


class Phase21AnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tz = pytz.timezone(REPORTING_TIMEZONE)

        # 1. Users & Roles
        self.admin_user = User.objects.create_superuser(
            username='admin_bi_tester',
            email='admin_bi@wsfood.io',
            password='AdminPassword123!',
            role='ADMIN'
        )

        self.rest_owner_1 = User.objects.create_user(
            username='chef_priya',
            email='priya@kitchen.io',
            password='PriyaPassword123!',
            role='RESTAURANT'
        )

        self.rest_owner_2 = User.objects.create_user(
            username='chef_arjun',
            email='arjun@kitchen.io',
            password='ArjunPassword123!',
            role='RESTAURANT'
        )

        self.rider_user_1 = User.objects.create_user(
            username='rider_karthik',
            email='karthik@rider.io',
            password='RiderPassword123!',
            role='DELIVERY'
        )

        self.rider_user_2 = User.objects.create_user(
            username='rider_suresh',
            email='suresh@rider.io',
            password='RiderPassword123!',
            role='DELIVERY'
        )

        self.customer = User.objects.create_user(
            username='foodie_deepa',
            email='deepa@customer.io',
            password='DeepaPassword123!',
            role='CUSTOMER'
        )

        # 2. Restaurants
        self.restaurant_1 = Restaurant.objects.create(
            name="Chettinad Heritage Kitchen",
            owner=self.rest_owner_1,
            is_open=True,
            is_verified=True,
            verification_status='APPROVED',
            rating=Decimal('4.9'),
            cuisines=["Chettinad"]
        )

        self.restaurant_2 = Restaurant.objects.create(
            name="Madras Tiffin Center",
            owner=self.rest_owner_2,
            is_open=True,
            is_verified=True,
            verification_status='APPROVED',
            rating=Decimal('4.7'),
            cuisines=["South Indian"]
        )

        # 3. Delivery Partner Profiles
        self.partner_1 = DeliveryPartner.objects.create(
            user=self.rider_user_1,
            vehicle_type='Bike',
            vehicle_number='TN-01-FD-2026',
            is_online=True,
            is_verified=True,
            verification_status='APPROVED',
            rating=Decimal('4.95')
        )

        self.partner_2 = DeliveryPartner.objects.create(
            user=self.rider_user_2,
            vehicle_type='Scooter',
            vehicle_number='TN-02-FD-8899',
            is_online=False,
            is_verified=True,
            verification_status='APPROVED',
            rating=Decimal('4.80')
        )

        # 4. Categories & Food Items
        self.category = Category.objects.create(name='Biryani & Rice', slug='biryani-rice')
        self.food_biryani = FoodItem.objects.create(
            restaurant=self.restaurant_1,
            category=self.category,
            name='Chettinad Chicken Biryani',
            slug='chettinad-chicken-biryani',
            price=Decimal('320.00'),
            is_available=True,
            rating=Decimal('4.9')
        )
        self.food_dosa = FoodItem.objects.create(
            restaurant=self.restaurant_2,
            category=self.category,
            name='Ghee Podi Roast Dosa',
            slug='ghee-podi-roast-dosa',
            price=Decimal('150.00'),
            is_available=True,
            rating=Decimal('4.8')
        )

        # 5. Orders & Payments Dataset
        now = timezone.now()

        # Order 1: Completed delivery from Restaurant 1
        self.order_1 = Order.objects.create(
            order_number='ORD-BI-1001',
            customer=self.customer,
            restaurant=self.restaurant_1,
            rider=self.rider_user_1,
            status='DELIVERED',
            item_total=Decimal('640.00'),
            subtotal=Decimal('640.00'),
            delivery_fee=Decimal('40.00'),
            packaging_fee=Decimal('20.00'),
            platform_fee=Decimal('15.00'),
            grand_total=Decimal('715.00'),
            payment_status='PAID'
        )
        OrderItem.objects.create(
            order=self.order_1,
            food_item=self.food_biryani,
            food_name_snapshot='Chettinad Chicken Biryani',
            unit_price_snapshot=Decimal('320.00'),
            quantity=2,
            item_total=Decimal('640.00')
        )
        self.payment_1 = Payment.objects.create(
            order=self.order_1,
            amount=Decimal('715.00'),
            status='PAID',
            payment_method='UPI',
            provider_payment_id='pay_success_1001',
            verified_at=now
        )
        # Assignment 1 with valid timestamps
        t_pickup_1 = now - timedelta(minutes=25)
        t_drop_1 = now - timedelta(minutes=5)
        self.assignment_1 = DeliveryAssignment.objects.create(
            order=self.order_1,
            delivery_partner=self.rider_user_1,
            status='DELIVERED',
            picked_up_at=t_pickup_1,
            delivered_at=t_drop_1
        )

        # Order 2: Cancelled order with verified refund from Restaurant 1
        self.order_2 = Order.objects.create(
            order_number='ORD-BI-1002',
            customer=self.customer,
            restaurant=self.restaurant_1,
            status='CANCELLED',
            item_total=Decimal('320.00'),
            subtotal=Decimal('320.00'),
            delivery_fee=Decimal('30.00'),
            grand_total=Decimal('350.00'),
            cancellation_reason='Customer requested cancellation prior to kitchen prep',
            payment_status='REFUNDED'
        )
        self.payment_2 = Payment.objects.create(
            order=self.order_2,
            amount=Decimal('350.00'),
            status='REFUNDED',
            refund_amount=Decimal('350.00'),
            payment_method='CARD',
            provider_payment_id='pay_refunded_1002',
            refunded_at=now,
            verified_at=now
        )

        # Order 3: Active in-flight order with pending payment
        self.order_3 = Order.objects.create(
            order_number='ORD-BI-1003',
            customer=self.customer,
            restaurant=self.restaurant_2,
            status='PREPARING',
            item_total=Decimal('150.00'),
            subtotal=Decimal('150.00'),
            delivery_fee=Decimal('30.00'),
            grand_total=Decimal('180.00'),
            payment_status='PAYMENT_PENDING'
        )
        self.payment_3 = Payment.objects.create(
            order=self.order_3,
            amount=Decimal('180.00'),
            status='PAYMENT_PENDING',
            payment_method='UPI'
        )

        # Order 4: Failed payment attempt
        self.order_4 = Order.objects.create(
            order_number='ORD-BI-1004',
            customer=self.customer,
            restaurant=self.restaurant_2,
            status='PLACED',
            item_total=Decimal('300.00'),
            grand_total=Decimal('330.00'),
            payment_status='FAILED'
        )
        self.payment_4 = Payment.objects.create(
            order=self.order_4,
            amount=Decimal('330.00'),
            status='FAILED',
            failure_code='BAD_PIN',
            failure_description='Incorrect UPI PIN entered'
        )

        # Reviews
        Review.objects.create(
            user=self.customer,
            order=self.order_1,
            target_type='RESTAURANT',
            restaurant=self.restaurant_1,
            rating=5,
            food_quality_rating=5,
            packaging_rating=5,
            moderation_status='APPROVED'
        )
        Review.objects.create(
            user=self.customer,
            order=self.order_1,
            target_type='DELIVERY_PARTNER',
            delivery_partner=self.rider_user_1,
            rating=5,
            delivery_rating=5,
            moderation_status='APPROVED'
        )

    def test_01_metric_definitions_endpoint(self):
        """Verifies GET /api/analytics/definitions/ returns authoritative definitions."""
        url = reverse('analytics_metric_definitions')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn('metric_definitions', data)
        self.assertIn('gross_order_value', data['metric_definitions'])
        self.assertIn('captured_payments', data['metric_definitions'])
        self.assertIn('verified_refunds', data['metric_definitions'])
        self.assertEqual(data['reporting_timezone'], REPORTING_TIMEZONE)

    def test_02_admin_analytics_summary_calculation(self):
        """
        Verifies Admin Analytics summary calculations:
        - Total orders: 4 (1 delivered, 1 cancelled, 1 preparing, 1 placed)
        - Completed orders: 1
        - Cancelled orders: 1
        - GOV: 715 + 350 + 180 + 330 = 1575
        - Captured payments: 715 (Order 1 only)
        - Pending payments: 180 (Order 3)
        - Failed payments: 330 (Order 4)
        - Verified refunds: 350 (Order 2)
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('analytics_admin_summary')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()['summary']

        self.assertEqual(data['total_orders'], 4)
        self.assertEqual(data['completed_orders'], 1)
        self.assertEqual(data['cancelled_orders'], 1)
        self.assertEqual(data['in_flight_orders'], 2)
        self.assertEqual(data['gross_order_value'], 1575.0)
        self.assertEqual(data['net_completed_order_value'], 715.0)
        self.assertEqual(data['verified_captured_payments'], 715.0)
        self.assertEqual(data['unverified_pending_payments'], 180.0)
        self.assertEqual(data['failed_payments'], 330.0)
        self.assertEqual(data['verified_refunds'], 350.0)
        self.assertEqual(data['average_order_value'], round(1575.0 / 4, 2))
        self.assertEqual(data['active_restaurants'], 2)
        self.assertEqual(data['active_delivery_partners'], 1)

    def test_03_admin_analytics_charts_endpoint(self):
        """Verifies GET /api/analytics/admin/charts/ returns distributions and trends."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('analytics_admin_charts')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn('charts', data)
        charts = data['charts']
        self.assertIn('orders_timeline', charts)
        self.assertIn('payment_status_distribution', charts)
        self.assertIn('order_status_distribution', charts)
        self.assertIn('restaurant_performance', charts)
        self.assertIn('delivery_trends', charts)
        self.assertIn('cancellation_reasons', charts)

    def test_04_admin_csv_export_endpoint(self):
        """Verifies GET /api/analytics/admin/export/ streams CSV and creates audit log."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('analytics_admin_export') + '?report_type=orders'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/csv', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('Order ID,Order Number,Restaurant', content)
        self.assertIn('ORD-BI-1001', content)

        # Verify audit log was created
        audit_exists = AuditLog.objects.filter(
            actor=self.admin_user,
            action='ANALYTICS_CSV_EXPORT_ORDERS'
        ).exists()
        self.assertTrue(audit_exists)

    def test_05_restaurant_owner_can_view_own_analytics(self):
        """Verifies restaurant owner can view their own analytics."""
        self.client.force_authenticate(user=self.rest_owner_1)
        url = reverse('analytics_restaurant_detail', kwargs={'pk': self.restaurant_1.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['restaurant_id'], self.restaurant_1.id)
        self.assertEqual(data['order_metrics']['total_orders'], 2)  # Order 1 and Order 2
        self.assertEqual(data['order_metrics']['completed_orders'], 1)
        self.assertEqual(data['order_metrics']['gross_order_value'], 1065.0)  # 715 + 350
        self.assertEqual(len(data['top_selling_items']), 1)
        self.assertEqual(data['top_selling_items'][0]['name'], 'Chettinad Chicken Biryani')
        self.assertEqual(data['ratings_and_reviews']['total_reviews'], 1)
        self.assertEqual(data['ratings_and_reviews']['average_rating'], 5.0)

    def test_06_restaurant_owner_cannot_view_other_restaurant(self):
        """Verifies restaurant owner A cannot access restaurant owner B's analytics."""
        self.client.force_authenticate(user=self.rest_owner_1)
        # Attempt to access Restaurant 2 (owned by chef_arjun)
        url = reverse('analytics_restaurant_detail', kwargs={'pk': self.restaurant_2.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res_text = str(res.json()).lower()
        self.assertTrue('permission' in res_text or 'authorized' in res_text)

    def test_07_restaurant_csv_export_own_orders_only(self):
        """Verifies restaurant owner can export CSV for their own restaurant."""
        self.client.force_authenticate(user=self.rest_owner_1)
        url = reverse('analytics_restaurant_export_detail', kwargs={'pk': self.restaurant_1.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/csv', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('ORD-BI-1001', content)
        self.assertNotIn('ORD-BI-1003', content)  # Belongs to Restaurant 2

    def test_08_delivery_partner_can_view_own_analytics(self):
        """Verifies delivery partner can view their own metrics and transit duration."""
        self.client.force_authenticate(user=self.rider_user_1)
        url = reverse('analytics_delivery_self')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['partner_username'], self.rider_user_1.username)
        self.assertEqual(data['metrics']['completed_deliveries'], 1)
        self.assertEqual(data['metrics']['average_duration_minutes'], 20.0)  # 25 min - 5 min = 20 mins
        self.assertEqual(data['ratings']['average_rating'], 5.0)
        self.assertIn('recent_trips', data)
        self.assertEqual(len(data['recent_trips']), 1)
        # Verify customer address is NOT leaked
        self.assertNotIn('customer_address', json.dumps(data))

    def test_09_delivery_duration_excludes_invalid_timestamps(self):
        """Verifies duration calculation excludes missing or inverted timestamps."""
        # Create an assignment with missing picked_up_at
        now = timezone.now()
        invalid_order = Order.objects.create(
            order_number='ORD-BI-INVALID',
            customer=self.customer,
            restaurant=self.restaurant_1,
            rider=self.rider_user_1,
            status='DELIVERED',
            grand_total=Decimal('200.00')
        )
        DeliveryAssignment.objects.create(
            order=invalid_order,
            delivery_partner=self.rider_user_1,
            status='DELIVERED',
            picked_up_at=None,
            delivered_at=now
        )

        self.client.force_authenticate(user=self.rider_user_1)
        url = reverse('analytics_delivery_self')
        res = self.client.get(url)
        data = res.json()
        # Completed is now 2, but valid duration sample is still 1 (20.0 mins)
        self.assertEqual(data['metrics']['completed_deliveries'], 2)
        self.assertEqual(data['metrics']['average_duration_minutes'], 20.0)
        self.assertEqual(data['metrics']['valid_duration_sample_count'], 1)

    def test_10_delivery_partner_csv_export(self):
        """Verifies delivery partner CSV export."""
        self.client.force_authenticate(user=self.rider_user_1)
        url = reverse('analytics_delivery_export_self')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/csv', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('ORD-BI-1001', content)
        # Ensure customer street address or lat/lng not in CSV
        self.assertNotIn('customer_lat', content)

    def test_11_unauthenticated_access_denied(self):
        """Verifies anonymous access is blocked on all protected analytics endpoints."""
        endpoints = [
            reverse('analytics_admin_summary'),
            reverse('analytics_admin_charts'),
            reverse('analytics_admin_export'),
            reverse('analytics_restaurant_self'),
            reverse('analytics_delivery_self'),
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_12_date_range_boundary_filtering(self):
        """Verifies date range boundaries exclude orders outside the selected window."""
        # Create an order 45 days in the past
        past_order = Order.objects.create(
            order_number='ORD-BI-PAST',
            customer=self.customer,
            restaurant=self.restaurant_1,
            status='DELIVERED',
            grand_total=Decimal('500.00'),
            created_at=timezone.now() - timedelta(days=45)
        )
        Order.objects.filter(id=past_order.id).update(created_at=timezone.now() - timedelta(days=45))

        self.client.force_authenticate(user=self.admin_user)
        # Query past 7 days: past_order must NOT be included in total_orders
        start_date = (timezone.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        end_date = timezone.now().strftime('%Y-%m-%d')
        url = f"{reverse('analytics_admin_summary')}?start_date={start_date}&end_date={end_date}"
        res = self.client.get(url)
        data = res.json()['summary']
        self.assertEqual(data['total_orders'], 4)  # Excludes the 45-day-old order
