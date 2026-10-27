from rest_framework import generics, permissions
from .models import SellerProfile
from .serializers import SellerProfileSerializer

class SellerProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = SellerProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'store_name': f"Atelier {self.request.user.username}", 'slug': self.request.user.username.lower()}
        )
        return profile


class PublicSellerDetailView(generics.RetrieveAPIView):
    queryset = SellerProfile.objects.all()
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.AllowAny]
