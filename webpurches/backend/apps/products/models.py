from django.db import models
from apps.accounts.models import User
from apps.categories.models import Category

class Restaurant(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='restaurants')
    name = models.CharField(max_length=255, unique=True)
    owner_name = models.CharField(max_length=150, blank=True, default='')
    restaurant_logo = models.ImageField(upload_to='restaurants/logos/', null=True, blank=True)
    verification_status = models.CharField(max_length=20, default='PENDING')  # PENDING, APPROVED, REJECTED
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    cuisines = models.JSONField(default=list)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.8)
    review_count = models.PositiveIntegerField(default=142)
    address = models.TextField(default='Neo Bengaluru Food Grid 404')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=12.9716)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=77.5946)
    delivery_time_text = models.CharField(max_length=64, default="18-24 min")
    delivery_radius_km = models.DecimalField(max_digits=4, decimal_places=1, default=12.0)
    price_for_two = models.CharField(max_length=64, default="₹450 for two")
    hero_image = models.URLField(blank=True, default='')
    avatar = models.URLField(blank=True, default='')
    is_open = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Financial metrics for Shop dashboard
    revenue_today = models.DecimalField(max_digits=12, decimal_places=2, default=14850.00)
    revenue_weekly = models.DecimalField(max_digits=12, decimal_places=2, default=98400.00)
    revenue_monthly = models.DecimalField(max_digits=12, decimal_places=2, default=384000.00)
    total_orders = models.PositiveIntegerField(default=340)

    # Phase 22: Operating Hours, Capacity & Scheduling
    opening_time = models.TimeField(default='08:00:00')
    closing_time = models.TimeField(default='23:00:00')
    orders_paused = models.BooleanField(default=False)
    pause_reason = models.CharField(max_length=255, blank=True, default='')
    timezone = models.CharField(max_length=64, default='Asia/Kolkata')
    operating_hours = models.JSONField(default=dict, blank=True)
    exceptional_closures = models.JSONField(default=list, blank=True)
    avg_prep_time_minutes = models.PositiveIntegerField(default=20)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']
        indexes = [
            models.Index(fields=['verification_status', 'is_open']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]

    @property
    def availability_status(self):
        if self.orders_paused:
            return 'PAUSED'
        return 'OPEN' if self.is_open else 'CLOSED'

    def is_currently_open(self, target_dt=None):
        """
        Determines whether the restaurant is currently accepting orders based on:
        1. is_open master switch
        2. orders_paused temporary pause switch
        3. exceptional closures (holidays/dates)
        4. operating hours / opening and closing times in the configured timezone
        """
        if not self.is_open:
            return False, f"Restaurant '{self.name}' is currently marked closed."
        if self.orders_paused:
            msg = f"Restaurant '{self.name}' has temporarily paused accepting orders: {self.pause_reason}" if self.pause_reason else f"Restaurant '{self.name}' has temporarily paused accepting new orders."
            return False, msg

        import pytz
        from django.utils import timezone as dj_timezone
        from datetime import time

        tz_name = self.timezone or 'Asia/Kolkata'
        try:
            tz = pytz.timezone(tz_name)
        except Exception:
            tz = pytz.timezone('Asia/Kolkata')

        current_dt = target_dt or dj_timezone.now().astimezone(tz)
        current_date_str = current_dt.strftime('%Y-%m-%d')
        current_time = current_dt.time()
        weekday_name = current_dt.strftime('%A').lower()

        # Check exceptional closures
        if self.exceptional_closures and isinstance(self.exceptional_closures, list):
            for closure in self.exceptional_closures:
                if isinstance(closure, dict) and closure.get('date') == current_date_str:
                    reason = closure.get('reason', 'Scheduled holiday closure')
                    return False, f"Restaurant '{self.name}' is closed today: {reason}."

        # Check custom day-of-week operating hours
        if self.operating_hours and isinstance(self.operating_hours, dict) and weekday_name in self.operating_hours:
            day_cfg = self.operating_hours[weekday_name]
            if isinstance(day_cfg, dict):
                if day_cfg.get('is_closed', False):
                    return False, f"Restaurant '{self.name}' is closed on {current_dt.strftime('%A')}s."
                open_str = day_cfg.get('open')
                close_str = day_cfg.get('close')
                if open_str and close_str:
                    try:
                        o_h, o_m = map(int, open_str.split(':')[:2])
                        c_h, c_m = map(int, close_str.split(':')[:2])
                        o_time = time(o_h, o_m)
                        c_time = time(c_h, c_m)
                        if o_time <= c_time:
                            if not (o_time <= current_time <= c_time):
                                return False, f"Restaurant '{self.name}' operating hours today are {open_str} to {close_str}."
                        else:  # Cross-midnight
                            if not (current_time >= o_time or current_time <= c_time):
                                return False, f"Restaurant '{self.name}' operating hours today are {open_str} to {close_str}."
                    except Exception:
                        pass

        # Standard opening_time / closing_time check
        if self.opening_time and self.closing_time:
            if self.opening_time <= self.closing_time:
                if not (self.opening_time <= current_time <= self.closing_time):
                    return False, f"Restaurant '{self.name}' operating hours are {self.opening_time.strftime('%I:%M %p')} to {self.closing_time.strftime('%I:%M %p')}."
            else:
                if not (current_time >= self.opening_time or current_time <= self.closing_time):
                    return False, f"Restaurant '{self.name}' operating hours are {self.opening_time.strftime('%I:%M %p')} to {self.closing_time.strftime('%I:%M %p')}."

        return True, "Open"

    def __str__(self):
        return f"{self.name} (★{self.rating})"


class FoodItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='foods')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='foods')
    menu_category = models.ForeignKey('menu.MenuCategory', on_delete=models.PROTECT, null=True, blank=True, related_name='food_items')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    short_description = models.TextField(blank=True)
    full_description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=32, blank=True)
    is_veg = models.BooleanField(default=True)
    dietary_type = models.CharField(max_length=20, choices=[('VEG', 'VEG'), ('NON_VEG', 'NON_VEG'), ('OTHER', 'OTHER')], default='VEG')
    display_order = models.IntegerField(default=0)
    spice_level = models.PositiveSmallIntegerField(default=1)  # 0 to 3
    prep_time_minutes = models.PositiveIntegerField(default=15)
    ingredients = models.JSONField(default=list, blank=True)
    allergens = models.JSONField(default=list, blank=True)
    food_image = models.ImageField(upload_to='foods/', null=True, blank=True)
    image = models.URLField(blank=True, default='')
    video_url = models.URLField(blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.9)
    review_count = models.PositiveIntegerField(default=89)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    stock = models.PositiveIntegerField(default=50)

    # Phase 22: Menu Time Scheduling & Sold Out state
    is_sold_out = models.BooleanField(default=False)
    available_from_time = models.TimeField(null=True, blank=True)
    available_to_time = models.TimeField(null=True, blank=True)
    meal_periods = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']
        indexes = [
            models.Index(fields=['restaurant', 'is_available']),
            models.Index(fields=['category', 'is_available']),
            models.Index(fields=['is_veg', 'price']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]

    def is_currently_available(self, target_dt=None):
        """
        Validates if food item is available for purchasing based on:
        1. is_available switch
        2. is_sold_out and stock > 0
        3. Meal periods & available_from_time / available_to_time in restaurant's timezone
        """
        if not self.is_available:
            return False, f"Dish '{self.name}' is currently unavailable."
        if self.is_sold_out or self.stock <= 0:
            return False, f"Dish '{self.name}' is sold out."

        if not self.available_from_time and not self.available_to_time and not self.meal_periods:
            return True, "Available"

        import pytz
        from django.utils import timezone as dj_timezone
        from datetime import time

        tz_name = getattr(self.restaurant, 'timezone', 'Asia/Kolkata') or 'Asia/Kolkata'
        try:
            tz = pytz.timezone(tz_name)
        except Exception:
            tz = pytz.timezone('Asia/Kolkata')

        current_dt = target_dt or dj_timezone.now().astimezone(tz)
        current_time = current_dt.time()

        # Check meal periods if configured
        if self.meal_periods and isinstance(self.meal_periods, list) and len(self.meal_periods) > 0:
            period_matched = False
            period_labels = []
            for period in self.meal_periods:
                if isinstance(period, dict):
                    p_name = period.get('name') or period.get('label') or 'Period'
                    start_str = period.get('start')
                    end_str = period.get('end')
                    period_labels.append(f"{p_name} ({start_str} - {end_str})")
                    if start_str and end_str:
                        try:
                            s_h, s_m = map(int, start_str.split(':')[:2])
                            e_h, e_m = map(int, end_str.split(':')[:2])
                            s_time = time(s_h, s_m)
                            e_time = time(e_h, e_m)
                            if s_time <= e_time:
                                if s_time <= current_time <= e_time:
                                    period_matched = True
                                    break
                            else:
                                if current_time >= s_time or current_time <= e_time:
                                    period_matched = True
                                    break
                        except Exception:
                            pass
            if not period_matched:
                periods_text = ", ".join(period_labels)
                return False, f"Dish '{self.name}' is only available during: {periods_text}. Current time: {current_time.strftime('%I:%M %p')}."

        # Check available_from_time and available_to_time
        if self.available_from_time and self.available_to_time:
            if self.available_from_time <= self.available_to_time:
                if not (self.available_from_time <= current_time <= self.available_to_time):
                    return False, f"Dish '{self.name}' is only available between {self.available_from_time.strftime('%I:%M %p')} and {self.available_to_time.strftime('%I:%M %p')}. Current time: {current_time.strftime('%I:%M %p')}."
            else:
                if not (current_time >= self.available_from_time or current_time <= self.available_to_time):
                    return False, f"Dish '{self.name}' is only available between {self.available_from_time.strftime('%I:%M %p')} and {self.available_to_time.strftime('%I:%M %p')}. Current time: {current_time.strftime('%I:%M %p')}."

        return True, "Available"

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            base = slugify(self.name) or 'dish'
            unique = str(uuid.uuid4())[:8]
            self.slug = f"{base}-{unique}"
        if not self.is_veg:
            if self.dietary_type == 'VEG':
                self.dietary_type = 'NON_VEG'
        else:
            if self.dietary_type in ['NON_VEG', 'OTHER']:
                self.is_veg = False
            else:
                self.is_veg = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({self.restaurant.name})"


class FoodAddon(models.Model):
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='addons')
    name = models.CharField(max_length=128)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} (+₹{self.price})"


class FoodVariant(models.Model):
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=128)
    price_modifier = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)

    def __str__(self):
        return f"{self.food.name} - {self.name}"


class FoodReel(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reels')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='reels')
    title = models.CharField(max_length=255)
    caption = models.TextField(blank=True)
    video_url = models.URLField()
    thumbnail = models.URLField(blank=True)
    likes_count = models.PositiveIntegerField(default=420)
    comments_count = models.PositiveIntegerField(default=38)
    views_count = models.PositiveIntegerField(default=2400)
    audio_title = models.CharField(max_length=150, default="Cyber Sizzle Beats • Original")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reel: {self.title} ({self.restaurant.name})"


class FoodPost(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='posts')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    title = models.CharField(max_length=255)
    caption = models.TextField()
    image = models.URLField()
    likes_count = models.PositiveIntegerField(default=150)
    comments_count = models.PositiveIntegerField(default=18)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post: {self.title} ({self.restaurant.name})"

# Backward compatibility alias
Product = FoodItem
