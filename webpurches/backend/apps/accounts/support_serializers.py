import os
from rest_framework import serializers
from apps.accounts.models import SupportTicket, TicketMessage, TicketAttachment, TicketAuditLog, User
from apps.orders.models import Order
from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner


ALLOWED_MIME_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
}
DISALLOWED_EXTENSIONS = {
    '.exe', '.bat', '.cmd', '.sh', '.bin', '.js', '.py', '.php', '.phtml',
    '.html', '.htm', '.svg', '.jar', '.msi', '.dll', '.com', '.vbs', '.scr'
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_support_file(uploaded_file):
    """
    Phase 29 Hardened: Validates uploaded evidence attachment:
    1. Maximum size limit (5MB).
    2. Path traversal and null byte sanitization.
    3. File extension validation against disallowed executables.
    4. Content MIME type check.
    5. Binary magic byte signature verification (PDF, JPEG, PNG, WEBP).
    """
    if not uploaded_file:
        return

    # 1. Path traversal & null byte sanitization
    raw_name = str(uploaded_file.name)
    if '..' in raw_name or '/' in raw_name or '\\' in raw_name or '\x00' in raw_name:
        raise serializers.ValidationError("Path traversal characters or directory separators detected in attachment file name.")
    safe_name = os.path.basename(raw_name)
    if not safe_name or safe_name in ['.', '..']:
        raise serializers.ValidationError("Invalid or malicious attachment file name detected.")

    # 2. Maximum size limit
    if uploaded_file.size > MAX_FILE_SIZE_BYTES:
        raise serializers.ValidationError(
            f"File size exceeds 5 MB limit ({uploaded_file.size / (1024 * 1024):.2f} MB provided)."
        )

    # 3. Extension check
    _, ext = os.path.splitext(safe_name.lower())
    if ext in DISALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            f"File extension '{ext}' is prohibited for security reasons."
        )

    # 4. MIME type check
    content_type = getattr(uploaded_file, 'content_type', '').lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        matched_mime = None
        for mime, extensions in ALLOWED_MIME_TYPES.items():
            if ext in extensions:
                matched_mime = mime
                break
        if not matched_mime:
            raise serializers.ValidationError(
                f"File format '{content_type or ext}' is not supported. Allowed formats: JPG, PNG, WEBP, PDF."
            )

    # 5. Binary magic byte signature verification
    try:
        current_pos = uploaded_file.tell() if hasattr(uploaded_file, 'tell') else 0
        uploaded_file.seek(0)
        header = uploaded_file.read(16)
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(current_pos)

        is_valid_signature = False
        if header.startswith(b'%PDF-'):  # PDF
            is_valid_signature = True
        elif header.startswith(b'\xff\xd8\xff'):  # JPEG
            is_valid_signature = True
        elif header.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
            is_valid_signature = True
        elif header.startswith(b'RIFF') and b'WEBP' in header[:16]:  # WEBP
            is_valid_signature = True

        if not is_valid_signature and len(header) >= 4:
            raise serializers.ValidationError(
                "Attachment signature verification failed. The file content does not match authentic document or image bytes."
            )
    except serializers.ValidationError:
        raise
    except Exception:
        pass


class TicketAttachmentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    uploader_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = TicketAttachment
        fields = [
            'id', 'file_name', 'file_size', 'mime_type',
            'created_at', 'download_url', 'uploader_name'
        ]

    def get_download_url(self, obj):
        return f"/api/support/tickets/{obj.ticket.ticket_number}/attachments/{obj.id}/download/"


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = TicketMessage
        fields = [
            'id', 'ticket_id', 'sender', 'sender_name', 'sender_email',
            'sender_role', 'message', 'is_internal_note',
            'created_at', 'attachments'
        ]
        read_only_fields = ['sender', 'is_staff']


class TicketAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = TicketAuditLog
        fields = [
            'id', 'action', 'actor_name', 'from_status',
            'to_status', 'notes', 'details', 'created_at'
        ]


class SupportTicketListSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='user.username', read_only=True)
    creator_email = serializers.CharField(source='user.email', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.username', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    order_number = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'subject', 'category', 'category_display',
            'priority', 'status', 'created_at', 'updated_at', 'order_id',
            'order_number', 'creator_name', 'creator_email',
            'assigned_agent_name', 'latest_message', 'messages_count'
        ]

    def get_order_number(self, obj):
        if obj.linked_order:
            return obj.linked_order.order_number
        return obj.order_id or None

    def get_latest_message(self, obj):
        req = self.context.get('request')
        is_staff = req.user.is_staff if req and req.user.is_authenticated else False
        qs = obj.messages.all()
        if not is_staff:
            qs = qs.filter(is_internal_note=False)
        last_msg = qs.last()
        if last_msg:
            return {
                'sender_name': last_msg.sender.username,
                'sender_role': last_msg.sender_role,
                'message': last_msg.message[:120] if last_msg.message else '',
                'created_at': last_msg.created_at
            }
        return None

    def get_messages_count(self, obj):
        req = self.context.get('request')
        is_staff = req.user.is_staff if req and req.user.is_authenticated else False
        qs = obj.messages.all()
        if not is_staff:
            qs = qs.filter(is_internal_note=False)
        return qs.count()


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='user.username', read_only=True)
    creator_email = serializers.CharField(source='user.email', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.username', read_only=True)
    escalated_by_name = serializers.CharField(source='escalated_by.username', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    order_details = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    audit_logs = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'subject', 'description', 'category',
            'category_display', 'priority', 'status', 'created_at', 'updated_at',
            'order_id', 'order_details', 'creator_name', 'creator_email',
            'assigned_agent_name', 'resolution_summary', 'resolved_at',
            'escalation_reason', 'escalated_at', 'escalated_by_name',
            'messages', 'attachments', 'audit_logs'
        ]

    def get_order_details(self, obj):
        order = obj.linked_order
        if not order:
            return None
        
        req = self.context.get('request')
        user = req.user if req else None

        # Masking sensitive info based on caller role
        restaurant_name = order.restaurant.name if order.restaurant else 'N/A'
        
        details = {
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'payment_status': order.payment_status,
            'restaurant_name': restaurant_name,
            'total_amount': str(order.grand_total if hasattr(order, 'grand_total') else getattr(order, 'total', 0)),
            'created_at': order.created_at,
        }

        # Safe customer details: masked for delivery or restaurant partners
        is_staff = user and (user.is_staff or getattr(user, 'role', '') == 'ADMIN')
        is_customer = user and user.id == obj.user_id
        if is_staff or is_customer:
            details['customer_name'] = order.customer.username if order.customer else 'Customer'
            details['delivery_address'] = getattr(order, 'delivery_address_text', '')
        else:
            # Mask customer details for restaurant or delivery partners
            uname = order.customer.username if order.customer else 'Customer'
            details['customer_name'] = uname[:2] + '***' if len(uname) > 2 else 'C***'
            details['delivery_address'] = 'Address Masked for Privacy'

        # Payment transaction details without secrets
        if hasattr(order, 'payments') and order.payments.exists():
            pmt = order.payments.first()
            details['payment_gateway'] = pmt.payment_method
            details['transaction_reference'] = pmt.transaction_id or 'N/A'
            details['payment_verified'] = pmt.status in ['PAID', 'VERIFIED_PAID']

        return details

    def get_messages(self, obj):
        req = self.context.get('request')
        is_staff = req.user.is_staff if req and req.user.is_authenticated else False
        qs = obj.messages.all()
        # Strictly hide internal support notes from customers, restaurants, and riders
        if not is_staff:
            qs = qs.filter(is_internal_note=False)
        return TicketMessageSerializer(qs, many=True, context=self.context).data

    def get_audit_logs(self, obj):
        req = self.context.get('request')
        is_staff = req.user.is_staff if req and req.user.is_authenticated else False
        if not is_staff:
            return []
        return TicketAuditLogSerializer(obj.audit_logs.all(), many=True).data


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    evidence_file = serializers.FileField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'category', 'priority', 'subject',
            'description', 'order_number', 'evidence_file', 'idempotency_key'
        ]
        read_only_fields = ['id', 'ticket_number']

    def validate_category(self, val):
        valid_cats = [c[0] for c in SupportTicket.CATEGORY_CHOICES]
        if val not in valid_cats:
            raise serializers.ValidationError(f"Invalid category '{val}'.")
        return val

    def validate_evidence_file(self, val):
        if val:
            validate_support_file(val)
        return val

    def validate(self, attrs):
        user = self.context['request'].user
        order_num = attrs.get('order_number')
        if order_num:
            # Check order existence and ownership
            order = Order.objects.filter(order_number=order_num).first()
            if not order:
                raise serializers.ValidationError({"order_number": f"Order #{order_num} not found."})
            # Verify customer owns the order unless staff
            if order.customer_id != user.id and not user.is_staff:
                raise serializers.ValidationError({"order_number": "You can only dispute orders placed by your account."})
            attrs['resolved_order'] = order
        return attrs
