from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='SYSTEM')  # e.g. ORDER, PAYMENT, DELIVERY, SYSTEM
    event_type = models.CharField(max_length=60, default='system.alert', db_index=True)
    
    # Related Resource References for Deep Linking
    related_resource_type = models.CharField(max_length=50, blank=True)  # e.g. 'Order', 'Payment', 'Restaurant'
    related_resource_id = models.CharField(max_length=100, blank=True)
    
    # Idempotency / Deduplication
    idempotency_key = models.CharField(max_length=160, null=True, blank=True, unique=True, db_index=True)
    
    # Metadata Payload (e.g. order_number, deep_link_path, amount, status)
    data = models.JSONField(default=dict, blank=True)
    
    # Read and Dismiss States
    is_read = models.BooleanField(default=False, db_index=True)
    is_dismissed = models.BooleanField(default=False, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', 'is_dismissed']),
        ]

    def __str__(self):
        return f"[{self.event_type}] {self.title} -> {self.user.username}"


class NotificationPreference(models.Model):
    """
    Channel and content type notification preferences per user.
    Supports transactional vs optional promotional messages and localized language preferences.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Channel toggles
    in_app_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=False)
    
    # Content categories
    order_updates = models.BooleanField(default=True)        # Transactional
    payment_updates = models.BooleanField(default=True)      # Transactional
    promotional_updates = models.BooleanField(default=False) # Optional promotional
    
    # Language preference for notification templates ('en' or 'ta')
    language = models.CharField(max_length=10, default='en')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"NotificationPreference: {self.user.username} (Lang: {self.language})"


class NotificationDeliveryAttempt(models.Model):
    """
    Audit and tracking record for external channel delivery attempts (Email, SMS, Push).
    Never stores provider secrets or sensitive plain-text payloads.
    """
    CHANNEL_CHOICES = (
        ('IN_APP', 'In-App'),
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('PUSH', 'Push'),
    )
    STATUS_CHOICES = (
        ('QUEUED', 'Queued'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
        ('SKIPPED', 'Skipped by Preference'),
    )

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='delivery_attempts')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='QUEUED')
    recipient_destination = models.CharField(max_length=255)  # Masked destination, e.g. a***@wsfood.io or ******0001
    attempt_count = models.PositiveIntegerField(default=1)
    provider = models.CharField(max_length=50, blank=True)
    provider_response_id = models.CharField(max_length=150, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.channel} attempt for #{self.notification_id}: {self.status}"
