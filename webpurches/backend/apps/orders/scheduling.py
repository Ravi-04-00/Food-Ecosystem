"""
Scheduled orders (Phase 12 P2): future-slot intents released as real Orders.

Principles (approved):
- UTC storage, IST display (delivery_slots store aware datetimes).
- Per-restaurant slots, capacity + cutoff enforced in BACKEND under lock.
- NO inventory reservation at schedule time; hours/stock/coupon re-validated
  at release. Payment stays PENDING; released Orders follow normal flow.
- Immediate ordering untouched.
"""
import uuid
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.orders.models import DeliverySlot, ScheduledOrder, Order, OrderItem
from apps.products.models import FoodItem, Restaurant


def get_slot(slot_id):
    try:
        return DeliverySlot.objects.select_related('restaurant').filter(id=int(slot_id)).first()
    except (TypeError, ValueError):
        return None


def create_scheduled_order(user, restaurant_id, slot_id, items, address_id=None,
                           coupon_code=None, points_to_redeem=0,
                           payment_method='UPI', idempotency_key=None):
    """Validates + books a slot atomically. Returns (scheduled, error_response)."""
    from apps.accounts.models import Address
    try:
        restaurant = Restaurant.objects.filter(id=int(restaurant_id)).first()
    except (TypeError, ValueError):
        restaurant = None
    if not restaurant:
        return None, 'Restaurant not found.'
    if getattr(restaurant, 'verification_status', '') != 'APPROVED':
        return None, 'Restaurant is not accepting scheduled orders.'
    if not items:
        return None, 'Select at least one item.'

    address = None
    if address_id:
        address = Address.objects.filter(id=address_id, user=user).first()
        if not address:
            return None, 'Address does not belong to your account.'
    else:
        address = (Address.objects.filter(user=user, is_default=True).first()
                   or Address.objects.filter(user=user).first())
    if not address:
        return None, 'A delivery address is required.'

    prepared = []
    subtotal = Decimal('0.00')
    for line in items:
        try:
            food = FoodItem.objects.filter(id=int(line.get('food_item_id'))).first()
        except (TypeError, ValueError, AttributeError):
            food = None
        if not food or food.restaurant_id != restaurant.id:
            return None, 'An item is not available at this restaurant.'
        qty = int(line.get('quantity', 0) or 0)
        if qty <= 0:
            return None, 'Invalid quantity.'
        unit = Decimal(str(food.price))
        prepared.append({'food_item_id': food.id, 'quantity': qty,
                         'unit_price': str(unit)})
        subtotal += unit * qty

    key = (idempotency_key or '').strip() or 'SCH-%s' % uuid.uuid4().hex[:16].upper()
    existing = ScheduledOrder.objects.filter(idempotency_key=key).first()
    if existing:
        return existing, None

    with transaction.atomic():
        slot = DeliverySlot.objects.select_for_update().filter(id=slot_id).first()
        if not slot or slot.restaurant_id != restaurant.id:
            return None, 'Delivery slot not found for this restaurant.'
        if not slot.is_bookable():
            return None, 'This slot is full, expired, or past its booking cutoff.'
        DeliverySlot.objects.filter(id=slot.id).update(booked_count=F('booked_count') + 1)
        delivery_fee = Decimal('30.00')
        scheduled = ScheduledOrder.objects.create(
            user=user, restaurant=restaurant, slot=slot, status='CONFIRMED',
            items_snapshot={
                'items': prepared,
                'coupon_code': (coupon_code or '').strip().upper() or None,
                'points_to_redeem': int(points_to_redeem or 0),
            },
            item_total=subtotal, delivery_fee=delivery_fee,
            grand_total=subtotal + delivery_fee,
            payment_method=payment_method or 'UPI',
            address_snapshot={
                'id': address.id, 'label': getattr(address, 'label', 'Home'),
                'full_name': getattr(address, 'full_name', user.username),
                'street': getattr(address, 'street', ''),
                'city': getattr(address, 'city', ''),
                'state': getattr(address, 'state', ''),
                'pincode': getattr(address, 'pincode', ''),
                'phone': getattr(address, 'phone', ''),
            },
            idempotency_key=key,
        )
        return scheduled, None


def cancel_scheduled_order(user, scheduled_id, reason=''):
    """Free cancellation until slot start; afterwards support-only."""
    with transaction.atomic():
        sch = ScheduledOrder.objects.select_for_update().filter(
            id=scheduled_id, user=user).first()
        if not sch:
            return None, 'Scheduled order not found.', 404
        if sch.status != 'CONFIRMED':
            return None, 'Only confirmed scheduled orders can be cancelled.', 400
        if timezone.now() > sch.slot.slot_start:
            return None, 'Slot has started; contact support to cancel.', 400
        sch.status = 'CANCELLED'
        sch.cancel_reason = (reason or '')[:1000]
        sch.save(update_fields=['status', 'cancel_reason', 'updated_at'])
        DeliverySlot.objects.filter(id=sch.slot_id).update(
            booked_count=F('booked_count') - 1)
        return sch, None, 200


