from django.db.models import Q
from rest_framework import views, generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.products.models import Restaurant, FoodItem
from apps.products.serializers import (
    RestaurantSerializer, FoodItemSerializer,
    CustomerRestaurantSerializer, CustomerRestaurantDetailSerializer
)
from apps.orders.models import Order
from apps.social.models import PhotoReview
from apps.social.serializers import PhotoReviewSerializer
from apps.accounts.models import Profile, User


class RestaurantListView(generics.ListCreateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = CustomerRestaurantSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Exclude non-approved and empty named restaurants for public discovery
        qs = Restaurant.objects.filter(verification_status='APPROVED').exclude(name='')
        cuisine = self.request.query_params.get('cuisine')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        is_open = self.request.query_params.get('is_open')
        min_rating = self.request.query_params.get('min_rating')
        sort_by = self.request.query_params.get('ordering') or self.request.query_params.get('sort')

        if cuisine and cuisine.lower() != 'all':
            qs = qs.filter(cuisines__icontains=cuisine)
        
        if category and category.lower() != 'all':
            qs = qs.filter(
                Q(foods__category__slug__iexact=category) |
                Q(foods__category__name__icontains=category) |
                Q(foods__menu_category__slug__iexact=category) |
                Q(foods__menu_category__name__icontains=category) |
                Q(cuisines__icontains=category)
            ).distinct()

        if search:
            search = search.strip()
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(cuisines__icontains=search) |
                Q(address__icontains=search) |
                Q(tagline__icontains=search) |
                Q(foods__name__icontains=search)
            ).distinct()

        if is_open is not None:
            qs = qs.filter(is_open=(is_open.lower() == 'true'))

        if min_rating:
            try:
                qs = qs.filter(rating__gte=float(min_rating))
            except ValueError:
                pass

        if sort_by == 'rating':
            qs = qs.order_by('-rating', '-review_count')
        elif sort_by == 'popular':
            qs = qs.order_by('-review_count', '-rating')
        elif sort_by in ['price_low', 'price_asc']:
            qs = qs.order_by('id')
        elif sort_by in ['price_high', 'price_desc']:
            qs = qs.order_by('-id')
        elif sort_by:
            qs = qs.order_by(sort_by)
        else:
            qs = qs.order_by('-rating', '-review_count')

        return qs

    def perform_create(self, serializer):
        restaurant = serializer.save()
        from apps.notifications.dispatcher import safe_dispatch_on_commit
        from django.db.models import Q
        admin_users = User.objects.filter(Q(is_staff=True) | Q(role='ADMIN'))
        for admin in admin_users:
            safe_dispatch_on_commit(
                user=admin,
                event_type='admin.restaurant_pending',
                context={
                    'restaurant_name': restaurant.name,
                    'owner_name': getattr(restaurant.owner, 'username', 'Partner') if restaurant.owner else 'Partner',
                },
                idempotency_key=f"rest_pending_{restaurant.id}_{admin.id}",
                related_resource_type='Restaurant',
                related_resource_id=restaurant.id
            )


