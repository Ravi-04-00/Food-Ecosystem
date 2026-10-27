from django.urls import path
from .views import (
    MenuCategoryListCreateView,
    MenuCategoryDetailView,
    MenuCategoryToggleActiveView,
    MenuItemListCreateView,
    MenuItemDetailView,
    MenuItemStockToggleView,
    MenuItemScheduleView,
    MenuItemSoldOutToggleView,
    MenuCategoryListView
)

urlpatterns = [
    # Menu Categories Management
    path('categories/', MenuCategoryListCreateView.as_view(), name='menu_categories'),
    path('categories/<int:pk>/', MenuCategoryDetailView.as_view(), name='menu_category_detail'),
    path('categories/<int:pk>/toggle/', MenuCategoryToggleActiveView.as_view(), name='menu_category_toggle'),
    path('legacy-categories/', MenuCategoryListView.as_view(), name='legacy_menu_categories'),

    # Food Items Management
    path('items/', MenuItemListCreateView.as_view(), name='menu_items'),
    path('items/<int:pk>/', MenuItemDetailView.as_view(), name='menu_item_detail'),
    path('items/<int:pk>/toggle-stock/', MenuItemStockToggleView.as_view(), name='menu_item_toggle_stock'),
    path('items/<int:pk>/toggle-sold-out/', MenuItemSoldOutToggleView.as_view(), name='menu_item_toggle_sold_out'),
    path('items/<int:pk>/schedule/', MenuItemScheduleView.as_view(), name='menu_item_schedule'),
]
