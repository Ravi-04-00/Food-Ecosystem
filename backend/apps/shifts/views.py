import math
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Count, Avg
from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from .models import ShiftSlot, Shift, ShiftBooking, CheckIn, BreakLog, ShiftSwap, ShiftBonus
from .serializers import (
    ShiftSlotSerializer, ShiftSerializer, ShiftBookingSerializer,
    CheckInSerializer, BreakLogSerializer, ShiftSwapSerializer, ShiftBonusSerializer
)
from apps.accounts.models import User, Wallet, WalletTransaction
from apps.delivery.models import DeliveryPartner

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class ShiftSlotListView(generics.ListCreateAPIView):
    queryset = ShiftSlot.objects.all()
    serializer_class = ShiftSlotSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        zone = self.request.query_params.get('zone')
        if zone:
            qs = qs.filter(zone__icontains=zone)
        return qs


class ShiftCalendarView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        zone = request.query_params.get('zone', 'Chennai Central')
        
        # Ensure shifts exist for the next 7 days for all slots
        slots = ShiftSlot.objects.all()
        for day_offset in range(7):
            shift_date = today + timedelta(days=day_offset)
            for slot in slots:
                Shift.objects.get_or_create(
                    slot=slot,
                    date=shift_date,
                    zone=slot.zone,
                    defaults={'capacity': slot.max_capacity}
                )

        shifts = Shift.objects.filter(
            date__gte=today,
            date__lte=today + timedelta(days=6)
        ).select_related('slot')

        if zone:
            shifts = shifts.filter(zone__icontains=zone)

        # Get current rider bookings
        my_bookings = {
            b.shift_id: b for b in ShiftBooking.objects.filter(rider=request.user, date__gte=today)
        }

        calendar_data = []
        for s in shifts:
            booking = my_bookings.get(s.id)
            calendar_data.append({
                'shift_id': s.id,
                'slot_id': s.slot.id,
                'slot_name': s.slot.name,
                'slot_type': s.slot.slot_type,
                'start_time': s.slot.start_time.strftime('%H:%M'),
                'end_time': s.slot.end_time.strftime('%H:%M'),
                'date': str(s.date),
                'zone': s.zone,
                'multiplier': float(s.slot.multiplier),
                'is_peak': s.slot.is_peak,
                'capacity': s.capacity,
                'booked_count': s.booked_count,
                'is_full': s.is_full,
                'my_booking_status': booking.status if booking else None,
                'my_waitlist_position': booking.waitlist_position if booking else 0,
                'booking_id': booking.id if booking else None
            })

        return Response(calendar_data, status=status.HTTP_200_OK)


