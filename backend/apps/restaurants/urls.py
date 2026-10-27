from django.urls import path
from .views import (
    RestaurantListView,
    RestaurantDetailView,
    RestaurantMyProfileView,
    RestaurantToggleStatusView,
    RestaurantMyToggleStatusView,
    RestaurantAnalyticsView,
    RestaurantPayoutsView,
    RestaurantMyAnalyticsView,
    RestaurantMyOperatingSettingsView,
    RestaurantMyPauseOrdersView,
    RestaurantMyOrdersExportCSVView
)
from apps.payments.settlement_views import (
    RestaurantEarningsSummaryView,
    RestaurantSettlementListView
)

urlpatterns = [
    # General / Discovery endpoints
    path('', RestaurantListView.as_view(), name='restaurant_list'),
    
    # Authenticated Restaurant Self-Management (Phase 8 & 22)
    path('me/', RestaurantMyProfileView.as_view(), name='restaurant_my_profile'),
    path('me/toggle-status/', RestaurantMyToggleStatusView.as_view(), name='restaurant_my_toggle_status'),
    path('me/availability/', RestaurantMyToggleStatusView.as_view(), name='restaurant_my_availability'),
    path('me/analytics/', RestaurantMyAnalyticsView.as_view(), name='restaurant_my_analytics'),
    path('me/operating-settings/', RestaurantMyOperatingSettingsView.as_view(), name='restaurant_my_operating_settings'),
    path('me/pause-orders/', RestaurantMyPauseOrdersView.as_view(), name='restaurant_my_pause_orders'),
    path('me/export-orders-csv/', RestaurantMyOrdersExportCSVView.as_view(), name='restaurant_my_orders_export_csv'),
    path('me/earnings/', RestaurantEarningsSummaryView.as_view(), name='restaurant_my_earnings'),
    path('me/settlements/', RestaurantSettlementListView.as_view(), name='restaurant_my_settlements'),

    # Restaurant by ID
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant_detail'),
    path('<int:pk>/toggle-status/', RestaurantToggleStatusView.as_view(), name='restaurant_toggle_status'),
    path('<int:pk>/analytics/', RestaurantAnalyticsView.as_view(), name='restaurant_analytics'),
    path('<int:pk>/export-orders-csv/', RestaurantMyOrdersExportCSVView.as_view(), name='restaurant_orders_export_csv'),
    path('<int:pk>/payouts/', RestaurantPayoutsView.as_view(), name='restaurant_payouts'),
]
