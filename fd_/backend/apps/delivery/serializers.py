from rest_framework import serializers
from .models import (
    DeliveryPartner, 
    DeliveryAssignment, 
    DeliveryAssignmentHistory,
    DeliveryOffer,
    DeliveryOTP,
    DeliveryIssueReport
)
from apps.orders.serializers import OrderSerializer, OrderItemSerializer


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    phone = serializers.ReadOnlyField(source='user.phone')
    avatar = serializers.ReadOnlyField(source='user.avatar')
    active_order_details = OrderSerializer(source='active_order', read_only=True)

    class Meta:
        model = DeliveryPartner
        fields = '__all__'


class DeliveryJobSerializer(serializers.ModelSerializer):
    """
    Masked serializer for job discovery before acceptance.
    Customer phone and complete street address are concealed for privacy.
    """
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    restaurant_name = serializers.SerializerMethodField()
    restaurant_address = serializers.SerializerMethodField()
    delivery_area = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    items_summary = serializers.SerializerMethodField()
    delivery_fee = serializers.DecimalField(source='order.delivery_fee', max_digits=8, decimal_places=2, read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'order_id', 'order_number', 'restaurant_name',
            'restaurant_address', 'delivery_area', 'items_count',
            'items_summary', 'delivery_fee', 'status', 'order_status',
            'created_at'
        ]

    def get_restaurant_name(self, obj):
        if obj.order.restaurant:
            return obj.order.restaurant.name
        return "Partner Restaurant"

    def get_restaurant_address(self, obj):
        if obj.order.restaurant:
            return obj.order.restaurant.address
        return ""

    def get_delivery_area(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        area = snapshot.get('area_sector_locality') or snapshot.get('city')
        if area:
            return area
        if obj.order.delivery_address_text:
            return obj.order.delivery_address_text.split(',')[0].strip()
        return "Local Delivery Area"

    def get_items_count(self, obj):
        return obj.order.items.count()

    def get_items_summary(self, obj):
        summary = []
        for item in obj.order.items.all():
            name = item.food_name_snapshot or (item.food_item.name if item.food_item else "Food Item")
            summary.append(f"{item.quantity}x {name}")
        return summary


class DeliveryTaskDetailSerializer(serializers.ModelSerializer):
    """
    Full task details unlocked only for the assigned delivery partner.
    Reveals restaurant contacts, customer drop address snapshot, and special instructions.
    """
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    task_status = serializers.CharField(source='status', read_only=True)

    # Restaurant / Pickup details
    restaurant_name = serializers.SerializerMethodField()
    restaurant_address = serializers.SerializerMethodField()
    restaurant_phone = serializers.SerializerMethodField()

    # Customer / Delivery details
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()
    delivery_address_snapshot = serializers.JSONField(source='order.delivery_address_snapshot', read_only=True)
    cooking_instructions = serializers.CharField(source='order.cooking_instructions', read_only=True)

    # Financial & Item details
    items_count = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(source='order.subtotal', max_digits=10, decimal_places=2, read_only=True)
    delivery_fee = serializers.DecimalField(source='order.delivery_fee', max_digits=8, decimal_places=2, read_only=True)
    packaging_fee = serializers.DecimalField(source='order.packaging_fee', max_digits=8, decimal_places=2, read_only=True)
    total = serializers.SerializerMethodField()
    payment_method = serializers.CharField(source='order.payment_method', read_only=True)
    payment_status = serializers.CharField(source='order.payment_status', read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'order_id', 'order_number', 'status', 'task_status', 'order_status',
            'restaurant_name', 'restaurant_address', 'restaurant_phone',
            'customer_name', 'customer_phone', 'customer_address', 'delivery_address_snapshot',
            'cooking_instructions', 'items_count', 'items', 'subtotal', 'delivery_fee',
            'packaging_fee', 'total', 'payment_method', 'payment_status',
            'pickup_photo', 'delivery_photo', 'pickup_verification_method', 'delivery_verification_method', 'photo_verification_status',
            'assigned_at', 'accepted_at', 'reached_restaurant_at', 'picked_up_at',
            'delivered_at', 'cancellation_reason', 'issue_notes', 'created_at', 'updated_at'
        ]

    def get_restaurant_name(self, obj):
        if obj.order.restaurant:
            return obj.order.restaurant.name
        return "Partner Restaurant"

    def get_restaurant_address(self, obj):
        if obj.order.restaurant:
            return obj.order.restaurant.address
        return ""

    def get_restaurant_phone(self, obj):
        if obj.order.restaurant:
            phone = getattr(obj.order.restaurant, 'phone', None)
            if phone:
                return phone
            if obj.order.restaurant.owner:
                return getattr(obj.order.restaurant.owner, 'phone', '')
        return ""

    def get_customer_name(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        if snapshot.get('full_name'):
            return snapshot.get('full_name')
        if obj.order.customer:
            return obj.order.customer.get_full_name() or obj.order.customer.username
        return "Customer"

    def get_customer_phone(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        if snapshot.get('phone'):
            return snapshot.get('phone')
        if obj.order.customer:
            return obj.order.customer.phone
        return ""

    def get_customer_address(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        if snapshot.get('formatted_address'):
            return snapshot.get('formatted_address')
        return obj.order.delivery_address_text

    def get_items_count(self, obj):
        return obj.order.items.count()

    def get_items(self, obj):
        items_data = []
        for item in obj.order.items.all():
            items_data.append({
                'id': item.id,
                'name': item.food_name_snapshot or (item.food_item.name if item.food_item else 'Item'),
                'quantity': item.quantity,
                'price': float(item.unit_price_snapshot or item.price),
                'item_total': float(item.item_total),
                'customization_snapshot': item.customization_snapshot,
                'selected_addons': item.selected_addons
            })
        return items_data

    def get_total(self, obj):
        return float(obj.order.total or obj.order.grand_total)


class DeliveryAssignmentHistorySerializer(serializers.ModelSerializer):
    actor_username = serializers.ReadOnlyField(source='actor.username')

    class Meta:
        model = DeliveryAssignmentHistory
        fields = [
            'id', 'assignment', 'from_status', 'to_status',
            'actor', 'actor_username', 'notes', 'created_at'
        ]


class DeliveryIssueReportSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)

    class Meta:
        model = DeliveryIssueReport
        fields = [
            'id', 'assignment', 'order', 'order_number', 'reporter',
            'reporter_name', 'category', 'category_display',
            'description', 'created_at', 'resolved', 'resolution_notes'
        ]
        read_only_fields = ['id', 'reporter', 'created_at']


class DeliveryHistorySerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    restaurant_name = serializers.SerializerMethodField()
    restaurant_address = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()
    delivery_area = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    delivery_fee = serializers.DecimalField(source='order.delivery_fee', max_digits=8, decimal_places=2, read_only=True)
    total = serializers.SerializerMethodField()
    pickup_timestamp = serializers.DateTimeField(source='picked_up_at', read_only=True)
    delivery_timestamp = serializers.DateTimeField(source='delivered_at', read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'order_id', 'order_number', 'status',
            'restaurant_name', 'restaurant_address',
            'customer_name', 'customer_address', 'delivery_area',
            'items_count', 'delivery_fee', 'total',
            'pickup_timestamp', 'delivery_timestamp', 'delivered_at',
            'created_at'
        ]

    def get_restaurant_name(self, obj):
        return obj.order.restaurant.name if obj.order.restaurant else "Restaurant"

    def get_restaurant_address(self, obj):
        return obj.order.restaurant.address if obj.order.restaurant else ""

    def get_customer_name(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        return snapshot.get('full_name') or obj.order.customer.username

    def get_customer_address(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        return snapshot.get('formatted_address') or obj.order.delivery_address_text

    def get_delivery_area(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        return snapshot.get('area_sector_locality') or snapshot.get('city') or "Local Delivery Area"

    def get_items_count(self, obj):
        return obj.order.items.count()

    def get_total(self, obj):
        return float(obj.order.total or obj.order.grand_total)


class DeliveryOfferSerializer(serializers.ModelSerializer):
    """
    Phase 23: Masked serializer for candidate delivery partner receiving a job offer.
    Hides private customer details (phone, full street name) until accepted.
    Includes live countdown seconds remaining.
    """
    order_id = serializers.IntegerField(source='assignment.order.id', read_only=True)
    order_number = serializers.CharField(source='assignment.order.order_number', read_only=True)
    order_type = serializers.CharField(default='Single Food Delivery')
    restaurant_name = serializers.SerializerMethodField()
    restaurant_address = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_area = serializers.SerializerMethodField()
    pickup_distance_km = serializers.DecimalField(source='distance_km', max_digits=6, decimal_places=2, read_only=True)
    drop_distance_km = serializers.SerializerMethodField()
    total_distance_km = serializers.SerializerMethodField()
    estimated_earnings = serializers.DecimalField(source='estimated_payout', max_digits=10, decimal_places=2, read_only=True)
    estimated_time_mins = serializers.SerializerMethodField()
    expiry_seconds = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryOffer
        fields = [
            'id', 'order_id', 'order_number', 'order_type',
            'restaurant_name', 'restaurant_address', 'customer_name', 'customer_area',
            'pickup_distance_km', 'drop_distance_km', 'total_distance_km',
            'estimated_earnings', 'estimated_time_mins', 'expiry_seconds',
            'items_count', 'items', 'status', 'attempt_number',
            'matching_score', 'expires_at', 'is_expired', 'created_at'
        ]

    def get_restaurant_name(self, obj):
        order = obj.assignment.order
        return order.restaurant.name if order.restaurant else "Partner Merchant"

    def get_restaurant_address(self, obj):
        order = obj.assignment.order
        return order.restaurant.address if order.restaurant else ""

    def get_customer_name(self, obj):
        order = obj.assignment.order
        if order.customer:
            return order.customer.get_short_name() or order.customer.username
        return "Customer"

    def get_customer_area(self, obj):
        order = obj.assignment.order
        snapshot = order.delivery_address_snapshot or {}
        return snapshot.get('area_sector_locality') or snapshot.get('city') or "Local Delivery Area"

    def get_drop_distance_km(self, obj):
        return 3.8

    def get_total_distance_km(self, obj):
        pickup = float(obj.distance_km or 1.4)
        return round(pickup + 3.8, 1)

    def get_estimated_time_mins(self, obj):
        total_dist = self.get_total_distance_km(obj)
        return max(15, int(total_dist * 4 + 8))

    def get_expiry_seconds(self, obj):
        from django.utils import timezone
        diff = (obj.expires_at - timezone.now()).total_seconds()
        return max(0, int(diff))

    def get_items_count(self, obj):
        return obj.assignment.order.items.count()

    def get_items(self, obj):
        return [
            {
                'name': it.food_name_snapshot or (it.food_item.name if it.food_item else 'Item'),
                'quantity': it.quantity
            }
            for it in obj.assignment.order.items.all()
        ]

    def get_is_expired(self, obj):
        return obj.is_expired()


class DeliveryOfferDetailSerializer(serializers.ModelSerializer):
    """
    Detailed offer representation for Admin attempt history inspection.
    """
    partner_id = serializers.IntegerField(source='delivery_partner.id', read_only=True)
    partner_username = serializers.CharField(source='delivery_partner.username', read_only=True)
    partner_full_name = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryOffer
        fields = [
            'id', 'partner_id', 'partner_username', 'partner_full_name',
            'status', 'attempt_number', 'distance_km', 'matching_score',
            'estimated_payout', 'offered_at', 'expires_at', 'responded_at',
            'rejection_reason'
        ]

    def get_partner_full_name(self, obj):
        return obj.delivery_partner.get_full_name() or obj.delivery_partner.username


class AdminDispatchAssignmentSerializer(serializers.ModelSerializer):
    """
    Admin Live Dispatch monitor serializer.
    Includes order metadata, assignment status, attempt history, and timing.
    """
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    payment_status = serializers.CharField(source='order.payment_status', read_only=True)
    restaurant_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    delivery_area = serializers.SerializerMethodField()
    assigned_partner_id = serializers.SerializerMethodField()
    assigned_partner_name = serializers.SerializerMethodField()
    active_offer = serializers.SerializerMethodField()
    attempts_history = DeliveryOfferDetailSerializer(source='offers', many=True, read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'order_id', 'order_number', 'order_status', 'payment_status',
            'status', 'restaurant_name', 'customer_name', 'delivery_area',
            'assigned_partner_id', 'assigned_partner_name',
            'attempt_count', 'max_retries', 'offer_expires_at',
            'assigned_at', 'accepted_at', 'picked_up_at', 'delivered_at',
            'active_offer', 'attempts_history', 'created_at', 'updated_at'
        ]

    def get_restaurant_name(self, obj):
        return obj.order.restaurant.name if obj.order.restaurant else "Restaurant"

    def get_customer_name(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        return snapshot.get('full_name') or (obj.order.customer.get_full_name() if obj.order.customer else "Customer")

    def get_delivery_area(self, obj):
        snapshot = obj.order.delivery_address_snapshot or {}
        return snapshot.get('area_sector_locality') or snapshot.get('city') or "Local Delivery Area"

    def get_assigned_partner_id(self, obj):
        return obj.delivery_partner_id if obj.delivery_partner else None

    def get_assigned_partner_name(self, obj):
        if obj.delivery_partner:
            return obj.delivery_partner.get_full_name() or obj.delivery_partner.username
        return None

    def get_active_offer(self, obj):
        offer = obj.offers.filter(status='OFFERED').first()
        if offer:
            return DeliveryOfferSerializer(offer).data
        return None


