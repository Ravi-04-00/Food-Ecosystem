from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from apps.products.serializers import FoodItemSerializer, CustomerRestaurantSerializer
from .services import (
    search_catalog,
    get_search_suggestions,
    get_discovery_sections,
    get_personalized_recommendations,
    get_user_recent_searches,
    log_user_search,
    clear_user_search_history
)
from .serializers import (
    SearchQueryInputSerializer,
    UserSearchHistorySerializer,
    PersonalizedRecommendationsSerializer
)


class CatalogSearchView(APIView):
    """
    Unified, high-speed food and restaurant search endpoint.
    Supports bilingual Tamil + English terms, server-side filtering,
    relevance/rating/price/popularity sorting, and pagination.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        serializer = SearchQueryInputSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        search_res = search_catalog(
            query=data.get('q', ''),
            category=data.get('category', ''),
            cuisine=data.get('cuisine', ''),
            min_price=data.get('min_price'),
            max_price=data.get('max_price'),
            min_rating=data.get('min_rating'),
            is_veg=data.get('is_veg'),
            is_open=data.get('is_open'),
            available_only=data.get('available_only', False),
            sort=data.get('sort', 'relevance'),
            page=data.get('page', 1),
            page_size=data.get('page_size', 12),
            user=request.user if request.user.is_authenticated else None
        )

        serialized_foods = FoodItemSerializer(search_res['foods'], many=True).data
        serialized_restaurants = CustomerRestaurantSerializer(search_res['restaurants'], many=True).data

        return Response({
            'foods': serialized_foods,
            'restaurants': serialized_restaurants,
            'meta': search_res['meta']
        })


class SearchSuggestionsView(APIView):
    """
    Fast debounced typeahead suggestions for search bars.
    Returns matching foods, restaurants, cuisines, and categories in <50ms.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        suggestions = get_search_suggestions(query)
        return Response(suggestions)


class DiscoverySectionsView(APIView):
    """
    Landing sections for food exploration:
    - Popular foods (real OrderItem counts)
    - Trending restaurants (30-day activity window)
    - Newly added foods (creation timestamps)
    - Discounted / active offer foods
    - Regional & global cuisine collections
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        sections = get_discovery_sections()
        return Response({
            'popular_foods': FoodItemSerializer(sections['popular_foods'], many=True).data,
            'trending_restaurants': CustomerRestaurantSerializer(sections['trending_restaurants'], many=True).data,
            'newly_added_foods': FoodItemSerializer(sections['newly_added_foods'], many=True).data,
            'discounted_foods': FoodItemSerializer(sections['discounted_foods'], many=True).data,
            'active_coupons_count': sections['active_coupons_count'],
            'cuisines': sections['cuisines']
        })


class PersonalizedRecommendationsView(APIView):
    """
    Transparent rule-based personalized recommendation endpoint.
    Uses previous completed orders, wishlist affinity, cuisine preferences,
    and verified ratings. Guarantees safe recommendations (is_available=True, is_open=True).
    Provides sensible fallback for guests or new customers without history.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        limit = request.query_params.get('limit', 8)
        try:
            limit = int(limit)
        except ValueError:
            limit = 8

        user = request.user if request.user.is_authenticated else None
        rec_data = get_personalized_recommendations(user=user, limit=limit)
        
        # Serialize items
        serialized_items = [
            {
                'food': FoodItemSerializer(entry['food']).data,
                'score': entry['score'],
                'reason': entry['reason']
            }
            for entry in rec_data['items']
        ]

        return Response({
            'strategy': rec_data['strategy'],
            'explanation': rec_data['explanation'],
            'items': serialized_items
        })


class UserSearchHistoryView(APIView):
    """
    Manages private recent search history for authenticated customers.
    GET: List recent unique search queries.
    POST: Save query to history.
    DELETE: Clear all or specific query from history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = get_user_recent_searches(request.user)
        return Response({'history': history})

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Query string cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        results_count = int(request.data.get('results_count', 0))
        entry = log_user_search(request.user, query, results_count)
        if entry:
            return Response(UserSearchHistorySerializer(entry).data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Query ignored or duplicate.'}, status=status.HTTP_200_OK)

    def delete(self, request):
        search_id = request.query_params.get('id')
        deleted_count = clear_user_search_history(request.user, search_id)
        return Response({
            'message': f'Deleted {deleted_count} search history record(s).',
            'deleted_count': deleted_count
        })
