from django.urls import path
from .views import (
    ReviewListCreateView,
    ReviewEligibilityView,
    CustomerMyReviewsView,
    ReviewDetailUpdateDeleteView,
    ReviewSummaryView,
    RestaurantReviewsFeedView,
    DeliveryPartnerReviewsFeedView,
    ReviewReportCreateView,
    AdminReviewModerationQueueView,
    AdminReviewModerateActionView,
    AdminReviewReportsListView,
    AdminReviewReportResolveView,
    AdminReviewStatsView,
)

urlpatterns = [
    # Customer Verified Reviews
    path('', ReviewListCreateView.as_view(), name='review_list_create'),
    path('eligibility/', ReviewEligibilityView.as_view(), name='review_eligibility'),
    path('my-reviews/', CustomerMyReviewsView.as_view(), name='customer_my_reviews'),
    path('summary/', ReviewSummaryView.as_view(), name='review_summary'),
    path('<int:pk>/', ReviewDetailUpdateDeleteView.as_view(), name='review_detail'),
    path('<int:pk>/report/', ReviewReportCreateView.as_view(), name='review_report'),

    # Merchant & Rider Feeds
    path('restaurant-feed/', RestaurantReviewsFeedView.as_view(), name='restaurant_reviews_feed'),
    path('partner-feed/', DeliveryPartnerReviewsFeedView.as_view(), name='delivery_partner_reviews_feed'),

    # Admin Moderation & Abuse Queue
    path('admin/queue/', AdminReviewModerationQueueView.as_view(), name='admin_review_queue'),
    path('admin/<int:pk>/moderate/', AdminReviewModerateActionView.as_view(), name='admin_review_moderate'),
    path('admin/reports/', AdminReviewReportsListView.as_view(), name='admin_review_reports'),
    path('admin/reports/<int:pk>/resolve/', AdminReviewReportResolveView.as_view(), name='admin_review_report_resolve'),
    path('admin/stats/', AdminReviewStatsView.as_view(), name='admin_review_stats'),
]
