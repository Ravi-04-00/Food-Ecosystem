from decimal import Decimal
from django.db.models import Sum
from rest_framework import serializers

from apps.accounts.models import User, Profile, Address, AuditLog
from apps.products.models import Restaurant, FoodItem
from apps.delivery.models import DeliveryPartner, DeliveryIssueReport
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment
from .models import PlatformConfig


# ---------------------------------------------------------------------------
# 1. Customer Serializers
# ---------------------------------------------------------------------------

class AdminCustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'first_name', 'last_name',
            'full_name', 'is_active', 'created_at', 'order_count',
            'total_spent', 'last_login'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        name = obj.get_full_name().strip()
        if name:
            return name
        profile = getattr(obj, 'profile', None)
        return (profile.full_name if profile else '') or obj.username

    def get_order_count(self, obj):
        return getattr(obj, '_order_count', obj.food_orders.count())

    def get_total_spent(self, obj):
        spent = getattr(obj, '_total_spent', None)
        if spent is not None:
            return float(spent)
        res = obj.food_orders.filter(status='DELIVERED').aggregate(s=Sum('grand_total'))['s']
        return float(res or 0.0)


class AdminCustomerDetailSerializer(AdminCustomerSerializer):
    addresses = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()

    class Meta(AdminCustomerSerializer.Meta):
        fields = AdminCustomerSerializer.Meta.fields + ['addresses', 'recent_orders']

    def get_addresses(self, obj):
        return list(obj.addresses.values(
            'id', 'label', 'full_name', 'street', 'city', 'state', 'pincode', 'phone', 'is_default'
        ))

    def get_recent_orders(self, obj):
        orders = obj.food_orders.all()[:10]
        return [
            {
                'id': o.id,
                'order_number': o.order_number,
                'restaurant_name': o.restaurant.name if o.restaurant else 'Restaurant Partner',
                'status': o.status,
                'payment_status': o.payment_status,
                'grand_total': float(o.grand_total or o.total or 0.0),
                'created_at': o.created_at.isoformat()
            }
            for o in orders
        ]


# ---------------------------------------------------------------------------
# 2. Restaurant Serializers
# ---------------------------------------------------------------------------

class AdminRestaurantSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'owner_id', 'owner_name', 'owner_email', 'owner_username',
            'address', 'rating', 'review_count', 'is_open', 'is_verified',
            'verification_status', 'total_orders', 'revenue_today', 'created_at'
        ]
        read_only_fields = fields


class AdminRestaurantDetailSerializer(AdminRestaurantSerializer):
    menu_summary = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()

    class Meta(AdminRestaurantSerializer.Meta):
        fields = AdminRestaurantSerializer.Meta.fields + [
            'cuisines', 'description', 'delivery_time_text', 'price_for_two',
            'menu_summary', 'recent_orders'
        ]

    def get_menu_summary(self, obj):
        total_items = obj.foods.count()
        veg_items = obj.foods.filter(is_veg=True).count()
        non_veg_items = obj.foods.filter(is_veg=False).count()
        return {
            'total_items': total_items,
            'veg_items': veg_items,
            'non_veg_items': non_veg_items
        }

    def get_recent_orders(self, obj):
        orders = obj.orders.all()[:10]
        return [
            {
                'id': o.id,
                'order_number': o.order_number,
                'customer_name': o.customer.get_full_name() or o.customer.username,
                'status': o.status,
                'payment_status': o.payment_status,
                'grand_total': float(o.grand_total or 0.0),
                'created_at': o.created_at.isoformat()
            }
            for o in orders
        ]


# ---------------------------------------------------------------------------
# 3. Delivery Partner Serializers
# ---------------------------------------------------------------------------

class AdminPartnerSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    active_order_id = serializers.SerializerMethodField()
    active_order_number = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryPartner
        fields = [
            'id', 'user_id', 'username', 'full_name', 'email', 'phone',
            'vehicle_type', 'vehicle_number', 'is_verified', 'verification_status',
            'is_online', 'rating', 'total_deliveries', 'active_order_id',
            'active_order_number', 'user_is_active', 'battery_percentage', 'created_at'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_active_order_id(self, obj):
        return obj.active_order.id if obj.active_order else None

    def get_active_order_number(self, obj):
        return obj.active_order.order_number if obj.active_order else None


class AdminPartnerDetailSerializer(AdminPartnerSerializer):
    reported_issues = serializers.SerializerMethodField()
    today_earnings = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta(AdminPartnerSerializer.Meta):
        fields = AdminPartnerSerializer.Meta.fields + [
            'driving_license', 'today_earnings', 'total_earnings', 'reported_issues'
        ]

    def get_reported_issues(self, obj):
        issues = DeliveryIssueReport.objects.filter(reporter=obj.user).order_by('-created_at')[:10]
        return [
            {
                'id': iss.id,
                'order_number': iss.order.order_number if iss.order else '',
                'category': iss.category,
                'category_display': iss.get_category_display(),
                'description': iss.description,
                'resolved': iss.resolved,
                'created_at': iss.created_at.isoformat()
            }
            for iss in issues
        ]


# ---------------------------------------------------------------------------
# 4. Order Serializers
# ---------------------------------------------------------------------------

class AdminOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', default='', read_only=True)
    rider_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_id', 'customer_name', 'customer_email',
            'restaurant_id', 'restaurant_name', 'rider_id', 'rider_name',
            'status', 'payment_status', 'grand_total', 'total', 'payment_method',
            'items_count', 'created_at'
        ]
        read_only_fields = fields

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username

    def get_rider_name(self, obj):
        if not obj.rider:
            return 'Unassigned'
        return obj.rider.get_full_name() or obj.rider.username

    def get_items_count(self, obj):
        return obj.items.count()


