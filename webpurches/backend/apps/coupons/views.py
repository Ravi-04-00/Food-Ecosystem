from decimal import Decimal
from django.utils import timezone
from django.db import models
from django.db.models import Sum, Count, Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Coupon, CouponRedemption, LoyaltyProgramConfig, LoyaltyLedgerEntry
from .serializers import (
    CouponSerializer,
    CouponValidateInputSerializer,
    OrderTotalsPreviewInputSerializer,
    LoyaltyProfileDetailSerializer,
    LoyaltyLedgerEntrySerializer,
    AdminCouponCreateUpdateSerializer,
    LoyaltyProgramConfigSerializer
)
from .services import (
    calculate_coupon_discount,
    calculate_loyalty_redemption,
    calculate_authoritative_order_totals
)
from apps.accounts.models import LoyaltyProfile, AuditLog


class StandardCouponPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsAdminUserOrRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN')
        )


class CouponListView(APIView):
    """
    GET /api/coupons/
    Lists all currently active promotional offers using real database records.
    Optionally evaluates eligibility against customer's current cart subtotal and restaurant.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.now()
        qs = Coupon.objects.filter(is_active=True).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=now)
        ).order_by('-created_at')

        subtotal_param = request.query_params.get('subtotal') or request.query_params.get('amount')
        restaurant_id = request.query_params.get('restaurant_id')
        user = request.user if request.user.is_authenticated else None

        subtotal = Decimal('0.00')
        if subtotal_param:
            try:
                subtotal = Decimal(str(subtotal_param))
            except (ValueError, TypeError):
                subtotal = Decimal('0.00')

        results = []
        for coupon in qs:
            data = CouponSerializer(coupon).data
            if subtotal > 0:
                calc = calculate_coupon_discount(coupon, subtotal, user, restaurant_id)
                data['eligibility'] = {
                    'is_eligible': calc['is_eligible'],
                    'potential_discount': float(calc['discount']),
                    'error_message': calc['error_message'],
                    'reason': calc['reason']
                }
            results.append(data)

        return Response({
            'count': len(results),
            'results': results
        }, status=status.HTTP_200_OK)


class ValidateCouponView(APIView):
    """
    POST /api/coupons/validate/
    Strict server-side validation of coupon eligibility, minimum amounts, usage limits,
    first-order constraints, and discount calculation.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CouponValidateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code'].strip().upper()
        subtotal = serializer.validated_data.get('subtotal', Decimal('0.00'))
        restaurant_id = serializer.validated_data.get('restaurant_id')
        user = request.user if request.user.is_authenticated else None

        coupon = Coupon.objects.filter(code=code).first()
        if not coupon:
            return Response({
                'valid': False,
                'code': code,
                'discount': 0.00,
                'message': f"Coupon code '{code}' does not exist or has expired."
            }, status=status.HTTP_400_BAD_REQUEST)

        calc = calculate_coupon_discount(coupon, subtotal, user, restaurant_id)
        if not calc['is_eligible']:
            return Response({
                'valid': False,
                'code': code,
                'discount': 0.00,
                'message': calc['error_message'],
                'reason': calc['reason']
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount': float(calc['discount']),
            'discount_type': coupon.discount_type,
            'title': coupon.title,
            'description': coupon.description,
            'min_order_value': float(coupon.min_order_value),
            'is_combinable': coupon.is_combinable,
            'message': f"Coupon '{coupon.code}' applied successfully! Saved ₹{calc['discount']:.2f}."
        }, status=status.HTTP_200_OK)


class OrderTotalsPreviewView(APIView):
    """
    POST /api/coupons/preview/
    Authoritative server-side order calculation preview.
    Returns itemized breakdown: subtotal, delivery fee, packaging fee, discounts, taxes, grand total,
    and expected loyalty points to be earned.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderTotalsPreviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = request.user if request.user.is_authenticated else None

        breakdown = calculate_authoritative_order_totals(
            subtotal=data['subtotal'],
            delivery_fee=data.get('delivery_fee', Decimal('30.00')),
            packaging_fee=data.get('packaging_fee', Decimal('15.00')),
            coupon_code=data.get('coupon_code'),
            points_to_redeem=data.get('points_to_redeem', 0),
            user=user,
            restaurant_id=data.get('restaurant_id')
        )

        return Response(breakdown, status=status.HTTP_200_OK)


class CustomerLoyaltyView(APIView):
    """
    GET /api/coupons/loyalty/
    Authenticated customer loyalty profile: available points, VIP tier, inr conversion value,
    redemption rules, and auditable points ledger history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = LoyaltyProfile.objects.get_or_create(user=request.user)
        profile_data = LoyaltyProfileDetailSerializer(profile).data

        # Recent 30 ledger transactions
        ledger = LoyaltyLedgerEntry.objects.filter(user=request.user).order_by('-created_at')[:30]
        ledger_data = LoyaltyLedgerEntrySerializer(ledger, many=True).data

        return Response({
            'profile': profile_data,
            'history': ledger_data
        }, status=status.HTTP_200_OK)


