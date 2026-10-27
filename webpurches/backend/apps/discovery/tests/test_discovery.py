from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem
from apps.categories.models import Category
from apps.orders.models import Order, OrderItem
from apps.wishlist.models import Wishlist
from apps.discovery.models import UserSearchHistory
from apps.discovery.services import (
    search_catalog,
    get_search_suggestions,
    get_discovery_sections,
    get_personalized_recommendations,
    expand_search_terms
)


class Phase20SmartSearchDiscoveryTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.owner = User.objects.create_user(
            username='chef_owner', email='chef@test.com', password='password123', role='RESTAURANT'
        )
        self.customer1 = User.objects.create_user(
            username='ravi_kumar', email='ravi@test.com', password='password123', role='CUSTOMER'
        )
        self.customer2 = User.objects.create_user(
            username='priya_sharma', email='priya@test.com', password='password123', role='CUSTOMER'
        )

        # Category
        self.cat_biryani = Category.objects.create(name='Biryani & Rice', slug='biryani-rice')
        self.cat_burgers = Category.objects.create(name='Burgers & Sandwiches', slug='burgers-sandwiches')
        self.cat_south = Category.objects.create(name='South Indian Tiffin', slug='south-indian-tiffin')

        # Restaurants
        self.rest_madras = Restaurant.objects.create(
            owner=self.owner,
            name='Madras Dum Biryani House',
            cuisines=['Biryani', 'South Indian', 'Chettinad'],
            rating=Decimal('4.9'),
            review_count=120,
            is_open=True,
            verification_status='APPROVED'
        )
        self.rest_burger = Restaurant.objects.create(
            owner=self.owner,
            name='Cyber Burger Joint',
            cuisines=['American', 'Fast Food'],
            rating=Decimal('4.5'),
            review_count=85,
            is_open=True,
            verification_status='APPROVED'
        )
        self.rest_closed = Restaurant.objects.create(
            owner=self.owner,
            name='Midnight Dosa Shack',
            cuisines=['South Indian'],
            rating=Decimal('4.7'),
            review_count=40,
            is_open=False,
            verification_status='APPROVED'
        )

        # Food Items
        self.food_chicken_biryani = FoodItem.objects.create(
            restaurant=self.rest_madras,
            category=self.cat_biryani,
            name='Royal Mutton Seeraga Samba Biryani',
            short_description='Fragrant traditional mutton biryani cooked on slow woodfire',
            price=Decimal('340.00'),
            is_veg=False,
            rating=Decimal('4.9'),
            review_count=95,
            is_available=True
        )
        self.food_chicken_65 = FoodItem.objects.create(
            restaurant=self.rest_madras,
            category=self.cat_biryani,
            name='Crispy Chicken 65 Boneless',
            short_description='Spicy south indian chicken starter',
            price=Decimal('220.00'),
            is_veg=False,
            rating=Decimal('4.8'),
            review_count=70,
            is_available=True
        )
        self.food_paneer_biryani = FoodItem.objects.create(
            restaurant=self.rest_madras,
            category=self.cat_biryani,
            name='Charcoal Paneer Tikka Biryani',
            short_description='Aromatic basmati rice layered with charcoal smoked paneer',
            price=Decimal('260.00'),
            is_veg=True,
            rating=Decimal('4.7'),
            review_count=45,
            is_available=True
        )
        self.food_smash_burger = FoodItem.objects.create(
            restaurant=self.rest_burger,
            category=self.cat_burgers,
            name='Double Truffle Beef Burger',
            short_description='Gourmet smashed beef patty with truffle aioli',
            price=Decimal('310.00'),
            is_veg=False,
            rating=Decimal('4.6'),
            review_count=50,
            is_available=True
        )
        self.food_veg_burger = FoodItem.objects.create(
            restaurant=self.rest_burger,
            category=self.cat_burgers,
            name='Crispy Aloo Herb Burger',
            short_description='Golden potato patty seasoned with herbs',
            price=Decimal('150.00'),
            is_veg=True,
            rating=Decimal('4.4'),
            review_count=30,
            is_available=True
        )
        self.food_dosa_unavailable = FoodItem.objects.create(
            restaurant=self.rest_closed,
            category=self.cat_south,
            name='Ghee Podi Roast Dosa',
            short_description='Crispy golden roast with special gunpowder',
            price=Decimal('120.00'),
            is_veg=True,
            rating=Decimal('4.8'),
            review_count=80,
            is_available=False
        )

    def test_bilingual_tamil_search_expansion(self):
        """Tamil terms map to English counterparts for cross-lingual discovery."""
        terms = expand_search_terms('பிரியாணி')
        self.assertIn('biryani', terms)

        terms_chicken = expand_search_terms('சிக்கன்')
        self.assertIn('chicken', terms_chicken)

        # Test search endpoint with Tamil query
        from urllib.parse import quote
        res = self.client.get(f'/api/discovery/search/?q={quote("பிரியாணி")}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        food_names = [f['name'] for f in res.data['foods']]
        self.assertTrue(any('Biryani' in name for name in food_names))
        self.assertIn('Madras Dum Biryani House', [r['name'] for r in res.data['restaurants']])

    def test_case_insensitive_partial_search(self):
        """Supports partial queries and case-insensitivity."""
        res = self.client.get('/api/discovery/search/', {'q': 'burG'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        food_names = [f['name'] for f in res.data['foods']]
        self.assertTrue(any('Burger' in name for name in food_names))

    def test_search_filters_dietary_price_rating_open(self):
        """Advanced server-side filtering by dietary type, price range, rating and operational status."""
        # 1. Vegetarian Only
        res_veg = self.client.get('/api/discovery/search/', {'is_veg': 'true'})
        self.assertEqual(res_veg.status_code, status.HTTP_200_OK)
        for f in res_veg.data['foods']:
            self.assertTrue(f['is_veg'])

        # 2. Price Range (min 200, max 300)
        res_price = self.client.get('/api/discovery/search/', {'min_price': '200', 'max_price': '300'})
        self.assertEqual(res_price.status_code, status.HTTP_200_OK)
        for f in res_price.data['foods']:
            self.assertTrue(200 <= float(f['price']) <= 300)

        # 3. Minimum Rating (>= 4.8)
        res_rating = self.client.get('/api/discovery/search/', {'min_rating': '4.8'})
        self.assertEqual(res_rating.status_code, status.HTTP_200_OK)
        for f in res_rating.data['foods']:
            self.assertGreaterEqual(float(f['rating']), 4.8)

        # 4. Open status
        res_open = self.client.get('/api/discovery/search/', {'is_open': 'true'})
        self.assertEqual(res_open.status_code, status.HTTP_200_OK)
        restaurant_ids = [r['id'] for r in res_open.data['restaurants']]
        self.assertNotIn(self.rest_closed.id, restaurant_ids)

    def test_unavailable_food_labeling_in_search(self):
        """Unavailable items are preserved and accurately labeled so clients can disable ordering."""
        res = self.client.get('/api/discovery/search/', {'q': 'Dosa'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(f['name'] == 'Ghee Podi Roast Dosa' and not f['is_available'] for f in res.data['foods']))

    def test_search_sorting(self):
        """Supports price, rating, popularity and newest sorting."""
        # Price Ascending
        res_price_asc = self.client.get('/api/discovery/search/', {'sort': 'price_asc'})
        prices = [float(f['price']) for f in res_price_asc.data['foods']]
        self.assertEqual(prices, sorted(prices))

        # Rating Descending
        res_rating_desc = self.client.get('/api/discovery/search/', {'sort': 'rating'})
        ratings = [float(f['rating']) for f in res_rating_desc.data['foods']]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_search_pagination_no_duplicates(self):
        """Pagination does not return duplicate items across pages."""
        res_page1 = self.client.get('/api/discovery/search/', {'page': 1, 'page_size': 2})
        res_page2 = self.client.get('/api/discovery/search/', {'page': 2, 'page_size': 2})

        page1_ids = {f['id'] for f in res_page1.data['foods']}
        page2_ids = {f['id'] for f in res_page2.data['foods']}
        self.assertEqual(len(page1_ids.intersection(page2_ids)), 0)

    def test_search_suggestions_endpoint(self):
        """Typeahead suggestions return quick categorized recommendations."""
        res = self.client.get('/api/discovery/suggestions/', {'q': 'biri'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('foods', res.data)
        self.assertIn('restaurants', res.data)
        self.assertIn('cuisines', res.data)

    def test_discovery_sections_based_on_orders(self):
        """Discovery endpoint returns popular foods based on verified order data."""
        # Create completed order with items
        order = Order.objects.create(
            order_number='WS-TEST-POP-1',
            customer=self.customer1,
            restaurant=self.rest_madras,
            status='DELIVERED',
            subtotal=Decimal('680.00'),
            grand_total=Decimal('725.00')
        )
        OrderItem.objects.create(
            order=order,
            food_item=self.food_chicken_biryani,
            quantity=3,
            price=Decimal('340.00'),
            item_total=Decimal('1020.00')
        )

        res = self.client.get('/api/discovery/sections/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('popular_foods', res.data)
        self.assertIn('trending_restaurants', res.data)
        self.assertIn('cuisines', res.data)
        popular_ids = [f['id'] for f in res.data['popular_foods']]
        self.assertIn(self.food_chicken_biryani.id, popular_ids)

    def test_personalized_recommendations_with_history(self):
        """Personalized recommendation prioritizes user past orders, preferred cuisines and saved items."""
        # 1. Customer1 completed an order for Biryani
        order = Order.objects.create(
            order_number='WS-TEST-REC-1',
            customer=self.customer1,
            restaurant=self.rest_madras,
            status='DELIVERED',
            subtotal=Decimal('340.00'),
            grand_total=Decimal('385.00')
        )
        OrderItem.objects.create(
            order=order,
            food_item=self.food_chicken_biryani,
            quantity=1,
            price=Decimal('340.00'),
            item_total=Decimal('340.00')
        )

        # 2. Customer1 saved Paneer Biryani in wishlist
        Wishlist.objects.create(user=self.customer1, product=self.food_paneer_biryani)

        # Authenticate as customer1
        self.client.force_authenticate(user=self.customer1)
        res = self.client.get('/api/discovery/recommendations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['strategy'], 'AFFINITY_AND_HISTORY')
        
        # Verify recommended items are orderable
        for entry in res.data['items']:
            self.assertTrue(entry['food']['is_available'])
            self.assertIn('reason', entry)

        # Saved item or preferred cuisine dishes should be prioritized
        rec_ids = [entry['food']['id'] for entry in res.data['items']]
        self.assertIn(self.food_paneer_biryani.id, rec_ids)

    def test_personalized_recommendations_guest_fallback(self):
        """Unauthenticated guests receive sensible top-rated fallback recommendations."""
        res = self.client.get('/api/discovery/recommendations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['strategy'], 'POPULAR_FALLBACK')
        self.assertTrue(len(res.data['items']) > 0)

    def test_user_search_history_isolation_and_clear(self):
        """Recent searches are private per user and can be cleared."""
        self.client.force_authenticate(user=self.customer1)
        
        # Record search
        post_res = self.client.post('/api/discovery/history/', {'query': 'Chettinad Pepper Mutton', 'results_count': 4})
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)

        # Fetch history
        get_res = self.client.get('/api/discovery/history/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data['history']), 1)
        self.assertEqual(get_res.data['history'][0]['query'], 'Chettinad Pepper Mutton')

        # Customer2 cannot see Customer1's search history
        self.client.force_authenticate(user=self.customer2)
        get_res2 = self.client.get('/api/discovery/history/')
        self.assertEqual(len(get_res2.data['history']), 0)

        # Customer1 clears history
        self.client.force_authenticate(user=self.customer1)
        del_res = self.client.delete('/api/discovery/history/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self.client.get('/api/discovery/history/').data['history']), 0)

    def test_search_query_validation(self):
        """Query validation rejects nonsensical inputs like min_price > max_price."""
        res = self.client.get('/api/discovery/search/', {'min_price': '500', 'max_price': '100'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('max_price', res.data)
