from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CUSTOMER', 'WS Customer'),
        ('RESTAURANT', 'WS Restaurant'),
        ('SHOP', 'WS Restaurant / Food Shop'),
        ('DELIVERY', 'WS Delivery Partner'),
        ('RIDER', 'WS Delivery Rider'),
        ('ADMIN', 'WS Command Admin'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    phone = models.CharField(max_length=25, blank=True)
    avatar = models.URLField(blank=True, default='')
    is_online = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
    # Support-agent flag: grants ticket-queue access ONLY (never superuser).
    is_support_agent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} [{self.role}]"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=150, blank=True)
    avatar = models.URLField(blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    phone = models.CharField(max_length=25, blank=True)
    address = models.TextField(blank=True, default='')
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=True)
    verification_status = models.CharField(max_length=20, default='APPROVED')  # APPROVED, PENDING, REJECTED
    current_lat = models.DecimalField(max_digits=9, decimal_places=6, default=13.0827)
    current_lng = models.DecimalField(max_digits=9, decimal_places=6, default=80.2707)

    def __str__(self):
        return f"Profile: {self.full_name or self.user.email} [{self.verification_status}]"


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50, default='Home') # Home, Work, Other
    full_name = models.CharField(max_length=120)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default='Chennai')
    state = models.CharField(max_length=100, default='Tamil Nadu')
    pincode = models.CharField(max_length=20, default='600001')
    country = models.CharField(max_length=100, default='India')
    phone = models.CharField(max_length=25)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=13.0827)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=80.2707)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label}: {self.street}, {self.city}"


class MobileOTP(models.Model):
    PURPOSE_CHOICES = (
        ('LOGIN', 'Mobile OTP Login'),
        ('REGISTER', 'New Account Registration'),
        ('VERIFY', 'Phone Verification'),
    )
    phone = models.CharField(max_length=25, db_index=True)
    otp_code = models.CharField(max_length=8)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='LOGIN')
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_verified and timezone.now() < self.expires_at

    def __str__(self):
        return f"OTP for {self.phone}: {self.otp_code} ({'Used/Expired' if not self.is_valid() else 'Active'})"


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=250.00)
    currency = models.CharField(max_length=10, default='INR')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet ({self.user.email}): ₹{self.balance}"


class WalletTransaction(models.Model):
    TXN_TYPE_CHOICES = (
        ('CREDIT', 'Wallet Top-up'),
        ('DEBIT', 'Order Payment'),
        ('CASHBACK', 'Loyalty Cashback'),
        ('REFUND', 'Order Refund'),
    )
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TXN_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    reference_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} ₹{self.amount} - {self.description}"


class LoyaltyProfile(models.Model):
    TIER_CHOICES = (
        ('BRONZE', 'Bronze Explorer'),
        ('SILVER', 'Silver Gourmet'),
        ('GOLD', 'Gold Epicurean'),
        ('PLATINUM', 'Platinum VIP'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='loyalty')
    points = models.PositiveIntegerField(default=150)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='SILVER')
    lifetime_orders = models.PositiveIntegerField(default=0)
    total_saved = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Loyalty ({self.user.email}): {self.points} pts [{self.tier}]"


class LoginActivity(models.Model):
    STATUS_CHOICES = (
        ('SUCCESS', 'Login Successful'),
        ('FAILED', 'Authentication Failed'),
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='login_activities')
    email = models.CharField(max_length=255, blank=True)
    ip_address = models.CharField(max_length=64, default='127.0.0.1')
    user_agent = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUCCESS')
    failure_reason = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Login {self.status} - {self.email} ({self.timestamp:%Y-%m-%d %H:%M})"


class SecurityAlert(models.Model):
    SEVERITY_CHOICES = (
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Alert'),
    )
    alert_type = models.CharField(max_length=60)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    description = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.alert_type} ({'Resolved' if self.is_resolved else 'Active'})"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=120)
    target_model = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=100, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=64, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} by {self.actor or 'System'} at {self.timestamp:%Y-%m-%d %H:%M}"


