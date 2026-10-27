import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

from apps.orders.consumers import EcosystemConsumer, OrderTrackingConsumer
from apps.chat.consumers import ChatConsumer

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("FD/ecosystem/", EcosystemConsumer.as_asgi()),
            path("FD/tracking/", OrderTrackingConsumer.as_asgi()),
            path("FD/chat/", ChatConsumer.as_asgi()),
        ])
    ),
})
