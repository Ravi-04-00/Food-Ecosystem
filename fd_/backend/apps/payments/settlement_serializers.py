from decimal import Decimal
from rest_framework import serializers
from apps.payments.models import (
    RestaurantCommission,
    RestaurantSettlement,
    SettlementAdjustment
)
from apps.products.models import Restaurant


class RestaurantCommissionSerializer(serializers.ModelSerializer):
    order_delivered_at = serializers.DateTimeField(source='order.updated_at', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantCommission
        fields = [
            'id', 'order_number', 'calculation_base', 'packaging_fee',
            'rate_percentage', 'fixed_fee', 'commission_amount', 'tax_on_commission',
            'net_restaurant_amount', 'refund_deduction', 'status', 'created_at',
            'order_delivered_at', 'customer_name'
        ]

    def get_customer_name(self, obj):
        # Mask customer name for privacy
        if obj.order and obj.order.customer:
            name = obj.order.customer.get_full_name() or obj.order.customer.username
            return f"{name[:2]}***" if len(name) > 2 else "C***"
        return "Customer"


class SettlementAdjustmentSerializer(serializers.ModelSerializer):
    authorized_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SettlementAdjustment
        fields = [
            'id', 'adjustment_type', 'amount', 'reason',
            'authorized_by_name', 'created_at'
        ]

    def get_authorized_by_name(self, obj):
        if obj.authorized_by:
            return obj.authorized_by.get_full_name() or obj.authorized_by.username
        return "System"


class RestaurantSettlementListSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = RestaurantSettlement
        fields = [
            'id', 'settlement_reference', 'restaurant_id', 'restaurant_name',
            'period_start', 'period_end', 'currency', 'order_count',
            'gross_sales_amount', 'total_packaging_fees', 'total_commission_deducted',
            'total_adjustments', 'net_payout_amount', 'status', 'payout_provider',
            'provider_reference', 'provider_utr', 'payout_completed_at', 'created_at'
        ]


class RestaurantSettlementDetailSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    commission_entries = RestaurantCommissionSerializer(many=True, read_only=True)
    adjustments = SettlementAdjustmentSerializer(many=True, read_only=True)

    class Meta:
        model = RestaurantSettlement
        fields = [
            'id', 'settlement_reference', 'restaurant_id', 'restaurant_name',
            'period_start', 'period_end', 'currency', 'order_count',
            'gross_sales_amount', 'total_packaging_fees', 'total_commission_deducted',
            'total_adjustments', 'net_payout_amount', 'status', 'payout_provider',
            'provider_reference', 'provider_utr', 'failure_reason', 'notes',
            'created_by_name', 'approved_by_name', 'verified_by_name',
            'payout_initiated_at', 'payout_completed_at', 'created_at', 'updated_at',
            'commission_entries', 'adjustments'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "System"

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return obj.verified_by.get_full_name() or obj.verified_by.username
        return None


class SettlementCreateBatchInputSerializer(serializers.Serializer):
    restaurant_id = serializers.IntegerField(required=True)
    period_start = serializers.DateField(required=True)
    period_end = serializers.DateField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class SettlementStatusTransitionInputSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['PROCESSING', 'PAID', 'FAILED', 'REVERSED', 'PENDING'], required=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')
    provider_reference = serializers.CharField(required=False, allow_blank=True, default='')
    provider_utr = serializers.CharField(required=False, allow_blank=True, default='')


class SettlementAdjustmentInputSerializer(serializers.Serializer):
    adjustment_type = serializers.ChoiceField(
        choices=['DISPUTE_DEDUCTION', 'PROMOTION_CREDIT', 'TAX_CORRECTION', 'MANUAL_CORRECTION'],
        default='MANUAL_CORRECTION'
    )
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    reason = serializers.CharField(required=True, min_length=5)


class CommissionRulesUpdateSerializer(serializers.Serializer):
    platform_commission_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal('0.00'),
        max_value=Decimal('50.00'),
        required=False
    )
    platform_commission_fixed_fee = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=Decimal('0.00'),
        required=False
    )
    reason = serializers.CharField(required=True, min_length=5)
