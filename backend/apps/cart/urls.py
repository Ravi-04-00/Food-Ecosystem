from django.urls import path
from .views import (
    CartDetailView,
    CartAddFoodView,
    CartItemUpdateView,
    CartItemDeleteView,
    CartClearView
)

urlpatterns = [
    # Cart details / clear
    path('', CartDetailView.as_view(), name='cart_detail'),
    
    # Add food to cart (both /items/ and /add/ routes)
    path('items/', CartAddFoodView.as_view(), name='cart_items'),
    path('add/', CartAddFoodView.as_view(), name='cart_add'),
    
    # Update / Delete specific cart item
    path('items/<int:pk>/', CartItemUpdateView.as_view(), name='cart_item_update'),
    path('items/<int:pk>/delete/', CartItemDeleteView.as_view(), name='cart_item_delete'),
    
    # Clear entire cart
    path('clear/', CartClearView.as_view(), name='cart_clear'),
]
