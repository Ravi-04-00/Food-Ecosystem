from django.urls import path
from .views import (
    MetricDefinitionsView,
    AdminAnalyticsSummaryView,
    AdminAnalyticsChartsView,
    AdminAnalyticsExportView,
    RestaurantAnalyticsView,
    RestaurantAnalyticsExportView,
    DeliveryPartnerAnalyticsView,
    DeliveryPartnerAnalyticsExportView
)

urlpatterns = [
    # 1. Authoritative Metric Definitions
    path('definitions/', MetricDefinitionsView.as_view(), name='analytics_metric_definitions'),

    # 2. Platform Admin Analytics
    path('admin/summary/', AdminAnalyticsSummaryView.as_view(), name='analytics_admin_summary'),
    path('admin/charts/', AdminAnalyticsChartsView.as_view(), name='analytics_admin_charts'),
    path('admin/export/', AdminAnalyticsExportView.as_view(), name='analytics_admin_export'),

    # 3. Restaurant Owner Analytics
    path('restaurant/', RestaurantAnalyticsView.as_view(), name='analytics_restaurant_self'),
    path('restaurant/export/', RestaurantAnalyticsExportView.as_view(), name='analytics_restaurant_export_self'),
    path('restaurant/<int:pk>/', RestaurantAnalyticsView.as_view(), name='analytics_restaurant_detail'),
    path('restaurant/<int:pk>/export/', RestaurantAnalyticsExportView.as_view(), name='analytics_restaurant_export_detail'),

    # 4. Delivery Partner Analytics
    path('delivery/', DeliveryPartnerAnalyticsView.as_view(), name='analytics_delivery_self'),
    path('delivery/export/', DeliveryPartnerAnalyticsExportView.as_view(), name='analytics_delivery_export_self'),
]
