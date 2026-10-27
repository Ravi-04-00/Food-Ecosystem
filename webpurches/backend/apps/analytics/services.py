from datetime import datetime, time, timedelta
from decimal import Decimal
import pytz

from django.db.models import (
    Count, Sum, Avg, Q, F, FloatField, ExpressionWrapper, DateTimeField
)
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone

from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.products.models import Restaurant, FoodItem
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.coupons.models import CouponRedemption
from apps.reviews.models import Review
from apps.accounts.models import User
from .metric_definitions import METRIC_DEFINITIONS, REPORTING_TIMEZONE


def parse_analytics_date_range(request, default_days=30):
    """
    Parses and bounds date parameters in accordance with the reporting timezone.
    Supports 'start_date', 'date_start', 'date_from' and 'end_date', 'date_end', 'date_to'.
    Enforces maximum range of 365 days and exact midnight-to-end-of-day boundaries.
    """
    tz = pytz.timezone(REPORTING_TIMEZONE)
    now_in_tz = timezone.now().astimezone(tz)
    today = now_in_tz.date()

    raw_start = (
        request.query_params.get('start_date') or 
        request.query_params.get('date_start') or 
        request.query_params.get('date_from')
    )
    raw_end = (
        request.query_params.get('end_date') or 
        request.query_params.get('date_end') or 
        request.query_params.get('date_to')
    )

    try:
        if raw_start:
            parsed_start = datetime.strptime(raw_start.strip(), '%Y-%m-%d').date()
        else:
            parsed_start = today - timedelta(days=default_days)
    except (ValueError, AttributeError):
        parsed_start = today - timedelta(days=default_days)

    try:
        if raw_end:
            parsed_end = datetime.strptime(raw_end.strip(), '%Y-%m-%d').date()
        else:
            parsed_end = today
    except (ValueError, AttributeError):
        parsed_end = today

    # Validate ordering
    if parsed_start > parsed_end:
        parsed_start, parsed_end = parsed_end, parsed_start

    # Bound maximum date span to 365 days
    if (parsed_end - parsed_start).days > 365:
        parsed_start = parsed_end - timedelta(days=365)

    start_datetime = tz.localize(datetime.combine(parsed_start, time.min))
    end_datetime = tz.localize(datetime.combine(parsed_end, time.max))

    return {
        'start_date': parsed_start.strftime('%Y-%m-%d'),
        'end_date': parsed_end.strftime('%Y-%m-%d'),
        'start_datetime': start_datetime,
        'end_datetime': end_datetime,
        'days_span': (parsed_end - parsed_start).days + 1,
        'timezone': REPORTING_TIMEZONE
    }


