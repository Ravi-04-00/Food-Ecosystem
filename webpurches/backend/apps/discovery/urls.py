from django.urls import path
from .views import (
    CatalogSearchView,
    SearchSuggestionsView,
    DiscoverySectionsView,
    PersonalizedRecommendationsView,
    UserSearchHistoryView
)

urlpatterns = [
    path('search/', CatalogSearchView.as_view(), name='discovery_search'),
    path('suggestions/', SearchSuggestionsView.as_view(), name='discovery_suggestions'),
    path('sections/', DiscoverySectionsView.as_view(), name='discovery_sections'),
    path('recommendations/', PersonalizedRecommendationsView.as_view(), name='discovery_recommendations'),
    path('history/', UserSearchHistoryView.as_view(), name='discovery_search_history'),
]
