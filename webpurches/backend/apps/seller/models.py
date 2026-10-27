from django.db import models
from apps.accounts.models import User
from apps.products.models import Restaurant

class SellerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    restaurant = models.OneToOneField(Restaurant, on_delete=models.SET_NULL, null=True, blank=True, related_name='seller_manager')
    store_name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    banner = models.URLField(blank=True)
    is_verified = models.BooleanField(default=True)
    total_sales = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.9)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.store_name} ({'Verified' if self.is_verified else 'Pending'})"
