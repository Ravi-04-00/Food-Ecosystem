"""
Fast Delivery (FD) - Orders, Inventory & Pricing Quality Engineering Test Suite
Tests order creation, stock decrements, authoritative pricing calculations,
closed restaurant checks, coupon math, and order lifecycle transitions.
"""

from decimal import Decimal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem
from apps.products.models import FoodItem
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_category,
    create_test_food,
    create_test_address,
    create_test_order,
    create_test_coupon
)


class OrdersAndInventoryTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(role='CUSTOMER', username='cust_orders_1')
        self.owner = create_test_user(role='SHOP', username='owner_orders_1')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Cyber Wok')
        self.category = create_test_category(name='Noodles & Rice')
        self.food1 = create_test_food(restaurant=self.restaurant, category=self.category, name='Dragon Noodles', price=Decimal('200.00'), stock=20)
        self.food2 = create_test_food(restaurant=self.restaurant, category=self.category, name='Spring Rolls', price=Decimal('100.00'), stock=15)
        self.address = create_test_address(user=self.customer)

    def _setup_customer_cart(self):
        cart, _ = Cart.objects.get_or_create(user=self.customer)
        cart.items.all().delete()
        cart.restaurant = self.restaurant
        cart.save(update_fields=['restaurant'])
        CartItem.objects.create(cart=cart, product=self.food1, quantity=2, unit_price=self.food1.price)
        CartItem.objects.create(cart=cart, product=self.food2, quantity=1, unit_price=self.food2.price)
        return cart

    # --------------------------------------------------------------------------
    # 1. Order Creation & Snapshots
    # --------------------------------------------------------------------------
    def test_valid_checkout_creates_order_and_decrements_stock(self):
        """Checkout creates order with authoritative snapshots and decrements food stock."""
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        initial_stock_f1 = self.food1.stock
        initial_stock_f2 = self.food2.stock

        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'payment_method': 'UPI (Instant)',
            'cooking_instructions': 'Extra spicy please'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_data = res.data.get('order', res.data)

        # 1. Verify order in PostgreSQL
        order = Order.objects.get(id=order_data['id'])
        self.assertEqual(order.customer, self.customer)
        self.assertEqual(order.status, 'PLACED')
        self.assertEqual(order.payment_status, 'PAYMENT_PENDING')

        # 2. Verify stock decremented
        self.food1.refresh_from_db()
        self.food2.refresh_from_db()
        self.assertEqual(self.food1.stock, initial_stock_f1 - 2)
        self.assertEqual(self.food2.stock, initial_stock_f2 - 1)

        # 3. Verify cart was cleared
        cart = Cart.objects.get(user=self.customer)
        self.assertEqual(cart.items.count(), 0)

    def test_empty_cart_checkout_rejected(self):
        """Checking out with an empty cart returns HTTP 400."""
        self.client.force_authenticate(user=self.customer)
        cart, _ = Cart.objects.get_or_create(user=self.customer)
        cart.items.all().delete()

        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('empty', res.data.get('error', '').lower())

    def test_out_of_stock_item_blocks_checkout(self):
        """Item with 0 stock blocks checkout and preserves cart items."""
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        # Set food stock to 0
        self.food1.stock = 0
        self.food1.save()

        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        error_msg = res.data.get('error', '').lower()
        self.assertTrue('sold out' in error_msg or 'stock' in error_msg)

        # Cart must still contain items
        cart = Cart.objects.get(user=self.customer)
        self.assertEqual(cart.items.count(), 2)

    def test_sequential_checkouts_cannot_oversell_last_unit(self):
        """After stock hits 0, a second checkout fails and stock never goes negative."""
        self.client.force_authenticate(user=self.customer)
        self.food1.stock = 1
        self.food1.save()

        cart, _ = Cart.objects.get_or_create(user=self.customer)
        cart.items.all().delete()
        cart.restaurant = self.restaurant
        cart.save(update_fields=['restaurant'])
        CartItem.objects.create(cart=cart, product=self.food1, quantity=1, unit_price=self.food1.price)

        res1 = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.food1.refresh_from_db()
        self.assertEqual(self.food1.stock, 0)

        # Second checkout for the same last unit must fail; stock stays >= 0.
        CartItem.objects.create(cart=cart, product=self.food1, quantity=1, unit_price=self.food1.price)
        res2 = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.food1.refresh_from_db()
        self.assertGreaterEqual(self.food1.stock, 0)

    def test_closed_restaurant_blocks_checkout(self):
        """Closed restaurant rejects order placement."""
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        self.restaurant.is_open = False
        self.restaurant.save()

        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('closed', res.data.get('error', '').lower())

    def test_server_enforces_authoritative_prices_ignoring_frontend_tampering(self):
        """Server computes prices from database, rejecting client-side price tampering."""
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        # Client sends tampered grand total of 1 rupee
        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'grand_total': 1.00,
            'subtotal': 1.00
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_data = res.data.get('order', res.data)
        order = Order.objects.get(id=order_data['id'])

        # Expected subtotal: 2 * 200 + 1 * 100 = 500
        self.assertEqual(order.subtotal, Decimal('500.00'))
        self.assertGreater(order.grand_total, Decimal('500.00'))

    def test_coupon_discount_calculation(self):
        """Valid coupon applies accurate discount bounded by max_discount."""
        coupon = create_test_coupon(code='SAVE20', discount_percentage=20, max_discount=Decimal('60.00'))
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'coupon_code': 'SAVE20'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_data = res.data.get('order', res.data)
        order = Order.objects.get(id=order_data['id'])

        # 20% of 500 = 100, capped at max_discount 60
        self.assertEqual(order.discount, Decimal('60.00'))

    # --------------------------------------------------------------------------
    # 2. Lifecycle & Cancellation Rules
    # --------------------------------------------------------------------------
    def test_customer_can_cancel_placed_order(self):
        """Customer can cancel order while in PLACED status."""
        order = create_test_order(customer=self.customer, restaurant=self.restaurant, status='PLACED')
        self.client.force_authenticate(user=self.customer)

        res = self.client.post(f'/api/orders/{order.id}/cancel/', {
            'reason': 'Ordered by mistake'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'CANCELLED')

    def test_customer_cannot_cancel_confirmed_or_preparing_order(self):
        """Customer cannot cancel an order once cooking/preparing has begun."""
        order = create_test_order(customer=self.customer, restaurant=self.restaurant, status='PREPARING')
        self.client.force_authenticate(user=self.customer)

        res = self.client.post(f'/api/orders/{order.id}/cancel/', {
            'reason': 'Changed mind'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        order.refresh_from_db()
        self.assertEqual(order.status, 'PREPARING')
