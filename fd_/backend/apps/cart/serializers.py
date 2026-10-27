from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.models import FoodItem, FoodVariant, FoodAddon

class CartItemSerializer(serializers.ModelSerializer):
    food_id = serializers.IntegerField(source='product.id', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    food_name = serializers.CharField(source='product.name', read_only=True)
    name = serializers.CharField(source='product.name', read_only=True)
    food_slug = serializers.CharField(source='product.slug', read_only=True)
    food_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    food_image = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    is_veg = serializers.BooleanField(source='product.is_veg', read_only=True)
    dietary_type = serializers.CharField(source='product.dietary_type', read_only=True)
    is_available = serializers.BooleanField(source='product.is_available', read_only=True)
    restaurant_id = serializers.IntegerField(source='product.restaurant.id', read_only=True)
    restaurant_name = serializers.CharField(source='product.restaurant.name', read_only=True)
    variant_details = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'food_id', 'product_id', 'food_name', 'name', 'food_slug',
            'food_price', 'food_image', 'image', 'is_veg', 'dietary_type',
            'is_available', 'restaurant_id', 'restaurant_name',
            'variant', 'variant_details', 'selected_addons',
            'special_instructions', 'unit_price', 'quantity', 'subtotal',
            'created_at', 'updated_at'
        ]

    def get_food_image(self, obj):
        if obj.product.food_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.food_image.url)
            return obj.product.food_image.url
        return obj.product.image or ''

    def get_image(self, obj):
        return self.get_food_image(obj)

    def get_variant_details(self, obj):
        if obj.variant:
            return {
                'id': obj.variant.id,
                'name': obj.variant.name,
                'price_modifier': float(obj.variant.price_modifier)
            }
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    restaurant = serializers.SerializerMethodField()
    total_items = serializers.IntegerField(read_only=True)
    total_count = serializers.IntegerField(source='total_items', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    delivery_fee = serializers.SerializerMethodField()
    packaging_fee = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            'id', 'restaurant', 'items', 'total_items', 'total_count',
            'subtotal', 'delivery_fee', 'packaging_fee', 'grand_total',
            'updated_at'
        ]

    def get_restaurant(self, obj):
        if obj.restaurant:
            request = self.context.get('request')
            logo_url = ''
            if obj.restaurant.restaurant_logo:
                if request:
                    try:
                        logo_url = request.build_absolute_uri(obj.restaurant.restaurant_logo.url)
                    except Exception:
                        logo_url = obj.restaurant.restaurant_logo.url
                else:
                    logo_url = obj.restaurant.restaurant_logo.url
            elif obj.restaurant.avatar:
                logo_url = obj.restaurant.avatar

            return {
                'id': obj.restaurant.id,
                'name': obj.restaurant.name,
                'address': obj.restaurant.address,
                'logo': logo_url,
                'restaurant_logo': logo_url,
                'is_open': obj.restaurant.is_open,
                'status': 'OPEN' if obj.restaurant.is_open else 'CLOSED',
                'delivery_time_text': obj.restaurant.delivery_time_text
            }
        return None

    def get_delivery_fee(self, obj):
        return 30.00 if obj.items.exists() else 0.00

    def get_packaging_fee(self, obj):
        return 15.00 if obj.items.exists() else 0.00

    def get_grand_total(self, obj):
        sub = float(obj.subtotal)
        if sub <= 0:
            return 0.00
        return sub + self.get_delivery_fee(obj) + self.get_packaging_fee(obj)
