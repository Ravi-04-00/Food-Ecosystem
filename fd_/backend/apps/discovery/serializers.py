from decimal import Decimal
from rest_framework import serializers
from apps.products.serializers import FoodItemSerializer, CustomerRestaurantSerializer
from .models import UserSearchHistory


class UserSearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSearchHistory
        fields = ['id', 'query', 'results_count', 'created_at']


class SearchQueryInputSerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, max_length=100)
    category = serializers.CharField(required=False, allow_blank=True, max_length=64)
    cuisine = serializers.CharField(required=False, allow_blank=True, max_length=64)
    min_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=Decimal('0'))
    max_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=Decimal('0'))
    min_rating = serializers.DecimalField(required=False, max_digits=3, decimal_places=2, min_value=Decimal('1.0'), max_value=Decimal('5.0'))
    is_veg = serializers.BooleanField(required=False, allow_null=True, default=None)
    is_open = serializers.BooleanField(required=False, allow_null=True, default=None)
    available_only = serializers.BooleanField(required=False, allow_null=True, default=False)
    sort = serializers.ChoiceField(
        choices=['relevance', 'rating', 'popular', 'price_asc', 'price_desc', 'newest'],
        required=False,
        default='relevance'
    )
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=50, default=12)

    def validate(self, attrs):
        min_p = attrs.get('min_price')
        max_p = attrs.get('max_price')
        if min_p is not None and max_p is not None and max_p < min_p:
            raise serializers.ValidationError({"max_price": "Maximum price cannot be lower than minimum price."})
        return attrs


class ScoredRecommendationItemSerializer(serializers.Serializer):
    food = FoodItemSerializer()
    score = serializers.FloatField()
    reason = serializers.CharField()


class PersonalizedRecommendationsSerializer(serializers.Serializer):
    strategy = serializers.CharField()
    explanation = serializers.CharField()
    items = ScoredRecommendationItemSerializer(many=True)
