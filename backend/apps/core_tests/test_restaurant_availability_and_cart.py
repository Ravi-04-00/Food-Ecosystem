from datetime import time
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem, FoodVariant
from apps.cart.models import Cart, CartItem


class RestaurantAvailabilityAndCartTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test_cust@wsfood.io',
            username='test_cust',
            password='password123',
            role='CUSTOMER'
        )
        self.client.force_authenticate(user=self.user)

        self.shop_owner = User.objects.create_user(
            email='shop_owner@wsfood.io',
            username='shop_owner',
            password='password123',
            role='RESTAURANT'
        )

        self.restaurant = Restaurant.objects.create(
            owner=self.shop_owner,
            name='CYBER SMASH BURGERS 2099',
            is_open=True,
            verification_status='APPROVED',
            opening_time=time(0, 0, 0),
            closing_time=time(23, 59, 59),
            timezone='Asia/Kolkata'
        )

        self.food = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Quantum Double Glaze Burger',
            slug='quantum-double-glaze-burger',
            price=349.00,
            is_available=True,
            stock=10
        )

    def test_open_restaurant_adds_to_cart_successfully(self):
        """When restaurant is approved and open, items can be added to cart."""
        res = self.client.post('/api/cart/items/', {'food_id': self.food.id, 'quantity': 1})
        self.assertIn(res.status_code, [200, 201])
        self.assertTrue(res.data.get('success'))

    def test_closed_restaurant_blocks_cart_addition_with_clear_message(self):
        """When restaurant is marked closed, cart returns 400 with user-facing message."""
        self.restaurant.is_open = False
        self.restaurant.save()

        res = self.client.post('/api/cart/items/', {'food_id': self.food.id, 'quantity': 1})
        self.assertEqual(res.status_code, 400)
        self.assertIn('closed', res.data.get('error', '').lower())
        self.assertFalse(res.data.get('is_open'))

    def test_paused_orders_blocks_cart_addition_with_reason(self):
        """When restaurant has paused orders, cart returns 400 with pause reason."""
        self.restaurant.orders_paused = True
        self.restaurant.pause_reason = 'Kitchen deep clean in progress'
        self.restaurant.save()

        res = self.client.post('/api/cart/items/', {'food_id': self.food.id, 'quantity': 1})
        self.assertEqual(res.status_code, 400)
        self.assertIn('Kitchen deep clean in progress', res.data.get('error', ''))

    def test_unverified_restaurant_blocks_cart_addition(self):
        """When restaurant is PENDING verification, cart returns 400."""
        self.restaurant.verification_status = 'PENDING'
        self.restaurant.save()

        res = self.client.post('/api/cart/items/', {'food_id': self.food.id, 'quantity': 1})
        self.assertEqual(res.status_code, 400)
        self.assertIn('not currently verified', res.data.get('error', ''))

    def test_restaurant_serializer_exposes_closure_details(self):
        """Customer restaurant endpoint provides is_currently_open and closure_reason."""
        self.restaurant.is_open = False
        self.restaurant.save()

        res = self.client.get(f'/api/products/restaurants/{self.restaurant.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get('status'), 'CLOSED')
        self.assertFalse(res.data.get('is_currently_open'))
        self.assertIsNotNone(res.data.get('closure_reason'))

    def test_add_to_cart_with_string_regular_variant_succeeds(self):
        """Adding item with variant_id='regular' falls back cleanly without 400."""
        res = self.client.post('/api/cart/items/', {
            'food_id': self.food.id,
            'quantity': 1,
            'variant_id': 'regular'
        })
        self.assertIn(res.status_code, [200, 201])
        cart_item = CartItem.objects.get(id=res.data['item_id'])
        self.assertIsNone(cart_item.variant)

    def test_add_to_cart_with_null_or_empty_variant_succeeds(self):
        """Adding item with variant_id=None or 'null' succeeds."""
        res = self.client.post('/api/cart/items/', {
            'food_id': self.food.id,
            'quantity': 1,
            'variant_id': 'null'
        })
        self.assertIn(res.status_code, [200, 201])

    def test_add_to_cart_with_valid_numeric_variant(self):
        """Adding item with valid variant ID attaches the FoodVariant to CartItem."""
        variant = FoodVariant.objects.create(
            food=self.food,
            name='Double Monster',
            price_modifier=80.00
        )
        res = self.client.post('/api/cart/items/', {
            'food_id': self.food.id,
            'quantity': 1,
            'variant_id': variant.id
        })
        self.assertIn(res.status_code, [200, 201])
        cart_item = CartItem.objects.get(id=res.data['item_id'])
        self.assertEqual(cart_item.variant, variant)

    def test_add_to_cart_with_variant_name_lookup(self):
        """Adding item with variant='Large' resolves to matching FoodVariant."""
        variant = FoodVariant.objects.create(
            food=self.food,
            name='Large',
            price_modifier=50.00
        )
        res = self.client.post('/api/cart/items/', {
            'food_id': self.food.id,
            'quantity': 1,
            'variant_id': 'large'
        })
        self.assertIn(res.status_code, [200, 201])
        cart_item = CartItem.objects.get(id=res.data['item_id'])
        self.assertEqual(cart_item.variant, variant)

    def test_add_to_cart_with_invalid_variant_returns_400(self):
        """Adding non-existent numeric variant returns 400 Bad Request."""
        res = self.client.post('/api/cart/items/', {
            'food_id': self.food.id,
            'quantity': 1,
            'variant_id': 999999
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('not valid', res.data.get('error', ''))
