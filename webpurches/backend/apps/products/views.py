from django.db.models import Q
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Restaurant, FoodItem, FoodReel, FoodPost
from .serializers import (
    RestaurantSerializer, FoodItemSerializer, 
    CustomerRestaurantSerializer, CustomerRestaurantDetailSerializer,
    FoodReelSerializer, FoodPostSerializer
)

class FoodListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_description', 'full_description', 'restaurant__name', 'category__name']
    ordering_fields = ['price', 'rating', 'created_at', 'review_count']

    def get_queryset(self):
        # Only show items from approved restaurants
        queryset = FoodItem.objects.filter(restaurant__verification_status='APPROVED')

        category = self.request.query_params.get('category')
        cuisine = self.request.query_params.get('cuisine')
        veg_only = self.request.query_params.get('veg_only')
        non_veg_only = self.request.query_params.get('non_veg_only')
        dietary = self.request.query_params.get('dietary')
        max_price = self.request.query_params.get('max_price')
        min_price = self.request.query_params.get('min_price')
        min_rating = self.request.query_params.get('min_rating')
        restaurant_id = self.request.query_params.get('restaurant')
        available_only = self.request.query_params.get('available_only')
        is_available = self.request.query_params.get('is_available')
        search = self.request.query_params.get('search')
        sort = self.request.query_params.get('sort')

        if category and category.lower() != 'all':
            queryset = queryset.filter(
                Q(category__slug__iexact=category) | 
                Q(category__name__icontains=category)
            )

        if cuisine and cuisine.lower() != 'all':
            queryset = queryset.filter(restaurant__cuisines__icontains=cuisine)

        if veg_only == 'true' or (dietary and dietary.upper() == 'VEG'):
            queryset = queryset.filter(is_veg=True)
        elif non_veg_only == 'true' or (dietary and dietary.upper() == 'NON_VEG'):
            queryset = queryset.filter(is_veg=False)

        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass

        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass

        if min_rating:
            try:
                queryset = queryset.filter(rating__gte=float(min_rating))
            except ValueError:
                pass

        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        if available_only == 'true':
            queryset = queryset.filter(is_available=True)
        elif is_available is not None:
            queryset = queryset.filter(is_available=(is_available.lower() == 'true'))

        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(short_description__icontains=search) |
                Q(full_description__icontains=search) |
                Q(restaurant__name__icontains=search) |
                Q(category__name__icontains=search)
            ).distinct()

        if sort == 'rating':
            queryset = queryset.order_by('-rating', '-review_count')
        elif sort == 'popular':
            queryset = queryset.order_by('-review_count', '-rating')
        elif sort in ['price_low', 'price_asc']:
            queryset = queryset.order_by('price')
        elif sort in ['price_high', 'price_desc']:
            queryset = queryset.order_by('-price')
        elif sort:
            # Unknown sort values are ignored (never passed raw to order_by:
            # prevents ordering injection / FieldError 500s). Valid values
            # are documented above.
            pass

        return queryset

    def perform_create(self, serializer):
        serializer.save()


class FoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer


class RestaurantListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerRestaurantSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'cuisines', 'address', 'tagline']

    def get_queryset(self):
        queryset = Restaurant.objects.filter(verification_status='APPROVED').exclude(name='')
        open_only = self.request.query_params.get('open_only')
        is_open = self.request.query_params.get('is_open')
        cuisine = self.request.query_params.get('cuisine')
        search = self.request.query_params.get('search')
        sort = self.request.query_params.get('sort') or self.request.query_params.get('ordering')

        if open_only == 'true' or (is_open and is_open.lower() == 'true'):
            queryset = queryset.filter(is_open=True)

        if cuisine and cuisine.lower() != 'all':
            queryset = queryset.filter(cuisines__icontains=cuisine)

        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(cuisines__icontains=search) |
                Q(address__icontains=search) |
                Q(tagline__icontains=search) |
                Q(foods__name__icontains=search)
            ).distinct()

        if sort == 'rating':
            queryset = queryset.order_by('-rating', '-review_count')
        elif sort == 'popular':
            queryset = queryset.order_by('-review_count', '-rating')
        elif sort:
            queryset = queryset.order_by(sort)
        else:
            queryset = queryset.order_by('-rating')

        return queryset


class RestaurantDetailView(generics.RetrieveUpdateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = CustomerRestaurantDetailSerializer


class FoodReelListView(generics.ListCreateAPIView):
    queryset = FoodReel.objects.all().order_by('-created_at')
    serializer_class = FoodReelSerializer


class FoodPostListView(generics.ListCreateAPIView):
    queryset = FoodPost.objects.all().order_by('-created_at')
    serializer_class = FoodPostSerializer


class LikeReelView(APIView):
    def post(self, request, pk):
        try:
            reel = FoodReel.objects.get(pk=pk)
            reel.likes_count += 1
            reel.save()
            return Response({'likes_count': reel.likes_count, 'message': 'Reel liked'})
        except FoodReel.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# AI Food Assistant Endpoint (Natural language, recommendations, voice query)
class AIAssistantView(APIView):
    def post(self, request):
        query = request.data.get('query', '').strip().lower()
        
        # Intelligent matching algorithm for queries like "spicy chicken under 300", "healthy burger", etc.
        all_foods = FoodItem.objects.filter(is_available=True)
        matched_items = []

        is_veg_requested = 'veg' in query and 'non-veg' not in query
        is_spicy_requested = 'spicy' in query or 'hot' in query or 'fire' in query
        
        # Check budget keywords
        import re
        price_match = re.search(r'(under|below|less than|within)\s*(₹|rs\.?|inr)?\s*(\d+)', query)
        max_budget = float(price_match.group(3)) if price_match else None

        for food in all_foods:
            score = 0
            if any(word in food.name.lower() or word in food.short_description.lower() for word in query.split()):
                score += 3
            if is_veg_requested and food.is_veg:
                score += 2
            if is_spicy_requested and food.spice_level >= 2:
                score += 2
            if max_budget and float(food.price) <= max_budget:
                score += 3
            elif max_budget and float(food.price) > max_budget:
                score -= 5

            if score > 0:
                matched_items.append((score, food))

        matched_items.sort(key=lambda x: x[0], reverse=True)
        recommended = [FoodItemSerializer(item[1]).data for item in matched_items[:6]]

        # Fallback if specific search gave few results
        if len(recommended) < 3:
            for food in all_foods[:4]:
                serialized = FoodItemSerializer(food).data
                if serialized not in recommended:
                    recommended.append(serialized)

        reply_message = (
            f"⚡ Neural Kitchen Synthesis complete. Found {len(recommended)} cyber-optimized dishes matching '{query}'. "
            f"Average prep time is 18 minutes with hyper-speed dispatch."
        )

        return Response({
            'query': query,
            'reply': reply_message,
            'recommended_foods': recommended,
            'predicted_eta': '18-24 mins',
            'cyber_score': 99.4
        })


# Backward compatibility
ProductListCreateView = FoodListCreateView
ProductDetailView = FoodDetailView
