import io
from PIL import Image
from datetime import time
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem
from apps.orders.models import Order
from apps.delivery.models import DeliveryPartner, DeliveryAssignment, DeliveryOTP
from apps.delivery.otp_service import generate_secure_delivery_otp, generate_secure_pickup_otp


def create_test_image(format='JPEG', filename='test.jpg'):
    """Helper creating real PIL in-memory image for upload testing."""
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color=(16, 185, 129))
    image.save(file, format=format)
    file.seek(0)
    return SimpleUploadedFile(filename, file.read(), content_type=f'image/{format.lower()}')


class PickupAndDeliveryVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Customer
        self.customer = User.objects.create_user(
            email='customer_test@wsfood.io',
            username='cust_verif',
            password='password123',
            role='CUSTOMER'
        )

        # Restaurant Owner
        self.restaurant_owner = User.objects.create_user(
            email='rest_owner@wsfood.io',
            username='chef_verif',
            password='password123',
            role='RESTAURANT'
        )

        # Restaurant
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='CYBER BURGER HQ',
            is_open=True,
            verification_status='APPROVED',
            opening_time=time(8, 0),
            closing_time=time(23, 0)
        )

        # Delivery Partner 1 (Assigned)
        self.rider_user = User.objects.create_user(
            email='rider_one@wsfood.io',
            username='rider_one',
            password='password123',
            role='DELIVERY'
        )
        self.rider_profile = DeliveryPartner.objects.create(
            user=self.rider_user,
            vehicle_number='KA-03-FD-1111',
            is_online=True,
            is_verified=True
        )

        # Delivery Partner 2 (Unauthorized / Impersonator)
        self.other_rider = User.objects.create_user(
            email='other_rider@wsfood.io',
            username='other_rider',
            password='password123',
            role='DELIVERY'
        )
        self.other_profile = DeliveryPartner.objects.create(
            user=self.other_rider,
            vehicle_number='KA-03-FD-2222',
            is_online=True,
            is_verified=True
        )

        # Order
        self.order = Order.objects.create(
            order_number='FD-VERIF-1001',
            customer=self.customer,
            restaurant=self.restaurant,
            rider=self.rider_user,
            status='READY_FOR_PICKUP',
            pickup_otp='5291',
            otp='8492'
        )

        # Delivery Assignment
        self.assignment = DeliveryAssignment.objects.create(
            order=self.order,
            delivery_partner=self.rider_user,
            status='REACHED_RESTAURANT'
        )

    # -------------------------------------------------------------------------
    # 1. Restaurant Handover: 4-digit Pickup Code Tests
    # -------------------------------------------------------------------------
    def test_correct_four_digit_pickup_code_confirms_handover(self):
        """Assigned rider provides correct 4-digit pickup code to confirm food pickup."""
        self.client.force_authenticate(user=self.rider_user)
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'pickup_otp': '5291'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.order.status, 'PICKED_UP')
        self.assertEqual(self.assignment.status, 'PICKED_UP')
        self.assertEqual(self.order.pickup_verification_method, 'OTP')
        # Check delivery OTP was generated with 4 digits
        self.assertEqual(len(str(self.order.otp)), 4)

    def test_incorrect_four_digit_pickup_code_is_rejected(self):
        """Incorrect 4-digit pickup code returns 400 Bad Request."""
        self.client.force_authenticate(user=self.rider_user)
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'pickup_otp': '9999'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('incorrect', res.data.get('error', '').lower())
        self.assignment.refresh_from_db()
        self.assertNotEqual(self.assignment.status, 'PICKED_UP')

    def test_six_digit_and_non_numeric_pickup_code_rejected(self):
        """Six-digit and non-numeric codes are rejected with 400."""
        self.client.force_authenticate(user=self.rider_user)
        # 6 digits
        res6 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'pickup_otp': '123456'
        })
        self.assertEqual(res6.status_code, status.HTTP_400_BAD_REQUEST)

        # non-numeric
        res_alpha = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'pickup_otp': 'ABCD'
        })
        self.assertEqual(res_alpha.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # 2. Restaurant Handover: Photo Alternative Tests
    # -------------------------------------------------------------------------
    def test_valid_photo_pickup_handover(self):
        """Uploading a genuine photo of food package confirms pickup handover."""
        self.client.force_authenticate(user=self.rider_user)
        image = create_test_image(format='JPEG', filename='food_package.jpg')
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'photo': image,
            'verification_mode': 'PHOTO'
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.order.status, 'PICKED_UP')
        self.assertEqual(self.order.pickup_verification_method, 'PHOTO')
        self.assertTrue(bool(self.order.pickup_photo))

    def test_invalid_photo_file_rejected_for_pickup(self):
        """Non-image or corrupt text payload is rejected for pickup photo verification."""
        self.client.force_authenticate(user=self.rider_user)
        fake_file = SimpleUploadedFile('malicious.txt', b'NOT AN IMAGE', content_type='text/plain')
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'photo': fake_file,
            'verification_mode': 'PHOTO'
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # 3. Customer Delivery: 4-digit OTP Tests
    # -------------------------------------------------------------------------
    def test_correct_four_digit_delivery_otp_completes_order(self):
        """Assigned rider inputs correct 4-digit customer delivery OTP to complete delivery."""
        # First transition to PICKED_UP
        self.assignment.status = 'PICKED_UP'
        self.assignment.save()
        self.order.status = 'PICKED_UP'
        self.order.save()
        _, plain = generate_secure_delivery_otp(self.order, self.assignment, length=4)

        self.client.force_authenticate(user=self.rider_user)
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'otp': plain
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.order.status, 'DELIVERED')
        self.assertEqual(self.assignment.status, 'DELIVERED')
        self.assertEqual(self.order.delivery_verification_method, 'OTP')

    def test_incorrect_and_wrong_length_delivery_otp_rejected(self):
        """Incorrect and 6-digit delivery OTPs are rejected."""
        self.assignment.status = 'PICKED_UP'
        self.assignment.save()
        self.order.status = 'PICKED_UP'
        self.order.save()
        generate_secure_delivery_otp(self.order, self.assignment, length=4)

        self.client.force_authenticate(user=self.rider_user)
        # 6 digits
        res6 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {'otp': '123456'})
        self.assertEqual(res6.status_code, status.HTTP_400_BAD_REQUEST)
        # wrong 4 digits
        res4 = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {'otp': '0000'})
        self.assertEqual(res4.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # 4. Customer Delivery: Photo Alternative & Review Workflow
    # -------------------------------------------------------------------------
    def test_valid_doorstep_photo_completes_delivery(self):
        """Valid doorstep delivery photo completes delivery when OTP is unavailable."""
        self.assignment.status = 'PICKED_UP'
        self.assignment.save()
        self.order.status = 'PICKED_UP'
        self.order.save()

        self.client.force_authenticate(user=self.rider_user)
        image = create_test_image(format='PNG', filename='doorstep_drop.png')
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/', {
            'photo': image,
            'verification_mode': 'PHOTO'
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.order.status, 'DELIVERED')
        self.assertEqual(self.order.delivery_verification_method, 'PHOTO')
        self.assertTrue(bool(self.order.delivery_photo))

    def test_pending_photo_verification_does_not_falsely_mark_delivered(self):
        """When manual review is requested, order stays in pending review and is NOT marked DELIVERED."""
        self.assignment.status = 'PICKED_UP'
        self.assignment.save()
        self.order.status = 'PICKED_UP'
        self.order.save()

        self.client.force_authenticate(user=self.rider_user)
        image = create_test_image(format='JPEG', filename='review_needed.jpg')
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/verify-otp/?require_manual_review=true', {
            'photo': image,
            'verification_mode': 'PHOTO',
            'require_manual_review': 'true'
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('pending_review'))
        self.order.refresh_from_db()
        self.assignment.refresh_from_db()
        # Order must NOT be marked DELIVERED
        self.assertNotEqual(self.order.status, 'DELIVERED')
        self.assertEqual(self.order.photo_verification_status, 'PENDING_REVIEW')

    # -------------------------------------------------------------------------
    # 5. Security & Scoping Tests
    # -------------------------------------------------------------------------
    def test_restaurant_user_cannot_view_customer_delivery_otp(self):
        """Restaurant user can see pickup_otp but cannot view customer delivery OTP."""
        self.client.force_authenticate(user=self.restaurant_owner)
        res = self.client.get(f'/api/orders/{self.order.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Restaurant sees pickup handover code
        self.assertEqual(res.data.get('pickup_otp'), '5291')
        # Restaurant CANNOT see customer delivery OTP
        self.assertIsNone(res.data.get('otp'))

    def test_unauthorized_rider_cannot_verify_or_upload_for_another_order(self):
        """A rider not assigned to the order is forbidden (403) from verifying it."""
        self.client.force_authenticate(user=self.other_rider)
        res = self.client.post(f'/api/delivery/tasks/{self.assignment.id}/confirm-pickup/', {
            'pickup_otp': '5291'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