class RestaurantDetailView(generics.RetrieveUpdateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = CustomerRestaurantDetailSerializer
    permission_classes = [permissions.AllowAny]


class RestaurantMyProfileView(views.APIView):
    """
    Phase 8: Real-life Restaurant Profile View & Update
    Strictly identifies authenticated restaurant from JWT (request.user).
    Ownership is fully enforced by backend.
    Disallows changing registered email or verification status.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_restaurant(self, request):
        user = request.user
        restaurant = Restaurant.objects.filter(owner=user).first()
        if not restaurant:
            # Fallback for staff
            if user.is_staff:
                restaurant = Restaurant.objects.first()
        return restaurant

    def get(self, request):
        restaurant = self.get_restaurant(request)
        if not restaurant:
            return Response({'error': 'No restaurant found for this account.'}, status=status.HTTP_404_NOT_FOUND)

        user = restaurant.owner
        profile = getattr(user, 'profile', None)
        logo_url = ''
        if restaurant.restaurant_logo:
            try:
                logo_url = request.build_absolute_uri(restaurant.restaurant_logo.url)
            except Exception:
                logo_url = restaurant.restaurant_logo.url

        return Response({
            'success': True,
            'id': restaurant.id,
            'restaurant_id': restaurant.id,
            'restaurant_name': restaurant.name,
            'owner_name': restaurant.owner_name or (profile.full_name if profile else '') or user.username,
            'email': user.email,  # Read-only
            'phone': user.phone or (profile.phone if profile else ''),
            'restaurant_address': restaurant.address,
            'address': restaurant.address,
            'latitude': float(restaurant.latitude) if restaurant.latitude is not None else 12.9716,
            'longitude': float(restaurant.longitude) if restaurant.longitude is not None else 77.5946,
            'restaurant_logo': logo_url,
            'logo': logo_url,
            'verification_status': restaurant.verification_status,  # Read-only
            'is_open': restaurant.is_open,
            'status': 'OPEN' if restaurant.is_open else 'CLOSED',
            'rating': float(restaurant.rating),
            'review_count': restaurant.review_count,
            'created_at': restaurant.created_at
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        restaurant = self.get_restaurant(request)
        if not restaurant:
            return Response({'error': 'No restaurant found for this account.'}, status=status.HTTP_404_NOT_FOUND)

        user = restaurant.owner
        profile, _ = Profile.objects.get_or_create(user=user)

        # Disallow changing email or verification status from frontend
        if 'email' in request.data and request.data['email'] != user.email:
            return Response({
                'error': 'Changing registered email is not permitted.',
                'errors': {'email': ['Registered email cannot be modified.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        if 'verification_status' in request.data and request.data['verification_status'] != restaurant.verification_status:
            return Response({
                'error': 'Changing verification status from frontend is forbidden.',
                'errors': {'verification_status': ['Verification status is managed strictly by administrators.']}
            }, status=status.HTTP_403_FORBIDDEN)

        # Update restaurant name
        name_val = request.data.get('restaurant_name') or request.data.get('name')
        if name_val is not None:
            name_clean = str(name_val).strip()
            if len(name_clean) < 2 or len(name_clean) > 255:
                return Response({'errors': {'restaurant_name': ['Restaurant name must be between 2 and 255 characters.']}}, status=status.HTTP_400_BAD_REQUEST)
            if Restaurant.objects.filter(name__iexact=name_clean).exclude(id=restaurant.id).exists():
                return Response({'errors': {'restaurant_name': ['A restaurant with this name already exists.']}}, status=status.HTTP_400_BAD_REQUEST)
            restaurant.name = name_clean

        # Update owner name
        owner_val = request.data.get('owner_name')
        if owner_val is not None:
            owner_clean = str(owner_val).strip()
            if len(owner_clean) < 2:
                return Response({'errors': {'owner_name': ['Owner name must be at least 2 characters.']}}, status=status.HTTP_400_BAD_REQUEST)
            restaurant.owner_name = owner_clean
            profile.full_name = owner_clean

        # Update phone
        phone_val = request.data.get('phone')
        if phone_val is not None:
            phone_clean = str(phone_val).strip()
            digits = ''.join(c for c in phone_clean if c.isdigit())
            if len(digits) < 10 or len(digits) > 15:
                return Response({'errors': {'phone': ['Phone number must contain between 10 and 15 digits.']}}, status=status.HTTP_400_BAD_REQUEST)
            user.phone = phone_clean
            profile.phone = phone_clean
            user.save(update_fields=['phone', 'updated_at'])

        # Update address
        addr_val = request.data.get('restaurant_address') or request.data.get('address')
        if addr_val is not None:
            addr_clean = str(addr_val).strip()
            if not addr_clean:
                return Response({'errors': {'restaurant_address': ['Address cannot be empty.']}}, status=status.HTTP_400_BAD_REQUEST)
            restaurant.address = addr_clean
            profile.address = addr_clean

        # Update coordinates with strict bounds validation [-90, 90] and [-180, 180]
        lat_val = request.data.get('latitude')
        lng_val = request.data.get('longitude')
        if lat_val is not None and str(lat_val).strip() != '':
            try:
                lat_float = float(lat_val)
                if -90.0 <= lat_float <= 90.0:
                    restaurant.latitude = lat_float
                else:
                    return Response({'errors': {'latitude': ['Latitude must be between -90 and 90 degrees.']}}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'errors': {'latitude': ['Invalid latitude coordinate format.']}}, status=status.HTTP_400_BAD_REQUEST)

        if lng_val is not None and str(lng_val).strip() != '':
            try:
                lng_float = float(lng_val)
                if -180.0 <= lng_float <= 180.0:
                    restaurant.longitude = lng_float
                else:
                    return Response({'errors': {'longitude': ['Longitude must be between -180 and 180 degrees.']}}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'errors': {'longitude': ['Invalid longitude coordinate format.']}}, status=status.HTTP_400_BAD_REQUEST)

        # Handle Logo upload / replace / removal
        remove_logo = request.data.get('remove_logo')
        if remove_logo is not None and str(remove_logo).strip().lower() in ['true', '1']:
            if restaurant.restaurant_logo:
                try:
                    restaurant.restaurant_logo.delete(save=False)
                except Exception:
                    pass
                restaurant.restaurant_logo = None
        elif 'restaurant_logo' in request.FILES:
            logo_file = request.FILES['restaurant_logo']
            restaurant.restaurant_logo = logo_file

        restaurant.save()
        profile.save()

        logo_url = ''
        if restaurant.restaurant_logo:
            try:
                logo_url = request.build_absolute_uri(restaurant.restaurant_logo.url)
            except Exception:
                logo_url = restaurant.restaurant_logo.url

        return Response({
            'success': True,
            'message': 'Restaurant profile updated successfully.',
            'restaurant_id': restaurant.id,
            'restaurant_name': restaurant.name,
            'owner_name': restaurant.owner_name,
            'email': user.email,
            'phone': user.phone,
            'restaurant_address': restaurant.address,
            'latitude': float(restaurant.latitude) if restaurant.latitude is not None else 12.9716,
            'longitude': float(restaurant.longitude) if restaurant.longitude is not None else 77.5946,
            'restaurant_logo': logo_url,
            'verification_status': restaurant.verification_status,
            'is_open': restaurant.is_open,
            'status': 'OPEN' if restaurant.is_open else 'CLOSED'
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        restaurant = self.get_restaurant(request)
        if not restaurant:
            return Response({'error': 'No restaurant found for this account.'}, status=status.HTTP_404_NOT_FOUND)
        if restaurant.restaurant_logo:
            try:
                restaurant.restaurant_logo.delete(save=False)
            except Exception:
                pass
            restaurant.restaurant_logo = None
            restaurant.save()
        return Response({
            'success': True,
            'message': 'Restaurant logo removed successfully.',
            'restaurant_logo': ''
        }, status=status.HTTP_200_OK)

    def put(self, request):
        return self.patch(request)


class RestaurantToggleStatusView(views.APIView):
    """
    Phase 8: Toggle availability for a restaurant by ID.
    Enforces ownership: Only the authenticated restaurant owner can toggle availability.
    Persists availability in PostgreSQL.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        restaurant = Restaurant.objects.filter(id=pk).first()
        if not restaurant:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce ownership
        if not request.user.is_staff and restaurant.owner != request.user:
            return Response({
                'error': 'Only the authenticated restaurant owner can change its availability.'
            }, status=status.HTTP_403_FORBIDDEN)

        requested_status = request.data.get('status')
        is_open_payload = request.data.get('is_open')

        if requested_status:
            status_str = str(requested_status).strip().upper()
            if status_str not in ['OPEN', 'CLOSED']:
                return Response({'error': "Invalid status. Status must be 'OPEN' or 'CLOSED'."}, status=status.HTTP_400_BAD_REQUEST)
            restaurant.is_open = (status_str == 'OPEN')
        elif is_open_payload is not None:
            restaurant.is_open = bool(is_open_payload)
        else:
            restaurant.is_open = not restaurant.is_open

        restaurant.save(update_fields=['is_open', 'updated_at'])

        current_status = 'OPEN' if restaurant.is_open else 'CLOSED'
        return Response({
            'success': True,
            'restaurant_id': restaurant.id,
            'name': restaurant.name,
            'is_open': restaurant.is_open,
            'status': current_status,
            'message': f"{restaurant.name} is now {current_status} for orders."
        }, status=status.HTTP_200_OK)


class RestaurantMyToggleStatusView(views.APIView):
    """
    Phase 8: Direct endpoint for authenticated restaurant to toggle its own availability.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant:
            if request.user.is_staff:
                restaurant = Restaurant.objects.first()
            if not restaurant:
                return Response({'error': 'No restaurant found for this account.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'restaurant_id': restaurant.id,
            'name': restaurant.name,
            'is_open': restaurant.is_open,
            'status': 'OPEN' if restaurant.is_open else 'CLOSED'
        }, status=status.HTTP_200_OK)

    def post(self, request):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant:
            if request.user.is_staff:
                restaurant = Restaurant.objects.first()
            if not restaurant:
                return Response({'error': 'No restaurant found for this account.'}, status=status.HTTP_404_NOT_FOUND)

        requested_status = request.data.get('status')
        is_open_payload = request.data.get('is_open')

        if requested_status:
            status_str = str(requested_status).strip().upper()
            if status_str not in ['OPEN', 'CLOSED']:
                return Response({'error': "Invalid status. Status must be 'OPEN' or 'CLOSED'."}, status=status.HTTP_400_BAD_REQUEST)
            restaurant.is_open = (status_str == 'OPEN')
        elif is_open_payload is not None:
            restaurant.is_open = bool(is_open_payload)
        else:
            restaurant.is_open = not restaurant.is_open

        restaurant.save(update_fields=['is_open', 'updated_at'])

        current_status = 'OPEN' if restaurant.is_open else 'CLOSED'
        return Response({
            'success': True,
            'restaurant_id': restaurant.id,
            'name': restaurant.name,
            'is_open': restaurant.is_open,
            'status': current_status,
            'message': f"{restaurant.name} is now {current_status} for orders."
        }, status=status.HTTP_200_OK)


class RestaurantAnalyticsView(views.APIView):
    """
    Phase 21: Verified Restaurant Analytics with strict object-level authorization.
    Owners may only inspect their own restaurant. Staff/Admins retain platform oversight.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        restaurant = Restaurant.objects.filter(id=pk).first()
        if not restaurant:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

        # Strict object-level authorization
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN' or restaurant.owner_id == request.user.id):
            return Response(
                {'error': 'You are not authorized to view private analytics for this restaurant.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from apps.analytics.services import parse_analytics_date_range, get_restaurant_analytics
        date_meta = parse_analytics_date_range(request, default_days=30)
        compare_prior = str(request.query_params.get('compare_prior', '')).lower() in ['true', '1', 'yes']

        data = get_restaurant_analytics(
            restaurant=restaurant,
            start_dt=date_meta['start_datetime'],
            end_dt=date_meta['end_datetime'],
            compare_prior=compare_prior
        )
        data['period'] = {
            'start_date': date_meta['start_date'],
            'end_date': date_meta['end_date'],
            'timezone': date_meta['timezone']
        }
        return Response(data)


class RestaurantPayoutsView(views.APIView):
    """
    Phase 29 Hardened: Restaurant Settlements / Payouts View.
    Strictly isolated: Only the restaurant owner or platform administrator can view payouts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        restaurant = Restaurant.objects.filter(id=pk).first()
        if not restaurant:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN' or restaurant.owner_id == request.user.id):
            return Response(
                {'error': 'Permission denied. You can only view payouts for your own restaurant.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from apps.payments.models import RestaurantSettlement
        db_settlements = RestaurantSettlement.objects.filter(restaurant=restaurant).order_by('-created_at')[:10]
        payouts = [
            {
                'id': s.settlement_reference,
                'date': str(s.period_end),
                'amount': float(s.net_payout_amount),
                'status': s.status,
                'method': f"{s.payout_provider} ({s.provider_utr or 'Verified Transfer'})"
            }
            for s in db_settlements
        ]
        return Response({'restaurant': restaurant.name, 'payouts': payouts})


# ===========================================================================
# Phase 22: Restaurant Business Suite Extensions
# ===========================================================================
import csv
from django.http import HttpResponse

class RestaurantMyAnalyticsView(views.APIView):
    """
    Phase 22: Verified analytics for authenticated restaurant owner's own store.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant and request.user.is_staff:
            restaurant = Restaurant.objects.first()
        if not restaurant:
            return Response({'error': 'No restaurant found for this account.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.analytics.services import parse_analytics_date_range, get_restaurant_analytics
        date_meta = parse_analytics_date_range(request, default_days=30)
        compare_prior = str(request.query_params.get('compare_prior', '')).lower() in ['true', '1', 'yes']

        data = get_restaurant_analytics(
            restaurant=restaurant,
            start_dt=date_meta['start_datetime'],
            end_dt=date_meta['end_datetime'],
            compare_prior=compare_prior
        )
        data['period'] = {
            'start_date': date_meta['start_date'],
            'end_date': date_meta['end_date'],
            'timezone': date_meta['timezone']
        }
        return Response(data)


class RestaurantMyOperatingSettingsView(views.APIView):
    """
    Phase 22: Configure opening hours, orders pause, prep time, exceptional closures.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_restaurant(self, request):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant and request.user.is_staff:
            restaurant = Restaurant.objects.first()
        return restaurant

    def get(self, request):
        restaurant = self.get_restaurant(request)
        if not restaurant:
            return Response({'error': 'No restaurant found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'restaurant_id': restaurant.id,
            'restaurant_name': restaurant.name,
            'is_open': restaurant.is_open,
            'orders_paused': restaurant.orders_paused,
            'pause_reason': restaurant.pause_reason,
            'opening_time': str(restaurant.opening_time),
            'closing_time': str(restaurant.closing_time),
            'timezone': restaurant.timezone,
            'operating_hours': restaurant.operating_hours or {},
            'exceptional_closures': restaurant.exceptional_closures or [],
            'avg_prep_time_minutes': restaurant.avg_prep_time_minutes,
            'delivery_time_text': restaurant.delivery_time_text,
            'availability_status': restaurant.availability_status
        })

    def patch(self, request):
        restaurant = self.get_restaurant(request)
        if not restaurant:
            return Response({'error': 'No restaurant found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'is_open' in data:
            restaurant.is_open = bool(data['is_open'])
        if 'orders_paused' in data:
            restaurant.orders_paused = bool(data['orders_paused'])
        if 'pause_reason' in data:
            restaurant.pause_reason = str(data['pause_reason']).strip()
        if 'opening_time' in data and data['opening_time']:
            restaurant.opening_time = data['opening_time']
        if 'closing_time' in data and data['closing_time']:
            restaurant.closing_time = data['closing_time']
        if 'avg_prep_time_minutes' in data:
            try:
                restaurant.avg_prep_time_minutes = max(5, int(data['avg_prep_time_minutes']))
            except (ValueError, TypeError):
                pass
        if 'operating_hours' in data and isinstance(data['operating_hours'], dict):
            restaurant.operating_hours = data['operating_hours']
        if 'exceptional_closures' in data and isinstance(data['exceptional_closures'], list):
            restaurant.exceptional_closures = data['exceptional_closures']
        if 'timezone' in data and data['timezone']:
            restaurant.timezone = str(data['timezone']).strip()

        restaurant.save()
        return Response({
            'success': True,
            'message': 'Operating settings saved successfully.',
            'settings': {
                'restaurant_id': restaurant.id,
                'is_open': restaurant.is_open,
                'orders_paused': restaurant.orders_paused,
                'pause_reason': restaurant.pause_reason,
                'opening_time': str(restaurant.opening_time),
                'closing_time': str(restaurant.closing_time),
                'avg_prep_time_minutes': restaurant.avg_prep_time_minutes,
                'operating_hours': restaurant.operating_hours,
                'exceptional_closures': restaurant.exceptional_closures,
                'availability_status': restaurant.availability_status
            }
        })


class RestaurantMyPauseOrdersView(views.APIView):
    """
    Phase 22: Quick toggle to pause or resume accepting new orders.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant and request.user.is_staff:
            restaurant = Restaurant.objects.first()
        if not restaurant:
            return Response({'error': 'No restaurant found.'}, status=status.HTTP_404_NOT_FOUND)

        paused = request.data.get('paused')
        reason = request.data.get('reason', '').strip()

        if paused is not None:
            restaurant.orders_paused = bool(paused)
        else:
            restaurant.orders_paused = not restaurant.orders_paused

        if restaurant.orders_paused and reason:
            restaurant.pause_reason = reason
        elif not restaurant.orders_paused:
            restaurant.pause_reason = ''

        restaurant.save(update_fields=['orders_paused', 'pause_reason', 'updated_at'])

        status_text = 'PAUSED' if restaurant.orders_paused else ('OPEN' if restaurant.is_open else 'CLOSED')
        msg = f"Orders are now paused: {restaurant.pause_reason}" if restaurant.orders_paused else f"Restaurant is now accepting new orders."
        return Response({
            'success': True,
            'orders_paused': restaurant.orders_paused,
            'pause_reason': restaurant.pause_reason,
            'status': status_text,
            'message': msg
        })


class RestaurantMyOrdersExportCSVView(views.APIView):
    """
    Phase 22: Export date-filtered orders to CSV for authenticated restaurant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            restaurant = Restaurant.objects.filter(id=pk).first()
            if not restaurant:
                return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)
            if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN' or restaurant.owner_id == request.user.id):
                return Response({'error': 'Permission denied. You can only export orders for your own restaurant.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            restaurant = Restaurant.objects.filter(owner=request.user).first()
            if not restaurant and (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
                restaurant = Restaurant.objects.first()
            if not restaurant:
                return Response({'error': 'No restaurant found.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.analytics.services import parse_analytics_date_range
        date_meta = parse_analytics_date_range(request, default_days=30)
        start_dt = date_meta['start_datetime']
        end_dt = date_meta['end_datetime']

        orders = (
            Order.objects.filter(restaurant=restaurant, created_at__gte=start_dt, created_at__lte=end_dt)
            .select_related('customer')
            .prefetch_related('items')
            .order_by('-created_at')
        )

        response = HttpResponse(content_type='text/csv')
        filename = f"orders_{restaurant.id}_{date_meta['start_date']}_to_{date_meta['end_date']}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            'Order Number', 'Date (UTC)', 'Customer Name', 'Order Status',
            'Payment Status', 'Payment Method', 'Items Count', 'Item Subtotal',
            'Packaging Fee', 'Grand Total', 'Est. Commission (10%)', 'Est. Net Payout'
        ])

        for o in orders:
            items_count = sum(item.quantity for item in o.items.all())
            subtotal = float(o.subtotal or o.item_total or 0.0)
            pkg = float(o.packaging_fee or 0.0)
            grand = float(o.grand_total or o.total or 0.0)
            comm = round(subtotal * 0.10, 2)
            payout = round(subtotal + pkg - comm, 2) if o.status == 'DELIVERED' else 0.00
            cust_name = o.customer.get_full_name() or o.customer.username if o.customer else 'Guest'

            writer.writerow([
                o.order_number,
                o.created_at.strftime('%Y-%m-%d %H:%M'),
                cust_name,
                o.status,
                o.payment_status,
                o.payment_method,
                items_count,
                f"{subtotal:.2f}",
                f"{pkg:.2f}",
                f"{grand:.2f}",
                f"{comm:.2f}",
                f"{payout:.2f}"
            ])

        return response
