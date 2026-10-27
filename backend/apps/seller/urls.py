from django.urls import path
from .views import SellerProfileDetailView, PublicSellerDetailView

urlpatterns = [
    path('dashboard/', SellerProfileDetailView.as_view(), name='seller_dashboard_profile'),
    path('<int:pk>/', PublicSellerDetailView.as_view(), name='public_seller_detail'),
]
