from django.urls import path
from apps.payments.settlement_views import (
    RestaurantEarningsSummaryView,
    RestaurantSettlementListView,
    RestaurantSettlementDetailView,
    RestaurantCommissionEntriesView,
    RestaurantEarningsStatementCSVView,
    AdminSettlementListView,
    AdminSettlementCreateBatchView,
    AdminSettlementDetailView,
    AdminSettlementStatusTransitionView,
    AdminSettlementAdjustmentView,
    AdminPaymentReconciliationView,
    AdminReconciliationExportCSVView,
    AdminCommissionRulesView
)

urlpatterns = [
    # 1. Restaurant Self-Service
    path('restaurant/earnings/', RestaurantEarningsSummaryView.as_view(), name='restaurant_earnings_summary'),
    path('restaurant/settlements/', RestaurantSettlementListView.as_view(), name='restaurant_settlement_list'),
    path('restaurant/settlements/<str:reference>/', RestaurantSettlementDetailView.as_view(), name='restaurant_settlement_detail'),
    path('restaurant/commission-orders/', RestaurantCommissionEntriesView.as_view(), name='restaurant_commission_orders'),
    path('restaurant/earnings/statement/', RestaurantEarningsStatementCSVView.as_view(), name='restaurant_earnings_statement_csv'),

    # 2. Admin Settlement Operations
    path('admin/settlements/', AdminSettlementListView.as_view(), name='admin_settlement_list'),
    path('admin/settlements/create-batch/', AdminSettlementCreateBatchView.as_view(), name='admin_settlement_create_batch'),
    path('admin/settlements/<str:reference>/', AdminSettlementDetailView.as_view(), name='admin_settlement_detail'),
    path('admin/settlements/<str:reference>/status/', AdminSettlementStatusTransitionView.as_view(), name='admin_settlement_status_transition'),
    path('admin/settlements/<str:reference>/adjustments/', AdminSettlementAdjustmentView.as_view(), name='admin_settlement_adjustment'),

    # 3. Admin Payment Reconciliation
    path('admin/reconciliation/', AdminPaymentReconciliationView.as_view(), name='admin_payment_reconciliation'),
    path('admin/reconciliation/export-csv/', AdminReconciliationExportCSVView.as_view(), name='admin_reconciliation_export_csv'),

    # 4. Platform Commission Configuration
    path('admin/commission-rules/', AdminCommissionRulesView.as_view(), name='admin_commission_rules'),
]
