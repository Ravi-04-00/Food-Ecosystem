from decimal import Decimal
import math
from django.db import transaction, models
from django.db.models import F
from django.utils import timezone
from apps.accounts.models import LoyaltyProfile, AuditLog
from apps.orders.models import Order
from .models import Coupon, CouponRedemption, LoyaltyProgramConfig, LoyaltyLedgerEntry


def calculate_coupon_discount(coupon, subtotal, user=None, restaurant_id=None):
    """
    Authoritative server-side discount calculation and eligibility validation.
    Returns:
        {
            'is_eligible': bool,
            'discount': Decimal,
            'code': str,
            'error_message': str or None,
            'reason': str or None
        }
    """
    subtotal = Decimal(str(subtotal or '0.00'))
    now = timezone.now()

    # 1. Active status
    if not coupon.is_active:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'code': coupon.code,
            'error_message': f"Coupon '{coupon.code}' is currently inactive or retired.",
            'reason': 'INACTIVE'
        }

    # 2. Time validity
    if coupon.start_date and now < coupon.start_date:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'code': coupon.code,
            'error_message': f"Coupon '{coupon.code}' is not active yet.",
            'reason': 'NOT_STARTED'
        }

    if coupon.expiry_date and now > coupon.expiry_date:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'code': coupon.code,
            'error_message': f"Coupon '{coupon.code}' expired on {coupon.expiry_date.strftime('%d %b %Y')}.",
            'reason': 'EXPIRED'
        }

    # 3. Global usage limit
    if coupon.max_uses is not None and coupon.current_uses >= coupon.max_uses:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'code': coupon.code,
            'error_message': f"Coupon '{coupon.code}' has reached its global redemption limit.",
            'reason': 'EXHAUSTED'
        }

    # 4. Minimum order subtotal
    if subtotal < coupon.min_order_value:
        needed = coupon.min_order_value - subtotal
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'code': coupon.code,
            'error_message': f"Add ₹{needed:.2f} more to your cart to use code '{coupon.code}' (Min: ₹{coupon.min_order_value:.2f}).",
            'reason': 'MIN_ORDER_UNMET'
        }

    # 5. User-specific checks
    if user and user.is_authenticated:
        # Per-user usage limit
        user_uses = CouponRedemption.objects.filter(
            coupon=coupon,
            user=user,
            status='COMMITTED'
        ).count()
        if user_uses >= coupon.max_uses_per_user:
            return {
                'is_eligible': False,
                'discount': Decimal('0.00'),
                'code': coupon.code,
                'error_message': f"You have already redeemed coupon '{coupon.code}' the maximum allowed number of times ({coupon.max_uses_per_user}).",
                'reason': 'USER_LIMIT_EXCEEDED'
            }

        # First-order only check
        if coupon.first_order_only:
            has_prior_orders = Order.objects.filter(
                customer=user,
                status__in=[
                    'PLACED', 'CONFIRMED', 'ACCEPTED', 'PREPARING', 
                    'READY_FOR_PICKUP', 'READY', 'PICKED_UP', 'ON_THE_WAY', 
                    'OUT_FOR_DELIVERY', 'ARRIVING', 'DELIVERED', 'COMPLETED'
                ]
            ).exclude(status='CANCELLED').exists()
            if has_prior_orders:
                return {
                    'is_eligible': False,
                    'discount': Decimal('0.00'),
                    'code': coupon.code,
                    'error_message': f"Coupon '{coupon.code}' is valid exclusively for new customers placing their first order.",
                    'reason': 'NOT_FIRST_ORDER'
                }

    # 6. Restaurant targeting check
    if coupon.applicable_restaurants.exists() and restaurant_id:
        try:
            r_id = int(restaurant_id)
            if not coupon.applicable_restaurants.filter(id=r_id).exists():
                return {
                    'is_eligible': False,
                    'discount': Decimal('0.00'),
                    'code': coupon.code,
                    'error_message': f"Coupon '{coupon.code}' is not valid for this specific restaurant.",
                    'reason': 'RESTAURANT_INELIGIBLE'
                }
        except (ValueError, TypeError):
            pass

    # 7. Authoritative discount computation
    if coupon.discount_type == 'PERCENTAGE':
        calculated = (subtotal * Decimal(str(coupon.discount_percentage))) / Decimal('100.00')
        discount = min(calculated, coupon.max_discount_amount)
    else:  # FLAT
        discount = min(coupon.discount_amount, subtotal)

    # Ensure precision to 2 decimal places and not negative
    discount = max(Decimal('0.00'), round(discount, 2))

    return {
        'is_eligible': True,
        'discount': discount,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'error_message': None,
        'reason': None
    }


