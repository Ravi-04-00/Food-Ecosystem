from django.urls import path
from .call_views import (
    CallRequestListCreateView,
    CallRequestCancelView,
    AdminCallListView,
    AdminCallTransitionView,
)

urlpatterns = [
    path('calls/', CallRequestListCreateView.as_view(), name='call_request_list_create'),
    path('calls/<int:pk>/cancel/', CallRequestCancelView.as_view(), name='call_request_cancel'),
    path('calls/admin/', AdminCallListView.as_view(), name='admin_call_list'),
    path('calls/admin/<int:pk>/status/', AdminCallTransitionView.as_view(), name='admin_call_transition'),
]
