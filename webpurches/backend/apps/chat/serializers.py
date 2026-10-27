from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'content', 'attachment', 'is_read', 'timestamp']
        read_only_fields = ['sender', 'is_read']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source='customer.username')
    seller_name = serializers.ReadOnlyField(source='seller.username')
    order_number = serializers.ReadOnlyField(source='order.order_number')

    class Meta:
        model = Conversation
        fields = ['id', 'customer', 'customer_name', 'seller', 'seller_name',
                  'order', 'order_number', 'messages', 'created_at', 'updated_at']
