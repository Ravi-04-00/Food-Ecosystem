from decimal import Decimal
from django.db import models
from apps.accounts.models import User
from apps.products.models import FoodItem, FoodVariant, FoodAddon, Restaurant

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.SET_NULL, null=True, blank=True, related_name='carts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        rest_name = self.restaurant.name if self.restaurant else 'Empty'
        return f"Cart for {self.user.email} (Restaurant: {rest_name})"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())

    def clear(self):
        self.items.all().delete()
        self.restaurant = None
        self.save(update_fields=['restaurant', 'updated_at'])


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='cart_items')
    variant = models.ForeignKey(FoodVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name='cart_items')
    selected_addons = models.JSONField(default=list, blank=True)
    special_instructions = models.TextField(blank=True, default='')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    @property
    def food_item(self):
        return self.product

    @property
    def subtotal(self):
        return Decimal(str(self.unit_price)) * self.quantity

    def calculate_unit_price(self):
        base = Decimal(str(self.product.price))
        if self.variant and self.variant.food_id == self.product_id:
            base += Decimal(str(self.variant.price_modifier))
        if self.selected_addons and isinstance(self.selected_addons, list):
            addon_sum = Decimal('0.00')
            for addon_info in self.selected_addons:
                addon_price = Decimal(str(addon_info.get('price', 0)))
                addon_sum += addon_price
            base += addon_sum
        return base

    def save(self, *args, **kwargs):
        self.unit_price = self.calculate_unit_price()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Cart #{self.cart_id}"
