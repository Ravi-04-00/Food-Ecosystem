from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, Address, LoyaltyProfile, AuditLog
from apps.products.models import FoodItem, Restaurant
from apps.orders.models import Order
from apps.coupons.models import Coupon, CouponRedemption, LoyaltyProgramConfig, LoyaltyLedgerEntry
from apps.coupons.services import (
    calculate_coupon_discount,
    calculate_loyalty_redemption,
    calculate_authoritative_order_totals,
    award_order_loyalty_points,
    reverse_order_rewards_and_coupon
)


class SmartOffersLoyaltyPhase19Tests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            username='admin_promo',
            email='admin_promo@fastdelivery.in',
            password='Password123!',
            role='ADMIN'
        )

        self.customer = User.objects.create_user(
            username='customer_arun',
            email='arun@example.com',
            phone='+919876543210',
            password='Password123!',
            role='CUSTOMER'
        )

        self.other_customer = User.objects.create_user(
            username='customer_priya',
            email='priya@example.com',
            phone='+919876543211',
            password='Password123!',
            role='CUSTOMER'
        )

        self.restaurant_owner = User.objects.create_user(
            username='rest_owner',
            email='owner@kitchen.com',
            password='Password123!',
            role='SHOP'
        )

        # Restaurant & Food
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Chettinad Spice Hub',
            verification_status='APPROVED',
            is_open=True,
            rating=4.9
        )

        self.food1 = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Chicken Biryani Bowl',
            price=Decimal('280.00'),
            is_available=True
        )

        self.address = Address.objects.create(
            user=self.customer,
            street='42 1st Cross',
            city='Bengaluru',
            pincode='560038',
            is_default=True
        )

        # Loyalty profile
        self.loyalty_profile, _ = LoyaltyProfile.objects.get_or_create(
            user=self.customer,
            defaults={'points': 200, 'tier': 'SILVER'}
        )
        self.loyalty_profile.points = 200
        self.loyalty_profile.save()

        # Config
        self.config = LoyaltyProgramConfig.get_solo()
        self.config.points_earn_rate = Decimal('1.00')
        self.config.earn_per_amount = Decimal('10.00')
        self.config.points_to_inr_rate = Decimal('0.50')
        self.config.min_points_to_redeem = 50
        self.config.max_discount_percentage_of_subtotal = 50
        self.config.is_active = True
        self.config.save()

        # Coupons
        self.coupon_pct = Coupon.objects.create(
            code='TASTY20',
            title='20% OFF Chef Specials',
            discount_type='PERCENTAGE',
            discount_percentage=20,
            max_discount_amount=Decimal('100.00'),
            min_order_value=Decimal('300.00'),
            max_uses_per_user=1,
            is_active=True
        )

        self.coupon_flat = Coupon.objects.create(
            code='FLAT75',
            title='Flat ₹75 OFF on Orders above ₹400',
            discount_type='FLAT',
            discount_amount=Decimal('75.00'),
            min_order_value=Decimal('400.00'),
            is_active=True
        )

    def test_01_active_coupons_list_public(self):
        """Active coupons should be publicly listable with eligibility calculation."""
        response = self.client.get('/api/coupons/?subtotal=500')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertGreaterEqual(data['count'], 2)

        codes = [c['code'] for c in data['results']]
        self.assertIn('TASTY20', codes)
        self.assertIn('FLAT75', codes)

        tasty = next(c for c in data['results'] if c['code'] == 'TASTY20')
        self.assertTrue(tasty['eligibility']['is_eligible'])
        self.assertEqual(tasty['eligibility']['potential_discount'], 100.0)

    def test_02_percentage_coupon_discount_calculation(self):
        """20% discount on ₹400 subtotal should be ₹80. On ₹600 should cap at max ₹100."""
        res1 = calculate_coupon_discount(self.coupon_pct, Decimal('400.00'), self.customer)
        self.assertTrue(res1['is_eligible'])
        self.assertEqual(res1['discount'], Decimal('80.00'))

        res2 = calculate_coupon_discount(self.coupon_pct, Decimal('600.00'), self.customer)
        self.assertTrue(res2['is_eligible'])
        self.assertEqual(res2['discount'], Decimal('100.00'))

    def test_03_flat_coupon_discount_calculation(self):
        """FLAT75 should deduct ₹75 when subtotal >= ₹400."""
        res = calculate_coupon_discount(self.coupon_flat, Decimal('500.00'), self.customer)
        self.assertTrue(res['is_eligible'])
        self.assertEqual(res['discount'], Decimal('75.00'))

    def test_04_min_order_value_validation(self):
        """Subtotal below min_order_value should be rejected with clear explanation."""
        res = calculate_coupon_discount(self.coupon_pct, Decimal('200.00'), self.customer)
        self.assertFalse(res['is_eligible'])
        self.assertEqual(res['reason'], 'MIN_ORDER_UNMET')
        self.assertIn('Add ₹100.00 more to your cart', res['error_message'])

    def test_05_expired_and_inactive_coupon_rejected(self):
        """Expired or deactivated coupon must be rejected."""
        self.coupon_pct.is_active = False
        self.coupon_pct.save()

        res = calculate_coupon_discount(self.coupon_pct, Decimal('500.00'), self.customer)
        self.assertFalse(res['is_eligible'])
        self.assertEqual(res['reason'], 'INACTIVE')

        # Test expired date
        self.coupon_flat.expiry_date = timezone.now() - timezone.timedelta(days=1)
        self.coupon_flat.save()

        res_exp = calculate_coupon_discount(self.coupon_flat, Decimal('500.00'), self.customer)
        self.assertFalse(res_exp['is_eligible'])
        self.assertEqual(res_exp['reason'], 'EXPIRED')

    def test_06_global_and_per_user_usage_limits(self):
        """Exhausting user redemptions should block subsequent usage."""
        dummy_order = Order.objects.create(
            order_number='FD-TEST-001',
            customer=self.customer,
            restaurant=self.restaurant,
            subtotal=Decimal('500.00'),
            total=Decimal('420.00'),
            discount=Decimal('80.00')
        )
        CouponRedemption.objects.create(
            coupon=self.coupon_pct,
            user=self.customer,
            order=dummy_order,
            discount_amount=Decimal('80.00'),
            status='COMMITTED'
        )

        # Customer already redeemed once
        res = calculate_coupon_discount(self.coupon_pct, Decimal('500.00'), self.customer)
        self.assertFalse(res['is_eligible'])
        self.assertEqual(res['reason'], 'USER_LIMIT_EXCEEDED')

        # Another customer should still be eligible
        res_other = calculate_coupon_discount(self.coupon_pct, Decimal('500.00'), self.other_customer)
        self.assertTrue(res_other['is_eligible'])

    def test_07_first_order_only_coupon(self):
        """first_order_only should block users with prior non-cancelled orders."""
        newbie_coupon = Coupon.objects.create(
            code='WELCOME100',
            discount_type='FLAT',
            discount_amount=Decimal('100.00'),
            min_order_value=Decimal('200.00'),
            first_order_only=True,
            is_active=True
        )

        # Other customer has 0 orders
        res_newbie = calculate_coupon_discount(newbie_coupon, Decimal('300.00'), self.other_customer)
        self.assertTrue(res_newbie['is_eligible'])

        # Create past order for customer
        Order.objects.create(
            order_number='FD-PAST-001',
            customer=self.customer,
            restaurant=self.restaurant,
            status='DELIVERED',
            subtotal=Decimal('300.00'),
            total=Decimal('345.00')
        )

        res_existing = calculate_coupon_discount(newbie_coupon, Decimal('300.00'), self.customer)
        self.assertFalse(res_existing['is_eligible'])
        self.assertEqual(res_existing['reason'], 'NOT_FIRST_ORDER')

    def test_08_order_checkout_with_coupon_and_redemption_commit(self):
        """Placing an order with coupon code should record discount and create CouponRedemption."""
        self.client.force_authenticate(user=self.customer)
        payload = {
            'items': [
                {'food_item_id': self.food1.id, 'quantity': 2}  # 2 * 280 = 560
            ],
            'restaurant_id': self.restaurant.id,
            'coupon_code': 'TASTY20',
            'payment_method': 'UPI (Instant)'
        }

        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_data = response.data['order']
        # Subtotal: 560, Delivery: 30, Packaging: 15 = 605
        # 20% of 560 = 112 -> capped at 100
        # Final Total: 605 - 100 = 505
        self.assertEqual(float(order_data['discount']), 100.0)
        self.assertEqual(float(order_data['grand_total']), 505.0)
        self.assertEqual(order_data['coupon_code_snapshot'], 'TASTY20')

        # Check redemption committed in DB
        redemption = CouponRedemption.objects.filter(order_id=order_data['id']).first()
        self.assertIsNotNone(redemption)
        self.assertEqual(redemption.discount_amount, Decimal('100.00'))
        self.assertEqual(redemption.status, 'COMMITTED')

    def test_09_loyalty_points_earning_and_ledger(self):
        """Delivering an order should award 1 point per ₹10 spent and write an auditable ledger entry."""
        order = Order.objects.create(
            order_number='FD-LOYALTY-001',
            customer=self.customer,
            restaurant=self.restaurant,
            status='CONFIRMED',
            payment_status='PAID',
            subtotal=Decimal('500.00'),
            total=Decimal('545.00')
        )

        initial_points = self.customer.loyalty.points  # 200
        points_awarded = award_order_loyalty_points(order)
        # 500 / 10 = 50 points
        self.assertEqual(points_awarded, 50)

        self.customer.loyalty.refresh_from_db()
        self.assertEqual(self.customer.loyalty.points, initial_points + 50)

        entry = LoyaltyLedgerEntry.objects.filter(order=order, transaction_type='AWARD').first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.points, 50)
        self.assertEqual(entry.balance_after, initial_points + 50)

        # Idempotency check: duplicate call shouldn't award again
        dup_pts = award_order_loyalty_points(order)
        self.assertEqual(dup_pts, 0)

    def test_10_loyalty_points_redemption_and_balance_check(self):
        """Redeeming points should convert at ₹0.50/pt, deduct balance, and create ledger entry."""
        self.client.force_authenticate(user=self.customer)
        # Customer has 200 points. Redeem 100 points = ₹50 discount.
        payload = {
            'items': [
                {'food_item_id': self.food1.id, 'quantity': 2}  # 560 subtotal
            ],
            'restaurant_id': self.restaurant.id,
            'points_to_redeem': 100,
            'payment_method': 'UPI (Instant)'
        }

        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_data = response.data['order']
        self.assertEqual(order_data['loyalty_points_used'], 100)
        self.assertEqual(float(order_data['loyalty_discount']), 50.0)

        self.customer.loyalty.refresh_from_db()
        self.assertEqual(self.customer.loyalty.points, 100)  # 200 - 100 = 100

        entry = LoyaltyLedgerEntry.objects.filter(order_id=order_data['id'], transaction_type='REDEEM').first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.points, -100)
        self.assertEqual(entry.balance_after, 100)

    def test_11_order_cancellation_reverses_points_and_coupon(self):
        """Cancelling an order restores redeemed points and frees up coupon usage limit."""
        self.client.force_authenticate(user=self.customer)
        # Create order with coupon and points
        payload = {
            'items': [{'food_item_id': self.food1.id, 'quantity': 2}],
            'restaurant_id': self.restaurant.id,
            'coupon_code': 'TASTY20',
            'points_to_redeem': 100,
            'payment_method': 'UPI (Instant)'
        }
        create_res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        order_id = create_res.data['order']['id']

        # Cancel order
        cancel_res = self.client.post(f'/api/orders/{order_id}/cancel/', {'reason': 'Changed my mind'}, format='json')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        # Verify points restored back to 200
        self.customer.loyalty.refresh_from_db()
        self.assertEqual(self.customer.loyalty.points, 200)

        # Verify coupon redemption was reversed
        redemption = CouponRedemption.objects.filter(order_id=order_id).first()
        self.assertEqual(redemption.status, 'REVERSED')

        # Customer should be able to use TASTY20 again
        recheck = calculate_coupon_discount(self.coupon_pct, Decimal('400.00'), self.customer)
        self.assertTrue(recheck['is_eligible'])

    def test_12_admin_coupon_crud_and_audit_logging(self):
        """Admin can create new coupon and AuditLog is recorded in PostgreSQL."""
        self.client.force_authenticate(user=self.admin)
        new_coupon_payload = {
            'code': 'FESTIVE30',
            'title': 'Diwali Festive Deal',
            'discount_type': 'PERCENTAGE',
            'discount_percentage': 30,
            'max_discount_amount': '150.00',
            'min_order_value': '350.00',
            'max_uses': 500,
            'max_uses_per_user': 2,
            'is_active': True
        }

        res = self.client.post('/api/coupons/admin/', new_coupon_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['code'], 'FESTIVE30')

        # Verify AuditLog recorded
        audit = AuditLog.objects.filter(target_model='Coupon', action__icontains='FESTIVE30').first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.actor, self.admin)
