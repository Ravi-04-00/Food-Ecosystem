from rest_framework import permissions

class IsCustomer(permissions.BasePermission):
    """Allows access only to authenticated customers."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'CUSTOMER'
        )

class IsRestaurant(permissions.BasePermission):
    """Allows access only to authenticated restaurant owners / staff."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['RESTAURANT', 'SHOP']
        )

class IsDeliveryPartner(permissions.BasePermission):
    """Allows access only to authenticated delivery riders."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER']
        )

class IsAdminUser(permissions.BasePermission):
    """Allows access only to administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission to allow only owners of an object to edit it."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, 'user') and obj.user == request.user
