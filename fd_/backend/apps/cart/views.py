from decimal import Decimal
from rest_framework import views, status, permissions
from rest_framework.response import Response
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from apps.products.models import FoodItem, FoodVariant, FoodAddon


class CartDetailView(views.APIView):
    """
    Phase 9: View and Clear Cart for Authenticated Customer.
    Strictly isolated to request.user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.clear()
        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': 'Cart cleared successfully.',
            'cart': serializer.data
        }, status=status.HTTP_200_OK)


class CartAddFoodView(views.APIView):
    """
    Phase 9: Add Food to Cart with Customization and Single Restaurant Rule.
    Backend calculates prices rather than trusting frontend totals.
    Unavailable food and closed restaurant food cannot be added.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        food_id = request.data.get('food_id') or request.data.get('product_id')
        if not food_id:
            return Response({'error': 'Food item ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            food_id = int(food_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid food ID.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Fetch and validate food item
        food = FoodItem.objects.select_related('restaurant').filter(id=food_id).first()
        if not food:
            return Response({'error': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Check food availability & scheduling
        if hasattr(food, 'is_currently_available'):
            is_avail_ok, avail_msg = food.is_currently_available()
            if not is_avail_ok:
                return Response({
                    'error': f"Unavailable food cannot be added to cart. {avail_msg}",
                    'food_id': food.id,
                    'food_name': food.name
                }, status=status.HTTP_400_BAD_REQUEST)
        elif not food.is_available:
            return Response({
                'error': 'Unavailable food cannot be added to cart.',
                'food_id': food.id,
                'food_name': food.name
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check restaurant active status
        restaurant = food.restaurant
        if not restaurant:
            return Response({'error': 'Food item is not linked to any restaurant.'}, status=status.HTTP_400_BAD_REQUEST)

        if restaurant.verification_status != 'APPROVED':
            return Response({
                'error': f"'{restaurant.name}' is not currently verified to accept orders.",
                'verification_status': restaurant.verification_status
            }, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(restaurant, 'is_currently_open'):
            is_open_ok, open_msg = restaurant.is_currently_open()
            if not is_open_ok:
                return Response({
                    'error': f"'{restaurant.name}' is currently closed and not accepting new orders. {open_msg}",
                    'restaurant_id': restaurant.id,
                    'restaurant_name': restaurant.name,
                    'is_open': False
                }, status=status.HTTP_400_BAD_REQUEST)
        elif not restaurant.is_open:
            return Response({
                'error': f"'{restaurant.name}' is currently closed and not accepting new orders.",
                'restaurant_id': restaurant.id,
                'restaurant_name': restaurant.name,
                'is_open': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Check quantity
        try:
            qty = int(request.data.get('quantity', 1))
        except (ValueError, TypeError):
            qty = 1

        if qty <= 0:
            return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Check Variant customization
        variant_raw = request.data.get('variant_id')
        if variant_raw is None:
            variant_raw = request.data.get('variant')
        if isinstance(variant_raw, dict):
            variant_raw = variant_raw.get('id')

        variant = None
        if variant_raw is not None and str(variant_raw).strip() not in ('', 'null', 'None', 'undefined'):
            variant_str = str(variant_raw).strip()
            if variant_str.isdigit():
                variant = FoodVariant.objects.filter(id=int(variant_str), food=food).first()
                if not variant:
                    return Response({
                        'error': 'Invalid variant ID. Selected variant is not valid for this food item.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # String name or non-digit variant identifier
                variant = FoodVariant.objects.filter(food=food, name__iexact=variant_str).first()
                if not variant:
                    if variant_str.lower() in ('regular', 'default', 'standard', 'normal', 'base'):
                        variant = None
                    else:
                        return Response({
                            'error': f"Invalid variant ID. Selected variant '{variant_str}' is not valid for this food item."
                        }, status=status.HTTP_400_BAD_REQUEST)

        # 6. Check Addon customization
        addon_raw = None
        if hasattr(request.data, 'getlist') and request.data.getlist('addon_ids'):
            addon_raw = request.data.getlist('addon_ids')
        elif 'addon_ids' in request.data:
            addon_raw = request.data['addon_ids']
        elif 'selected_addons' in request.data:
            addon_raw = request.data['selected_addons']

        addons_list = []
        if addon_raw is not None:
            clean_ids = []
            if isinstance(addon_raw, list):
                for item in addon_raw:
                    if isinstance(item, dict) and 'id' in item:
                        clean_ids.append(item['id'])
                    elif isinstance(item, (int, str)) and str(item).isdigit():
                        clean_ids.append(int(item))
            elif isinstance(addon_raw, (int, str)) and str(addon_raw).isdigit():
                clean_ids.append(int(addon_raw))

            if clean_ids:
                valid_addons = FoodAddon.objects.filter(id__in=clean_ids, food=food, is_available=True)
                for a in valid_addons:
                    addons_list.append({
                        'id': a.id,
                        'name': a.name,
                        'price': float(a.price)
                    })

        special_instructions = str(request.data.get('special_instructions', '')).strip()

        # 7. Single Restaurant Cart Rule Check
        cart, _ = Cart.objects.get_or_create(user=request.user)
        clear_cart = bool(request.data.get('clear_cart', False))

        current_restaurant = cart.restaurant
        if current_restaurant and current_restaurant.id != restaurant.id and cart.items.exists():
            if not clear_cart:
                return Response({
                    'conflict': True,
                    'error': 'Cart contains items from another restaurant.',
                    'current_restaurant': {
                        'id': current_restaurant.id,
                        'name': current_restaurant.name
                    },
                    'new_restaurant': {
                        'id': restaurant.id,
                        'name': restaurant.name
                    },
                    'message': f"Your cart contains items from '{current_restaurant.name}'. Would you like to clear your cart and start a new order from '{restaurant.name}'?"
                }, status=status.HTTP_409_CONFLICT)
            else:
                cart.clear()

        # Set or update restaurant on cart
        cart.restaurant = restaurant
        cart.save(update_fields=['restaurant', 'updated_at'])

        # 8. Add item or increment existing matching item
        # Compare product, variant, addons, and special instructions
        candidate_items = cart.items.filter(product=food, variant=variant)
        target_item = None
        new_addon_ids = set(a['id'] for a in addons_list)

        for candidate in candidate_items:
            existing_addon_ids = set(a.get('id') for a in (candidate.selected_addons or []))
            if existing_addon_ids == new_addon_ids and (candidate.special_instructions or '').strip() == special_instructions:
                target_item = candidate
                break

        if target_item:
            target_item.quantity += qty
            target_item.save()
            created = False
        else:
            target_item = CartItem.objects.create(
                cart=cart,
                product=food,
                variant=variant,
                selected_addons=addons_list,
                special_instructions=special_instructions,
                quantity=qty
            )
            created = True

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': f"Added {qty}x '{food.name}' to cart.",
            'item_id': target_item.id,
            'cart': cart_serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartItemUpdateView(views.APIView):
    """
    Phase 9: Increase / Decrease Quantity or Remove Specific Cart Item.
    Customer can only modify their own cart items.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        item = CartItem.objects.select_related('cart').filter(id=pk, cart__user=request.user).first()
        if not item:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        cart = item.cart

        if 'quantity' in request.data:
            try:
                new_qty = int(request.data['quantity'])
            except (ValueError, TypeError):
                return Response({'error': 'Quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

            if new_qty <= 0:
                return Response({'error': 'Quantity must be greater than zero. To remove item, use delete.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = new_qty
            item.save()

        elif 'delta' in request.data:
            try:
                delta = int(request.data['delta'])
            except (ValueError, TypeError):
                return Response({'error': 'Delta must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

            new_qty = item.quantity + delta
            if new_qty <= 0:
                item.delete()
                if not cart.items.exists():
                    cart.restaurant = None
                    cart.save(update_fields=['restaurant', 'updated_at'])
                serializer = CartSerializer(cart, context={'request': request})
                return Response({
                    'success': True,
                    'message': 'Item removed from cart.',
                    'cart': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                item.quantity = new_qty
                item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': 'Cart item updated.',
            'item': CartItemSerializer(item, context={'request': request}).data,
            'cart': cart_serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        item = CartItem.objects.select_related('cart').filter(id=pk, cart__user=request.user).first()
        if not item:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        cart = item.cart
        item_name = item.product.name
        item.delete()

        if not cart.items.exists():
            cart.restaurant = None
            cart.save(update_fields=['restaurant', 'updated_at'])

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': f"'{item_name}' removed from cart.",
            'cart': cart_serializer.data
        }, status=status.HTTP_200_OK)


class CartItemDeleteView(views.APIView):
    """
    Alias / Helper for direct item deletion.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        return CartItemUpdateView().delete(request, pk)

    def delete(self, request, pk):
        return CartItemUpdateView().delete(request, pk)


class CartClearView(views.APIView):
    """
    Clear all items from customer cart.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.clear()
        serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'success': True,
            'message': 'Cart cleared successfully.',
            'cart': serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        return self.post(request)
