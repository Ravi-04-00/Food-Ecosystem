import logging
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.accounts.models import AuditLog
from apps.adminpanel.models import PlatformConfig
from apps.products.models import Restaurant
from apps.payments.models import (
    RestaurantCommission,
    RestaurantSettlement,
    SettlementAdjustment
)
from apps.payments.settlement_serializers import (
    RestaurantCommissionSerializer,
    RestaurantSettlementListSerializer,
    RestaurantSettlementDetailSerializer,
    SettlementAdjustmentSerializer,
    SettlementCreateBatchInputSerializer,
    SettlementStatusTransitionInputSerializer,
    SettlementAdjustmentInputSerializer,
    CommissionRulesUpdateSerializer
)
from apps.payments.commission_service import (
    get_active_commission_config,
    get_restaurant_earnings_summary,
    create_settlement_batch,
    transition_settlement_status,
    add_settlement_adjustment,
    run_payment_reconciliation,
    export_settlement_statement_csv,
    export_reconciliation_csv,
    quantize_money
)

logger = logging.getLogger(__name__)


class StandardPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


def get_user_restaurant(user, restaurant_id=None):
    """Helper to resolve restaurant for user with strict ownership verification."""
    if restaurant_id and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
        return Restaurant.objects.filter(id=restaurant_id).first()
    # Find restaurant owned by user
    return Restaurant.objects.filter(owner=user).first()


# ===========================================================================
# 1. Restaurant Self-Service Views (Port 3001)
# ===========================================================================

