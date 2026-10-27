from django.db import models
from django.conf import settings


class ShiftSlot(models.Model):
    SLOT_CHOICES = [
        ('MORNING', 'Morning (6:00 AM - 11:00 AM)'),
        ('LUNCH', 'Lunch Rush (11:00 AM - 3:00 PM)'),
        ('EVENING', 'Evening (3:00 PM - 7:00 PM)'),
        ('DINNER', 'Dinner Rush (7:00 PM - 11:00 PM)'),
        ('LATE_NIGHT', 'Late Night (11:00 PM - 2:00 AM)'),
    ]

    name = models.CharField(max_length=100)
    slot_type = models.CharField(max_length=30, choices=SLOT_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    multiplier = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    is_peak = models.BooleanField(default=False)
    zone = models.CharField(max_length=100, default='Chennai Central')
    zone_lat = models.DecimalField(max_digits=9, decimal_places=6, default=13.0827)
    zone_lng = models.DecimalField(max_digits=9, decimal_places=6, default=80.2707)
    geofence_radius_km = models.DecimalField(max_digits=4, decimal_places=1, default=5.0)
    max_capacity = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.name} ({self.zone})"


class Shift(models.Model):
    slot = models.ForeignKey(ShiftSlot, on_delete=models.CASCADE, related_name='instances')
    date = models.DateField(db_index=True)
    zone = models.CharField(max_length=100, default='Chennai Central')
    capacity = models.PositiveIntegerField(default=10)
    booked_count = models.PositiveIntegerField(default=0)
    waitlist_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['date', 'slot__start_time']
        unique_together = [('slot', 'date', 'zone')]

    @property
    def is_full(self):
        return self.booked_count >= self.capacity

    def __str__(self):
        return f"{self.slot.name} on {self.date} ({self.zone})"


class ShiftBooking(models.Model):
    STATUS_CHOICES = [
        ('BOOKED', 'Slot Booked & Confirmed'),
        ('WAITLIST', 'Waitlisted (Full Capacity)'),
        ('CANCELLED', 'Cancelled by Partner'),
        ('CHECKED_IN', 'Partner Checked-In'),
        ('COMPLETED', 'Shift Successfully Completed'),
    ]

    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='bookings')
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shift_bookings')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BOOKED')
    waitlist_position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'shift__slot__start_time']
        unique_together = [('shift', 'rider')]

    def __str__(self):
        return f"Booking #{self.id} - {self.rider} - {self.status}"


class CheckIn(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active on Duty'),
        ('ON_BREAK', 'On Approved Break'),
        ('COMPLETED', 'Checked Out & Completed'),
    ]

    booking = models.OneToOneField(ShiftBooking, on_delete=models.CASCADE, related_name='check_in')
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='check_ins')
    check_in_time = models.DateTimeField(auto_now_add=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    check_in_lat = models.DecimalField(max_digits=9, decimal_places=6)
    check_in_lng = models.DecimalField(max_digits=9, decimal_places=6)
    check_out_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_late = models.BooleanField(default=False)
    late_minutes = models.PositiveIntegerField(default=0)
    penalty_applied = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    orders_delivered = models.PositiveIntegerField(default=0)
    shift_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CheckIn #{self.id} - {self.rider} ({self.status})"


class BreakLog(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Currently on Break'),
        ('COMPLETED', 'Break Ended'),
    ]

    check_in = models.ForeignKey(CheckIn, on_delete=models.CASCADE, related_name='breaks')
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='breaks')
    break_number = models.PositiveSmallIntegerField(default=1)
    break_start = models.DateTimeField(auto_now_add=True)
    break_end = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    def __str__(self):
        return f"Break #{self.break_number} for CheckIn #{self.check_in_id}"


class ShiftSwap(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Partner Response'),
        ('ACCEPTED', 'Accepted by Peer (Awaiting Admin Approval)'),
        ('APPROVED', 'Admin Approved & Executed'),
        ('REJECTED', 'Swap Rejected'),
        ('CANCELLED', 'Cancelled by Requester'),
    ]

    booking = models.ForeignKey(ShiftBooking, on_delete=models.CASCADE, related_name='swap_requests')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_shift_swaps')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_shift_swaps')
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Swap #{self.id} - from {self.requester} to {self.receiver} ({self.status})"


class ShiftBonus(models.Model):
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shift_bonuses')
    streak_count = models.PositiveIntegerField(default=5)
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=500.0)
    reason = models.CharField(max_length=255, default='5 Completed Shifts Streak Bonus')
    is_claimed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bonus ₹{self.bonus_amount} for {self.rider} - {self.reason}"
