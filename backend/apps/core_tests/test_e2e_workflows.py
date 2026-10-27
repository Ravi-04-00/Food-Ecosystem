"""
Fast Delivery (FD) - End-to-End (E2E) Business Workflow Test Suite
Simulates the complete real-world customer, restaurant, delivery partner,
and review lifecycle across authoritative backend API endpoints.
"""

from decimal import Decimal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.reviews.models import Review
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_category,
    create_test_food,
    create_test_address,
    create_test_rider
)


class EndToEndBusinessWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # 1. Actors
        self.customer = create_test_user(role='CUSTOMER', username='cust_e2e_journey')
        self.restaurant_owner = create_test_user(role='SHOP', username='owner_e2e_journey')
        self.rider_user = create_test_user(role='DELIVERY', username='rider_e2e_journey')

        # 2. Restaurant & Menu
        self.restaurant = create_test_restaurant(owner=self.restaurant_owner, name='Grand Cyber Biryani')
        self.category = create_test_category(name='Biryani Specials')
        self.food = create_test_food(restaurant=self.restaurant, category=self.category, name='Dum Biryani', price=Decimal('250.00'), stock=50)

        # 3. Customer Address & Rider Profile
        self.address = create_test_address(user=self.customer)
        self.rider = create_test_rider(user=self.rider_user, is_online=True)

    def test_complete_food_ordering_and_delivery_lifecycle(self):
        """
        Executes end-to-end multi-actor journey:
        Customer Cart & Order -> Restaurant Preparation -> Rider Pickup -> OTP Delivery -> Review.
        """
        # ======================================================================
        # STEP 1: Customer browses, adds food to cart, and checks out
        # ======================================================================
        self.client.force_authenticate(user=self.customer)

        cart, _ = Cart.objects.get_or_create(user=self.customer)
        cart.items.all().delete()
        cart.restaurant = self.restaurant
        cart.save(update_fields=['restaurant'])
        CartItem.objects.create(cart=cart, product=self.food, quantity=2, unit_price=self.food.price)

        checkout_res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'payment_method': 'UPI (Instant)',
            'cooking_instructions': 'Include onion raita'
        })
        self.assertEqual(checkout_res.status_code, status.HTTP_201_CREATED)
        order_data = checkout_res.data.get('order', checkout_res.data)
        order_id = order_data['id']

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'PLACED')
        customer_otp = str(order.otp)
        self.assertTrue(len(customer_otp) == 4)

        # ======================================================================
        # STEP 2: Restaurant Owner views order and transitions to CONFIRMED
        # ======================================================================
        self.client.force_authenticate(user=self.restaurant_owner)

        accept_res = self.client.post(f'/api/orders/{order_id}/accept/')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, 'CONFIRMED')

        # Restaurant starts preparing
        prep_res = self.client.post(f'/api/orders/{order_id}/status/', {
            'status': 'PREPARING'
        })
        self.assertEqual(prep_res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'PREPARING')

        # ======================================================================
        # STEP 3: Kitchen marks food ready and assigns delivery rider
        # ======================================================================
        ready_res = self.client.post(f'/api/orders/{order_id}/status/', {
            'status': 'READY_FOR_PICKUP'
        })
        self.assertEqual(ready_res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'READY_FOR_PICKUP')

        # Restaurant dispatches to online rider
        assign_res = self.client.post(f'/api/orders/{order_id}/assign-rider/', {
            'rider_id': self.rider_user.id
        })
        self.assertEqual(assign_res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.rider, self.rider_user)
        self.assertEqual(order.status, 'ON_THE_WAY')

        # ======================================================================
        # STEP 4: Rider arrives at customer and verifies OTP
        # ======================================================================
        self.client.force_authenticate(user=self.rider_user)

        otp_res = self.client.post(f'/api/orders/{order_id}/verify-otp/', {
            'otp': customer_otp
        })
        self.assertEqual(otp_res.status_code, status.HTTP_200_OK)
        self.assertTrue(otp_res.data.get('success'))

        order.refresh_from_db()
        self.assertEqual(order.status, 'DELIVERED')
        self.assertEqual(order.payment_status, 'COMPLETED')

        # ======================================================================
        # STEP 5: Customer submits review for delivered order
        # ======================================================================
        self.client.force_authenticate(user=self.customer)
        review_res = self.client.post('/api/reviews/', {
            'order_id': order.id,
            'target_type': 'RESTAURANT',
            'restaurant_id': self.restaurant.id,
            'rating': 5,
            'delivery_rating': 5,
            'comment': 'Authentic biryani, lightning fast delivery!'
        })
        self.assertEqual(review_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Review.objects.filter(order=order, user=self.customer).exists())
