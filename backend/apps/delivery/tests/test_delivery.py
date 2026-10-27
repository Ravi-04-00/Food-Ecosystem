from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, Address
from apps.products.models import Restaurant, FoodItem
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.delivery.models import DeliveryPartner, DeliveryAssignment, DeliveryAssignmentHistory
from apps.shifts.models import Shift, ShiftSlot, ShiftBooking, CheckIn, BreakLog


class Phase12DeliveryWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Restaurant Owner & Restaurant
        self.restaurant_owner = User.objects.create_user(
            username='chef_antonio',
            email='antonio@restaurant.io',
            password='Password123!',
            role='RESTAURANT',
            phone='+919876543201'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Antonio Bistro',
            address='12 Olive Street, Cyber City',
            is_open=True,
            verification_status='APPROVED'
        )
        self.food_item = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Gourmet Truffle Risotto',
            slug='gourmet-truffle-risotto',
            price=Decimal('340.00'),
            is_available=True
        )

        # 2. Customer & Address
        self.customer = User.objects.create_user(
            username='customer_priya',
            email='priya@customer.io',
            password='Password123!',
            role='CUSTOMER',
            phone='+919876543203'
        )
        self.address = Address.objects.create(
            user=self.customer,
            label='Home',
            full_name='Priya Sharma',
            phone='+919876543203',
            street='Flat 402, Highrise Heights, Indiranagar 100ft Rd',
            city='Bengaluru',
            state='Karnataka',
            pincode='560038'
        )

        # 3. Delivery Partner 1 (Approved, Online)
        self.rider_user_1 = User.objects.create_user(
            username='rider_vikram',
            email='vikram@rider.io',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543204'
        )
        self.partner_1 = DeliveryPartner.objects.create(
            user=self.rider_user_1,
            vehicle_type='Bike',
            vehicle_number='KA-03-VK-1001',
            is_verified=True,
            verification_status='APPROVED',
            is_online=True
        )

        # 4. Delivery Partner 2 (Approved, Online - Competitor)
        self.rider_user_2 = User.objects.create_user(
            username='rider_anita',
            email='anita@rider.io',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543205'
        )
        self.partner_2 = DeliveryPartner.objects.create(
            user=self.rider_user_2,
            vehicle_type='Scooter',
            vehicle_number='KA-03-AN-2002',
            is_verified=True,
            verification_status='APPROVED',
            is_online=True
        )

        # 5. Delivery Partner 3 (Unapproved)
        self.rider_user_unapproved = User.objects.create_user(
            username='rider_unapproved',
            email='unapproved@rider.io',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543206'
        )
        self.partner_unapproved = DeliveryPartner.objects.create(
            user=self.rider_user_unapproved,
            vehicle_type='Bike',
            vehicle_number='KA-03-UN-3003',
            is_verified=False,
            verification_status='PENDING',
            is_online=True
        )

        # 6. Delivery Partner 4 (Offline)
        self.rider_user_offline = User.objects.create_user(
            username='rider_offline',
            email='offline@rider.io',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543207'
        )
        self.partner_offline = DeliveryPartner.objects.create(
            user=self.rider_user_offline,
            vehicle_type='Bike',
            vehicle_number='KA-03-OF-4004',
            is_verified=True,
            verification_status='APPROVED',
            is_online=False
        )

        # 7. Standard Test Order in READY_FOR_PICKUP
        self.order_ready = Order.objects.create(
            order_number='ORD-PH12-001',
            customer=self.customer,
            restaurant=self.restaurant,
            status='READY_FOR_PICKUP',
            subtotal=Decimal('340.00'),
            delivery_fee=Decimal('35.00'),
            packaging_fee=Decimal('15.00'),
            total=Decimal('390.00'),
            cooking_instructions='Leave with security at main gate',
            delivery_address_text='Indiranagar, Bengaluru',
            delivery_address_snapshot={
                'full_name': 'Priya Sharma',
                'phone': '+919876543203',
                'address_line_1': 'Flat 402, Highrise Heights',
                'area_sector_locality': 'Indiranagar 100ft Rd',
                'city': 'Bengaluru',
                'formatted_address': 'Flat 402, Highrise Heights, Indiranagar 100ft Rd, Bengaluru - 560038'
            }
        )
        self.order_item = OrderItem.objects.create(
            order=self.order_ready,
            food_item=self.food_item,
            food_name_snapshot='Gourmet Truffle Risotto',
            quantity=1,
            unit_price_snapshot=Decimal('340.00'),
            price=Decimal('340.00'),
            item_total=Decimal('340.00')
        )

    # 1. Approved partner can view eligible jobs
    def test_01_approved_partner_can_view_eligible_jobs(self):
        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.get('/api/delivery/jobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

        job = response.data[0]
        self.assertEqual(job['order_number'], 'ORD-PH12-001')
        self.assertEqual(job['restaurant_name'], 'Antonio Bistro')
        self.assertEqual(job['delivery_area'], 'Indiranagar 100ft Rd')
        self.assertEqual(job['items_count'], 1)
        self.assertEqual(float(job['delivery_fee']), 35.0)

        # Strict privacy check: Sensitive customer data MUST NOT be exposed before acceptance
        self.assertNotIn('customer_phone', job)
        self.assertNotIn('Flat 402', str(job))

    # 2. Unapproved partner cannot accept jobs
    def test_02_unapproved_partner_cannot_accept_jobs(self):
        self.client.force_authenticate(user=self.rider_user_unapproved)
        # Create available assignment
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        response = self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('pending approval', response.data['error'].lower())

    # 3. Offline partner cannot accept jobs
    def test_03_offline_partner_cannot_accept_jobs(self):
        self.client.force_authenticate(user=self.rider_user_offline)
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        response = self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('offline', response.data['error'].lower())

    # 4. Partner on break cannot accept jobs
    def test_04_partner_on_break_cannot_accept_jobs(self):
        # Create shift, slot, booking, and check-in on break for rider 1
        slot = ShiftSlot.objects.create(name='Lunch Rush', slot_type='LUNCH', start_time='11:00:00', end_time='15:00:00')
        shift = Shift.objects.create(slot=slot, date=timezone.localdate())
        booking = ShiftBooking.objects.create(shift=shift, rider=self.rider_user_1, date=timezone.localdate(), status='CHECKED_IN')
        check_in = CheckIn.objects.create(
            booking=booking,
            rider=self.rider_user_1,
            check_in_lat=Decimal('12.9716'),
            check_in_lng=Decimal('77.5946'),
            status='ON_BREAK'
        )

        self.client.force_authenticate(user=self.rider_user_1)
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        response = self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('break', response.data['error'].lower())

    # 5. Only READY_FOR_PICKUP orders are offered
    def test_05_only_ready_for_pickup_orders_are_offered(self):
        # Create order with PREPARING status
        order_preparing = Order.objects.create(
            order_number='ORD-PH12-PREP',
            customer=self.customer,
            restaurant=self.restaurant,
            status='PREPARING',
            total=Decimal('200.00')
        )
        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.get('/api/delivery/jobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order_numbers = [job['order_number'] for job in response.data]
        self.assertIn('ORD-PH12-001', order_numbers)
        self.assertNotIn('ORD-PH12-PREP', order_numbers)

        # Attempt to accept preparing order directly
        assignment_prep, _ = DeliveryAssignment.objects.get_or_create(order=order_preparing, defaults={'status': 'AVAILABLE'})
        accept_resp = self.client.post(f'/api/delivery/jobs/{assignment_prep.id}/accept/')
        self.assertEqual(accept_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not ready for pickup', accept_resp.data['error'].lower())

    # 6. Two partners cannot accept the same job (concurrency / race condition safe)
    def test_06_two_partners_cannot_accept_the_same_job(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})

        # Partner 1 accepts first
        self.client.force_authenticate(user=self.rider_user_1)
        resp1 = self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Partner 2 attempts to accept the exact same job
        self.client.force_authenticate(user=self.rider_user_2)
        resp2 = self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('already been accepted', resp2.data['error'].lower())

        # Verify only Partner 1 is assigned
        assignment.refresh_from_db()
        self.assertEqual(assignment.delivery_partner, self.rider_user_1)
        self.order_ready.refresh_from_db()
        self.assertEqual(self.order_ready.rider, self.rider_user_1)

    # 7. Partner cannot access another partner's active task
    def test_07_partner_cannot_access_another_partners_active_task(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')

        # Partner 2 attempts to access Partner 1's task
        self.client.force_authenticate(user=self.rider_user_2)
        response = self.client.get(f'/api/delivery/tasks/{assignment.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('not authorized', response.data['error'].lower())

    # 8. Assigned partner can view required delivery details
    def test_08_assigned_partner_can_view_required_delivery_details(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')

        response = self.client.get(f'/api/delivery/tasks/{assignment.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['restaurant_name'], 'Antonio Bistro')
        self.assertEqual(data['restaurant_address'], '12 Olive Street, Cyber City')
        self.assertEqual(data['restaurant_phone'], '+919876543201')
        self.assertEqual(data['customer_name'], 'Priya Sharma')
        self.assertEqual(data['customer_phone'], '+919876543203')
        self.assertIn('Flat 402, Highrise Heights', data['customer_address'])
        self.assertEqual(data['cooking_instructions'], 'Leave with security at main gate')
        self.assertEqual(data['items_count'], 1)
        self.assertEqual(float(data['subtotal']), 340.0)
        self.assertEqual(float(data['total']), 390.0)

    # 9. Partner can mark reached restaurant
    def test_09_partner_can_mark_reached_restaurant(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')

        response = self.client.post(f'/api/delivery/tasks/{assignment.id}/reached-restaurant/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        assignment.refresh_from_db()
        self.assertEqual(assignment.status, 'REACHED_RESTAURANT')
        self.assertIsNotNone(assignment.reached_restaurant_at)

    # 10. Partner can confirm valid pickup
    def test_10_partner_can_confirm_valid_pickup(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.client.post(f'/api/delivery/tasks/{assignment.id}/reached-restaurant/')

        response = self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        assignment.refresh_from_db()
        self.assertEqual(assignment.status, 'PICKED_UP')
        self.assertIsNotNone(assignment.picked_up_at)

    # 11. Pickup updates order and task consistently
    def test_11_pickup_updates_order_and_task_consistently(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')

        assignment.refresh_from_db()
        self.order_ready.refresh_from_db()
        self.assertEqual(assignment.status, 'PICKED_UP')
        self.assertEqual(self.order_ready.status, 'PICKED_UP')

    # 12. Duplicate pickup requests are handled safely
    def test_12_duplicate_pickup_requests_handled_safely(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        resp1 = self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Duplicate pickup call
        resp2 = self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertIn('already been confirmed', resp2.data['message'].lower())

    # 13. Invalid status transitions are rejected
    def test_13_invalid_status_transitions_are_rejected(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)

        # Attempt to confirm pickup before accepting job
        response = self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

    # 14. Delivery address snapshot remains unchanged
    def test_14_delivery_address_snapshot_remains_unchanged(self):
        original_snapshot = dict(self.order_ready.delivery_address_snapshot)
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')

        self.order_ready.refresh_from_db()
        self.assertEqual(self.order_ready.delivery_address_snapshot, original_snapshot)

    # 15. Customer order history shows the correct status
    def test_15_customer_order_history_shows_correct_status(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')
        self.client.post(f'/api/delivery/tasks/{assignment.id}/confirm-pickup/')

        histories = OrderStatusHistory.objects.filter(order=self.order_ready, to_status='PICKED_UP')
        self.assertTrue(histories.exists())
        hist = histories.first()
        self.assertEqual(hist.actor, self.rider_user_1)
        self.assertEqual(hist.actor_role, 'DELIVERY')
        self.assertIn('confirmed food pickup', hist.reason.lower())

    # 16. PostgreSQL data persists after server restart (persistence check)
    def test_16_postgresql_data_persistence_and_issue_reporting(self):
        assignment, _ = DeliveryAssignment.objects.get_or_create(order=self.order_ready, defaults={'status': 'AVAILABLE'})
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/jobs/{assignment.id}/accept/')

        # Partner reports an issue
        resp_issue = self.client.post(f'/api/delivery/tasks/{assignment.id}/report-issue/', {
            'reason': 'Vehicle puncture en route to kitchen',
            'notes': 'Flat rear tire, cannot proceed'
        })
        self.assertEqual(resp_issue.status_code, status.HTTP_200_OK)

        # Clear and query fresh from DB
        fresh_assignment = DeliveryAssignment.objects.get(id=assignment.id)
        fresh_order = Order.objects.get(id=self.order_ready.id)

        self.assertEqual(fresh_assignment.status, 'CANCELLED')
        self.assertEqual(fresh_assignment.cancellation_reason, 'Vehicle puncture en route to kitchen')
        # Crucial: Order itself is not cancelled; rider is unassigned to allow redispatch!
        self.assertIsNone(fresh_order.rider)
        self.assertEqual(fresh_order.status, 'READY_FOR_PICKUP')

        # Check task history records
        task_histories = fresh_assignment.history.all()
        self.assertTrue(task_histories.filter(to_status='CANCELLED').exists())


from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, Address
from apps.products.models import Restaurant, FoodItem
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.delivery.models import (
    DeliveryPartner, 
    DeliveryAssignment, 
    DeliveryAssignmentHistory,
    DeliveryOTP,
    DeliveryIssueReport
)
from apps.delivery.otp_service import generate_secure_delivery_otp


class Phase13CustomerDeliveryAndOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Restaurant Owner & Restaurant
        self.restaurant_owner = User.objects.create_user(
            username='chef_marco_p13',
            email='marco_p13@restaurant.io',
            password='Password123!',
            role='RESTAURANT',
            phone='+919876543301'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Marco Tuscan Grill P13',
            address='88 Cyber Parkway, Indiranagar',
            is_open=True,
            verification_status='APPROVED'
        )
        self.food_item = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Smoked Truffle Tagliatelle',
            slug='smoked-truffle-tagliatelle-p13',
            price=Decimal('420.00'),
            is_available=True
        )

        # 2. Customer & Address
        self.customer = User.objects.create_user(
            username='customer_alok_p13',
            email='alok_p13@customer.io',
            password='Password123!',
            role='CUSTOMER',
            phone='+919876543302'
        )
        self.address = Address.objects.create(
            user=self.customer,
            label='Home',
            full_name='Alok Verma',
            phone='+919876543302',
            street='Penthouse 802, Prestige Tower, Indiranagar',
            city='Bengaluru',
            state='Karnataka',
            pincode='560038'
        )

        # Customer 2 (Competitor customer)
        self.customer_other = User.objects.create_user(
            username='customer_other_p13',
            email='other_p13@customer.io',
            password='Password123!',
            role='CUSTOMER',
            phone='+919876543303'
        )

        # 3. Delivery Partner 1 (Assigned)
        self.rider_user_1 = User.objects.create_user(
            username='rider_rajesh_p13',
            email='rajesh_p13@rider.io',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543304'
        )
        self.partner_1 = DeliveryPartner.objects.create(
            user=self.rider_user_1,
            vehicle_type='Bike',
            vehicle_number='KA-03-P13-001',
            is_verified=True,
            verification_status='APPROVED',
            is_online=True
        )

        # 4. Delivery Partner 2 (Other Partner)
        self.rider_user_2 = User.objects.create_user(
            username='rider_suresh_p13',
            email='suresh_p13@rider.io',
            password='Password123!',
            role='DELIVERY',
            phone='+919876543305'
        )
        self.partner_2 = DeliveryPartner.objects.create(
            user=self.rider_user_2,
            vehicle_type='Bike',
            vehicle_number='KA-03-P13-002',
            is_verified=True,
            verification_status='APPROVED',
            is_online=True
        )

        # 5. Active Order in PICKED_UP status
        self.order = Order.objects.create(
            order_number='ORD-PH13-1001',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user_1,
            status='PICKED_UP',
            subtotal=Decimal('420.00'),
            delivery_fee=Decimal('40.00'),
            packaging_fee=Decimal('15.00'),
            total=Decimal('475.00'),
            cooking_instructions='Please ring bell twice and leave at doorstep',
            delivery_address_text='Indiranagar, Bengaluru',
            delivery_address_snapshot={
                'full_name': 'Alok Verma',
                'phone': '+919876543302',
                'formatted_address': 'Penthouse 802, Prestige Tower, Indiranagar, Bengaluru - 560038',
                'area_sector_locality': 'Indiranagar'
            }
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            food_item=self.food_item,
            food_name_snapshot='Smoked Truffle Tagliatelle',
            quantity=1,
            unit_price_snapshot=Decimal('420.00'),
            price=Decimal('420.00'),
            item_total=Decimal('420.00')
        )

        # 6. Delivery Assignment in PICKED_UP status
        self.assignment = DeliveryAssignment.objects.create(
            order=self.order,
            delivery_partner=self.rider_user_1,
            status='PICKED_UP',
            assigned_at=timezone.now(),
            accepted_at=timezone.now(),
            reached_restaurant_at=timezone.now(),
            picked_up_at=timezone.now()
        )
        self.partner_1.active_order = self.order
        self.partner_1.save()

        # 7. Generate secure DeliveryOTP
        self.delivery_otp, self.plaintext_otp = generate_secure_delivery_otp(self.order, self.assignment)

    # 1. Assigned partner can view active delivery
    def test_01_assigned_partner_can_view_active_delivery(self):
        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.get('/api/delivery/tasks/active/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        active_task = response.data.get('active_task')
        self.assertIsNotNone(active_task)
        self.assertEqual(active_task['order_number'], 'ORD-PH13-1001')
        self.assertEqual(active_task['task_status'], 'PICKED_UP')
        self.assertEqual(active_task['customer_name'], 'Alok Verma')
        self.assertEqual(active_task['customer_phone'], '+919876543302')
        self.assertIn('Prestige Tower', active_task['customer_address'])

    # 2. Partner cannot view another partner's task
    def test_02_partner_cannot_view_another_partners_task(self):
        self.client.force_authenticate(user=self.rider_user_2)
        response = self.client.get(f'/api/delivery/tasks/{self.assignment.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('not authorized', response.data['error'].lower())

    # 3. Delivery cannot complete before pickup
    def test_03_delivery_cannot_complete_before_pickup(self):
        # Create un-picked up order and task
        order_accepted = Order.objects.create(
            order_number='ORD-PH13-ACCP',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user_1,
            status='ACCEPTED',
            total=Decimal('300.00')
        )
        task_accepted = DeliveryAssignment.objects.create(
            order=order_accepted,
            delivery_partner=self.rider_user_1,
            status='ACCEPTED'
        )
        _, plain = generate_secure_delivery_otp(order_accepted, task_accepted)

        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.post(f'/api/delivery/tasks/{task_accepted.id}/verify-otp/', {'otp': plain})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('before food pickup', response.data['error'].lower())

    # 4. Valid OTP completes delivery
    def test_04_valid_otp_completes_delivery(self):
        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))

        self.assignment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.assignment.status, 'DELIVERED')
        self.assertIsNotNone(self.assignment.delivered_at)
        self.assertEqual(self.order.status, 'DELIVERED')
        self.assertEqual(self.order.payment_status, 'COMPLETED')

    # 5. Incorrect OTP is rejected
    def test_05_incorrect_otp_is_rejected(self):
        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': '000000'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('incorrect', response.data['error'].lower())

        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, 'PICKED_UP')

    # 6. Expired OTP is rejected
    def test_06_expired_otp_is_rejected(self):
        self.delivery_otp.expires_at = timezone.now() - timezone.timedelta(minutes=10)
        self.delivery_otp.save()

        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', response.data['error'].lower())

    # 7. Repeated OTP failures trigger protection
    def test_07_repeated_otp_failures_trigger_protection(self):
        self.client.force_authenticate(user=self.rider_user_1)
        # Attempt incorrect OTP 5 times
        for i in range(4):
            r = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {'otp': '111111'})
            self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

        # 5th attempt locks verification
        r5 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {'otp': '111111'})
        self.assertIn(r5.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_429_TOO_MANY_REQUESTS])
        self.assertIn('locked', r5.data['error'].lower())

        self.delivery_otp.refresh_from_db()
        self.assertTrue(self.delivery_otp.is_locked())

    # 8. OTP cannot be reused
    def test_08_otp_cannot_be_reused(self):
        self.client.force_authenticate(user=self.rider_user_1)
        # First verification succeeds
        resp1 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Mark second task to attempt reusing the same OTP
        order_new = Order.objects.create(
            order_number='ORD-PH13-REUSE',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user_1,
            status='PICKED_UP',
            total=Decimal('250.00')
        )
        task_new = DeliveryAssignment.objects.create(
            order=order_new,
            delivery_partner=self.rider_user_1,
            status='PICKED_UP'
        )
        # Point task_new to same delivery_otp that is already used
        self.delivery_otp.refresh_from_db()
        self.delivery_otp.assignment = task_new
        self.delivery_otp.order = order_new
        self.delivery_otp.save()

        resp2 = self.client.post(f'/api/delivery/tasks/{task_new.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been used', resp2.data['error'].lower())

    # 9. Plaintext OTP is not exposed in production APIs
    def test_09_plaintext_otp_is_not_exposed_in_production_apis(self):
        self.client.force_authenticate(user=self.rider_user_1)
        # Check active task endpoint
        resp_active = self.client.get('/api/delivery/tasks/active/')
        self.assertEqual(resp_active.status_code, status.HTTP_200_OK)
        self.assertNotIn('otp', resp_active.data['active_task'])
        self.assertNotIn('otp_hash', resp_active.data['active_task'])

        # Check task details endpoint
        resp_detail = self.client.get(f'/api/delivery/tasks/{self.assignment.id}/')
        self.assertEqual(resp_detail.status_code, status.HTTP_200_OK)
        self.assertNotIn('otp', resp_detail.data)
        self.assertNotIn('otp_hash', resp_detail.data)

        # Check available jobs endpoint
        resp_jobs = self.client.get('/api/delivery/jobs/')
        self.assertEqual(resp_jobs.status_code, status.HTTP_200_OK)
        self.assertNotIn('otp', str(resp_jobs.data))

    # 10. Order and task statuses update atomically
    def test_10_order_and_task_statuses_update_atomically(self):
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })

        self.assignment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.assignment.status, 'DELIVERED')
        self.assertEqual(self.order.status, 'DELIVERED')

    # 11. Duplicate completion requests are handled safely (idempotent)
    def test_11_duplicate_completion_requests_handled_safely(self):
        self.client.force_authenticate(user=self.rider_user_1)
        resp1 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Duplicate verification request
        resp2 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertIn('already been verified', resp2.data['message'].lower())

    # 12. Delivery issue reports are stored
    def test_12_delivery_issue_reports_are_stored(self):
        self.client.force_authenticate(user=self.rider_user_1)
        response = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/report-issue/', {
            'category': 'CUSTOMER_UNAVAILABLE',
            'description': 'Customer phone switched off and doorbell unanswered after 10 mins.'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        issue_exists = DeliveryIssueReport.objects.filter(
            assignment=self.assignment,
            category='CUSTOMER_UNAVAILABLE'
        ).exists()
        self.assertTrue(issue_exists)

    # 13. Issue reports do not automatically cancel orders
    def test_13_issue_reports_do_not_automatically_cancel_orders(self):
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/tasks/{self.assignment.id}/report-issue/', {
            'category': 'DELAYED_HANDOVER',
            'description': 'Customer requested delivery delay by 15 mins.'
        })

        self.order.refresh_from_db()
        self.assignment.refresh_from_db()
        # Crucial prompt rule: Order must NOT be automatically cancelled or delivered
        self.assertEqual(self.order.status, 'PICKED_UP')
        self.assertEqual(self.assignment.status, 'PICKED_UP')

    # 14. Customer sees DELIVERED after successful verification
    def test_14_customer_sees_delivered_after_successful_verification(self):
        # Complete delivery
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })

        # Customer checks order status
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/orders/{self.order.id}/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'DELIVERED')
        self.assertTrue(response.data['is_delivered'])
        self.assertIsNotNone(response.data['delivered_at'])

    # 15. Customer cannot modify order status
    def test_15_customer_cannot_modify_order_status(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(f'/api/orders/{self.order.id}/status/', {
            'status': 'DELIVERED'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('not permitted', response.data['error'].lower())

    # 16. Delivery history is restricted to the correct partner
    def test_16_delivery_history_restricted_to_correct_partner(self):
        # Partner 1 completes delivery
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })

        # Partner 1 views history
        resp1 = self.client.get('/api/delivery/history/')
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        order_numbers = [item['order_number'] for item in resp1.data['results']]
        self.assertIn('ORD-PH13-1001', order_numbers)

        # Partner 2 views history - MUST NOT see Partner 1's delivery
        self.client.force_authenticate(user=self.rider_user_2)
        resp2 = self.client.get('/api/delivery/history/')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        other_numbers = [item['order_number'] for item in resp2.data['results']]
        self.assertNotIn('ORD-PH13-1001', other_numbers)

        # Partner 2 attempts to view detail of Partner 1's history record
        resp_detail = self.client.get(f'/api/delivery/history/{self.assignment.id}/')
        self.assertEqual(resp_detail.status_code, status.HTTP_403_FORBIDDEN)

    # 17. PostgreSQL data persists after server restart (persistence check)
    def test_17_postgresql_data_persists_after_server_restart(self):
        self.client.force_authenticate(user=self.rider_user_1)
        self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': self.plaintext_otp
        })

        # Query fresh from DB
        fresh_assignment = DeliveryAssignment.objects.get(id=self.assignment.id)
        fresh_order = Order.objects.get(id=self.order.id)
        fresh_otp = DeliveryOTP.objects.get(order=self.order)

        self.assertEqual(fresh_assignment.status, 'DELIVERED')
        self.assertEqual(fresh_order.status, 'DELIVERED')
        self.assertTrue(fresh_otp.is_used)
        self.assertIsNotNone(fresh_otp.verified_at)

        # Verify audit history
        order_history = OrderStatusHistory.objects.filter(order=fresh_order, to_status='DELIVERED')
        self.assertTrue(order_history.exists())
        self.assertEqual(order_history.first().actor, self.rider_user_1)


