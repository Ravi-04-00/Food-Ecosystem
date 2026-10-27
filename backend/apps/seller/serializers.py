from rest_framework import serializers
from .models import SellerProfile

class SellerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = SellerProfile
        fields = '__all__'
        read_only_fields = ['user', 'total_sales', 'rating', 'is_verified']
