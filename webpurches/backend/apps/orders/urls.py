from django.urls import path
from .views import (
    OrderListCreateView, OrderCheckoutView, OrderDetailView, 
    OrderCancelView, OrderStatusUpdateView, OrderVerifyOTPView, OrderAssignRiderView,
    RestaurantOrderAcceptView, RestaurantOrderRejectView,
    RestaurantOrderPrepareView, RestaurantOrderReadyView,
    OrderStatusHistoryListView, OrderTrackingDetailView
)
from .scheduling_views import (
    DeliverySlotListView, DeliverySlotCreateView,
    ScheduledOrderListCreateView, ScheduledOrderCancelView,
    ScheduledOrderReleaseView,
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order_list_create'),
    path('checkout/', OrderCheckoutView.as_view(), name='order_checkout'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order_detail'),
    path('<int:pk>/tracking/', OrderTrackingDetailView.as_view(), name='order_tracking'),
    path('<int:pk>/cancel/', OrderCancelView.as_view(), name='order_cancel'),
    path('<int:pk>/status/', OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('<int:pk>/accept/', RestaurantOrderAcceptView.as_view(), name='restaurant_order_accept'),
    path('<int:pk>/reject/', RestaurantOrderRejectView.as_view(), name='restaurant_order_reject'),
    path('<int:pk>/prepare/', RestaurantOrderPrepareView.as_view(), name='restaurant_order_prepare'),
    path('<int:pk>/ready/', RestaurantOrderReadyView.as_view(), name='restaurant_order_ready'),
    path('<int:pk>/history/', OrderStatusHistoryListView.as_view(), name='order_status_history'),
    path('<int:pk>/verify-otp/', OrderVerifyOTPView.as_view(), name='order_verify_otp'),
    path('<int:pk>/assign-rider/', OrderAssignRiderView.as_view(), name='order_assign_rider'),

    # Scheduled orders (future slots; immediate ordering untouched)
    path('slots/', DeliverySlotListView.as_view(), name='scheduled_slot_list'),
    path('slots/create/', DeliverySlotCreateView.as_view(), name='scheduled_slot_create'),
    path('scheduled/', ScheduledOrderListCreateView.as_view(), name='scheduled_order_list_create'),
    path('scheduled/<int:pk>/cancel/', ScheduledOrderCancelView.as_view(), name='scheduled_order_cancel'),
    path('scheduled/release-due/', ScheduledOrderReleaseView.as_view(), name='scheduled_order_release'),
]

