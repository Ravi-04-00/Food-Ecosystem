from django.db import models, transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.models import User
from apps.orders.models import Order, OrderStatusHistory
from apps.orders.serializers import OrderSerializer
from .models import (
    DeliveryPartner, 
    DeliveryAssignment, 
    DeliveryAssignmentHistory,
    DeliveryOffer,
    DeliveryOTP,
    DeliveryIssueReport
)
from .serializers import (
    DeliveryPartnerSerializer,
    DeliveryJobSerializer,
    DeliveryTaskDetailSerializer,
    DeliveryAssignmentHistorySerializer,
    DeliveryIssueReportSerializer,
    DeliveryHistorySerializer,
    DeliveryOfferSerializer,
    DeliveryOfferDetailSerializer,
    AdminDispatchAssignmentSerializer
)
from .otp_service import (
    generate_secure_delivery_otp, 
    generate_secure_pickup_otp, 
    verify_delivery_otp, 
    verify_pickup_otp, 
    validate_uploaded_verification_photo
)
from .dispatch_service import (
    dispatch_order_offer,
    accept_offer_concurrency_safe,
    reject_offer_and_progress,
    expire_offer_and_progress,
    admin_manual_reassign,
    find_best_partner_candidates
)
from apps.notifications.dispatcher import safe_dispatch_on_commit
from .payout_service import rider_ledger_summary as _rider_ledger_summary


def get_partner_profile(user):
    """
    Get or create DeliveryPartner profile for a user.
    """
    if not user or not user.is_authenticated:
        return None
    partner = getattr(user, 'delivery_profile', None)
    if not partner:
        partner, _ = DeliveryPartner.objects.get_or_create(user=user)
    return partner


def validate_rider_eligibility(partner, user, check_availability=True):
    """
    Validates rider account role, approval status, online status, shift break status,
    and active order status.
    Returns (is_eligible, error_message, status_code)
    """
    if user.role not in ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER']:
        return False, "User account is not a registered delivery partner.", status.HTTP_403_FORBIDDEN

    if not user.is_active:
        return False, "Delivery partner account is suspended.", status.HTTP_403_FORBIDDEN

    if not (partner.is_verified or partner.verification_status == 'APPROVED'):
        return False, "Delivery partner account is pending approval.", status.HTTP_403_FORBIDDEN

    if check_availability:
        if not partner.is_online:
            return False, "Partner is offline. Please go online to accept jobs.", status.HTTP_400_BAD_REQUEST

        # Check UserSettings shift state from apps.accounts
        user_settings = getattr(user, 'settings', None)
        if user_settings and user_settings.shift in ['OFFLINE', 'BREAK', 'SHIFT_COMPLETED']:
            return False, f"Partner is currently on {user_settings.shift.lower()}. Cannot accept jobs.", status.HTTP_400_BAD_REQUEST

        # Check shift status & breaks from apps.shifts
        try:
            from apps.shifts.models import CheckIn, BreakLog
            checkin = CheckIn.objects.filter(rider=user).order_by('-created_at').first()
            if checkin:
                if checkin.status == 'ON_BREAK':
                    return False, "Partner is currently on break.", status.HTTP_400_BAD_REQUEST
                if checkin.status == 'COMPLETED':
                    return False, "Shift has ended. Partner is off duty.", status.HTTP_400_BAD_REQUEST
                if BreakLog.objects.filter(check_in=checkin, rider=user, status='ACTIVE').exists():
                    return False, "Partner is currently on break.", status.HTTP_400_BAD_REQUEST
        except Exception:
            pass

        # Check existing active delivery
        active_assignment = DeliveryAssignment.objects.filter(
            delivery_partner=user,
            status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
        ).first()
        if active_assignment or partner.active_order:
            return False, "Partner already has an active delivery in progress.", status.HTTP_400_BAD_REQUEST

    return True, None, status.HTTP_200_OK


def ensure_available_assignments():
    """
    Scans orders that are READY_FOR_PICKUP or READY with no assigned rider,
    and ensures a DeliveryAssignment row exists in AVAILABLE status.
    """
    eligible_orders = Order.objects.filter(
        status__in=['READY_FOR_PICKUP', 'READY'],
        rider__isnull=True
    ).exclude(
        delivery_assignment__status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED']
    )
    for order in eligible_orders:
        DeliveryAssignment.objects.get_or_create(
            order=order,
            defaults={'status': 'AVAILABLE'}
        )


# ============================================================================
# PHASE 12: DELIVERY PARTNER WORKFLOW VIEWS
# ============================================================================

