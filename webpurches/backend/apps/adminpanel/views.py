import csv
from decimal import Decimal
from datetime import datetime, timedelta

from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db import transaction
from django.http import HttpResponse
from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.accounts.models import User, Profile, AuditLog
from apps.products.models import Restaurant, FoodItem
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment
from .models import PlatformConfig
from .permissions import IsAdminUser, create_admin_audit_log
from .serializers import (
    AdminCustomerSerializer, AdminCustomerDetailSerializer,
    AdminRestaurantSerializer, AdminRestaurantDetailSerializer,
    AdminPartnerSerializer, AdminPartnerDetailSerializer,
    AdminOrderSerializer, AdminOrderDetailSerializer,
    AdminPaymentSerializer, AdminAuditLogSerializer,
    PlatformConfigSerializer
)
from apps.notifications.dispatcher import safe_dispatch_on_commit


def to_bool(val, default=True):
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ('true', '1', 'yes', 't')


class StandardAdminPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'results': data
        })


# ===========================================================================
# 1. Overview & Analytics
# ===========================================================================

class AdminOverviewKPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        # Date range filter if supplied
        days = int(request.query_params.get('days', 7))
        days = min(max(days, 3), 90)

        # Customer & Partner Metrics
        total_customers = User.objects.filter(role='CUSTOMER').count()
        total_restaurants = Restaurant.objects.count()
        pending_restaurant_apps = Restaurant.objects.filter(verification_status='PENDING').count()
        
        total_partners = DeliveryPartner.objects.count()
        online_partners = DeliveryPartner.objects.filter(is_online=True).count()
        pending_partner_apps = DeliveryPartner.objects.filter(verification_status='PENDING').count()

        # Order Metrics
        all_orders = Order.objects.all()
        total_orders = all_orders.count()
        active_orders = all_orders.exclude(status__in=['DELIVERED', 'CANCELLED']).count()
        completed_orders = all_orders.filter(status='DELIVERED').count()
        cancelled_orders = all_orders.filter(status='CANCELLED').count()

        # Revenue & Payments
        total_revenue_aggr = all_orders.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s']
        total_revenue = float(total_revenue_aggr or 0.0)

        today_orders = all_orders.filter(created_at__date=today)
        today_revenue = float(today_orders.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s'] or 0.0)

        paid_payments = Payment.objects.filter(status='PAID')
        paid_total = float(paid_payments.aggregate(s=Sum('amount'))['s'] or 0.0)
        paid_count = paid_payments.count()
        failed_count = Payment.objects.filter(status='FAILED').count()
        pending_payment_count = Payment.objects.filter(status__in=['PAYMENT_PENDING', 'PENDING', 'PAYMENT_PROCESSING']).count()

        # Order status distribution
        status_dist = list(all_orders.values('status').annotate(count=Count('id')).order_by('-count'))

        # Payment status distribution
        payment_dist = list(Payment.objects.values('status').annotate(count=Count('id')).order_by('-count'))

        # Orders over time trend
        trend_days = []
        for i in range(days - 1, -1, -1):
            day = today - timedelta(days=i)
            day_orders = all_orders.filter(created_at__date=day)
            day_count = day_orders.count()
            day_rev = float(day_orders.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s'] or 0.0)
            trend_days.append({
                'date': day.strftime('%Y-%m-%d'),
                'display': day.strftime('%d %b'),
                'order_count': day_count,
                'revenue': day_rev
            })

        # Recent orders queue
        recent_orders_qs = all_orders.select_related('customer', 'restaurant', 'rider').order_by('-created_at')[:8]
        recent_orders = AdminOrderSerializer(recent_orders_qs, many=True).data

        # Pending restaurant approvals queue
        pending_restaurants_qs = Restaurant.objects.filter(verification_status='PENDING').select_related('owner').order_by('-created_at')[:5]
        pending_restaurants = AdminRestaurantSerializer(pending_restaurants_qs, many=True).data

        # Available Delivery Partners
        fleet_overview = DeliveryPartner.objects.select_related('user').order_by('-is_online', '-rating')[:6]
        fleet_data = AdminPartnerSerializer(fleet_overview, many=True).data

        return Response({
            'kpis': {
                'total_customers': total_customers,
                'total_restaurants': total_restaurants,
                'pending_restaurant_applications': pending_restaurant_apps,
                'total_delivery_partners': total_partners,
                'online_delivery_partners': online_partners,
                'pending_partner_applications': pending_partner_apps,
                'total_orders': total_orders,
                'active_orders': active_orders,
                'completed_orders': completed_orders,
                'cancelled_orders': cancelled_orders,
                'total_revenue': total_revenue,
                'today_revenue': today_revenue,
                'payments': {
                    'paid_total': paid_total,
                    'paid_count': paid_count,
                    'failed_count': failed_count,
                    'pending_count': pending_payment_count
                }
            },
            'orders_over_time': trend_days,
            'order_status_distribution': status_dist,
            'payment_status_distribution': payment_dist,
            'recent_orders': recent_orders,
            'pending_restaurants': pending_restaurants,
            'delivery_fleet_overview': fleet_data
        })


# ===========================================================================
# 2. Customer Management
# ===========================================================================

class AdminCustomerListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardAdminPagination

    def get(self, request):
        queryset = User.objects.filter(role='CUSTOMER').select_related('profile').prefetch_related('food_orders').order_by('-date_joined')

        # Search
        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(username__icontains=q) |
                Q(email__icontains=q) |
                Q(phone__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            )

        # Status filter
        is_active = request.query_params.get('is_active')
        if is_active in ['true', '1']:
            queryset = queryset.filter(is_active=True)
        elif is_active in ['false', '0']:
            queryset = queryset.filter(is_active=False)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminCustomerSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminCustomerDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        customer = User.objects.filter(id=pk, role='CUSTOMER').select_related('profile').prefetch_related('addresses', 'food_orders').first()
        if not customer:
            return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminCustomerDetailSerializer(customer).data)


class AdminCustomerToggleStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        customer = User.objects.filter(id=pk).first()
        if not customer:
            return Response({'error': 'Customer account not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Self-lockout protection
        if customer.id == request.user.id:
            return Response({
                'error': 'Action forbidden: Administrators cannot suspend their own account.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Privileged account protection
        if customer.is_staff or customer.is_superuser or customer.role == 'ADMIN':
            return Response({
                'error': 'Action forbidden: Privileged administrative accounts cannot be suspended via this endpoint.'
            }, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', '').strip()
        if not reason or len(reason) < 3:
            return Response({
                'error': 'A valid justification reason is required for administrative account suspension or reactivation.'
            }, status=status.HTTP_400_BAD_REQUEST)

        raw_active = request.data.get('is_active')
        if raw_active is None:
            is_active = not customer.is_active
        else:
            is_active = to_bool(raw_active)

        old_state = customer.is_active
        customer.is_active = is_active
        customer.save(update_fields=['is_active'])

        action_name = 'CUSTOMER_REACTIVATED' if is_active else 'CUSTOMER_SUSPENDED'
        create_admin_audit_log(
            actor=request.user,
            action=action_name,
            target_model='User',
            target_id=str(customer.id),
            details={
                'email': customer.email,
                'username': customer.username,
                'before_is_active': old_state,
                'after_is_active': is_active
            },
            reason=reason,
            request=request
        )

        return Response({
            'success': True,
            'message': f"Customer '{customer.email}' account {'reactivated' if is_active else 'suspended'}.",
            'is_active': customer.is_active,
            'reason': reason
        }, status=status.HTTP_200_OK)


# ===========================================================================
# 3. Restaurant Management
# ===========================================================================

class AdminRestaurantListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardAdminPagination

    def get(self, request):
        queryset = Restaurant.objects.select_related('owner').order_by('-created_at')

        # Search
        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(address__icontains=q) |
                Q(owner_name__icontains=q) |
                Q(owner__email__icontains=q)
            )

        # Verification Status filter
        ver_status = request.query_params.get('verification_status')
        if ver_status and ver_status.upper() != 'ALL':
            queryset = queryset.filter(verification_status=ver_status.upper())

        # Open / Closed filter
        is_open = request.query_params.get('is_open')
        if is_open in ['true', '1']:
            queryset = queryset.filter(is_open=True)
        elif is_open in ['false', '0']:
            queryset = queryset.filter(is_open=False)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminRestaurantSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminRestaurantDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        restaurant = Restaurant.objects.filter(id=pk).select_related('owner').prefetch_related('foods', 'orders').first()
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminRestaurantDetailSerializer(restaurant).data)


class AdminRestaurantVerifyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        restaurant = Restaurant.objects.filter(id=pk).select_related('owner').first()
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '').strip().upper()
        if new_status not in ['APPROVED', 'REJECTED']:
            return Response({'error': "Invalid status. Must be 'APPROVED' or 'REJECTED'."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '').strip()
        if not reason or len(reason) < 3:
            return Response({'error': 'A justification reason is required for verification status modification.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_ver = restaurant.verification_status
            restaurant.verification_status = new_status
            restaurant.is_verified = (new_status == 'APPROVED')
            restaurant.save(update_fields=['verification_status', 'is_verified', 'updated_at'])

            # Synchronize owner profile
            owner_profile = getattr(restaurant.owner, 'profile', None)
            if owner_profile:
                owner_profile.verification_status = new_status
                owner_profile.is_verified = (new_status == 'APPROVED')
                owner_profile.save(update_fields=['verification_status', 'is_verified'])

            create_admin_audit_log(
                actor=request.user,
                action=f"RESTAURANT_{new_status}",
                target_model='Restaurant',
                target_id=str(restaurant.id),
                details={
                    'restaurant_name': restaurant.name,
                    'owner_email': restaurant.owner.email,
                    'from_status': old_ver,
                    'to_status': new_status
                },
                reason=reason,
                request=request
            )

            if restaurant.owner:
                safe_dispatch_on_commit(
                    user=restaurant.owner,
                    event_type='system.alert',
                    context={
                        'alert_title': f"Restaurant Verification {new_status}",
                        'alert_message': f"Your restaurant '{restaurant.name}' has been {new_status.lower()}. {reason}".strip()
                    },
                    idempotency_key=f"restaurant_verify_{restaurant.id}_{new_status}",
                    related_resource_type='Restaurant',
                    related_resource_id=restaurant.id
                )

        return Response({
            'success': True,
            'message': f"Restaurant '{restaurant.name}' application marked as {new_status}.",
            'verification_status': restaurant.verification_status,
            'is_verified': restaurant.is_verified,
            'reason': reason
        })


class AdminRestaurantToggleAccessView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        restaurant = Restaurant.objects.filter(id=pk).select_related('owner').first()
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'Reason is required to toggle restaurant access.'}, status=status.HTTP_400_BAD_REQUEST)

        owner = restaurant.owner
        raw_active = request.data.get('is_active')
        if raw_active is None:
            is_active = not owner.is_active
        else:
            is_active = to_bool(raw_active)

        owner.is_active = is_active
        owner.save(update_fields=['is_active'])

        create_admin_audit_log(
            actor=request.user,
            action='RESTAURANT_ACCESS_MODIFIED',
            target_model='Restaurant',
            target_id=str(restaurant.id),
            details={
                'restaurant_name': restaurant.name,
                'owner_email': owner.email,
                'owner_is_active': is_active
            },
            reason=reason,
            request=request
        )

        return Response({
            'success': True,
            'message': f"Restaurant access {'enabled' if is_active else 'disabled'} for '{restaurant.name}'.",
            'is_active': is_active
        })


class AdminRestaurantCreateView(views.APIView):
    """POST adminpanel/restaurants/create/ — admin adds restaurant + owner (no duplicates)."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        from apps.accounts.serializers import (
            validate_name_field, validate_email_field, validate_phone_field,
            validate_password_strength)
        data = request.data
        try:
            name = (data.get('name') or '').strip()
            if len(name) < 2:
                return Response({'error': 'Restaurant name (min 2 chars) is required.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if Restaurant.objects.filter(name__iexact=name).exists():
                return Response({'error': 'A restaurant with this name already exists.'},
                                status=status.HTTP_400_BAD_REQUEST)
            owner = None
            owner_id = data.get('owner_id')
            if owner_id:
                owner = User.objects.filter(id=owner_id).first()
                if not owner:
                    return Response({'error': 'Owner account not found.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                if Restaurant.objects.filter(owner=owner).exists():
                    return Response({'error': 'This owner already has a restaurant.'},
                                    status=status.HTTP_400_BAD_REQUEST)
            else:
                owner_name = validate_name_field(data.get('owner_name', ''), 'Owner name')
                email = validate_email_field(data.get('email', ''))
                phone = validate_phone_field(data.get('phone', ''))
                validate_password_strength(data.get('password', ''))
                username = (data.get('username') or email.split('@')[0]).strip()[:150]
                if User.objects.filter(username__iexact=username).exists():
                    return Response({'error': 'Username already taken.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                with transaction.atomic():
                    owner = User.objects.create_user(
                        username=username, email=email, password=data.get('password'),
                        role='RESTAURANT', phone=phone)
                    owner.is_active = True
                    owner.save()
                    from apps.accounts.models import Profile, Wallet
                    Profile.objects.get_or_create(
                        user=owner, defaults={'full_name': owner_name,
                                              'verification_status': 'PENDING'})
                    Wallet.objects.get_or_create(user=owner)
            with transaction.atomic():
                restaurant = Restaurant.objects.create(
                    owner=owner,
                    name=name,
                    owner_name=data.get('owner_name', '')[:150] if data.get('owner_name') else owner.username,
                    address=(data.get('address') or '')[:1000],
                    verification_status='PENDING',
                    is_verified=False,
                    is_open=False,
                )
            create_admin_audit_log(
                actor=request.user, action='RESTAURANT_CREATED',
                target_model='Restaurant', target_id=str(restaurant.id),
                details={'restaurant_name': name, 'owner_email': owner.email},
                reason='Admin manual restaurant creation.', request=request)
            return Response({'id': restaurant.id, 'name': restaurant.name,
                             'owner_email': owner.email, 'verification_status': 'PENDING'},
                            status=status.HTTP_201_CREATED)
        except Exception as exc:
            from rest_framework import serializers as _ser
            if isinstance(exc, _ser.ValidationError):
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            raise


# ===========================================================================
# 4. Delivery Partner Management
# ===========================================================================

class AdminPartnerListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardAdminPagination

    def get(self, request):
        queryset = DeliveryPartner.objects.select_related('user', 'active_order').order_by('-created_at')

        # Search
        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(user__username__icontains=q) |
                Q(user__email__icontains=q) |
                Q(user__phone__icontains=q) |
                Q(vehicle_number__icontains=q) |
                Q(vehicle_type__icontains=q)
            )

        # Verification Status filter
        ver_status = request.query_params.get('verification_status')
        if ver_status and ver_status.upper() != 'ALL':
            queryset = queryset.filter(verification_status=ver_status.upper())

        # Online filter
        is_online = request.query_params.get('is_online')
        if is_online in ['true', '1']:
            queryset = queryset.filter(is_online=True)
        elif is_online in ['false', '0']:
            queryset = queryset.filter(is_online=False)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminPartnerSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminPartnerDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        partner = DeliveryPartner.objects.filter(id=pk).select_related('user', 'active_order').first()
        if not partner:
            return Response({'error': 'Delivery partner not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminPartnerDetailSerializer(partner).data)


class AdminPartnerVerifyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        partner = DeliveryPartner.objects.filter(id=pk).select_related('user').first()
        if not partner:
            return Response({'error': 'Delivery partner not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '').strip().upper()
        if new_status not in ['APPROVED', 'REJECTED']:
            return Response({'error': "Invalid status. Must be 'APPROVED' or 'REJECTED'."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '').strip()
        if not reason or len(reason) < 3:
            return Response({'error': 'A justification reason is required for partner onboarding status modification.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_ver = partner.verification_status
            partner.verification_status = new_status
            partner.is_verified = (new_status == 'APPROVED')
            partner.save(update_fields=['verification_status', 'is_verified', 'updated_at'])

            # Sync user profile if present
            profile = getattr(partner.user, 'profile', None)
            if profile:
                profile.verification_status = new_status
                profile.is_verified = (new_status == 'APPROVED')
                profile.save(update_fields=['verification_status', 'is_verified'])

            create_admin_audit_log(
                actor=request.user,
                action=f"DELIVERY_PARTNER_{new_status}",
                target_model='DeliveryPartner',
                target_id=str(partner.id),
                details={
                    'partner_username': partner.user.username,
                    'vehicle_number': partner.vehicle_number,
                    'from_status': old_ver,
                    'to_status': new_status
                },
                reason=reason,
                request=request
            )

        return Response({
            'success': True,
            'message': f"Delivery partner '{partner.user.username}' marked as {new_status}.",
            'verification_status': partner.verification_status,
            'is_verified': partner.is_verified,
            'reason': reason
        })


class AdminPartnerToggleStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        partner = DeliveryPartner.objects.filter(id=pk).select_related('user').first()
        if not partner:
            return Response({'error': 'Delivery partner not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        if not reason or len(reason) < 3:
            return Response({'error': 'Reason is required to suspend or reactivate a partner.'}, status=status.HTTP_400_BAD_REQUEST)

        user = partner.user
        raw_active = request.data.get('is_active')
        if raw_active is None:
            is_active = not user.is_active
        else:
            is_active = to_bool(raw_active)

        user.is_active = is_active
        user.save(update_fields=['is_active'])

        # Safe suspend: cancel unaccepted offers and take offline so no new
        # work is issued. In-flight deliveries are intentionally left intact
        # for the rider to complete (never silently deleted).
        if not is_active:
            from apps.delivery.models import DeliveryOffer, DeliveryPartner as _DP
            DeliveryOffer.objects.filter(
                delivery_partner=user, status='OFFERED').update(status='CANCELLED')
            _DP.objects.filter(user=user).update(is_online=False)

        create_admin_audit_log(
            actor=request.user,
            action='DELIVERY_PARTNER_SUSPENDED' if not is_active else 'DELIVERY_PARTNER_REACTIVATED',
            target_model='DeliveryPartner',
            target_id=str(partner.id),
            details={
                'partner_username': user.username,
                'email': user.email,
                'is_active': is_active
            },
            reason=reason,
            request=request
        )

        return Response({
            'success': True,
            'message': f"Delivery partner '{user.username}' account {'reactivated' if is_active else 'suspended'}.",
            'is_active': is_active
        })


class AdminPartnerCreateView(views.APIView):
    """POST adminpanel/partners/create/ — admin adds partner + user (no duplicates)."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        from apps.accounts.serializers import (
            validate_name_field, validate_email_field, validate_phone_field,
            validate_password_strength)
        data = request.data
        try:
            full_name = validate_name_field(data.get('full_name', ''), 'Full name')
            email = validate_email_field(data.get('email', ''))
            phone = validate_phone_field(data.get('phone', ''))
            validate_password_strength(data.get('password', ''))
            username = (data.get('username') or email.split('@')[0]).strip()[:150]
            if User.objects.filter(username__iexact=username).exists():
                return Response({'error': 'Username already taken.'},
                                status=status.HTTP_400_BAD_REQUEST)
            vehicle_number = (data.get('vehicle_number') or '').upper().replace(' ', '').replace('-', '')
            if vehicle_number and DeliveryPartner.objects.filter(
                    vehicle_number__iexact=vehicle_number).exists():
                return Response({'error': 'Vehicle number already registered.'},
                                status=status.HTTP_400_BAD_REQUEST)
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username, email=email, password=data.get('password'),
                    role='DELIVERY', phone=phone)
                user.is_active = True
                user.save()
                from apps.accounts.models import Profile, Wallet
                Profile.objects.get_or_create(
                    user=user, defaults={'full_name': full_name,
                                          'verification_status': 'PENDING'})
                Wallet.objects.get_or_create(user=user)
                partner = DeliveryPartner.objects.create(
                    user=user,
                    vehicle_type=data.get('vehicle_type', 'Bike')[:32],
                    vehicle_model=data.get('vehicle_model', 'Standard')[:100],
                    vehicle_number=vehicle_number or 'KA-01-AD-%d' % user.id,
                    verification_status='PENDING',
                    is_verified=False,
                )
            create_admin_audit_log(
                actor=request.user, action='DELIVERY_PARTNER_CREATED',
                target_model='DeliveryPartner', target_id=str(partner.id),
                details={'username': username, 'email': email},
                reason='Admin manual partner creation.', request=request)
            return Response({'id': partner.id, 'username': username,
                             'verification_status': 'PENDING'},
                            status=status.HTTP_201_CREATED)
        except Exception as exc:
            from rest_framework import serializers as _ser
            if isinstance(exc, _ser.ValidationError):
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            raise


# ===========================================================================
# 5. Order Management
# ===========================================================================

class AdminOrderListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardAdminPagination

    def get(self, request):
        queryset = Order.objects.select_related('customer', 'restaurant', 'rider').prefetch_related('items').order_by('-created_at')

        # Search
        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(order_number__icontains=q) |
                Q(customer__username__icontains=q) |
                Q(customer__email__icontains=q) |
                Q(customer__phone__icontains=q) |
                Q(restaurant__name__icontains=q)
            )

        # Status filter
        order_status = request.query_params.get('status')
        if order_status and order_status.upper() != 'ALL':
            queryset = queryset.filter(status=order_status.upper())

        # Payment status filter
        payment_status = request.query_params.get('payment_status')
        if payment_status and payment_status.upper() != 'ALL':
            queryset = queryset.filter(payment_status=payment_status.upper())

        # Date range filter
        date_start = request.query_params.get('date_start')
        if date_start:
            try:
                dt_start = datetime.strptime(date_start, '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=dt_start)
            except ValueError:
                pass

        date_end = request.query_params.get('date_end')
        if date_end:
            try:
                dt_end = datetime.strptime(date_end, '%Y-%m-%d') + timedelta(days=1)
                queryset = queryset.filter(created_at__lt=dt_end)
            except ValueError:
                pass

        # Restaurant filter
        restaurant_id = request.query_params.get('restaurant_id')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        # Rider filter
        rider_id = request.query_params.get('rider_id')
        if rider_id:
            queryset = queryset.filter(rider_id=rider_id)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminOrderSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminOrderDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        order = Order.objects.filter(id=pk).select_related(
            'customer', 'restaurant', 'rider'
        ).prefetch_related(
            'items', 'items__food_item', 'status_history', 'status_history__actor', 'payments'
        ).first()
        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminOrderDetailSerializer(order).data)


class AdminOrderStatusInterventionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        order = Order.objects.filter(id=pk).select_related('customer', 'restaurant', 'rider').first()
        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        to_status = request.data.get('to_status', '').strip().upper()
        valid_statuses = dict(Order.STATUS_CHOICES)
        if to_status not in valid_statuses:
            return Response({
                'error': f"Invalid target status '{to_status}'. Valid choices: {list(valid_statuses.keys())}"
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '').strip()
        if not reason or len(reason) < 4:
            return Response({
                'error': 'A detailed administrative justification reason is required for order status intervention.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Prevent bypassing terminal state without explicit administrative cancel/override
        if order.status in ['DELIVERED', 'CANCELLED'] and to_status in ['PLACED', 'ACCEPTED', 'PREPARING']:
            return Response({
                'error': f"Cannot revert order from terminal status '{order.status}' back to preparation stages."
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = order.status
            order.status = to_status
            if to_status == 'CANCELLED':
                order.cancellation_reason = f"[Admin Intervention]: {reason}"
                order.cancelled_by = request.user
            order.save(update_fields=['status', 'cancellation_reason', 'cancelled_by', 'updated_at'])

            # Record in OrderStatusHistory
            OrderStatusHistory.objects.create(
                order=order,
                from_status=old_status,
                to_status=to_status,
                actor=request.user,
                actor_role='ADMIN',
                reason=reason
            )

            # Record in AuditLog
            create_admin_audit_log(
                actor=request.user,
                action='ADMIN_ORDER_STATUS_INTERVENTION',
                target_model='Order',
                target_id=str(order.id),
                details={
                    'order_number': order.order_number,
                    'from_status': old_status,
                    'to_status': to_status
                },
                reason=reason,
                request=request
            )

        return Response({
            'success': True,
            'message': f"Order #{order.order_number} transitioned from {old_status} to {to_status}.",
            'status': order.status,
            'reason': reason
        })


class AdminOrderDelayView(views.APIView):
    """POST adminpanel/orders/<pk>/delay/ — record delay + update ETA (status untouched)."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        from apps.orders.models import OrderDelayRecord
        order = Order.objects.filter(id=pk).select_related('customer', 'restaurant', 'rider').first()
        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        if order.status in ('DELIVERED', 'CANCELLED'):
            return Response({'error': 'Cannot record delays on delivered or cancelled orders.'},
                            status=status.HTTP_400_BAD_REQUEST)

        delay_type = (request.data.get('delay_type') or '').upper()
        if delay_type not in ('KITCHEN', 'PARTNER'):
            return Response({'error': "delay_type must be 'KITCHEN' or 'PARTNER'."},
                            status=status.HTTP_400_BAD_REQUEST)
        reason = (request.data.get('reason') or '').upper()
        valid_reasons = [c[0] for c in OrderDelayRecord.REASONS]
        if reason not in valid_reasons:
            return Response({'error': 'Valid reason required.', 'valid_reasons': valid_reasons},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            new_eta = int(request.data.get('new_eta_minutes'))
        except (TypeError, ValueError):
            return Response({'error': 'new_eta_minutes (integer) is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if new_eta < 0 or new_eta > 480:
            return Response({'error': 'ETA must be between 0 and 480 minutes.'},
                            status=status.HTTP_400_BAD_REQUEST)
        notes = (request.data.get('notes') or '')[:2000]

        with transaction.atomic():
            prev_eta = order.eta_minutes or 0
            order.eta_minutes = new_eta
            order.save(update_fields=['eta_minutes', 'updated_at'])
            record = OrderDelayRecord.objects.create(
                order=order, delay_type=delay_type, reason=reason, notes=notes,
                previous_eta=prev_eta, new_eta=new_eta, recorded_by=request.user)
            OrderStatusHistory.objects.create(
                order=order, from_status=order.status, to_status=order.status,
                actor=request.user, actor_role='ADMIN',
                reason=f"Delay recorded ({delay_type}/{reason}): ETA {prev_eta}->{new_eta}m. {notes}".strip())
            create_admin_audit_log(
                actor=request.user, action='ADMIN_ORDER_DELAY_RECORDED',
                target_model='Order', target_id=str(order.id),
                details={'order_number': order.order_number, 'delay_type': delay_type,
                         'reason': reason, 'previous_eta': prev_eta, 'new_eta': new_eta},
                reason=notes or reason, request=request)

        # Notify customer + relevant kitchen/courier (idempotent).
        try:
            from apps.notifications.dispatcher import safe_dispatch_on_commit
            base = {'order_number': order.order_number,
                    'previous_eta': prev_eta, 'new_eta': new_eta, 'reason': reason}
            safe_dispatch_on_commit(
                order.customer, 'system.alert',
                {'title': 'Delivery delayed',
                 'message': 'Order %s delayed (%s). New ETA: %dm.' % (
                     order.order_number, reason, new_eta)},
                idempotency_key='delay_customer_%d' % record.id)
            if delay_type == 'KITCHEN' and order.restaurant:
                safe_dispatch_on_commit(
                    order.restaurant.owner, 'system.alert',
                    {'title': 'Preparation delay recorded',
                     'message': 'Order %s ETA now %dm.' % (order.order_number, new_eta)},
                    idempotency_key='delay_rest_%d' % record.id)
            if delay_type == 'PARTNER' and order.rider:
                safe_dispatch_on_commit(
                    order.rider, 'system.alert',
                    {'title': 'Delay recorded',
                     'message': 'Order %s ETA now %dm.' % (order.order_number, new_eta)},
                    idempotency_key='delay_rider_%d' % record.id)
        except Exception:
            pass

        return Response({
            'success': True,
            'previous_eta': prev_eta,
            'new_eta': new_eta,
            'delay_id': record.id,
        })


# ===========================================================================
# 6. Payment Management
# ===========================================================================

class AdminPaymentListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardAdminPagination

    def get(self, request):
        queryset = Payment.objects.select_related('order', 'order__customer').order_by('-created_at')

        # Search
        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(provider_order_id__icontains=q) |
                Q(provider_payment_id__icontains=q) |
                Q(order__order_number__icontains=q) |
                Q(order__customer__email__icontains=q)
            )

        # Status filter
        payment_status = request.query_params.get('status')
        if payment_status and payment_status.upper() != 'ALL':
            queryset = queryset.filter(status=payment_status.upper())

        # Payment method filter
        payment_method = request.query_params.get('payment_method')
        if payment_method and payment_method.upper() != 'ALL':
            queryset = queryset.filter(payment_method__icontains=payment_method)

        # Date range
        date_start = request.query_params.get('date_start')
        if date_start:
            try:
                dt_start = datetime.strptime(date_start, '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=dt_start)
            except ValueError:
                pass

        date_end = request.query_params.get('date_end')
        if date_end:
            try:
                dt_end = datetime.strptime(date_end, '%Y-%m-%d') + timedelta(days=1)
                queryset = queryset.filter(created_at__lt=dt_end)
            except ValueError:
                pass

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminPaymentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminPaymentDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        payment = Payment.objects.filter(id=pk).select_related('order', 'order__customer', 'order__restaurant').first()
        if not payment:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminPaymentSerializer(payment).data)


# ===========================================================================
# 7. Reports & Exports
# ===========================================================================

class AdminReportsSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        date_start = request.query_params.get('date_start')
        date_end = request.query_params.get('date_end')

        orders_qs = Order.objects.all()
        payments_qs = Payment.objects.all()

        if date_start:
            try:
                dt_start = datetime.strptime(date_start, '%Y-%m-%d')
                orders_qs = orders_qs.filter(created_at__gte=dt_start)
                payments_qs = payments_qs.filter(created_at__gte=dt_start)
            except ValueError:
                pass

        if date_end:
            try:
                dt_end = datetime.strptime(date_end, '%Y-%m-%d') + timedelta(days=1)
                orders_qs = orders_qs.filter(created_at__lt=dt_end)
                payments_qs = payments_qs.filter(created_at__lt=dt_end)
            except ValueError:
                pass

        total_orders_count = orders_qs.count()
        completed_count = orders_qs.filter(status='DELIVERED').count()
        cancelled_count = orders_qs.filter(status='CANCELLED').count()
        pending_count = total_orders_count - completed_count - cancelled_count

        revenue_completed = float(orders_qs.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s'] or 0.0)

        # Payment status breakdown
        payments_by_status = list(payments_qs.values('status').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-total_amount'))

        # Top restaurants
        top_restaurants = list(orders_qs.filter(status='DELIVERED', restaurant__isnull=False).values(
            'restaurant__id', 'restaurant__name'
        ).annotate(
            order_count=Count('id'),
            total_sales=Sum('grand_total')
        ).order_by('-order_count')[:5])

        return Response({
            'date_range': {
                'start': date_start or (today - timedelta(days=30)).strftime('%Y-%m-%d'),
                'end': date_end or today.strftime('%Y-%m-%d')
            },
            'orders_summary': {
                'total_orders': total_orders_count,
                'completed_orders': completed_count,
                'cancelled_orders': cancelled_count,
                'pending_orders': max(0, pending_count),
                'total_revenue': revenue_completed
            },
            'payments_by_status': payments_by_status,
            'top_restaurants': top_restaurants
        })


class AdminReportsExportCSVView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        report_type = request.query_params.get('report_type', 'orders').lower()
        date_start = request.query_params.get('date_start')
        date_end = request.query_params.get('date_end')
        status_filter = request.query_params.get('status')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')

        writer = csv.writer(response)

        if report_type == 'payments':
            response['Content-Disposition'] = f'attachment; filename="fd_payments_report_{timestamp_str}.csv"'
            writer.writerow([
                'Payment ID', 'Order Number', 'Amount (INR)', 'Status',
                'Method', 'Provider', 'Provider Order ID', 'Verified Timestamp', 'Created Date'
            ])

            qs = Payment.objects.select_related('order').order_by('-created_at')
            if date_start:
                try:
                    qs = qs.filter(created_at__gte=datetime.strptime(date_start, '%Y-%m-%d'))
                except ValueError:
                    pass
            if date_end:
                try:
                    qs = qs.filter(created_at__lt=datetime.strptime(date_end, '%Y-%m-%d') + timedelta(days=1))
                except ValueError:
                    pass
            if status_filter and status_filter.upper() != 'ALL':
                qs = qs.filter(status=status_filter.upper())

            for p in qs[:2000]:
                writer.writerow([
                    p.id,
                    p.order.order_number if p.order else '',
                    float(p.amount),
                    p.status,
                    p.payment_method,
                    p.payment_provider,
                    p.provider_order_id,
                    p.verified_at.strftime('%Y-%m-%d %H:%M:%S') if p.verified_at else 'N/A',
                    p.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        else:
            # Default: Orders CSV Export
            response['Content-Disposition'] = f'attachment; filename="fd_orders_report_{timestamp_str}.csv"'
            writer.writerow([
                'Order ID', 'Order Number', 'Restaurant', 'Customer Initial', 'Grand Total (INR)',
                'Order Status', 'Payment Status', 'Payment Method', 'Items Count', 'Created Date'
            ])

            qs = Order.objects.select_related('customer', 'restaurant').prefetch_related('items').order_by('-created_at')
            if date_start:
                try:
                    qs = qs.filter(created_at__gte=datetime.strptime(date_start, '%Y-%m-%d'))
                except ValueError:
                    pass
            if date_end:
                try:
                    qs = qs.filter(created_at__lt=datetime.strptime(date_end, '%Y-%m-%d') + timedelta(days=1))
                except ValueError:
                    pass
            if status_filter and status_filter.upper() != 'ALL':
                qs = qs.filter(status=status_filter.upper())

            for o in qs[:2000]:
                # Protect customer PII: mask customer name / email
                cust_name = o.customer.get_full_name() or o.customer.username
                masked_cust = (cust_name[0] + '***') if cust_name else 'Customer'

                writer.writerow([
                    o.id,
                    o.order_number,
                    o.restaurant.name if o.restaurant else 'Cloud Kitchen',
                    masked_cust,
                    float(o.grand_total or o.total or 0.0),
                    o.status,
                    o.payment_status,
                    o.payment_method,
                    o.items.count(),
                    o.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        create_admin_audit_log(
            actor=request.user,
            action=f"REPORT_CSV_EXPORT_{report_type.upper()}",
            target_model='Report',
            target_id=report_type,
            details={'date_start': date_start, 'date_end': date_end, 'status': status_filter},
            reason="Authorized administrative CSV dataset export.",
            request=request
        )

        return response


# ===========================================================================
# 8. Platform System Settings
# ===========================================================================

class AdminSystemSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    DEFAULT_SETTINGS = {
        'platform_commission_percentage': 18.0,
        'base_delivery_fee': 35.0,
        'per_km_delivery_fee': 8.0,
        'tax_percentage': 5.0,
        'rider_late_penalty_fee': 50.0,
        'peak_multiplier_lunch': 1.2,
        'peak_multiplier_dinner': 1.5,
        'max_shift_breaks': 2,
        'break_duration_minutes': 15,
        'currency': 'INR (₹)',
        'auto_dispatch_radius_km': 8.5,
        'strict_otp_handover': True
    }

    def get(self, request):
        config_obj = PlatformConfig.objects.filter(key='system_settings').first()
        if not config_obj:
            config_data = self.DEFAULT_SETTINGS
        else:
            config_data = {**self.DEFAULT_SETTINGS, **config_obj.value}

        return Response({
            'settings': config_data,
            'last_updated_at': config_obj.updated_at.isoformat() if config_obj else None,
            'last_updated_by': (config_obj.updated_by.get_full_name() or config_obj.updated_by.username) if (config_obj and config_obj.updated_by) else 'Initial Baseline'
        })

    def patch(self, request):
        config_obj, _ = PlatformConfig.objects.get_or_create(key='system_settings', defaults={'value': self.DEFAULT_SETTINGS})
        current_val = {**self.DEFAULT_SETTINGS, **config_obj.value}

        incoming = request.data
        reason = incoming.get('reason', 'Administrative settings adjustment.')

        updated_fields = {}
        for k in self.DEFAULT_SETTINGS.keys():
            if k in incoming:
                val = incoming[k]
                # Numeric bounds sanity check
                if isinstance(self.DEFAULT_SETTINGS[k], (int, float)):
                    try:
                        num = float(val)
                        if num < 0:
                            return Response({'error': f"Field '{k}' cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)
                        if 'percentage' in k and num > 50:
                            return Response({'error': f"Percentage field '{k}' cannot exceed 50%."}, status=status.HTTP_400_BAD_REQUEST)
                        updated_fields[k] = num
                    except (ValueError, TypeError):
                        return Response({'error': f"Invalid numeric value for '{k}'."}, status=status.HTTP_400_BAD_REQUEST)
                elif isinstance(self.DEFAULT_SETTINGS[k], bool):
                    updated_fields[k] = bool(val)

        if not updated_fields:
            return Response({'error': 'No recognized setting fields provided to update.'}, status=status.HTTP_400_BAD_REQUEST)

        before_state = {k: current_val.get(k) for k in updated_fields.keys()}
        new_val = {**current_val, **updated_fields}
        config_obj.value = new_val
        config_obj.updated_by = request.user
        config_obj.save()

        create_admin_audit_log(
            actor=request.user,
            action='PLATFORM_CONFIG_UPDATED',
            target_model='PlatformConfig',
            target_id=str(config_obj.id),
            details={'before': before_state, 'after': updated_fields},
            reason=reason,
            request=request
        )

        return Response({
            'success': True,
            'message': 'Platform settings successfully saved.',
            'settings': new_val,
            'last_updated_at': config_obj.updated_at.isoformat(),
            'last_updated_by': request.user.get_full_name() or request.user.username
        })


# ===========================================================================
# 9. Audit Logs
# ===========================================================================

class AdminAuditLogListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardAdminPagination

    def get(self, request):
        queryset = AuditLog.objects.select_related('actor').order_by('-timestamp')

        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(action__icontains=q) |
                Q(target_model__icontains=q) |
                Q(target_id__icontains=q) |
                Q(actor__username__icontains=q) |
                Q(actor__email__icontains=q)
            )

        target_model = request.query_params.get('target_model')
        if target_model and target_model.upper() != 'ALL':
            queryset = queryset.filter(target_model__iexact=target_model)

        date_start = request.query_params.get('date_start')
        if date_start:
            try:
                dt_start = datetime.strptime(date_start, '%Y-%m-%d')
                queryset = queryset.filter(timestamp__gte=dt_start)
            except ValueError:
                pass

        date_end = request.query_params.get('date_end')
        if date_end:
            try:
                dt_end = datetime.strptime(date_end, '%Y-%m-%d') + timedelta(days=1)
                queryset = queryset.filter(timestamp__lt=dt_end)
            except ValueError:
                pass

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminAuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