def calculate_loyalty_redemption(points_to_redeem, subtotal, user):
    """
    Validates loyalty points redemption against platform configuration and user's balance.
    Returns:
        {
            'is_eligible': bool,
            'discount': Decimal,
            'points_used': int,
            'available_points': int,
            'error_message': str or None
        }
    """
    config = LoyaltyProgramConfig.get_solo()
    subtotal = Decimal(str(subtotal or '0.00'))

    if not config.is_active:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'points_used': 0,
            'available_points': 0,
            'error_message': 'Loyalty rewards program is temporarily paused.'
        }

    if not user or not user.is_authenticated:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'points_used': 0,
            'available_points': 0,
            'error_message': 'Sign in to redeem loyalty points.'
        }

    profile, _ = LoyaltyProfile.objects.get_or_create(user=user)
    available_points = profile.points

    try:
        points_to_redeem = int(points_to_redeem or 0)
    except (ValueError, TypeError):
        points_to_redeem = 0

    if points_to_redeem <= 0:
        return {
            'is_eligible': True,
            'discount': Decimal('0.00'),
            'points_used': 0,
            'available_points': available_points,
            'error_message': None
        }

    # Minimum threshold
    if points_to_redeem < config.min_points_to_redeem:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'points_used': 0,
            'available_points': available_points,
            'error_message': f"A minimum of {config.min_points_to_redeem} points is required for redemption."
        }

    # Sufficient balance
    if points_to_redeem > available_points:
        return {
            'is_eligible': False,
            'discount': Decimal('0.00'),
            'points_used': 0,
            'available_points': available_points,
            'error_message': f"Insufficient balance: You have {available_points} points available."
        }

    # Subtotal maximum cap (e.g., maximum 50% of meal subtotal)
    max_discount_allowed = (subtotal * Decimal(str(config.max_discount_percentage_of_subtotal))) / Decimal('100.00')
    nominal_discount = round(Decimal(str(points_to_redeem)) * config.points_to_inr_rate, 2)

    if nominal_discount > max_discount_allowed:
        # Cap points to allowed maximum
        max_points_allowed = int(max_discount_allowed / config.points_to_inr_rate)
        if max_points_allowed < config.min_points_to_redeem:
            return {
                'is_eligible': False,
                'discount': Decimal('0.00'),
                'points_used': 0,
                'available_points': available_points,
                'error_message': f"Subtotal is too low to redeem minimum {config.min_points_to_redeem} points under policy."
            }
        points_to_redeem = max_points_allowed
        nominal_discount = round(Decimal(str(points_to_redeem)) * config.points_to_inr_rate, 2)

    return {
        'is_eligible': True,
        'discount': nominal_discount,
        'points_used': points_to_redeem,
        'available_points': available_points,
        'conversion_rate': config.points_to_inr_rate,
        'error_message': None
    }


