from django.urls import path, include
from .views import (
    PaymentInitializeView,
    PaymentVerifyView,
    PaymentFailureReportView,
    PaymentStatusView,
    PaymentWebhookView,
    CreatePaymentSessionView,
    RefundPaymentView,
)

app_name = 'payments'

urlpatterns = [
    # Phase 14 Online Payments API
    path('initialize/', PaymentInitializeView.as_view(), name='payment_initialize'),
    path('create/', CreatePaymentSessionView.as_view(), name='payment_create'),
    path('verify/', PaymentVerifyView.as_view(), name='payment_verify'),
    path('failure/', PaymentFailureReportView.as_view(), name='payment_failure'),
    path('status/<str:order_id>/', PaymentStatusView.as_view(), name='payment_status'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment_webhook'),
    path('refund/', RefundPaymentView.as_view(), name='payment_refund'),

    # Phase 25: Commission, Earnings, Settlements and Reconciliation
    path('', include('apps.payments.settlement_urls')),
]
