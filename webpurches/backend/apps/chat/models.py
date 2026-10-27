from django.db import models
from apps.accounts.models import User

class Conversation(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_conversations')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_conversations')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE,
                              null=True, blank=True, related_name='chat_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('customer', 'seller', 'order')

    def is_participant(self, user):
        return bool(user and user.is_authenticated) and (
            self.customer_id == user.id or self.seller_id == user.id)

    def __str__(self):
        return f"Chat: {self.customer.username} ↔ {self.seller.username}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    attachment = models.URLField(blank=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
