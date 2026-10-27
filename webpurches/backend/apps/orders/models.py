from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.accounts.models import User, Address
from apps.products.models import FoodItem, Restaurant

class Order(models.Model):
    STATUS_CHOICES = (
        ('PLACED', 'Order Placed'),
        ('CONFIRMED', 'Order Confirmed by Kitchen'),
        ('ACCEPTED', 'Accepted by Kitchen'),
        ('PREPARING', 'Food in Kitchen Preparation'),
        ('READY_FOR_PICKUP', 'Ready for Delivery Handover'),
        ('READY', 'Ready for Delivery Handover'),
        ('PICKED_UP', 'Picked Up by Delivery Partner'),
        ('ON_THE_WAY', 'Delivery Partner En Route'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('ARRIVING', 'Delivery Partner Arriving'),
        ('DELIVERED', 'Delivered to Customer'),
        ('CANCELLED', 'Order Cancelled'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAYMENT_PROCESSING', 'Payment Processing'),
        ('PAID', 'Payment Received'),
        ('FAILED', 'Payment Failed'),
        ('CANCELLED', 'Payment Cancelled'),
        ('REFUND_PENDING', 'Refund Pending'),
        ('REFUNDED', 'Refunded'),
        ('PARTIALLY_REFUNDED', 'Partially Refunded'),
        ('VERIFIED_PAID', 'Verified Paid'),
        ('COMPLETED', 'Completed'),
    )

    order_number = models.CharField(max_length=64, unique=True, db_index=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='food_orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders', null=True)
    rider = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_address_text = models.TextField(default='Sector 7, Cyber Heights, Neo Bengaluru')
    delivery_address_snapshot = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PLACED', db_index=True)
    otp = models.CharField(max_length=6, default='8492')  # 4-digit customer delivery OTP
    pickup_otp = models.CharField(max_length=8, default='5291', blank=True)  # 4-digit kitchen handover OTP
    pickup_photo = models.ImageField(upload_to='handover/pickup_photos/%Y/%m/', null=True, blank=True)
    delivery_photo = models.ImageField(upload_to='delivery/delivery_photos/%Y/%m/', null=True, blank=True)
    pickup_verification_method = models.CharField(max_length=32, default='OTP', blank=True)  # 'OTP' | 'PHOTO'
    delivery_verification_method = models.CharField(max_length=32, default='OTP', blank=True)  # 'OTP' | 'PHOTO'
    pickup_verified_at = models.DateTimeField(null=True, blank=True)
    delivered_verified_at = models.DateTimeField(null=True, blank=True)
    photo_verification_status = models.CharField(max_length=32, default='NONE', blank=True)  # 'NONE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
    
    # Financial breakdown (Server calculated snapshots)
    item_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=30.00)
    packaging_fee = models.DecimalField(max_digits=8, decimal_places=2, default=15.00)
    taxes = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2, default=15.00)
    discount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    coupon = models.ForeignKey('coupons.Coupon', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    coupon_code_snapshot = models.CharField(max_length=50, blank=True, default='')
    loyalty_points_used = models.PositiveIntegerField(default=0)
    loyalty_discount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Payment & Notes
    payment_method = models.CharField(max_length=64, default="UPI (Instant)")
    payment_status = models.CharField(max_length=32, choices=PAYMENT_STATUS_CHOICES, default="PAYMENT_PENDING")
    cooking_instructions = models.TextField(blank=True, default='')
    
    # Rejection & Cancellation (Phase 11)
    rejection_reason = models.TextField(blank=True, default='')
    cancellation_reason = models.TextField(blank=True, default='')
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_orders')
    
    # Geospatial tracking coordinates
    customer_lat = models.DecimalField(max_digits=9, decimal_places=6, default=12.9716)
    customer_lng = models.DecimalField(max_digits=9, decimal_places=6, default=77.5946)
    restaurant_lat = models.DecimalField(max_digits=9, decimal_places=6, default=12.9780)
    restaurant_lng = models.DecimalField(max_digits=9, decimal_places=6, default=77.6010)
    rider_lat = models.DecimalField(max_digits=9, decimal_places=6, default=12.9750)
    rider_lng = models.DecimalField(max_digits=9, decimal_places=6, default=77.5980)
    rider_heading = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    eta_minutes = models.PositiveIntegerField(default=22)
    last_location_updated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['restaurant', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['customer_lat', 'customer_lng']),
            models.Index(fields=['restaurant_lat', 'restaurant_lng']),
            models.Index(fields=['rider_lat', 'rider_lng']),
        ]

    @property
    def order_status(self):
        return self.status

    @property
    def payment(self):
        return self.payments.order_by('-created_at').first()

    def save(self, *args, **kwargs):
        if not self.subtotal and self.item_total:
            self.subtotal = self.item_total
        elif not self.item_total and self.subtotal:
            self.item_total = self.subtotal

        if not self.total and self.grand_total:
            self.total = self.grand_total
        elif not self.grand_total and self.total:
            self.grand_total = self.total

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_number} - {self.status} (₹{self.total or self.grand_total})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    food_name_snapshot = models.CharField(max_length=255, default='', blank=True)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    customization_snapshot = models.JSONField(default=dict, blank=True)
    selected_addons = models.JSONField(default=list, blank=True)
    item_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    @property
    def food(self):
        return self.food_item

    def save(self, *args, **kwargs):
        if not self.unit_price_snapshot and self.price:
            self.unit_price_snapshot = self.price
        elif not self.price and self.unit_price_snapshot:
            self.price = self.unit_price_snapshot

        if not self.food_name_snapshot and self.food_item:
            self.food_name_snapshot = self.food_item.name

        self.item_total = Decimal(str(self.unit_price_snapshot)) * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        name = self.food_name_snapshot or (self.food_item.name if self.food_item else 'Item')
        return f"{self.quantity}x {name} (#{self.order.order_number})"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=32, blank=True, default='')
    to_status = models.CharField(max_length=32)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_status_changes')
    actor_role = models.CharField(max_length=32, blank=True, default='')
    reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Order Status Histories'
        indexes = [
            models.Index(fields=['order', 'created_at']),
        ]

    def __str__(self):
        return f"Order #{self.order.order_number}: {self.from_status} -> {self.to_status} ({self.created_at})"