class AdminOrderDetailSerializer(AdminOrderSerializer):
    items = serializers.SerializerMethodField()
    status_history = serializers.SerializerMethodField()
    payment_record = serializers.SerializerMethodField()
    delay_history = serializers.SerializerMethodField()
    assignment = serializers.SerializerMethodField()

    class Meta(AdminOrderSerializer.Meta):
        fields = AdminOrderSerializer.Meta.fields + [
            'item_total', 'subtotal', 'delivery_fee', 'packaging_fee', 'taxes',
            'platform_fee', 'discount', 'delivery_address_text',
            'delivery_address_snapshot', 'cooking_instructions',
            'eta_minutes', 'items', 'status_history', 'payment_record',
            'delay_history', 'assignment'
        ]

    def get_items(self, obj):
        items = []
        for it in obj.items.all().select_related('food_item'):
            snap = it.customization_snapshot or {}
            if not isinstance(snap, dict):
                snap = {'value': snap}
            items.append({
                'id': it.id,
                'food_name': it.food_name_snapshot or (it.food_item.name if it.food_item else 'Food Item'),
                'quantity': it.quantity,
                'unit_price': float(it.unit_price_snapshot or 0),
                'item_total': float(it.item_total or 0),
                'customization_summary': snap,
                'customization_snapshot': snap,
                'selected_addons': it.selected_addons or [],
            })
        return items

    def get_status_history(self, obj):
        return [
            {
                'id': h.id,
                'from_status': h.from_status,
                'to_status': h.to_status,
                'actor_role': h.actor_role,
                'actor_name': (h.actor.get_full_name() or h.actor.username) if h.actor else 'System',
                'reason': h.reason,
                'created_at': h.created_at.isoformat()
            }
            for h in obj.status_history.all()
        ]

    def get_payment_record(self, obj):
        p = obj.payments.order_by('-created_at').first()
        if not p:
            return None
        return {
            'id': p.id,
            'provider': p.payment_provider,
            'provider_order_id': p.provider_order_id,
            'provider_payment_id': p.provider_payment_id,
            'amount': float(p.amount),
            'status': p.status,
            'payment_method': p.payment_method,
            'verified_at': p.verified_at.isoformat() if p.verified_at else None
        }

    def get_delay_history(self, obj):
        return [
            {
                'id': d.id,
                'delay_type': d.delay_type,
                'reason': d.reason,
                'notes': d.notes,
                'previous_eta': d.previous_eta,
                'new_eta': d.new_eta,
                'recorded_by': (d.recorded_by.username if d.recorded_by else 'System'),
                'created_at': d.created_at.isoformat() if d.created_at else None,
            }
            for d in obj.delay_records.all()
        ]

    def get_assignment(self, obj):
        assignment = getattr(obj, 'delivery_assignment', None)
        if assignment is None:
            try:
                from apps.delivery.models import DeliveryAssignment
                assignment = DeliveryAssignment.objects.filter(order=obj).first()
            except Exception:
                assignment = None
        if not assignment:
            return None
        partner = assignment.delivery_partner
        return {
            'id': assignment.id,
            'status': assignment.status,
            'partner_id': partner.id if partner else None,
            'partner_name': (partner.get_full_name() or partner.username) if partner else None,
            'picked_up_at': assignment.picked_up_at.isoformat() if assignment.picked_up_at else None,
            'delivered_at': assignment.delivered_at.isoformat() if assignment.delivered_at else None,
        }


# ---------------------------------------------------------------------------
# 5. Payment Serializers
# ---------------------------------------------------------------------------

class AdminPaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_email = serializers.EmailField(source='order.customer.email', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'order_id', 'order_number', 'customer_name', 'customer_email',
            'payment_provider', 'provider_order_id', 'provider_payment_id',
            'amount', 'currency', 'status', 'payment_method', 'failure_code',
            'failure_description', 'created_at', 'verified_at'
        ]
        read_only_fields = fields

    def get_customer_name(self, obj):
        if obj.order and obj.order.customer:
            return obj.order.customer.get_full_name() or obj.order.customer.username
        return ''


# ---------------------------------------------------------------------------
# 6. Audit Log Serializer
# ---------------------------------------------------------------------------

class AdminAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor_id', 'actor_name', 'actor_email', 'action',
            'target_model', 'target_id', 'details', 'ip_address', 'timestamp'
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return 'System Automated'

    def get_actor_email(self, obj):
        return obj.actor.email if obj.actor else ''


# ---------------------------------------------------------------------------
# 7. Platform Config Serializer
# ---------------------------------------------------------------------------

class PlatformConfigSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PlatformConfig
        fields = ['id', 'key', 'value', 'description', 'updated_by_name', 'updated_at']
        read_only_fields = ['id', 'updated_by_name', 'updated_at']

    def get_updated_by_name(self, obj):
        return (obj.updated_by.get_full_name() or obj.updated_by.username) if obj.updated_by else 'Initial Setup'
