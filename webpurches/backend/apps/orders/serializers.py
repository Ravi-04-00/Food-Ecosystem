from decimal import Decimal
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory
from apps.products.serializers import FoodItemSerializer

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.username')
    actor_email = serializers.ReadOnlyField(source='actor.email')

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'order', 'from_status', 'to_status',
            'actor', 'actor_name', 'actor_email', 'actor_role',
            'reason', 'created_at'
        ]
        read_only_fields = ['id', 'order', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    food_name = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()
    dietary_type = serializers.SerializerMethodField()
    food_item_id = serializers.IntegerField(source='food_item.id', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'food_item', 'food_item_id', 'food_name', 'food_name_snapshot',
            'food_image', 'dietary_type', 'quantity', 'unit_price_snapshot',
            'price', 'customization_snapshot', 'selected_addons', 'item_total'
        ]
        read_only_fields = ['id', 'food_item', 'food_name', 'food_image', 'dietary_type', 'item_total']

    def get_food_name(self, obj):
        if obj.food_name_snapshot:
            return obj.food_name_snapshot
        if obj.food_item:
            return obj.food_item.name
        return "Food Item"

    def get_food_image(self, obj):
        if obj.food_item and obj.food_item.image:
            try:
                return obj.food_item.image.url
            except Exception:
                return str(obj.food_item.image)
        return None

    def get_dietary_type(self, obj):
        if obj.food_item:
            return getattr(obj.food_item, 'dietary_type', 'VEG')
        return 'VEG'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    customer_email = serializers.ReadOnlyField(source='customer.email')
    customer_name = serializers.ReadOnlyField(source='customer.username')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    restaurant_address = serializers.ReadOnlyField(source='restaurant.address')
    restaurant_is_open = serializers.SerializerMethodField()
    restaurant_logo = serializers.SerializerMethodField()
    rider_name = serializers.ReadOnlyField(source='rider.username')
    cancelled_by_name = serializers.ReadOnlyField(source='cancelled_by.username')
    order_status = serializers.ReadOnlyField(source='status')
    can_cancel = serializers.SerializerMethodField()
    allowed_transitions = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_email', 'customer_name', 'customer_phone',
            'restaurant', 'restaurant_name', 'restaurant_address', 'restaurant_logo', 'restaurant_is_open',
            'rider', 'rider_name',
            'shipping_address', 'delivery_address_text', 'delivery_address_snapshot',
            'status', 'order_status', 'can_cancel', 'allowed_transitions', 'item_count', 'otp', 'pickup_otp',
            'pickup_photo', 'delivery_photo', 'pickup_verification_method', 'delivery_verification_method', 'photo_verification_status',
            'pickup_verified_at', 'delivered_verified_at',
            'rejection_reason', 'cancellation_reason', 'cancelled_by', 'cancelled_by_name',
            'subtotal', 'item_total', 'delivery_fee', 'packaging_fee', 'platform_fee',
            'taxes', 'discount', 'coupon', 'coupon_code_snapshot', 'loyalty_points_used', 'loyalty_discount', 'total', 'grand_total',
            'payment_method', 'payment_status', 'cooking_instructions',
            'customer_lat', 'customer_lng', 'restaurant_lat', 'restaurant_lng',
            'rider_lat', 'rider_lng', 'eta_minutes', 'items', 'status_history', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'customer', 'status', 'order_status',
            'can_cancel', 'allowed_transitions', 'item_count', 'otp', 'pickup_otp',
            'pickup_photo', 'delivery_photo', 'pickup_verification_method', 'delivery_verification_method',
            'photo_verification_status', 'pickup_verified_at', 'delivered_verified_at',
            'rejection_reason', 'cancellation_reason', 'cancelled_by', 'created_at', 'updated_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if user and user.is_authenticated:
            is_admin = user.is_staff or getattr(user, 'role', '') == 'ADMIN'
            is_customer = (instance.customer_id == user.id)
            is_restaurant = bool(instance.restaurant and instance.restaurant.owner_id == user.id) or getattr(user, 'role', '') in ['RESTAURANT', 'SHOP']

            if not is_admin:
                if is_restaurant:
                    # Restaurant sees pickup handover code, never customer delivery OTP
                    data['otp'] = None
                elif is_customer:
                    # Customer sees delivery OTP, never restaurant pickup code
                    data['pickup_otp'] = None
                else:
                    # Delivery partner or other users must not see codes ahead of handover
                    data['otp'] = None
                    data['pickup_otp'] = None
        else:
            data['otp'] = None
            data['pickup_otp'] = None

        return data

    def get_restaurant_logo(self, obj):
        if obj.restaurant:
            logo = getattr(obj.restaurant, 'restaurant_logo', None) or getattr(obj.restaurant, 'avatar', None)
            if logo:
                try:
                    return logo.url
                except Exception:
                    return str(logo)
        return None

    def get_restaurant_is_open(self, obj):
        if obj.restaurant:
            if hasattr(obj.restaurant, 'is_currently_open'):
                is_open_ok, _ = obj.restaurant.is_currently_open()
                return is_open_ok
            return getattr(obj.restaurant, 'is_open', True)
        return True

    def get_can_cancel(self, obj):
        return obj.status == 'PLACED'

    def get_allowed_transitions(self, obj):
        transitions = {
            'PLACED': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY_FOR_PICKUP', 'CANCELLED'],
        }
        return transitions.get(obj.status, [])

    def get_item_count(self, obj):
        # Calculate from prefetched or queried items
        return sum(item.quantity for item in obj.items.all())


class OrderCheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=False, allow_null=True)
    payment_method = serializers.CharField(required=False, default="UPI (Instant)")
    cooking_instructions = serializers.CharField(required=False, allow_blank=True, default="")


class OrderRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, max_length=500, allow_blank=False)
    explanation = serializers.CharField(required=False, allow_blank=True, default="")