class OrderDelayRecord(models.Model):
    """Admin-recorded delay with ETA change history. Never changes order status."""
    DELAY_TYPES = (
        ('KITCHEN', 'Restaurant preparation'),
        ('PARTNER', 'Delivery partner'),
    )
    REASONS = (
        ('TRAFFIC', 'Traffic'),
        ('RESTAURANT_PREP', 'Restaurant preparation'),
        ('PARTNER_UNAVAILABLE', 'Partner unavailable'),
        ('VEHICLE_ISSUE', 'Vehicle issue'),
        ('WEATHER', 'Weather'),
        ('CUSTOMER_ISSUE', 'Customer-related issue'),
        ('OTHER', 'Other'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='delay_records')
    delay_type = models.CharField(max_length=20, choices=DELAY_TYPES)
    reason = models.CharField(max_length=30, choices=REASONS)
    notes = models.TextField(blank=True, default='')
    previous_eta = models.PositiveIntegerField(default=0)
    new_eta = models.PositiveIntegerField()
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='recorded_delays')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'created_at']),
        ]

    def __str__(self):
        return f"Delay Order #{self.order.order_number}: {self.previous_eta}->{self.new_eta}m ({self.reason})"


class DeliverySlot(models.Model):
    """
    Restaurant-defined future delivery window. All timestamps stored in UTC;
    display converts to Asia/Kolkata (or the restaurant timezone).
    """
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='delivery_slots')
    slot_start = models.DateTimeField(db_index=True)
    slot_end = models.DateTimeField(db_index=True)
    capacity = models.PositiveIntegerField(default=10)
    booked_count = models.PositiveIntegerField(default=0)
    cutoff_minutes = models.PositiveIntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['slot_start']
        indexes = [
            models.Index(fields=['restaurant', 'slot_start']),
            models.Index(fields=['slot_start', 'is_active']),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.slot_end <= self.slot_start:
            raise ValidationError('Slot end must be after slot start.')
        if self.slot_start <= timezone.now():
            raise ValidationError('Slots must start in the future.')

    def is_bookable(self):
        from django.utils import timezone as _tz
        now = _tz.now()
        if not self.is_active or self.slot_start <= now:
            return False
        if self.booked_count >= self.capacity:
            return False
        cutoff_at = self.slot_start - timezone.timedelta(minutes=self.cutoff_minutes)
        return now <= cutoff_at

    def __str__(self):
        return f"Slot {self.restaurant.name} {self.slot_start.isoformat()} ({self.booked_count}/{self.capacity})"


class ScheduledOrder(models.Model):
    """
    Future order intent. Inventory is NOT reserved at schedule time;
    hours/stock are re-validated at release. Payment stays PENDING until
    the released Order follows the normal payment flow.
    """
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('CONFIRMED', 'Confirmed'),
        ('RELEASED', 'Released as order'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='scheduled_orders')
    slot = models.ForeignKey(DeliverySlot, on_delete=models.PROTECT, related_name='scheduled_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    # Snapshot of cart lines at schedule time [{food_item_id, quantity, unit_price}]
    items_snapshot = models.JSONField(default=list)
    item_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=30.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=32, default='UPI')
    address_snapshot = models.JSONField(default=dict)
    released_order = models.OneToOneField(
        Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_source')
    idempotency_key = models.CharField(max_length=64, unique=True, db_index=True)
    cancel_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['slot', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"ScheduledOrder #{self.id} [{self.status}] slot={self.slot_id}"

