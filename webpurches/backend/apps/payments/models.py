from decimal import Decimal
from django.db import models
from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.orders.models import Order


class Payment(models.Model):
    STATUS_CHOICES = (
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAYMENT_PROCESSING', 'Payment Processing'),
        ('PAID', 'Settled / Paid'),
        ('FAILED', 'Payment Failed'),
        ('CANCELLED', 'Payment Cancelled'),
        ('REFUND_PENDING', 'Refund Pending'),
        ('REFUNDED', 'Refunded'),
        ('PARTIALLY_REFUNDED', 'Partially Refunded'),
        # Legacy status support
        ('PENDING', 'Pending (Legacy)'),
        ('AUTHORIZED', 'Authorized (Legacy)'),
    )
    METHOD_CHOICES = (
        ('UPI', 'Unified Payments Interface (UPI)'),
        ('CARD', 'Credit / Debit Card'),
        ('NETBANKING', 'Net Banking Escrow'),
        ('WALLET', 'WS Food Balance Wallet'),
        ('OTHER', 'Other Method'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    payment_provider = models.CharField(max_length=50, default='RAZORPAY')
    provider_order_id = models.CharField(max_length=128, blank=True, db_index=True)
    provider_payment_id = models.CharField(max_length=128, blank=True, db_index=True)
    provider_signature = models.CharField(max_length=256, blank=True)

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_minor_units = models.PositiveBigIntegerField(default=0)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='PAYMENT_PENDING', db_index=True)
    payment_method = models.CharField(max_length=50, default='UPI')
    gateway_session_id = models.CharField(max_length=150, blank=True)
    idempotency_key = models.CharField(max_length=128, blank=True, null=True, unique=True, db_index=True)

    failure_code = models.CharField(max_length=100, blank=True)
    failure_description = models.TextField(blank=True)

    # Refund management (Phase 14 represents statuses; no automatic execution)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    refund_reason = models.TextField(blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    provider_refund_id = models.CharField(max_length=128, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'status']),
            models.Index(fields=['provider_order_id']),
            models.Index(fields=['provider_payment_id']),
        ]

    @property
    def payment_status(self):
        return self.status

    @payment_status.setter
    def payment_status(self, value):
        self.status = value

    def save(self, *args, **kwargs):
        if self.amount and not self.amount_minor_units:
            try:
                self.amount_minor_units = int(Decimal(str(self.amount)) * 100)
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment #{self.id} for Order #{self.order.order_number}: {self.status} (₹{self.amount})"


class Transaction(models.Model):
    TXN_TYPE_CHOICES = (
        ('CHARGE', 'Order Charge'),
        ('REFUND', 'Order Refund'),
        ('CASHBACK', 'Loyalty Cashback'),
    )
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    transaction_id = models.CharField(max_length=120, unique=True)
    transaction_type = models.CharField(max_length=20, choices=TXN_TYPE_CHOICES, default='CHARGE')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_success = models.BooleanField(default=True)
    idempotency_key = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    raw_response = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type}: {self.transaction_id} (₹{self.amount})"


