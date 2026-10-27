import html
from rest_framework import serializers
from apps.accounts.models import User
from apps.orders.models import Order
from apps.products.models import Product, Restaurant
from .models import Review, ReviewReport, ReviewModerationLog
from .services import mask_reviewer_name

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    order_number = serializers.CharField(source='order.order_number', read_only=True, default='')
    product_name = serializers.CharField(source='product.name', read_only=True, default='')
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True, default='')
    delivery_partner_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'order', 'order_number',
            'target_type', 'product', 'product_name',
            'restaurant', 'restaurant_name',
            'delivery_partner', 'delivery_partner_name',
            'rating', 'food_quality_rating', 'packaging_rating', 'delivery_rating',
            'comment', 'language', 'is_verified_purchase',
            'moderation_status', 'moderation_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'user_name', 'is_verified_purchase',
            'moderation_status', 'moderation_reason',
            'created_at', 'updated_at'
        ]

    def get_user_name(self, obj):
        return mask_reviewer_name(obj.user)

    def get_delivery_partner_name(self, obj):
        if obj.delivery_partner:
            return obj.delivery_partner.get_full_name() or obj.delivery_partner.username
        return ''


class ReviewCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)
    target_type = serializers.ChoiceField(choices=Review.TARGET_CHOICES, required=True)
    product_id = serializers.IntegerField(required=False, allow_null=True)
    restaurant_id = serializers.IntegerField(required=False, allow_null=True)
    delivery_partner_id = serializers.IntegerField(required=False, allow_null=True)

    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    food_quality_rating = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
    packaging_rating = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
    delivery_rating = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)

    comment = serializers.CharField(max_length=1000, required=False, allow_blank=True, default='')
    language = serializers.CharField(max_length=8, required=False, default='en')

    def validate(self, attrs):
        user = self.context['request'].user
        
        # 1. Customer role verification
        if getattr(user, 'role', '') in ['RESTAURANT', 'SHOP', 'DELIVERY', 'RIDER']:
            raise serializers.ValidationError(
                "Restaurant and Delivery Partner accounts cannot submit customer reviews."
            )

        # 2. Order lookup & ownership
        order_id = attrs['order_id']
        try:
            order = Order.objects.prefetch_related('items__food_item').select_related('restaurant', 'rider').get(id=order_id)
        except Order.DoesNotExist:
            raise serializers.ValidationError({"order_id": "Specified order does not exist."})

        if order.customer_id != user.id:
            raise serializers.ValidationError({"order_id": "You can only review orders that you placed."})

        # 3. Completed order policy
        if order.status != 'DELIVERED':
            raise serializers.ValidationError({
                "order_id": f"Reviews are permitted only for completed orders (Status: DELIVERED). Current status is {order.status}."
            })

        target_type = attrs['target_type']

        # 4. Target type validations
        if target_type == 'FOOD_ITEM':
            product_id = attrs.get('product_id')
            if not product_id:
                raise serializers.ValidationError({"product_id": "product_id is required for food item review."})
            
            # Verify purchased item containment
            purchased_food_ids = list(order.items.exclude(food_item=None).values_list('food_item_id', flat=True))
            if product_id not in purchased_food_ids:
                raise serializers.ValidationError({
                    "product_id": f"Food item #{product_id} was not part of order #{order.order_number}."
                })

            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError({"product_id": "Food item not found."})

            # Duplicate check
            if Review.objects.filter(user=user, order=order, product=product, target_type='FOOD_ITEM').exists():
                raise serializers.ValidationError({
                    "non_field_errors": f"You have already reviewed '{product.name}' for order #{order.order_number}. Edit your existing review instead."
                })

            attrs['resolved_product'] = product
            attrs['resolved_restaurant'] = product.restaurant or order.restaurant
            attrs['resolved_rider'] = None

        elif target_type == 'RESTAURANT':
            if not order.restaurant:
                raise serializers.ValidationError({"target_type": "This order does not have an associated restaurant."})
            
            # Duplicate check
            if Review.objects.filter(user=user, order=order, target_type='RESTAURANT').exists():
                raise serializers.ValidationError({
                    "non_field_errors": f"You have already reviewed restaurant '{order.restaurant.name}' for order #{order.order_number}. Edit your existing review instead."
                })

            attrs['resolved_product'] = None
            attrs['resolved_restaurant'] = order.restaurant
            attrs['resolved_rider'] = None

        elif target_type == 'DELIVERY_PARTNER':
            if not order.rider:
                raise serializers.ValidationError({
                    "target_type": "This order does not have an assigned delivery partner to review."
                })

            # Duplicate check
            if Review.objects.filter(user=user, order=order, target_type='DELIVERY_PARTNER').exists():
                raise serializers.ValidationError({
                    "non_field_errors": f"You have already reviewed delivery partner for order #{order.order_number}. Edit your existing review instead."
                })

            attrs['resolved_product'] = None
            attrs['resolved_restaurant'] = order.restaurant
            attrs['resolved_rider'] = order.rider

        attrs['resolved_order'] = order
        # Sanitize comment for XSS protection
        raw_comment = attrs.get('comment', '').strip()
        attrs['comment'] = html.escape(raw_comment)

        return attrs


class ReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'rating', 'food_quality_rating', 'packaging_rating',
            'delivery_rating', 'comment', 'language'
        ]

    def validate_comment(self, value):
        return html.escape(value.strip() if value else '')


class ReviewReportSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.SerializerMethodField()
    review = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ReviewReport
        fields = [
            'id', 'review', 'reported_by', 'reported_by_name',
            'reason', 'explanation', 'status', 'admin_notes',
            'resolved_by', 'resolved_at', 'created_at'
        ]
        read_only_fields = [
            'review', 'reported_by', 'reported_by_name', 'status',
            'admin_notes', 'resolved_by', 'resolved_at', 'created_at'
        ]

    def get_reported_by_name(self, obj):
        return mask_reviewer_name(obj.reported_by)

    def validate(self, attrs):
        user = self.context['request'].user
        review = self.context.get('review')
        if review and ReviewReport.objects.filter(review=review, reported_by=user).exists():
            raise serializers.ValidationError("You have already reported this review.")
        return attrs


class ReviewModerationActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'HIDE', 'FLAG'], required=True)
    reason = serializers.CharField(max_length=500, required=True, allow_blank=False)


class ReportResolutionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['RESOLVE_AND_HIDE', 'DISMISS'], required=True)
    admin_notes = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')
