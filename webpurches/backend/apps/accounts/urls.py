from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomerRegisterView, RestaurantRegisterView, DeliveryPartnerRegisterView,
    RegisterView, CustomLoginView, CurrentUserView, LogoutView,
    CustomerProtectedView, RestaurantProtectedView, DeliveryProtectedView, AdminProtectedView,
    GoogleAuthView, ProfileView, AddressListCreateView, AddressDetailView, AddressSetDefaultView,
    SendOTPView, VerifyOTPView, WalletDetailView, LoyaltyDetailView,
    SettingsView
)

urlpatterns = [
    # Role-Specific Registration Endpoints (Phase 2)
    path('register/customer/', CustomerRegisterView.as_view(), name='register_customer'),
    path('register/restaurant/', RestaurantRegisterView.as_view(), name='register_restaurant'),
    path('register/delivery-partner/', DeliveryPartnerRegisterView.as_view(), name='register_delivery_partner'),
    path('register/', RegisterView.as_view(), name='register'),

    # Authentication & User Profile (Phase 3 & Phase 4)
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),

    # Role-Protected Verification Endpoints (Phase 3)
    path('protected/customer/', CustomerProtectedView.as_view(), name='protected_customer'),
    path('protected/restaurant/', RestaurantProtectedView.as_view(), name='protected_restaurant'),
    path('protected/delivery/', DeliveryProtectedView.as_view(), name='protected_delivery'),
    path('protected/admin/', AdminProtectedView.as_view(), name='protected_admin'),
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/photo/', ProfileView.as_view(), name='profile_photo'),
    path('settings/', SettingsView.as_view(), name='user_settings'),
    path('addresses/', AddressListCreateView.as_view(), name='addresses'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address_detail'),
    path('addresses/<int:pk>/set-default/', AddressSetDefaultView.as_view(), name='address_set_default'),

    # Mobile OTP Auth
    path('otp/send/', SendOTPView.as_view(), name='otp_send'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),

    # Wallet & Rewards
    path('wallet/', WalletDetailView.as_view(), name='wallet_detail'),
    path('loyalty/', LoyaltyDetailView.as_view(), name='loyalty_detail'),
]