class AdminCouponListCreateView(generics.ListCreateAPIView):
    """
    GET /api/coupons/admin/
    POST /api/coupons/admin/
    Administrative promotion and coupon management.
    """
    permission_classes = [IsAdminUserOrRole]
    serializer_class = AdminCouponCreateUpdateSerializer
    pagination_class = StandardCouponPagination

    def get_queryset(self):
        qs = Coupon.objects.all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('discount_type')
        q = self.request.query_params.get('q') or self.request.query_params.get('search')

        if status_param == 'active':
            qs = qs.filter(is_active=True)
        elif status_param == 'inactive':
            qs = qs.filter(is_active=False)
        elif status_param == 'expired':
            qs = qs.filter(expiry_date__lt=timezone.now())

        if type_param:
            qs = qs.filter(discount_type=type_param.upper())

        if q:
            qs = qs.filter(Q(code__icontains=q) | Q(title__icontains=q) | Q(description__icontains=q))

        return qs

    def perform_create(self, serializer):
        coupon = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action=f"Created promotional coupon '{coupon.code}' ({coupon.discount_type})",
            target_model='Coupon',
            target_id=str(coupon.id),
            details={'code': coupon.code, 'discount_type': coupon.discount_type}
        )


class AdminCouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/coupons/admin/<pk>/
    PUT /api/coupons/admin/<pk>/
    DELETE /api/coupons/admin/<pk>/
    """
    permission_classes = [IsAdminUserOrRole]
    queryset = Coupon.objects.all()
    serializer_class = AdminCouponCreateUpdateSerializer

    def perform_update(self, serializer):
        coupon = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action=f"Updated promotional coupon '{coupon.code}'",
            target_model='Coupon',
            target_id=str(coupon.id),
            details=serializer.validated_data
        )

    def perform_destroy(self, instance):
        code = instance.code
        c_id = instance.id
        instance.delete()
        AuditLog.objects.create(
            actor=self.request.user,
            action=f"Deleted promotional coupon '{code}'",
            target_model='Coupon',
            target_id=str(c_id),
            details={'code': code}
        )


class AdminLoyaltyConfigView(APIView):
    """
    GET /api/coupons/admin/loyalty-config/
    PUT /api/coupons/admin/loyalty-config/
    Configure platform-wide loyalty earning rates, conversion values, and redemption thresholds.
    """
    permission_classes = [IsAdminUserOrRole]

    def get(self, request):
        config = LoyaltyProgramConfig.get_solo()
        return Response(LoyaltyProgramConfigSerializer(config).data)

    def put(self, request):
        config = LoyaltyProgramConfig.get_solo()
        serializer = LoyaltyProgramConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            actor=request.user,
            action="Updated Platform Loyalty Program Configuration",
            target_model='LoyaltyProgramConfig',
            target_id=str(config.id),
            details=serializer.validated_data
        )

        return Response({
            'message': 'Loyalty program configuration updated successfully.',
            'config': serializer.data
        }, status=status.HTTP_200_OK)


class AdminPromotionStatsView(APIView):
    """
    GET /api/coupons/admin/stats/
    Comprehensive metrics on coupon redemptions, total savings, and outstanding loyalty points.
    """
    permission_classes = [IsAdminUserOrRole]

    def get(self, request):
        total_coupons = Coupon.objects.count()
        active_coupons = Coupon.objects.filter(is_active=True).count()
        
        redemptions_agg = CouponRedemption.objects.filter(status='COMMITTED').aggregate(
            total_count=Count('id'),
            total_discount=Sum('discount_amount')
        )
        total_redemptions = redemptions_agg['total_count'] or 0
        total_discount_issued = float(redemptions_agg['total_discount'] or 0)

        loyalty_agg = LoyaltyProfile.objects.aggregate(
            total_points=Sum('points'),
            total_saved=Sum('total_saved'),
            total_members=Count('id')
        )
        total_points_outstanding = loyalty_agg['total_points'] or 0
        total_loyalty_savings = float(loyalty_agg['total_saved'] or 0)
        total_members = loyalty_agg['total_members'] or 0

        config = LoyaltyProgramConfig.get_solo()

        return Response({
            'total_coupons': total_coupons,
            'active_coupons': active_coupons,
            'total_redemptions': total_redemptions,
            'total_discount_issued': round(total_discount_issued, 2),
            'total_loyalty_members': total_members,
            'total_points_outstanding': total_points_outstanding,
            'points_inr_liability': round(float(Decimal(str(total_points_outstanding)) * config.points_to_inr_rate), 2),
            'total_loyalty_savings': round(total_loyalty_savings, 2),
            'conversion_rate': float(config.points_to_inr_rate),
            'earn_rate': float(config.points_earn_rate),
            'earn_per_amount': float(config.earn_per_amount)
        })


class AdminLoyaltyLedgerListView(generics.ListAPIView):
    """
    GET /api/coupons/admin/loyalty-ledger/
    Full audit stream of all points earned, redeemed, or reversed across the ecosystem.
    """
    permission_classes = [IsAdminUserOrRole]
    serializer_class = LoyaltyLedgerEntrySerializer
    pagination_class = StandardCouponPagination

    def get_queryset(self):
        qs = LoyaltyLedgerEntry.objects.select_related('user', 'order').all().order_by('-created_at')
        txn_type = self.request.query_params.get('type')
        user_id = self.request.query_params.get('user_id')
        if txn_type:
            qs = qs.filter(transaction_type=txn_type.upper())
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs
