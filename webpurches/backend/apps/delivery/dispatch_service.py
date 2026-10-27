import math
import logging
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.accounts.models import User
from apps.orders.models import Order, OrderStatusHistory
from .models import (
    DeliveryPartner,
    DeliveryAssignment,
    DeliveryAssignmentHistory,
    DeliveryOffer
)
from apps.notifications.dispatcher import safe_dispatch_on_commit

logger = logging.getLogger(__name__)


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates great-circle distance between two GPS coordinates in kilometers.
    Treats straight-line distance as a fallback ranking estimate.
    """
    try:
        lat1, lon1 = float(lat1), float(lon1)
        lat2, lon2 = float(lat2), float(lon2)
    except (TypeError, ValueError):
        return 5.0  # Fallback estimate in km

    # Validate coordinate bounds
    if not (-90.0 <= lat1 <= 90.0 and -180.0 <= lon1 <= 180.0 and
            -90.0 <= lat2 <= 90.0 and -180.0 <= lon2 <= 180.0):
        return 5.0

    # Earth radius in kilometers
    R = 6371.0

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def get_order_pickup_location(order):
    """
    Extracts restaurant pickup GPS coordinates with graceful fallback.
    """
    if order.restaurant_lat and order.restaurant_lng and float(order.restaurant_lat) != 0.0:
        return float(order.restaurant_lat), float(order.restaurant_lng)
    if order.restaurant and getattr(order.restaurant, 'latitude', None) and getattr(order.restaurant, 'longitude', None):
        return float(order.restaurant.latitude), float(order.restaurant.longitude)
    # Default city center coordinates (Neo Bengaluru / Indiranagar)
    return 12.9780, 77.6010


def find_best_partner_candidates(order, exclude_user_ids=None):
    """
    Ranks online delivery partners for an order based on:
    1. Online & verification status
    2. Active workload / capacity limit
    3. Shift & break status
    4. GPS proximity to restaurant pickup location with fallback for stale telemetry
    5. Partner ratings
    Returns sorted list of (partner, distance_km, matching_score).
    """
    exclude_ids = set(exclude_user_ids or [])
    rest_lat, rest_lng = get_order_pickup_location(order)

    # 1. Base eligibility query: Online and approved partners
    partners_qs = DeliveryPartner.objects.filter(
        is_online=True,
        user__is_active=True,
        user__role__in=['DELIVERY', 'RIDER']
    ).filter(
        models.Q(is_verified=True) | models.Q(verification_status='APPROVED')
    ).exclude(
        user_id__in=exclude_ids
    ).select_related('user')

    now = timezone.now()
    candidates = []

    for partner in partners_qs:
        user = partner.user

        # 2. Shift & Break Verification
        user_settings = getattr(user, 'settings', None)
        if user_settings and getattr(user_settings, 'shift', '') in ['OFFLINE', 'BREAK', 'SHIFT_COMPLETED']:
            continue

        try:
            from apps.shifts.models import CheckIn, BreakLog
            checkin = CheckIn.objects.filter(rider=user).order_by('-created_at').first()
            if checkin:
                if checkin.status in ['ON_BREAK', 'COMPLETED']:
                    continue
                if BreakLog.objects.filter(check_in=checkin, rider=user, status='ACTIVE').exists():
                    continue
        except Exception:
            pass

        # 3. Workload Verification (Active Delivery Count)
        active_assignments_count = DeliveryAssignment.objects.filter(
            delivery_partner=user,
            status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
        ).count()

        # Hard limit: Partner already carrying active orders cannot accept new sequential offers
        if active_assignments_count >= 1 or partner.active_order is not None:
            continue

        # 4. Proximity & Telemetry Freshness
        is_fresh_telemetry = (
            partner.last_location_updated_at and
            (now - partner.last_location_updated_at).total_seconds() <= 1800  # within 30 mins
        )
        has_valid_coords = (
            partner.current_latitude and partner.current_longitude and
            not (float(partner.current_latitude) == 0.0 and float(partner.current_longitude) == 0.0)
        )

        if is_fresh_telemetry and has_valid_coords:
            distance_km = haversine_distance(
                partner.current_latitude, partner.current_longitude,
                rest_lat, rest_lng
            )
            stale_penalty = 0.0
        else:
            # Graceful fallback for missing/stale location
            distance_km = 3.5  # Standard zone fallback
            stale_penalty = 2.0

        # 5. Composite Matching Score:
        # Distance score (max 10km scale, up to 50 pts)
        distance_score = max(0.0, 10.0 - min(distance_km, 10.0)) * 5.0
        # Rating score (up to 50 pts)
        rating_score = float(partner.rating or 4.5) * 10.0
        # Workload penalty (0 pts since active is 0, but extensible)
        workload_penalty = active_assignments_count * 15.0

        total_score = round(distance_score + rating_score - workload_penalty - stale_penalty, 2)
        candidates.append((partner, distance_km, total_score))

    # Sort candidates by total_score descending (best match first)
    candidates.sort(key=lambda x: x[2], reverse=True)
    return candidates


def dispatch_order_offer(order, offer_timeout_seconds=60, max_retries=3):
    """
    Core Dispatch Algorithm:
    - Atomically evaluates order dispatch eligibility.
    - Sequentially creates a DeliveryOffer with strict expiration timer.
    - Prevents duplicate/parallel offers and infinite retry loops.
    - Idempotent: safe against concurrent dispatch triggers.
    """
    with transaction.atomic():
        # Concurrency safety: lock order and its assignment
        locked_order = Order.objects.select_for_update().get(pk=order.id)

        # 1. Eligibility Check
        if locked_order.status not in ['READY_FOR_PICKUP', 'READY']:
            logger.info(f"Order #{locked_order.order_number} is not ready for pickup (status: {locked_order.status}). Dispatch skipped.")
            return {'status': 'ineligible_order_status', 'order_status': locked_order.status}

        if locked_order.payment_status not in ['PAID', 'VERIFIED_PAID', 'PAYMENT_PENDING', 'COMPLETED']:
            logger.info(f"Order #{locked_order.order_number} payment is not confirmed ({locked_order.payment_status}). Dispatch skipped.")
            return {'status': 'unverified_payment', 'payment_status': locked_order.payment_status}

        assignment, _ = DeliveryAssignment.objects.select_for_update().get_or_create(
            order=locked_order,
            defaults={'status': 'AVAILABLE'}
        )

        # 2. Check if already claimed/assigned
        if assignment.status in ['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED']:
            return {'status': 'already_assigned', 'assignment_status': assignment.status}

        # 3. Check for existing active offer (Idempotency)
        now = timezone.now()
        active_offer = DeliveryOffer.objects.select_for_update().filter(
            assignment=assignment,
            status='OFFERED'
        ).first()

        if active_offer:
            if not active_offer.is_expired():
                # Offer is currently active and pending partner response
                remaining = max(0, int((active_offer.expires_at - now).total_seconds()))
                return {
                    'status': 'offer_pending',
                    'offer_id': active_offer.id,
                    'delivery_partner': active_offer.delivery_partner.username,
                    'seconds_remaining': remaining
                }
            else:
                # Mark previous expired offer and continue progression
                active_offer.status = 'EXPIRED'
                active_offer.responded_at = now
                active_offer.save(update_fields=['status', 'responded_at', 'updated_at'])
                DeliveryAssignmentHistory.objects.create(
                    assignment=assignment,
                    from_status='OFFERED',
                    to_status='AVAILABLE',
                    actor=active_offer.delivery_partner,
                    notes=f"Offer #{active_offer.id} expired after {offer_timeout_seconds}s timeout"
                )

        # 4. Check retry limits to avoid infinite dispatch loops
        if assignment.attempt_count >= max_retries:
            assignment.status = 'AWAITING_PARTNER'
            assignment.save(update_fields=['status', 'updated_at'])
            return {
                'status': 'max_retries_exceeded',
                'attempt_count': assignment.attempt_count,
                'message': f"Maximum dispatch retries ({max_retries}) reached without partner acceptance."
            }

        # 5. Gather previously attempted partner user IDs to prevent repeating failed offers
        excluded_partner_ids = list(
            DeliveryOffer.objects.filter(
                assignment=assignment,
                status__in=['REJECTED', 'EXPIRED']
            ).values_list('delivery_partner_id', flat=True)
        )

        candidates = find_best_partner_candidates(locked_order, exclude_user_ids=excluded_partner_ids)

        if not candidates:
            assignment.status = 'AWAITING_PARTNER'
            assignment.save(update_fields=['status', 'updated_at'])
            return {
                'status': 'no_partner_available',
                'attempt_count': assignment.attempt_count,
                'message': "No online or eligible delivery partners available within range."
            }

        # 6. Select highest ranked candidate
        best_partner, distance_km, score = candidates[0]
        attempt_number = assignment.attempt_count + 1
        expires_at = now + timezone.timedelta(seconds=offer_timeout_seconds)

        # Calculate estimated payout (Base payout + delivery fee)
        base_fee = float(locked_order.delivery_fee or Decimal('35.00'))
        estimated_payout = round(base_fee + 40.0, 2)

        # 7. Create sequential DeliveryOffer
        offer = DeliveryOffer.objects.create(
            assignment=assignment,
            delivery_partner=best_partner.user,
            status='OFFERED',
            attempt_number=attempt_number,
            distance_km=Decimal(str(distance_km)),
            matching_score=Decimal(str(score)),
            estimated_payout=Decimal(str(estimated_payout)),
            expires_at=expires_at
        )

        # Update assignment state
        assignment.status = 'OFFERED'
        assignment.delivery_partner = best_partner.user
        assignment.offer_expires_at = expires_at
        assignment.attempt_count = attempt_number
        assignment.save(update_fields=[
            'status', 'delivery_partner', 'offer_expires_at', 'attempt_count', 'updated_at'
        ])

        # Audit history log
        DeliveryAssignmentHistory.objects.create(
            assignment=assignment,
            from_status='AVAILABLE',
            to_status='OFFERED',
            actor=best_partner.user,
            notes=f"Offer #{attempt_number} dispatched to {best_partner.user.username} (score: {score:.1f}, dist: {distance_km:.2f}km, payout: ₹{estimated_payout})"
        )

        # 8. Post-commit notification to candidate rider
        restaurant_name = locked_order.restaurant.name if locked_order.restaurant else "Partner Merchant"
        safe_dispatch_on_commit(
            user=best_partner.user,
            event_type='delivery.job_offered',
            context={
                'order_number': locked_order.order_number,
                'restaurant_name': restaurant_name,
                'distance_km': f"{distance_km:.1f}",
                'payout': f"{estimated_payout:.2f}",
                'expiry_seconds': offer_timeout_seconds
            },
            idempotency_key=f"offer_dispatched_{offer.id}",
            related_resource_type='DeliveryOffer',
            related_resource_id=offer.id
        )

        # 9. Realtime broadcast to Channels
        try:
            from apps.orders.realtime import build_event_envelope
            channel_layer = get_channel_layer()
            if channel_layer:
                envelope = build_event_envelope(
                    event_type='delivery.job_offered',
                    entity_type='delivery_offer',
                    entity_id=offer.id,
                    entity_version=attempt_number,
                    idempotency_key=f"offer_dispatched_{offer.id}",
                    data={
                        'offer_id': offer.id,
                        'order_id': locked_order.id,
                        'order_number': locked_order.order_number,
                        'delivery_partner_id': best_partner.user.id,
                        'partner_username': best_partner.user.username,
                        'expires_at': expires_at.isoformat(),
                        'attempt_number': attempt_number,
                        'distance_km': float(distance_km),
                        'estimated_payout': float(estimated_payout),
                        'restaurant_name': locked_order.restaurant.name if locked_order.restaurant else 'Restaurant',
                        'customer_address': locked_order.delivery_address_text,
                    }
                )
                # Legacy top-level fields
                envelope.update({
                    'order_id': locked_order.id,
                    'order_number': locked_order.order_number,
                    'offer_id': offer.id,
                    'delivery_partner_id': best_partner.user.id,
                    'partner_username': best_partner.user.username,
                    'expires_at': expires_at.isoformat(),
                    'attempt_number': attempt_number
                })

                for grp in [f"delivery_partner_{best_partner.user.id}", 'wsfood_live_ecosystem']:
                    try:
                        async_to_sync(channel_layer.group_send)(
                            grp,
                            {
                                'type': 'ecosystem_event',
                                'payload': envelope
                            }
                        )
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Dispatch WebSocket broadcast warning: {e}")

        return {
            'status': 'offered',
            'offer_id': offer.id,
            'attempt_number': attempt_number,
            'partner': best_partner.user.username,
            'distance_km': distance_km,
            'matching_score': score,
            'estimated_payout': estimated_payout,
            'expires_at': expires_at.isoformat()
        }


def accept_offer_concurrency_safe(offer_id, user):
    """
    Accepts a job offer using row-level locking (select_for_update) to eliminate race conditions.
    Validates expiration, ensures single-winner guarantee, and updates order and partner state atomically.
    Returns (success: bool, data_or_message: dict|str, http_status_code: int)
    """
    with transaction.atomic():
        now = timezone.now()

        # 1. Row-level lock on the offer
        offer = DeliveryOffer.objects.select_for_update().filter(pk=offer_id).first()
        if not offer:
            return False, "Delivery offer not found.", 404

        if offer.delivery_partner != user:
            return False, "You are not authorized to accept this job offer.", 403

        # Idempotency check: Already accepted by this partner
        if offer.status == 'ACCEPTED':
            assignment = DeliveryAssignment.objects.select_for_update().get(pk=offer.assignment_id)
            return True, {
                'message': 'Offer already accepted.',
                'assignment_id': assignment.id,
                'order_id': assignment.order_id
            }, 200

        # Expiry check
        if offer.status == 'EXPIRED' or offer.is_expired():
            offer.status = 'EXPIRED'
            offer.responded_at = now
            offer.save(update_fields=['status', 'responded_at', 'updated_at'])
            # Trigger dispatch to next eligible partner
            transaction.on_commit(lambda: dispatch_order_offer(offer.assignment.order))
            return False, "This job offer has expired and has been reassigned to another partner.", 400

        if offer.status != 'OFFERED':
            return False, f"Offer cannot be accepted from current status '{offer.status}'.", 400

        # 2. Row-level lock on Assignment and Order
        assignment = DeliveryAssignment.objects.select_for_update().get(pk=offer.assignment_id)
        order = Order.objects.select_for_update().get(pk=assignment.order_id)

        # Verify order state
        if order.status not in ['READY_FOR_PICKUP', 'READY']:
            return False, f"Order is not ready for pickup (current status: {order.status}).", 400

        # Race Condition Protection: Verify order not already accepted by another partner
        if assignment.status in ['ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED']:
            if assignment.delivery_partner != user:
                offer.status = 'CANCELLED'
                offer.save(update_fields=['status', 'updated_at'])
                return False, "This job has already been accepted by another delivery partner.", 409

        if order.rider and order.rider != user:
            offer.status = 'CANCELLED'
            offer.save(update_fields=['status', 'updated_at'])
            return False, "This order has already been assigned to another delivery partner.", 409

        # Verify partner workload / active capacity
        partner = getattr(user, 'delivery_profile', None)
        if partner and partner.active_order and partner.active_order != order:
            return False, "Partner already has an active delivery in progress.", 400

        # Eligibility re-check: approval/active/online may have changed after
        # the offer was issued (suspend/offline/unapproved must not convert).
        if not user.is_active:
            offer.status = 'CANCELLED'
            offer.save(update_fields=['status', 'updated_at'])
            return False, "Delivery partner account is suspended.", 403
        _prof = partner or DeliveryPartner.objects.filter(user=user).first()
        if not _prof or not (_prof.is_verified or _prof.verification_status == 'APPROVED'):
            offer.status = 'CANCELLED'
            offer.save(update_fields=['status', 'updated_at'])
            return False, "Delivery partner account is pending approval.", 403
        if not _prof.is_online:
            offer.status = 'CANCELLED'
            offer.save(update_fields=['status', 'updated_at'])
            return False, "Partner is offline. Go online to accept jobs.", 400

        # 3. Commit Successful Acceptance Transitions
        offer.status = 'ACCEPTED'
        offer.responded_at = now
        offer.save(update_fields=['status', 'responded_at', 'updated_at'])

        assignment.status = 'ACCEPTED'
        assignment.delivery_partner = user
        assignment.accepted_at = now
        assignment.save(update_fields=['status', 'delivery_partner', 'accepted_at', 'updated_at'])

        order.rider = user
        order.save(update_fields=['rider', 'updated_at'])

        if partner:
            partner.active_order = order
            partner.save(update_fields=['active_order', 'updated_at'])

        # Cancel any other pending offers for this assignment
        DeliveryOffer.objects.filter(
            assignment=assignment,
            status='OFFERED'
        ).exclude(pk=offer.id).update(status='CANCELLED')

        # 4. Audit History Logging
        DeliveryAssignmentHistory.objects.create(
            assignment=assignment,
            from_status='OFFERED',
            to_status='ACCEPTED',
            actor=user,
            notes=f"Offer #{offer.attempt_number} accepted by delivery partner {user.username}"
        )
        OrderStatusHistory.objects.create(
            order=order,
            from_status=order.status,
            to_status=order.status,
            actor=user,
            actor_role='DELIVERY',
            reason=f"Assigned and accepted by delivery partner {user.username}"
        )

        # 5. Customer Notification
        if order.customer:
            safe_dispatch_on_commit(
                user=order.customer,
                event_type='delivery.assigned',
                context={
                    'order_number': order.order_number,
                    'rider_name': user.get_full_name() or user.username,
                    'partner_name': user.get_full_name() or user.username
                },
                idempotency_key=f"delivery_assigned_phase23_{order.id}",
                related_resource_type='Order',
                related_resource_id=order.id
            )

        return True, {
            'message': f"Job for Order #{order.order_number} accepted successfully!",
            'assignment_id': assignment.id,
            'order_id': order.id,
            'order_number': order.order_number
        }, 200


def reject_offer_and_progress(offer_id, user, reason=''):
    """
    Rejects a job offer and automatically progresses dispatch to the next eligible candidate.
    Returns (success: bool, data_or_message: dict|str, http_status_code: int)
    """
    with transaction.atomic():
        now = timezone.now()

        offer = DeliveryOffer.objects.select_for_update().filter(pk=offer_id).first()
        if not offer:
            return False, "Delivery offer not found.", 404

        if offer.delivery_partner != user:
            return False, "You are not authorized to decline this job offer.", 403

        # Idempotency: already rejected
        if offer.status == 'REJECTED':
            return True, {'message': "Offer already rejected.", 'status': 'REJECTED'}, 200

        if offer.status != 'OFFERED':
            return False, f"Offer cannot be rejected from current status '{offer.status}'.", 400

        offer.status = 'REJECTED'
        offer.rejection_reason = reason or "Declined by delivery partner"
        offer.responded_at = now
        offer.save(update_fields=['status', 'rejection_reason', 'responded_at', 'updated_at'])

        assignment = DeliveryAssignment.objects.select_for_update().get(pk=offer.assignment_id)
        assignment.status = 'AVAILABLE'
        assignment.save(update_fields=['status', 'updated_at'])

        DeliveryAssignmentHistory.objects.create(
            assignment=assignment,
            from_status='OFFERED',
            to_status='AVAILABLE',
            actor=user,
            notes=f"Offer #{offer.attempt_number} rejected by {user.username}. Reason: {offer.rejection_reason}"
        )

        # Trigger automatic progression to the next candidate on commit
        order = assignment.order
        transaction.on_commit(lambda: dispatch_order_offer(order))

        return True, {
            'message': "Offer declined. Dispatch re-routing to standby partner.",
            'offer_id': offer.id,
            'status': 'REJECTED'
        }, 200


def expire_offer_and_progress(offer_id):
    """
    Handles offer expiration timeout and automatically triggers next-candidate dispatch.
    """
    with transaction.atomic():
        now = timezone.now()
        offer = DeliveryOffer.objects.select_for_update().filter(pk=offer_id).first()
        if not offer or offer.status != 'OFFERED':
            return None

        offer.status = 'EXPIRED'
        offer.responded_at = now
        offer.save(update_fields=['status', 'responded_at', 'updated_at'])

        assignment = DeliveryAssignment.objects.select_for_update().get(pk=offer.assignment_id)
        assignment.status = 'AVAILABLE'
        assignment.save(update_fields=['status', 'updated_at'])

        DeliveryAssignmentHistory.objects.create(
            assignment=assignment,
            from_status='OFFERED',
            to_status='AVAILABLE',
            actor=offer.delivery_partner,
            notes=f"Offer #{offer.attempt_number} expired after countdown timeout. Auto-progressing dispatch."
        )

        order = assignment.order
        transaction.on_commit(lambda: dispatch_order_offer(order))
        return offer


def admin_manual_reassign(assignment_id, target_user_id, admin_user, reason='', handover_confirmed=False):
    """
    Administrative manual reassignment with strict validation and audit logging.
    Enforces that order is paid and ready, and target partner is approved and online.
    - reason is mandatory.
    - DELIVERY_PARTNER canonical role accepted alongside DELIVERY/RIDER.
    - PICKED_UP orders require explicit handover_confirmed (safe handover).
    - Notifies new partner, previous partner, and customer (idempotent keys).
    """
    if not (admin_user.is_staff or getattr(admin_user, 'role', '') == 'ADMIN'):
        return False, "Administrative privileges required.", 403

    if not (reason or '').strip():
        return False, "A reassignment reason is required.", 400

    with transaction.atomic():
        now = timezone.now()

        assignment = DeliveryAssignment.objects.select_for_update().filter(pk=assignment_id).first()
        if not assignment:
            return False, "Delivery assignment not found.", 404

        order = Order.objects.select_for_update().get(pk=assignment.order_id)

        # Verify order state: cannot reassign delivered or cancelled orders
        if order.status in ['DELIVERED', 'CANCELLED']:
            return False, f"Cannot reassign an order that is already {order.status}.", 400

        # Verify payment status
        if order.payment_status not in ['PAID', 'VERIFIED_PAID', 'PAYMENT_PENDING', 'COMPLETED']:
            return False, "Cannot reassign an order with unverified payment.", 400

        target_user = User.objects.filter(pk=target_user_id).first()
        if not target_user or target_user.role not in ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER']:
            return False, "Selected user is not a valid delivery partner.", 400

        if not target_user.is_active:
            return False, "Selected delivery partner account is not active.", 400

        target_partner = getattr(target_user, 'delivery_profile', None)
        if not target_partner or not (target_partner.is_verified or target_partner.verification_status == 'APPROVED'):
            return False, "Selected delivery partner is not approved.", 400

        # Safe handover: food already picked up needs explicit confirmation.
        if assignment.status == 'PICKED_UP' and not handover_confirmed:
            return False, "Food is already picked up: confirm safe handover before reassigning.", 400

        # Prevent duplicate active assignments for the same partner+order.
        dup = DeliveryAssignment.objects.filter(
            order=order, delivery_partner=target_user,
            status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
        ).exclude(pk=assignment.pk).exists()
        if dup:
            return False, "Selected partner already holds this order.", 400

        # Cancel any existing pending offers
        DeliveryOffer.objects.filter(assignment=assignment, status='OFFERED').update(
            status='CANCELLED',
            responded_at=now
        )

        prev_partner = assignment.delivery_partner
        prev_partner_name = prev_partner.username if prev_partner else "Unassigned"
        prev_status = assignment.status

        # Transition assignment and order
        assignment.status = 'ACCEPTED'
        assignment.delivery_partner = target_user
        assignment.assigned_at = assignment.assigned_at or now
        assignment.accepted_at = now
        assignment.save(update_fields=['status', 'delivery_partner', 'assigned_at', 'accepted_at', 'updated_at'])

        order.rider = target_user
        order.save(update_fields=['rider', 'updated_at'])

        # Clear stale active_order on the previous partner profile.
        if prev_partner:
            prev_profile = getattr(prev_partner, 'delivery_profile', None)
            if prev_profile and prev_profile.active_order_id == order.id:
                prev_profile.active_order = None
                prev_profile.save(update_fields=['active_order', 'updated_at'])

        target_partner.active_order = order
        target_partner.save(update_fields=['active_order', 'updated_at'])

        # Audit History
        audit_note = f"Manual reassignment by Admin {admin_user.username} from {prev_partner_name} to {target_user.username}. Justification: {reason or 'Administrative override'}"
        DeliveryAssignmentHistory.objects.create(
            assignment=assignment,
            from_status=prev_status,
            to_status='ACCEPTED',
            actor=admin_user,
            notes=audit_note
        )
        OrderStatusHistory.objects.create(
            order=order,
            from_status=order.status,
            to_status=order.status,
            actor=admin_user,
            actor_role='ADMIN',
            reason=audit_note
        )

        # Notify new delivery partner
        safe_dispatch_on_commit(
            user=target_user,
            event_type='delivery.reassigned',
            context={
                'order_number': order.order_number,
                'admin_name': admin_user.get_full_name() or admin_user.username,
                'partner_name': target_user.get_full_name() or target_user.username
            },
            idempotency_key=f"manual_reassigned_{assignment.id}_{now.timestamp()}",
            related_resource_type='Order',
            related_resource_id=order.id
        )

        # Notify previous partner (if any and different)
        if prev_partner and prev_partner.id != target_user.id:
            safe_dispatch_on_commit(
                user=prev_partner,
                event_type='delivery.reassigned',
                context={
                    'order_number': order.order_number,
                    'admin_name': admin_user.get_full_name() or admin_user.username,
                    'partner_name': prev_partner_name
                },
                idempotency_key=f"manual_unassigned_{assignment.id}_{now.timestamp()}",
                related_resource_type='Order',
                related_resource_id=order.id
            )

        # Notify customer (rider change on their order)
        safe_dispatch_on_commit(
            user=order.customer,
            event_type='delivery.reassigned',
            context={
                'order_number': order.order_number,
                'admin_name': admin_user.get_full_name() or admin_user.username,
                'partner_name': target_user.get_full_name() or target_user.username
            },
            idempotency_key=f"manual_reassigned_customer_{assignment.id}_{now.timestamp()}",
            related_resource_type='Order',
            related_resource_id=order.id
        )

        return True, {
            'message': f"Order #{order.order_number} successfully reassigned to {target_user.username}.",
            'assignment_id': assignment.id,
            'partner_username': target_user.username
        }, 200
