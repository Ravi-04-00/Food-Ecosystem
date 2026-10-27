import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User
from apps.cart.views import CartAddFoodView
from apps.products.models import FoodItem, Restaurant

user = User.objects.filter(email='customer@wsfood.io').first()
factory = APIRequestFactory()
view = CartAddFoodView.as_view()

# Test with food items from CYBER SMASH BURGERS 2099
r = Restaurant.objects.get(id=1)
print(f"Testing with Restaurant: {r.name}")
foods = FoodItem.objects.filter(restaurant=r)

for f in foods:
    print(f"\nAttempting to add Food [{f.id}] {f.name}:")
    req = factory.post('/api/cart/items/', {'food_id': f.id, 'quantity': 1}, format='json')
    force_authenticate(req, user=user)
    resp = view(req)
    print(f"Status Code: {resp.status_code}")
    print(f"Response Data: {resp.data}")
