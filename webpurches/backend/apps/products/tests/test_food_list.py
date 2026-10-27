"""Food list: sort whitelist, search, pagination contract."""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_category,
    create_test_food,
)


class FoodListTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        owner = create_test_user(role='SHOP', username='foodlist_owner_1', email='foodlistowner1@testfd.io')
        restaurant = create_test_restaurant(owner=owner, name='FoodList Kitchen')
        category = create_test_category(name='FoodList Cat')
        create_test_food(restaurant=restaurant, category=category,
                         name='AAA Dish', price=Decimal('100.00'))
        create_test_food(restaurant=restaurant, category=category,
                         name='ZZZ Dish', price=Decimal('300.00'))

    def test_sort_whitelist_and_injection_safe(self):
        for sort in ('price_low', 'price_high', 'rating', 'popular', 'name__password', '-created_at', 'id;DROP'):
            res = self.client.get(f'/api/foods/?sort={sort}')
            self.assertEqual(res.status_code, status.HTTP_200_OK, sort)

    def test_search_and_pagination_shape(self):
        res = self.client.get('/api/foods/?search=AAA')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('results', res.data)
