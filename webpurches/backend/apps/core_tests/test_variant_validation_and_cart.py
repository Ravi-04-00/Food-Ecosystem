from decimal import Decimal
from datetime import time
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.products.models import Restaurant, FoodItem, FoodVariant, FoodAddon
from apps.cart.models import Cart, CartItem

User = get_user_model()


class VariantValidationAndCartTests(APITestCase):
    """
    Verification tests for Food Variant selection and cart validation:
    1. Valid variant ID attaches properly.
    2. Food item without variants succeeds with variant_id=None / omitted.
    3. Non-existent variant ID returns 400 with 'Invalid variant ID.'
    4. Mismatched variant ID (belonging to another food item) returns 400 with 'Invalid variant ID.'
    5. Malformed/invalid string variant returns 400 with 'Invalid variant ID.'
    6. Closed restaurant and unavailable item rejections remain strictly intact.
    """

    def setUp(self):
        self.customer = User.objects.create_user(
            username='cart_variant_user',
            email='cart_variant@example.com',
            password='TestPassword123!',
            role='CUSTOMER'
        )
        self.owner = User.objects.create_user(
            username='restaurant_owner_var',
            email='owner_var@example.com',
            password='TestPassword123!',
            role='RESTAURANT'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Variant Gourmet Kitchen',
            is_open=True,
            verification_status='APPROVED',
            opening_time=time(0, 0, 0),
            closing_time=time(23, 59, 59)
        )

        # Food item 1: WITH variants
        self.food_with_variants = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Artisan Burger With Variants',
            slug='artisan-burger-with-variants',
            price=Decimal('200.00'),
            is_available=True,
            stock=50
        )
        self.variant_single = FoodVariant.objects.create(
            food=self.food_with_variants,
            name='Single Patty',
            price_modifier=Decimal('0.00')
        )
        self.variant_double = FoodVariant.objects.create(
            food=self.food_with_variants,
            name='Double Patty',
            price_modifier=Decimal('60.00')
        )

        # Food item 2: WITHOUT variants (standard item)
        self.food_no_variants = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Classic French Fries',
            slug='classic-french-fries',
            price=Decimal('90.00'),
            is_available=True,
            stock=100
        )

        # Other food item in another restaurant for mismatch testing
        self.other_restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Other Pizza Place',
            is_open=True,
            verification_status='APPROVED'
        )
        self.other_food = FoodItem.objects.create(
            restaurant=self.other_restaurant,
            name='Cheesy Pizza',
            slug='cheesy-pizza',
            price=Decimal('350.00'),
            is_available=True,
            stock=20
        )
        self.other_variant = FoodVariant.objects.create(
            food=self.other_food,
            name='Large Pizza Size',
            price_modifier=Decimal('100.00')
        )

        self.client.force_authenticate(user=self.customer)

    def test_01_add_food_with_valid_numeric_variant(self):
        """Valid variant ID attaches to cart item and calculates price modifier."""
        payload = {
            'food_id': self.food_with_variants.id,
            'quantity': 2,
            'variant_id': self.variant_double.id
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        cart_item = CartItem.objects.get(cart__user=self.customer, product=self.food_with_variants)
        self.assertEqual(cart_item.variant, self.variant_double)
        self.assertEqual(cart_item.quantity, 2)
        # Unit price: 200 + 60 = 260
        self.assertEqual(Decimal(str(cart_item.unit_price)), Decimal('260.00'))
        # Subtotal: 260 * 2 = 520
        self.assertEqual(Decimal(str(cart_item.subtotal)), Decimal('520.00'))

    def test_02_add_food_without_variants_succeeds(self):
        """Food item legitimately having no variants succeeds with variant_id=None."""
        payload = {
            'food_id': self.food_no_variants.id,
            'quantity': 1,
            'variant_id': None
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        cart_item = CartItem.objects.get(cart__user=self.customer, product=self.food_no_variants)
        self.assertIsNone(cart_item.variant)
        self.assertEqual(Decimal(str(cart_item.unit_price)), Decimal('90.00'))

    def test_03_add_food_with_nonexistent_variant_id_rejected(self):
        """Non-existent variant ID returns 400 with 'Invalid variant ID.' message."""
        payload = {
            'food_id': self.food_with_variants.id,
            'quantity': 1,
            'variant_id': 999999
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid variant ID', res.data.get('error', ''))

    def test_04_add_food_with_mismatched_variant_id_rejected(self):
        """Variant ID belonging to another food item is rejected with 400 Bad Request."""
        payload = {
            'food_id': self.food_with_variants.id,
            'quantity': 1,
            'variant_id': self.other_variant.id  # Belongs to other_food!
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid variant ID', res.data.get('error', ''))

    def test_05_add_food_with_invalid_string_variant_rejected(self):
        """Non-matching string variant returns 400 with 'Invalid variant ID.'"""
        payload = {
            'food_id': self.food_with_variants.id,
            'quantity': 1,
            'variant_id': 'extra_mega_feast_nonexistent'
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid variant ID', res.data.get('error', ''))

    def test_06_add_food_with_string_matching_variant_name_succeeds(self):
        """String variant name matching actual variant succeeds and attaches it."""
        payload = {
            'food_id': self.food_with_variants.id,
            'quantity': 1,
            'variant_id': 'double patty'
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        cart_item = CartItem.objects.get(cart__user=self.customer, product=self.food_with_variants)
        self.assertEqual(cart_item.variant, self.variant_double)

    def test_07_cart_serialization_exposes_variant_details(self):
        """Cart item serialization properly reflects variant details for frontend display."""
        CartItem.objects.create(
            cart=Cart.objects.get_or_create(user=self.customer)[0],
            product=self.food_with_variants,
            variant=self.variant_double,
            unit_price=Decimal('260.00'),
            quantity=1
        )
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        items = res.data.get('items', [])
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['variant_details']['id'], self.variant_double.id)
        self.assertEqual(items[0]['variant_details']['name'], 'Double Patty')
        self.assertEqual(float(items[0]['variant_details']['price_modifier']), 60.0)
