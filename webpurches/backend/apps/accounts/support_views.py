import os
import secrets
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count
from django.http import FileResponse, Http404
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.accounts.models import (
    SupportTicket, TicketMessage, TicketAttachment,
    TicketAuditLog, User
)
from apps.accounts.support_serializers import (
    SupportTicketListSerializer, SupportTicketDetailSerializer,
    SupportTicketCreateSerializer, TicketMessageSerializer,
    TicketAttachmentSerializer, validate_support_file
)
from apps.orders.models import Order
from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner
from apps.notifications.dispatcher import safe_dispatch_on_commit


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


def generate_ticket_number():
    """Generates a human-friendly unique ticket number e.g. TKT-20261010-A9F2"""
    date_str = timezone.now().strftime("%Y%m%d")
    random_suffix = secrets.token_hex(2).upper()
    return f"TKT-{date_str}-{random_suffix}"


def get_user_role(user):
    """Returns canonical role for user."""
    if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
        return 'ADMIN'
    return getattr(user, 'role', 'CUSTOMER') or 'CUSTOMER'


# -----------------------------------------------------------------------------
# Customer Support Endpoints
# -----------------------------------------------------------------------------

class CustomerTicketListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'support'
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        qs = SupportTicket.objects.filter(user=request.user)
        
        status_param = request.query_params.get('status')
        if status_param and status_param.upper() != 'ALL':
            qs = qs.filter(status=status_param.upper())
            
        category_param = request.query_params.get('category')
        if category_param and category_param.upper() != 'ALL':
            qs = qs.filter(category=category_param.upper())

        search_query = request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(ticket_number__icontains=search_query) |
                Q(subject__icontains=search_query) |
                Q(order_id__icontains=search_query) |
                Q(linked_order__order_number__icontains=search_query)
            )

        paginator = self.pagination_class()
        paginated_qs = paginator.paginate_queryset(qs, request)
        serializer = SupportTicketListSerializer(paginated_qs, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        idempotency_key = request.data.get('idempotency_key')
        if idempotency_key:
            existing = SupportTicket.objects.filter(
                user=request.user,
                idempotency_key=idempotency_key
            ).first()
            if existing:
                serializer = SupportTicketDetailSerializer(existing, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = SupportTicketCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        resolved_order = validated_data.get('resolved_order')
        evidence_file = validated_data.get('evidence_file')
        subject = validated_data.get('subject')
        description = validated_data.get('description', '')
        category = validated_data.get('category')
        priority = validated_data.get('priority', 'NORMAL')

        with transaction.atomic():
            # Generate unique ticket number
            ticket_number = generate_ticket_number()
            while SupportTicket.objects.filter(ticket_number=ticket_number).exists():
                ticket_number = generate_ticket_number()

            ticket = SupportTicket.objects.create(
                ticket_number=ticket_number,
                user=request.user,
                linked_order=resolved_order,
                order_id=resolved_order.order_number if resolved_order else '',
                restaurant=resolved_order.restaurant if resolved_order else None,
                delivery_partner=getattr(resolved_order, 'assigned_partner', None) if resolved_order else None,
                subject=subject,
                description=description,
                category=category,
                priority=priority,
                status='OPEN',
                idempotency_key=idempotency_key or ''
            )

            # Create initial message if description or file exists
            init_msg = None
            if description or evidence_file:
                init_msg = TicketMessage.objects.create(
                    ticket=ticket,
                    sender=request.user,
                    sender_role='CUSTOMER',
                    message=description or "Support ticket opened with attached evidence.",
                    is_internal_note=False
                )

            # Attach evidence file if provided
            if evidence_file:
                TicketAttachment.objects.create(
                    ticket=ticket,
                    message=init_msg,
                    uploaded_by=request.user,
                    file=evidence_file,
                    file_name=evidence_file.name,
                    file_size=evidence_file.size,
                    mime_type=getattr(evidence_file, 'content_type', 'application/octet-stream')
                )

            # Audit log
            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='CREATED',
                to_status='OPEN',
                notes=f"Ticket #{ticket_number} created by customer {request.user.username}.",
                details={'category': category, 'priority': priority, 'order': resolved_order.order_number if resolved_order else None}
            )

            # Safe transactional notification to customer
            safe_dispatch_on_commit(
                user=request.user,
                event_type='support.ticket_created',
                context={
                    'ticket_number': ticket.ticket_number,
                    'subject': ticket.subject
                },
                related_resource_type='support_ticket',
                related_resource_id=str(ticket.id)
            )

        resp_serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(resp_serializer.data, status=status.HTTP_201_CREATED)


class CustomerTicketDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number, user=request.user).first()
        if not ticket:
            return Response({"detail": "Ticket not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class CustomerTicketReplyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number, user=request.user).first()
        if not ticket:
            return Response({"detail": "Ticket not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.status == 'CLOSED':
            return Response({"detail": "Cannot reply to a closed ticket."}, status=status.HTTP_400_BAD_REQUEST)

        message_text = request.data.get('message', '').strip()
        evidence_file = request.FILES.get('evidence_file') or request.FILES.get('file')

        if not message_text and not evidence_file:
            return Response({"message": "Message text or file attachment is required."}, status=status.HTTP_400_BAD_REQUEST)

        if evidence_file:
            try:
                validate_support_file(evidence_file)
            except Exception as e:
                return Response({"file": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = ticket.status
            # If ticket was waiting for customer response, move back to IN_PROGRESS
            if ticket.status == 'WAITING_CUSTOMER':
                ticket.status = 'IN_PROGRESS'
                ticket.save(update_fields=['status', 'updated_at'])

            msg = TicketMessage.objects.create(
                ticket=ticket,
                sender=request.user,
                sender_role='CUSTOMER',
                message=message_text or "Evidence attachment uploaded.",
                is_internal_note=False
            )

            if evidence_file:
                TicketAttachment.objects.create(
                    ticket=ticket,
                    message=msg,
                    uploaded_by=request.user,
                    file=evidence_file,
                    file_name=evidence_file.name,
                    file_size=evidence_file.size,
                    mime_type=getattr(evidence_file, 'content_type', 'application/octet-stream')
                )

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='REPLY_ADDED',
                from_status=old_status,
                to_status=ticket.status,
                notes=f"Customer reply added to ticket #{ticket_number}."
            )

            # Notify assigned agent if any
            if ticket.assigned_agent:
                safe_dispatch_on_commit(
                    user=ticket.assigned_agent,
                    event_type='support.ticket_replied',
                    context={
                        'ticket_number': ticket.ticket_number,
                        'sender_name': request.user.username
                    },
                    related_resource_type='support_ticket',
                    related_resource_id=str(ticket.id)
                )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CustomerTicketResolutionConfirmView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number, user=request.user).first()
        if not ticket:
            return Response({"detail": "Ticket not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', 'confirm_resolve')
        notes = request.data.get('notes', '').strip()

        with transaction.atomic():
            old_status = ticket.status
            if action == 'confirm_resolve':
                if ticket.status not in ['RESOLVED', 'IN_PROGRESS', 'WAITING_CUSTOMER']:
                    return Response({"detail": f"Cannot close ticket currently in {ticket.status} status."}, status=status.HTTP_400_BAD_REQUEST)
                ticket.status = 'CLOSED'
                ticket.save(update_fields=['status', 'updated_at'])

                TicketMessage.objects.create(
                    ticket=ticket,
                    sender=request.user,
                    sender_role='CUSTOMER',
                    message=f"Customer confirmed resolution and closed the ticket. {notes}".strip(),
                    is_internal_note=False
                )

                TicketAuditLog.objects.create(
                    ticket=ticket,
                    actor=request.user,
                    action='CLOSED',
                    from_status=old_status,
                    to_status='CLOSED',
                    notes="Resolution confirmed by customer."
                )

                safe_dispatch_on_commit(
                    user=request.user,
                    event_type='support.ticket_closed',
                    context={'ticket_number': ticket.ticket_number},
                    related_resource_type='support_ticket',
                    related_resource_id=str(ticket.id)
                )

            elif action == 'reopen':
                if ticket.status != 'RESOLVED':
                    return Response({"detail": "Only resolved tickets can be reopened."}, status=status.HTTP_400_BAD_REQUEST)
                ticket.status = 'IN_PROGRESS'
                ticket.save(update_fields=['status', 'updated_at'])

                TicketMessage.objects.create(
                    ticket=ticket,
                    sender=request.user,
                    sender_role='CUSTOMER',
                    message=f"Customer reopened the dispute: {notes or 'Issue remains unresolved.'}",
                    is_internal_note=False
                )

                TicketAuditLog.objects.create(
                    ticket=ticket,
                    actor=request.user,
                    action='REOPENED',
                    from_status='RESOLVED',
                    to_status='IN_PROGRESS',
                    notes=f"Reopened by customer. Reason: {notes}"
                )
            else:
                return Response({"detail": "Invalid action. Supported: confirm_resolve, reopen."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class CustomerEligibleOrdersView(views.APIView):
    """Returns recent customer orders eligible for dispute linking."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user).order_by('-created_at')[:25]
        data = []
        for o in orders:
            data.append({
                'id': o.id,
                'order_number': o.order_number,
                'restaurant_name': o.restaurant.name if o.restaurant else 'N/A',
                'status': o.status,
                'payment_status': o.payment_status,
                'total_amount': str(o.grand_total if hasattr(o, 'grand_total') else getattr(o, 'total', 0)),
                'created_at': o.created_at
            })
        return Response(data)


# -----------------------------------------------------------------------------
# Restaurant Support Views (Port 3001)
# -----------------------------------------------------------------------------

class RestaurantTicketListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant and not request.user.is_staff:
            return Response({"detail": "Not authorized as restaurant owner."}, status=status.HTTP_403_FORBIDDEN)

        qs = SupportTicket.objects.filter(
            Q(restaurant=restaurant) | Q(linked_order__restaurant=restaurant)
        ).distinct()

        status_param = request.query_params.get('status')
        if status_param and status_param.upper() != 'ALL':
            qs = qs.filter(status=status_param.upper())

        search_query = request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(ticket_number__icontains=search_query) |
                Q(subject__icontains=search_query) |
                Q(order_id__icontains=search_query)
            )

        paginator = self.pagination_class()
        paginated_qs = paginator.paginate_queryset(qs, request)
        serializer = SupportTicketListSerializer(paginated_qs, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class RestaurantTicketDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ticket_number):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        ticket = SupportTicket.objects.filter(
            Q(ticket_number=ticket_number) &
            (Q(restaurant=restaurant) | Q(linked_order__restaurant=restaurant))
        ).first()

        if not ticket and not request.user.is_staff:
            return Response({"detail": "Ticket not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class RestaurantTicketReplyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_number):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        ticket = SupportTicket.objects.filter(
            Q(ticket_number=ticket_number) &
            (Q(restaurant=restaurant) | Q(linked_order__restaurant=restaurant))
        ).first()

        if not ticket and not request.user.is_staff:
            return Response({"detail": "Ticket not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        message_text = request.data.get('message', '').strip()
        evidence_file = request.FILES.get('evidence_file') or request.FILES.get('file')

        if not message_text and not evidence_file:
            return Response({"message": "Message text or evidence attachment required."}, status=status.HTTP_400_BAD_REQUEST)

        if evidence_file:
            try:
                validate_support_file(evidence_file)
            except Exception as e:
                return Response({"file": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            msg = TicketMessage.objects.create(
                ticket=ticket,
                sender=request.user,
                sender_role='RESTAURANT',
                message=message_text or "Kitchen evidence uploaded.",
                is_internal_note=False
            )

            if evidence_file:
                TicketAttachment.objects.create(
                    ticket=ticket,
                    message=msg,
                    uploaded_by=request.user,
                    file=evidence_file,
                    file_name=evidence_file.name,
                    file_size=evidence_file.size,
                    mime_type=getattr(evidence_file, 'content_type', 'application/octet-stream')
                )

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='RESTAURANT_RESPONSE',
                notes=f"Restaurant '{restaurant.name if restaurant else 'Kitchen'}' submitted factual dispute response."
            )

            # Notify customer
            safe_dispatch_on_commit(
                user=ticket.user,
                event_type='support.ticket_replied',
                context={
                    'ticket_number': ticket.ticket_number,
                    'sender_name': restaurant.name if restaurant else 'Restaurant Partner'
                },
                related_resource_type='support_ticket',
                related_resource_id=str(ticket.id)
            )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# -----------------------------------------------------------------------------
# Delivery Partner Support Views (Port 3002)
# -----------------------------------------------------------------------------

class DeliveryTicketListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        partner = DeliveryPartner.objects.filter(user=request.user).first()
        if not partner and not request.user.is_staff:
            return Response({"detail": "Not authorized as delivery partner."}, status=status.HTTP_403_FORBIDDEN)

        # Find tickets linked to partner or orders assigned to partner
        qs = SupportTicket.objects.filter(
            Q(delivery_partner=partner) |
            Q(linked_order__delivery_assignment__delivery_partner=request.user) |
            Q(linked_order__rider=request.user) |
            Q(linked_order__delivery_issues__reporter=request.user)
        ).distinct()

        status_param = request.query_params.get('status')
        if status_param and status_param.upper() != 'ALL':
            qs = qs.filter(status=status_param.upper())

        paginator = self.pagination_class()
        paginated_qs = paginator.paginate_queryset(qs, request)
        serializer = SupportTicketListSerializer(paginated_qs, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class DeliveryTicketDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ticket_number):
        partner = DeliveryPartner.objects.filter(user=request.user).first()
        ticket = SupportTicket.objects.filter(
            Q(ticket_number=ticket_number) &
            (
                Q(delivery_partner=partner) |
                Q(linked_order__delivery_assignment__delivery_partner=request.user) |
                Q(linked_order__rider=request.user) |
                Q(linked_order__delivery_issues__reporter=request.user)
            )
        ).distinct().first()

        if not ticket and not request.user.is_staff:
            return Response({"detail": "Ticket not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class DeliveryTicketReplyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_number):
        partner = DeliveryPartner.objects.filter(user=request.user).first()
        ticket = SupportTicket.objects.filter(
            Q(ticket_number=ticket_number) &
            (
                Q(delivery_partner=partner) |
                Q(linked_order__delivery_assignment__delivery_partner=request.user) |
                Q(linked_order__rider=request.user) |
                Q(linked_order__delivery_issues__reporter=request.user)
            )
        ).distinct().first()

        if not ticket and not request.user.is_staff:
            return Response({"detail": "Ticket not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        message_text = request.data.get('message', '').strip()
        evidence_file = request.FILES.get('evidence_file') or request.FILES.get('file')

        if not message_text and not evidence_file:
            return Response({"message": "Message text or delivery proof required."}, status=status.HTTP_400_BAD_REQUEST)

        if evidence_file:
            try:
                validate_support_file(evidence_file)
            except Exception as e:
                return Response({"file": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            msg = TicketMessage.objects.create(
                ticket=ticket,
                sender=request.user,
                sender_role='DELIVERY_PARTNER',
                message=message_text or "Delivery handover proof submitted.",
                is_internal_note=False
            )

            if evidence_file:
                TicketAttachment.objects.create(
                    ticket=ticket,
                    message=msg,
                    uploaded_by=request.user,
                    file=evidence_file,
                    file_name=evidence_file.name,
                    file_size=evidence_file.size,
                    mime_type=getattr(evidence_file, 'content_type', 'application/octet-stream')
                )

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='DELIVERY_RESPONSE',
                notes=f"Delivery Partner {request.user.username} submitted factual explanation."
            )

            # Notify customer
            safe_dispatch_on_commit(
                user=ticket.user,
                event_type='support.ticket_replied',
                context={
                    'ticket_number': ticket.ticket_number,
                    'sender_name': f"Courier {request.user.username}"
                },
                related_resource_type='support_ticket',
                related_resource_id=str(ticket.id)
            )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# -----------------------------------------------------------------------------
# Admin / Operations Support Endpoints (Port 3003)
# -----------------------------------------------------------------------------

class IsAdminOrSupportStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN')
        )


class AdminTicketListView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        qs = SupportTicket.objects.all().select_related('user', 'assigned_agent', 'linked_order', 'restaurant')

        # Filter parameters
        status_param = request.query_params.get('status')
        if status_param and status_param.upper() != 'ALL':
            qs = qs.filter(status=status_param.upper())

        priority_param = request.query_params.get('priority')
        if priority_param and priority_param.upper() != 'ALL':
            qs = qs.filter(priority=priority_param.upper())

        category_param = request.query_params.get('category')
        if category_param and category_param.upper() != 'ALL':
            qs = qs.filter(category=category_param.upper())

        agent_id = request.query_params.get('agent_id')
        if agent_id:
            if agent_id == 'unassigned':
                qs = qs.filter(assigned_agent__isnull=True)
            else:
                qs = qs.filter(assigned_agent_id=agent_id)

        search_query = request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(ticket_number__icontains=search_query) |
                Q(subject__icontains=search_query) |
                Q(order_id__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(linked_order__order_number__icontains=search_query)
            )

        # Overview stats calculated from database
        stats = {
            'total_open': SupportTicket.objects.filter(status__in=['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER']).count(),
            'customer_issues': SupportTicket.objects.filter(category__in=['MISSING_ITEMS', 'WRONG_ITEMS', 'DAMAGED_FOOD', 'ACCOUNT_ISSUE']).count(),
            'restaurant_issues': SupportTicket.objects.filter(restaurant__isnull=False).count(),
            'delivery_issues': SupportTicket.objects.filter(category='DELIVERY_DELAY').count(),
            'escalated_count': SupportTicket.objects.filter(status='ESCALATED').count(),
            'urgent_count': SupportTicket.objects.filter(priority='URGENT').count()
        }

        paginator = self.pagination_class()
        paginated_qs = paginator.paginate_queryset(qs, request)
        serializer = SupportTicketListSerializer(paginated_qs, many=True, context={'request': request})
        resp = paginator.get_paginated_response(serializer.data)
        resp.data['stats'] = stats
        return resp


class AdminTicketDetailView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]

    def get(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class AdminTicketReplyView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        message_text = request.data.get('message', '').strip()
        is_internal_note = request.data.get('is_internal_note', False)
        if isinstance(is_internal_note, str):
            is_internal_note = is_internal_note.lower() in ['true', '1', 'yes']

        evidence_file = request.FILES.get('evidence_file') or request.FILES.get('file')

        if not message_text and not evidence_file:
            return Response({"message": "Message text or file required."}, status=status.HTTP_400_BAD_REQUEST)

        if evidence_file:
            try:
                validate_support_file(evidence_file)
            except Exception as e:
                return Response({"file": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = ticket.status
            # If public reply and currently in OPEN, transition to WAITING_CUSTOMER
            if not is_internal_note and ticket.status in ['OPEN', 'IN_PROGRESS']:
                ticket.status = 'WAITING_CUSTOMER'
                ticket.save(update_fields=['status', 'updated_at'])

            msg = TicketMessage.objects.create(
                ticket=ticket,
                sender=request.user,
                sender_role='SUPPORT_AGENT',
                message=message_text or "Attachment uploaded.",
                is_internal_note=is_internal_note
            )

            if evidence_file:
                TicketAttachment.objects.create(
                    ticket=ticket,
                    message=msg,
                    uploaded_by=request.user,
                    file=evidence_file,
                    file_name=evidence_file.name,
                    file_size=evidence_file.size,
                    mime_type=getattr(evidence_file, 'content_type', 'application/octet-stream')
                )

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='INTERNAL_NOTE' if is_internal_note else 'AGENT_REPLY',
                from_status=old_status,
                to_status=ticket.status,
                notes="Internal note recorded." if is_internal_note else "Public reply sent to customer."
            )

            # Only notify customer if this is a public reply (NEVER for internal notes)
            if not is_internal_note:
                safe_dispatch_on_commit(
                    user=ticket.user,
                    event_type='support.ticket_replied',
                    context={
                        'ticket_number': ticket.ticket_number,
                        'sender_name': 'Fast Delivery Support'
                    },
                    related_resource_type='support_ticket',
                    related_resource_id=str(ticket.id)
                )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminTicketAssignView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        agent_id = request.data.get('agent_id')
        agent = None
        if agent_id:
            agent = User.objects.filter(id=agent_id).first()
            if not agent:
                return Response({"detail": "Agent user not found."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_agent = ticket.assigned_agent
            old_status = ticket.status
            ticket.assigned_agent = agent
            if ticket.status == 'OPEN' and agent:
                ticket.status = 'IN_PROGRESS'
            ticket.save(update_fields=['assigned_agent', 'status', 'updated_at'])

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='ASSIGNED',
                from_status=old_status,
                to_status=ticket.status,
                notes=f"Assigned to {agent.username if agent else 'Unassigned'} (previously: {old_agent.username if old_agent else 'None'})."
            )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class AdminTicketEscalateView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({"reason": "Escalation reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = ticket.status
            ticket.status = 'ESCALATED'
            ticket.escalation_reason = reason
            ticket.escalated_at = timezone.now()
            ticket.escalated_by = request.user
            ticket.save(update_fields=['status', 'escalation_reason', 'escalated_at', 'escalated_by', 'updated_at'])

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='ESCALATED',
                from_status=old_status,
                to_status='ESCALATED',
                notes=f"Escalated by {request.user.username}. Reason: {reason}"
            )

            # Notify customer of priority handling
            safe_dispatch_on_commit(
                user=ticket.user,
                event_type='support.ticket_escalated',
                context={
                    'ticket_number': ticket.ticket_number,
                    'reason': reason
                },
                related_resource_type='support_ticket',
                related_resource_id=str(ticket.id)
            )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class AdminTicketResolveView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        resolution_summary = request.data.get('resolution_summary', '').strip()
        if not resolution_summary:
            return Response(
                {"resolution_summary": "A clear resolution summary is required before resolving a ticket."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            old_status = ticket.status
            ticket.status = 'RESOLVED'
            ticket.resolution_summary = resolution_summary
            ticket.resolved_at = timezone.now()
            ticket.save(update_fields=['status', 'resolution_summary', 'resolved_at', 'updated_at'])

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='RESOLVED',
                from_status=old_status,
                to_status='RESOLVED',
                notes=f"Resolved by {request.user.username}. Summary: {resolution_summary}"
            )

            # Transactional notification to customer
            safe_dispatch_on_commit(
                user=ticket.user,
                event_type='support.ticket_resolved',
                context={
                    'ticket_number': ticket.ticket_number,
                    'resolution_summary': resolution_summary[:100]
                },
                related_resource_type='support_ticket',
                related_resource_id=str(ticket.id)
            )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class AdminTicketCloseView(views.APIView):
    permission_classes = [IsAdminOrSupportStaff]

    def post(self, request, ticket_number):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        notes = request.data.get('notes', '').strip()
        with transaction.atomic():
            old_status = ticket.status
            ticket.status = 'CLOSED'
            ticket.save(update_fields=['status', 'updated_at'])

            TicketAuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action='CLOSED',
                from_status=old_status,
                to_status='CLOSED',
                notes=f"Closed by admin {request.user.username}. {notes}".strip()
            )

            safe_dispatch_on_commit(
                user=ticket.user,
                event_type='support.ticket_closed',
                context={'ticket_number': ticket.ticket_number},
                related_resource_type='support_ticket',
                related_resource_id=str(ticket.id)
            )

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data)


class AdminAutoEscalateView(views.APIView):
    """
    Automated SLA sweep fallback: escalates aging open tickets (>24 hours) or urgent tickets unattended.
    """
    permission_classes = [IsAdminOrSupportStaff]

    def post(self, request):
        cutoff_hours = int(request.data.get('hours', 24))
        cutoff_time = timezone.now() - timedelta(hours=cutoff_hours)

        stale_tickets = SupportTicket.objects.filter(
            status__in=['OPEN', 'IN_PROGRESS'],
            created_at__lte=cutoff_time
        ).exclude(status='ESCALATED')

        escalated_count = 0
        with transaction.atomic():
            for t in stale_tickets:
                t.status = 'ESCALATED'
                t.escalation_reason = f"Automated SLA breach: Unresolved after {cutoff_hours}h."
                t.escalated_at = timezone.now()
                t.escalated_by = request.user
                t.save(update_fields=['status', 'escalation_reason', 'escalated_at', 'escalated_by', 'updated_at'])

                TicketAuditLog.objects.create(
                    ticket=t,
                    actor=request.user,
                    action='ESCALATED',
                    to_status='ESCALATED',
                    notes=f"Auto-escalated due to exceeding {cutoff_hours}h SLA limit."
                )
                escalated_count += 1

        return Response({
            "message": f"Escalated {escalated_count} stale tickets exceeding {cutoff_hours} hours SLA.",
            "escalated_count": escalated_count
        })


# -----------------------------------------------------------------------------
# Protected Attachment Download
# -----------------------------------------------------------------------------

class TicketAttachmentDownloadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ticket_number, attachment_id):
        ticket = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not ticket:
            raise Http404("Ticket not found.")

        # Permission check: customer, admin, assigned restaurant or assigned rider
        user = request.user
        is_creator = ticket.user_id == user.id
        is_staff = user.is_staff or getattr(user, 'role', '') == 'ADMIN'
        is_restaurant = ticket.restaurant and ticket.restaurant.owner_id == user.id
        is_delivery = ticket.delivery_partner and ticket.delivery_partner.user_id == user.id

        if not (is_creator or is_staff or is_restaurant or is_delivery):
            return Response({"detail": "Unauthorized to access this attachment."}, status=status.HTTP_403_FORBIDDEN)

        attachment = TicketAttachment.objects.filter(id=attachment_id, ticket=ticket).first()
        if not attachment or not attachment.file:
            raise Http404("Attachment not found.")

        # Check if attachment belongs to internal note
        if attachment.message and attachment.message.is_internal_note and not is_staff:
            return Response({"detail": "Unauthorized to access internal note attachments."}, status=status.HTTP_403_FORBIDDEN)

        try:
            return FileResponse(attachment.file.open('rb'), content_type=attachment.mime_type, as_attachment=True, filename=attachment.file_name)
        except Exception as e:
            return Response({"detail": f"Error accessing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
