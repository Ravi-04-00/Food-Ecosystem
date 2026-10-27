from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem, Category
from apps.orders.models import Order, OrderItem
from apps.reviews.models import Review, ReviewReport, ReviewModerationLog

class Phase18ReviewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.customer = User.objects.create_user(
            username='arun_customer',
            email='arun@example.com',
            password='password123',
            role='CUSTOMER'
        )
        self.other_customer = User.objects.create_user(
            username='priya_customer',
            email='priya@example.com',
            password='password123',
            role='CUSTOMER'
        )
        self.restaurant_owner = User.objects.create_user(
            username='shop_owner',
            email='chef@example.com',
            password='password123',
            role='RESTAURANT'
        )
        self.rider_user = User.objects.create_user(
            username='karthik_rider',
            email='karthik@example.com',
            password='password123',
            role='DELIVERY'
        )
        self.admin_user = User.objects.create_user(
            username='ops_admin',
            email='admin@example.com',
            password='password123',
            role='ADMIN',
            is_staff=True
        )

        # Restaurant & Category
        self.category = Category.objects.create(name='Biryani & Bowls', slug='biryani-bowls')
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Madras Chettinad Kitchen',
            rating=Decimal('4.8'),
            review_count=10
        )

        # Food items
        self.food_biryani = FoodItem.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Ambur Mutton Biryani',
            slug='ambur-mutton-biryani',
            price=Decimal('280.00'),
            rating=Decimal('4.9'),
            review_count=5
        )
        self.food_parotta = FoodItem.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Kothu Parotta',
            slug='kothu-parotta',
            price=Decimal('150.00'),
            rating=Decimal('4.8'),
            review_count=3
        )

        # Delivered Order owned by customer
        self.delivered_order = Order.objects.create(
            order_number='FD-REV-1001',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user,
            status='DELIVERED',
            total=Decimal('350.00')
        )
        self.order_item_biryani = OrderItem.objects.create(
            order=self.delivered_order,
            food_item=self.food_biryani,
            quantity=1,
            price=Decimal('280.00')
        )

        # Non-completed order (PLACED)
        self.placed_order = Order.objects.create(
            order_number='FD-REV-1002',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user,
            status='PLACED',
            total=Decimal('150.00')
        )
        OrderItem.objects.create(
            order=self.placed_order,
            food_item=self.food_parotta,
            quantity=1,
            price=Decimal('150.00')
        )

    def test_customer_cannot_review_uncompleted_order(self):
        """Reviews are prohibited until an order satisfies completed policy (DELIVERED)."""
        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/reviews/', {
            'order_id': self.placed_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_parotta.id,
            'rating': 5,
            'comment': 'Smells great already!'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('DELIVERED', str(res.data))

    def test_customer_cannot_review_another_customers_order(self):
        """Strict recipient ownership: Priya cannot review Arun's order."""
        self.client.force_authenticate(user=self.other_customer)
        res = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_biryani.id,
            'rating': 5,
            'comment': 'Stolen order review'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('placed', str(res.data).lower())

    def test_food_review_limited_to_purchased_items(self):
        """Customer cannot review food item not in their order."""
        self.client.force_authenticate(user=self.customer)
        # Kothu Parotta was not in delivered_order (only Biryani was)
        res = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_parotta.id,
            'rating': 5,
            'comment': 'Tried reviewing parotta not ordered'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not part of order', str(res.data).lower())

    def test_successful_food_and_restaurant_and_delivery_review_creation(self):
        """Customer reviews all 3 eligible targets for their completed order."""
        self.client.force_authenticate(user=self.customer)

        # 1. Food Item Review
        res_food = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_biryani.id,
            'rating': 5,
            'food_quality_rating': 5,
            'comment': 'Authentic taste with succulent meat!'
        })
        self.assertEqual(res_food.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_food.data['is_verified_purchase'])
        self.assertEqual(res_food.data['moderation_status'], 'APPROVED')

        # 2. Restaurant Review
        res_rest = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'RESTAURANT',
            'restaurant_id': self.restaurant.id,
            'rating': 4,
            'packaging_rating': 4,
            'comment': 'Eco-friendly container, arrived warm.'
        })
        self.assertEqual(res_rest.status_code, status.HTTP_201_CREATED)

        # 3. Delivery Partner Review
        res_deliv = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'DELIVERY_PARTNER',
            'delivery_partner_id': self.rider_user.id,
            'rating': 5,
            'delivery_rating': 5,
            'comment': 'Fast and courteous rider!'
        })
        self.assertEqual(res_deliv.status_code, status.HTTP_201_CREATED)

    def test_duplicate_review_prevention(self):
        """Duplicate reviews for the same target on same order are rejected."""
        self.client.force_authenticate(user=self.customer)
        # First submission
        self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_biryani.id,
            'rating': 5,
            'comment': 'First review'
        })
        # Second submission
        res = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_biryani.id,
            'rating': 4,
            'comment': 'Duplicate review attempt'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already reviewed', str(res.data).lower())

    def test_merchant_cannot_submit_customer_reviews(self):
        """Restaurant account blocked from customer review creation endpoint."""
        self.client.force_authenticate(user=self.restaurant_owner)
        res = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_biryani.id,
            'rating': 5,
            'comment': 'Owner self review'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot submit customer reviews', str(res.data).lower())

    def test_customer_can_update_and_delete_own_review(self):
        """Customer can edit rating/comment or delete their review."""
        self.client.force_authenticate(user=self.customer)
        create_res = self.client.post('/api/reviews/', {
            'order_id': self.delivered_order.id,
            'target_type': 'FOOD_ITEM',
            'product_id': self.food_biryani.id,
            'rating': 4,
            'comment': 'Initial rating'
        })
        review_id = create_res.data['id']

        # Edit review
        patch_res = self.client.patch(f'/api/reviews/{review_id}/', {
            'rating': 5,
            'comment': 'Updated to 5 stars, amazing!'
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['rating'], 5)

        # Other customer cannot delete
        self.client.force_authenticate(user=self.other_customer)
        del_fail = self.client.delete(f'/api/reviews/{review_id}/')
        self.assertEqual(del_fail.status_code, status.HTTP_403_FORBIDDEN)

        # Owner customer can delete
        self.client.force_authenticate(user=self.customer)
        del_res = self.client.delete(f'/api/reviews/{review_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(Review.objects.filter(id=review_id).exists())

    def test_aggregate_ratings_exclude_hidden_reviews(self):
        """Averages and counts exclude hidden reviews."""
        self.client.force_authenticate(user=self.customer)
        # Create approved 5-star review
        rev = Review.objects.create(
            user=self.customer,
            order=self.delivered_order,
            target_type='FOOD_ITEM',
            product=self.food_biryani,
            rating=5,
            moderation_status='APPROVED'
        )

        # Summary check
        res_summary = self.client.get(f'/api/reviews/summary/?target_type=FOOD_ITEM&target_id={self.food_biryani.id}')
        self.assertEqual(res_summary.data['total_reviews'], 1)
        self.assertEqual(float(res_summary.data['average_rating']), 5.0)

        # Now hide the review via Admin
        self.client.force_authenticate(user=self.admin_user)
        mod_res = self.client.post(f'/api/reviews/admin/{rev.id}/moderate/', {
            'action': 'HIDE',
            'reason': 'Contains inappropriate terms'
        })
        self.assertEqual(mod_res.status_code, status.HTTP_200_OK)

        # Summary now excludes it
        res_summary_after = self.client.get(f'/api/reviews/summary/?target_type=FOOD_ITEM&target_id={self.food_biryani.id}')
        self.assertEqual(res_summary_after.data['total_reviews'], 0)

    def test_admin_moderation_queue_and_audit_log(self):
        """Admin moderation records audit logs and mandatory reasons."""
        rev = Review.objects.create(
            user=self.customer,
            order=self.delivered_order,
            target_type='RESTAURANT',
            restaurant=self.restaurant,
            rating=2,
            comment='Cold food',
            moderation_status='FLAGGED'
        )

        # Non-admin rejected
        self.client.force_authenticate(user=self.customer)
        queue_fail = self.client.get('/api/reviews/admin/queue/')
        self.assertEqual(queue_fail.status_code, status.HTTP_403_FORBIDDEN)

        # Admin approves
        self.client.force_authenticate(user=self.admin_user)
        queue_ok = self.client.get('/api/reviews/admin/queue/?status=FLAGGED')
        self.assertEqual(queue_ok.status_code, status.HTTP_200_OK)

        mod_res = self.client.post(f'/api/reviews/admin/{rev.id}/moderate/', {
            'action': 'APPROVE',
            'reason': 'Legitimate negative customer review verified with kitchen receipt'
        })
        self.assertEqual(mod_res.status_code, status.HTTP_200_OK)

        # Verify audit log exists
        log = ReviewModerationLog.objects.filter(review=rev).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.action, 'APPROVE')
        self.assertIn('receipt', log.reason)

    def test_abuse_reporting_and_resolution_flow(self):
        """Users can report abusive reviews, and admins can resolve and hide them."""
        rev = Review.objects.create(
            user=self.customer,
            order=self.delivered_order,
            target_type='RESTAURANT',
            restaurant=self.restaurant,
            rating=1,
            comment='Abusive profanity here',
            moderation_status='APPROVED'
        )

        # Restaurant reports it
        self.client.force_authenticate(user=self.restaurant_owner)
        rep_res = self.client.post(f'/api/reviews/{rev.id}/report/', {
            'reason': 'ABUSIVE',
            'explanation': 'Contains offensive language targeting staff'
        })
        self.assertEqual(rep_res.status_code, status.HTTP_201_CREATED)
        report_id = rep_res.data['id']

        # Admin resolves report
        self.client.force_authenticate(user=self.admin_user)
        resolve_res = self.client.post(f'/api/reviews/admin/reports/{report_id}/resolve/', {
            'action': 'RESOLVE_AND_HIDE',
            'admin_notes': 'Violation confirmed and hidden.'
        })
        self.assertEqual(resolve_res.status_code, status.HTTP_200_OK)

        rev.refresh_from_db()
        self.assertEqual(rev.moderation_status, 'HIDDEN')
