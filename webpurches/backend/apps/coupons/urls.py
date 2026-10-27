from django.urls import path
from .views import (
    CouponListView,
    ValidateCouponView,
    OrderTotalsPreviewView,
    CustomerLoyaltyView,
    AdminCouponListCreateView,
    AdminCouponDetailView,
    AdminLoyaltyConfigView,
    AdminPromotionStatsView,
    AdminLoyaltyLedgerListView
)

urlpatterns = [
    # Customer-Facing Endpoints
    path('', CouponListView.as_view(), name='coupons_list'),
    path('validate/', ValidateCouponView.as_view(), name='validate_coupon'),
    path('preview/', OrderTotalsPreviewView.as_view(), name='order_totals_preview'),
    path('loyalty/', CustomerLoyaltyView.as_view(), name='customer_loyalty'),

    # Admin Mission Control Management
    path('admin/', AdminCouponListCreateView.as_view(), name='admin_coupons_list_create'),
    path('admin/<int:pk>/', AdminCouponDetailView.as_view(), name='admin_coupon_detail'),
    path('admin/loyalty-config/', AdminLoyaltyConfigView.as_view(), name='admin_loyalty_config'),
    path('admin/stats/', AdminPromotionStatsView.as_view(), name='admin_promotion_stats'),
    path('admin/loyalty-ledger/', AdminLoyaltyLedgerListView.as_view(), name='admin_loyalty_ledger'),
]
