from django.urls import path
from .kyc_views import (
    KYCStatusView,
    KYCDraftView,
    KYCSubmitView,
    KYCDocumentUploadView,
    KYCDocumentDeleteView,
    KYCDocumentDownloadView,
    AdminKYCPendingView,
    AdminKYCDetailView,
    AdminKYCApproveView,
    AdminKYCRejectView,
    AdminKYCRequestInfoView,
)

urlpatterns = [
    path('status/', KYCStatusView.as_view(), name='kyc_status'),
    path('draft/', KYCDraftView.as_view(), name='kyc_draft'),
    path('submit/', KYCSubmitView.as_view(), name='kyc_submit'),
    path('documents/', KYCDocumentUploadView.as_view(), name='kyc_doc_upload'),
    path('documents/<int:pk>/', KYCDocumentDeleteView.as_view(), name='kyc_doc_delete'),
    path('documents/<int:pk>/download/', KYCDocumentDownloadView.as_view(), name='kyc_doc_download'),
    path('admin/pending/', AdminKYCPendingView.as_view(), name='kyc_admin_pending'),
    path('admin/<int:user_id>/', AdminKYCDetailView.as_view(), name='kyc_admin_detail'),
    path('admin/<int:user_id>/approve/', AdminKYCApproveView.as_view(), name='kyc_admin_approve'),
    path('admin/<int:user_id>/reject/', AdminKYCRejectView.as_view(), name='kyc_admin_reject'),
    path('admin/<int:user_id>/request-info/', AdminKYCRequestInfoView.as_view(), name='kyc_admin_request_info'),
]
