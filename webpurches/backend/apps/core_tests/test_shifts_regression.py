"""
Fast Delivery (FD) - Shift Scheduling & Workflows Regression Test Suite
Tests ShiftSlot creation, calendar population, booking, waitlist overflow,
check-in with geofence validation, and idempotent shift checkout.
"""

from datetime import time, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from apps.shifts.models import ShiftSlot, Shift, ShiftBooking, CheckIn
from apps.core_tests.factories import create_test_user, create_test_rider


class ShiftSchedulingRegressionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rider_user = create_test_user(role='DELIVERY', username='shift_rider_1')
        self.rider = create_test_rider(user=self.rider_user, is_online=False)

        # Create slot
        self.slot = ShiftSlot.objects.create(
            name='Lunch Peak Chennai',
            slot_type='LUNCH',
            start_time=time(11, 0),
            end_time=time(15, 0),
            multiplier=1.5,
            is_peak=True,
            zone='Chennai Central',
            zone_lat=13.0827,
            zone_lng=80.2707,
            geofence_radius_km=5.0,
            max_capacity=1
        )

    def test_calendar_auto_populates_and_returns_slots(self):
        """Calendar view populates 7 days of shift records and returns them."""
        self.client.force_authenticate(user=self.rider_user)
        response = self.client.get('/api/shifts/calendar/?zone=Chennai+Central')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 7)
        self.assertEqual(response.data[0]['slot_name'], 'Lunch Peak Chennai')
        self.assertEqual(response.data[0]['multiplier'], 1.5)

    def test_shift_booking_and_waitlist_overflow(self):
        """First rider gets confirmed booking; second rider is waitlisted when capacity is reached."""
        today = timezone.now().date()
        shift = Shift.objects.create(
            slot=self.slot,
            date=today,
            zone=self.slot.zone,
            capacity=1,
            booked_count=0
        )

        # First rider books
        self.client.force_authenticate(user=self.rider_user)
        res1 = self.client.post('/api/shifts/book/', {'shift_id': shift.id})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['status'], 'BOOKED')

        shift.refresh_from_db()
        self.assertEqual(shift.booked_count, 1)
        self.assertTrue(shift.is_full)

        # Second rider attempts booking
        rider2_user = create_test_user(role='DELIVERY', username='shift_rider_2')
        create_test_rider(user=rider2_user, is_online=False)
        self.client.force_authenticate(user=rider2_user)
        res2 = self.client.post('/api/shifts/book/', {'shift_id': shift.id})
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['status'], 'WAITLIST')
        self.assertEqual(res2.data['waitlist_position'], 1)

    def test_shift_checkin_and_idempotent_checkout(self):
        """Rider checks into a booked shift, switches online, and checkout is idempotent."""
        today = timezone.now().date()
        shift = Shift.objects.create(
            slot=self.slot,
            date=today,
            zone=self.slot.zone,
            capacity=5,
            booked_count=1
        )
        booking = ShiftBooking.objects.create(
            shift=shift,
            rider=self.rider_user,
            date=today,
            status='BOOKED'
        )

        self.client.force_authenticate(user=self.rider_user)
        # Check in with coordinates matching the slot's zone
        res_checkin = self.client.post('/api/shifts/check-in/', {
            'booking_id': booking.id,
            'latitude': 13.0827,
            'longitude': 80.2707
        })
        self.assertEqual(res_checkin.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_checkin.data['status'], 'ACTIVE')

        # Check rider online status
        self.rider.refresh_from_db()
        self.assertTrue(self.rider.is_online)

        # Check out
        res_checkout = self.client.post('/api/shifts/check-out/', {
            'booking_id': booking.id,
            'latitude': 13.0827,
            'longitude': 80.2707
        })
        self.assertEqual(res_checkout.status_code, status.HTTP_200_OK)
        self.assertTrue(res_checkout.data['success'])
        self.assertGreater(res_checkout.data['shift_earnings'], 0)

        # Second checkout attempt should be idempotent
        res_replay = self.client.post('/api/shifts/check-out/', {
            'booking_id': booking.id,
            'latitude': 13.0827,
            'longitude': 80.2707
        })
        self.assertEqual(res_replay.status_code, status.HTTP_200_OK)
        self.assertTrue(res_replay.data.get('already_completed', False))
