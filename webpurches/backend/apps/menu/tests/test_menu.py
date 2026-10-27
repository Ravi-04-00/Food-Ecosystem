"""Menu category scoping + food creation contract tests (restaurant app flow)."""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
)


class MenuCategoryFlowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = create_test_user(role='SHOP', username='menu_owner_1', email='menu_owner_1@testfd.io')
        self.owner2 = create_test_user(role='SHOP', username='menu_owner_2', email='menu_owner_2@testfd.io')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Menu Flow Kitchen')
        self.client.force_authenticate(user=self.owner)

    def test_empty_list_then_create_then_listed(self):
        res = self.client.get('/api/menu/categories/')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(items), 0)

        res = self.client.post('/api/menu/categories/', {'name': 'Biryani'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        cat_id = res.data['id']

        res = self.client.get('/api/menu/categories/')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['name'], 'Biryani')

        # Duplicate name for same restaurant rejected (no silent duplicates)
        res = self.client.post('/api/menu/categories/', {'name': 'biryani'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        return cat_id

    def test_categories_scoped_per_restaurant(self):
        self.client.post('/api/menu/categories/', {'name': 'Mine'}, format='json')
        self.client.force_authenticate(user=self.owner2)
        res = self.client.get('/api/menu/categories/')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertEqual(len(items), 0)

    def test_unauthenticated_list_allowed_but_create_blocked(self):
        anon = APIClient()
        res = anon.get('/api/menu/categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = anon.post('/api/menu/categories/', {'name': 'X'}, format='json')
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_food_create_with_category_persists_and_lists(self):
        cat_id = self.client.post(
            '/api/menu/categories/', {'name': 'Starters'}, format='json').data['id']
        res = self.client.post('/api/menu/items/', {
            'name': 'Paneer Tikka', 'price': '249.00',
            'category': cat_id, 'description': 'Smoky starter',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        food_id = res.data['id']

        res = self.client.get('/api/menu/items/')
        items = res.data['results'] if isinstance(res.data, dict) else res.data
        self.assertTrue(any(i['id'] == food_id for i in items))
        mine = [i for i in items if i['id'] == food_id][0]
        self.assertEqual(mine.get('category_id'), cat_id)

        # Invalid price rejected
        res = self.client.post('/api/menu/items/', {
            'name': 'Bad Price', 'price': '-5', 'category': cat_id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Invalid category rejected
        res = self.client.post('/api/menu/items/', {
            'name': 'Bad Cat', 'price': '100', 'category': 999999}, format='json')
        self.assertIn(res.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND))

    def test_food_create_missing_category_rejected(self):
        """Omitting category returns 400 'Menu category is required.' (not 500)."""
        res = self.client.post('/api/menu/items/', {
            'name': 'No Category Dish', 'price': '150'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Menu category is required.', str(res.data.get('category', [])))

    def test_admin_can_create_dish_for_any_restaurant(self):
        from apps.core_tests.factories import create_test_user
        admin = create_test_user(role='ADMIN', username='menu_admin_1', email='menuadmin1@testfd.io')
        cat_id = self.client.post(
            '/api/menu/categories/', {'name': 'Admin Cat'}, format='json').data['id']
        self.client.force_authenticate(user=admin)
        res = self.client.post('/api/menu/items/', {
            'name': 'Admin Special', 'price': '299.00', 'category': cat_id,
            'restaurant_id': self.restaurant.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # Missing restaurant_id and no owned restaurant -> 403, not 500
        res = self.client.post('/api/menu/items/', {
            'name': 'No Target', 'price': '99.00', 'category': cat_id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        # Invalid restaurant id -> 400
        res = self.client.post('/api/menu/items/', {
            'name': 'Bad Target', 'price': '99.00', 'category': cat_id,
            'restaurant_id': 999999}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_cannot_create_for_other_restaurant(self):
        other_owner = create_test_user(
            role='SHOP', username='menu_owner_x', email='menuownerx@testfd.io')
        from apps.core_tests.factories import create_test_restaurant
        other_rest = create_test_restaurant(owner=other_owner, name='Other Kitchen')
        cat_id = self.client.post(
            '/api/menu/categories/', {'name': 'Mine'}, format='json').data['id']
        res = self.client.post('/api/menu/items/', {
            'name': 'Sneaky Dish', 'price': '199.00', 'category': cat_id,
            'restaurant_id': other_rest.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