class BookShiftView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        shift_id = request.data.get('shift_id')
        shift = Shift.objects.filter(id=shift_id).select_related('slot').first()
        if not shift:
            return Response({'error': 'Shift not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check existing booking
        existing = ShiftBooking.objects.filter(shift=shift, rider=request.user).first()
        if existing and existing.status in ['BOOKED', 'CHECKED_IN', 'WAITLIST']:
            return Response({'error': f'You already have an active reservation for this slot: {existing.status}'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if shift.booked_count < shift.capacity:
                booking = ShiftBooking.objects.create(
                    shift=shift,
                    rider=request.user,
                    date=shift.date,
                    status='BOOKED',
                    waitlist_position=0
                )
                shift.booked_count += 1
                shift.save()
                return Response({
                    'success': True,
                    'status': 'BOOKED',
                    'message': f'Shift booked successfully! Peak multiplier: {shift.slot.multiplier}x',
                    'booking': ShiftBookingSerializer(booking).data
                }, status=status.HTTP_201_CREATED)
            else:
                # Add to waitlist
                shift.waitlist_count += 1
                shift.save()
                booking = ShiftBooking.objects.create(
                    shift=shift,
                    rider=request.user,
                    date=shift.date,
                    status='WAITLIST',
                    waitlist_position=shift.waitlist_count
                )
                return Response({
                    'success': True,
                    'status': 'WAITLIST',
                    'waitlist_position': booking.waitlist_position,
                    'message': f'Slot is full! You have joined the waitlist at position #{booking.waitlist_position}.'
                }, status=status.HTTP_201_CREATED)


class CancelShiftBookingView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        booking = ShiftBooking.objects.filter(id=booking_id, rider=request.user).select_related('shift').first()
        if not booking:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            old_status = booking.status
            shift = booking.shift
            booking.status = 'CANCELLED'
            booking.save()

            if old_status == 'BOOKED':
                shift.booked_count = max(0, shift.booked_count - 1)
                
                # Auto-promote waitlisted rider
                waitlisted = ShiftBooking.objects.filter(
                    shift=shift,
                    status='WAITLIST'
                ).order_by('waitlist_position').first()

                if waitlisted:
                    waitlisted.status = 'BOOKED'
                    waitlisted.waitlist_position = 0
                    waitlisted.save()
                    shift.booked_count += 1
                    shift.waitlist_count = max(0, shift.waitlist_count - 1)
                    
                    # Reorder remaining waitlisted riders
                    rem_waitlist = ShiftBooking.objects.filter(shift=shift, status='WAITLIST').order_by('waitlist_position')
                    for idx, wb in enumerate(rem_waitlist, 1):
                        wb.waitlist_position = idx
                        wb.save()

                shift.save()

        return Response({'success': True, 'message': 'Shift booking cancelled successfully.'})


class ShiftCheckInView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        lat = float(request.data.get('latitude', 13.0827))
        lng = float(request.data.get('longitude', 80.2707))

        booking = ShiftBooking.objects.filter(id=booking_id, rider=request.user).select_related('shift__slot').first()
        if not booking:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(booking, 'check_in'):
            return Response({'error': 'Already checked in for this shift'}, status=status.HTTP_400_BAD_REQUEST)

        slot = booking.shift.slot
        # Geofence check
        dist_km = haversine_distance(lat, lng, float(slot.zone_lat), float(slot.zone_lng))
        geofence_passed = dist_km <= float(slot.geofence_radius_km)
        
        now = timezone.now()
        slot_start_dt = datetime.combine(booking.date, slot.start_time)
        slot_start_tz = timezone.make_aware(slot_start_dt) if timezone.is_naive(slot_start_dt) else slot_start_dt

        # Check late rule: >15 min after slot start
        late_minutes = max(0, int((now - slot_start_tz).total_seconds() / 60)) if now > slot_start_tz else 0
        is_late = late_minutes > 15
        penalty = 50.00 if is_late else 0.00

        with transaction.atomic():
            checkin = CheckIn.objects.create(
                booking=booking,
                rider=request.user,
                check_in_lat=lat,
                check_in_lng=lng,
                is_late=is_late,
                late_minutes=late_minutes,
                penalty_applied=penalty,
                status='ACTIVE'
            )
            booking.status = 'CHECKED_IN'
            booking.save()

            # Mark rider online
            request.user.is_online = True
            request.user.save()
            partner = getattr(request.user, 'delivery_profile', None)
            if partner:
                partner.is_online = True
                partner.current_latitude = lat
                partner.current_longitude = lng
                partner.save()

        return Response({
            'success': True,
            'status': 'ACTIVE',
            'is_late': is_late,
            'late_minutes': late_minutes,
            'penalty_applied': penalty,
            'geofence_distance_km': round(dist_km, 2),
            'multiplier': float(slot.multiplier),
            'message': f"Checked into {slot.name}! {'Late penalty ₹50 applied.' if is_late else 'On-time bonus intact.'}",
            'check_in': CheckInSerializer(checkin).data
        }, status=status.HTTP_201_CREATED)


class ShiftCheckOutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        lat = float(request.data.get('latitude', 13.0827))
        lng = float(request.data.get('longitude', 80.2707))

        booking = ShiftBooking.objects.filter(id=booking_id, rider=request.user).first()
        if not booking or not hasattr(booking, 'check_in'):
            return Response({'error': 'Active check-in not found'}, status=status.HTTP_404_NOT_FOUND)

        checkin = booking.check_in
        now = timezone.now()

        with transaction.atomic():
            # Lock rows to serialize concurrent checkouts (booking first,
            # then check-in via its own non-nullable FK to avoid FOR UPDATE
            # on an outer join).
            booking = ShiftBooking.objects.select_for_update().filter(
                id=booking_id, rider=request.user).first()
            if not booking:
                return Response({'error': 'Active check-in not found'}, status=status.HTTP_404_NOT_FOUND)
            try:
                checkin = CheckIn.objects.select_for_update().get(booking=booking)
            except CheckIn.DoesNotExist:
                return Response({'error': 'Active check-in not found'}, status=status.HTTP_404_NOT_FOUND)

            # Idempotent replay: already checked out -> return the original
            # result without recomputing hours or crediting earnings again.
            if checkin.status == 'COMPLETED' and checkin.check_out_time:
                frozen_hours = max(1.0, round((checkin.check_out_time - checkin.check_in_time).total_seconds() / 3600.0, 1))
                return Response({
                    'success': True,
                    'hours_worked': frozen_hours,
                    'shift_earnings': float(checkin.shift_earnings or 0),
                    'streak_bonus_awarded': False,
                    'already_completed': True,
                    'message': 'Shift already completed. No additional earnings credited.'
                })

            checkin.check_out_time = now
            checkin.check_out_lat = lat
            checkin.check_out_lng = lng
            checkin.status = 'COMPLETED'
            
            hours_worked = max(1.0, round((now - checkin.check_in_time).total_seconds() / 3600.0, 1))
            slot_mult = float(booking.shift.slot.multiplier)
            earned = round(hours_worked * 120.0 * slot_mult, 2)
            # Decimal for DB writes (Decimal += float raises TypeError);
            # float stays in the JSON response as before.
            earned_amount = Decimal(str(earned))
            checkin.shift_earnings = earned_amount
            checkin.save()

            booking.status = 'COMPLETED'
            booking.save()

            request.user.is_online = False
            request.user.save()

            # Update partner metrics
            partner = getattr(request.user, 'delivery_profile', None)
            if partner:
                partner.is_online = False
                partner.today_earnings += earned_amount
                partner.total_earnings += earned_amount
                partner.save()

            # Check streak rewards (every 5 completed shifts)
            completed_count = ShiftBooking.objects.filter(rider=request.user, status='COMPLETED').count()
            streak_awarded = False
            if completed_count > 0 and completed_count % 5 == 0:
                ShiftBonus.objects.create(
                    rider=request.user,
                    streak_count=completed_count,
                    bonus_amount=500.00,
                    reason=f"{completed_count} Shifts Milestone Streak Bonus!"
                )
                streak_awarded = True

        return Response({
            'success': True,
            'hours_worked': hours_worked,
            'shift_earnings': earned,
            'streak_bonus_awarded': streak_awarded,
            'message': f'Shift completed! ₹{earned} earned ({hours_worked} hrs worked).'
        })


class ShiftBreakStartView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        checkin = CheckIn.objects.filter(rider=request.user, status='ACTIVE').first()
        if not checkin:
            return Response({'error': 'No active shift in progress to take a break.'}, status=status.HTTP_400_BAD_REQUEST)

        breaks_taken = checkin.breaks.count()
        if breaks_taken >= 2:
            return Response({'error': 'Maximum limit of 2 breaks (15 min each) reached for this shift.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            brk = BreakLog.objects.create(
                check_in=checkin,
                rider=request.user,
                break_number=breaks_taken + 1,
                status='ACTIVE'
            )
            checkin.status = 'ON_BREAK'
            checkin.save()

        return Response({
            'success': True,
            'break_number': brk.break_number,
            'max_duration_minutes': 15,
            'message': f"Break #{brk.break_number} started (15 minutes). No orders will be assigned while on break."
        })


class ShiftBreakEndView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        active_break = BreakLog.objects.filter(rider=request.user, status='ACTIVE').first()
        if not active_break:
            return Response({'error': 'No active break found'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        duration = int((now - active_break.break_start).total_seconds() / 60)

        with transaction.atomic():
            active_break.break_end = now
            active_break.duration_minutes = duration
            active_break.status = 'COMPLETED'
            active_break.save()

            checkin = active_break.check_in
            checkin.status = 'ACTIVE'
            checkin.save()

        return Response({
            'success': True,
            'duration_minutes': duration,
            'message': f"Break #{active_break.break_number} ended ({duration} min). You are back active on duty!"
        })


class ShiftSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        bookings = ShiftBooking.objects.filter(rider=request.user)
        total_shifts = bookings.filter(status='COMPLETED').count()
        
        checkins = CheckIn.objects.filter(rider=request.user, status='COMPLETED')
        total_earnings = checkins.aggregate(s=Sum('shift_earnings'))['s'] or 0.00
        total_penalties = checkins.aggregate(p=Sum('penalty_applied'))['p'] or 0.00
        
        on_time_count = checkins.filter(is_late=False).count()
        total_checkins = checkins.count()
        on_time_percentage = round((on_time_count / total_checkins * 100), 1) if total_checkins > 0 else 100.0

        partner = getattr(request.user, 'delivery_profile', None)
        rating = float(partner.rating) if partner else 4.95

        return Response({
            'total_shifts_completed': total_shifts,
            'total_earnings': float(total_earnings),
            'total_penalties': float(total_penalties),
            'on_time_percentage': on_time_percentage,
            'rating': rating,
            'current_streak': total_shifts % 5,
            'next_bonus_in_shifts': 5 - (total_shifts % 5)
        })


class ShiftLeaderboardView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        partners = DeliveryPartner.objects.select_related('user').order_by('-total_deliveries')[:10]
        leaderboard = []
        is_admin = request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN')
        user_id = request.user.id if request.user.is_authenticated else None

        for rank, p in enumerate(partners, 1):
            can_see_earnings = is_admin or (user_id and p.user_id == user_id)
            leaderboard.append({
                'rank': rank,
                'name': p.user.get_full_name() or p.user.username,
                'deliveries': p.total_deliveries,
                'rating': float(p.rating),
                'weekly_earnings': float(p.weekly_earnings) if can_see_earnings else None,
                'vehicle': p.get_vehicle_type_display(),
                'avatar': p.user.avatar
            })
        return Response(leaderboard)


class ShiftSwapListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        swaps = ShiftSwap.objects.filter(requester=request.user) | ShiftSwap.objects.filter(receiver=request.user)
        return Response(ShiftSwapSerializer(swaps.distinct(), many=True).data)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        receiver_id = request.data.get('receiver_id')
        reason = request.data.get('reason', 'Schedule conflict')

        booking = ShiftBooking.objects.filter(id=booking_id, rider=request.user, status='BOOKED').first()
        if not booking:
            return Response({'error': 'Eligible booked shift not found'}, status=status.HTTP_404_NOT_FOUND)

        receiver = User.objects.filter(id=receiver_id).first() if receiver_id else None

        swap = ShiftSwap.objects.create(
            booking=booking,
            requester=request.user,
            receiver=receiver,
            reason=reason,
            status='PENDING'
        )

        return Response(ShiftSwapSerializer(swap).data, status=status.HTTP_201_CREATED)


class ShiftBonusListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        bonuses = ShiftBonus.objects.filter(rider=request.user).order_by('-created_at')
        return Response(ShiftBonusSerializer(bonuses, many=True).data)

    def post(self, request):
        bonus_id = request.data.get('bonus_id')
        bonus = ShiftBonus.objects.filter(id=bonus_id, rider=request.user, is_claimed=False).first()
        if not bonus:
            return Response({'error': 'Bonus not found or already claimed'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            bonus.is_claimed = True
            bonus.save()
            wallet, _ = Wallet.objects.get_or_create(user=request.user)
            wallet.balance += bonus.bonus_amount
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='CREDIT',
                amount=bonus.bonus_amount,
                description=f"Streak Bonus Claim: {bonus.reason}"
            )

        return Response({
            'success': True,
            'claimed_amount': float(bonus.bonus_amount),
            'wallet_balance': float(wallet.balance),
            'message': f"Claimed ₹{bonus.bonus_amount} streak bonus successfully!"
        })