def calculate_authoritative_order_totals(
    subtotal,
    delivery_fee=Decimal('30.00'),
    packaging_fee=Decimal('15.00'),
    coupon_code=None,
    points_to_redeem=0,
    user=None,
    restaurant_id=None
):
    """
    Authoritative server-side order calculation engine.
    Computes exact subtotal, fees, coupon discount, loyalty points discount, and grand total.
    """
    subtotal = Decimal(str(subtotal or '0.00'))
    delivery_fee = Decimal(str(delivery_fee or '0.00'))
    packaging_fee = Decimal(str(packaging_fee or '0.00'))
    taxes = Decimal('0.00')

    coupon_discount = Decimal('0.00')
    coupon_obj = None
    coupon_info = None

    if coupon_code:
        clean_code = str(coupon_code).strip().upper()
        coupon_obj = Coupon.objects.filter(code=clean_code).first()
        if coupon_obj:
            val_res = calculate_coupon_discount(coupon_obj, subtotal, user, restaurant_id)
            if val_res['is_eligible']:
                coupon_discount = val_res['discount']
                coupon_info = {
                    'code': coupon_obj.code,
                    'title': coupon_obj.title,
                    'discount': coupon_discount,
                    'discount_type': coupon_obj.discount_type
                }
            else:
                coupon_info = {
                    'code': clean_code,
                    'error': val_res['error_message'],
                    'discount': Decimal('0.00')
                }
        else:
            coupon_info = {
                'code': clean_code,
                'error': f"Coupon code '{clean_code}' is invalid.",
                'discount': Decimal('0.00')
            }

    # Loyalty points calculation
    loyalty_discount = Decimal('0.00')
    loyalty_info = None
    if points_to_redeem and user and user.is_authenticated:
        # Check combinability if coupon applied
        if coupon_obj and not coupon_obj.is_combinable:
            loyalty_info = {
                'points_used': 0,
                'discount': Decimal('0.00'),
                'error': f"Coupon '{coupon_obj.code}' cannot be combined with loyalty points redemption."
            }
        else:
            loyalty_res = calculate_loyalty_redemption(points_to_redeem, subtotal, user)
            if loyalty_res['is_eligible']:
                loyalty_discount = loyalty_res['discount']
                loyalty_info = {
                    'points_used': loyalty_res['points_used'],
                    'discount': loyalty_discount,
                    'available_points': loyalty_res['available_points']
                }
            else:
                loyalty_info = {
                    'points_used': 0,
                    'discount': Decimal('0.00'),
                    'error': loyalty_res['error_message']
                }

    # Final grand total: subtotal + fees + taxes - coupon_discount - loyalty_discount
    gross_total = subtotal + delivery_fee + packaging_fee + taxes
    total_discount = coupon_discount + loyalty_discount
    grand_total = max(Decimal('0.00'), round(gross_total - total_discount, 2))

    # Calculate expected loyalty points that will be earned once delivered
    config = LoyaltyProgramConfig.get_solo()
    if config.is_active and config.earn_per_amount > 0:
        expected_points_earned = int((subtotal / config.earn_per_amount) * config.points_earn_rate)
    else:
        expected_points_earned = 0

    return {
        'subtotal': round(subtotal, 2),
        'delivery_fee': round(delivery_fee, 2),
        'packaging_fee': round(packaging_fee, 2),
        'taxes': round(taxes, 2),
        'coupon_discount': round(coupon_discount, 2),
        'loyalty_discount': round(loyalty_discount, 2),
        'total_discount': round(total_discount, 2),
        'grand_total': round(grand_total, 2),
        'total': round(grand_total, 2),
        'coupon_info': coupon_info,
        'loyalty_info': loyalty_info,
        'expected_points_earned': expected_points_earned
    }


def commit_coupon_and_loyalty_redemption(order, coupon, coupon_discount, points_used, loyalty_discount, user):
    """
    Safely commits coupon redemption and loyalty point deductions inside an atomic transaction
    with row-level locking to prevent race conditions during concurrent checkouts.
    """
    with transaction.atomic():
        # 1. Commit Coupon
        if coupon and coupon_discount > 0:
            locked_coupon = Coupon.objects.select_for_update().get(id=coupon.id)
            if locked_coupon.max_uses is not None and locked_coupon.current_uses >= locked_coupon.max_uses:
                raise ValueError(f"Coupon '{locked_coupon.code}' was just exhausted by another checkout.")

            CouponRedemption.objects.create(
                coupon=locked_coupon,
                user=user,
                order=order,
                discount_amount=coupon_discount,
                status='COMMITTED'
            )
            Coupon.objects.filter(id=locked_coupon.id).update(current_uses=F('current_uses') + 1)

        # 2. Commit Loyalty Points
        if points_used > 0 and loyalty_discount > 0:
            locked_profile = LoyaltyProfile.objects.select_for_update().get(user=user)
            if locked_profile.points < points_used:
                raise ValueError(f"Insufficient loyalty points balance ({locked_profile.points} available).")

            new_balance = locked_profile.points - points_used
            locked_profile.points = new_balance
            locked_profile.total_saved = F('total_saved') + loyalty_discount
            locked_profile.save(update_fields=['points', 'total_saved'])

            LoyaltyLedgerEntry.objects.create(
                user=user,
                order=order,
                transaction_type='REDEEM',
                points=-points_used,
                balance_after=new_balance,
                reference_amount=loyalty_discount,
                description=f"Redeemed {points_used} points on Order #{order.order_number}",
                idempotency_key=f"redeem_order_{order.id}"
            )


