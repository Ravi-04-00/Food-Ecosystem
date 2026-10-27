from rest_framework import serializers
from .models import Payment, Transaction, PaymentWebhook


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.customer.get_full_name', read_only=True)
    payment_status = serializers.CharField(source='status', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'order_id',
            'order_number',
            'customer_name',
            'payment_provider',
            'provider_order_id',
            'provider_payment_id',
            'amount',
            'amount_minor_units',
            'currency',
            'status',
            'payment_status',
            'payment_method',
            'failure_code',
            'failure_description',
            'refund_amount',
            'refund_reason',
            'refunded_at',
            'created_at',
            'updated_at',
            'verified_at',
        ]
        read_only_fields = [
            'id',
            'order_number',
            'customer_name',
            'payment_provider',
            'provider_order_id',
            'provider_payment_id',
            'amount',
            'amount_minor_units',
            'currency',
            'status',
            'payment_status',
            'refund_amount',
            'refund_reason',
            'refunded_at',
            'created_at',
            'updated_at',
            'verified_at',
        ]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id',
            'transaction_id',
            'transaction_type',
            'amount',
            'is_success',
            'timestamp',
        ]


class PaymentInitializeInputSerializer(serializers.Serializer):
    order_id = serializers.CharField(required=True)
    payment_method = serializers.CharField(required=False, default='UPI')


class PaymentVerifyInputSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)


class PaymentFailureInputSerializer(serializers.Serializer):
    provider_order_id = serializers.CharField(required=True)
    provider_payment_id = serializers.CharField(required=False, allow_blank=True, default='')
    error_code = serializers.CharField(required=False, allow_blank=True, default='')
    error_description = serializers.CharField(required=False, allow_blank=True, default='')
    reason = serializers.CharField(required=False, allow_blank=True, default='')
