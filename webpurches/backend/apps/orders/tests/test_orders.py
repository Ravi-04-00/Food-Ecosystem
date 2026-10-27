import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, Address
from apps.products.models import FoodItem, FoodVariant, FoodAddon, Restaurant, Category
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem

class Phase10OrdersTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Customer 1
        self.customer = User.objects.create_user(
            username='phase10_cust',
            email='cust10@wsfood.io',
            password='Password123!',
            role='CUSTOMER'
        )

        # Customer 2 (for cross-user isolation test)
        self.customer2 = User.objects.create_user(
            username='phase10_cust2',
            email='cust10_other@wsfood.io',
            password='Password123!',
            role='CUSTOMER'
        )

        # Restaurant Owner
        self.owner = User.objects.create_user(
            username='phase10_owner',
            email='owner10@wsfood.io',
            password='Password123!',
            role='SHOP'
        )

        import datetime
        # Restaurant (24/7 operating hours for deterministic testing)
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Royal Tandoor Kitchen',
            address='100 MG Road, Bangalore',
            is_open=True,
            verification_status='APPROVED',
            opening_time=datetime.time(0, 0),
            closing_time=datetime.time(23, 59)
        )

        # Category
        self.category = Category.objects.create(
            name='Main Course'
        )

        # Food Item 1
        self.food1 = FoodItem.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Butter Chicken',
            price=Decimal('280.00'),
            is_available=True,
            stock=100
        )

        # Variant for Food Item 1
        self.variant = FoodVariant.objects.create(
            food=self.food1,
            name='Large / Boneless',
            price_modifier=Decimal('50.00')
        )

        # Addon for Food Item 1
        self.addon = FoodAddon.objects.create(
            food=self.food1,
            name='Extra Butter Gravy',
            price=Decimal('40.00'),
            is_available=True
        )

        # Food Item 2
        self.food2 = FoodItem.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Garlic Naan',
            price=Decimal('50.00'),
            is_available=True,
            stock=100
        )

        # Customer Address
        self.address = Address.objects.create(
            user=self.customer,
            label='HOME',
            full_name='Phase 10 Customer',
            street='Flat 402, Lotus Towers',
            city='Bangalore',
            pincode='560038',
            phone='9876543210',
            is_default=True
        )

    def _setup_customer_cart(self):
        cart, _ = Cart.objects.get_or_create(user=self.customer, defaults={'restaurant': self.restaurant})
        cart.restaurant = self.restaurant
        cart.save()
        cart.items.all().delete()

        # Item 1 with variant and addon
        CartItem.objects.create(
            cart=cart,
            product=self.food1,
            variant=self.variant,
            selected_addons=[{'id': self.addon.id, 'name': self.addon.name, 'price': float(self.addon.price)}],
            special_instructions='Make it medium spicy',
            quantity=2
        )

        # Item 2 plain
        CartItem.objects.create(
            cart=cart,
            product=self.food2,
            quantity=3
        )
        return cart

    def test_unauthenticated_checkout_rejected(self):
        response = self.client.post('/api/orders/checkout/', {})
        self.assertEqual(response.status_code, 401)

    def test_empty_cart_checkout_rejected(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        self.assertEqual(response.status_code, 400)
        self.assertIn('Cart is empty', response.data.get('error', ''))

    def test_checkout_successful_order_creation_and_cart_cleared(self):
        self.client.force_authenticate(user=self.customer)
        cart = self._setup_customer_cart()
        self.assertEqual(cart.items.count(), 2)

        response = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'payment_method': 'UPI (Instant)',
            'cooking_instructions': 'Ring doorbell on arrival'
        })

        self.assertEqual(response.status_code, 201)
        data = response.data.get('order', response.data)
        
        # Verify order persisted in PostgreSQL
        order = Order.objects.get(id=data['id'])
        self.assertEqual(order.customer, self.customer)
        self.assertEqual(order.restaurant, self.restaurant)
        self.assertEqual(order.status, 'PLACED')
        self.assertEqual(order.payment_status, 'PAYMENT_PENDING')
        self.assertTrue(order.order_number.startswith('FD-'))

        # Verify address snapshot
        self.assertEqual(order.delivery_address_snapshot['id'], self.address.id)
        self.assertIn('Flat 402', order.delivery_address_snapshot['flat_house_floor_building'])
        self.assertEqual(order.delivery_address_snapshot['pincode'], '560038')

        # Verify strict backend price calculation:
        # Item 1: (280 + 50 + 40) * 2 = 370 * 2 = 740
        # Item 2: 50 * 3 = 150
        # Subtotal = 740 + 150 = 890
        # Delivery = 30, Packaging = 15
        # Total = 890 + 30 + 15 = 935.00
        self.assertEqual(order.subtotal, Decimal('890.00'))
        self.assertEqual(order.delivery_fee, Decimal('30.00'))
        self.assertEqual(order.packaging_fee, Decimal('15.00'))
        self.assertEqual(order.total, Decimal('935.00'))

        # Verify Order items and snapshots
        items = order.items.all()
        self.assertEqual(items.count(), 2)
        item1 = items.filter(food_item=self.food1).first()
        self.assertEqual(item1.food_name_snapshot, 'Butter Chicken')
        self.assertEqual(item1.unit_price_snapshot, Decimal('370.00'))
        self.assertEqual(item1.quantity, 2)
        self.assertEqual(item1.item_total, Decimal('740.00'))
        self.assertEqual(item1.customization_snapshot['variant']['name'], 'Large / Boneless')

        # Verify cart was cleared in PostgreSQL
        cart.refresh_from_db()
        self.assertEqual(cart.items.count(), 0)

    def test_address_snapshot_preserves_history_when_address_edited_or_deleted(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        self.assertEqual(res.status_code, 201)
        order_id = res.data.get('order', res.data)['id']

        # Edit original address
        self.address.street = 'Renovated Villa 999'
        self.address.pincode = '110001'
        self.address.save()

        # Check that order snapshot is completely untouched
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.delivery_address_snapshot['street'], 'Flat 402, Lotus Towers')
        self.assertEqual(order.delivery_address_snapshot['pincode'], '560038')

        # Delete original address
        self.address.delete()
        order.refresh_from_db()
        self.assertEqual(order.delivery_address_snapshot['street'], 'Flat 402, Lotus Towers')
        self.assertIsNone(order.shipping_address)

    def test_closed_restaurant_blocks_checkout_and_keeps_cart(self):
        self.client.force_authenticate(user=self.customer)
        cart = self._setup_customer_cart()

        # Restaurant marks itself closed
        self.restaurant.is_open = False
        self.restaurant.save()

        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        self.assertEqual(res.status_code, 400)
        self.assertIn('closed', res.data.get('error', '').lower())

        # Verify cart was preserved
        cart.refresh_from_db()
        self.assertEqual(cart.items.count(), 2)

    def test_unavailable_food_blocks_checkout_and_keeps_cart(self):
        self.client.force_authenticate(user=self.customer)
        cart = self._setup_customer_cart()

        # Food becomes unavailable
        self.food1.is_available = False
        self.food1.save()

        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        self.assertEqual(res.status_code, 400)
        self.assertIn('unavailable', res.data.get('error', ''))

        # Verify cart was preserved
        cart.refresh_from_db()
        self.assertEqual(cart.items.count(), 2)

    def test_invalid_or_other_user_address_rejected(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        # Address belonging to customer2
        other_address = Address.objects.create(
            user=self.customer2,
            label='WORK',
            full_name='Customer Two',
            street='Tech Park 5B',
            city='Bangalore',
            pincode='560066',
            phone='9876543211'
        )

        res = self.client.post('/api/orders/checkout/', {'address_id': other_address.id})
        self.assertEqual(res.status_code, 400)
        self.assertIn('does not exist or does not belong to your account', res.data.get('error', ''))

    def test_customer_cannot_manipulate_price_from_frontend(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        # Malicious payload trying to inject price ₹1.00
        res = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'subtotal': 1.00,
            'total': 1.00,
            'grand_total': 1.00
        })
        self.assertEqual(res.status_code, 201)
        order_id = res.data.get('order', res.data)['id']

        order = Order.objects.get(id=order_id)
        # Backend recalculated: 890 + 30 + 15 = 935.00
        self.assertEqual(order.subtotal, Decimal('890.00'))
        self.assertEqual(order.total, Decimal('935.00'))

    def test_future_food_price_change_does_not_affect_old_orders(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()

        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        self.assertEqual(res.status_code, 201)
        order_id = res.data.get('order', res.data)['id']

        # Restaurant hikes prices
        self.food1.price = Decimal('999.00')
        self.food1.save()

        # Order snapshot remains unchanged
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.subtotal, Decimal('890.00'))
        item = order.items.filter(food_item=self.food1).first()
        self.assertEqual(item.unit_price_snapshot, Decimal('370.00'))
        self.assertEqual(item.item_total, Decimal('740.00'))

    def test_customer_can_view_orders_and_order_detail(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()
        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        order_id = res.data.get('order', res.data)['id']

        # List orders
        list_res = self.client.get('/api/orders/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.data), 1)
        self.assertEqual(list_res.data[0]['id'], order_id)
        self.assertTrue(list_res.data[0]['can_cancel'])

        # Detail order
        detail_res = self.client.get(f'/api/orders/{order_id}/')
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.data['id'], order_id)
        self.assertEqual(detail_res.data['restaurant_name'], 'Royal Tandoor Kitchen')
        self.assertEqual(len(detail_res.data['items']), 2)

    def test_customer_cannot_view_another_customers_order(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()
        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        order_id = res.data.get('order', res.data)['id']

        # Authenticate as Customer 2
        self.client.force_authenticate(user=self.customer2)
        res_other = self.client.get(f'/api/orders/{order_id}/')
        self.assertIn(res_other.status_code, [403, 404])

        # Customer 2's list must be empty
        list_res = self.client.get('/api/orders/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.data), 0)

    def test_customer_can_cancel_placed_order(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()
        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        order_id = res.data.get('order', res.data)['id']

        cancel_res = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(cancel_res.status_code, 200)
        self.assertTrue(cancel_res.data.get('success', False))

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'CANCELLED')

    def test_customer_cannot_cancel_confirmed_or_preparing_order(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()
        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        order_id = res.data.get('order', res.data)['id']

        # Kitchen confirms order
        order = Order.objects.get(id=order_id)
        order.status = 'CONFIRMED'
        order.save()

        # Customer attempts to cancel
        cancel_res = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(cancel_res.status_code, 400)
        self.assertIn('cannot be cancelled', cancel_res.data.get('error', ''))

        order.refresh_from_db()
        self.assertEqual(order.status, 'CONFIRMED')

    def test_customer_cannot_directly_modify_order_status(self):
        self.client.force_authenticate(user=self.customer)
        self._setup_customer_cart()
        res = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        order_id = res.data.get('order', res.data)['id']

        # Customer tries calling status update endpoint
        status_res = self.client.post(f'/api/orders/{order_id}/status/', {'status': 'DELIVERED'})
        self.assertEqual(status_res.status_code, 403)

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'PLACED')

    def test_order_filtering_by_status(self):
        self.client.force_authenticate(user=self.customer)

        # Create Order 1 (Placed)
        self._setup_customer_cart()
        r1 = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        o1_id = r1.data.get('order', r1.data)['id']

        # Create Order 2 (Delivered)
        self._setup_customer_cart()
        r2 = self.client.post('/api/orders/checkout/', {'address_id': self.address.id})
        o2_id = r2.data.get('order', r2.data)['id']
        o2 = Order.objects.get(id=o2_id)
        o2.status = 'DELIVERED'
        o2.save()

        # Filter active
        active_res = self.client.get('/api/orders/?filter=active')
        self.assertEqual(active_res.status_code, 200)
        active_ids = [o['id'] for o in active_res.data]
        self.assertIn(o1_id, active_ids)
        self.assertNotIn(o2_id, active_ids)

        # Filter completed
        completed_res = self.client.get('/api/orders/?filter=completed')
        self.assertEqual(completed_res.status_code, 200)
        completed_ids = [o['id'] for o in completed_res.data]
        self.assertNotIn(o1_id, completed_ids)
        self.assertIn(o2_id, completed_ids)


import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Address
from apps.products.models import Restaurant, FoodItem
from apps.orders.models import Order, OrderItem, OrderStatusHistory


class Phase11RestaurantOrderWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Restaurant Owner A
        self.restaurant_user_a = User.objects.create_user(
            username='chef_mario',
            email='mario@restaurant.com',
            password='testpassword123',
            role='RESTAURANT',
            phone='+919876543210'
        )
        self.restaurant_a = Restaurant.objects.create(
            owner=self.restaurant_user_a,
            name="Mario's Authentic Trattoria",
            is_open=True,
            verification_status='APPROVED'
        )
        self.food_a1 = FoodItem.objects.create(
            restaurant=self.restaurant_a,
            name='Truffle Tagliatelle',
            slug='truffle-tagliatelle',
            price=Decimal('350.00'),
            is_available=True
        )

        # 2. Restaurant Owner B
        self.restaurant_user_b = User.objects.create_user(
            username='chef_luigi',
            email='luigi@restaurant.com',
            password='testpassword123',
            role='RESTAURANT',
            phone='+919876543211'
        )
        self.restaurant_b = Restaurant.objects.create(
            owner=self.restaurant_user_b,
            name="Luigi's Neapolitan Pizzeria",
            is_open=True,
            verification_status='APPROVED'
        )
        self.food_b1 = FoodItem.objects.create(
            restaurant=self.restaurant_b,
            name='Margherita D.O.P.',
            slug='margherita-dop',
            price=Decimal('280.00'),
            is_available=True
        )

        # 3. Customer
        self.customer_user = User.objects.create_user(
            username='customer_jane',
            email='jane@customer.com',
            password='testpassword123',
            role='CUSTOMER',
            phone='+919876500001'
        )
        self.customer_address = Address.objects.create(
            user=self.customer_user,
            label='Home',
            full_name='Jane Doe',
            street='42 Cyber Road',
            city='Neo Bengaluru',
            pincode='560001',
            is_default=True
        )

    def _create_sample_order(self, restaurant, customer, order_number, status='PLACED'):
        order = Order.objects.create(
            order_number=order_number,
            customer=customer,
            restaurant=restaurant,
            shipping_address=self.customer_address,
            delivery_address_text='42 Cyber Road, Neo Bengaluru',
            delivery_address_snapshot={
                'label': 'Home',
                'full_name': 'Jane Doe',
                'street': '42 Cyber Road',
                'city': 'Neo Bengaluru',
                'pincode': '560001',
                'phone': '+919876500001'
            },
            status=status,
            payment_status='PAYMENT_PENDING',
            subtotal=Decimal('350.00'),
            item_total=Decimal('350.00'),
            delivery_fee=Decimal('30.00'),
            packaging_fee=Decimal('15.00'),
            total=Decimal('395.00'),
            grand_total=Decimal('395.00'),
            cooking_instructions='Extra basil please'
        )
        OrderItem.objects.create(
            order=order,
            food_item=self.food_a1 if restaurant == self.restaurant_a else self.food_b1,
            food_name_snapshot='Truffle Tagliatelle' if restaurant == self.restaurant_a else 'Margherita D.O.P.',
            unit_price_snapshot=Decimal('350.00'),
            price=Decimal('350.00'),
            quantity=1,
            customization_snapshot={},
            item_total=Decimal('350.00')
        )
        OrderStatusHistory.objects.create(
            order=order,
            from_status='',
            to_status='PLACED',
            actor=customer,
            actor_role='CUSTOMER',
            reason='Order placed by customer'
        )
        return order

    def test_01_restaurant_sees_only_its_own_orders(self):
        """Restaurant A should only see orders placed with Restaurant A, not Restaurant B."""
        order_a = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-001')
        order_b = self._create_sample_order(self.restaurant_b, self.customer_user, 'FD-TEST-002')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        orders_data = response.data.get('results') if isinstance(response.data, dict) else response.data
        order_ids = [o['id'] for o in orders_data]

        self.assertIn(order_a.id, order_ids)
        self.assertNotIn(order_b.id, order_ids)

    def test_02_restaurant_cannot_view_another_restaurant_order_detail(self):
        """Restaurant A cannot view Restaurant B's order detail."""
        order_b = self._create_sample_order(self.restaurant_b, self.customer_user, 'FD-TEST-003')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.get(f'/api/orders/{order_b.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_03_restaurant_can_accept_placed_order(self):
        """Restaurant A can accept an eligible PLACED order when OPEN."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-004', status='PLACED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.post(f'/api/orders/{order.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))

        order.refresh_from_db()
        self.assertEqual(order.status, 'CONFIRMED')

        # Check status history was created
        latest_history = order.status_history.last()
        self.assertEqual(latest_history.from_status, 'PLACED')
        self.assertEqual(latest_history.to_status, 'CONFIRMED')
        self.assertEqual(latest_history.actor, self.restaurant_user_a)

    def test_04_restaurant_reject_placed_order_requires_reason(self):
        """Restaurant rejecting a PLACED order requires a reason."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-005', status='PLACED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        # Attempt rejection without reason
        response = self.client.post(f'/api/orders/{order.id}/reject/', data={})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data.get('error', '').lower())

        # Rejection with valid reason
        response = self.client.post(f'/api/orders/{order.id}/reject/', data={
            'reason': 'Kitchen at capacity',
            'explanation': 'Too many dine-in orders currently'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, 'CANCELLED')
        self.assertIn('Kitchen at capacity', order.rejection_reason)
        self.assertEqual(order.cancelled_by, self.restaurant_user_a)

    def test_05_restaurant_cannot_reject_already_processed_order(self):
        """Restaurant cannot reject an already accepted/preparing order."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-006', status='CONFIRMED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.post(f'/api/orders/{order.id}/reject/', data={'reason': 'Changed mind'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        order.refresh_from_db()
        self.assertEqual(order.status, 'CONFIRMED')

    def test_06_restaurant_can_mark_confirmed_as_preparing(self):
        """Restaurant can transition CONFIRMED order to PREPARING."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-007', status='CONFIRMED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.post(f'/api/orders/{order.id}/prepare/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, 'PREPARING')

        latest_history = order.status_history.last()
        self.assertEqual(latest_history.from_status, 'CONFIRMED')
        self.assertEqual(latest_history.to_status, 'PREPARING')

    def test_07_restaurant_can_mark_preparing_as_ready_for_pickup(self):
        """Restaurant can transition PREPARING order to READY_FOR_PICKUP."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-008', status='PREPARING')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.post(f'/api/orders/{order.id}/ready/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, 'READY_FOR_PICKUP')

        latest_history = order.status_history.last()
        self.assertEqual(latest_history.to_status, 'READY_FOR_PICKUP')

    def test_08_invalid_status_transitions_are_rejected(self):
        """Disallowed status transitions should return 400 Bad Request."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-009', status='PLACED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        # Cannot jump from PLACED directly to READY_FOR_PICKUP
        response = self.client.post(f'/api/orders/{order.id}/ready/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Cannot jump from PLACED directly to PREPARING without accepting first
        response = self.client.post(f'/api/orders/{order.id}/prepare/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_09_closed_restaurant_cannot_accept_new_orders(self):
        """When restaurant is CLOSED, accepting a PLACED order must be rejected."""
        self.restaurant_a.is_open = False
        self.restaurant_a.save()

        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-010', status='PLACED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.post(f'/api/orders/{order.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('closed', response.data.get('error', '').lower())

        order.refresh_from_db()
        self.assertEqual(order.status, 'PLACED')

    def test_10_previously_accepted_orders_continue_after_closing(self):
        """Previously accepted orders can continue through preparation even after restaurant closes."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-011', status='CONFIRMED')

        # Restaurant closes now
        self.restaurant_a.is_open = False
        self.restaurant_a.save()

        self.client.force_authenticate(user=self.restaurant_user_a)
        # Marking preparing is permitted
        res_prepare = self.client.post(f'/api/orders/{order.id}/prepare/')
        self.assertEqual(res_prepare.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'PREPARING')

        # Marking ready is permitted
        res_ready = self.client.post(f'/api/orders/{order.id}/ready/')
        self.assertEqual(res_ready.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'READY_FOR_PICKUP')

    def test_11_historical_order_prices_remain_unchanged(self):
        """Changing food price in catalog does NOT alter historical order snapshots."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-012')
        item = order.items.first()
        initial_price = item.unit_price_snapshot
        initial_total = order.total

        # Catalog food item price increases
        self.food_a1.price = Decimal('999.00')
        self.food_a1.save()

        # Fetch order from API
        self.client.force_authenticate(user=self.restaurant_user_a)
        response = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        fetched_item = response.data['items'][0]
        self.assertEqual(Decimal(str(fetched_item['unit_price_snapshot'])), initial_price)
        self.assertEqual(Decimal(str(response.data['total'])), initial_total)

    def test_12_order_status_history_chronology_and_audit(self):
        """Full lifecycle logs complete audit trail with actors and timestamps."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-013', status='PLACED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        self.client.post(f'/api/orders/{order.id}/accept/')
        self.client.post(f'/api/orders/{order.id}/prepare/')
        self.client.post(f'/api/orders/{order.id}/ready/')

        # Retrieve history endpoint
        response = self.client.get(f'/api/orders/{order.id}/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        history_items = response.data
        self.assertEqual(len(history_items), 4)  # PLACED, CONFIRMED, PREPARING, READY_FOR_PICKUP
        statuses = [h['to_status'] for h in history_items]
        self.assertEqual(statuses, ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'])

    def test_13_duplicate_submissions_handled_safely(self):
        """Accepting an already confirmed order should be safely rejected."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-014', status='PLACED')

        self.client.force_authenticate(user=self.restaurant_user_a)
        res1 = self.client.post(f'/api/orders/{order.id}/accept/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Duplicate accept
        res2 = self.client.post(f'/api/orders/{order.id}/accept/')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_14_customer_cannot_invoke_restaurant_actions(self):
        """Customer cannot accept or prepare restaurant orders."""
        order = self._create_sample_order(self.restaurant_a, self.customer_user, 'FD-TEST-015', status='PLACED')

        self.client.force_authenticate(user=self.customer_user)
        response = self.client.post(f'/api/orders/{order.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
