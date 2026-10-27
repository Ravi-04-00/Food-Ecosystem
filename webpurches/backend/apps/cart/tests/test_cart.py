import json
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Profile, Address
from apps.products.models import Restaurant, FoodItem, FoodVariant, FoodAddon
from apps.cart.models import Cart, CartItem


class Phase9CartAndAddressTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Customer 1
        self.customer1 = User.objects.create_user(
            username='cust1',
            email='cust1@wsfood.io',
            password='Password123!',
            role='CUSTOMER'
        )
        Profile.objects.create(user=self.customer1, full_name='Customer One', phone='9876543210')

        # Customer 2
        self.customer2 = User.objects.create_user(
            username='cust2',
            email='cust2@wsfood.io',
            password='Password123!',
            role='CUSTOMER'
        )
        Profile.objects.create(user=self.customer2, full_name='Customer Two', phone='9876543211')

        # Restaurant Owner 1 & Restaurant 1
        self.rest_owner1 = User.objects.create_user(
            username='owner1',
            email='owner1@wsfood.io',
            password='Password123!',
            role='RESTAURANT'
        )
        self.restaurant1 = Restaurant.objects.create(
            owner=self.rest_owner1,
            name="Chef Kane's Grill House",
            is_open=True,
            verification_status='APPROVED'
        )

        # Restaurant Owner 2 & Restaurant 2
        self.rest_owner2 = User.objects.create_user(
            username='owner2',
            email='owner2@wsfood.io',
            password='Password123!',
            role='RESTAURANT'
        )
        self.restaurant2 = Restaurant.objects.create(
            owner=self.rest_owner2,
            name="Noodle Wok Dynasty",
            is_open=True,
            verification_status='APPROVED'
        )

        # Closed Restaurant
        self.closed_restaurant = Restaurant.objects.create(
            owner=self.rest_owner1,
            name="Closed Midnight Kitchen",
            is_open=False,
            verification_status='APPROVED'
        )

        # Food items in Restaurant 1
        self.food1 = FoodItem.objects.create(
            restaurant=self.restaurant1,
            name='Smoked Cheeseburger',
            price=Decimal('250.00'),
            is_available=True,
            dietary_type='NON_VEG',
            is_veg=False
        )
        self.variant1 = FoodVariant.objects.create(
            food=self.food1,
            name='Double Patty Mega',
            price_modifier=Decimal('60.00')
        )
        self.addon1 = FoodAddon.objects.create(
            food=self.food1,
            name='Truffle Mayo',
            price=Decimal('25.00'),
            is_available=True
        )
        self.addon2 = FoodAddon.objects.create(
            food=self.food1,
            name='Caramelized Onions',
            price=Decimal('20.00'),
            is_available=True
        )

        self.unavailable_food = FoodItem.objects.create(
            restaurant=self.restaurant1,
            name='Rare Lobster Special',
            price=Decimal('890.00'),
            is_available=False,
            dietary_type='NON_VEG',
            is_veg=False
        )

        # Food item in Restaurant 2
        self.food2 = FoodItem.objects.create(
            restaurant=self.restaurant2,
            name='Spicy Szechuan Dan Dan Noodles',
            price=Decimal('280.00'),
            is_available=True,
            dietary_type='NON_VEG',
            is_veg=False
        )

        # Food item in Closed Restaurant
        self.closed_food = FoodItem.objects.create(
            restaurant=self.closed_restaurant,
            name='Late Night Ramen',
            price=Decimal('220.00'),
            is_available=True,
            dietary_type='NON_VEG',
            is_veg=False
        )

    def test_01_get_empty_cart(self):
        self.client.force_authenticate(user=self.customer1)
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_items'], 0)
        self.assertEqual(float(res.data['subtotal']), 0.0)
        self.assertEqual(len(res.data['items']), 0)
        self.assertIsNone(res.data['restaurant'])

    def test_02_add_food_to_cart_and_calculate_price(self):
        self.client.force_authenticate(user=self.customer1)
        payload = {
            'food_id': self.food1.id,
            'quantity': 2
        }
        res = self.client.post('/api/cart/items/', data=payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        cart_data = res.data['cart']
        self.assertEqual(cart_data['total_items'], 2)
        # 250.00 * 2 = 500.00
        self.assertEqual(float(cart_data['subtotal']), 500.00)
        self.assertEqual(cart_data['restaurant']['id'], self.restaurant1.id)
        self.assertEqual(len(cart_data['items']), 1)
        self.assertEqual(float(cart_data['items'][0]['unit_price']), 250.00)
        self.assertEqual(float(cart_data['items'][0]['subtotal']), 500.00)

    def test_03_add_food_with_variant_and_addons(self):
        self.client.force_authenticate(user=self.customer1)
        payload = {
            'food_id': self.food1.id,
            'quantity': 1,
            'variant_id': self.variant1.id,
            'addon_ids': [self.addon1.id, self.addon2.id],
            'special_instructions': 'Extra crispy fries on the side please'
        }
        res = self.client.post('/api/cart/items/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        item = res.data['cart']['items'][0]
        # Base: 250, Variant: +60, Addons: +25 +20 = 355.00
        self.assertEqual(float(item['unit_price']), 355.00)
        self.assertEqual(float(item['subtotal']), 355.00)
        self.assertEqual(len(item['selected_addons']), 2)
        self.assertEqual(item['special_instructions'], 'Extra crispy fries on the side please')

    def test_04_increase_and_decrease_quantity(self):
        self.client.force_authenticate(user=self.customer1)
        res_add = self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 1})
        item_id = res_add.data['item_id']

        # Increase quantity by 2
        res_inc = self.client.patch(f'/api/cart/items/{item_id}/', data={'quantity': 3})
        self.assertEqual(res_inc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_inc.data['cart']['total_items'], 3)
        self.assertEqual(float(res_inc.data['cart']['subtotal']), 750.00)

        # Decrease quantity via delta=-1
        res_dec = self.client.patch(f'/api/cart/items/{item_id}/', data={'delta': -1})
        self.assertEqual(res_dec.status_code, status.HTTP_200_OK)
        self.assertEqual(res_dec.data['cart']['total_items'], 2)
        self.assertEqual(float(res_dec.data['cart']['subtotal']), 500.00)

    def test_05_decrease_quantity_to_zero_removes_item(self):
        self.client.force_authenticate(user=self.customer1)
        res_add = self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 1})
        item_id = res_add.data['item_id']

        # Delta -1 on quantity 1 should remove it
        res_dec = self.client.patch(f'/api/cart/items/{item_id}/', data={'delta': -1})
        self.assertEqual(res_dec.status_code, status.HTTP_200_OK)
        self.assertEqual(res_dec.data['cart']['total_items'], 0)
        self.assertEqual(len(res_dec.data['cart']['items']), 0)
        self.assertIsNone(res_dec.data['cart']['restaurant'])

    def test_06_remove_specific_item_and_clear_cart(self):
        self.client.force_authenticate(user=self.customer1)
        res_add = self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 2})
        item_id = res_add.data['item_id']

        # Delete specific item
        res_del = self.client.delete(f'/api/cart/items/{item_id}/')
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.assertEqual(res_del.data['cart']['total_items'], 0)

        # Add again then clear
        self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 2})
        res_clear = self.client.post('/api/cart/clear/')
        self.assertEqual(res_clear.status_code, status.HTTP_200_OK)
        self.assertEqual(res_clear.data['cart']['total_items'], 0)
        self.assertIsNone(res_clear.data['cart']['restaurant'])

    def test_07_reject_unavailable_food(self):
        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/cart/items/', data={'food_id': self.unavailable_food.id, 'quantity': 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Unavailable food cannot be added', res.data['error'])

    def test_08_reject_closed_restaurant_food(self):
        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/cart/items/', data={'food_id': self.closed_food.id, 'quantity': 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('currently closed', res.data['error'])

    def test_09_reject_invalid_food_id_and_zero_quantity(self):
        self.client.force_authenticate(user=self.customer1)
        # Invalid food ID
        res_404 = self.client.post('/api/cart/items/', data={'food_id': 99999, 'quantity': 1})
        self.assertEqual(res_404.status_code, status.HTTP_404_NOT_FOUND)

        # Quantity 0
        res_zero = self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 0})
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('greater than zero', res_zero.data['error'])

    def test_10_single_restaurant_cart_conflict_check(self):
        self.client.force_authenticate(user=self.customer1)
        # 1. Add food from Restaurant 1
        res1 = self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 1})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # 2. Attempt to add food from Restaurant 2 without clear_cart
        res2 = self.client.post('/api/cart/items/', data={'food_id': self.food2.id, 'quantity': 1})
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(res2.data['conflict'])
        self.assertEqual(res2.data['current_restaurant']['id'], self.restaurant1.id)
        self.assertEqual(res2.data['new_restaurant']['id'], self.restaurant2.id)
        self.assertIn(self.restaurant1.name, res2.data['message'])

        # Verify old cart was NOT silently wiped
        res_cart = self.client.get('/api/cart/')
        self.assertEqual(res_cart.data['restaurant']['id'], self.restaurant1.id)
        self.assertEqual(res_cart.data['total_items'], 1)

    def test_11_single_restaurant_cart_clear_and_add_after_confirmation(self):
        self.client.force_authenticate(user=self.customer1)
        # Add food from Restaurant 1
        self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 1})

        # Add food from Restaurant 2 with clear_cart=True
        res = self.client.post('/api/cart/items/', data={
            'food_id': self.food2.id,
            'quantity': 2,
            'clear_cart': True
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        cart_data = res.data['cart']
        self.assertEqual(cart_data['restaurant']['id'], self.restaurant2.id)
        self.assertEqual(cart_data['total_items'], 2)
        # 280.00 * 2 = 560.00
        self.assertEqual(float(cart_data['subtotal']), 560.00)

    def test_12_customer_cart_isolation(self):
        # Customer 1 adds food
        self.client.force_authenticate(user=self.customer1)
        res_add = self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 2})
        cust1_item_id = res_add.data['item_id']

        # Customer 2 checks cart
        self.client.force_authenticate(user=self.customer2)
        res_cust2 = self.client.get('/api/cart/')
        self.assertEqual(res_cust2.data['total_items'], 0)

        # Customer 2 cannot modify Customer 1's item
        res_mod = self.client.patch(f'/api/cart/items/{cust1_item_id}/', data={'quantity': 5})
        self.assertEqual(res_mod.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 2 cannot delete Customer 1's item
        res_del = self.client.delete(f'/api/cart/items/{cust1_item_id}/')
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)

    def test_13_cart_persisted_in_postgresql_restored_across_sessions(self):
        # Customer 1 adds item
        self.client.force_authenticate(user=self.customer1)
        self.client.post('/api/cart/items/', data={'food_id': self.food1.id, 'quantity': 3})

        # Check in DB
        db_cart = Cart.objects.get(user=self.customer1)
        self.assertEqual(db_cart.total_items, 3)
        self.assertEqual(db_cart.restaurant, self.restaurant1)

        # New client session simulating logout/login
        new_client = APIClient()
        new_client.force_authenticate(user=self.customer1)
        res = new_client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_items'], 3)
        self.assertEqual(float(res.data['subtotal']), 750.00)
        self.assertEqual(res.data['restaurant']['id'], self.restaurant1.id)

    def test_14_address_list_and_create(self):
        self.client.force_authenticate(user=self.customer1)
        # Create first address -> automatically becomes default
        addr1_data = {
            'label': 'Home',
            'full_name': 'Customer One',
            'street': 'Flat 402, Green Valley Apartments',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'pincode': '600028',
            'phone': '9876543210'
        }
        res1 = self.client.post('/api/accounts/addresses/', data=addr1_data)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data['is_default'])

        # Create second address without is_default
        addr2_data = {
            'label': 'Work',
            'full_name': 'Customer One',
            'street': 'Tidel Park, 5th Floor, Taramani',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'pincode': '600113',
            'phone': '9876543210',
            'is_default': False
        }
        res2 = self.client.post('/api/accounts/addresses/', data=addr2_data)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res2.data['is_default'])

        # List addresses
        res_list = self.client.get('/api/accounts/addresses/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 2)
        # First one should be default
        self.assertTrue(res_list.data[0]['is_default'])

    def test_15_address_edit_delete_and_set_default(self):
        self.client.force_authenticate(user=self.customer1)
        addr1 = Address.objects.create(
            user=self.customer1,
            label='Home',
            full_name='Customer One',
            street='Old Street 12',
            city='Chennai',
            pincode='600001',
            phone='9876543210',
            is_default=True
        )
        addr2 = Address.objects.create(
            user=self.customer1,
            label='Office',
            full_name='Customer One',
            street='Tech Hub 34',
            city='Chennai',
            pincode='600096',
            phone='9876543210',
            is_default=False
        )

        # Set addr2 as default
        res_default = self.client.post(f'/api/accounts/addresses/{addr2.id}/set-default/')
        self.assertEqual(res_default.status_code, status.HTTP_200_OK)
        self.assertTrue(res_default.data['address']['is_default'])

        addr1.refresh_from_db()
        addr2.refresh_from_db()
        self.assertFalse(addr1.is_default)
        self.assertTrue(addr2.is_default)

        # Edit addr1
        res_edit = self.client.patch(f'/api/accounts/addresses/{addr1.id}/', data={'street': 'New Street 99'})
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)
        self.assertEqual(res_edit.data['street'], 'New Street 99')

        # Delete addr1
        res_del = self.client.delete(f'/api/accounts/addresses/{addr1.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Address.objects.filter(id=addr1.id).exists())

    def test_16_address_customer_isolation(self):
        addr1 = Address.objects.create(
            user=self.customer1,
            label='Home',
            full_name='Customer One',
            street='Secret Street',
            city='Chennai',
            pincode='600001',
            phone='9876543210'
        )

        # Customer 2 attempts to view Customer 1's address
        self.client.force_authenticate(user=self.customer2)
        res_view = self.client.get(f'/api/accounts/addresses/{addr1.id}/')
        self.assertEqual(res_view.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 2 attempts to edit
        res_edit = self.client.patch(f'/api/accounts/addresses/{addr1.id}/', data={'street': 'Hacked'})
        self.assertEqual(res_edit.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 2 attempts to delete
        res_del = self.client.delete(f'/api/accounts/addresses/{addr1.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)