def release_due_scheduled_orders(now=None):
    """
    Releases CONFIRMED intents whose slot has started. Re-validates
    restaurant approval/hours, stock (atomic conditional decrement), and
    coupon; failures -> EXPIRED with reason + notification.
    Returns {'released': [...], 'expired': [...]}.
    """
    from apps.coupons.services import calculate_authoritative_order_totals
    now = now or timezone.now()
    due = ScheduledOrder.objects.select_related('slot', 'restaurant', 'user').filter(
        status='CONFIRMED', slot__slot_start__lte=now).order_by('slot__slot_start', 'id')
    released, expired = [], []
    for sch in due:
        try:
            with transaction.atomic():
                slot = DeliverySlot.objects.select_for_update().get(id=sch.slot_id)
                sch_locked = ScheduledOrder.objects.select_for_update().get(id=sch.id)
                if sch_locked.status != 'CONFIRMED':
                    continue
                ok, order_or_reason = _release_one(sch_locked, slot)
                if ok:
                    released.append(order_or_reason.order_number)
                else:
                    sch_locked.status = 'EXPIRED'
                    sch_locked.cancel_reason = order_or_reason
                    sch_locked.save(update_fields=['status', 'cancel_reason', 'updated_at'])
                    expired.append({'id': sch_locked.id, 'reason': order_or_reason})
                    _notify(sch_locked.user, 'Scheduled order expired',
                            'Slot order #%d could not be released: %s' % (sch_locked.id, order_or_reason),
                            'sched_expired_%d' % sch_locked.id)
        except Exception as exc:
            expired.append({'id': sch.id, 'reason': str(exc)[:200]})
    return {'released': released, 'expired': expired}


def _release_one(sch, slot):
    from apps.coupons.services import calculate_authoritative_order_totals
    restaurant = sch.restaurant
    if getattr(restaurant, 'verification_status', '') != 'APPROVED':
        return False, 'Restaurant is no longer verified.'
    if hasattr(restaurant, 'is_currently_open'):
        ok, msg = restaurant.is_currently_open()
        if not ok:
            return False, msg
    elif not getattr(restaurant, 'is_open', True):
        return False, 'Restaurant is closed.'

    snap = sch.items_snapshot or {}
    lines = snap.get('items', [])
    if not lines:
        return False, 'No items.'
    subtotal = Decimal('0.00')
    prepared = []
    for line in lines:
        food = FoodItem.objects.filter(id=line.get('food_item_id')).first()
        if not food or food.restaurant_id != restaurant.id:
            return False, 'An item is no longer available.'
        if hasattr(food, 'is_currently_available'):
            ok, msg = food.is_currently_available()
            if not ok:
                return False, msg
        qty = int(line.get('quantity', 0))
        updated = FoodItem.objects.filter(
            id=food.id, stock__gte=qty).update(stock=F('stock') - qty)
        if not updated:
            return False, "Dish '%s' ran out of stock." % food.name
        unit = Decimal(str(food.price))
        subtotal += unit * qty
        prepared.append({'food': food, 'qty': qty, 'unit': unit})

    coupon_code = snap.get('coupon_code')
    points = snap.get('points_to_redeem', 0)
    try:
        authoritative = calculate_authoritative_order_totals(
            subtotal=subtotal, delivery_fee=Decimal('30.00'),
            packaging_fee=Decimal('15.00'), coupon_code=coupon_code,
            points_to_redeem=points, user=sch.user, restaurant_id=restaurant.id)
    except Exception as exc:
        return False, 'Pricing failed: %s' % str(exc)[:150]
    if coupon_code and (authoritative.get('coupon_info') or {}).get('error'):
        return False, 'Coupon no longer valid: %s' % authoritative['coupon_info']['error']

    date_str = timezone.now().strftime('%Y%m%d')
    order_number = 'FD-%s-%s' % (date_str, uuid.uuid4().hex[:4].upper())
    while Order.objects.filter(order_number=order_number).exists():
        order_number = 'FD-%s-%s' % (date_str, uuid.uuid4().hex[:4].upper())
    addr = sch.address_snapshot or {}
    order = Order.objects.create(
        order_number=order_number, customer=sch.user, restaurant=restaurant,
        delivery_address_text='%s, %s - %s' % (
            addr.get('street', ''), addr.get('city', ''), addr.get('pincode', '')),
        delivery_address_snapshot=addr,
        status='PLACED', payment_status='PAYMENT_PENDING',
        payment_method=sch.payment_method,
        subtotal=subtotal, item_total=subtotal,
        delivery_fee=Decimal('30.00'), packaging_fee=Decimal('15.00'),
        platform_fee=Decimal('15.00'),
        taxes=authoritative.get('taxes', Decimal('0.00')),
        discount=authoritative.get('coupon_discount', Decimal('0.00')),
        loyalty_points_used=(authoritative.get('loyalty_info') or {}).get('points_used', 0) if authoritative.get('loyalty_info') else 0,
        loyalty_discount=authoritative.get('loyalty_discount', Decimal('0.00')),
        coupon_code_snapshot=(coupon_code or ''),
        grand_total=authoritative.get('grand_total', subtotal + Decimal('45.00')),
    )
    for p in prepared:
        OrderItem.objects.create(
            order=order, food_item=p['food'], food_name_snapshot=p['food'].name,
            unit_price_snapshot=p['unit'], quantity=p['qty'],
            price=p['unit'], item_total=p['unit'] * p['qty'])
    sch.status = 'RELEASED'
    sch.released_order = order
    sch.save(update_fields=['status', 'released_order', 'updated_at'])
    _notify(sch.user, 'Scheduled order fired',
            'Your scheduled order is now %s.' % order_number,
            'sched_released_%d' % sch.id)
    try:
        from apps.orders.realtime import broadcast_order_transition
        broadcast_order_transition(order)
    except Exception:
        pass
    return True, order


def _notify(user, title, message, key):
    try:
        from apps.notifications.dispatcher import safe_dispatch_on_commit
        safe_dispatch_on_commit(user, 'system.alert',
                                {'title': title, 'message': message},
                                idempotency_key=key)
    except Exception:
        pass