class SupportTicket(models.Model):
    CATEGORY_CHOICES = (
        ('MISSING_ITEMS', 'Missing Items'),
        ('INCORRECT_ITEMS', 'Incorrect Items / Wrong Food'),
        ('DAMAGED_FOOD', 'Damaged / Poor Food Quality'),
        ('DELIVERY_DELAY', 'Delivery Delay / Late Delivery'),
        ('CANCELLATION', 'Order Cancellation'),
        ('PAYMENT_ISSUE', 'Payment / Billing Problem'),
        ('ACCOUNT_ISSUE', 'Account / Profile Issue'),
        ('OTHER', 'Other Support Inquiries'),
        ('ORDER', 'General Order Query'),  # Legacy backward compatibility
    )
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('MEDIUM', 'Medium'),  # Legacy backward compatibility
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    )
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('WAITING_CUSTOMER', 'Waiting for Customer'),
        ('ESCALATED', 'Escalated'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    )
    
    # Valid status transitions
    VALID_TRANSITIONS = {
        'OPEN': ['IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'],
        'IN_PROGRESS': ['WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED', 'OPEN'],
        'WAITING_CUSTOMER': ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'],
        'ESCALATED': ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'],
        'RESOLVED': ['CLOSED', 'OPEN', 'IN_PROGRESS'],  # Can be reopened
        'CLOSED': ['OPEN', 'IN_PROGRESS'],              # Reopen only with admin permission
    }

    ticket_number = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    linked_order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    restaurant = models.ForeignKey('products.Restaurant', on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    delivery_partner = models.ForeignKey('delivery.DeliveryPartner', on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    order_id = models.CharField(max_length=50, blank=True, default='')
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='ORDER')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_support_tickets')
    resolution_summary = models.TextField(blank=True, default='')
    resolved_at = models.DateTimeField(null=True, blank=True)
    escalation_reason = models.CharField(max_length=255, blank=True, default='')
    escalated_at = models.DateTimeField(null=True, blank=True)
    escalated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_support_tickets')
    idempotency_key = models.CharField(max_length=64, blank=True, default='', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.ticket_number}: {self.subject} [{self.status}]"

    @property
    def order(self):
        return self.linked_order

    @order.setter
    def order(self, val):
        self.linked_order = val

    def can_transition_to(self, new_status):
        """Validates if transition from current status to new_status is allowed."""
        if self.status == new_status:
            return True
        allowed = self.VALID_TRANSITIONS.get(self.status, [])
        return new_status in allowed


class TicketMessage(models.Model):
    ROLE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('SUPPORT_AGENT', 'Support Agent'),
        ('RESTAURANT', 'Restaurant'),
        ('DELIVERY_PARTNER', 'Delivery Partner'),
        ('ADMIN', 'Admin'),
    )

    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    sender_role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='CUSTOMER')
    message = models.TextField()
    is_staff = models.BooleanField(default=False)
    is_internal_note = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg on #{self.ticket.ticket_number} by {self.sender.username} ({self.sender_role})"


class TicketAttachment(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='attachments')
    message = models.ForeignKey(TicketMessage, on_delete=models.SET_NULL, null=True, blank=True, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='support_attachments/%Y/%m/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, default='application/octet-stream')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.file_name} on #{self.ticket.ticket_number}"


class TicketAuditLog(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='audit_logs')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=64)  # CREATED, STATUS_CHANGED, ASSIGNED, ESCALATED, RESOLVED, CLOSED, REOPENED, NOTE_ADDED, REPLY_ADDED
    from_status = models.CharField(max_length=32, blank=True, default='')
    to_status = models.CharField(max_length=32, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Audit #{self.ticket.ticket_number}: {self.action} by {self.actor or 'System'}"


class CallRequest(models.Model):
    """
    Callback request workflow (no telephony provider configured).
    No real call is placed by the system; an assigned agent calls back
    manually and records the outcome here. Phone visible only to the
    requester and staff/admins via scoped serializers/views.
    """
    STATUS_CHOICES = (
        ('REQUESTED', 'Requested'),
        ('ASSIGNED', 'Assigned to agent'),
        ('CALLING', 'Callback in progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('FAILED', 'Failed'),
    )
    VALID_TRANSITIONS = {
        'REQUESTED': ('ASSIGNED', 'CANCELLED'),
        'ASSIGNED': ('CALLING', 'CANCELLED', 'REQUESTED'),
        'CALLING': ('COMPLETED', 'FAILED', 'ASSIGNED'),
        'COMPLETED': (),
        'CANCELLED': ('REQUESTED',),
        'FAILED': ('REQUESTED', 'ASSIGNED'),
    }
    TOPIC_CHOICES = (
        ('ORDER_HELP', 'Order help'),
        ('PAYMENT_HELP', 'Payment help'),
        ('ACCOUNT_HELP', 'Account help'),
        ('PARTNER_HELP', 'Partner/restaurant help'),
        ('OTHER', 'Other'),
    )

    request_number = models.CharField(max_length=32, unique=True, db_index=True)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='call_requests')
    requester_role = models.CharField(max_length=20, default='CUSTOMER')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='call_requests')
    topic = models.CharField(max_length=20, choices=TOPIC_CHOICES, default='ORDER_HELP')
    subject = models.CharField(max_length=200, blank=True, default='')
    phone = models.CharField(max_length=25)
    priority = models.CharField(
        max_length=20,
        choices=(('LOW', 'Low'), ('NORMAL', 'Normal'), ('HIGH', 'High'), ('URGENT', 'Urgent')),
        default='NORMAL', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED', db_index=True)
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='assigned_calls')
    outcome = models.CharField(max_length=20, blank=True, default='',
                               choices=(('', 'Pending'), ('REACHED', 'Reached'),
                                        ('NO_ANSWER', 'No answer'), ('CALLBACK_LATER', 'Callback later'),
                                        ('RESOLVED', 'Resolved'), ('UNRESOLVABLE', 'Unresolvable')))
    outcome_notes = models.TextField(blank=True, default='')
    scheduled_for = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['requester', 'status']),
            models.Index(fields=['status', 'priority', 'created_at']),
        ]

    def can_transition_to(self, target):
        return target in self.VALID_TRANSITIONS.get(self.status, ())

    def __str__(self):
        return f"Call {self.request_number} [{self.status}]"