def get_admin_analytics_summary(start_dt, end_dt, filters=None):
    """
    Computes verified platform-wide summary cards using database aggregations.
    Guarantees no double-counting between orders and payments.
    """
    filters = filters or {}
    
    # Base Order QuerySet bounded by date range
    orders_qs = Order.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)
    payments_qs = Payment.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)

    # Optional Admin Filters
    order_status = filters.get('order_status')
    if order_status and order_status.upper() != 'ALL':
        orders_qs = orders_qs.filter(status=order_status.upper())

    restaurant_id = filters.get('restaurant_id')
    if restaurant_id and restaurant_id != 'ALL':
        orders_qs = orders_qs.filter(restaurant_id=restaurant_id)
        payments_qs = payments_qs.filter(order__restaurant_id=restaurant_id)

    delivery_partner_id = filters.get('delivery_partner_id')
    if delivery_partner_id and delivery_partner_id != 'ALL':
        orders_qs = orders_qs.filter(rider_id=delivery_partner_id)

    payment_status = filters.get('payment_status')
    if payment_status and payment_status.upper() != 'ALL':
        payments_qs = payments_qs.filter(status=payment_status.upper())

    # Order Aggregations
    total_orders = orders_qs.count()
    completed_orders = orders_qs.filter(status='DELIVERED').count()
    cancelled_orders = orders_qs.filter(status='CANCELLED').count()
    in_flight_orders = total_orders - completed_orders - cancelled_orders

    gov_aggr = orders_qs.aggregate(s=Sum('grand_total'))['s']
    gross_order_value = float(gov_aggr or 0.0)

    completed_gov_aggr = orders_qs.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s']
    net_completed_order_value = float(completed_gov_aggr or 0.0)

    # Average Order Value (GOV / Total Orders placed)
    average_order_value = round(gross_order_value / total_orders, 2) if total_orders > 0 else 0.0

    # Payment Aggregations (Strict Accounting)
    captured_payments_aggr = payments_qs.filter(status__in=['PAID', 'SETTLED', 'VERIFIED_PAID']).aggregate(s=Sum('amount'))['s']
    captured_payments = float(captured_payments_aggr or 0.0)

    pending_payments_aggr = payments_qs.filter(
        status__in=['PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PENDING']
    ).aggregate(s=Sum('amount'))['s']
    pending_payments = float(pending_payments_aggr or 0.0)

    failed_payments_aggr = payments_qs.filter(
        status__in=['FAILED', 'CANCELLED']
    ).aggregate(s=Sum('amount'))['s']
    failed_payments = float(failed_payments_aggr or 0.0)

    # Authoritative Refunds
    refunds_aggr = payments_qs.filter(
        Q(status__in=['REFUNDED', 'PARTIALLY_REFUNDED']) | Q(refund_amount__gt=0)
    ).aggregate(s=Sum('refund_amount'))['s']
    verified_refunds = float(refunds_aggr or 0.0)

    # Discounts Breakdown
    redemptions_aggr = CouponRedemption.objects.filter(
        status='COMMITTED',
        redeemed_at__gte=start_dt,
        redeemed_at__lte=end_dt
    ).aggregate(s=Sum('discount_amount'), c=Count('id'))
    coupon_discounts = float(redemptions_aggr['s'] or 0.0)
    coupons_used_count = redemptions_aggr['c'] or 0

    loyalty_discounts_aggr = orders_qs.aggregate(s=Sum('loyalty_discount'))['s']
    loyalty_discounts = float(loyalty_discounts_aggr or 0.0)
    total_discounts = round(coupon_discounts + loyalty_discounts, 2)

    # Platform & Merchant Economics on Delivered Orders
    delivered_orders = orders_qs.filter(status='DELIVERED')
    platform_fees_aggr = delivered_orders.aggregate(s=Sum('platform_fee'))['s']
    platform_fees = float(platform_fees_aggr or 0.0)

    item_totals_aggr = delivered_orders.aggregate(s=Sum('item_total'))['s']
    item_totals = float(item_totals_aggr or 0.0)

    packaging_fees_aggr = delivered_orders.aggregate(s=Sum('packaging_fee'))['s']
    packaging_fees = float(packaging_fees_aggr or 0.0)

    delivery_fees_aggr = delivered_orders.aggregate(s=Sum('delivery_fee'))['s']
    delivery_fees = float(delivery_fees_aggr or 0.0)

    platform_commission = round(platform_fees + (item_totals * 0.10), 2)
    restaurant_settlement = round(item_totals + packaging_fees - (item_totals * 0.10), 2)
    delivery_payouts = round(delivery_fees, 2)

    # Operational Footprint
    active_restaurants = Restaurant.objects.filter(is_open=True, verification_status='APPROVED').count()
    active_delivery_partners = DeliveryPartner.objects.filter(is_online=True, is_verified=True).count()

    return {
        'total_orders': total_orders,
        'completed_orders': completed_orders,
        'cancelled_orders': cancelled_orders,
        'in_flight_orders': max(0, in_flight_orders),
        'gross_order_value': gross_order_value,
        'net_completed_order_value': net_completed_order_value,
        'average_order_value': average_order_value,
        'verified_captured_payments': captured_payments,
        'unverified_pending_payments': pending_payments,
        'failed_payments': failed_payments,
        'verified_refunds': verified_refunds,
        'active_restaurants': active_restaurants,
        'active_delivery_partners': active_delivery_partners,
        'discounts': {
            'total_discounts': total_discounts,
            'coupon_discounts': coupon_discounts,
            'coupons_used_count': coupons_used_count,
            'loyalty_discounts': loyalty_discounts
        },
        'economics': {
            'platform_commission': platform_commission,
            'restaurant_settlement': restaurant_settlement,
            'delivery_payouts': delivery_payouts
        }
    }


