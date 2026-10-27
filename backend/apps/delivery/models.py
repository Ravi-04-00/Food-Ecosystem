from django.db import models
from apps.accounts.models import User
from apps.orders.models import Order

class DeliveryPartner(models.Model):
    VEHICLE_CHOICES = (
        ('E_BIKE', 'Cyber Electric Superbike'),
        ('SCOOTER', 'Neon Glide E-Scooter'),
        ('HOVER', 'Kinetic Drone Pod'),
        ('VAN', 'Hyper Cargo EV'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_profile')
    vehicle_type = models.CharField(max_length=32, default='Bike')
    vehicle_model = models.CharField(max_length=100, default='Standard Delivery Bike')
    vehicle_number = models.CharField(max_length=32, unique=True, default='KA-03-CYBER-99')
    driving_license = models.CharField(max_length=64, blank=True, default='DL-IN-2026-887766')
    profile_photo = models.ImageField(upload_to='delivery/profiles/', null=True, blank=True)
    verification_status = models.CharField(max_length=20, default='PENDING')  # PENDING, APPROVED, REJECTED
    is_verified = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    
    # Telemetry
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, default=12.9750)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, default=77.5980)
    heading = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    battery_percentage = models.PositiveIntegerField(default=88)
    last_location_updated_at = models.DateTimeField(null=True, blank=True)
    
    # Performance & Financials
    total_deliveries = models.PositiveIntegerField(default=184)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.95)
    today_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=1840.00)
    weekly_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=9450.00)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=42800.00)
    tips_earned = models.DecimalField(max_digits=10, decimal_places=2, default=460.00)
    active_order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='active_delivery_partner')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rider: {self.user.username} ({'Online' if self.is_online else 'Offline'})"


class DeliveryAssignment(models.Model):
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available for Pickup'),
        ('OFFERED', 'Offered to Partner'),
        ('AWAITING_PARTNER', 'Awaiting Available Partner'),
        ('ASSIGNED', 'Assigned to Partner'),
        ('ACCEPTED', 'Accepted by Partner'),
        ('REACHED_RESTAURANT', 'Partner Reached Restaurant'),
        ('PICKED_UP', 'Food Picked Up'),
        ('DELIVERED', 'Delivered to Customer'),
        ('CANCELLED', 'Cancelled'),
        ('FAILED', 'Failed'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_assignment')
    delivery_partner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delivery_assignments',
        limit_choices_to={'role__in': ['DELIVERY', 'RIDER']}
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='AVAILABLE', db_index=True)
    cancellation_reason = models.TextField(blank=True, default='')
    issue_notes = models.TextField(blank=True, default='')
    pickup_photo = models.ImageField(upload_to='handover/pickup_photos/%Y/%m/', null=True, blank=True)
    delivery_photo = models.ImageField(upload_to='delivery/delivery_photos/%Y/%m/', null=True, blank=True)
    pickup_verification_method = models.CharField(max_length=32, default='OTP', blank=True)  # 'OTP' | 'PHOTO'
    delivery_verification_method = models.CharField(max_length=32, default='OTP', blank=True)  # 'OTP' | 'PHOTO'
    photo_verification_status = models.CharField(max_length=32, default='NONE', blank=True)  # 'NONE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

    # Phase 23 Smart Dispatch Progression
    attempt_count = models.PositiveSmallIntegerField(default=0)
    max_retries = models.PositiveSmallIntegerField(default=3)
    offer_expires_at = models.DateTimeField(null=True, blank=True)

    assigned_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    reached_restaurant_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['delivery_partner', 'status']),
            models.Index(fields=['status', 'offer_expires_at']),
        ]

    @property
    def rider(self):
        return self.delivery_partner

    @rider.setter
    def rider(self, value):
        self.delivery_partner = value

    def __str__(self):
        rider_name = self.delivery_partner.username if self.delivery_partner else "Unassigned"
        return f"Assignment #{self.id}: Order #{self.order.order_number} -> {rider_name} ({self.status})"


class DeliveryAssignmentHistory(models.Model):
    assignment = models.ForeignKey(DeliveryAssignment, on_delete=models.CASCADE, related_name='history')
    from_status = models.CharField(max_length=32, blank=True, default='')
    to_status = models.CharField(max_length=32)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='delivery_assignment_actions')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Assignment #{self.assignment_id}: {self.from_status} -> {self.to_status} at {self.created_at}"


class DeliveryOffer(models.Model):
    """
    Phase 23: Tracks sequential partner job offers, matching scores,
    and acceptance / rejection / expiration lifecycle.
    """
    OFFER_STATUS_CHOICES = (
        ('OFFERED', 'Offered to Partner'),
        ('ACCEPTED', 'Accepted by Partner'),
        ('REJECTED', 'Rejected by Partner'),
        ('EXPIRED', 'Offer Expired'),
        ('CANCELLED', 'Offer Cancelled'),
    )

    assignment = models.ForeignKey(DeliveryAssignment, on_delete=models.CASCADE, related_name='offers')
    delivery_partner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='delivery_offers',
        limit_choices_to={'role__in': ['DELIVERY', 'RIDER']}
    )
    status = models.CharField(max_length=20, choices=OFFER_STATUS_CHOICES, default='OFFERED', db_index=True)
    attempt_number = models.PositiveSmallIntegerField(default=1)

    distance_km = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    matching_score = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    estimated_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    offered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-offered_at']
        indexes = [
            models.Index(fields=['delivery_partner', 'status']),
            models.Index(fields=['assignment', 'status']),
            models.Index(fields=['status', 'expires_at']),
        ]

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Offer #{self.id}: Assignment #{self.assignment_id} -> {self.delivery_partner.username} [{self.status}]"


