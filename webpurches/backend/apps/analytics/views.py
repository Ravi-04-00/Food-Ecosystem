import csv
from datetime import datetime
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import views, status, permissions
from rest_framework.response import Response

from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.coupons.models import CouponRedemption
from apps.adminpanel.permissions import create_admin_audit_log

from .permissions import IsAdminOnly, IsRestaurantOwnerOrAdmin, IsDeliveryPartnerOrAdmin
from .metric_definitions import METRIC_DEFINITIONS, REPORTING_TIMEZONE
from .services import (
    parse_analytics_date_range,
    get_admin_analytics_summary,
    get_admin_analytics_charts,
    get_restaurant_analytics,
    get_delivery_partner_analytics
)


def log_analytics_export_audit(user, report_type, date_range, request=None):
    """Safely logs administrative data export in audit table."""
    try:
        create_admin_audit_log(
            actor=user,
            action=f"ANALYTICS_CSV_EXPORT_{report_type.upper()}",
            target_model='AnalyticsReport',
            target_id=report_type,
            details={
                'report_type': report_type,
                'date_range': date_range,
                'exported_at': timezone.now().isoformat()
            },
            reason="Authorized business intelligence CSV export.",
            request=request
        )
    except Exception:
        pass


class MetricDefinitionsView(views.APIView):
    """
    Publicly or authentically readable directory of all metric definitions,
    accounting boundaries, and timezone policies.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'reporting_timezone': REPORTING_TIMEZONE,
            'metric_definitions': METRIC_DEFINITIONS,
            'accounting_policy': {
                'gross_order_value_vs_revenue': "Gross Order Value represents gross basket size and total GMV, not platform revenue.",
                'payment_capture_rule': "Only payments with status 'PAID' or 'SETTLED' are recognized as captured.",
                'refund_recognition_rule': "Refunds are counted exclusively from authoritative payment records.",
                'cancellation_policy': "Cancelled orders are reported separately and excluded from completed revenue.",
                'anti_gamification_rule': "Delivery durations reflect genuine pickup-to-drop timestamps without fabricated performance quotas."
            }
        })


class AdminAnalyticsSummaryView(views.APIView):
    """
    GET: Returns verified platform summary cards for the Admin Analytics Dashboard.
    """
    permission_classes = [IsAdminOnly]

    def get(self, request):
        date_meta = parse_analytics_date_range(request, default_days=30)
        
        filters = {
            'order_status': request.query_params.get('order_status'),
            'restaurant_id': request.query_params.get('restaurant_id'),
            'delivery_partner_id': request.query_params.get('delivery_partner_id'),
            'payment_status': request.query_params.get('payment_status'),
        }

        summary = get_admin_analytics_summary(
            start_dt=date_meta['start_datetime'],
            end_dt=date_meta['end_datetime'],
            filters=filters
        )

        return Response({
            'period': {
                'start_date': date_meta['start_date'],
                'end_date': date_meta['end_date'],
                'days_span': date_meta['days_span'],
                'timezone': date_meta['timezone']
            },
            'filters': filters,
            'summary': summary,
            'metric_definitions_reference': '/api/analytics/definitions/'
        })


class AdminAnalyticsChartsView(views.APIView):
    """
    GET: Returns real PostgreSQL time-series distributions and category breakdowns.
    """
    permission_classes = [IsAdminOnly]

    def get(self, request):
        date_meta = parse_analytics_date_range(request, default_days=30)
        interval = request.query_params.get('interval', 'day').lower()
        if interval not in ['day', 'week', 'month']:
            interval = 'day'

        filters = {
            'restaurant_id': request.query_params.get('restaurant_id')
        }

        charts = get_admin_analytics_charts(
            start_dt=date_meta['start_datetime'],
            end_dt=date_meta['end_datetime'],
            interval=interval,
            filters=filters
        )

        return Response({
            'period': {
                'start_date': date_meta['start_date'],
                'end_date': date_meta['end_date'],
                'interval': interval,
                'timezone': date_meta['timezone']
            },
            'charts': charts
        })


class AdminAnalyticsExportView(views.APIView):
    """
    GET: Exports date-filtered and validated CSV datasets with masked customer PII.
    Logs sensitive export action in admin audit logs.
    """
    permission_classes = [IsAdminOnly]

    def get(self, request):
        report_type = request.query_params.get('report_type', 'orders').lower()
        date_meta = parse_analytics_date_range(request, default_days=30)
        start_dt = date_meta['start_datetime']
        end_dt = date_meta['end_datetime']
        status_filter = request.query_params.get('order_status')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
        writer = csv.writer(response)

        if report_type == 'payments':
            response['Content-Disposition'] = f'attachment; filename="admin_payments_{timestamp_str}.csv"'
            writer.writerow([
                'Payment ID', 'Order Number', 'Amount (INR)', 'Payment Status',
                'Method', 'Provider', 'Verified Timestamp', 'Created Date'
            ])

            qs = Payment.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt).select_related('order').order_by('-created_at')
            for p in qs[:5000]:
                writer.writerow([
                    p.id,
                    p.order.order_number if p.order else 'N/A',
                    float(p.amount),
                    p.status,
                    p.payment_method,
                    p.payment_provider,
                    p.verified_at.strftime('%Y-%m-%d %H:%M:%S') if p.verified_at else 'UNVERIFIED',
                    p.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        elif report_type == 'coupons':
            response['Content-Disposition'] = f'attachment; filename="admin_coupons_{timestamp_str}.csv"'
            writer.writerow([
                'Redemption ID', 'Coupon Code', 'Order Number', 'Discount (INR)',
                'Redemption Status', 'Redeemed Date'
            ])

            qs = CouponRedemption.objects.filter(redeemed_at__gte=start_dt, redeemed_at__lte=end_dt).select_related('coupon', 'order').order_by('-redeemed_at')
            for r in qs[:5000]:
                writer.writerow([
                    r.id,
                    r.coupon.code if r.coupon else 'UNKNOWN',
                    r.order.order_number if r.order else 'N/A',
                    float(r.discount_amount),
                    r.status,
                    r.redeemed_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        else:
            # Default: Orders
            response['Content-Disposition'] = f'attachment; filename="admin_orders_{timestamp_str}.csv"'
            writer.writerow([
                'Order ID', 'Order Number', 'Restaurant', 'Customer Masked',
                'Gross Total (INR)', 'Item Total (INR)', 'Delivery Fee (INR)',
                'Discount (INR)', 'Order Status', 'Payment Status', 'Created Date'
            ])

            qs = Order.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt).select_related('customer', 'restaurant').order_by('-created_at')
            if status_filter and status_filter.upper() != 'ALL':
                qs = qs.filter(status=status_filter.upper())

            for o in qs[:5000]:
                cust_name = o.customer.get_full_name() or o.customer.username if o.customer else 'Guest'
                masked_cust = (cust_name[0] + '***' + cust_name[-1]) if len(cust_name) > 2 else 'C***'
                writer.writerow([
                    o.id,
                    o.order_number,
                    o.restaurant.name if o.restaurant else 'Cloud Kitchen',
                    masked_cust,
                    float(o.grand_total or 0.0),
                    float(o.item_total or 0.0),
                    float(o.delivery_fee or 0.0),
                    float(o.discount or 0.0),
                    o.status,
                    o.payment_status,
                    o.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        log_analytics_export_audit(
            user=request.user,
            report_type=report_type,
            date_range=f"{date_meta['start_date']} to {date_meta['end_date']}",
            request=request
        )

        return response


class RestaurantAnalyticsView(views.APIView):
    """
    GET: Returns verified analytics for an authorized restaurant.
    Strictly forbids access to another restaurant's private data.
    """
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwnerOrAdmin]

    def get_restaurant(self, request, pk=None):
        query_restaurant_id = request.query_params.get('restaurant_id')
        if query_restaurant_id and not pk:
            pk = query_restaurant_id
        if pk:
            try:
                pk = int(pk)
            except (TypeError, ValueError):
                return None
            restaurant = Restaurant.objects.filter(id=pk).first()
            if not restaurant:
                return None
            self.check_object_permissions(request, restaurant)
            return restaurant
        
        # Self-managed: look up by authenticated owner
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant and request.user.is_staff:
            restaurant = Restaurant.objects.first()
        return restaurant

    def get(self, request, pk=None):
        restaurant = self.get_restaurant(request, pk)
        if not restaurant:
            return Response(
                {'error': 'Restaurant not found or you are not authorized to view its analytics.'},
                status=status.HTTP_404_NOT_FOUND
            )

        date_meta = parse_analytics_date_range(request, default_days=30)
        compare_prior = str(request.query_params.get('compare_prior', '')).lower() in ['true', '1', 'yes']

        analytics_data = get_restaurant_analytics(
            restaurant=restaurant,
            start_dt=date_meta['start_datetime'],
            end_dt=date_meta['end_datetime'],
            compare_prior=compare_prior
        )

        analytics_data['period'] = {
            'start_date': date_meta['start_date'],
            'end_date': date_meta['end_date'],
            'days_span': date_meta['days_span'],
            'timezone': date_meta['timezone']
        }

        return Response(analytics_data)


class RestaurantAnalyticsExportView(views.APIView):
    """
    GET: Exports CSV order report for the authorized restaurant owner only.
    """
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwnerOrAdmin]

    def get_restaurant(self, request, pk=None):
        query_restaurant_id = request.query_params.get('restaurant_id')
        if query_restaurant_id and not pk:
            pk = query_restaurant_id
        if pk:
            try:
                pk = int(pk)
            except (TypeError, ValueError):
                return None
            restaurant = Restaurant.objects.filter(id=pk).first()
            if not restaurant:
                return None
            self.check_object_permissions(request, restaurant)
            return restaurant
        restaurant = Restaurant.objects.filter(owner=request.user).first()
        if not restaurant and request.user.is_staff:
            restaurant = Restaurant.objects.first()
        return restaurant

    def get(self, request, pk=None):
        restaurant = self.get_restaurant(request, pk)
        if not restaurant:
            return Response(
                {'error': 'Restaurant not found or you are not authorized.'},
                status=status.HTTP_404_NOT_FOUND
            )

        date_meta = parse_analytics_date_range(request, default_days=30)
        start_dt = date_meta['start_datetime']
        end_dt = date_meta['end_datetime']

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
        response['Content-Disposition'] = f'attachment; filename="restaurant_{restaurant.id}_orders_{timestamp_str}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Order Number', 'Items Total (INR)', 'Packaging Fee (INR)', 'Platform Fee (INR)',
            'Grand Total (INR)', 'Order Status', 'Items Count', 'Created Date'
        ])

        orders = Order.objects.filter(
            restaurant=restaurant,
            created_at__gte=start_dt,
            created_at__lte=end_dt
        ).prefetch_related('items').order_by('-created_at')

        for o in orders[:5000]:
            writer.writerow([
                o.order_number,
                float(o.item_total or 0.0),
                float(o.packaging_fee or 0.0),
                float(o.platform_fee or 0.0),
                float(o.grand_total or 0.0),
                o.status,
                o.items.count(),
                o.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])

        return response


class DeliveryPartnerAnalyticsView(views.APIView):
    """
    GET: Returns verified operational metrics for an authorized delivery partner.
    Protects customer addresses and coordinates.
    """
    permission_classes = [permissions.IsAuthenticated, IsDeliveryPartnerOrAdmin]

    def get(self, request):
        target_user = request.user
        partner_id = request.query_params.get('partner_id')
        if partner_id and request.user.is_staff:
            partner = DeliveryPartner.objects.filter(id=partner_id).select_related('user').first()
            if partner:
                target_user = partner.user

        date_meta = parse_analytics_date_range(request, default_days=30)

        analytics_data = get_delivery_partner_analytics(
            partner_user=target_user,
            start_dt=date_meta['start_datetime'],
            end_dt=date_meta['end_datetime']
        )

        analytics_data['period'] = {
            'start_date': date_meta['start_date'],
            'end_date': date_meta['end_date'],
            'days_span': date_meta['days_span'],
            'timezone': date_meta['timezone']
        }

        return Response(analytics_data)


class DeliveryPartnerAnalyticsExportView(views.APIView):
    """
    GET: Exports CSV trip history for an authorized delivery partner.
    Customer street addresses and lat/lng coordinates are strictly excluded.
    """
    permission_classes = [permissions.IsAuthenticated, IsDeliveryPartnerOrAdmin]

    def get(self, request):
        target_user = request.user
        date_meta = parse_analytics_date_range(request, default_days=30)
        start_dt = date_meta['start_datetime']
        end_dt = date_meta['end_datetime']

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
        response['Content-Disposition'] = f'attachment; filename="delivery_trips_{target_user.username}_{timestamp_str}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Assignment ID', 'Order Number', 'Restaurant Name', 'Trip Status',
            'Transit Duration (Mins)', 'Payout (INR)', 'Accepted At', 'Picked Up At', 'Delivered At'
        ])

        assignments = DeliveryAssignment.objects.filter(
            delivery_partner=target_user,
            created_at__gte=start_dt,
            created_at__lte=end_dt
        ).select_related('order', 'order__restaurant').order_by('-created_at')

        for a in assignments[:5000]:
            duration_mins = ''
            if a.picked_up_at and a.delivered_at and a.delivered_at > a.picked_up_at:
                duration_mins = round((a.delivered_at - a.picked_up_at).total_seconds() / 60.0, 1)

            writer.writerow([
                a.id,
                a.order.order_number if a.order else '',
                a.order.restaurant.name if (a.order and a.order.restaurant) else 'Kitchen',
                a.status,
                duration_mins,
                float(a.order.delivery_fee or 35.0) if a.order else 35.0,
                a.accepted_at.strftime('%Y-%m-%d %H:%M:%S') if a.accepted_at else '',
                a.picked_up_at.strftime('%Y-%m-%d %H:%M:%S') if a.picked_up_at else '',
                a.delivered_at.strftime('%Y-%m-%d %H:%M:%S') if a.delivered_at else ''
            ])

        return response
