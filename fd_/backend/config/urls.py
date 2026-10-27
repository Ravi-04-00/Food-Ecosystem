from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.http import JsonResponse
from rest_framework.schemas import get_schema_view
from apps.accounts.admin_views import EcosystemTelemetryView, HealthCheckView
from config.swagger_views import SwaggerUIView


def liveness_probe(request):
    """Container/process liveness (no DB, no secrets). Readiness lives at /api/health/."""
    return JsonResponse({'status': 'ok', 'service': 'fd-foods-backend'})


urlpatterns = [
    path('health/', liveness_probe, name='liveness_probe'),
    path('', RedirectView.as_view(url='/api/docs/', permanent=False), name='root_redirect'),
    path('admin/', admin.site.urls),
    
    # Platform Health Check (PWA Connectivity Probe)
    path('api/health/', HealthCheckView.as_view(), name='api_health'),
    
    # FD FOOD Ecosystem Endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/kyc/', include('apps.accounts.kyc_urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/categories/', include('apps.categories.urls')),
    path('api/foods/', include('apps.products.urls')),
    path('api/products/', include('apps.products.urls')),  # Alias
    path('api/orders/', include('apps.orders.urls')),
    path('api/delivery/', include('apps.delivery.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/coupons/', include('apps.coupons.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/wishlist/', include('apps.wishlist.urls')),
    path('api/discovery/', include('apps.discovery.urls')),
    path('api/seller/', include('apps.seller.urls')),
    path('api/settings/', include('apps.accounts.urls')),
    path('api/support/', include('apps.accounts.support_urls')),
    path('api/calls/', include('apps.accounts.call_urls')),
    
    # Newly architected Phase 1 apps
    path('api/shifts/', include('apps.shifts.urls')),
    path('api/social/', include('apps.social.urls')),
    path('api/adminpanel/', include('apps.adminpanel.urls')),
    path('api/restaurants/', include('apps.restaurants.urls')),
    path('api/menu/', include('apps.menu.urls')),
    path('api/cart/', include('apps.cart.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    
    # API Documentation & Schema
    path('api/docs/', SwaggerUIView.as_view(), name='swagger_ui'),
    path('api/schema/', get_schema_view(
        title="FD FOOD API",
        description="Production-Quality Food Delivery Ecosystem API - Customer, Restaurant, Delivery Partner, Admin",
        version="2.0.0"
    ), name='openapi_schema'),

    # Admin Command Center Telemetry
    path('api/admin/ecosystem-telemetry/', EcosystemTelemetryView.as_view(), name='ecosystem_telemetry'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.MEDIA_ROOT:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


