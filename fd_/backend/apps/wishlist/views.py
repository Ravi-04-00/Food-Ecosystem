from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Wishlist
from .serializers import WishlistSerializer

class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Friendly 400 instead of a 500 IntegrityError: user is set at
        # save-time so DRF's auto UniqueTogetherValidator cannot cover it.
        product_id = serializer.validated_data.get('product_id')
        if product_id and Wishlist.objects.filter(
                user=self.request.user, product_id=product_id).exists():
            raise ValidationError('This item is already in your wishlist.')
        serializer.save(user=self.request.user)


class WishlistDeleteView(generics.DestroyAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)
