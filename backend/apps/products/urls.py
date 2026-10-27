from django.urls import path
from .views import (
    FoodListCreateView, FoodDetailView,
    RestaurantListCreateView, RestaurantDetailView,
    FoodReelListView, FoodPostListView, LikeReelView,
    AIAssistantView
)

urlpatterns = [
    # Foods
    path('', FoodListCreateView.as_view(), name='food_list_create'),
    path('<int:pk>/', FoodDetailView.as_view(), name='food_detail'),
    
    # Restaurants
    path('restaurants/', RestaurantListCreateView.as_view(), name='restaurant_list'),
    path('restaurants/<int:pk>/', RestaurantDetailView.as_view(), name='restaurant_detail'),
    
    # Social / Reels / Posts
    path('reels/', FoodReelListView.as_view(), name='reels_list'),
    path('reels/<int:pk>/like/', LikeReelView.as_view(), name='reel_like'),
    path('posts/', FoodPostListView.as_view(), name='posts_list'),
    
    # AI Assistant
    path('ai/assistant/', AIAssistantView.as_view(), name='ai_food_assistant'),
]