import json
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.orders.models import Order
from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.orders.consumers import OrderTrackingConsumer

User = get_user_model()


class Phase15GPSTrackingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Customer A
        self.customer = User.objects.create_user(
            username='arjun_customer_phase15',
            email='arjun.phase15@example.com',
            password='TestPassword123!',
            first_name='Arjun',
            last_name='Mehta',
            role='CUSTOMER'
        )

        # Customer B (Unauthorized third-party)
        self.intruder_customer = User.objects.create_user(
            username='intruder_phase15',
            email='intruder.phase15@example.com',
            password='TestPassword123!',
            first_name='Sneaky',
            last_name='User',
            role='CUSTOMER'
        )

        # Restaurant Owner & Restaurant
        self.restaurant_owner = User.objects.create_user(
            username='chef_priya_phase15',
            email='priya.phase15@example.com',
            password='TestPassword123!',
            role='RESTAURANT_OWNER'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Indiranagar Bistro',
            owner_name='Chef Priya',
            address='84 100ft Road, Indiranagar, Bengaluru',
            latitude=Decimal('12.9785'),
            longitude=Decimal('77.6015')
        )

        # Delivery Partner A (Assigned)
        self.partner_user = User.objects.create_user(
            username='rider_vikas_phase15',
            email='vikas.phase15@example.com',
            password='TestPassword123!',
            first_name='Vikas',
            last_name='Rao',
            phone='+91 98765 11223',
            role='DELIVERY'
        )
        self.partner = DeliveryPartner.objects.create(
            user=self.partner_user,
            vehicle_type='Bike',
            vehicle_number='KA-03-FD-8899',
            is_verified=True,
            is_online=True,
            current_latitude=Decimal('12.9750'),
            current_longitude=Decimal('77.5980'),
            battery_percentage=92
        )

        # Delivery Partner B (Unassigned)
        self.other_partner_user = User.objects.create_user(
            username='rider_other_phase15',
            email='other.phase15@example.com',
            password='TestPassword123!',
            role='DELIVERY'
        )
        self.other_partner = DeliveryPartner.objects.create(
            user=self.other_partner_user,
            vehicle_type='Scooter',
            vehicle_number='KA-03-FD-0011',
            is_verified=True,
            is_online=True
        )

        # Order for Customer A
        self.order = Order.objects.create(
            order_number='ORD-PHASE15-7722',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.partner_user,
            customer_lat=Decimal('12.9716'),
            customer_lng=Decimal('77.5946'),
            restaurant_lat=Decimal('12.9785'),
            restaurant_lng=Decimal('77.6015'),
            rider_lat=Decimal('12.9750'),
            rider_lng=Decimal('77.5980'),
            eta_minutes=20,
            delivery_address_text='Penthouse 702, Skyline Heights, Neo Bengaluru',
            status='PICKED_UP',
            payment_status='PAID',
            total=Decimal('540.00'),
            grand_total=Decimal('540.00')
        )

        # Assignment
        self.assignment = DeliveryAssignment.objects.create(
            order=self.order,
            delivery_partner=self.partner_user,
            status='PICKED_UP'
        )

    # 1. Authorized partner can publish GPS telemetry for active delivery
    def test_authorized_partner_can_publish_gps_telemetry(self):
        self.client.force_authenticate(user=self.partner_user)
        response = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9760,
            'longitude': 77.5990,
            'heading': 78.5,
            'speed': 35.0,
            'battery': 89
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['status'], 'updated')
        self.assertAlmostEqual(data['latitude'], 12.9760, places=4)
        self.assertAlmostEqual(data['longitude'], 77.5990, places=4)
        self.assertAlmostEqual(data['heading'], 78.5, places=1)
        self.assertEqual(data['battery'], 89)

        # Check DB persistence
        self.partner.refresh_from_db()
        self.assertAlmostEqual(float(self.partner.current_latitude), 12.9760, places=4)
        self.assertAlmostEqual(float(self.partner.current_longitude), 77.5990, places=4)
        self.assertIsNotNone(self.partner.last_location_updated_at)

        self.order.refresh_from_db()
        self.assertAlmostEqual(float(self.order.rider_lat), 12.9760, places=4)
        self.assertAlmostEqual(float(self.order.rider_lng), 77.5990, places=4)
        self.assertAlmostEqual(float(self.order.rider_heading), 78.5, places=1)
        self.assertIsNotNone(self.order.last_location_updated_at)

    # 2. Unassigned partner cannot publish location for another partner's order
    def test_unassigned_partner_cannot_publish_location_for_other_order(self):
        self.client.force_authenticate(user=self.other_partner_user)
        response = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9760,
            'longitude': 77.5990
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Permission denied', response.data['error'])

    # 3. Customer cannot track another customer's order
    def test_customer_cannot_track_other_customer_order(self):
        self.client.force_authenticate(user=self.intruder_customer)
        response = self.client.get(f'/api/orders/{self.order.id}/tracking/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Permission denied', response.data['error'])

    # 4. Authorized customer can retrieve live tracking
    def test_authorized_customer_can_retrieve_live_tracking(self):
        # Update rider position first
        self.order.last_location_updated_at = timezone.now()
        self.order.rider_lat = Decimal('12.9765')
        self.order.rider_lng = Decimal('77.5992')
        self.order.save()

        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/orders/{self.order.id}/tracking/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertTrue(data['is_trackable'])
        self.assertEqual(data['order_number'], self.order.order_number)
        self.assertEqual(data['restaurant']['name'], self.restaurant.name)
        self.assertAlmostEqual(data['restaurant']['latitude'], 12.9785, places=4)
        self.assertAlmostEqual(data['customer']['latitude'], 12.9716, places=4)
        self.assertEqual(data['delivery_partner']['name'], 'Vikas Rao')
        self.assertAlmostEqual(data['delivery_partner']['latitude'], 12.9765, places=4)
        self.assertFalse(data['delivery_partner']['is_stale'])

    # 5. Tracking endpoint handles unassigned order safely
    def test_tracking_endpoint_handles_unassigned_order_safely(self):
        unassigned_order = Order.objects.create(
            order_number='ORD-UNASSIGNED-101',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=None,
            status='PLACED',
            total=Decimal('300.00')
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/orders/{unassigned_order.id}/tracking/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertFalse(data['is_trackable'])
        self.assertIn('has not yet been assigned', data['message'])

    # 6. Tracking stops once order reaches terminal state (DELIVERED or CANCELLED)
    def test_tracking_stops_after_delivery_and_cancellation(self):
        # Delivered state
        self.order.status = 'DELIVERED'
        self.order.save()

        self.client.force_authenticate(user=self.customer)
        res_deliv = self.client.get(f'/api/orders/{self.order.id}/tracking/')
        self.assertEqual(res_deliv.status_code, status.HTTP_200_OK)
        self.assertFalse(res_deliv.data['is_trackable'])
        self.assertIn('has been delivered', res_deliv.data['message'])

        # Partner cannot push GPS to delivered order
        self.client.force_authenticate(user=self.partner_user)
        res_push = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9760,
            'longitude': 77.5990
        })
        self.assertEqual(res_push.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot update GPS location', res_push.data['error'])

    # 7. Invalid coordinates are rejected
    def test_invalid_coordinates_are_rejected(self):
        self.client.force_authenticate(user=self.partner_user)

        # Latitude out of bounds (> 90)
        res1 = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 95.0,
            'longitude': 77.5980
        })
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid coordinates', res1.data['error'])

        # Longitude out of bounds (> 180)
        res2 = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9750,
            'longitude': 195.0
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # Non-numeric
        res3 = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 'not_a_coord',
            'longitude': 'also_invalid'
        })
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

    # 8. Non-partner role cannot publish telemetry
    def test_customer_cannot_publish_telemetry(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9750,
            'longitude': 77.5980
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # 9. Stale location detection
    def test_stale_location_is_clearly_indicated(self):
        # Set last location updated to 120 seconds ago
        self.order.last_location_updated_at = timezone.now() - timedelta(seconds=120)
        self.order.save()
        self.partner.last_location_updated_at = timezone.now() - timedelta(seconds=120)
        self.partner.save()

        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/orders/{self.order.id}/tracking/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        partner_data = response.data['delivery_partner']
        self.assertTrue(partner_data['is_stale'])
        self.assertGreaterEqual(partner_data['staleness_seconds'], 110)

    # 10. Telemetry throttling protects backend from bursts
    def test_telemetry_throttling_protects_backend(self):
        self.client.force_authenticate(user=self.partner_user)
        # First update
        res1 = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9760,
            'longitude': 77.5990
        })
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['status'], 'updated')

        # Immediate burst update (< 1 second)
        res2 = self.client.post('/api/delivery/location/', {
            'order_id': self.order.id,
            'latitude': 12.9762,
            'longitude': 77.5992
        })
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['status'], 'throttled')
