from rest_framework import views, generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.products.models import FoodItem, Restaurant
from .models import MenuCategory
from .serializers import MenuCategorySerializer, RestaurantFoodManageSerializer
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer


def get_user_restaurant(user):
    """Helper to fetch the primary restaurant owned by the user."""
    if not user or not user.is_authenticated:
        return None
    return Restaurant.objects.filter(owner=user).first()


def _is_admin_user(user):
    return bool(user and user.is_authenticated
                and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'))


def resolve_manage_restaurant(user, data=None):
    """
    Restaurant resolution for menu management (owner + admin flows).
    - Owners: their own restaurant (restaurant_id must match it).
    - Admins (staff or ADMIN role): any restaurant via restaurant_id.
    Raises PermissionDenied/ValidationError; returns Restaurant or None.
    """
    data = data or {}
    rid = data.get('restaurant_id') or data.get('restaurant')
    owned = get_user_restaurant(user)
    if _is_admin_user(user):
        if rid:
            try:
                restaurant = Restaurant.objects.filter(id=int(rid)).first()
            except (TypeError, ValueError):
                restaurant = None
            if not restaurant:
                raise ValidationError('Selected restaurant was not found.')
            return restaurant
        return owned
    if rid:
        try:
            rid_int = int(rid)
        except (TypeError, ValueError):
            raise ValidationError('Invalid restaurant ID format.')
        if not owned or owned.id != rid_int:
            raise PermissionDenied('You can only manage dishes for your own restaurant.')
        return owned
    return owned


class MenuCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuCategorySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            return MenuCategory.objects.filter(restaurant_id=restaurant_id).order_by('display_order', 'id')

        user = self.request.user
        if user.is_authenticated:
            restaurant = get_user_restaurant(user)
            if restaurant:
                return MenuCategory.objects.filter(restaurant=restaurant).order_by('display_order', 'id')
            if user.is_staff:
                return MenuCategory.objects.all().order_by('display_order', 'id')

        return MenuCategory.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        restaurant = get_user_restaurant(user)
        if not restaurant and not user.is_staff:
            raise PermissionDenied("You must have a registered restaurant to create menu categories.")
        serializer.save(restaurant=restaurant)


class MenuCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MenuCategorySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return MenuCategory.objects.all()
            restaurant = get_user_restaurant(user)
            if restaurant:
                return MenuCategory.objects.filter(restaurant=restaurant)
        return MenuCategory.objects.all()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if not user.is_staff and instance.restaurant.owner != user:
            raise PermissionDenied("You can only edit categories for your own restaurant.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_staff and instance.restaurant.owner != user:
            raise PermissionDenied("You can only delete categories for your own restaurant.")

        # Prevent accidental deletion where food items still depend on the category
        dependent_count = instance.food_items.count()
        if dependent_count > 0:
            raise ValidationError({
                "detail": f"Cannot delete category '{instance.name}' because {dependent_count} food item(s) are assigned to it. Please reassign or delete the food items first."
            })
        instance.delete()


class MenuCategoryToggleActiveView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        category = MenuCategory.objects.filter(id=pk).first()
        if not category:
            return Response({'error': 'Menu category not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and category.restaurant.owner != request.user:
            return Response({'error': 'You do not own this category.'}, status=status.HTTP_403_FORBIDDEN)

        category.is_active = not category.is_active
        category.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'id': category.id,
            'name': category.name,
            'is_active': category.is_active,
            'message': f"Category '{category.name}' is now {'ENABLED' if category.is_active else 'DISABLED'}."
        }, status=status.HTTP_200_OK)


class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = RestaurantFoodManageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = FoodItem.objects.all().select_related('restaurant', 'menu_category', 'category')
        restaurant_id = self.request.query_params.get('restaurant_id')
        category_id = self.request.query_params.get('category_id') or self.request.query_params.get('category')
        is_available = self.request.query_params.get('is_available')
        dietary_type = self.request.query_params.get('dietary_type')
        search = self.request.query_params.get('search')

        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        elif self.request.user.is_authenticated:
            restaurant = get_user_restaurant(self.request.user)
            if restaurant and not self.request.user.is_staff:
                qs = qs.filter(restaurant=restaurant)

        if category_id:
            try:
                cid = int(category_id)
                qs = qs.filter(menu_category_id=cid)
            except ValueError:
                qs = qs.filter(menu_category__slug=category_id)

        if is_available is not None:
            qs = qs.filter(is_available=(is_available.lower() == 'true'))

        if dietary_type:
            qs = qs.filter(dietary_type__iexact=dietary_type)

        if search:
            qs = qs.filter(name__icontains=search.strip())

        return qs.order_by('display_order', 'id')

    def perform_create(self, serializer):
        restaurant = resolve_manage_restaurant(
            self.request.user, self.request.data)
        if not restaurant:
            raise PermissionDenied("You must own a restaurant to create food items.")
        serializer.save(restaurant=restaurant)


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RestaurantFoodManageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return FoodItem.objects.all().select_related('restaurant', 'menu_category', 'category')

    def perform_update(self, serializer):
        food = self.get_object()
        user = self.request.user
        if not _is_admin_user(user) and food.restaurant.owner != user:
            raise PermissionDenied("You can only modify dishes belonging to your own restaurant.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not _is_admin_user(user) and instance.restaurant.owner != user:
            raise PermissionDenied("You can only delete dishes belonging to your own restaurant.")
        if instance.food_image:
            try:
                instance.food_image.delete(save=False)
            except Exception:
                pass
        instance.delete()


class MenuItemStockToggleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        food = FoodItem.objects.filter(id=pk).first()
        if not food:
            return Response({'error': 'Food item not found'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and food.restaurant.owner != request.user:
            return Response({'error': 'You do not own this food item.'}, status=status.HTTP_403_FORBIDDEN)

        food.is_available = not food.is_available
        if not food.is_available:
            food.stock = 0
        else:
            food.stock = max(10, food.stock)
        food.save(update_fields=['is_available', 'stock', 'updated_at'])

        return Response({
            'success': True,
            'food_id': food.id,
            'name': food.name,
            'is_available': food.is_available,
            'stock': food.stock,
            'message': f"{food.name} is now {'IN STOCK (AVAILABLE)' if food.is_available else 'OUT OF STOCK (UNAVAILABLE)'}"
        })


# Legacy Category list view for backward compatibility
class MenuCategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class MenuItemScheduleView(views.APIView):
    """
    Phase 22: Configure scheduling (available_from_time, available_to_time, meal_periods).
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        food = FoodItem.objects.filter(id=pk).first()
        if not food:
            return Response({'error': 'Food item not found'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and food.restaurant.owner != request.user:
            return Response({'error': 'You do not own this food item.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        if 'available_from_time' in data:
            food.available_from_time = data['available_from_time'] or None
        if 'available_to_time' in data:
            food.available_to_time = data['available_to_time'] or None
        if 'meal_periods' in data and isinstance(data['meal_periods'], list):
            food.meal_periods = data['meal_periods']

        food.save(update_fields=['available_from_time', 'available_to_time', 'meal_periods', 'updated_at'])
        return Response({
            'success': True,
            'food_id': food.id,
            'name': food.name,
            'available_from_time': str(food.available_from_time) if food.available_from_time else None,
            'available_to_time': str(food.available_to_time) if food.available_to_time else None,
            'meal_periods': food.meal_periods,
            'message': f"Availability schedule for '{food.name}' updated successfully."
        })


class MenuItemSoldOutToggleView(views.APIView):
    """
    Phase 22: Toggle sold-out state for a menu item.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        food = FoodItem.objects.filter(id=pk).first()
        if not food:
            return Response({'error': 'Food item not found'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and food.restaurant.owner != request.user:
            return Response({'error': 'You do not own this food item.'}, status=status.HTTP_403_FORBIDDEN)

        sold_out_param = request.data.get('is_sold_out')
        if sold_out_param is not None:
            food.is_sold_out = bool(sold_out_param)
        else:
            food.is_sold_out = not food.is_sold_out

        if food.is_sold_out:
            food.stock = 0
        else:
            food.stock = max(10, food.stock)
            food.is_available = True

        food.save(update_fields=['is_sold_out', 'stock', 'is_available', 'updated_at'])
        return Response({
            'success': True,
            'food_id': food.id,
            'name': food.name,
            'is_sold_out': food.is_sold_out,
            'is_available': food.is_available,
            'stock': food.stock,
            'message': f"'{food.name}' marked as {'SOLD OUT' if food.is_sold_out else 'IN STOCK'}."
        })
