from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.orders.models import Order
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


def _order_visible_to(order, user):
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
        return True
    if order.customer_id == user.id or order.rider_id == user.id:
        return True
    restaurant = getattr(order, 'restaurant', None)
    return bool(restaurant and restaurant.owner_id == user.id)


class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Conversation.objects.filter(Q(customer=user) | Q(seller=user))
        order_id = self.request.query_params.get('order')
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs.select_related('customer', 'seller', 'order').prefetch_related('messages')

    def perform_create(self, serializer):
        user = self.request.user
        order = None
        order_id = self.request.data.get('order')
        if order_id:
            try:
                order = Order.objects.select_related('restaurant').get(id=order_id)
            except (Order.DoesNotExist, ValueError, TypeError):
                raise ValidationError('Order not found.')
            if not _order_visible_to(order, user):
                raise PermissionDenied('You cannot open a chat for this order.')
        try:
            serializer.save(order=order)
        except Exception as exc:
            from django.db import IntegrityError
            if 'unique' in str(exc).lower() or isinstance(exc, IntegrityError):
                raise ValidationError('A conversation already exists.')
            raise


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _allowed_conversation_ids(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(customer=user) | Q(seller=user)).values_list('id', flat=True)

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        if not conversation_id:
            return Message.objects.none()
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation_id__in=self._allowed_conversation_ids(),
        ).select_related('sender')

    def perform_create(self, serializer):
        conversation = serializer.validated_data.get('conversation')
        if not conversation or not conversation.is_participant(self.request.user):
            raise PermissionDenied('You are not a participant of this conversation.')
        serializer.save(sender=self.request.user)


class MessageReadView(generics.GenericAPIView):
    """POST /api/chat/messages/<pk>/read/ — participant marks a message read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        msg = Message.objects.select_related('conversation').filter(
            id=pk,
            conversation_id__in=Conversation.objects.filter(
                Q(customer=user) | Q(seller=user)).values_list('id', flat=True),
        ).first()
        if not msg:
            return Response({'error': 'Message not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if msg.sender_id != user.id and not msg.is_read:
            msg.is_read = True
            msg.save(update_fields=['is_read'])
        return Response({'id': msg.id, 'is_read': msg.is_read})
