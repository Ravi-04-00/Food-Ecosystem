"""
Role-based KYC APIs (customers never need KYC).

User (IsAuthenticated, own record only):
  GET   /api/kyc/status/
  PATCH /api/kyc/draft/                 {data, consent_given}
  POST  /api/kyc/submit/
  POST  /api/kyc/documents/             multipart: doc_type, file, expires_at?
  DELETE /api/kyc/documents/<id>/
  GET   /api/kyc/documents/<id>/download/

Admin (apps.adminpanel.permissions.IsAdminUser):
  GET   /api/kyc/admin/pending/?kind=&status=
  GET   /api/kyc/admin/<user_id>/
  POST  /api/kyc/admin/<user_id>/approve/
  POST  /api/kyc/admin/<user_id>/reject/   {reason >= 3 chars}
  (resubmit: user POST submit/ again after REJECTED)

Files live under private media/kyc_docs/ and are served ONLY through the
scoped download views - never via public URLs.
"""
from django.http import FileResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.models import User, PartnerKYC, KYCDocument
from apps.accounts.serializers import validate_image_upload, get_canonical_role
from apps.adminpanel.permissions import IsAdminUser, create_admin_audit_log

IMAGE_TYPES = {'profile_photo', 'dl_front', 'dl_back', 'outlet_photo', 'owner_id'}
PDF_OK_TYPES = {
    'vehicle_rc', 'insurance', 'address_proof', 'bank_proof',
    'fssai_cert', 'trade_license', 'owner_address', 'gst_cert',
    'pan_card', 'dl_front', 'dl_back', 'owner_id',
}

# doc_type -> {label, required, formats}
DELIVERY_DOCS = {
    'dl_front': {'label': 'Driving licence (front)', 'required': True, 'formats': ('image', 'pdf')},
    'dl_back': {'label': 'Driving licence (back)', 'required': True, 'formats': ('image', 'pdf')},
    'vehicle_rc': {'label': 'Vehicle RC', 'required': True, 'formats': ('image', 'pdf')},
    'bank_proof': {'label': 'Bank proof (passbook/cancelled cheque)', 'required': True, 'formats': ('image', 'pdf')},
    'profile_photo': {'label': 'Profile photo', 'required': False, 'formats': ('image',)},
    'insurance': {'label': 'Vehicle insurance', 'required': False, 'formats': ('image', 'pdf')},
    'address_proof': {'label': 'Address proof', 'required': False, 'formats': ('image', 'pdf')},
}
RESTAURANT_DOCS = {
    'fssai_cert': {'label': 'FSSAI licence/registration certificate', 'required': True, 'formats': ('image', 'pdf')},
    'owner_id': {'label': 'Owner identity proof', 'required': True, 'formats': ('image', 'pdf')},
    'bank_proof': {'label': 'Bank proof for settlements', 'required': True, 'formats': ('image', 'pdf')},
    'outlet_photo': {'label': 'Outlet photo', 'required': False, 'formats': ('image',)},
    'trade_license': {'label': 'Trade licence', 'required': False, 'formats': ('image', 'pdf')},
    'owner_address': {'label': 'Owner address proof', 'required': False, 'formats': ('image', 'pdf')},
    'gst_cert': {'label': 'GST certificate (if applicable)', 'required': False, 'formats': ('image', 'pdf')},
    'pan_card': {'label': 'PAN card (if applicable)', 'required': False, 'formats': ('image', 'pdf')},
}

# data JSON required keys per kind (consent handled separately)
DELIVERY_REQUIRED_DATA = ['bank_holder', 'bank_account', 'bank_ifsc',
                          'emergency_name', 'emergency_phone']
RESTAURANT_REQUIRED_DATA = ['fssai_number', 'fssai_expiry',
                            'bank_holder', 'bank_account', 'bank_ifsc']

KIND_DOCS = {'DELIVERY': DELIVERY_DOCS, 'RESTAURANT': RESTAURANT_DOCS}
KIND_DATA = {'DELIVERY': DELIVERY_REQUIRED_DATA, 'RESTAURANT': RESTAURANT_REQUIRED_DATA}

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_PDF_BYTES = 10 * 1024 * 1024


