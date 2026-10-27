"""
Scheduled-order APIs (Phase 12 P2). Immediate ordering untouched.
"""
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.menu.views import get_user_restaurant
from apps.orders.models import DeliverySlot, ScheduledOrder
from apps.orders.scheduling import (
    create_scheduled_order,
    cancel_scheduled_order,
    release_due_scheduled_orders,
)


def _slot_dict(s):
    return {
        'id': s.id,
        'restaurant_id': s.restaurant_id,
        'slot_start': s.slot_start.isoformat(),
        'slot_end': s.slot_end.isoformat(),
        'capacity': s.capacity,
        'booked_count': s.booked_count,
        'spots_left': max(0, s.capacity - s.booked_count),
        'cutoff_minutes': s.cutoff_minutes,
        'is_active': s.is_active,
        'bookable': s.is_bookable(),
    }


def _scheduled_dict(s):
    return {
        'id': s.id,
        'restaurant_id': s.restaurant_id,
        'slot_id': s.slot_id,
        'slot_start': s.slot.slot_start.isoformat() if getattr(s, 'slot', None) else None,
        'status': s.status,
        'items': (s.items_snapshot or {}).get('items', []),
        'item_total': str(s.item_total),
        'grand_total': str(s.grand_total),
        'payment_method': s.payment_method,
        'address': s.address_snapshot,
        'released_order_id': s.released_order_id,
        'released_order_number': s.released_order.order_number if s.released_order else None,
        'cancel_reason': s.cancel_reason,
        'created_at': s.created_at.isoformat() if s.created_at else None,
    }


class DeliverySlotListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = DeliverySlot.objects.select_related('restaurant').filter(is_active=True)
        rid = request.query_params.get('restaurant_id')
        if rid:
            qs = qs.filter(restaurant_id=rid)
        qs = qs.filter(slot_start__gt=timezone.now()).order_by('slot_start')[:100]
        return Response({'slots': [_slot_dict(s) for s in qs]})


class DeliverySlotCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant and not request.user.is_staff:
            return Response({'error': 'You must own a restaurant to create slots.'},
                            status=status.HTTP_403_FORBIDDEN)
        try:
            from django.utils.dateparse import parse_datetime
            start = parse_datetime(request.data.get('slot_start', ''))
            end = parse_datetime(request.data.get('slot_end', ''))
            capacity = int(request.data.get('capacity', 10))
            cutoff = int(request.data.get('cutoff_minutes', 60))
        except (TypeError, ValueError):
            return Response({'error': 'slot_start/slot_end (ISO) and integers required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not start or not end:
            return Response({'error': 'Valid slot_start and slot_end are required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if timezone.is_naive(start):
            start = timezone.make_aware(start)
        if timezone.is_naive(end):
            end = timezone.make_aware(end)
        try:
            slot = DeliverySlot(
                restaurant=restaurant, slot_start=start, slot_end=end,
                capacity=max(1, capacity), cutoff_minutes=max(0, cutoff))
            slot.full_clean()
            slot.save()
        except Exception as exc:
            return Response({'error': str(exc)[:300]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_slot_dict(slot), status=status.HTTP_201_CREATED)


class ScheduledOrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ScheduledOrder.objects.select_related('slot', 'restaurant').filter(
            user=request.user).order_by('-created_at')[:100]
        return Response({'scheduled_orders': [_scheduled_dict(s) for s in qs]})

    def post(self, request):
        scheduled, error = create_scheduled_order(
            user=request.user,
            restaurant_id=request.data.get('restaurant_id'),
            slot_id=request.data.get('slot_id'),
            items=request.data.get('items', []),
            address_id=request.data.get('address_id'),
            coupon_code=request.data.get('coupon_code'),
            points_to_redeem=request.data.get('points_to_redeem', 0),
            payment_method=request.data.get('payment_method', 'UPI'),
            idempotency_key=request.data.get('idempotency_key', ''),
        )
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        scheduled.slot = scheduled.slot if hasattr(scheduled, 'slot') else None
        return Response(_scheduled_dict(
            ScheduledOrder.objects.select_related('slot').get(id=scheduled.id)),
            status=status.HTTP_201_CREATED)


class ScheduledOrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        sch, error, code = cancel_scheduled_order(
            request.user, pk, reason=request.data.get('reason', ''))
        if error:
            return Response({'error': error}, status=code)
        return Response(_scheduled_dict(
            ScheduledOrder.objects.select_related('slot').get(id=sch.id)))


class ScheduledOrderReleaseView(APIView):
    """Staff-only manual trigger (cron normally calls the management command)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        return Response(release_due_scheduled_orders())