class DeliveryOTP(models.Model):
    """
    Stores cryptographically hashed delivery OTPs for last-mile customer verification.
    Plaintext OTP is never stored in this table or exposed in partner APIs.
    """
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_otp')
    assignment = models.ForeignKey(DeliveryAssignment, on_delete=models.CASCADE, related_name='delivery_otps', null=True, blank=True)
    
    otp_hash = models.CharField(max_length=255)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    is_used = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'is_used']),
            models.Index(fields=['assignment', 'is_used']),
        ]

    def __str__(self):
        status_str = "USED" if self.is_used else ("LOCKED" if self.is_locked() else "ACTIVE")
        return f"DeliveryOTP for Order #{self.order.order_number} [{status_str}]"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def is_locked(self):
        from django.utils import timezone
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False


class DeliveryIssueReport(models.Model):
    """
    Structured delivery issue report logged by assigned delivery partner.
    Reporting an issue does not automatically cancel the customer's order or trigger refunds.
    """
    CATEGORY_CHOICES = (
        ('CUSTOMER_UNAVAILABLE', 'Customer unavailable'),
        ('UNABLE_TO_CONTACT', 'Unable to contact customer'),
        ('INCORRECT_ADDRESS', 'Incorrect or incomplete address'),
        ('DELAYED_HANDOVER', 'Customer requests delayed handover'),
        ('OTHER', 'Other delivery issue'),
    )

    assignment = models.ForeignKey(DeliveryAssignment, on_delete=models.CASCADE, related_name='issue_reports')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='delivery_issues')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_delivery_issues')
    category = models.CharField(max_length=64, choices=CATEGORY_CHOICES, default='OTHER', db_index=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved = models.BooleanField(default=False)
    resolution_notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assignment', 'category']),
            models.Index(fields=['order', 'created_at']),
        ]

    def __str__(self):
        return f"Issue on Order #{self.order.order_number} ({self.category}): {self.description[:40]}"


class RiderPayout(models.Model):
    """
    Phase 3A: Rider payout batch ledger (INTERNAL LEDGER only).
    Mirrors payments.RestaurantSettlement. No real money movement;
    PAID requires a verified external provider UTR recorded by an admin.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('PROCESSING', 'Processing'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REVERSED', 'Reversed'),
    )

    payout_reference = models.CharField(max_length=64, unique=True, db_index=True)
    rider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rider_payouts')
    period_start = models.DateField(db_index=True)
    period_end = models.DateField(db_index=True)
    currency = models.CharField(max_length=10, default='INR')

    trip_count = models.PositiveIntegerField(default=0)
    gross_delivery_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_tips = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_bonuses = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_penalties = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_adjustments = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_payout_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    payout_provider = models.CharField(max_length=50, default='INTERNAL_LEDGER')
    provider_reference = models.CharField(max_length=128, blank=True, default='', db_index=True)
    provider_utr = models.CharField(max_length=128, blank=True, default='')
    failure_reason = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_rider_payouts')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_rider_payouts')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_rider_payouts')
    payout_initiated_at = models.DateTimeField(null=True, blank=True)
    payout_completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rider', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['period_start', 'period_end']),
        ]

    def __str__(self):
        return f"RiderPayout {self.payout_reference} [{self.status}]"


class RiderEarning(models.Model):
    """
    Phase 3A: Per-order rider earning (one row per eligible delivered order).
    Formula (approved): net = Order.delivery_fee; tip/bonus/penalty = 0
    (no verified business rules exist for those components).
    """
    STATUS_CHOICES = (
        ('ACCRUED', 'Accrued'),
        ('SETTLED', 'Settled into payout'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='rider_earning')
    rider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rider_earnings',
        limit_choices_to={'role__in': ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER']},
    )
    order_number = models.CharField(max_length=64, db_index=True)

    delivery_fee_snapshot = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tip_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    bonus_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    penalty_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACCRUED', db_index=True)
    payout = models.ForeignKey(RiderPayout, on_delete=models.SET_NULL, null=True, blank=True, related_name='earning_entries')

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rider', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"RiderEarning Order #{self.order_number} -> {self.rider.username} [{self.status}]"


class RiderPayoutAdjustment(models.Model):
    """Manual ledger correction on a payout batch. Reason mandatory at service layer."""
    ADJUSTMENT_TYPES = (
        ('BONUS_CREDIT', 'Bonus Credit'),
        ('PENALTY_DEDUCTION', 'Penalty Deduction'),
        ('MANUAL_CORRECTION', 'Manual Correction'),
    )

    payout = models.ForeignKey(RiderPayout, on_delete=models.CASCADE, related_name='adjustments', null=True, blank=True)
    rider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rider_payout_adjustments')
    adjustment_type = models.CharField(max_length=32, choices=ADJUSTMENT_TYPES, default='MANUAL_CORRECTION')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    authorized_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='authorized_rider_adjustments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"RiderAdjustment {self.adjustment_type} {self.amount} on {self.payout.payout_reference if self.payout else 'N/A'}"


from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Order)
def accrue_rider_earning_on_delivery(sender, instance, **kwargs):
    """Accrues one RiderEarning per delivered order with an assigned rider (idempotent)."""
    if instance.status == 'DELIVERED' and instance.rider_id:
        try:
            from apps.delivery.payout_service import accrue_rider_earning
            accrue_rider_earning(instance)
        except Exception:
            pass


