from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.orders.models import Order


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('PERCENTAGE', 'Percentage Discount'),
        ('FLAT', 'Flat Amount Discount'),
    )

    code = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=120, blank=True, default='')
    description = models.TextField(blank=True, default='')
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='PERCENTAGE')
    
    # Value for percentage discounts (e.g., 20 means 20%)
    discount_percentage = models.PositiveIntegerField(default=20)
    # Value for flat amount discounts (e.g., 50.00 means ₹50 off)
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    
    # Cap for percentage discounts (e.g., max ₹120 off)
    max_discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('120.00'))
    # Minimum cart subtotal required to unlock this coupon
    min_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('299.00'))
    
    # Validity timeframe
    start_date = models.DateTimeField(default=timezone.now)
    expiry_date = models.DateTimeField(null=True, blank=True)
    
    # Usage limits
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="Total global redemptions allowed")
    max_uses_per_user = models.PositiveIntegerField(default=1, help_text="Max times a single customer can redeem")
    current_uses = models.PositiveIntegerField(default=0, help_text="Committed redemption count")
    
    # Targeting conditions
    first_order_only = models.BooleanField(default=False, help_text="Only valid on user's first order")
    is_combinable = models.BooleanField(default=False, help_text="Whether this coupon can be combined with other offers")
    applicable_restaurants = models.ManyToManyField(Restaurant, blank=True, related_name='exclusive_coupons', help_text="If empty, valid across all restaurants")
    
    terms_and_conditions = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def is_currently_valid(self):
        """Check time window and active flag."""
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date and now < self.start_date:
            return False
        if self.expiry_date and now > self.expiry_date:
            return False
        if self.max_uses is not None and self.current_uses >= self.max_uses:
            return False
        return True

    def __str__(self):
        if self.discount_type == 'PERCENTAGE':
            return f"{self.code} ({self.discount_percentage}% OFF up to ₹{self.max_discount_amount})"
        return f"{self.code} (₹{self.discount_amount} FLAT OFF)"


class CouponRedemption(models.Model):
    STATUS_CHOICES = (
        ('COMMITTED', 'Committed & Applied'),
        ('REVERSED', 'Reversed / Cancelled'),
    )

    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='redemptions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coupon_redemptions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='coupon_redemptions')
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMMITTED')
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-redeemed_at']
        constraints = [
            models.UniqueConstraint(
                fields=['coupon', 'order'],
                condition=models.Q(status='COMMITTED'),
                name='unique_committed_coupon_per_order'
            )
        ]

    def __str__(self):
        return f"Redemption #{self.id}: {self.coupon.code} for Order #{self.order.order_number} (₹{self.discount_amount})"


class LoyaltyProgramConfig(models.Model):
    """
    Authoritative platform-wide configuration for the loyalty rewards program.
    Ensures points-to-currency conversion rates and earning thresholds are strictly validated.
    """
    # 1 point earned per ₹10 spent by default (points_earn_rate = 1.0, earn_per_amount = 10.0)
    points_earn_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.00'))
    earn_per_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('10.00'))
    
    # 1 point = ₹0.50 discount upon checkout redemption
    points_to_inr_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.50'))
    
    # Minimum points balance required before customer can redeem
    min_points_to_redeem = models.PositiveIntegerField(default=50)
    
    # Maximum percentage of subtotal that can be paid via points (e.g. 50% cap)
    max_discount_percentage_of_subtotal = models.PositiveIntegerField(default=50)
    
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_solo(cls):
        """Fetch existing singleton config or create default."""
        config, _ = cls.objects.get_or_create(id=1)
        return config

    def __str__(self):
        return f"Loyalty Config (Earn: {self.points_earn_rate} pt/₹{self.earn_per_amount}, Redeem: ₹{self.points_to_inr_rate}/pt)"


class LoyaltyLedgerEntry(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('AWARD', 'Points Earned on Completed Order'),
        ('REDEEM', 'Points Redeemed on Checkout'),
        ('REVERSAL', 'Points Reversed (Order Cancelled/Refunded)'),
        ('BONUS', 'Promotional Bonus Awarded'),
        ('EXPIRED', 'Points Expired'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loyalty_ledger')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='loyalty_ledger_entries')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    points = models.IntegerField(help_text="Signed: positive for award/bonus, negative for redemption")
    balance_after = models.PositiveIntegerField(help_text="Point balance immediately following this entry")
    reference_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Monetary value associated with entry")
    description = models.CharField(max_length=255)
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['transaction_type']),
        ]

    def __str__(self):
        sign = "+" if self.points >= 0 else ""
        return f"Ledger #{self.id} for {self.user.email}: {sign}{self.points} pts [{self.transaction_type}] (Bal: {self.balance_after})"
