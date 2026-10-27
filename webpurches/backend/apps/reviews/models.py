from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.accounts.models import User
from apps.products.models import Product, Restaurant

class Review(models.Model):
    TARGET_CHOICES = (
        ('FOOD_ITEM', 'Food Item'),
        ('RESTAURANT', 'Restaurant'),
        ('DELIVERY_PARTNER', 'Delivery Partner'),
    )

    MODERATION_CHOICES = (
        ('APPROVED', 'Approved / Visible'),
        ('PENDING', 'Pending Moderation'),
        ('HIDDEN', 'Hidden by Moderator'),
        ('FLAGGED', 'Flagged for Review'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='customer_reviews', null=True, blank=True)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES, default='FOOD_ITEM', db_index=True)
    
    # Specific Targets
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='customer_reviews', null=True, blank=True)
    delivery_partner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_delivery_reviews', null=True, blank=True)

    # Ratings
    rating = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    food_quality_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    packaging_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    delivery_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    # Feedback & Localization
    comment = models.TextField(blank=True, default='')
    language = models.CharField(max_length=8, default='en')
    is_verified_purchase = models.BooleanField(default=True)

    # Moderation
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_CHOICES,
        default='APPROVED',
        db_index=True
    )
    moderation_reason = models.TextField(blank=True, default='')
    moderated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='moderated_reviews'
    )
    moderated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_type', 'moderation_status', '-created_at']),
            models.Index(fields=['product', 'moderation_status']),
            models.Index(fields=['restaurant', 'moderation_status']),
            models.Index(fields=['delivery_partner', 'moderation_status']),
            models.Index(fields=['order', 'target_type']),
            models.Index(fields=['user', '-created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'order', 'product'],
                name='unique_order_product_review',
                condition=models.Q(target_type='FOOD_ITEM')
            ),
            models.UniqueConstraint(
                fields=['user', 'order', 'target_type'],
                name='unique_order_target_review',
                condition=models.Q(target_type__in=['RESTAURANT', 'DELIVERY_PARTNER'])
            ),
        ]

    @property
    def food_item(self):
        return self.product

    @property
    def target_name(self):
        if self.target_type == 'FOOD_ITEM' and self.product:
            return self.product.name
        elif self.target_type == 'RESTAURANT' and self.restaurant:
            return self.restaurant.name
        elif self.target_type == 'DELIVERY_PARTNER' and self.delivery_partner:
            return self.delivery_partner.get_full_name() or self.delivery_partner.username
        return 'Unknown Target'

    @property
    def masked_user_name(self):
        name = self.user.get_full_name() or self.user.username or 'Customer'
        parts = name.strip().split()
        if len(parts) >= 2:
            return f"{parts[0]} {parts[1][0]}."
        elif len(name) > 3:
            return f"{name[:3]}***"
        return name

    def __str__(self):
        return f"{self.user.username} - {self.rating}★ for {self.target_name} ({self.target_type})"


class ReviewReport(models.Model):
    REPORT_REASONS = (
        ('ABUSIVE', 'Abusive, profane, or harassing content'),
        ('IRRELEVANT', 'Irrelevant or off-topic'),
        ('FRAUDULENT', 'Suspected fraudulent / fake review'),
        ('PII', 'Exposes personal identifiable information (PII)'),
        ('OTHER', 'Other policy violation'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending Investigation'),
        ('RESOLVED', 'Resolved (Action Taken)'),
        ('DISMISSED', 'Dismissed (No Action Needed)'),
    )

    id = models.BigAutoField(primary_key=True)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_review_reports')
    reason = models.CharField(max_length=32, choices=REPORT_REASONS, default='OTHER')
    explanation = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    admin_notes = models.TextField(blank=True, default='')
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resolved_reports'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['review', 'reported_by']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['review', 'reported_by'], name='unique_review_report_per_user')
        ]

    def __str__(self):
        return f"Report #{self.id} on Review #{self.review_id} by {self.reported_by.username} ({self.status})"


class ReviewModerationLog(models.Model):
    ACTION_CHOICES = (
        ('APPROVE', 'Approved / Restored'),
        ('HIDE', 'Hidden by Moderator'),
        ('FLAG', 'Flagged for Investigation'),
    )

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='moderation_logs')
    moderator = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='review_moderation_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField()
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Log #{self.id}: Review #{self.review_id} {self.action} by {self.moderator}"
