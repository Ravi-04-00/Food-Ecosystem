from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.accounts.models import User
from apps.products.models import Product, Restaurant
from .models import Review, ReviewReport, ReviewModerationLog
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
    ReviewReportSerializer,
    ReviewModerationActionSerializer,
    ReportResolutionSerializer,
)
from .services import check_review_eligibility, recalculate_target_rating

class StandardReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', '') == 'ADMIN')
        )


class ReviewEligibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response(
                {'error': 'order_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        eligibility = check_review_eligibility(request.user, order_id)
        return Response(eligibility)


class ReviewListCreateView(generics.ListCreateAPIView):
    pagination_class = StandardReviewPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        queryset = Review.objects.filter(moderation_status='APPROVED').select_related(
            'user', 'product', 'restaurant', 'delivery_partner', 'order'
        )

        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id, target_type='FOOD_ITEM')

        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        delivery_partner_id = self.request.query_params.get('delivery_partner')
        if delivery_partner_id:
            queryset = queryset.filter(delivery_partner_id=delivery_partner_id, target_type='DELIVERY_PARTNER')

        target_type = self.request.query_params.get('target_type')
        if target_type:
            queryset = queryset.filter(target_type=target_type)

        rating_filter = self.request.query_params.get('rating')
        if rating_filter and rating_filter.isdigit():
            queryset = queryset.filter(rating=int(rating_filter))

        ordering = self.request.query_params.get('ordering', 'newest')
        if ordering in ['highest', '-rating']:
            queryset = queryset.order_by('-rating', '-created_at')
        elif ordering in ['lowest', 'rating']:
            queryset = queryset.order_by('rating', '-created_at')
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            review = Review.objects.create(
                user=request.user,
                order=data['resolved_order'],
                target_type=data['target_type'],
                product=data['resolved_product'],
                restaurant=data['resolved_restaurant'],
                delivery_partner=data['resolved_rider'],
                rating=data['rating'],
                food_quality_rating=data.get('food_quality_rating'),
                packaging_rating=data.get('packaging_rating'),
                delivery_rating=data.get('delivery_rating'),
                comment=data.get('comment', ''),
                language=data.get('language', 'en'),
                is_verified_purchase=True,
                moderation_status='APPROVED'
            )

            # Recalculate aggregates
            if review.target_type == 'FOOD_ITEM' and review.product_id:
                recalculate_target_rating('FOOD_ITEM', review.product_id)
            elif review.target_type == 'RESTAURANT' and review.restaurant_id:
                recalculate_target_rating('RESTAURANT', review.restaurant_id)
            elif review.target_type == 'DELIVERY_PARTNER' and review.delivery_partner_id:
                recalculate_target_rating('DELIVERY_PARTNER', review.delivery_partner_id)

        output_serializer = ReviewSerializer(review)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class CustomerMyReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardReviewPagination

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related(
            'user', 'product', 'restaurant', 'delivery_partner', 'order'
        ).order_by('-created_at')


class ReviewDetailUpdateDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        try:
            return Review.objects.select_related(
                'user', 'product', 'restaurant', 'delivery_partner', 'order'
            ).get(pk=pk)
        except Review.DoesNotExist:
            return None

    def get(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Non-owners can only see if approved
        if review.user_id != request.user.id and review.moderation_status != 'APPROVED':
            if not (request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
                return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(ReviewSerializer(review).data)

    def patch(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        if review.user_id != request.user.id:
            return Response({'error': 'You do not have permission to edit this review.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ReviewUpdateSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            serializer.save()
            # Recalculate target rating
            if review.target_type == 'FOOD_ITEM' and review.product_id:
                recalculate_target_rating('FOOD_ITEM', review.product_id)
            elif review.target_type == 'RESTAURANT' and review.restaurant_id:
                recalculate_target_rating('RESTAURANT', review.restaurant_id)
            elif review.target_type == 'DELIVERY_PARTNER' and review.delivery_partner_id:
                recalculate_target_rating('DELIVERY_PARTNER', review.delivery_partner_id)

        return Response(ReviewSerializer(review).data)

    def delete(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'
        if review.user_id != request.user.id and not is_admin:
            return Response({'error': 'You do not have permission to delete this review.'}, status=status.HTTP_403_FORBIDDEN)

        t_type = review.target_type
        prod_id = review.product_id
        rest_id = review.restaurant_id
        rider_id = review.delivery_partner_id

        with transaction.atomic():
            review.delete()
            if t_type == 'FOOD_ITEM' and prod_id:
                recalculate_target_rating('FOOD_ITEM', prod_id)
            elif t_type == 'RESTAURANT' and rest_id:
                recalculate_target_rating('RESTAURANT', rest_id)
            elif t_type == 'DELIVERY_PARTNER' and rider_id:
                recalculate_target_rating('DELIVERY_PARTNER', rider_id)

        return Response({'message': 'Review deleted successfully.'}, status=status.HTTP_200_OK)


class ReviewSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        target_type = request.query_params.get('target_type')
        target_id = request.query_params.get('target_id')

        if not target_type or not target_id:
            return Response(
                {'error': 'target_type and target_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        qs = Review.objects.filter(target_type=target_type, moderation_status='APPROVED')
        if target_type == 'FOOD_ITEM':
            qs = qs.filter(product_id=target_id)
        elif target_type == 'RESTAURANT':
            qs = qs.filter(restaurant_id=target_id)
        elif target_type == 'DELIVERY_PARTNER':
            qs = qs.filter(delivery_partner_id=target_id)
        else:
            return Response({'error': 'Invalid target_type.'}, status=status.HTTP_400_BAD_REQUEST)

        total_reviews = qs.count()
        if total_reviews == 0:
            return Response({
                'average_rating': 5.0 if target_type != 'RESTAURANT' else 4.8,
                'total_reviews': 0,
                'distribution': {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
                'food_quality_avg': None,
                'packaging_avg': None,
                'delivery_avg': None
            })

        agg = qs.aggregate(
            overall=models.Avg('rating'),
            food=models.Avg('food_quality_rating'),
            pkg=models.Avg('packaging_rating'),
            deliv=models.Avg('delivery_rating')
        )

        dist = {}
        for star in [5, 4, 3, 2, 1]:
            dist[star] = qs.filter(rating=star).count()

        return Response({
            'average_rating': round(agg['overall'] or 5.0, 2),
            'total_reviews': total_reviews,
            'distribution': dist,
            'food_quality_avg': round(agg['food'], 2) if agg['food'] is not None else None,
            'packaging_avg': round(agg['pkg'], 2) if agg['pkg'] is not None else None,
            'delivery_avg': round(agg['deliv'], 2) if agg['deliv'] is not None else None
        })


class RestaurantReviewsFeedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        restaurant = Restaurant.objects.filter(owner=user).first()
        if not restaurant and not (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
            return Response(
                {'error': 'No restaurant found associated with this account.'},
                status=status.HTTP_403_FORBIDDEN
            )

        rest_id = restaurant.id if restaurant else request.query_params.get('restaurant_id')
        if not rest_id:
            return Response({'error': 'restaurant_id required for admin preview.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Review.objects.filter(
            models.Q(restaurant_id=rest_id) | models.Q(product__restaurant_id=rest_id),
            moderation_status='APPROVED'
        ).select_related('user', 'product', 'order').order_by('-created_at')

        paginator = StandardReviewPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ReviewSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class DeliveryPartnerReviewsFeedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, 'role', '') not in ['DELIVERY', 'RIDER'] and not (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Only delivery partners can access this feed.'}, status=status.HTTP_403_FORBIDDEN)

        rider_id = user.id if getattr(user, 'role', '') in ['DELIVERY', 'RIDER'] else request.query_params.get('rider_id', user.id)
        qs = Review.objects.filter(
            delivery_partner_id=rider_id,
            target_type='DELIVERY_PARTNER',
            moderation_status='APPROVED'
        ).select_related('user', 'order').order_by('-created_at')

        paginator = StandardReviewPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ReviewSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ReviewReportCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewReportSerializer(
            data=request.data,
            context={'request': request, 'review': review}
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            report = serializer.save(reported_by=request.user, review=review)
            # If multiple reports exist, flag for moderator review
            report_count = ReviewReport.objects.filter(review=review, status='PENDING').count()
            if report_count >= 2 and review.moderation_status == 'APPROVED':
                review.moderation_status = 'FLAGGED'
                review.save(update_fields=['moderation_status'])

        return Response(ReviewReportSerializer(report).data, status=status.HTTP_201_CREATED)


class AdminReviewModerationQueueView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminRole]
    pagination_class = StandardReviewPagination

    def get_queryset(self):
        qs = Review.objects.select_related(
            'user', 'product', 'restaurant', 'delivery_partner', 'order'
        ).all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(moderation_status=status_param.upper())
        return qs.order_by('-created_at')


class AdminReviewModerateActionView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewModerationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']
        reason = serializer.validated_data['reason']

        previous_status = review.moderation_status
        new_status = 'APPROVED' if action == 'APPROVE' else ('HIDDEN' if action == 'HIDE' else 'FLAGGED')

        with transaction.atomic():
            review.moderation_status = new_status
            review.moderation_reason = reason
            review.moderated_by = request.user
            review.moderated_at = timezone.now()
            review.save()

            ReviewModerationLog.objects.create(
                review=review,
                moderator=request.user,
                action=action,
                reason=reason,
                previous_status=previous_status,
                new_status=new_status
            )

            # Recalculate target rating since hidden/approved state changed
            if review.target_type == 'FOOD_ITEM' and review.product_id:
                recalculate_target_rating('FOOD_ITEM', review.product_id)
            elif review.target_type == 'RESTAURANT' and review.restaurant_id:
                recalculate_target_rating('RESTAURANT', review.restaurant_id)
            elif review.target_type == 'DELIVERY_PARTNER' and review.delivery_partner_id:
                recalculate_target_rating('DELIVERY_PARTNER', review.delivery_partner_id)

        return Response({
            'message': f"Review #{review.id} successfully updated to {new_status}.",
            'review': ReviewSerializer(review).data
        })


class AdminReviewReportsListView(generics.ListAPIView):
    serializer_class = ReviewReportSerializer
    permission_classes = [IsAdminRole]
    pagination_class = StandardReviewPagination

    def get_queryset(self):
        qs = ReviewReport.objects.select_related('review', 'reported_by', 'resolved_by').all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs.order_by('-created_at')


class AdminReviewReportResolveView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            report = ReviewReport.objects.select_related('review').get(pk=pk)
        except ReviewReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReportResolutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']
        admin_notes = serializer.validated_data.get('admin_notes', '')

        with transaction.atomic():
            if action == 'RESOLVE_AND_HIDE':
                report.status = 'RESOLVED'
                review = report.review
                prev_status = review.moderation_status
                review.moderation_status = 'HIDDEN'
                review.moderation_reason = f"Hidden per abuse report #{report.id}: {admin_notes or report.get_reason_display()}"
                review.moderated_by = request.user
                review.moderated_at = timezone.now()
                review.save()

                ReviewModerationLog.objects.create(
                    review=review,
                    moderator=request.user,
                    action='HIDE',
                    reason=f"Resolved abuse report #{report.id}: {admin_notes}",
                    previous_status=prev_status,
                    new_status='HIDDEN'
                )

                if review.target_type == 'FOOD_ITEM' and review.product_id:
                    recalculate_target_rating('FOOD_ITEM', review.product_id)
                elif review.target_type == 'RESTAURANT' and review.restaurant_id:
                    recalculate_target_rating('RESTAURANT', review.restaurant_id)
                elif review.target_type == 'DELIVERY_PARTNER' and review.delivery_partner_id:
                    recalculate_target_rating('DELIVERY_PARTNER', review.delivery_partner_id)

            else:
                report.status = 'DISMISSED'

            report.admin_notes = admin_notes
            report.resolved_by = request.user
            report.resolved_at = timezone.now()
            report.save()

        return Response({
            'message': f"Report #{report.id} marked as {report.status}.",
            'report': ReviewReportSerializer(report).data
        })


class AdminReviewStatsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_reviews = Review.objects.count()
        approved_count = Review.objects.filter(moderation_status='APPROVED').count()
        hidden_count = Review.objects.filter(moderation_status='HIDDEN').count()
        flagged_count = Review.objects.filter(moderation_status='FLAGGED').count()
        pending_reports = ReviewReport.objects.filter(status='PENDING').count()
        
        overall_avg = Review.objects.filter(moderation_status='APPROVED').aggregate(models.Avg('rating'))['rating__avg'] or 5.0

        return Response({
            'total_reviews': total_reviews,
            'approved_count': approved_count,
            'hidden_count': hidden_count,
            'flagged_count': flagged_count,
            'pending_reports': pending_reports,
            'platform_average_rating': round(overall_avg, 2)
        })
