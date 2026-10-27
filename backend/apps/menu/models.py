from django.db import models
from django.utils.text import slugify
from apps.products.models import Restaurant

class MenuCategory(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_categories')
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, blank=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = 'Menu Category'
        verbose_name_plural = 'Menu Categories'
        unique_together = [['restaurant', 'name']]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name) or 'category'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"
