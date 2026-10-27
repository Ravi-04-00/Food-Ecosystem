from rest_framework import serializers
from .models import Restaurant, FoodItem, FoodAddon, FoodVariant, FoodReel, FoodPost
from apps.categories.serializers import CategorySerializer

from apps.categories.models import Category

class FoodAddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodAddon
        fields = ['id', 'name', 'price', 'is_available']


class FoodVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodVariant
        fields = ['id', 'name', 'price_modifier']


class RestaurantSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')

    class Meta:
        model = Restaurant
        fields = '__all__'


class CustomerRestaurantSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    is_currently_open = serializers.SerializerMethodField()
    closure_reason = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'restaurant_logo', 'tagline', 'description',
            'cuisines', 'rating', 'review_count', 'address',
            'latitude', 'longitude', 'delivery_time_text',
            'delivery_radius_km', 'price_for_two', 'hero_image',
            'avatar', 'is_open', 'status', 'is_currently_open', 'closure_reason',
            'is_verified', 'verification_status',
            'opening_time', 'closing_time', 'orders_paused', 'pause_reason',
            'timezone', 'operating_hours', 'exceptional_closures', 'avg_prep_time_minutes',
            'created_at'
        ]

    def get_is_currently_open(self, obj):
        if hasattr(obj, 'is_currently_open'):
            is_open_ok, _ = obj.is_currently_open()
            return is_open_ok
        return getattr(obj, 'is_open', True)

    def get_closure_reason(self, obj):
        if hasattr(obj, 'is_currently_open'):
            is_open_ok, msg = obj.is_currently_open()
            if not is_open_ok:
                return msg
        elif not getattr(obj, 'is_open', True):
            return f"Restaurant '{obj.name}' is currently closed."
        return None

    def get_status(self, obj):
        if getattr(obj, 'orders_paused', False):
            return 'PAUSED'
        if hasattr(obj, 'is_currently_open'):
            is_open_ok, _ = obj.is_currently_open()
            if not is_open_ok:
                return 'CLOSED'
        return 'OPEN' if obj.is_open else 'CLOSED'


class FoodItemSerializer(serializers.ModelSerializer):
    addons = FoodAddonSerializer(many=True, read_only=True)
    variants = FoodVariantSerializer(many=True, read_only=True)
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    restaurant_rating = serializers.ReadOnlyField(source='restaurant.rating')
    restaurant_delivery_time = serializers.ReadOnlyField(source='restaurant.delivery_time_text')
    restaurant_is_open = serializers.SerializerMethodField()
    restaurant_status = serializers.SerializerMethodField()
    is_currently_available = serializers.SerializerMethodField()
    closure_reason = serializers.SerializerMethodField()
    category_id = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()

    class Meta:
        model = FoodItem
        fields = [
            'id', 'restaurant', 'restaurant_name', 'restaurant_rating', 'restaurant_delivery_time',
            'restaurant_is_open', 'restaurant_status', 'is_currently_available', 'closure_reason',
            'category', 'category_id', 'category_name', 'category_slug', 'name', 'slug', 'short_description', 'full_description',
            'price', 'original_price', 'discount', 'is_veg', 'dietary_type', 'display_order', 'spice_level', 'prep_time_minutes',
            'ingredients', 'allergens', 'image', 'video_url', 'rating', 'review_count',
            'is_available', 'is_featured', 'stock', 'is_sold_out',
            'available_from_time', 'available_to_time', 'meal_periods',
            'addons', 'variants', 'created_at'
        ]

    def get_restaurant_is_open(self, obj):
        if obj.restaurant:
            if hasattr(obj.restaurant, 'is_currently_open'):
                is_open_ok, _ = obj.restaurant.is_currently_open()
                return is_open_ok
            return getattr(obj.restaurant, 'is_open', True)
        return True

    def get_restaurant_status(self, obj):
        if not obj.restaurant:
            return 'OPEN'
        if getattr(obj.restaurant, 'orders_paused', False):
            return 'PAUSED'
        if hasattr(obj.restaurant, 'is_currently_open'):
            is_open_ok, _ = obj.restaurant.is_currently_open()
            if not is_open_ok:
                return 'CLOSED'
        return 'OPEN' if getattr(obj.restaurant, 'is_open', True) else 'CLOSED'

    def get_is_currently_available(self, obj):
        if hasattr(obj, 'is_currently_available'):
            avail_ok, _ = obj.is_currently_available()
            return avail_ok
        return getattr(obj, 'is_available', True)

    def get_closure_reason(self, obj):
        if obj.restaurant and hasattr(obj.restaurant, 'is_currently_open'):
            is_open_ok, msg = obj.restaurant.is_currently_open()
            if not is_open_ok:
                return msg
        return None

    def get_category_id(self, obj):
        return obj.menu_category_id or obj.category_id

    def get_category_name(self, obj):
        if obj.menu_category:
            return obj.menu_category.name
        if obj.category:
            return obj.category.name
        return ''

    def get_category_slug(self, obj):
        if obj.menu_category:
            return obj.menu_category.slug
        if obj.category:
            return obj.category.slug
        return ''


class CustomerRestaurantDetailSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    is_currently_open = serializers.SerializerMethodField()
    closure_reason = serializers.SerializerMethodField()
    menu_categories = serializers.SerializerMethodField()
    foods = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'restaurant_logo', 'tagline', 'description',
            'cuisines', 'rating', 'review_count', 'address',
            'latitude', 'longitude', 'delivery_time_text',
            'delivery_radius_km', 'price_for_two', 'hero_image',
            'avatar', 'is_open', 'status', 'is_currently_open', 'closure_reason',
            'is_verified', 'verification_status',
            'opening_time', 'closing_time', 'orders_paused', 'pause_reason',
            'timezone', 'operating_hours', 'exceptional_closures', 'avg_prep_time_minutes',
            'menu_categories', 'foods', 'created_at'
        ]

    def get_is_currently_open(self, obj):
        if hasattr(obj, 'is_currently_open'):
            is_open_ok, _ = obj.is_currently_open()
            return is_open_ok
        return getattr(obj, 'is_open', True)

    def get_closure_reason(self, obj):
        if hasattr(obj, 'is_currently_open'):
            is_open_ok, msg = obj.is_currently_open()
            if not is_open_ok:
                return msg
        elif not getattr(obj, 'is_open', True):
            return f"Restaurant '{obj.name}' is currently closed."
        return None

    def get_status(self, obj):
        if getattr(obj, 'orders_paused', False):
            return 'PAUSED'
        if hasattr(obj, 'is_currently_open'):
            is_open_ok, _ = obj.is_currently_open()
            if not is_open_ok:
                return 'CLOSED'
        return 'OPEN' if obj.is_open else 'CLOSED'

    def get_menu_categories(self, obj):
        menu_cats = obj.menu_categories.filter(is_active=True).order_by('display_order', 'id')
        if menu_cats.exists():
            return [
                {
                    'id': c.id,
                    'name': c.name,
                    'slug': c.slug or c.name.lower().replace(' ', '-'),
                    'icon': '',
                    'image': '',
                    'display_order': c.display_order,
                    'count': obj.foods.filter(menu_category=c).count()
                }
                for c in menu_cats
            ]
        categories = Category.objects.filter(foods__restaurant=obj).distinct().order_by('name')
        return [
            {
                'id': c.id,
                'name': c.name,
                'slug': c.slug,
                'icon': c.icon,
                'image': c.image.url if c.image and hasattr(c.image, 'url') else str(c.image or ''),
                'count': obj.foods.filter(category=c).count()
            }
            for c in categories
        ]

    def get_foods(self, obj):
        items = obj.foods.all().order_by('display_order', '-is_available', 'name')
        return FoodItemSerializer(items, many=True, context=self.context).data


class FoodReelSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    restaurant_avatar = serializers.ReadOnlyField(source='restaurant.avatar')
    food_name = serializers.ReadOnlyField(source='food_item.name')
    food_price = serializers.ReadOnlyField(source='food_item.price')

    class Meta:
        model = FoodReel
        fields = '__all__'


class FoodPostSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    restaurant_avatar = serializers.ReadOnlyField(source='restaurant.avatar')
    food_name = serializers.ReadOnlyField(source='food_item.name')

    class Meta:
        model = FoodPost
        fields = '__all__'


# Backward compatibility
ProductSerializer = FoodItemSerializer