class UserSettings(models.Model):
    THEME_CHOICES = (
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    )
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('ta', 'Tamil'),
    )
    SHIFT_CHOICES = (
        ('OFFLINE', 'Offline'),
        ('AVAILABLE', 'Available'),
        ('ON_SHIFT', 'On Shift'),
        ('BREAK', 'On Break'),
        ('SHIFT_COMPLETED', 'Shift Completed'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='light')
    language = models.CharField(max_length=20, default='en')
    push_notifications = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    personalization = models.BooleanField(default=True)
    location_permission_preference = models.BooleanField(default=True)

    # Delivery Partner Specific
    shift = models.CharField(max_length=30, choices=SHIFT_CHOICES, default='AVAILABLE')
    preferred_start_time = models.CharField(max_length=30, blank=True, default='09:00 AM')
    preferred_end_time = models.CharField(max_length=30, blank=True, default='06:00 PM')
    available_days = models.JSONField(default=list, blank=True)
    break_start = models.CharField(max_length=30, blank=True, default='01:00 PM')
    break_end = models.CharField(max_length=30, blank=True, default='02:00 PM')
    preferred_zone = models.CharField(max_length=120, blank=True, default='Indiranagar 100ft Road Corridor')
    availability = models.CharField(max_length=30, default='Available')

    # Restaurant Specific
    order_alerts = models.BooleanField(default=True)
    business_status = models.CharField(max_length=30, default='OPEN')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"UserSettings: {self.user.email} (Theme: {self.theme}, Lang: {self.language})"


def kyc_document_upload_path(instance, filename):
    import os
    from django.utils import timezone as _tz
    base = os.path.basename(filename or 'document')
    stamp = _tz.now().strftime('%Y/%m')
    return f"kyc_docs/{stamp}/user_{instance.kyc.user_id}/{base}"


class PartnerKYC(models.Model):
    """
    Role-based KYC application for delivery partners and restaurants.
    Customers never need this. Status enforced at login (existing gate)
    plus per-view ownership checks in the KYC APIs.
    """
    KIND_CHOICES = (
        ('DELIVERY', 'Delivery Partner'),
        ('RESTAURANT', 'Restaurant'),
    )
    STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('INCOMPLETE', 'Incomplete'),
        ('PENDING', 'Pending Review'),
        ('MORE_INFO_REQUIRED', 'More Information Required'),
        ('REJECTED', 'Rejected'),
        ('APPROVED', 'Approved'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner_kyc')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED', db_index=True)
    # Per-kind form fields (bank, emergency contact, FSSAI meta, consent text version...)
    data = models.JSONField(default=dict, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    consent_given = models.BooleanField(default=False)
    consent_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_kycs')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['kind', 'status']),
            models.Index(fields=['status', 'updated_at']),
        ]

    def __str__(self):
        return f"KYC {self.kind} for {self.user.email} [{self.status}]"


class KYCDocument(models.Model):
    """Private KYC file. Served only through authorized download views, never public."""
    DOC_STATUS = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    kyc = models.ForeignKey(PartnerKYC, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=40, db_index=True)
    file = models.FileField(upload_to=kyc_document_upload_path)
    original_name = models.CharField(max_length=255, blank=True, default='')
    size_bytes = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=DOC_STATUS, default='PENDING', db_index=True)
    rejection_note = models.TextField(blank=True, default='')
    expires_at = models.DateField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_kyc_docs')
    verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['kyc', 'doc_type']),
            models.Index(fields=['kyc', 'status']),
        ]

    def __str__(self):
        return f"KYCDoc {self.doc_type} for {self.kyc.user.email} [{self.status}]"
