from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'product_count']

    def get_product_count(self, obj):
        if hasattr(obj, 'foods'):
            return obj.foods.count()
        if hasattr(obj, 'products'):
            return obj.products.count()
        return 0
