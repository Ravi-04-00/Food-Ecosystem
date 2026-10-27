from django.urls import path
from .views import (
    AdminOverviewKPIView,
    AdminCustomerListView, AdminCustomerDetailView, AdminCustomerToggleStatusView,
    AdminRestaurantListView, AdminRestaurantDetailView, AdminRestaurantVerifyView, AdminRestaurantToggleAccessView,
    AdminRestaurantCreateView,
    AdminPartnerListView, AdminPartnerDetailView, AdminPartnerVerifyView, AdminPartnerToggleStatusView,
    AdminPartnerCreateView,
    AdminOrderListView, AdminOrderDetailView, AdminOrderStatusInterventionView,
    AdminOrderDelayView,
    AdminPaymentListView, AdminPaymentDetailView,
    AdminReportsSummaryView, AdminReportsExportCSVView,
    AdminSystemSettingsView, AdminAuditLogListView
)

urlpatterns = [
    # 1. Overview & Dashboard
    path('overview/', AdminOverviewKPIView.as_view(), name='admin_overview'),

    # 2. Customers
    path('customers/', AdminCustomerListView.as_view(), name='admin_customers_list'),
    path('customers/<int:pk>/', AdminCustomerDetailView.as_view(), name='admin_customers_detail'),
    path('customers/<int:pk>/toggle-status/', AdminCustomerToggleStatusView.as_view(), name='admin_customers_toggle_status'),

    # 3. Restaurants
    path('restaurants/', AdminRestaurantListView.as_view(), name='admin_restaurants_list'),
    path('restaurants/<int:pk>/', AdminRestaurantDetailView.as_view(), name='admin_restaurants_detail'),
    path('restaurants/<int:pk>/verify/', AdminRestaurantVerifyView.as_view(), name='admin_restaurants_verify'),
    path('restaurants/<int:pk>/toggle-access/', AdminRestaurantToggleAccessView.as_view(), name='admin_restaurants_toggle_access'),
    path('restaurants/create/', AdminRestaurantCreateView.as_view(), name='admin_restaurants_create'),

    # 4. Delivery Partners
    path('partners/', AdminPartnerListView.as_view(), name='admin_partners_list'),
    path('partners/<int:pk>/', AdminPartnerDetailView.as_view(), name='admin_partners_detail'),
    path('partners/<int:pk>/verify/', AdminPartnerVerifyView.as_view(), name='admin_partners_verify'),
    path('partners/<int:pk>/toggle-status/', AdminPartnerToggleStatusView.as_view(), name='admin_partners_toggle_status'),
    path('partners/create/', AdminPartnerCreateView.as_view(), name='admin_partners_create'),

    # 5. Orders
    path('orders/', AdminOrderListView.as_view(), name='admin_orders_list'),
    path('orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin_orders_detail'),
    path('orders/<int:pk>/status-intervention/', AdminOrderStatusInterventionView.as_view(), name='admin_orders_status_intervention'),
    path('orders/<int:pk>/delay/', AdminOrderDelayView.as_view(), name='admin_orders_delay'),

    # 6. Payments
    path('payments/', AdminPaymentListView.as_view(), name='admin_payments_list'),
    path('payments/<int:pk>/', AdminPaymentDetailView.as_view(), name='admin_payments_detail'),

    # 7. Reports & CSV Export
    path('reports/summary/', AdminReportsSummaryView.as_view(), name='admin_reports_summary'),
    path('reports/export-csv/', AdminReportsExportCSVView.as_view(), name='admin_reports_export_csv'),

    # 8. Platform System Settings
    path('settings/', AdminSystemSettingsView.as_view(), name='admin_settings'),

    # 9. Audit Logs
    path('audit-logs/', AdminAuditLogListView.as_view(), name='admin_audit_logs'),
]
