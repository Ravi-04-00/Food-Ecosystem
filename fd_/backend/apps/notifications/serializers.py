from rest_framework import serializers
from .models import Notification, NotificationPreference, NotificationDeliveryAttempt


class NotificationDeliveryAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationDeliveryAttempt
        fields = [
            'id',
            'channel',
            'status',
            'recipient_destination',
            'attempt_count',
            'provider',
            'created_at'
        ]
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    delivery_attempts = NotificationDeliveryAttemptSerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'event_type',
            'related_resource_type',
            'related_resource_id',
            'data',
            'is_read',
            'is_dismissed',
            'created_at',
            'delivery_attempts'
        ]
        read_only_fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'event_type',
            'related_resource_type',
            'related_resource_id',
            'data',
            'created_at',
            'delivery_attempts'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'in_app_enabled',
            'email_enabled',
            'sms_enabled',
            'push_enabled',
            'order_updates',
            'payment_updates',
            'promotional_updates',
            'language',
            'updated_at'
        ]
        read_only_fields = ['updated_at']

    def validate_language(self, value):
        val = str(value).lower().strip()
        if val not in ['en', 'ta']:
            raise serializers.ValidationError("Supported notification languages are 'en' (English) and 'ta' (Tamil).")
        return val