def _kyc_kind(user):
    role = get_canonical_role(user)
    if role == 'DELIVERY_PARTNER':
        return 'DELIVERY'
    if role == 'RESTAURANT':
        return 'RESTAURANT'
    return None


def _get_kyc(user):
    kind = _kyc_kind(user)
    if not kind:
        return None, None
    kyc, _ = PartnerKYC.objects.get_or_create(
        user=user, defaults={'kind': kind, 'status': 'NOT_STARTED'})
    if kyc.kind != kind:
        kyc.kind = kind
        kyc.save(update_fields=['kind', 'updated_at'])
    return kyc, kind


def _validate_kyc_file(upload, doc_cfg):
    name = getattr(upload, 'name', '') or 'file'
    size = getattr(upload, 'size', 0) or 0
    ctype = getattr(upload, 'content_type', '') or ''
    ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    header = upload.read(5)
    try:
        upload.seek(0)
    except Exception:
        pass
    is_pdf = header[:4] == b'%PDF' or ext == 'pdf' or ctype == 'application/pdf'
    if is_pdf:
        if 'pdf' not in doc_cfg['formats']:
            return 'PDF files are not accepted for this document.'
        if ext != 'pdf':
            return 'PDF file must use a .pdf extension.'
        if size > MAX_PDF_BYTES:
            return 'PDF must be 10 MB or smaller.'
        if header[:4] != b'%PDF':
            return 'File content does not look like a PDF.'
        return None
    if 'image' not in doc_cfg['formats']:
        return 'Only PDF files are accepted for this document.'
    try:
        validate_image_upload(upload)
    except Exception as exc:
        return str(exc)
    return None


def _doc_dict(d, include_file=False):
    out = {
        'id': d.id,
        'doc_type': d.doc_type,
        'original_name': d.original_name,
        'size_bytes': d.size_bytes,
        'status': d.status,
        'rejection_note': d.rejection_note,
        'expires_at': str(d.expires_at) if d.expires_at else None,
        'created_at': d.created_at.isoformat() if d.created_at else None,
    }
    return out


def _kyc_dict(kyc, kind):
    cfg = KIND_DOCS[kind]
    docs = list(kyc.documents.all()[:200])
    latest = {}
    for d in docs:
        latest.setdefault(d.doc_type, d)
    missing = [t for t, c in cfg.items()
               if c['required'] and not (latest.get(t) and latest[t].status in ('PENDING', 'APPROVED'))]
    return {
        'kind': kind,
        'status': kyc.status,
        'data': kyc.data or {},
        'consent_given': kyc.consent_given,
        'rejection_reason': kyc.rejection_reason,
        'submitted_at': kyc.submitted_at.isoformat() if kyc.submitted_at else None,
        'reviewed_at': kyc.reviewed_at.isoformat() if kyc.reviewed_at else None,
        'required_docs': {t: c['label'] for t, c in cfg.items() if c['required']},
        'optional_docs': {t: c['label'] for t, c in cfg.items() if not c['required']},
        'missing_docs': missing,
        'documents': [_doc_dict(d) for d in docs],
    }


def _mirror_profile_verification(user, kind, approved):
    """Mirrors KYC decision onto Profile + linked Restaurant/DeliveryPartner
    (same fields the adminpanel verify endpoints flip)."""
    profile = getattr(user, 'profile', None)
    if profile:
        profile.verification_status = 'APPROVED' if approved else 'REJECTED'
        profile.is_verified = bool(approved)
        profile.save(update_fields=['verification_status', 'is_verified', 'updated_at']
                     if hasattr(profile, 'updated_at') else ['verification_status', 'is_verified'])
    if kind == 'RESTAURANT':
        from apps.products.models import Restaurant
        r = Restaurant.objects.filter(owner=user).first()
        if r:
            r.verification_status = 'APPROVED' if approved else 'REJECTED'
            r.is_verified = bool(approved)
            r.save(update_fields=['verification_status', 'is_verified'])
    elif kind == 'DELIVERY':
        from apps.delivery.models import DeliveryPartner
        p = DeliveryPartner.objects.filter(user=user).first()
        if p:
            p.verification_status = 'APPROVED' if approved else 'REJECTED'
            p.is_verified = bool(approved)
            p.save(update_fields=['verification_status', 'is_verified', 'updated_at'])


class KYCStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        kyc, kind = _get_kyc(request.user)
        if not kyc:
            return Response({'error': 'KYC is not required for customer accounts.',
                             'kyc_required': False}, status=status.HTTP_403_FORBIDDEN)
        return Response({'kyc_required': True, **_kyc_dict(kyc, kind)})


class KYCDraftView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        kyc, kind = _get_kyc(request.user)
        if not kyc:
            return Response({'error': 'KYC is not required for customer accounts.'},
                            status=status.HTTP_403_FORBIDDEN)
        if kyc.status in ('PENDING', 'APPROVED'):
            return Response({'error': 'Application is already submitted. Wait for review.'},
                            status=status.HTTP_400_BAD_REQUEST)
        data = request.data.get('data') or {}
        if not isinstance(data, dict):
            return Response({'error': 'data must be an object.'}, status=status.HTTP_400_BAD_REQUEST)
        merged = dict(kyc.data or {})
        merged.update({k: v for k, v in data.items() if isinstance(k, str)})
        kyc.data = merged
        if request.data.get('consent_given') is True:
            kyc.consent_given = True
            kyc.consent_at = timezone.now()
        kyc.status = 'INCOMPLETE'
        kyc.save()
        return Response(_kyc_dict(kyc, kind))


class KYCSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        kyc, kind = _get_kyc(request.user)
        if not kyc:
            return Response({'error': 'KYC is not required for customer accounts.'},
                            status=status.HTTP_403_FORBIDDEN)
        if kyc.status == 'APPROVED':
            return Response({'error': 'KYC is already approved.'}, status=status.HTTP_400_BAD_REQUEST)
        if kyc.status == 'PENDING':
            return Response({'error': 'Application is already under review.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('consent_given') is True:
            kyc.consent_given = True
            kyc.consent_at = timezone.now()
        if not kyc.consent_given:
            return Response({'error': 'Consent declaration is required before submit.'},
                            status=status.HTTP_400_BAD_REQUEST)
        missing_data = [k for k in KIND_DATA[kind] if not (kyc.data or {}).get(k)]
        if missing_data:
            return Response({'error': 'Missing required details.',
                             'missing_fields': missing_data}, status=status.HTTP_400_BAD_REQUEST)
        payload = _kyc_dict(kyc, kind)
        if payload['missing_docs']:
            return Response({'error': 'Missing required documents.',
                             'missing_docs': payload['missing_docs']},
                            status=status.HTTP_400_BAD_REQUEST)
        kyc.status = 'PENDING'
        kyc.rejection_reason = ''
        kyc.submitted_at = timezone.now()
        kyc.save()
        try:
            from apps.notifications.dispatcher import safe_dispatch_on_commit
            safe_dispatch_on_commit(
                request.user, 'system.alert',
                {'title': 'KYC submitted', 'message': 'Your KYC application is pending review.'},
                idempotency_key=f'kyc_submitted_{kyc.id}')
        except Exception:
            pass
        return Response(_kyc_dict(kyc, kind))


class KYCDocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        kyc, kind = _get_kyc(request.user)
        if not kyc:
            return Response({'error': 'KYC is not required for customer accounts.'},
                            status=status.HTTP_403_FORBIDDEN)
        if kyc.status in ('PENDING', 'APPROVED'):
            return Response({'error': 'Cannot upload while application is under review or approved.'},
                            status=status.HTTP_400_BAD_REQUEST)
        doc_type = (request.data.get('doc_type') or '').strip().lower()
        cfg = KIND_DOCS[kind].get(doc_type)
        if not cfg:
            return Response({'error': 'Unknown document type for your account.',
                             'allowed': sorted(KIND_DOCS[kind])}, status=status.HTTP_400_BAD_REQUEST)
        upload = request.data.get('file')
        if not upload:
            return Response({'error': 'A file is required.'}, status=status.HTTP_400_BAD_REQUEST)
        err = _validate_kyc_file(upload, cfg)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)
        expires_at = request.data.get('expires_at') or None
        doc = KYCDocument.objects.create(
            kyc=kyc, doc_type=doc_type, file=upload,
            original_name=getattr(upload, 'name', '')[:255],
            size_bytes=getattr(upload, 'size', 0) or 0,
            mime_type=getattr(upload, 'content_type', '') or '',
            expires_at=expires_at)
        if kyc.status == 'NOT_STARTED':
            kyc.status = 'INCOMPLETE'
            kyc.save(update_fields=['status', 'updated_at'])
        return Response(_doc_dict(doc), status=status.HTTP_201_CREATED)


class KYCDocumentDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        kyc, kind = _get_kyc(request.user)
        if not kyc:
            return Response({'error': 'KYC is not required for customer accounts.'},
                            status=status.HTTP_403_FORBIDDEN)
        doc = KYCDocument.objects.filter(id=pk, kyc=kyc).first()
        if not doc:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)
        if kyc.status in ('PENDING', 'APPROVED'):
            return Response({'error': 'Cannot remove documents while under review or approved.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            if doc.file:
                doc.file.delete(save=False)
        except Exception:
            pass
        doc.delete()
        return Response({'success': True})


class KYCDocumentDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        doc = KYCDocument.objects.select_related('kyc', 'kyc__user').filter(id=pk).first()
        if not doc:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        is_owner = doc.kyc.user_id == user.id
        is_admin = user.is_staff or getattr(user, 'role', '') == 'ADMIN'
        if not (is_owner or is_admin):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            handle = doc.file.open('rb')
        except Exception:
            return Response({'error': 'File unavailable.'}, status=status.HTTP_404_NOT_FOUND)
        resp = FileResponse(handle, content_type=doc.mime_type or 'application/octet-stream')
        resp['Content-Disposition'] = 'attachment; filename="%s"' % (doc.original_name or 'document')
        return resp


class AdminKYCPendingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = PartnerKYC.objects.select_related('user').order_by('-updated_at')
        kind = (request.query_params.get('kind') or '').upper()
        if kind in ('DELIVERY', 'RESTAURANT'):
            qs = qs.filter(kind=kind)
        status_f = (request.query_params.get('status') or '').upper()
        if status_f:
            qs = qs.filter(status=status_f)
        else:
            qs = qs.exclude(status__in=('NOT_STARTED', 'APPROVED'))
        out = []
        for k in qs[:200]:
            out.append({
                'user_id': k.user_id,
                'email': k.user.email if k.user else '',
                'kind': k.kind,
                'status': k.status,
                'submitted_at': k.submitted_at.isoformat() if k.submitted_at else None,
                'doc_count': k.documents.count(),
                'updated_at': k.updated_at.isoformat() if k.updated_at else None,
            })
        return Response({'applications': out})


class AdminKYCDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        kyc = PartnerKYC.objects.select_related('user').filter(user_id=user_id).first()
        if not kyc:
            return Response({'error': 'KYC application not found.'}, status=status.HTTP_404_NOT_FOUND)
        payload = _kyc_dict(kyc, kyc.kind)
        payload['user_id'] = kyc.user_id
        payload['email'] = kyc.user.email if kyc.user else ''
        return Response(payload)


class AdminKYCApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        if int(user_id) == request.user.id:
            return Response({'error': 'You cannot approve your own application.'},
                            status=status.HTTP_403_FORBIDDEN)
        kyc = PartnerKYC.objects.select_related('user').filter(user_id=user_id).first()
        if not kyc:
            return Response({'error': 'KYC application not found.'}, status=status.HTTP_404_NOT_FOUND)
        if kyc.status == 'APPROVED':
            return Response({'error': 'Already approved.'}, status=status.HTTP_400_BAD_REQUEST)
        kyc.status = 'APPROVED'
        kyc.rejection_reason = ''
        kyc.reviewed_at = timezone.now()
        kyc.reviewed_by = request.user
        kyc.save()
        kyc.documents.filter(status='PENDING').update(status='APPROVED')
        _mirror_profile_verification(kyc.user, kyc.kind, True)
        create_admin_audit_log(
            actor=request.user, action='KYC_APPROVED', target_model='PartnerKYC',
            target_id=kyc.id, details={'user_id': kyc.user_id, 'kind': kyc.kind},
            reason='KYC documents verified and approved.', request=request)
        try:
            from apps.notifications.dispatcher import safe_dispatch_on_commit
            safe_dispatch_on_commit(
                kyc.user, 'system.alert',
                {'title': 'KYC approved', 'message': 'Your KYC is approved. Welcome aboard!'},
                idempotency_key=f'kyc_approved_{kyc.id}')
        except Exception:
            pass
        return Response(_kyc_dict(kyc, kyc.kind))


class AdminKYCRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        if int(user_id) == request.user.id:
            return Response({'error': 'You cannot review your own application.'},
                            status=status.HTTP_403_FORBIDDEN)
        kyc = PartnerKYC.objects.select_related('user').filter(user_id=user_id).first()
        if not kyc:
            return Response({'error': 'KYC application not found.'}, status=status.HTTP_404_NOT_FOUND)
        reason = (request.data.get('reason') or '').strip()
        if len(reason) < 3:
            return Response({'error': 'A rejection reason (min 3 chars) is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        kyc.status = 'REJECTED'
        kyc.rejection_reason = reason
        kyc.reviewed_at = timezone.now()
        kyc.reviewed_by = request.user
        kyc.save()
        _mirror_profile_verification(kyc.user, kyc.kind, False)
        create_admin_audit_log(
            actor=request.user, action='KYC_REJECTED', target_model='PartnerKYC',
            target_id=kyc.id, details={'user_id': kyc.user_id, 'kind': kyc.kind, 'reason': reason},
            reason='KYC review decision.', request=request)
        try:
            from apps.notifications.dispatcher import safe_dispatch_on_commit
            safe_dispatch_on_commit(
                kyc.user, 'system.alert',
                {'title': 'KYC needs correction', 'message': reason},
                idempotency_key=f'kyc_rejected_{kyc.id}_{kyc.reviewed_at.timestamp()}')
        except Exception:
            pass
        return Response(_kyc_dict(kyc, kyc.kind))


class AdminKYCRequestInfoView(APIView):
    """POST admin/<user_id>/request-info/ — ask for corrections (not a rejection)."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        if int(user_id) == request.user.id:
            return Response({'error': 'You cannot review your own application.'},
                            status=status.HTTP_403_FORBIDDEN)
        kyc = PartnerKYC.objects.select_related('user').filter(user_id=user_id).first()
        if not kyc:
            return Response({'error': 'KYC application not found.'}, status=status.HTTP_404_NOT_FOUND)
        if kyc.status == 'APPROVED':
            return Response({'error': 'Application is already approved.'},
                            status=status.HTTP_400_BAD_REQUEST)
        reason = (request.data.get('reason') or '').strip()
        if len(reason) < 3:
            return Response({'error': 'A note describing the missing info (min 3 chars) is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        kyc.status = 'MORE_INFO_REQUIRED'
        kyc.rejection_reason = reason
        kyc.reviewed_at = timezone.now()
        kyc.reviewed_by = request.user
        kyc.save()
        create_admin_audit_log(
            actor=request.user, action='KYC_MORE_INFO_REQUESTED', target_model='PartnerKYC',
            target_id=kyc.id, details={'user_id': kyc.user_id, 'kind': kyc.kind, 'reason': reason},
            reason='KYC information request.', request=request)
        try:
            from apps.notifications.dispatcher import safe_dispatch_on_commit
            safe_dispatch_on_commit(
                kyc.user, 'system.alert',
                {'title': 'KYC: more information needed', 'message': reason},
                idempotency_key=f'kyc_moreinfo_{kyc.id}_{kyc.reviewed_at.timestamp()}')
        except Exception:
            pass
        return Response(_kyc_dict(kyc, kyc.kind))
