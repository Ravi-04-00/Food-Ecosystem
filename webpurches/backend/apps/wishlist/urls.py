from django.urls import path
from .views import WishlistListCreateView, WishlistDeleteView

urlpatterns = [
    path('', WishlistListCreateView.as_view(), name='wishlist_list_create'),
    path('<int:pk>/', WishlistDeleteView.as_view(), name='wishlist_delete'),
]
