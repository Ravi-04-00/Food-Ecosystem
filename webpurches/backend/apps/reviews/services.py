from decimal import Decimal
from django.db import models, transaction
from apps.products.models import FoodItem, Restaurant
from apps.delivery.models import DeliveryPartner
from apps.accounts.models import User
from apps.orders.models import Order
from .models import Review

def mask_reviewer_name(name_or_user):
    if not name_or_user:
        return "Customer"
    if hasattr(name_or_user, 'get_full_name'):
        name = name_or_user.get_full_name() or name_or_user.username or "Customer"
    else:
        name = str(name_or_user)
    
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    elif len(name) > 3:
        return f"{name[:3]}***"
    return name

def recalculate_target_rating(target_type, target_id):
    """
    Recalculates average ratings and counts based strictly on approved, non-hidden reviews.
    """
    if not target_id:
        return

    if target_type == 'FOOD_ITEM':
        qs = Review.objects.filter(product_id=target_id, moderation_status='APPROVED')
        if qs.exists():
            agg = qs.aggregate(avg=models.Avg('rating'), count=models.Count('id'))
            new_avg = round(Decimal(str(agg['avg'] or 5.0)), 2)
            new_count = agg['count']
        else:
            new_avg = Decimal('4.9')
            new_count = 0
        FoodItem.objects.filter(id=target_id).update(rating=new_avg, review_count=new_count)

    elif target_type == 'RESTAURANT':
        qs = Review.objects.filter(restaurant_id=target_id, moderation_status='APPROVED')
        if qs.exists():
            agg = qs.aggregate(avg=models.Avg('rating'), count=models.Count('id'))
            new_avg = round(Decimal(str(agg['avg'] or 4.8)), 2)
            new_count = agg['count']
        else:
            new_avg = Decimal('4.8')
            new_count = 0
        Restaurant.objects.filter(id=target_id).update(rating=new_avg, review_count=new_count)

    elif target_type == 'DELIVERY_PARTNER':
        qs = Review.objects.filter(delivery_partner_id=target_id, moderation_status='APPROVED')
        if qs.exists():
            agg = qs.aggregate(avg=models.Avg('rating'))
            new_avg = round(Decimal(str(agg['avg'] or 5.0)), 2)
        else:
            new_avg = Decimal('4.95')
        DeliveryPartner.objects.filter(user_id=target_id).update(rating=new_avg)
        User.objects.filter(id=target_id).update(rating=new_avg)

def check_review_eligibility(user, order_identifier):
    """
    Validates completed-order eligibility policy for authenticated customer.
    Returns eligibility flag, reasons, and reviewable targets (restaurant, rider, purchased items).
    """
    try:
        if str(order_identifier).isdigit():
            order = Order.objects.prefetch_related('items__food_item').select_related('restaurant', 'rider').get(id=int(order_identifier))
        else:
            order = Order.objects.prefetch_related('items__food_item').select_related('restaurant', 'rider').get(order_number=str(order_identifier))
    except Order.DoesNotExist:
        return {
            'is_eligible': False,
            'reason': 'Order not found.',
            'order': None
        }

    # Ownership enforcement
    if order.customer_id != user.id:
        return {
            'is_eligible': False,
            'reason': 'You can only review orders that you placed.',
            'order': None
        }

    # Completed order policy: must be DELIVERED
    if order.status != 'DELIVERED':
        return {
            'is_eligible': False,
            'reason': f'Order #{order.order_number} is currently in {order.status} state. Reviews are only permitted once food is successfully delivered.',
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status
            }
        }

    # Fetch existing reviews submitted by this customer for this order
    existing_reviews = Review.objects.filter(order=order, user=user)
    existing_map = {}
    for r in existing_reviews:
        if r.target_type == 'FOOD_ITEM' and r.product_id:
            existing_map[f"FOOD_ITEM_{r.product_id}"] = {
                'id': r.id,
                'rating': r.rating,
                'food_quality_rating': r.food_quality_rating,
                'comment': r.comment,
                'moderation_status': r.moderation_status
            }
        elif r.target_type == 'RESTAURANT':
            existing_map["RESTAURANT"] = {
                'id': r.id,
                'rating': r.rating,
                'packaging_rating': r.packaging_rating,
                'comment': r.comment,
                'moderation_status': r.moderation_status
            }
        elif r.target_type == 'DELIVERY_PARTNER':
            existing_map["DELIVERY_PARTNER"] = {
                'id': r.id,
                'rating': r.rating,
                'delivery_rating': r.delivery_rating,
                'comment': r.comment,
                'moderation_status': r.moderation_status
            }

    # Purchased items check
    items_payload = []
    for item in order.items.all():
        f_id = item.food_item_id
        f_name = item.food_name_snapshot or (item.food_item.name if item.food_item else 'Purchased Item')
        existing = existing_map.get(f"FOOD_ITEM_{f_id}")
        items_payload.append({
            'food_item_id': f_id,
            'food_name': f_name,
            'quantity': item.quantity,
            'already_reviewed': existing is not None,
            'review': existing
        })

    # Restaurant target
    rest_data = None
    if order.restaurant:
        existing_rest = existing_map.get("RESTAURANT")
        rest_data = {
            'restaurant_id': order.restaurant.id,
            'name': order.restaurant.name,
            'already_reviewed': existing_rest is not None,
            'review': existing_rest
        }

    # Delivery partner target
    rider_data = None
    if order.rider:
        existing_rider = existing_map.get("DELIVERY_PARTNER")
        rider_data = {
            'rider_id': order.rider.id,
            'name': order.rider.get_full_name() or order.rider.username,
            'already_reviewed': existing_rider is not None,
            'review': existing_rider
        }

    return {
        'is_eligible': True,
        'reason': None,
        'order': {
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'created_at': order.created_at,
            'restaurant': rest_data,
            'delivery_partner': rider_data,
            'items': items_payload
        }
    }