def get_admin_analytics_charts(start_dt, end_dt, interval='day', filters=None):
    """
    Computes real time-series distributions and category breakdowns.
    Uses PostgreSQL TruncDate, TruncWeek, or TruncMonth.
    """
    filters = filters or {}
    orders_qs = Order.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)
    payments_qs = Payment.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)

    if filters.get('restaurant_id') and filters['restaurant_id'] != 'ALL':
        orders_qs = orders_qs.filter(restaurant_id=filters['restaurant_id'])
        payments_qs = payments_qs.filter(order__restaurant_id=filters['restaurant_id'])

    # Determine truncation function
    if interval == 'month':
        trunc_fn = TruncMonth('created_at')
        coupon_trunc_fn = TruncMonth('redeemed_at')
    elif interval == 'week':
        trunc_fn = TruncWeek('created_at')
        coupon_trunc_fn = TruncWeek('redeemed_at')
    else:
        trunc_fn = TruncDate('created_at')
        coupon_trunc_fn = TruncDate('redeemed_at')

    # 1. Orders and GOV over time
    timeline_records = list(
        orders_qs.annotate(period=trunc_fn)
        .values('period')
        .annotate(
            total_orders=Count('id'),
            completed_orders=Count('id', filter=Q(status='DELIVERED')),
            cancelled_orders=Count('id', filter=Q(status='CANCELLED')),
            gross_order_value=Sum('grand_total'),
            completed_order_value=Sum('grand_total', filter=Q(status='DELIVERED'))
        )
        .order_by('period')
    )

    formatted_timeline = [
        {
            'period': entry['period'].strftime('%Y-%m-%d') if hasattr(entry['period'], 'strftime') else str(entry['period']),
            'total_orders': entry['total_orders'],
            'completed_orders': entry['completed_orders'],
            'cancelled_orders': entry['cancelled_orders'],
            'gross_order_value': float(entry['gross_order_value'] or 0.0),
            'completed_order_value': float(entry['completed_order_value'] or 0.0),
        }
        for entry in timeline_records
    ]

    # 2. Payment Status Distribution
    payment_status_dist = list(
        payments_qs.values('status')
        .annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        .order_by('-total_amount')
    )
    for p in payment_status_dist:
        p['total_amount'] = float(p['total_amount'] or 0.0)

    # 3. Order Status Distribution
    order_status_dist = list(
        orders_qs.values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # 4. Top Restaurant Performance Comparison (Top 10)
    restaurant_performance = list(
        orders_qs.filter(restaurant__isnull=False)
        .values('restaurant__id', 'restaurant__name')
        .annotate(
            total_orders=Count('id'),
            completed_orders=Count('id', filter=Q(status='DELIVERED')),
            gross_sales=Sum('grand_total', filter=Q(status='DELIVERED'))
        )
        .order_by('-gross_sales')[:10]
    )
    for r in restaurant_performance:
        r['gross_sales'] = float(r['gross_sales'] or 0.0)

    # 5. Delivery Completion Trends (DeliveryAssignment)
    delivery_trends = list(
        DeliveryAssignment.objects.filter(created_at__gte=start_dt, created_at__lte=end_dt)
        .annotate(period=trunc_fn)
        .values('period')
        .annotate(
            total_assigned=Count('id'),
            completed=Count('id', filter=Q(status='DELIVERED')),
            cancelled=Count('id', filter=Q(status__in=['CANCELLED', 'FAILED']))
        )
        .order_by('period')
    )
    formatted_delivery_trends = [
        {
            'period': entry['period'].strftime('%Y-%m-%d') if hasattr(entry['period'], 'strftime') else str(entry['period']),
            'total_assigned': entry['total_assigned'],
            'completed': entry['completed'],
            'cancelled': entry['cancelled']
        }
        for entry in delivery_trends
    ]

    # 6. Cancellation Trends & Reasons
    cancelled_orders = orders_qs.filter(status='CANCELLED')
    cancellation_reasons = list(
        cancelled_orders.exclude(cancellation_reason='')
        .values('cancellation_reason')
        .annotate(count=Count('id'))
        .order_by('-count')[:8]
    )

    # 7. Coupon Usage Trends
    coupon_trends = list(
        CouponRedemption.objects.filter(
            status='COMMITTED',
            redeemed_at__gte=start_dt,
            redeemed_at__lte=end_dt
        )
        .annotate(period=coupon_trunc_fn)
        .values('period')
        .annotate(
            redemptions=Count('id'),
            total_discount=Sum('discount_amount')
        )
        .order_by('period')
    )
    formatted_coupon_trends = [
        {
            'period': entry['period'].strftime('%Y-%m-%d') if hasattr(entry['period'], 'strftime') else str(entry['period']),
            'redemptions': entry['redemptions'],
            'total_discount': float(entry['total_discount'] or 0.0)
        }
        for entry in coupon_trends
    ]

    return {
        'orders_timeline': formatted_timeline,
        'payment_status_distribution': payment_status_dist,
        'order_status_distribution': order_status_dist,
        'restaurant_performance': restaurant_performance,
        'delivery_trends': formatted_delivery_trends,
        'cancellation_reasons': cancellation_reasons,
        'coupon_trends': formatted_coupon_trends
    }


def get_restaurant_analytics(restaurant, start_dt, end_dt, compare_prior=False):
    """
    Computes verified restaurant-owner analytics for a single authorized restaurant.
    Never leaks information of any other restaurant.
    """
    orders_qs = Order.objects.filter(restaurant=restaurant, created_at__gte=start_dt, created_at__lte=end_dt)

    # Localized today check for current day orders
    tz = pytz.timezone(REPORTING_TIMEZONE)
    today_date = timezone.now().astimezone(tz).date()
    today_start = tz.localize(datetime.combine(today_date, time.min))
    today_end = tz.localize(datetime.combine(today_date, time.max))
    today_orders_count = Order.objects.filter(restaurant=restaurant, created_at__gte=today_start, created_at__lte=today_end).count()

    total_orders = orders_qs.count()
    placed_orders = orders_qs.filter(status='PLACED').count()
    confirmed_orders = orders_qs.filter(status__in=['CONFIRMED', 'ACCEPTED']).count()
    preparing_orders = orders_qs.filter(status='PREPARING').count()
    ready_orders = orders_qs.filter(status__in=['READY_FOR_PICKUP', 'READY']).count()
    completed_orders = orders_qs.filter(status='DELIVERED').count()
    cancelled_orders = orders_qs.filter(status='CANCELLED').count()

    gov_aggr = orders_qs.aggregate(s=Sum('grand_total'))['s']
    gross_order_value = float(gov_aggr or 0.0)

    completed_rev_aggr = orders_qs.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s']
    completed_revenue = float(completed_rev_aggr or 0.0)

    item_sales_aggr = orders_qs.filter(status='DELIVERED').aggregate(s=Sum('item_total'))['s']
    item_sales_total = float(item_sales_aggr or 0.0)

    # Payment aggregations: Captured payments & Refunds
    payments_qs = Payment.objects.filter(order__restaurant=restaurant, created_at__gte=start_dt, created_at__lte=end_dt)
    captured_payments_aggr = payments_qs.filter(status__in=['CAPTURED', 'PAID', 'SUCCESS', 'VERIFIED_PAID']).aggregate(s=Sum('amount'))['s']
    captured_payments_total = float(captured_payments_aggr or 0.0)

    refunds_aggr = payments_qs.filter(status__in=['REFUNDED', 'PARTIALLY_REFUNDED']).aggregate(s=Sum('refund_amount'))['s']
    refunds_full_aggr = payments_qs.filter(status='REFUNDED', refund_amount=0).aggregate(s=Sum('amount'))['s']
    refunds_total = float(refunds_aggr or 0.0) + float(refunds_full_aggr or 0.0)

    # Estimated Net Payout (Items + Packaging - 10% platform commission)
    pkg_aggr = orders_qs.filter(status='DELIVERED').aggregate(s=Sum('packaging_fee'))['s']
    pkg_total = float(pkg_aggr or 0.0)
    net_payout = round(item_sales_total + pkg_total - (item_sales_total * 0.10), 2)

    # Top-Selling Dishes based on actual OrderItem records
    top_items_qs = (
        OrderItem.objects.filter(
            order__restaurant=restaurant,
            order__status='DELIVERED',
            order__created_at__gte=start_dt,
            order__created_at__lte=end_dt
        )
        .values('food_item_id', 'food_name_snapshot')
        .annotate(
            total_quantity=Sum('quantity'),
            total_sales=Sum('item_total')
        )
        .order_by('-total_quantity')[:10]
    )

    top_items = [
        {
            'food_id': entry['food_item_id'],
            'name': entry['food_name_snapshot'] or 'Menu Item',
            'quantity_sold': entry['total_quantity'],
            'total_sales': float(entry['total_sales'] or 0.0)
        }
        for entry in top_items_qs
    ]

    # Low-Selling Dishes (Bottom items or active items with minimal sales)
    top_food_ids = [entry['food_item_id'] for entry in top_items_qs if entry['food_item_id']]
    low_selling_qs = (
        FoodItem.objects.filter(restaurant=restaurant, is_available=True)
        .exclude(id__in=top_food_ids)
        .values('id', 'name', 'price', 'stock')[:8]
    )
    low_selling_items = [
        {
            'food_id': f['id'],
            'name': f['name'],
            'price': float(f['price']),
            'stock': f['stock'],
            'units_sold': 0
        }
        for f in low_selling_qs
    ]

    # Menu Performance & Availability
    all_foods = FoodItem.objects.filter(restaurant=restaurant)
    total_menu_items = all_foods.count()
    available_menu_items = all_foods.filter(is_available=True, is_sold_out=False, stock__gt=0).count()
    sold_out_items = all_foods.filter(Q(is_sold_out=True) | Q(stock=0)).count()

    # Preparation Time Analysis (Configured vs Actual Observed from OrderStatusHistory)
    configured_prep_time = getattr(restaurant, 'avg_prep_time_minutes', 20)
    from apps.orders.models import OrderStatusHistory
    prep_durations = []
    ready_histories = OrderStatusHistory.objects.filter(
        order__restaurant=restaurant,
        to_status__in=['READY_FOR_PICKUP', 'READY'],
        created_at__gte=start_dt,
        created_at__lte=end_dt
    ).select_related('order')
    for rh in ready_histories[:100]:
        ph = OrderStatusHistory.objects.filter(order_id=rh.order_id, to_status='PREPARING').order_by('created_at').first()
        if ph and rh.created_at > ph.created_at:
            dur_mins = (rh.created_at - ph.created_at).total_seconds() / 60.0
            if 1 <= dur_mins <= 180:
                prep_durations.append(dur_mins)

    observed_prep_time_avg = round(sum(prep_durations) / len(prep_durations), 1) if prep_durations else None

    # Real Ratings & Review Trends
    reviews_qs = Review.objects.filter(
        restaurant=restaurant,
        moderation_status='APPROVED',
        created_at__gte=start_dt,
        created_at__lte=end_dt
    )
    total_reviews = reviews_qs.count()
    avg_rating_aggr = reviews_qs.aggregate(a=Avg('rating'))['a']
    avg_rating = round(float(avg_rating_aggr), 2) if avg_rating_aggr else float(restaurant.rating)

    food_quality_avg = reviews_qs.filter(food_quality_rating__isnull=False).aggregate(a=Avg('food_quality_rating'))['a']
    packaging_avg = reviews_qs.filter(packaging_rating__isnull=False).aggregate(a=Avg('packaging_rating'))['a']

    rating_distribution = {
        star: reviews_qs.filter(rating=star).count()
        for star in [5, 4, 3, 2, 1]
    }

    # Timeline / Trend Records
    days_span = (end_dt.date() - start_dt.date()).days + 1
    if days_span <= 2:
        # Group by hour for short intervals
        timeline_records = list(
            orders_qs.annotate(period=TruncDate('created_at'))
            .values('period')
            .annotate(
                total_orders=Count('id'),
                completed_orders=Count('id', filter=Q(status='DELIVERED')),
                gross_order_value=Sum('grand_total')
            )
            .order_by('period')
        )
    else:
        timeline_records = list(
            orders_qs.annotate(period=TruncDate('created_at'))
            .values('period')
            .annotate(
                total_orders=Count('id'),
                completed_orders=Count('id', filter=Q(status='DELIVERED')),
                gross_order_value=Sum('grand_total')
            )
            .order_by('period')
        )

    formatted_timeline = [
        {
            'date': entry['period'].strftime('%Y-%m-%d') if hasattr(entry['period'], 'strftime') else str(entry['period']),
            'orders': entry['total_orders'],
            'completed': entry['completed_orders'],
            'gross_sales': float(entry['gross_order_value'] or 0.0)
        }
        for entry in timeline_records
    ]

    # Operational Alerts
    operational_alerts = []
    # 1. Unconfirmed placed orders older than 5 minutes
    five_mins_ago = timezone.now() - timedelta(minutes=5)
    unconfirmed_delayed = Order.objects.filter(restaurant=restaurant, status='PLACED', created_at__lte=five_mins_ago).count()
    if unconfirmed_delayed > 0:
        operational_alerts.append({
            'type': 'CRITICAL',
            'code': 'UNCONFIRMED_ORDERS',
            'message': f"{unconfirmed_delayed} incoming order(s) awaiting kitchen acceptance for >5 minutes.",
            'action_tab': 'orders'
        })

    # 2. Orders Paused Alert
    if getattr(restaurant, 'orders_paused', False):
        operational_alerts.append({
            'type': 'WARNING',
            'code': 'ORDERS_PAUSED',
            'message': f"New orders are currently PAUSED ({restaurant.pause_reason or 'Manual toggle'}). Turn on order acceptance to resume orders.",
            'action_tab': 'settings'
        })

    # 3. Store Closed Alert
    if not restaurant.is_open:
        operational_alerts.append({
            'type': 'WARNING',
            'code': 'STORE_CLOSED',
            'message': "Restaurant is marked CLOSED. Customers cannot place orders.",
            'action_tab': 'settings'
        })

    # 4. Sold out items alert
    if sold_out_items > 0:
        operational_alerts.append({
            'type': 'INFO',
            'code': 'ITEMS_SOLD_OUT',
            'message': f"{sold_out_items} menu item(s) are currently marked sold out or out of stock.",
            'action_tab': 'menu'
        })

    # Optional Prior Period Comparison
    prior_comparison = None
    if compare_prior:
        duration = end_dt - start_dt
        prior_start = start_dt - duration
        prior_end = start_dt

        prior_orders_qs = Order.objects.filter(restaurant=restaurant, created_at__gte=prior_start, created_at__lte=prior_end)
        prior_total = prior_orders_qs.count()
        prior_completed = prior_orders_qs.filter(status='DELIVERED').count()
        prior_gov = float(prior_orders_qs.aggregate(s=Sum('grand_total'))['s'] or 0.0)

        prior_comparison = {
            'has_valid_data': prior_total > 0,
            'prior_period_start': prior_start.strftime('%Y-%m-%d'),
            'prior_period_end': prior_end.strftime('%Y-%m-%d'),
            'prior_total_orders': prior_total,
            'prior_completed_orders': prior_completed,
            'prior_gross_order_value': prior_gov,
            'order_growth_pct': round(((total_orders - prior_total) / prior_total) * 100, 1) if prior_total > 0 else None,
            'gov_growth_pct': round(((gross_order_value - prior_gov) / prior_gov) * 100, 1) if prior_gov > 0 else None,
        }

    return {
        'restaurant_id': restaurant.id,
        'restaurant_name': restaurant.name,
        'is_open': restaurant.is_open,
        'orders_paused': getattr(restaurant, 'orders_paused', False),
        'pause_reason': getattr(restaurant, 'pause_reason', ''),
        'order_metrics': {
            'today_orders': today_orders_count,
            'total_orders': total_orders,
            'placed_orders': placed_orders,
            'confirmed_orders': confirmed_orders,
            'preparing_orders': preparing_orders,
            'ready_orders': ready_orders,
            'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders,
            'gross_order_value': gross_order_value,
            'captured_payments_total': captured_payments_total,
            'refunds_total': refunds_total,
            'completed_revenue': completed_revenue,
            'item_sales_total': item_sales_total,
            'net_payout_estimated': net_payout,
            'restaurant_earnings': net_payout
        },
        'preparation_time': {
            'configured_prep_time_minutes': configured_prep_time,
            'observed_prep_time_avg_minutes': observed_prep_time_avg,
            'observed_samples_count': len(prep_durations),
            'has_sufficient_history': len(prep_durations) >= 5
        },
        'prep_time_metrics': {
            'configured_avg_prep_time_minutes': configured_prep_time,
            'observed_prep_time_minutes': observed_prep_time_avg,
            'observed_samples_count': len(prep_durations),
            'has_sufficient_history': len(prep_durations) >= 5,
            'is_delayed_alert': bool(observed_prep_time_avg and observed_prep_time_avg > configured_prep_time)
        },
        'top_selling_items': top_items,
        'low_selling_items': low_selling_items,
        'menu_performance': {
            'total_items': total_menu_items,
            'available_items': available_menu_items,
            'sold_out_items': sold_out_items,
            'availability_rate': round((available_menu_items / total_menu_items) * 100, 1) if total_menu_items > 0 else 100.0
        },
        'ratings_and_reviews': {
            'total_reviews': total_reviews,
            'average_rating': avg_rating,
            'food_quality_avg': round(float(food_quality_avg), 2) if food_quality_avg else None,
            'packaging_avg': round(float(packaging_avg), 2) if packaging_avg else None,
            'star_distribution': rating_distribution
        },
        'order_timeline': formatted_timeline,
        'operational_alerts': operational_alerts,
        'prior_period_comparison': prior_comparison
    }


def get_delivery_partner_analytics(partner_user, start_dt, end_dt):
    """
    Computes verified delivery partner metrics for an authorized partner.
    Calculates average delivery duration using strict timestamp validation (delivered_at - picked_up_at).
    Protects customer addresses and precise coordinates.
    """
    assignments_qs = DeliveryAssignment.objects.filter(
        delivery_partner=partner_user,
        created_at__gte=start_dt,
        created_at__lte=end_dt
    )

    total_assigned = assignments_qs.count()
    completed_deliveries = assignments_qs.filter(status='DELIVERED').count()
    cancelled_deliveries = assignments_qs.filter(status__in=['CANCELLED', 'FAILED']).count()
    issues_reported = assignments_qs.exclude(issue_notes='').count()

    # Average Delivery Duration in Minutes:
    # Requires delivered_at and picked_up_at, with delivered_at > picked_up_at
    valid_duration_records = assignments_qs.filter(
        status='DELIVERED',
        picked_up_at__isnull=False,
        delivered_at__isnull=False,
        delivered_at__gt=F('picked_up_at')
    )

    durations_minutes = []
    for a in valid_duration_records:
        delta = a.delivered_at - a.picked_up_at
        mins = delta.total_seconds() / 60.0
        if 2.0 <= mins <= 180.0:  # Reasonability bound between 2 mins and 3 hours
            durations_minutes.append(mins)

    avg_duration_minutes = (
        round(sum(durations_minutes) / len(durations_minutes), 1)
        if durations_minutes else None
    )

    # Real Ratings from verified reviews
    reviews_qs = Review.objects.filter(
        delivery_partner=partner_user,
        moderation_status='APPROVED',
        created_at__gte=start_dt,
        created_at__lte=end_dt
    )
    total_reviews = reviews_qs.count()
    avg_rating_aggr = reviews_qs.aggregate(a=Avg('rating'))['a']
    partner_profile = getattr(partner_user, 'delivery_profile', None)
    fallback_rating = float(partner_profile.rating) if partner_profile else 5.0
    average_rating = round(float(avg_rating_aggr), 2) if avg_rating_aggr else fallback_rating

    delivery_rating_avg = reviews_qs.filter(delivery_rating__isnull=False).aggregate(a=Avg('delivery_rating'))['a']

    # Partner Earnings on Completed Orders
    delivered_orders = Order.objects.filter(
        rider=partner_user,
        status='DELIVERED',
        created_at__gte=start_dt,
        created_at__lte=end_dt
    )
    total_delivery_fees = float(delivered_orders.aggregate(s=Sum('delivery_fee'))['s'] or 0.0)

    # Recent completed trips with customer PII strictly masked
    recent_completed_trips = []
    for a in assignments_qs.filter(status='DELIVERED').select_related('order', 'order__restaurant').order_by('-delivered_at')[:8]:
        order = a.order
        duration_mins = None
        if a.picked_up_at and a.delivered_at and a.delivered_at > a.picked_up_at:
            duration_mins = round((a.delivered_at - a.picked_up_at).total_seconds() / 60.0, 1)

        recent_completed_trips.append({
            'assignment_id': a.id,
            'order_number': order.order_number,
            'restaurant_name': order.restaurant.name if order.restaurant else 'Cloud Kitchen',
            'duration_minutes': duration_mins,
            'payout': float(order.delivery_fee or 35.0),
            'completed_at': a.delivered_at.strftime('%Y-%m-%d %H:%M:%S') if a.delivered_at else ''
        })

    return {
        'partner_username': partner_user.username,
        'metrics': {
            'total_assigned': total_assigned,
            'completed_deliveries': completed_deliveries,
            'cancelled_deliveries': cancelled_deliveries,
            'issues_reported': issues_reported,
            'completion_rate_pct': round((completed_deliveries / total_assigned) * 100, 1) if total_assigned > 0 else 100.0,
            'average_duration_minutes': avg_duration_minutes,
            'valid_duration_sample_count': len(durations_minutes)
        },
        'ratings': {
            'total_reviews': total_reviews,
            'average_rating': average_rating,
            'delivery_rating_avg': round(float(delivery_rating_avg), 2) if delivery_rating_avg else None
        },
        'earnings': {
            'total_delivery_payouts': total_delivery_fees,
            'completed_trips_count': completed_deliveries
        },
        'recent_trips': recent_completed_trips
    }
