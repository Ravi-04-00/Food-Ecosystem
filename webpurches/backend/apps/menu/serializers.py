import re
from rest_framework import serializers
from .models import MenuCategory
from apps.products.models import Restaurant, FoodItem

class MenuCategorySerializer(serializers.ModelSerializer):
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    food_count = serializers.SerializerMethodField()

    class Meta:
        model = MenuCategory
        fields = [
            'id', 'restaurant', 'restaurant_name', 'name', 'slug',
            'description', 'is_active', 'display_order',
            'food_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'restaurant', 'restaurant_name', 'slug', 'food_count', 'created_at', 'updated_at']

    def get_food_count(self, obj):
        return obj.food_items.count()

    def validate_name(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Category name cannot be empty.")
        if len(val) < 2 or len(val) > 120:
            raise serializers.ValidationError("Category name must be between 2 and 120 characters.")
        return val

    def validate(self, attrs):
        request = self.context.get('request')
        restaurant = self.context.get('restaurant')
        if not restaurant and request and request.user.is_authenticated:
            restaurant = Restaurant.objects.filter(owner=request.user).first()

        name = attrs.get('name')
        if name and restaurant:
            qs = MenuCategory.objects.filter(restaurant=restaurant, name__iexact=name.strip())
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError({"name": ["A category with this name already exists for your restaurant."]})
        return attrs


class RestaurantFoodManageSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    category = serializers.IntegerField(write_only=False, required=False)
    category_id = serializers.IntegerField(source='menu_category_id', read_only=True)
    category_name = serializers.SerializerMethodField()
    description = serializers.CharField(required=False, allow_blank=True)
    food_image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    remove_image = serializers.BooleanField(required=False, default=False, write_only=True)

    class Meta:
        model = FoodItem
        fields = [
            'id', 'restaurant', 'restaurant_name', 'category', 'category_id',
            'category_name', 'name', 'slug', 'description', 'price',
            'original_price', 'discount', 'is_veg', 'dietary_type',
            'display_order', 'is_available', 'stock', 'is_sold_out',
            'available_from_time', 'available_to_time', 'meal_periods',
            'image', 'food_image', 'remove_image', 'rating', 'review_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'restaurant', 'restaurant_name', 'slug', 'rating',
            'review_count', 'created_at', 'updated_at'
        ]

    def get_category_name(self, obj):
        if obj.menu_category:
            return obj.menu_category.name
        if obj.category:
            return obj.category.name
        return ''

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.food_image:
            try:
                data['image'] = request.build_absolute_uri(instance.food_image.url) if request else instance.food_image.url
            except Exception:
                pass
        data['category'] = instance.menu_category_id if instance.menu_category_id else (instance.category_id if instance.category_id else None)
        data['description'] = instance.full_description or instance.short_description or ''
        return data

    def validate_name(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Food name cannot be empty.")
        if len(val) < 2 or len(val) > 255:
            raise serializers.ValidationError("Food name must be between 2 and 255 characters.")
        return val

    def validate_price(self, value):
        if value is None or float(value) <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate(self, attrs):
        from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
        request = self.context.get('request')
        restaurant = self.context.get('restaurant')
        user = request.user if request else None
        if not restaurant and getattr(self, 'instance', None):
            restaurant = getattr(self.instance, 'restaurant', None)
        if not restaurant and user and user.is_authenticated:
            data = self.initial_data or {}
            rid = data.get('restaurant_id') or data.get('restaurant')
            if rid and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'):
                try:
                    restaurant = Restaurant.objects.filter(id=int(rid)).first()
                except (TypeError, ValueError):
                    restaurant = None
                if not restaurant:
                    raise serializers.ValidationError(
                        {"restaurant": ["Selected restaurant was not found."]})
            else:
                restaurant = Restaurant.objects.filter(owner=user).first()
                if rid:
                    try:
                        rid_int = int(rid)
                    except (TypeError, ValueError):
                        raise serializers.ValidationError(
                            {"restaurant": ["Invalid restaurant ID format."]})
                    if not restaurant or restaurant.id != rid_int:
                        raise DRFPermissionDenied(
                            "You can only manage dishes for your own restaurant.")

        if not restaurant and not (request and request.user.is_staff):
            raise serializers.ValidationError({"restaurant": ["No restaurant associated with this authenticated account."]})

        # Category validation
        cat_id = self.initial_data.get('category') or attrs.get('category')
        if not cat_id and not self.instance:
            raise serializers.ValidationError({"category": ["Menu category is required."]})

        if cat_id:
            try:
                cat_id_int = int(cat_id)
            except (ValueError, TypeError):
                raise serializers.ValidationError({"category": ["Invalid category ID format."]})

            menu_cat = MenuCategory.objects.filter(id=cat_id_int).first()
            if not menu_cat:
                raise serializers.ValidationError({"category": ["Selected menu category was not found."]})

            # "Category must belong to the same restaurant"
            if restaurant and menu_cat.restaurant_id != restaurant.id and not (request and request.user.is_staff):
                raise serializers.ValidationError({"category": ["Category must belong to the same restaurant."]})

            attrs['menu_category'] = menu_cat

        # Dietary type synchronization
        dietary_type = attrs.get('dietary_type')
        if dietary_type:
            dt_upper = str(dietary_type).upper()
            if dt_upper not in ['VEG', 'NON_VEG', 'OTHER']:
                raise serializers.ValidationError({"dietary_type": ["Must be 'VEG', 'NON_VEG', or 'OTHER'."]})
            attrs['dietary_type'] = dt_upper
            attrs['is_veg'] = (dt_upper == 'VEG')
        elif 'is_veg' in attrs:
            attrs['dietary_type'] = 'VEG' if attrs['is_veg'] else 'NON_VEG'

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        # save(restaurant=...) kwarg (admin-specified target) wins; fall back
        # to context, then to the owner's own restaurant.
        restaurant = validated_data.get('restaurant') or self.context.get('restaurant')
        if not restaurant and request and request.user.is_authenticated:
            restaurant = Restaurant.objects.filter(owner=request.user).first()

        validated_data['restaurant'] = restaurant
        validated_data.pop('category', None)
        remove_image = validated_data.pop('remove_image', False)
        food_image = validated_data.pop('food_image', None)
        desc = validated_data.pop('description', None)

        if desc is not None:
            validated_data['full_description'] = desc
            validated_data['short_description'] = desc[:255]

        food = FoodItem.objects.create(**validated_data)

        if food_image:
            food.food_image = food_image
            try:
                food.image = food_image.url
            except Exception:
                pass
            food.save(update_fields=['food_image', 'image'])

        return food

    def update(self, instance, validated_data):
        validated_data.pop('category', None)
        remove_image = validated_data.pop('remove_image', False)
        food_image = validated_data.pop('food_image', None)
        desc = validated_data.pop('description', None)

        if desc is not None:
            instance.full_description = desc
            instance.short_description = desc[:255]

        if remove_image:
            if instance.food_image:
                try:
                    instance.food_image.delete(save=False)
                except Exception:
                    pass
                instance.food_image = None
            instance.image = ''
        elif food_image:
            instance.food_image = food_image
            try:
                instance.image = food_image.url
            except Exception:
                pass

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