def award_order_loyalty_points(order):
    """
    Idempotently awards loyalty points to the customer when an order is DELIVERED and settled.
    """
    if not order or not order.customer:
        return 0

    idempotency_key = f"award_order_{order.id}"
    if LoyaltyLedgerEntry.objects.filter(idempotency_key=idempotency_key).exists():
        return 0

    config = LoyaltyProgramConfig.get_solo()
    if not config.is_active or config.earn_per_amount <= 0:
        return 0

    points_to_award = int((order.subtotal / config.earn_per_amount) * config.points_earn_rate)
    if points_to_award <= 0:
        return 0

    with transaction.atomic():
        profile, _ = LoyaltyProfile.objects.select_for_update().get_or_create(user=order.customer)
        new_balance = profile.points + points_to_award
        profile.points = new_balance
        profile.lifetime_orders = F('lifetime_orders') + 1

        # Re-evaluate VIP Tier
        if new_balance >= 2000:
            profile.tier = 'PLATINUM'
        elif new_balance >= 1000:
            profile.tier = 'GOLD'
        elif new_balance >= 500:
            profile.tier = 'SILVER'
        else:
            profile.tier = 'BRONZE'

        profile.save(update_fields=['points', 'lifetime_orders', 'tier'])

        LoyaltyLedgerEntry.objects.create(
            user=order.customer,
            order=order,
            transaction_type='AWARD',
            points=points_to_award,
            balance_after=new_balance,
            reference_amount=order.subtotal,
            description=f"Earned {points_to_award} points on Order #{order.order_number}",
            idempotency_key=idempotency_key
        )

    return points_to_award


def reverse_order_rewards_and_coupon(order, reason="Order cancelled"):
    """
    Reverses committed coupon redemptions and restores/reverses loyalty points
    when an order is cancelled or refunded under the platform policy.
    """
    if not order:
        return

    with transaction.atomic():
        # 1. Reverse Coupon Usage
        redemption = CouponRedemption.objects.select_for_update().filter(
            order=order,
            status='COMMITTED'
        ).first()
        if redemption:
            redemption.status = 'REVERSED'
            redemption.save(update_fields=['status'])
            Coupon.objects.filter(id=redemption.coupon_id).update(
                current_uses=models.Case(
                    models.When(current_uses__gt=0, then=F('current_uses') - 1),
                    default=0
                )
            )

        # 2. Restore Redeemed Points
        redeem_key = f"reversal_redeem_order_{order.id}"
        redeem_entry = LoyaltyLedgerEntry.objects.filter(
            order=order,
            transaction_type='REDEEM'
        ).first()
        if redeem_entry and not LoyaltyLedgerEntry.objects.filter(idempotency_key=redeem_key).exists():
            points_to_restore = abs(redeem_entry.points)
            profile, _ = LoyaltyProfile.objects.select_for_update().get_or_create(user=order.customer)
            new_balance = profile.points + points_to_restore
            profile.points = new_balance
            profile.save(update_fields=['points'])

            LoyaltyLedgerEntry.objects.create(
                user=order.customer,
                order=order,
                transaction_type='REVERSAL',
                points=points_to_restore,
                balance_after=new_balance,
                reference_amount=redeem_entry.reference_amount,
                description=f"Restored {points_to_restore} points from cancelled Order #{order.order_number} ({reason})",
                idempotency_key=redeem_key
            )

        # 3. Reverse Awarded Points (if order was previously delivered and awarded)
        award_key = f"reversal_award_order_{order.id}"
        award_entry = LoyaltyLedgerEntry.objects.filter(
            order=order,
            transaction_type='AWARD'
        ).first()
        if award_entry and not LoyaltyLedgerEntry.objects.filter(idempotency_key=award_key).exists():
            points_to_clawback = award_entry.points
            profile, _ = LoyaltyProfile.objects.select_for_update().get_or_create(user=order.customer)
            new_balance = max(0, profile.points - points_to_clawback)
            profile.points = new_balance
            profile.save(update_fields=['points'])

            LoyaltyLedgerEntry.objects.create(
                user=order.customer,
                order=order,
                transaction_type='REVERSAL',
                points=-points_to_clawback,
                balance_after=new_balance,
                reference_amount=award_entry.reference_amount,
                description=f"Reversed {points_to_clawback} awarded points for cancelled Order #{order.order_number}",
                idempotency_key=award_key
            )
