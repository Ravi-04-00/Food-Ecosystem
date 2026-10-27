"""Wishlist API tests: add/list/remove, duplicates, ownership."""
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


class WishlistTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='wish_cust_1', email='wish1@testfd.io')
        self.other = create_test_user(
            role='CUSTOMER', username='wish_cust_2', email='wish2@testfd.io')
        owner = create_test_user(role='SHOP', username='wish_owner_1', email='wowner1@testfd.io')
        restaurant = create_test_restaurant(owner=owner, name='Wish Kitchen')
        category = create_test_category(name='Wish Cat')
        self.food = create_test_food(
            restaurant=restaurant, category=category, name='Wish Biryani',
            price=Decimal('250.00'))
        self.client.force_authenticate(user=self.customer)

    def test_add_list_remove(self):
        res = self.client.post('/api/wishlist/', {'product_id': self.food.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        res = self.client.get('/api/wishlist/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(len(items), 1)
        # Duplicate add rejected (no silent duplicate)
        res = self.client.post('/api/wishlist/', {'product_id': self.food.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Remove and confirm persistence
        wish_id = items[0]['id']
        res = self.client.delete(f'/api/wishlist/{wish_id}/')
        self.assertIn(res.status_code, (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT))
        res = self.client.get('/api/wishlist/')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(len(items), 0)

    def test_ownership_and_auth(self):
        wish_id = self.client.post(
            '/api/wishlist/', {'product_id': self.food.id}, format='json').data['id']
        self.client.force_authenticate(user=self.other)
        res = self.client.get('/api/wishlist/')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(len(items), 0)
        res = self.client.delete(f'/api/wishlist/{wish_id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        anon = APIClient()
        res = anon.get('/api/wishlist/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        res = anon.post('/api/wishlist/', {'product_id': self.food.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