class PaymentWebhook(models.Model):
    event_id = models.CharField(max_length=128, unique=True, null=True, blank=True, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    provider = models.CharField(max_length=50, default='RAZORPAY')
    signature = models.CharField(max_length=256, blank=True)
    payload = models.JSONField(default=dict)
    is_verified = models.BooleanField(default=False)
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments_paymentwebhook'
        ordering = ['-created_at']

    def __str__(self):
        return f"Webhook {self.event_type} (ID: {self.event_id}) - Verified: {self.is_verified}"


PaymentWebhookEvent = PaymentWebhook


class RestaurantSettlement(models.Model):
    """
    Auditable settlement batch grouping eligible delivered order commission entries for payout.
    Maintains traceable links to underlying financial entries and prevents double payment.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('PROCESSING', 'Processing Settlement'),
        ('PAID', 'Settlement Paid & Verified'),
        ('FAILED', 'Settlement Failed'),
        ('REVERSED', 'Settlement Reversed'),
    )

    settlement_reference = models.CharField(max_length=64, unique=True, db_index=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='settlements')
    period_start = models.DateField(db_index=True)
    period_end = models.DateField(db_index=True)
    currency = models.CharField(max_length=10, default='INR')

    order_count = models.PositiveIntegerField(default=0)
    gross_sales_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_packaging_fees = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_commission_deducted = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_adjustments = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_payout_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    payout_provider = models.CharField(max_length=50, default='INTERNAL_LEDGER')
    provider_reference = models.CharField(max_length=128, blank=True, db_index=True)
    provider_utr = models.CharField(max_length=128, blank=True)
    failure_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_settlements')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_settlements')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_settlements')

    payout_initiated_at = models.DateTimeField(null=True, blank=True)
    payout_completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['restaurant', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['period_start', 'period_end']),
        ]

    def __str__(self):
        return f"Settlement {self.settlement_reference} ({self.restaurant.name}) - {self.status} (₹{self.net_payout_amount})"


class RestaurantCommission(models.Model):
    """
    Versioned financial snapshot of platform commission and restaurant earnings per delivered order.
    Calculated explicitly on the backend based on eligible food subtotal.
    """
    STATUS_CHOICES = (
        ('ACCRUED', 'Accrued (Ready for Settlement)'),
        ('SETTLED', 'Included in Settlement Batch'),
        ('CANCELLED', 'Order Cancelled (No Commission)'),
        ('REFUNDED', 'Order Refunded (Reversed)'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='commission_entry')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='commission_entries')
    order_number = models.CharField(max_length=64, db_index=True)

    # Calculation Base (Food subtotal, excluding delivery, taxes, platform fee)
    calculation_base = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    packaging_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))

    # Snapshotted Commission Rates
    rate_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))
    fixed_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_on_commission = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Net payable to restaurant: (calculation_base + packaging_fee) - commission_amount - refund_deduction
    net_restaurant_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    refund_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='ACCRUED', db_index=True)
    settlement = models.ForeignKey(
        RestaurantSettlement,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='commission_entries'
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['restaurant', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Commission for Order #{self.order_number}: ₹{self.commission_amount} (Net: ₹{self.net_restaurant_amount}) [{self.status}]"


class SettlementAdjustment(models.Model):
    """
    Audited financial adjustment record (credit or debit) linked to a restaurant settlement.
    Requires an explicit reason and authorized user for audit compliance.
    """
    ADJUSTMENT_TYPES = (
        ('DISPUTE_DEDUCTION', 'Dispute Compensation / Item Deduction'),
        ('PROMOTION_CREDIT', 'Marketing Subsidy / Platform Credit'),
        ('TAX_CORRECTION', 'Tax Withholding / Correction'),
        ('MANUAL_CORRECTION', 'Administrative Adjustment'),
    )

    settlement = models.ForeignKey(
        RestaurantSettlement,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='adjustments'
    )
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='settlement_adjustments')
    adjustment_type = models.CharField(max_length=50, choices=ADJUSTMENT_TYPES, default='MANUAL_CORRECTION')
    amount = models.DecimalField(max_digits=12, decimal_places=2)  # Positive = Credit to restaurant, Negative = Debit
    reason = models.TextField()
    authorized_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='authorized_settlement_adjustments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Adjustment #{self.id} for {self.restaurant.name}: ₹{self.amount} ({self.adjustment_type})"


# ===========================================================================
# Signal Handlers: Automated Financial Snapshot Sync
# ===========================================================================
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Order)
def sync_commission_on_order_update(sender, instance, **kwargs):
    """Ensures commission snapshot stays aligned whenever order or payment status changes."""
    if instance.restaurant_id and (
        instance.status in ['DELIVERED', 'CANCELLED'] or
        instance.payment_status in ['PAID', 'VERIFIED_PAID', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED']
    ):
        try:
            from apps.payments.commission_service import record_or_update_order_commission
            record_or_update_order_commission(instance)
        except Exception:
            pass


@receiver(post_save, sender=Payment)
def sync_commission_on_payment_update(sender, instance, **kwargs):
    """Ensures commission snapshot is synced if payment status transitions to PAID or REFUNDED."""
    if instance.order_id and instance.order and instance.order.restaurant_id:
        if instance.status in ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED']:
            try:
                from apps.payments.commission_service import record_or_update_order_commission
                record_or_update_order_commission(instance.order)
            except Exception:
                pass




