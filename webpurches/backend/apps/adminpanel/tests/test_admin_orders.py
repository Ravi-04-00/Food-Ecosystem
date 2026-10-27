"""Admin order control: detail serializer, delay ETA, reassignment safety."""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.delivery.models import DeliveryAssignment, DeliveryPartner
from apps.orders.models import OrderDelayRecord
from apps.core_tests.factories import (
    create_test_user,
    create_test_restaurant,
    create_test_order,
    create_test_rider,
)


class AdminOrderControlTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = create_test_user(
            role='CUSTOMER', username='ordctl_cust_1', email='ordctl1@testfd.io')
        self.owner = create_test_user(
            role='SHOP', username='ordctl_owner_1', email='ordctlowner1@testfd.io')
        self.restaurant = create_test_restaurant(owner=self.owner, name='Control Kitchen')
        self.partner = create_test_rider()
        self.rider2 = create_test_user(
            role='DELIVERY_PARTNER', username='ordctl_rider_2', email='ordctlrider2@testfd.io')
        create_test_rider(user=self.rider2)
        self.admin = create_test_user(
            role='ADMIN', username='ordctl_admin_1', email='ordctladmin1@testfd.io')
        self.order = create_test_order(
            customer=self.customer, restaurant=self.restaurant,
            rider=self.partner.user, status='PREPARING')
        self.assignment = DeliveryAssignment.objects.create(
            order=self.order, delivery_partner=self.partner.user, status='ACCEPTED')
        self.client.force_authenticate(user=self.admin)

    def test_detail_ok_with_customized_items(self):
        from apps.products.models import FoodItem
        food = FoodItem.objects.create(
            restaurant=self.restaurant, name='Custom Bowl', price=100)
        self.order.items.create(
            food_item=food, food_name_snapshot='Custom Bowl',
            unit_price_snapshot=100, quantity=1,
            customization_snapshot={'variant': {'name': 'Large'}, 'addons': [{'name': 'Cheese'}]},
            selected_addons=[{'name': 'Cheese'}])
        res = self.client.get(f'/api/adminpanel/orders/{self.order.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any('customization_summary' in i for i in res.data['items']))
        self.assertIn('delay_history', res.data)
        self.assertIn('assignment', res.data)
        self.assertEqual(res.data['assignment']['status'], 'ACCEPTED')

    def test_delay_updates_eta_and_history(self):
        res = self.client.post(f'/api/adminpanel/orders/{self.order.id}/delay/', {
            'delay_type': 'KITCHEN', 'reason': 'RESTAURANT_PREP',
            'notes': 'Burner issue', 'new_eta_minutes': 45}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['previous_eta'], self.order.eta_minutes)
        self.assertEqual(res.data['new_eta'], 45)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'PREPARING')
        self.assertEqual(OrderDelayRecord.objects.filter(order=self.order).count(), 1)
        res = self.client.get(f'/api/adminpanel/orders/{self.order.id}/')
        self.assertEqual(len(res.data['delay_history']), 1)

    def test_delay_validation_and_perms(self):
        res = self.client.post(f'/api/adminpanel/orders/{self.order.id}/delay/', {
            'delay_type': 'KITCHEN', 'new_eta_minutes': 30}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/adminpanel/orders/{self.order.id}/delay/', {
            'delay_type': 'KITCHEN', 'reason': 'TRAFFIC', 'new_eta_minutes': 30},
            format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_reassign_happy_path_and_history(self):
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': self.rider2.id, 'reason': 'First rider stuck in traffic'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.delivery_partner, self.rider2)
        self.assertEqual(self.assignment.history.count(), 1)
        self.order.refresh_from_db()
        self.assertEqual(self.order.rider, self.rider2)
        self.assertEqual(self.order.status, 'PREPARING')
        # History preserved (notifications use on_commit: verified live instead)
        self.assertEqual(self.assignment.history.count(), 1)
        self.assertTrue(self.order.status_history.filter(actor_role='ADMIN').exists())

    def test_reassign_rejections(self):
        # Missing reason
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': self.rider2.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Unapproved partner
        bad = create_test_user(role='DELIVERY', username='ordctl_bad', email='ordctlbad@testfd.io')
        DeliveryPartner.objects.create(user=bad, vehicle_number='KA-01-XX-0001',
                                       verification_status='PENDING', is_verified=False)
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': bad.id, 'reason': 'x'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Terminal order
        self.order.status = 'DELIVERED'
        self.order.save()
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': self.rider2.id, 'reason': 'late'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Non-admin
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': self.rider2.id, 'reason': 'late'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_reassign_handover_gate(self):
        self.assignment.status = 'PICKED_UP'
        self.assignment.save()
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': self.rider2.id, 'reason': 'Bike broke down'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(
            f'/api/delivery/admin/dispatch/{self.assignment.id}/reassign/',
            {'partner_id': self.rider2.id, 'reason': 'Bike broke down',
             'handover_confirmed': True})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
