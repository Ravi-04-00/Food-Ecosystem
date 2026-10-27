import json
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem
from apps.categories.models import Category

class Phase7DiscoveryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(
            email='owner_p7@example.com',
            username='owner_p7',
            password='Password123!',
            role='RESTAURANT'
        )
        cls.customer = User.objects.create_user(
            email='customer_phase7@example.com',
            username='cust_p7',
            password='Password123!',
            role='CUSTOMER'
        )
        cls.category1 = Category.objects.create(
            name='Biryani',
            slug='biryani',
            icon='🍛'
        )
        cls.category2 = Category.objects.create(
            name='Burgers',
            slug='burgers',
            icon='🍔'
        )
        cls.restaurant = Restaurant.objects.create(
            owner=cls.owner,
            name='Royal Dum Vault',
            tagline='Finest royal dum biryani',
            cuisines=['Biryani', 'Mughlai', 'Kebabs'],
            rating=4.9,
            review_count=180,
            address='100 MG Road, Bengaluru',
            delivery_time_text='20-25 min',
            price_for_two='₹450 for two',
            is_open=True,
            is_verified=True,
            verification_status='APPROVED',
            revenue_today=15000.00
        )
        cls.food_veg = FoodItem.objects.create(
            restaurant=cls.restaurant,
            category=cls.category1,
            name='Royal Veg Dum Biryani',
            slug='royal-veg-dum-biryani',
            short_description='Fragrant saffron basmati dum cooked with vegetables',
            price=299.00,
            is_veg=True,
            is_available=True,
            rating=4.8
        )
        cls.food_nonveg = FoodItem.objects.create(
            restaurant=cls.restaurant,
            category=cls.category1,
            name='Royal Chicken Dum Biryani',
            slug='royal-chicken-dum-biryani',
            short_description='Clay pot slow-steamed tender chicken biryani',
            price=349.00,
            is_veg=False,
            is_available=True,
            rating=4.9
        )
        cls.food_unavail = FoodItem.objects.create(
            restaurant=cls.restaurant,
            category=cls.category2,
            name='Royal Smash Burger Stack',
            slug='royal-smash-burger-stack',
            short_description='Smoked cheddar burger',
            price=379.00,
            is_veg=False,
            is_available=False,
            rating=4.7
        )

    def setUp(self):
        self.client = APIClient()

    def test_01_categories_listing_and_counts(self):
        """Categories API returns active categories with accurate dish count."""
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertGreater(len(results), 0)
        first_cat = next((c for c in results if c['slug'] == 'biryani'), results[0])
        self.assertIn('name', first_cat)
        self.assertIn('slug', first_cat)
        self.assertIn('product_count', first_cat)
        self.assertGreaterEqual(first_cat['product_count'], 2)

    def test_02_restaurants_listing_privacy(self):
        """Restaurant listing does not leak private financial data (revenue, total orders)."""
        response = self.client.get('/api/restaurants/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertGreater(len(results), 0)
        
        for r in results:
            self.assertNotIn('revenue_today', r)
            self.assertNotIn('revenue_weekly', r)
            self.assertNotIn('revenue_monthly', r)
            self.assertNotIn('total_orders', r)
            self.assertIn('name', r)
            self.assertIn('rating', r)
            self.assertIn('is_open', r)
            self.assertIn('verification_status', r)
            self.assertEqual(r['verification_status'], 'APPROVED')

    def test_03_restaurant_detail_with_menu_categories(self):
        """Restaurant detail returns structured menu categories and food items."""
        response = self.client.get(f'/api/restaurants/{self.restaurant.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn('menu_categories', data)
        self.assertIn('foods', data)
        self.assertNotIn('revenue_today', data)
        self.assertEqual(data['id'], self.restaurant.id)
        self.assertGreaterEqual(len(data['foods']), 3)

    def test_04_food_listing_and_dietary_filters(self):
        """Food listing supports veg_only and non_veg_only filters."""
        # Veg filter
        res_veg = self.client.get('/api/foods/?veg_only=true')
        self.assertEqual(res_veg.status_code, status.HTTP_200_OK)
        veg_items = res_veg.data.get('results', res_veg.data)
        self.assertGreater(len(veg_items), 0)
        for item in veg_items:
            self.assertTrue(item['is_veg'])

        # Non-Veg filter
        res_non_veg = self.client.get('/api/foods/?non_veg_only=true')
        self.assertEqual(res_non_veg.status_code, status.HTTP_200_OK)
        non_veg_items = res_non_veg.data.get('results', res_non_veg.data)
        self.assertGreater(len(non_veg_items), 0)
        for item in non_veg_items:
            self.assertFalse(item['is_veg'])

    def test_05_search_case_insensitive_restaurant_and_food(self):
        """Search query matches restaurant name, food name, category, and cuisines."""
        # Search for biryani
        res_biryani = self.client.get('/api/foods/?search=biryani')
        self.assertEqual(res_biryani.status_code, status.HTTP_200_OK)
        items = res_biryani.data.get('results', res_biryani.data)
        self.assertGreater(len(items), 0)
        for item in items:
            match = (
                'biryani' in item['name'].lower() or
                'biryani' in (item.get('short_description') or '').lower() or
                'biryani' in (item.get('category_name') or '').lower() or
                'biryani' in (item.get('restaurant_name') or '').lower()
            )
            self.assertTrue(match)

    def test_06_food_availability_marking(self):
        """Food detail displays availability correctly."""
        res_avail = self.client.get(f'/api/foods/{self.food_veg.id}/')
        self.assertEqual(res_avail.status_code, status.HTTP_200_OK)
        self.assertTrue(res_avail.data['is_available'])

        res_unavail = self.client.get(f'/api/foods/{self.food_unavail.id}/')
        self.assertEqual(res_unavail.status_code, status.HTTP_200_OK)
        self.assertFalse(res_unavail.data['is_available'])

    def test_07_regression_auth_and_login(self):
        """Phase 2 & 3: Customer Login and JWT generation remain intact."""
        res_login = self.client.post('/api/auth/login/', {
            'identifier': 'customer_phase7@example.com',
            'password': 'Password123!',
            'role': 'CUSTOMER'
        }, format='json')
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', res_login.data)
        self.assertIn('refresh_token', res_login.data)

    def test_08_regression_phase6_settings(self):
        """Phase 6: Settings & Preferences endpoint remains intact."""
        res_login = self.client.post('/api/auth/login/', {
            'identifier': 'customer_phase7@example.com',
            'password': 'Password123!',
            'role': 'CUSTOMER'
        }, format='json')
        token = res_login.data['access_token']

        client_auth = APIClient()
        client_auth.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_settings = client_auth.get('/api/auth/settings/')
        self.assertEqual(res_settings.status_code, status.HTTP_200_OK)
        self.assertIn('settings', res_settings.data)

    def test_09_regression_customer_registration(self):
        """Phase 2: Customer registration succeeds with PostgreSQL persistence."""
        res_reg = self.client.post('/api/auth/register/customer/', {
            'full_name': 'Test Registration Customer',
            'email': 'new_cust_p7@example.com',
            'phone': '+91 98888 11111',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'address': '202 Phase Seven Tower, Bengaluru'
        }, format='json')
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_reg.data['success'])
        self.assertEqual(res_reg.data['role'], 'CUSTOMER')
        self.assertTrue(User.objects.filter(email='new_cust_p7@example.com').exists())

    def test_10_regression_phase4_logout_and_blacklisting(self):
        """Phase 4: Customer logout blacklists refresh token."""
        res_login = self.client.post('/api/auth/login/', {
            'identifier': 'customer_phase7@example.com',
            'password': 'Password123!',
            'role': 'CUSTOMER'
        }, format='json')
        refresh = res_login.data['refresh_token']
        access = res_login.data['access_token']

        client_auth = APIClient()
        client_auth.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        res_logout = client_auth.post('/api/auth/logout/', {
            'refresh_token': refresh
        }, format='json')
        self.assertEqual(res_logout.status_code, status.HTTP_200_OK)

        # Refresh with blacklisted token must fail
        res_refresh = self.client.post('/api/auth/token/refresh/', {
            'refresh': refresh
        }, format='json')
        self.assertEqual(res_refresh.status_code, status.HTTP_401_UNAUTHORIZED)


import json
from io import BytesIO
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, Profile
from apps.products.models import Restaurant, FoodItem
from apps.menu.models import MenuCategory


def generate_test_image(name='test_img.png', color='blue'):
    """Generates a small in-memory image for upload testing."""
    file = BytesIO()
    img = Image.new('RGB', (100, 100), color=color)
    img.save(file, 'PNG')
    file.seek(0)
    return SimpleUploadedFile(name, file.read(), content_type='image/png')


class Phase8RestaurantManagementTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Restaurant Owner 1
        cls.owner1 = User.objects.create_user(
            email='chef_mario@wsfood.io',
            username='chef_mario',
            password='Password123!',
            role='RESTAURANT',
            phone='+91 98765 11111'
        )
        cls.restaurant1 = Restaurant.objects.create(
            owner=cls.owner1,
            name='Mario Trattoria & Pizzeria',
            owner_name='Chef Mario',
            address='12 Olive Street, Indiranagar',
            is_open=True,
            verification_status='APPROVED'
        )

        # Restaurant Owner 2 (for isolation testing)
        cls.owner2 = User.objects.create_user(
            email='chef_luigi@wsfood.io',
            username='chef_luigi',
            password='Password123!',
            role='RESTAURANT',
            phone='+91 98765 22222'
        )
        cls.restaurant2 = Restaurant.objects.create(
            owner=cls.owner2,
            name='Luigi Artisan Bakery',
            owner_name='Chef Luigi',
            address='44 Pine Avenue, Koramangala',
            is_open=False,
            verification_status='APPROVED'
        )

        # Customer User
        cls.customer = User.objects.create_user(
            email='diner_alex@wsfood.io',
            username='diner_alex',
            password='Password123!',
            role='CUSTOMER'
        )

        # Log in once per test class (3 auth calls total). Logging in inside
        # setUp() would fire 3 logins per test (48 total) and exceed the
        # 'auth' throttle (20/minute), returning 429 with no access_token.
        anon = APIClient()
        res1 = anon.post('/api/auth/login/', {
            'identifier': 'chef_mario@wsfood.io',
            'password': 'Password123!',
            'role': 'RESTAURANT'
        }, format='json')
        cls.token1 = res1.data['access_token']
        res2 = anon.post('/api/auth/login/', {
            'identifier': 'chef_luigi@wsfood.io',
            'password': 'Password123!',
            'role': 'RESTAURANT'
        }, format='json')
        cls.token2 = res2.data['access_token']
        res3 = anon.post('/api/auth/login/', {
            'identifier': 'diner_alex@wsfood.io',
            'password': 'Password123!',
            'role': 'CUSTOMER'
        }, format='json')
        cls.token_cust = res3.data['access_token']

    def setUp(self):
        self.client_anon = APIClient()

        # Fresh API clients per test reusing the class-level tokens.
        self.client1 = APIClient()
        self.client1.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')

        self.client2 = APIClient()
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')

        self.client_cust = APIClient()
        self.client_cust.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_cust}')

    # -------------------------------------------------------------------------
    # 1. Restaurant Profile
    # -------------------------------------------------------------------------

    def test_01_view_restaurant_profile(self):
        """Restaurant can view its own profile with read-only email and status."""
        res = self.client1.get('/api/restaurants/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['restaurant_name'], 'Mario Trattoria & Pizzeria')
        self.assertEqual(res.data['email'], 'chef_mario@wsfood.io')
        self.assertEqual(res.data['verification_status'], 'APPROVED')
        self.assertEqual(res.data['status'], 'OPEN')
        self.assertTrue(res.data['is_open'])

    def test_02_edit_restaurant_profile_and_logo(self):
        """Restaurant can edit name, owner name, phone, address, and upload logo."""
        logo = generate_test_image('mario_logo.png')
        res = self.client1.patch('/api/restaurants/me/', {
            'restaurant_name': 'Mario Super Trattoria',
            'owner_name': 'Mario Rossi',
            'phone': '+91 94444 88888',
            'restaurant_address': '99 New Olive Way, Bengaluru',
            'restaurant_logo': logo
        }, format='multipart')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.restaurant1.refresh_from_db()
        self.owner1.refresh_from_db()

        self.assertEqual(self.restaurant1.name, 'Mario Super Trattoria')
        self.assertEqual(self.restaurant1.owner_name, 'Mario Rossi')
        self.assertEqual(self.owner1.phone, '+91 94444 88888')
        self.assertEqual(self.restaurant1.address, '99 New Olive Way, Bengaluru')
        self.assertTrue(bool(self.restaurant1.restaurant_logo))

    def test_03_remove_restaurant_logo(self):
        """Restaurant can remove its logo."""
        # First set a logo
        self.restaurant1.restaurant_logo = generate_test_image('temp.png')
        self.restaurant1.save()

        res = self.client1.patch('/api/restaurants/me/', {
            'remove_logo': True
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.restaurant1.refresh_from_db()
        self.assertFalse(bool(self.restaurant1.restaurant_logo))

    def test_04_profile_email_and_verification_immutable(self):
        """Registered email and verification status cannot be changed by restaurant."""
        # Attempt to change email
        res_email = self.client1.patch('/api/restaurants/me/', {
            'email': 'hacker@wsfood.io'
        }, format='json')
        self.assertEqual(res_email.status_code, status.HTTP_400_BAD_REQUEST)
        self.owner1.refresh_from_db()
        self.assertEqual(self.owner1.email, 'chef_mario@wsfood.io')

        # Attempt to modify verification status
        res_verif = self.client1.patch('/api/restaurants/me/', {
            'verification_status': 'SUPER_VERIFIED'
        }, format='json')
        self.assertEqual(res_verif.status_code, status.HTTP_403_FORBIDDEN)
        self.restaurant1.refresh_from_db()
        self.assertEqual(self.restaurant1.verification_status, 'APPROVED')

    # -------------------------------------------------------------------------
    # 2. Restaurant Availability
    # -------------------------------------------------------------------------

    def test_05_toggle_restaurant_availability(self):
        """Authenticated restaurant can toggle availability OPEN -> CLOSED -> OPEN."""
        # Initially OPEN
        self.assertTrue(self.restaurant1.is_open)

        # Toggle to CLOSED
        res1 = self.client1.post('/api/restaurants/me/toggle-status/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertFalse(res1.data['is_open'])
        self.assertEqual(res1.data['status'], 'CLOSED')
        self.restaurant1.refresh_from_db()
        self.assertFalse(self.restaurant1.is_open)

        # Toggle back to OPEN
        res2 = self.client1.post('/api/restaurants/me/toggle-status/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data['is_open'])
        self.assertEqual(res2.data['status'], 'OPEN')
        self.restaurant1.refresh_from_db()
        self.assertTrue(self.restaurant1.is_open)

    def test_06_set_availability_explicit_status(self):
        """Explicit status string 'OPEN' or 'CLOSED' persists correctly in PostgreSQL."""
        res_close = self.client1.post(f'/api/restaurants/{self.restaurant1.id}/toggle-status/', {
            'status': 'CLOSED'
        }, format='json')
        self.assertEqual(res_close.status_code, status.HTTP_200_OK)
        self.assertFalse(res_close.data['is_open'])
        self.assertEqual(res_close.data['status'], 'CLOSED')

        res_open = self.client1.post(f'/api/restaurants/{self.restaurant1.id}/toggle-status/', {
            'status': 'OPEN'
        }, format='json')
        self.assertEqual(res_open.status_code, status.HTTP_200_OK)
        self.assertTrue(res_open.data['is_open'])
        self.assertEqual(res_open.data['status'], 'OPEN')

    def test_07_availability_ownership_enforced(self):
        """Owner 2 cannot toggle Owner 1's restaurant availability."""
        res = self.client2.post(f'/api/restaurants/{self.restaurant1.id}/toggle-status/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Customer cannot toggle availability
        res_cust = self.client_cust.post(f'/api/restaurants/{self.restaurant1.id}/toggle-status/')
        self.assertEqual(res_cust.status_code, status.HTTP_403_FORBIDDEN)

    def test_08_customer_browsing_displays_availability(self):
        """Customer restaurant browsing accurately displays OPEN or CLOSED status."""
        self.restaurant1.is_open = True
        self.restaurant1.save()
        self.restaurant2.is_open = False
        self.restaurant2.save()

        res = self.client_anon.get('/api/restaurants/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        
        mario = next(r for r in results if r['id'] == self.restaurant1.id)
        luigi = next(r for r in results if r['id'] == self.restaurant2.id)

        self.assertTrue(mario['is_open'])
        self.assertEqual(mario['status'], 'OPEN')
        self.assertFalse(luigi['is_open'])
        self.assertEqual(luigi['status'], 'CLOSED')

    # -------------------------------------------------------------------------
    # 3. Menu Categories
    # -------------------------------------------------------------------------

    def test_09_create_and_list_menu_categories(self):
        """Restaurant can create categories and list only its own categories."""
        # Create categories for Restaurant 1
        res_cat1 = self.client1.post('/api/menu/categories/', {
            'name': 'Starters',
            'description': 'Crispy appetizers & bites',
            'display_order': 1
        }, format='json')
        self.assertEqual(res_cat1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_cat1.data['name'], 'Starters')
        self.assertEqual(res_cat1.data['restaurant'], self.restaurant1.id)

        res_cat2 = self.client1.post('/api/menu/categories/', {
            'name': 'Main Course',
            'description': 'Fresh artisan pizzas & pastas',
            'display_order': 2
        }, format='json')
        self.assertEqual(res_cat2.status_code, status.HTTP_201_CREATED)

        # Restaurant 2 creates category
        self.client2.post('/api/menu/categories/', {
            'name': 'Breads',
            'display_order': 1
        }, format='json')

        # Owner 1 lists categories: must see only its own 2 categories
        res_list = self.client1.get('/api/menu/categories/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        cats = res_list.data.get('results', res_list.data)
        self.assertEqual(len(cats), 2)
        cat_names = [c['name'] for c in cats]
        self.assertIn('Starters', cat_names)
        self.assertIn('Main Course', cat_names)
        self.assertNotIn('Breads', cat_names)

    def test_10_edit_and_toggle_category(self):
        """Restaurant can edit category details and toggle active status."""
        cat = MenuCategory.objects.create(
            restaurant=self.restaurant1,
            name='Desserts',
            display_order=5,
            is_active=True
        )

        # Edit name and display order
        res_edit = self.client1.patch(f'/api/menu/categories/{cat.id}/', {
            'name': 'Artisan Desserts',
            'display_order': 3
        }, format='json')
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)
        cat.refresh_from_db()
        self.assertEqual(cat.name, 'Artisan Desserts')
        self.assertEqual(cat.display_order, 3)

        # Toggle active status
        res_toggle = self.client1.post(f'/api/menu/categories/{cat.id}/toggle/')
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)
        cat.refresh_from_db()
        self.assertFalse(cat.is_active)

    def test_11_category_deletion_protection_with_dependent_foods(self):
        """Prevent accidental deletion where food items still depend on the category."""
        cat = MenuCategory.objects.create(
            restaurant=self.restaurant1,
            name='Biryani',
            display_order=1
        )
        # Create food item belonging to this category
        FoodItem.objects.create(
            restaurant=self.restaurant1,
            menu_category=cat,
            name='Smoked Veg Dum Biryani',
            price=280.00
        )

        # Deletion attempt must fail with 400
        res_del = self.client1.delete(f'/api/menu/categories/{cat.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(MenuCategory.objects.filter(id=cat.id).exists())

        # Now delete the food item, category deletion must succeed
        FoodItem.objects.filter(menu_category=cat).delete()
        res_del_ok = self.client1.delete(f'/api/menu/categories/{cat.id}/')
        self.assertEqual(res_del_ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MenuCategory.objects.filter(id=cat.id).exists())

    def test_12_category_ownership_isolation(self):
        """Restaurant A cannot edit or delete Restaurant B's category."""
        cat_luigi = MenuCategory.objects.create(
            restaurant=self.restaurant2,
            name='Luigi Sourdough',
            display_order=1
        )
        res = self.client1.patch(f'/api/menu/categories/{cat_luigi.id}/', {
            'name': 'Hacked Sourdough'
        }, format='json')
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        cat_luigi.refresh_from_db()
        self.assertEqual(cat_luigi.name, 'Luigi Sourdough')

    # -------------------------------------------------------------------------
    # 4. Food Management
    # -------------------------------------------------------------------------

    def test_13_create_food_item_complete(self):
        """Create food item with name, description, price, category, dietary_type, and display_order."""
        cat = MenuCategory.objects.create(restaurant=self.restaurant1, name='Pizzas')
        food_img = generate_test_image('pizza.png', color='red')

        res = self.client1.post('/api/menu/items/', {
            'name': 'Truffle Margherita Pizza',
            'description': 'San Marzano tomatoes, fior di latte, black truffle shavings',
            'price': '420.00',
            'category': cat.id,
            'dietary_type': 'VEG',
            'display_order': 1,
            'is_available': True,
            'food_image': food_img
        }, format='multipart')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], 'Truffle Margherita Pizza')
        self.assertEqual(float(res.data['price']), 420.00)
        self.assertEqual(res.data['category'], cat.id)
        self.assertEqual(res.data['category_name'], 'Pizzas')
        self.assertEqual(res.data['dietary_type'], 'VEG')
        self.assertTrue(res.data['is_veg'])
        self.assertTrue(res.data['is_available'])
        self.assertTrue(bool(res.data['image']))

    def test_14_food_validations(self):
        """Validates empty name, zero or negative price, and cross-restaurant category."""
        cat_mario = MenuCategory.objects.create(restaurant=self.restaurant1, name='Starters')
        cat_luigi = MenuCategory.objects.create(restaurant=self.restaurant2, name='Bakery')

        # Empty name
        res1 = self.client1.post('/api/menu/items/', {
            'name': '   ',
            'price': 100,
            'category': cat_mario.id
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # Zero or negative price
        res2 = self.client1.post('/api/menu/items/', {
            'name': 'Invalid Price Dish',
            'price': 0,
            'category': cat_mario.id
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        res3 = self.client1.post('/api/menu/items/', {
            'name': 'Negative Price Dish',
            'price': -50,
            'category': cat_mario.id
        }, format='json')
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

        # Category belonging to another restaurant
        res4 = self.client1.post('/api/menu/items/', {
            'name': 'Cross Category Dish',
            'price': 250,
            'category': cat_luigi.id
        }, format='json')
        self.assertEqual(res4.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category', res4.data)

    def test_15_food_edit_and_stock_toggle(self):
        """Restaurant can edit food item and toggle its stock/availability."""
        cat = MenuCategory.objects.create(restaurant=self.restaurant1, name='Pasta')
        food = FoodItem.objects.create(
            restaurant=self.restaurant1,
            menu_category=cat,
            name='Cacio e Pepe',
            price=320.00,
            is_available=True
        )

        # Edit price & description
        res_edit = self.client1.patch(f'/api/menu/items/{food.id}/', {
            'price': '350.00',
            'description': 'Pecorino Romano & crushed black pepper'
        }, format='json')
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)
        food.refresh_from_db()
        self.assertEqual(float(food.price), 350.00)
        self.assertEqual(food.full_description, 'Pecorino Romano & crushed black pepper')

        # Toggle stock
        res_toggle = self.client1.post(f'/api/menu/items/{food.id}/toggle-stock/')
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)
        food.refresh_from_db()
        self.assertFalse(food.is_available)

    def test_16_food_deletion_and_isolation(self):
        """Restaurant can delete its own food item, but cannot modify another restaurant's food item."""
        cat_mario = MenuCategory.objects.create(restaurant=self.restaurant1, name='Sides')
        food_mario = FoodItem.objects.create(restaurant=self.restaurant1, menu_category=cat_mario, name='Garlic Bread', price=120)

        # Owner 2 cannot delete Owner 1's food
        res_hack = self.client2.delete(f'/api/menu/items/{food_mario.id}/')
        self.assertIn(res_hack.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        self.assertTrue(FoodItem.objects.filter(id=food_mario.id).exists())

        # Owner 1 can delete its own food
        res_del = self.client1.delete(f'/api/menu/items/{food_mario.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FoodItem.objects.filter(id=food_mario.id).exists())
