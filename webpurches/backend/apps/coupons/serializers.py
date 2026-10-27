from decimal import Decimal
from rest_framework import serializers
from .models import Coupon, CouponRedemption, LoyaltyProgramConfig, LoyaltyLedgerEntry
from apps.accounts.models import LoyaltyProfile


class CouponSerializer(serializers.ModelSerializer):
    formatted_discount = serializers.SerializerMethodField()
    is_valid_now = serializers.SerializerMethodField()
    restaurant_count = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'title', 'description', 'discount_type',
            'discount_percentage', 'discount_amount', 'max_discount_amount',
            'min_order_value', 'start_date', 'expiry_date',
            'max_uses', 'max_uses_per_user', 'current_uses',
            'first_order_only', 'is_combinable', 'terms_and_conditions',
            'is_active', 'created_at', 'formatted_discount',
            'is_valid_now', 'restaurant_count'
        ]

    def get_formatted_discount(self, obj):
        if obj.discount_type == 'PERCENTAGE':
            return f"{obj.discount_percentage}% OFF (Max ₹{obj.max_discount_amount:.0f})"
        return f"₹{obj.discount_amount:.0f} FLAT OFF"

    def get_is_valid_now(self, obj):
        return obj.is_currently_valid()

    def get_restaurant_count(self, obj):
        return obj.applicable_restaurants.count()


class CouponValidateInputSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50, trim_whitespace=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0.00'))
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0.00'))
    restaurant_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        # Allow amount as alias for subtotal
        if 'amount' in data and ('subtotal' not in data or data['subtotal'] == 0):
            data['subtotal'] = data['amount']
        return data


class OrderTotalsPreviewInputSerializer(serializers.Serializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=Decimal('30.00'))
    packaging_fee = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=Decimal('15.00'))
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    points_to_redeem = serializers.IntegerField(required=False, default=0, min_value=0)
    restaurant_id = serializers.IntegerField(required=False, allow_null=True)


class LoyaltyLedgerEntrySerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True, default=None)

    class Meta:
        model = LoyaltyLedgerEntry
        fields = [
            'id', 'transaction_type', 'points', 'balance_after',
            'reference_amount', 'description', 'idempotency_key',
            'order_number', 'created_at'
        ]


class LoyaltyProfileDetailSerializer(serializers.ModelSerializer):
    points = serializers.IntegerField()
    tier = serializers.CharField()
    lifetime_orders = serializers.IntegerField()
    total_saved = serializers.DecimalField(max_digits=10, decimal_places=2)
    points_to_inr_rate = serializers.SerializerMethodField()
    min_points_to_redeem = serializers.SerializerMethodField()
    earn_rate_description = serializers.SerializerMethodField()
    inr_value = serializers.SerializerMethodField()

    class Meta:
        model = LoyaltyProfile
        fields = [
            'points', 'tier', 'lifetime_orders', 'total_saved',
            'points_to_inr_rate', 'min_points_to_redeem',
            'earn_rate_description', 'inr_value'
        ]

    def get_points_to_inr_rate(self, obj):
        config = LoyaltyProgramConfig.get_solo()
        return float(config.points_to_inr_rate)

    def get_min_points_to_redeem(self, obj):
        config = LoyaltyProgramConfig.get_solo()
        return config.min_points_to_redeem

    def get_earn_rate_description(self, obj):
        config = LoyaltyProgramConfig.get_solo()
        return f"Earn {config.points_earn_rate:.0f} point for every ₹{config.earn_per_amount:.0f} spent"

    def get_inr_value(self, obj):
        config = LoyaltyProgramConfig.get_solo()
        return float(round(Decimal(str(obj.points)) * config.points_to_inr_rate, 2))


class AdminCouponCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'

    def validate(self, data):
        discount_type = data.get('discount_type', getattr(self.instance, 'discount_type', 'PERCENTAGE'))
        if discount_type == 'PERCENTAGE':
            pct = data.get('discount_percentage', getattr(self.instance, 'discount_percentage', 20))
            if pct <= 0 or pct > 100:
                raise serializers.ValidationError({'discount_percentage': 'Percentage must be between 1 and 100.'})
        elif discount_type == 'FLAT':
            amt = data.get('discount_amount', getattr(self.instance, 'discount_amount', Decimal('0.00')))
            if amt <= 0:
                raise serializers.ValidationError({'discount_amount': 'Flat discount amount must be greater than zero.'})

        start = data.get('start_date', getattr(self.instance, 'start_date', None))
        expiry = data.get('expiry_date', getattr(self.instance, 'expiry_date', None))
        if start and expiry and expiry <= start:
            raise serializers.ValidationError({'expiry_date': 'Expiry date must be after the start date.'})

        return data


class LoyaltyProgramConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyProgramConfig
        fields = '__all__'

    def validate_points_to_inr_rate(self, value):
        if value <= 0 or value > 10:
            raise serializers.ValidationError("Points to INR rate must be between ₹0.01 and ₹10.00 per point.")
        return value

    def validate_earn_per_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Earn per amount must be greater than ₹0.")
        return value
