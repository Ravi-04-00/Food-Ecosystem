from django.urls import path
from .views import (
    # Phase 12 & 13 Workflow Views
    DeliveryAvailableJobsView,
    DeliveryAcceptJobView,
    DeliveryActiveTaskView,
    DeliveryTaskDetailView,
    DeliveryReachedRestaurantView,
    DeliveryConfirmPickupView,
    DeliveryVerifyOTPView,
    DeliveryReportIssueView,
    DeliveryIssueReportListView,
    DeliveryHistoryListView,
    DeliveryHistoryDetailView,
    DeliveryCompletedListView,
    DeliveryTaskHistoryView,
    DeliveryDashboardOverviewView,

    # Phase 23 Smart Dispatch Endpoints
    DeliveryCurrentOfferView,
    DeliveryAcceptOfferView,
    DeliveryRejectOfferView,
    DeliveryTriggerDispatchView,
    AdminDispatchMonitorView,
    AdminManualReassignView,
    AdminEligiblePartnersView,

    # Legacy & Telemetry Views
    DeliveryProfileView,
    DeliveryToggleStatusView,
    DeliveryLocationUpdateView,
    DeliveryRequestsView,
    DeliveryAcceptOrderView,
    DeliveryEarningsView
)
from .payout_views import (
    RiderPayoutListView,
    RiderPayoutDetailView,
    AdminRiderPayoutListView,
    AdminRiderPayoutCreateBatchView,
    AdminRiderPayoutTransitionView,
    AdminRiderPayoutAdjustmentView,
)

urlpatterns = [
    # Phase 12 & 13 Workflow Endpoints
    path('jobs/', DeliveryAvailableJobsView.as_view(), name='delivery_available_jobs'),
    path('jobs/<int:pk>/accept/', DeliveryAcceptJobView.as_view(), name='delivery_accept_job'),
    path('tasks/active/', DeliveryActiveTaskView.as_view(), name='delivery_active_task'),
    path('tasks/completed/', DeliveryCompletedListView.as_view(), name='delivery_completed_tasks'),
    path('tasks/<int:pk>/', DeliveryTaskDetailView.as_view(), name='delivery_task_detail'),
    path('tasks/<int:pk>/reached-restaurant/', DeliveryReachedRestaurantView.as_view(), name='delivery_reached_restaurant'),
    path('tasks/<int:pk>/confirm-pickup/', DeliveryConfirmPickupView.as_view(), name='delivery_confirm_pickup'),
    path('tasks/<int:pk>/verify-otp/', DeliveryVerifyOTPView.as_view(), name='delivery_verify_otp'),
    path('tasks/<int:pk>/complete/', DeliveryVerifyOTPView.as_view(), name='delivery_complete_task'),
    path('tasks/<int:pk>/report-issue/', DeliveryReportIssueView.as_view(), name='delivery_report_issue'),
    path('tasks/<int:pk>/history/', DeliveryTaskHistoryView.as_view(), name='delivery_task_history'),
    path('history/', DeliveryHistoryListView.as_view(), name='delivery_history_list'),
    path('history/<int:pk>/', DeliveryHistoryDetailView.as_view(), name='delivery_history_detail'),
    path('issues/', DeliveryIssueReportListView.as_view(), name='delivery_issues_list'),
    path('dashboard/', DeliveryDashboardOverviewView.as_view(), name='delivery_dashboard_overview'),

    # Phase 23 Smart Dispatch Endpoints
    path('offers/current/', DeliveryCurrentOfferView.as_view(), name='delivery_current_offer'),
    path('offers/<int:pk>/accept/', DeliveryAcceptOfferView.as_view(), name='delivery_accept_offer'),
    path('offers/<int:pk>/reject/', DeliveryRejectOfferView.as_view(), name='delivery_reject_offer'),
    path('dispatch/trigger/', DeliveryTriggerDispatchView.as_view(), name='delivery_trigger_dispatch'),
    path('admin/dispatch/', AdminDispatchMonitorView.as_view(), name='admin_dispatch_monitor'),
    path('admin/dispatch/<int:pk>/reassign/', AdminManualReassignView.as_view(), name='admin_dispatch_reassign'),
    path('admin/dispatch/partners/', AdminEligiblePartnersView.as_view(), name='admin_dispatch_eligible_partners'),

    # Existing Legacy Endpoints
    path('profile/', DeliveryProfileView.as_view(), name='delivery_profile'),
    path('toggle-status/', DeliveryToggleStatusView.as_view(), name='delivery_toggle_status'),
    path('location/', DeliveryLocationUpdateView.as_view(), name='delivery_location_update'),
    path('requests/', DeliveryRequestsView.as_view(), name='delivery_requests'),
    path('requests/<int:pk>/accept/', DeliveryAcceptOrderView.as_view(), name='delivery_accept_order'),
    path('earnings/', DeliveryEarningsView.as_view(), name='delivery_earnings'),

    # Phase 3A: Rider Payout Ledger (INTERNAL LEDGER only)
    path('payouts/', RiderPayoutListView.as_view(), name='rider_payout_list'),
    path('payouts/<str:reference>/', RiderPayoutDetailView.as_view(), name='rider_payout_detail'),
    path('admin/payouts/', AdminRiderPayoutListView.as_view(), name='admin_rider_payout_list'),
    path('admin/payouts/create-batch/', AdminRiderPayoutCreateBatchView.as_view(), name='admin_rider_payout_create_batch'),
    path('admin/payouts/<str:reference>/status/', AdminRiderPayoutTransitionView.as_view(), name='admin_rider_payout_transition'),
    path('admin/payouts/<str:reference>/adjustments/', AdminRiderPayoutAdjustmentView.as_view(), name='admin_rider_payout_adjustment'),
]
