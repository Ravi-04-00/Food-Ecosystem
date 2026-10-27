from django.urls import path
from .views import ConversationListCreateView, MessageListCreateView, MessageReadView

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversation_list'),
    path('messages/', MessageListCreateView.as_view(), name='message_list'),
    path('messages/<int:pk>/read/', MessageReadView.as_view(), name='message_read'),
]
