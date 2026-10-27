from rest_framework import permissions


class IsAdminOnly(permissions.BasePermission):
    """
    Allows access only to authenticated admin or staff users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN')


class IsRestaurantOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: Restaurant owners can ONLY access their own restaurant analytics.
    Admins/Staff retain global oversight.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True
        # obj is a Restaurant instance
        return getattr(obj, 'owner_id', None) == request.user.id


class IsDeliveryPartnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: Delivery partners can ONLY access their own delivery statistics.
    Admins/Staff retain global oversight.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            return True
        # obj is a DeliveryPartner or User instance
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        return getattr(obj, 'id', None) == request.user.id