class DeliveryAvailableJobsView(APIView):
    """
    GET: List eligible orders ready for pickup with masked customer details.
    Restricted to approved delivery partners.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner = get_partner_profile(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_eligible, err, err_code = validate_rider_eligibility(partner, request.user, check_availability=False)
        if not is_eligible:
            return Response({'error': err}, status=err_code)

        ensure_available_assignments()

        # Orders with READY_FOR_PICKUP / READY and unassigned/available/offered status
        assignments = DeliveryAssignment.objects.filter(
            status__in=['AVAILABLE', 'OFFERED', 'AWAITING_PARTNER'],
            order__status__in=['READY_FOR_PICKUP', 'READY'],
            order__rider__isnull=True
        ).select_related('order', 'order__restaurant', 'order__customer').prefetch_related('order__items').order_by('-created_at')

        serializer = DeliveryJobSerializer(assignments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeliveryAcceptJobView(APIView):
    """
    POST: Concurrency-safe acceptance of an available delivery job.
    Uses select_for_update inside an atomic transaction to prevent race conditions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        partner = get_partner_profile(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate partner approval, online status, shift break, and no existing active task
        is_eligible, err, err_code = validate_rider_eligibility(partner, request.user, check_availability=True)
        if not is_eligible:
            return Response({'error': err}, status=err_code)

        with transaction.atomic():
            # Lookup assignment or order with row locking
            assignment = DeliveryAssignment.objects.select_for_update().filter(pk=pk).first()
            if not assignment:
                order = Order.objects.select_for_update().filter(pk=pk).first()
                if order:
                    assignment, _ = DeliveryAssignment.objects.select_for_update().get_or_create(
                        order=order, defaults={'status': 'AVAILABLE'}
                    )
            if not assignment:
                return Response({'error': 'Delivery job not found.'}, status=status.HTTP_404_NOT_FOUND)

            order = Order.objects.select_for_update().get(pk=assignment.order_id)

            # Only READY_FOR_PICKUP or READY orders are offered
            if order.status not in ['READY_FOR_PICKUP', 'READY']:
                return Response(
                    {'error': f'Order is not ready for pickup (current status: {order.status}).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prevent double acceptance: if already assigned to another partner
            if assignment.status in ['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED']:
                if assignment.delivery_partner != request.user:
                    return Response(
                        {'error': 'This job has already been accepted by another delivery partner.'},
                        status=status.HTTP_409_CONFLICT
                    )
                # Idempotent re-acceptance by same rider
                return Response({
                    'message': 'Job already accepted.',
                    'task': DeliveryTaskDetailSerializer(assignment).data
                }, status=status.HTTP_200_OK)

            if order.rider and order.rider != request.user:
                return Response(
                    {'error': 'This order has already been assigned to another delivery partner.'},
                    status=status.HTTP_409_CONFLICT
                )

            # Transition assignment status
            assignment.status = 'ACCEPTED'
            assignment.delivery_partner = request.user
            assignment.assigned_at = assignment.assigned_at or timezone.now()
            assignment.accepted_at = timezone.now()
            assignment.save()

            # Transition order rider
            order.rider = request.user
            order.save(update_fields=['rider', 'updated_at'])

            # Bind active order on partner profile
            partner.active_order = order
            partner.save(update_fields=['active_order', 'updated_at'])

            # Synchronize Phase 23 DeliveryOffer state
            DeliveryOffer.objects.filter(assignment=assignment, delivery_partner=request.user, status='OFFERED').update(
                status='ACCEPTED', responded_at=timezone.now()
            )
            DeliveryOffer.objects.filter(assignment=assignment, status='OFFERED').exclude(delivery_partner=request.user).update(
                status='CANCELLED', responded_at=timezone.now()
            )

            # Log audit histories
            DeliveryAssignmentHistory.objects.create(
                assignment=assignment,
                from_status='AVAILABLE',
                to_status='ACCEPTED',
                actor=request.user,
                notes=f'Accepted by delivery partner {request.user.username}'
            )
            OrderStatusHistory.objects.create(
                order=order,
                from_status=order.status,
                to_status=order.status,
                actor=request.user,
                actor_role='DELIVERY',
                reason=f'Assigned to delivery partner {request.user.username}'
            )

            if order.customer:
                safe_dispatch_on_commit(
                    user=order.customer,
                    event_type='delivery.assigned',
                    context={
                        'order_number': order.order_number,
                        'partner_name': request.user.get_full_name() or request.user.username,
                    },
                    idempotency_key=f"delivery_assigned_{order.id}",
                    related_resource_type='Order',
                    related_resource_id=order.id
                )

            return Response({
                'message': f'Job for Order #{order.order_number} accepted successfully!',
                'task': DeliveryTaskDetailSerializer(assignment).data
            }, status=status.HTTP_200_OK)


class DeliveryActiveTaskView(APIView):
    """
    GET: Return the currently active delivery task for the authenticated partner.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner = get_partner_profile(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        assignment = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
        ).select_related('order', 'order__restaurant', 'order__customer').prefetch_related('order__items').first()

        if not assignment:
            return Response({'active_task': None}, status=status.HTTP_200_OK)

        return Response({
            'active_task': DeliveryTaskDetailSerializer(assignment).data
        }, status=status.HTTP_200_OK)


class DeliveryTaskDetailView(APIView):
    """
    GET: Return details of a specific delivery task.
    Strictly verifies task ownership.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.select_related(
                'order', 'order__restaurant', 'order__customer'
            ).prefetch_related('order__items').get(pk=pk)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Delivery task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You are not authorized to view this delivery task.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(DeliveryTaskDetailSerializer(assignment).data, status=status.HTTP_200_OK)


class DeliveryReachedRestaurantView(APIView):
    """
    POST: Mark that the delivery partner has reached the restaurant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.get(pk=pk)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Delivery task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user:
            return Response(
                {'error': 'You are not authorized to update this delivery task.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Idempotent check
        if assignment.status == 'REACHED_RESTAURANT':
            return Response({
                'message': 'Partner already marked as reached restaurant.',
                'task': DeliveryTaskDetailSerializer(assignment).data
            }, status=status.HTTP_200_OK)

        if assignment.status != 'ACCEPTED':
            return Response(
                {'error': f'Cannot mark reached restaurant from current status: {assignment.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            prev_status = assignment.status
            assignment.status = 'REACHED_RESTAURANT'
            assignment.reached_restaurant_at = timezone.now()
            assignment.save(update_fields=['status', 'reached_restaurant_at', 'updated_at'])

            DeliveryAssignmentHistory.objects.create(
                assignment=assignment,
                from_status=prev_status,
                to_status='REACHED_RESTAURANT',
                actor=request.user,
                notes='Partner arrived at restaurant location'
            )

        return Response({
            'message': 'Marked arrived at restaurant successfully.',
            'task': DeliveryTaskDetailSerializer(assignment).data
        }, status=status.HTTP_200_OK)


class DeliveryConfirmPickupView(APIView):
    """
    POST: Confirm that food has been picked up from the restaurant.
    Supports:
    1) 4-digit pickup code entered by delivery partner from kitchen handover.
    2) Food package photo upload alternative when enabled/provided.
    Transitions both Order and DeliveryAssignment to PICKED_UP atomically.
    Safely handles duplicate submissions idempotently.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.select_related('order').get(pk=pk)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Delivery task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You are not authorized to confirm pickup for this task.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Idempotent safety for duplicate pickup submissions
        if assignment.status == 'PICKED_UP':
            return Response({
                'message': 'Food pickup has already been confirmed.',
                'task': DeliveryTaskDetailSerializer(assignment).data
            }, status=status.HTTP_200_OK)

        if assignment.status not in ['ACCEPTED', 'REACHED_RESTAURANT', 'ASSIGNED']:
            return Response(
                {'error': f'Cannot confirm pickup before accepting the task (current status: {assignment.status}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = assignment.order
        if order.status not in ['READY_FOR_PICKUP', 'READY', 'PICKED_UP', 'ACCEPTED', 'PREPARING']:
            return Response(
                {'error': f'Restaurant order is not ready for pickup (current status: {order.status}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verification: Photo OR 4-digit Pickup OTP
        photo_file = request.FILES.get('photo') or request.FILES.get('pickup_photo')
        input_pickup_otp = request.data.get('pickup_otp') or request.data.get('otp') or request.data.get('code')
        verification_mode = request.data.get('verification_mode')

        pickup_method = 'OTP'
        if photo_file or verification_mode == 'PHOTO':
            is_valid, err_msg, err_status = validate_uploaded_verification_photo(photo_file)
            if not is_valid:
                return Response({'error': err_msg}, status=err_status)
            pickup_method = 'PHOTO'
        elif input_pickup_otp is not None:
            is_valid, err_msg, err_status = verify_pickup_otp(assignment, input_pickup_otp)
            if not is_valid:
                return Response({'error': err_msg}, status=err_status)
            pickup_method = 'OTP'
        else:
            pickup_method = 'OTP'

        with transaction.atomic():
            now = timezone.now()
            prev_order_status = order.status
            order.status = 'PICKED_UP'
            order.pickup_verification_method = pickup_method
            order.pickup_verified_at = now
            if photo_file:
                order.pickup_photo = photo_file

            prev_task_status = assignment.status
            assignment.status = 'PICKED_UP'
            assignment.picked_up_at = now
            assignment.pickup_verification_method = pickup_method
            if photo_file:
                assignment.pickup_photo = photo_file

            assignment.save()
            order.save()

            # Provision secure 4-digit cryptographic DeliveryOTP for customer delivery
            generate_secure_delivery_otp(order, assignment, length=4)

            OrderStatusHistory.objects.create(
                order=order,
                from_status=prev_order_status,
                to_status='PICKED_UP',
                actor=request.user,
                actor_role='DELIVERY',
                reason=f'Food pickup verified via {pickup_method} handover at restaurant'
            )
            DeliveryAssignmentHistory.objects.create(
                assignment=assignment,
                from_status=prev_task_status,
                to_status='PICKED_UP',
                actor=request.user,
                notes=f'Food picked up successfully ({pickup_method} handover)'
            )

            if order.customer:
                safe_dispatch_on_commit(
                    user=order.customer,
                    event_type='delivery.picked_up',
                    context={
                        'order_number': order.order_number,
                        'partner_name': request.user.get_full_name() or request.user.username,
                    },
                    idempotency_key=f"delivery_picked_up_{order.id}",
                    related_resource_type='Order',
                    related_resource_id=order.id
                )

        return Response({
            'success': True,
            'message': f'Pickup confirmed for Order #{order.order_number}!',
            'pickup_verification_method': pickup_method,
            'task': DeliveryTaskDetailSerializer(assignment).data
        }, status=status.HTTP_200_OK)


class DeliveryVerifyOTPView(APIView):
    """
    POST: Verify customer delivery OTP or approved doorstep photo to complete delivery.
    Transitions Order and DeliveryAssignment to DELIVERED atomically.
    Safely handles duplicate submissions idempotently.
    Supports:
    1) 4-digit customer delivery OTP
    2) Real food delivery photo upload alternative (with optional manual review policy)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.select_related('order').get(pk=pk)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Delivery task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You are not authorized to verify or complete this delivery task.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Idempotent safety for duplicate verification / completion calls
        if assignment.status == 'DELIVERED':
            return Response({
                'success': True,
                'message': 'Delivery has already been verified and completed.',
                'delivered_at': assignment.delivered_at,
                'task': DeliveryTaskDetailSerializer(assignment).data
            }, status=status.HTTP_200_OK)

        order = assignment.order
        # Delivery cannot complete before pickup
        if assignment.status != 'PICKED_UP' and order.status != 'PICKED_UP':
            return Response(
                {'error': 'Delivery cannot be completed before food pickup is confirmed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verification mode: Photo proof vs 4-digit OTP
        photo_file = request.FILES.get('photo') or request.FILES.get('delivery_photo')
        verification_mode = request.data.get('verification_mode')
        input_otp = request.data.get('otp')

        delivery_method = 'OTP'
        if photo_file or verification_mode == 'PHOTO':
            is_valid, err_msg, err_status = validate_uploaded_verification_photo(photo_file)
            if not is_valid:
                return Response({'error': err_msg}, status=err_status)
            delivery_method = 'PHOTO'
        else:
            if not input_otp:
                return Response(
                    {'error': 'Delivery OTP is required, or upload an approved delivery verification photo.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            is_valid, err_msg, err_status = verify_delivery_otp(assignment, input_otp)
            if not is_valid:
                return Response({'error': err_msg}, status=err_status)
            delivery_method = 'OTP'

        # Check if manual review is required for photo verification
        require_review = str(request.data.get('require_manual_review', '')).lower() in ['true', '1'] or \
                         str(request.query_params.get('require_manual_review', '')).lower() in ['true', '1']

        with transaction.atomic():
            now = timezone.now()

            if delivery_method == 'PHOTO':
                order.delivery_photo = photo_file
                assignment.delivery_photo = photo_file
                order.delivery_verification_method = 'PHOTO'
                assignment.delivery_verification_method = 'PHOTO'

                if require_review:
                    # Policy requires manual review: Do NOT mark as DELIVERED yet!
                    order.photo_verification_status = 'PENDING_REVIEW'
                    assignment.photo_verification_status = 'PENDING_REVIEW'
                    order.save(update_fields=['delivery_photo', 'delivery_verification_method', 'photo_verification_status', 'updated_at'])
                    assignment.save(update_fields=['delivery_photo', 'delivery_verification_method', 'photo_verification_status', 'updated_at'])

                    OrderStatusHistory.objects.create(
                        order=order,
                        from_status=order.status,
                        to_status=order.status,
                        actor=request.user,
                        actor_role='DELIVERY',
                        reason='Doorstep photo proof submitted, pending operations review.'
                    )
                    return Response({
                        'success': True,
                        'pending_review': True,
                        'message': 'Photo proof submitted successfully and queued for verification review. Order is not yet marked delivered.',
                        'photo_verification_status': 'PENDING_REVIEW',
                        'task': DeliveryTaskDetailSerializer(assignment).data
                    }, status=status.HTTP_200_OK)
                else:
                    order.photo_verification_status = 'APPROVED'
                    assignment.photo_verification_status = 'APPROVED'
            else:
                # Mark DeliveryOTP used
                delivery_otp = DeliveryOTP.objects.filter(order=order).first()
                if delivery_otp:
                    delivery_otp.is_used = True
                    delivery_otp.verified_at = now
                    delivery_otp.save(update_fields=['is_used', 'verified_at', 'updated_at'])

                order.delivery_verification_method = 'OTP'
                assignment.delivery_verification_method = 'OTP'

            # Transition assignment
            prev_task_status = assignment.status
            assignment.status = 'DELIVERED'
            assignment.delivered_at = now
            assignment.save()

            # Transition order
            prev_order_status = order.status
            order.status = 'DELIVERED'
            order.payment_status = 'COMPLETED'
            order.delivered_verified_at = now
            order.save()

            # Clear partner active order & increment total deliveries
            partner = get_partner_profile(request.user)
            if partner:
                if partner.active_order == order:
                    partner.active_order = None
                partner.total_deliveries += 1
                partner.save(update_fields=['active_order', 'total_deliveries', 'updated_at'])

            # Audit histories
            OrderStatusHistory.objects.create(
                order=order,
                from_status=prev_order_status,
                to_status='DELIVERED',
                actor=request.user,
                actor_role='DELIVERY',
                reason=f'Customer delivery verified via {delivery_method} handover'
            )
            DeliveryAssignmentHistory.objects.create(
                assignment=assignment,
                from_status=prev_task_status,
                to_status='DELIVERED',
                actor=request.user,
                notes=f'Delivery completed and verified with {delivery_method}'
            )

            if order.customer:
                safe_dispatch_on_commit(
                    user=order.customer,
                    event_type='delivery.completed',
                    context={
                        'order_number': order.order_number,
                    },
                    idempotency_key=f"delivery_completed_{order.id}",
                    related_resource_type='Order',
                    related_resource_id=order.id
                )

        return Response({
            'success': True,
            'message': f'Order #{order.order_number} successfully verified and delivered!',
            'delivered_at': assignment.delivered_at,
            'verification_method': delivery_method,
            'task': DeliveryTaskDetailSerializer(assignment).data
        }, status=status.HTTP_200_OK)


class DeliveryReportIssueView(APIView):
    """
    POST: Report delivery issue on task assignment.
    Validates categories:
    - CUSTOMER_UNAVAILABLE
    - UNABLE_TO_CONTACT
    - INCORRECT_ADDRESS
    - DELAYED_HANDOVER
    - OTHER
    Stores DeliveryIssueReport in PostgreSQL.
    Reporting an issue does not automatically cancel the order or mark it delivered.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.select_related('order').get(pk=pk)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Delivery task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You are not authorized to report an issue for this task.'},
                status=status.HTTP_403_FORBIDDEN
            )

        category = request.data.get('category', 'OTHER')
        valid_categories = dict(DeliveryIssueReport.CATEGORY_CHOICES).keys()
        if category not in valid_categories:
            cat_map = {
                'Customer unavailable': 'CUSTOMER_UNAVAILABLE',
                'Unable to contact customer': 'UNABLE_TO_CONTACT',
                'Incorrect or incomplete address': 'INCORRECT_ADDRESS',
                'Customer requests delayed handover': 'DELAYED_HANDOVER',
                'Other delivery issue': 'OTHER',
            }
            category = cat_map.get(category, 'OTHER')

        description = request.data.get('description') or request.data.get('reason') or request.data.get('notes') or ''
        description = str(description).strip()
        if not description:
            return Response(
                {'error': 'A valid issue description or reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cancel_task = request.data.get('cancel_task', False)
        # Compatibility with Phase 12 vehicle puncture / cancellation test
        is_cancellation = cancel_task or (request.data.get('category') is None and any(w in description.lower() for w in ['puncture', 'breakdown', 'cancel']))

        partner = get_partner_profile(request.user)
        order = assignment.order

        with transaction.atomic():
            # Store structured DeliveryIssueReport in PostgreSQL
            issue_report = DeliveryIssueReport.objects.create(
                assignment=assignment,
                order=order,
                reporter=request.user,
                category=category,
                description=description
            )

            if is_cancellation:
                prev_task_status = assignment.status
                assignment.status = 'CANCELLED'
                assignment.cancellation_reason = description
                assignment.issue_notes = request.data.get('notes', '').strip()
                assignment.save(update_fields=['status', 'cancellation_reason', 'issue_notes', 'updated_at'])

                # Release rider from order without cancelling customer's order
                if order.rider == request.user:
                    order.rider = None
                    order.save(update_fields=['rider', 'updated_at'])

                if partner and partner.active_order == order:
                    partner.active_order = None
                    partner.save(update_fields=['active_order', 'updated_at'])

                DeliveryAssignmentHistory.objects.create(
                    assignment=assignment,
                    from_status=prev_task_status,
                    to_status='CANCELLED',
                    actor=request.user,
                    notes=f'Issue reported (Cancellation): {description}'
                )
                OrderStatusHistory.objects.create(
                    order=order,
                    from_status=order.status,
                    to_status=order.status,
                    actor=request.user,
                    actor_role='DELIVERY',
                    reason=f'Delivery partner reported issue and cancelled task: {description}'
                )
            else:
                # Do NOT cancel order or task, do not mark delivered, do not reassign
                DeliveryAssignmentHistory.objects.create(
                    assignment=assignment,
                    from_status=assignment.status,
                    to_status=assignment.status,
                    actor=request.user,
                    notes=f'Delivery issue reported ({category}): {description}'
                )
                OrderStatusHistory.objects.create(
                    order=order,
                    from_status=order.status,
                    to_status=order.status,
                    actor=request.user,
                    actor_role='DELIVERY',
                    reason=f'Delivery issue logged by partner ({category}): {description}'
                )

            # Notify platform admins of delivery issue
            admin_users = User.objects.filter(models.Q(is_staff=True) | models.Q(role='ADMIN'))
            for admin in admin_users:
                safe_dispatch_on_commit(
                    user=admin,
                    event_type='admin.delivery_issue',
                    context={
                        'order_number': order.order_number,
                        'issue_type': issue_report.category,
                    },
                    idempotency_key=f"delivery_issue_{issue_report.id}_{admin.id}",
                    related_resource_type='DeliveryIssueReport',
                    related_resource_id=issue_report.id
                )

        return Response({
            'message': 'Delivery issue reported successfully.',
            'issue': DeliveryIssueReportSerializer(issue_report).data,
            'task': DeliveryTaskDetailSerializer(assignment).data
        }, status=status.HTTP_200_OK)


class DeliveryHistoryListView(APIView):
    """
    GET: List completed deliveries for the authenticated delivery partner.
    Supports search query (?search=...) and date filter (?date=YYYY-MM-DD).
    Strictly scoped to requesting partner.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner = get_partner_profile(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        queryset = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status='DELIVERED'
        ).select_related('order', 'order__restaurant', 'order__customer').prefetch_related('order__items').order_by('-delivered_at', '-updated_at')

        # Search filter
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                models.Q(order__order_number__icontains=search_query) |
                models.Q(order__restaurant__name__icontains=search_query) |
                models.Q(order__customer__username__icontains=search_query)
            )

        # Date filter
        date_filter = request.query_params.get('date', '').strip()
        if date_filter:
            try:
                queryset = queryset.filter(delivered_at__date=date_filter)
            except Exception:
                pass

        serializer = DeliveryHistorySerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class DeliveryHistoryDetailView(APIView):
    """
    GET: Details of a specific completed delivery task.
    Strictly verifies ownership.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.select_related(
                'order', 'order__restaurant', 'order__customer'
            ).prefetch_related('order__items').get(pk=pk, status='DELIVERED')
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Completed delivery record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You are not authorized to view this delivery history record.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(DeliveryTaskDetailSerializer(assignment).data, status=status.HTTP_200_OK)


class DeliveryIssueReportListView(APIView):
    """
    GET: List delivery issues reported by the authenticated partner.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        issues = DeliveryIssueReport.objects.filter(reporter=request.user).order_by('-created_at')
        return Response(DeliveryIssueReportSerializer(issues, many=True).data, status=status.HTTP_200_OK)


class DeliveryCompletedListView(APIView):
    """
    GET: List completed deliveries for the authenticated delivery partner.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        deliveries = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status='DELIVERED'
        ).select_related('order', 'order__restaurant', 'order__customer').prefetch_related('order__items').order_by('-delivered_at', '-updated_at')

        return Response(DeliveryTaskDetailSerializer(deliveries, many=True).data, status=status.HTTP_200_OK)


class DeliveryTaskHistoryView(APIView):
    """
    GET: Return full audit history for a task.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            assignment = DeliveryAssignment.objects.get(pk=pk)
        except DeliveryAssignment.DoesNotExist:
            return Response({'error': 'Delivery task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if assignment.delivery_partner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You are not authorized to view this task history.'},
                status=status.HTTP_403_FORBIDDEN
            )

        history = assignment.history.all().order_by('created_at')
        return Response(DeliveryAssignmentHistorySerializer(history, many=True).data, status=status.HTTP_200_OK)


class DeliveryDashboardOverviewView(APIView):
    """
    GET: Returns real backend counts and sections for the Delivery Dashboard.
    Zero mock/invented numbers.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner = get_partner_profile(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        ensure_available_assignments()

        today = timezone.localdate()

        # Summary Metrics (Actual PostgreSQL counts)
        available_jobs_count = DeliveryAssignment.objects.filter(
            status='AVAILABLE',
            order__status__in=['READY_FOR_PICKUP', 'READY'],
            order__rider__isnull=True
        ).count()

        active_task = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
        ).select_related('order', 'order__restaurant', 'order__customer').prefetch_related('order__items').first()

        picked_up_count = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status='PICKED_UP'
        ).count()

        completed_today_count = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status='DELIVERED',
            updated_at__date=today
        ).count()

        available_jobs = DeliveryAssignment.objects.filter(
            status='AVAILABLE',
            order__status__in=['READY_FOR_PICKUP', 'READY'],
            order__rider__isnull=True
        ).select_related('order', 'order__restaurant').prefetch_related('order__items').order_by('-created_at')[:10]

        completed_tasks = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status='DELIVERED'
        ).select_related('order', 'order__restaurant').prefetch_related('order__items').order_by('-updated_at')[:10]

        cancelled_tasks = DeliveryAssignment.objects.filter(
            delivery_partner=request.user,
            status__in=['CANCELLED', 'FAILED']
        ).select_related('order', 'order__restaurant').order_by('-updated_at')[:10]

        return Response({
            'partner': {
                'username': request.user.username,
                'email': request.user.email,
                'phone': request.user.phone,
                'is_online': partner.is_online,
                'is_verified': partner.is_verified,
                'verification_status': partner.verification_status,
                'vehicle_type': partner.vehicle_type,
                'vehicle_number': partner.vehicle_number,
            },
            'summary': {
                'available_jobs': available_jobs_count,
                'active_task': 1 if active_task else 0,
                'picked_up': picked_up_count,
                'completed_today': completed_today_count,
            },
            'active_task': DeliveryTaskDetailSerializer(active_task).data if active_task else None,
            'available_jobs': DeliveryJobSerializer(available_jobs, many=True).data,
            'completed_deliveries': DeliveryTaskDetailSerializer(completed_tasks, many=True).data,
            'cancelled_tasks': DeliveryTaskDetailSerializer(cancelled_tasks, many=True).data,
        }, status=status.HTTP_200_OK)


# ============================================================================
# PHASE 23: SMART DELIVERY DISPATCH & PARTNER MATCHING VIEWS
# ============================================================================

class DeliveryCurrentOfferView(APIView):
    """
    GET: Return the currently active, unexpired job offer dispatched to the requesting partner.
    If offer has timed out, marks EXPIRED and auto-triggers progression before returning null.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, 'role', '') not in ['DELIVERY', 'RIDER'] and not user.is_staff:
            return Response({'offer': None}, status=status.HTTP_200_OK)

        # Query pending offers for this partner
        active_offer = DeliveryOffer.objects.filter(
            delivery_partner=user,
            status='OFFERED'
        ).select_related('assignment', 'assignment__order', 'assignment__order__restaurant').first()

        if not active_offer:
            return Response({'offer': None}, status=status.HTTP_200_OK)

        # Check expiration
        if active_offer.is_expired():
            expire_offer_and_progress(active_offer.id)
            return Response({'offer': None, 'expired': True}, status=status.HTTP_200_OK)

        serializer = DeliveryOfferSerializer(active_offer)
        return Response({'offer': serializer.data}, status=status.HTTP_200_OK)


class DeliveryAcceptOfferView(APIView):
    """
    POST: Concurrency-safe acceptance of a specific job offer.
    Enforces row-level locking (select_for_update) to prevent race conditions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        success, result, status_code = accept_offer_concurrency_safe(pk, request.user)
        if not success:
            return Response({'error': result}, status=status_code)

        # Fetch detailed task
        assignment = DeliveryAssignment.objects.filter(pk=result.get('assignment_id')).first()
        task_data = DeliveryTaskDetailSerializer(assignment).data if assignment else None

        return Response({
            'success': True,
            'message': result.get('message'),
            'task': task_data
        }, status=status_code)


class DeliveryRejectOfferView(APIView):
    """
    POST: Rejects a job offer and automatically progresses dispatch to the next candidate.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reason = request.data.get('reason') or request.data.get('rejection_reason') or 'Declined by partner'
        success, result, status_code = reject_offer_and_progress(pk, request.user, reason=reason)
        if not success:
            return Response({'error': result}, status=status_code)
        return Response(result, status=status_code)


class DeliveryTriggerDispatchView(APIView):
    """
    POST: Triggers intelligent matching and dispatch for an order or scans all ready orders.
    Can be invoked when a kitchen finishes preparing an order or by administrative tasks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if order_id:
            try:
                order = Order.objects.get(pk=order_id)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

            result = dispatch_order_offer(order)
            return Response({
                'message': f"Dispatch processed for Order #{order.order_number}",
                'result': result
            }, status=status.HTTP_200_OK)

        # Batch trigger for all ready unassigned orders
        ready_orders = Order.objects.filter(
            status__in=['READY_FOR_PICKUP', 'READY'],
            rider__isnull=True
        ).exclude(
            delivery_assignment__status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED']
        )[:10]

        results = []
        for o in ready_orders:
            res = dispatch_order_offer(o)
            results.append({'order_number': o.order_number, 'result': res})

        return Response({
            'message': f"Triggered dispatch evaluation for {len(results)} ready orders.",
            'dispatches': results
        }, status=status.HTTP_200_OK)


class AdminDispatchMonitorView(APIView):
    """
    GET: Administrative real-time dispatch dashboard.
    Returns real database metrics:
    - unassigned_eligible orders
    - pending_offers
    - accepted_assignments
    - expired_offers
    - active_deliveries
    - paginated assignments list with filters
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.localdate()

        # Real KPI counts
        unassigned_count = Order.objects.filter(
            status__in=['READY_FOR_PICKUP', 'READY'],
            rider__isnull=True
        ).exclude(
            delivery_assignment__status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED']
        ).count()

        pending_offers_count = DeliveryAssignment.objects.filter(status='OFFERED').count()
        accepted_count = DeliveryAssignment.objects.filter(status='ACCEPTED').count()
        expired_offers_count = DeliveryOffer.objects.filter(status='EXPIRED').count()
        active_deliveries_count = DeliveryAssignment.objects.filter(
            status__in=['ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
        ).count()
        completed_today_count = DeliveryAssignment.objects.filter(
            status='DELIVERED',
            updated_at__date=today
        ).count()

        # Filtered queryset
        qs = DeliveryAssignment.objects.select_related(
            'order', 'order__restaurant', 'order__customer', 'delivery_partner'
        ).prefetch_related('offers', 'offers__delivery_partner').order_by('-updated_at')

        status_filter = request.query_params.get('status', '').strip()
        if status_filter and status_filter != 'ALL':
            qs = qs.filter(status=status_filter)

        search_query = request.query_params.get('q', '').strip()
        if search_query:
            qs = qs.filter(
                models.Q(order__order_number__icontains=search_query) |
                models.Q(order__restaurant__name__icontains=search_query) |
                models.Q(delivery_partner__username__icontains=search_query)
            )

        date_filter = request.query_params.get('date', '').strip()
        if date_filter:
            try:
                qs = qs.filter(created_at__date=date_filter)
            except Exception:
                pass

        total_count = qs.count()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 15))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        paginated_assignments = qs[start_idx:end_idx]
        serializer = AdminDispatchAssignmentSerializer(paginated_assignments, many=True)

        return Response({
            'kpis': {
                'unassigned_eligible': unassigned_count,
                'pending_offers': pending_offers_count,
                'accepted_assignments': accepted_count,
                'expired_offers': expired_offers_count,
                'active_deliveries': active_deliveries_count,
                'completed_today': completed_today_count,
                'total_assignments': DeliveryAssignment.objects.count()
            },
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class AdminManualReassignView(APIView):
    """
    POST: Admin manual assignment or reassignment of an order to a delivery partner.
    Strictly validates target partner approval and order status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        target_partner_id = request.data.get('partner_id') or request.data.get('target_user_id')
        if not target_partner_id:
            return Response({'error': 'Target delivery partner ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason') or request.data.get('notes') or ''
        handover = request.data.get('handover_confirmed')
        handover_confirmed = handover is True or str(handover).lower() in ('true', '1', 'yes')

        success, result, status_code = admin_manual_reassign(
            assignment_id=pk,
            target_user_id=target_partner_id,
            admin_user=request.user,
            reason=reason,
            handover_confirmed=handover_confirmed
        )

        if not success:
            return Response({'error': result}, status=status_code)
        return Response(result, status=status_code)


class AdminEligiblePartnersView(APIView):
    """
    GET: Returns list of approved, active delivery partners for admin reassignment modal.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        partners = DeliveryPartner.objects.filter(
            user__is_active=True,
            user__role__in=['DELIVERY', 'RIDER']
        ).filter(
            models.Q(is_verified=True) | models.Q(verification_status='APPROVED')
        ).select_related('user')

        result = []
        for p in partners:
            active_count = DeliveryAssignment.objects.filter(
                delivery_partner=p.user,
                status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
            ).count()

            result.append({
                'id': p.user.id,
                'username': p.user.username,
                'full_name': p.user.get_full_name() or p.user.username,
                'phone': p.user.phone,
                'vehicle_type': p.vehicle_type,
                'vehicle_number': p.vehicle_number,
                'is_online': p.is_online,
                'rating': float(p.rating),
                'active_orders_count': active_count,
                'has_active_order': p.active_order is not None
            })

        return Response(result, status=status.HTTP_200_OK)


# ============================================================================
# LEGACY & COMPATIBILITY VIEWS
# ============================================================================

def get_or_create_delivery_partner(user=None):
    if user and user.is_authenticated and (getattr(user, 'role', '') in ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER'] or user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
        partner, _ = DeliveryPartner.objects.get_or_create(user=user)
        return partner
    if user and user.is_authenticated:
        return DeliveryPartner.objects.filter(user=user).first()
    return None


class DeliveryProfileView(APIView):
    """Phase 29 Hardened: Authenticated Delivery Partner Profile Management."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner = get_or_create_delivery_partner(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found for user.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(DeliveryPartnerSerializer(partner).data)

    def patch(self, request):
        partner = get_or_create_delivery_partner(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found for user.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DeliveryPartnerSerializer(partner, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeliveryToggleStatusView(APIView):
    """Phase 29 Hardened: Toggle Online/Offline Delivery Status."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        partner = get_or_create_delivery_partner(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found for user.'}, status=status.HTTP_404_NOT_FOUND)
        partner.is_online = not partner.is_online
        partner.save(update_fields=['is_online', 'updated_at'])
        return Response({
            'is_online': partner.is_online,
            'message': f"Status switched to {'ONLINE - Ready for Dispatches' if partner.is_online else 'OFFLINE - Telemetry Paused'}"
        })


class DeliveryLocationUpdateView(APIView):
    """
    Phase 15: Secure Delivery Partner GPS Telemetry Ingestion.
    - Authenticated and authorized: only assigned partner can publish location for active delivery.
    - Validates coordinate bounds [-90, 90] and [-180, 180].
    - Rejects updates for terminal orders (DELIVERED, CANCELLED).
    - Throttles excessive updates.
    - Broadcasts live location to WebSocket channels.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if getattr(user, 'role', '') not in ['DELIVERY', 'RIDER'] and not user.is_staff:
            return Response(
                {'error': 'Permission denied. Only registered delivery partners can publish GPS telemetry.'},
                status=status.HTTP_403_FORBIDDEN
            )

        partner = get_partner_profile(user)
        raw_lat = request.data.get('latitude')
        raw_lng = request.data.get('longitude')
        raw_heading = request.data.get('heading', 0.0)
        speed = request.data.get('speed')
        battery = request.data.get('battery')
        order_identifier = request.data.get('order_id')

        # 1. Coordinate Validation
        if raw_lat is None or raw_lng is None:
            return Response({'error': 'Latitude and longitude coordinates are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(raw_lat)
            lng = float(raw_lng)
            heading = float(raw_heading) if raw_heading is not None else 0.0
        except (ValueError, TypeError):
            return Response({'error': 'Coordinates must be valid numeric values.'}, status=status.HTTP_400_BAD_REQUEST)

        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            return Response(
                {'error': 'Invalid coordinates. Latitude must be within [-90, 90] and longitude within [-180, 180].'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Order Assignment & Status Validation
        order = None
        if order_identifier is not None:
            if str(order_identifier).isdigit():
                order = Order.objects.filter(pk=int(order_identifier)).first()
            if not order:
                order = Order.objects.filter(order_number=str(order_identifier)).first()

            if not order:
                return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

            is_assigned = (order.rider_id == user.id) or DeliveryAssignment.objects.filter(
                order=order, delivery_partner=user
            ).exists()

            if not is_assigned and not user.is_staff:
                return Response(
                    {'error': 'Permission denied. You are not assigned to this delivery.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if order.status in ['DELIVERED', 'CANCELLED']:
                return Response(
                    {'error': f"Cannot update GPS location for an order that is already {order.status}."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Auto-detect active delivery task
            active_assignment = DeliveryAssignment.objects.filter(
                delivery_partner=user,
                status__in=['ASSIGNED', 'ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP']
            ).first()
            order = active_assignment.order if active_assignment else partner.active_order
            if order and order.status in ['DELIVERED', 'CANCELLED']:
                order = None

        now = timezone.now()

        # 3. Frequency Throttling (Reject/Acknowledge bursts under 1 second)
        if partner.last_location_updated_at and (now - partner.last_location_updated_at).total_seconds() < 1.0:
            return Response({
                'status': 'throttled',
                'message': 'Location update throttled. Maximum rate is 1 update per second.',
                'latitude': float(partner.current_latitude),
                'longitude': float(partner.current_longitude),
                'heading': float(partner.heading)
            }, status=status.HTTP_200_OK)

        # 4. State Persistence
        partner.current_latitude = lat
        partner.current_longitude = lng
        partner.heading = heading
        partner.last_location_updated_at = now
        if battery is not None:
            try:
                partner.battery_percentage = int(battery)
            except Exception:
                pass
        partner.save(update_fields=['current_latitude', 'current_longitude', 'heading', 'last_location_updated_at', 'battery_percentage', 'updated_at'])

        if order:
            order.rider_lat = lat
            order.rider_lng = lng
            order.rider_heading = heading
            order.last_location_updated_at = now
            order.save(update_fields=['rider_lat', 'rider_lng', 'rider_heading', 'last_location_updated_at', 'updated_at'])

            # 5. Real-Time Broadcast via Channels / WebSocket
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                from apps.orders.realtime import build_event_envelope
                channel_layer = get_channel_layer()
                if channel_layer:
                    broadcast_payload = build_event_envelope(
                        event_type='location_update',
                        entity_type='order',
                        entity_id=order.id,
                        entity_version=int(now.timestamp() * 1000),
                        idempotency_key=f"loc_{order.id}_{int(now.timestamp())}",
                        data={
                            'order_id': order.id,
                            'order_number': order.order_number,
                            'order_status': order.status,
                            'latitude': lat,
                            'longitude': lng,
                            'heading': heading,
                            'partner_name': user.get_full_name() or user.username,
                            'is_live': True,
                            'server_timestamp': now.isoformat()
                        }
                    )
                    # Legacy top-level fields
                    broadcast_payload.update({
                        'type': 'location_update',
                        'order_id': order.id,
                        'order_number': order.order_number,
                        'order_status': order.status,
                        'latitude': lat,
                        'longitude': lng,
                        'heading': heading,
                        'timestamp': now.isoformat(),
                        'partner_name': user.get_full_name() or user.username,
                        'is_live': True
                    })

                    async_to_sync(channel_layer.group_send)(
                        f"order_tracking_{order.id}",
                        {
                            'type': 'tracking_event',
                            'payload': broadcast_payload
                        }
                    )
                    async_to_sync(channel_layer.group_send)(
                        "wsfood_live_ecosystem",
                        {
                            'type': 'ecosystem_event',
                            'payload': broadcast_payload
                        }
                    )
            except Exception:
                pass

        return Response({
            'status': 'updated',
            'order_id': order.id if order else None,
            'latitude': float(partner.current_latitude),
            'longitude': float(partner.current_longitude),
            'heading': float(partner.heading),
            'battery': partner.battery_percentage,
            'updated_at': now.isoformat()
        }, status=status.HTTP_200_OK)


class DeliveryRequestsView(APIView):
    """Phase 29 Hardened: Delivery Requests Queue for Authenticated Riders."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, 'role', '') not in ['DELIVERY', 'RIDER'] and not user.is_staff:
            return Response({'error': 'Permission denied. Only delivery partners can access the request queue.'}, status=status.HTTP_403_FORBIDDEN)

        available_orders = Order.objects.filter(
            status__in=['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'READY'],
            rider__isnull=True
        ).order_by('-created_at')
        return Response(OrderSerializer(available_orders, many=True).data)


class DeliveryAcceptOrderView(APIView):
    """POST requests/<pk>/accept/ — hardened legacy acceptance.

    Enforces the same eligibility as the job flow, records a real
    DeliveryAssignment row, and never jumps the order status (assignment
    tracks ACCEPTED; pickup/delivery transitions happen on their own views).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from django.db import transaction as _txn
        partner = get_partner_profile(request.user)
        if not partner:
            return Response({'error': 'No active delivery partner profile found for user.'}, status=status.HTTP_403_FORBIDDEN)

        is_eligible, err, err_code = validate_rider_eligibility(
            partner, request.user, check_availability=True)
        if not is_eligible:
            return Response({'error': err}, status=err_code)

        with _txn.atomic():
            order = Order.objects.select_for_update().filter(pk=pk).first()
            if not order:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            if order.status not in ('READY_FOR_PICKUP', 'READY'):
                return Response(
                    {'error': f'Order is not ready for pickup (current status: {order.status}).'},
                    status=status.HTTP_400_BAD_REQUEST)
            if order.rider and order.rider_id != request.user.id:
                return Response({'error': 'Order already assigned to another partner.'},
                                status=status.HTTP_409_CONFLICT)
            assignment, _ = DeliveryAssignment.objects.select_for_update().get_or_create(
                order=order, defaults={'status': 'AVAILABLE'})
            if assignment.status in ('ACCEPTED', 'REACHED_RESTAURANT', 'PICKED_UP', 'DELIVERED'):
                if assignment.delivery_partner_id != request.user.id:
                    return Response({'error': 'Order already accepted by another partner.'},
                                    status=status.HTTP_409_CONFLICT)
                return Response({'success': True, 'message': 'Order already accepted.',
                                 'order': OrderSerializer(order).data})
            prev_status = assignment.status
            assignment.status = 'ACCEPTED'
            assignment.delivery_partner = request.user
            assignment.accepted_at = timezone.now()
            assignment.assigned_at = assignment.assigned_at or timezone.now()
            assignment.save()
            order.rider = request.user
            order.save(update_fields=['rider', 'updated_at'])
            partner.active_order = order
            partner.save(update_fields=['active_order', 'updated_at'])
            DeliveryAssignmentHistory.objects.create(
                assignment=assignment, from_status=prev_status, to_status='ACCEPTED',
                actor=request.user, notes='Legacy direct acceptance (validated).')

        return Response({
            'success': True,
            'message': f'Order {order.order_number} accepted! Route locked into HUD.',
            'order': OrderSerializer(order).data
        })


class DeliveryEarningsView(APIView):
    """Phase 29 Hardened: Confidential Delivery Partner Earnings View."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner = get_or_create_delivery_partner(request.user)
        if not partner:
            return Response({'error': 'Delivery partner profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'today_earnings': float(partner.today_earnings),
            'weekly_earnings': float(partner.weekly_earnings),
            'total_earnings': float(partner.total_earnings),
            'tips_earned': float(partner.tips_earned),
            'total_deliveries': partner.total_deliveries,
            'rating': float(partner.rating),
            'bonus_unlocked': True,
            'next_bonus_milestone': '3 more deliveries to claim ₹350 Surge Bonus',
            # Phase 3A (additive): authoritative ledger summary. Legacy
            # counter fields above are preserved for backward compatibility.
            'ledger': _rider_ledger_summary(request.user),
        })