class RestaurantEarningsSummaryView(views.APIView):
    """
    GET /api/payments/restaurant/earnings/
    Returns authoritative gross sales, platform commission deducted, packaging fees,
    refunds, net finalized earnings, and settlement balances for authenticated merchant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return Response(
                {'error': 'No restaurant found associated with current authenticated account.'},
                status=status.HTTP_404_NOT_FOUND
            )

        date_from = request.query_params.get('start_date') or request.query_params.get('date_from')
        date_to = request.query_params.get('end_date') or request.query_params.get('date_to')

        summary = get_restaurant_earnings_summary(restaurant, date_from=date_from, date_to=date_to)
        return Response(summary, status=status.HTTP_200_OK)


class RestaurantSettlementListView(views.APIView):
    """
    GET /api/payments/restaurant/settlements/
    Lists settlement batches belonging strictly to the authenticated restaurant.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        queryset = RestaurantSettlement.objects.filter(restaurant=restaurant).order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        date_from = request.query_params.get('start_date') or request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(period_start__gte=date_from)

        date_to = request.query_params.get('end_date') or request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(period_end__lte=date_to)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = RestaurantSettlementListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class RestaurantSettlementDetailView(views.APIView):
    """
    GET /api/payments/restaurant/settlements/<reference>/
    Inspects a specific settlement batch and its attached commission breakdown.
    Guarantees isolation: restaurants cannot view another store's settlement.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        settlement = RestaurantSettlement.objects.filter(settlement_reference=reference).first()
        if not settlement:
            return Response({'error': 'Settlement not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Strict ownership check
        if settlement.restaurant.owner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Unauthorized: This settlement does not belong to your restaurant.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RestaurantSettlementDetailSerializer(settlement)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RestaurantCommissionEntriesView(views.APIView):
    """
    GET /api/payments/restaurant/commission-orders/
    Order-level commission & earnings ledger for authenticated merchant.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        queryset = RestaurantCommission.objects.filter(restaurant=restaurant).select_related('order', 'order__customer').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = RestaurantCommissionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class RestaurantEarningsStatementCSVView(views.APIView):
    """
    GET /api/payments/restaurant/earnings/statement/
    Download verified restaurant settlement statement as CSV.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        date_from = request.query_params.get('start_date') or request.query_params.get('date_from')
        date_to = request.query_params.get('end_date') or request.query_params.get('date_to')

        return export_settlement_statement_csv(restaurant, date_from, date_to)


# ===========================================================================
# 2. Admin Settlement Mission Control Views (Port 3003)
# ===========================================================================

class AdminSettlementListView(views.APIView):
    """
    GET /api/payments/admin/settlements/
    Global settlement queue with filtering and summary metrics grouped by status.
    """
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardPagination

    def get(self, request):
        queryset = RestaurantSettlement.objects.select_related('restaurant').order_by('-created_at')

        # Status filter
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        # Restaurant filter
        rest_id = request.query_params.get('restaurant_id')
        if rest_id and str(rest_id).isdigit():
            queryset = queryset.filter(restaurant_id=int(rest_id))

        # Search by reference or restaurant name
        q = request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(settlement_reference__icontains=q) |
                Q(restaurant__name__icontains=q) |
                Q(provider_reference__icontains=q) |
                Q(provider_utr__icontains=q)
            )

        # Overview status totals
        all_settlements = RestaurantSettlement.objects.all()
        summary_cards = {
            'total_settlements': all_settlements.count(),
            'pending_count': all_settlements.filter(status='PENDING').count(),
            'pending_amount': str(quantize_money(all_settlements.filter(status='PENDING').aggregate(val=Sum('net_payout_amount'))['val'] or Decimal('0.00'))),
            'processing_count': all_settlements.filter(status='PROCESSING').count(),
            'processing_amount': str(quantize_money(all_settlements.filter(status='PROCESSING').aggregate(val=Sum('net_payout_amount'))['val'] or Decimal('0.00'))),
            'paid_count': all_settlements.filter(status='PAID').count(),
            'paid_amount': str(quantize_money(all_settlements.filter(status='PAID').aggregate(val=Sum('net_payout_amount'))['val'] or Decimal('0.00'))),
            'failed_count': all_settlements.filter(status='FAILED').count(),
            'unsettled_accrued_orders': RestaurantCommission.objects.filter(status='ACCRUED', settlement__isnull=True).count(),
            'unsettled_accrued_amount': str(quantize_money(RestaurantCommission.objects.filter(status='ACCRUED', settlement__isnull=True).aggregate(val=Sum('net_restaurant_amount'))['val'] or Decimal('0.00')))
        }

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = RestaurantSettlementListSerializer(page, many=True)

        resp_data = paginator.get_paginated_response(serializer.data).data
        resp_data['summary_cards'] = summary_cards
        return Response(resp_data, status=status.HTTP_200_OK)


class AdminSettlementCreateBatchView(views.APIView):
    """
    POST /api/payments/admin/settlements/create-batch/
    Creates a new settlement batch for a given restaurant and date range.
    Uses select_for_update() to guarantee zero duplicate payouts.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = SettlementCreateBatchInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        rest_id = serializer.validated_data['restaurant_id']
        period_start = serializer.validated_data['period_start']
        period_end = serializer.validated_data['period_end']
        notes = serializer.validated_data.get('notes', '')

        restaurant = Restaurant.objects.filter(id=rest_id).first()
        if not restaurant:
            return Response({'error': f"Restaurant #{rest_id} not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            settlement = create_settlement_batch(
                restaurant=restaurant,
                period_start=period_start,
                period_end=period_end,
                created_by=request.user,
                notes=notes
            )
            return Response({
                'success': True,
                'message': f"Settlement #{settlement.settlement_reference} created with {settlement.order_count} orders.",
                'settlement': RestaurantSettlementDetailSerializer(settlement).data
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating settlement batch: {e}", exc_info=True)
            return Response({'error': 'Failed to create settlement batch.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminSettlementDetailView(views.APIView):
    """
    GET /api/payments/admin/settlements/<reference>/
    Full detail including underlying order commissions and adjustments.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, reference):
        settlement = RestaurantSettlement.objects.filter(settlement_reference=reference).first()
        if not settlement:
            return Response({'error': 'Settlement not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RestaurantSettlementDetailSerializer(settlement)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminSettlementStatusTransitionView(views.APIView):
    """
    POST /api/payments/admin/settlements/<reference>/status/
    Transitions settlement status (PENDING -> PROCESSING -> PAID).
    Requires verified provider UTR / bank reference to mark as PAID.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, reference):
        settlement = RestaurantSettlement.objects.filter(settlement_reference=reference).first()
        if not settlement:
            return Response({'error': 'Settlement not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SettlementStatusTransitionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        target_status = serializer.validated_data['status']
        reason = serializer.validated_data.get('reason', '')
        provider_ref = serializer.validated_data.get('provider_reference', '')
        provider_utr = serializer.validated_data.get('provider_utr', '')

        try:
            updated = transition_settlement_status(
                settlement=settlement,
                target_status=target_status,
                actor=request.user,
                reason=reason,
                provider_reference=provider_ref,
                provider_utr=provider_utr
            )
            return Response({
                'success': True,
                'message': f"Settlement #{reference} transitioned to {target_status}.",
                'settlement': RestaurantSettlementDetailSerializer(updated).data
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error transitioning settlement status: {e}", exc_info=True)
            return Response({'error': 'Failed to transition settlement status.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminSettlementAdjustmentView(views.APIView):
    """
    POST /api/payments/admin/settlements/<reference>/adjustments/
    Applies an audited credit or debit adjustment to a settlement.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, reference):
        settlement = RestaurantSettlement.objects.filter(settlement_reference=reference).first()
        if not settlement:
            return Response({'error': 'Settlement not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SettlementAdjustmentInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        adj_type = serializer.validated_data['adjustment_type']
        amount = serializer.validated_data['amount']
        reason = serializer.validated_data['reason']

        try:
            adj = add_settlement_adjustment(
                settlement=settlement,
                adjustment_type=adj_type,
                amount=amount,
                reason=reason,
                authorized_by=request.user
            )
            # Refetch updated settlement
            settlement.refresh_from_db()
            return Response({
                'success': True,
                'message': f"Adjustment of ₹{amount} applied to settlement #{reference}.",
                'adjustment': SettlementAdjustmentSerializer(adj).data,
                'settlement': RestaurantSettlementDetailSerializer(settlement).data
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding settlement adjustment: {e}", exc_info=True)
            return Response({'error': 'Failed to apply adjustment.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminPaymentReconciliationView(views.APIView):
    """
    GET /api/payments/admin/reconciliation/
    Cross-checks payment gateway records, orders, commission entries, and settlements.
    Returns discrepancy audit list and category breakdown.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        report = run_payment_reconciliation(start_date=start_date, end_date=end_date)
        return Response(report, status=status.HTTP_200_OK)


class AdminReconciliationExportCSVView(views.APIView):
    """
    GET /api/payments/admin/reconciliation/export-csv/
    Exports payment reconciliation discrepancy report as CSV.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        report = run_payment_reconciliation(start_date=start_date, end_date=end_date)
        return export_reconciliation_csv(report)


class AdminCommissionRulesView(views.APIView):
    """
    GET /api/payments/admin/commission-rules/
    PATCH /api/payments/admin/commission-rules/
    Inspect and update platform commission percentage and fixed fees with audit log.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        rate, fixed_fee = get_active_commission_config()
        config_obj = PlatformConfig.objects.filter(key='system_settings').first()

        return Response({
            'platform_commission_percentage': str(rate),
            'platform_commission_fixed_fee': str(fixed_fee),
            'currency': 'INR',
            'calculation_base_description': 'Eligible food item subtotal (order.item_total), excluding delivery fee, customer platform fee, and taxes.',
            'last_updated_at': config_obj.updated_at.isoformat() if config_obj else None,
            'last_updated_by': (config_obj.updated_by.get_full_name() or config_obj.updated_by.username) if (config_obj and config_obj.updated_by) else 'Initial Baseline'
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = CommissionRulesUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        config_obj, _ = PlatformConfig.objects.get_or_create(
            key='system_settings',
            defaults={'value': {}}
        )
        current_val = dict(config_obj.value or {})

        new_rate = serializer.validated_data.get('platform_commission_percentage')
        new_fixed = serializer.validated_data.get('platform_commission_fixed_fee')
        reason = serializer.validated_data['reason']

        before_state = {
            'platform_commission_percentage': current_val.get('platform_commission_percentage', 18.0),
            'platform_commission_fixed_fee': current_val.get('platform_commission_fixed_fee', 0.0)
        }

        if new_rate is not None:
            current_val['platform_commission_percentage'] = float(new_rate)
        if new_fixed is not None:
            current_val['platform_commission_fixed_fee'] = float(new_fixed)

        config_obj.value = current_val
        config_obj.updated_by = request.user
        config_obj.save()

        AuditLog.objects.create(
            actor=request.user,
            action='COMMISSION_RULES_UPDATED',
            target_model='PlatformConfig',
            target_id=str(config_obj.id),
            ip_address='127.0.0.1',
            details={
                'before': before_state,
                'after': {
                    'platform_commission_percentage': float(new_rate) if new_rate is not None else before_state['platform_commission_percentage'],
                    'platform_commission_fixed_fee': float(new_fixed) if new_fixed is not None else before_state['platform_commission_fixed_fee']
                },
                'reason': reason
            }
        )

        return Response({
            'success': True,
            'message': 'Commission rules updated successfully.',
            'platform_commission_percentage': str(current_val['platform_commission_percentage']),
            'platform_commission_fixed_fee': str(current_val.get('platform_commission_fixed_fee', 0.0)),
            'reason': reason
        }, status=status.HTTP_200_OK)
