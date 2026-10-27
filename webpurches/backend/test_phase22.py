import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import time, datetime
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.products.models import Restaurant, FoodItem
from apps.orders.models import Order
from apps.analytics.services import get_restaurant_analytics

User = get_user_model()

def run_tests():
    print("=" * 60)
    print("STARTING PHASE 22 RESTAURANT BUSINESS SUITE TEST SUITE")
    print("=" * 60)

    # 1. Database check
    from django.db import connection
    print(f"[TEST 1] Database Engine: {connection.vendor} (PostgreSQL expected)")
    assert connection.vendor == 'postgresql', f"Expected postgresql, got {connection.vendor}"
    print("  -> PASS: Verified running on real PostgreSQL database")

    # 2. Get or create test restaurant user and profile
    user, created = User.objects.get_or_create(
        email='phase22_test_merchant@wsfood.io',
        defaults={'role': 'RESTAURANT', 'is_active': True}
    )
    if created:
        user.set_password('Phase22SecurePass123!')
        user.save()

    restaurant, r_created = Restaurant.objects.get_or_create(
        owner=user,
        defaults={
            'name': 'Phase 22 Test Kitchen',
            'opening_time': time(9, 0),
            'closing_time': time(23, 0),
            'avg_prep_time_minutes': 25,
            'orders_paused': False,
            'is_open': True
        }
    )

    print(f"[TEST 2] Restaurant Model: '{restaurant.name}' (ID: {restaurant.id})")
    assert hasattr(restaurant, 'opening_time'), "Missing opening_time field"
    assert hasattr(restaurant, 'closing_time'), "Missing closing_time field"
    assert hasattr(restaurant, 'orders_paused'), "Missing orders_paused field"
    assert hasattr(restaurant, 'avg_prep_time_minutes'), "Missing avg_prep_time_minutes field"
    print("  -> PASS: All Phase 22 Restaurant model fields present")

    # 3. Test is_currently_open() logic
    restaurant.orders_paused = True
    restaurant.pause_reason = "Test pause"
    is_open, msg = restaurant.is_currently_open()
    assert is_open is False, f"Paused restaurant should not be open: {msg}"

    restaurant.orders_paused = False
    restaurant.opening_time = time(0, 0)
    restaurant.closing_time = time(23, 59)
    restaurant.is_open = True
    is_open, msg = restaurant.is_currently_open()
    assert is_open is True, f"24/7 restaurant with is_open=True should be open: {msg}"
    print("  -> PASS: Restaurant is_currently_open() correctly evaluates pause & operating hours")

    # 4. FoodItem Model & Availability
    food, f_created = FoodItem.objects.get_or_create(
        restaurant=restaurant,
        name='Phase 22 Test Specialty Biryani',
        defaults={
            'price': 250.00,
            'stock': 40,
            'is_available': True,
            'is_sold_out': False,
            'available_from_time': time(7, 0),
            'available_to_time': time(23, 0),
            'meal_periods': ['LUNCH', 'DINNER']
        }
    )
    assert hasattr(food, 'is_sold_out'), "Missing is_sold_out field"
    assert hasattr(food, 'available_from_time'), "Missing available_from_time field"
    assert hasattr(food, 'available_to_time'), "Missing available_to_time field"
    assert hasattr(food, 'meal_periods'), "Missing meal_periods field"
    print("  -> PASS: FoodItem model fields for sold-out and meal schedules present")

    # Sold-out check
    food.is_sold_out = True
    is_avail, msg = food.is_currently_available()
    assert is_avail is False, f"Sold-out food should not be available: {msg}"
    food.is_sold_out = False
    food.available_from_time = None
    food.available_to_time = None
    food.meal_periods = None
    is_avail, msg = food.is_currently_available()
    assert is_avail is True, f"In-stock food should be available: {msg}"
    print("  -> PASS: FoodItem is_currently_available() correctly evaluates sold-out flag")

    # 5. API Client Tests
    client = APIClient()
    client.force_authenticate(user=user)

    # 5.1 Operating Settings GET
    res = client.get('/api/restaurants/me/operating-settings/')
    assert res.status_code == 200, f"GET operating-settings failed: {res.status_code}"
    data = res.json()
    assert 'opening_time' in data, "opening_time not in response"
    assert 'orders_paused' in data, "orders_paused not in response"
    print("  -> PASS: GET /api/restaurants/me/operating-settings/ returns verified operating data")

    # 5.2 Operating Settings PATCH
    res = client.patch('/api/restaurants/me/operating-settings/', {
        'opening_time': '10:00:00',
        'closing_time': '22:30:00',
        'avg_prep_time_minutes': 30
    }, format='json')
    assert res.status_code == 200, f"PATCH operating-settings failed: {res.status_code}"
    restaurant.refresh_from_db()
    assert restaurant.avg_prep_time_minutes == 30, "avg_prep_time_minutes was not updated"
    print("  -> PASS: PATCH /api/restaurants/me/operating-settings/ updates database")

    # 5.3 Pause Orders POST
    res = client.post('/api/restaurants/me/pause-orders/', {
        'paused': True,
        'reason': 'Kitchen peak capacity overload'
    }, format='json')
    assert res.status_code == 200, f"POST pause-orders failed: {res.status_code}"
    restaurant.refresh_from_db()
    assert restaurant.orders_paused == True, "orders_paused was not set to True"
    assert restaurant.pause_reason == 'Kitchen peak capacity overload'

    # Resume orders
    res = client.post('/api/restaurants/me/pause-orders/', {
        'paused': False
    }, format='json')
    assert res.status_code == 200
    restaurant.refresh_from_db()
    assert restaurant.orders_paused == False
    print("  -> PASS: POST /api/restaurants/me/pause-orders/ correctly pauses and resumes orders")

    # 5.4 Sold-out Toggle POST
    res = client.post(f'/api/menu/items/{food.id}/toggle-sold-out/', {
        'is_sold_out': True
    }, format='json')
    assert res.status_code == 200, f"toggle-sold-out failed: {res.status_code}"
    food.refresh_from_db()
    assert food.is_sold_out == True, "Food item was not marked sold out"

    res = client.post(f'/api/menu/items/{food.id}/toggle-sold-out/', {
        'is_sold_out': False
    }, format='json')
    assert res.status_code == 200
    food.refresh_from_db()
    assert food.is_sold_out == False, "Food item was not restored to in-stock"
    print("  -> PASS: POST /api/menu/items/<pk>/toggle-sold-out/ toggles sold-out state")

    # 5.5 Schedule Update PATCH
    res = client.patch(f'/api/menu/items/{food.id}/schedule/', {
        'available_from_time': '08:00:00',
        'available_to_time': '12:00:00',
        'meal_periods': ['BREAKFAST']
    }, format='json')
    assert res.status_code == 200, f"schedule patch failed: {res.status_code}"
    food.refresh_from_db()
    assert food.meal_periods == ['BREAKFAST'], "meal_periods not updated"
    print("  -> PASS: PATCH /api/menu/items/<pk>/schedule/ updates meal periods and time limits")

    # 5.6 CSV Export GET
    res = client.get('/api/restaurants/me/export-orders-csv/')
    assert res.status_code == 200, f"export-orders-csv failed: {res.status_code}"
    assert res['Content-Type'] == 'text/csv', "Expected text/csv content type"
    assert 'Order Number' in res.content.decode('utf-8'), "Expected CSV headers in output"
    print("  -> PASS: GET /api/restaurants/me/export-orders-csv/ exports valid CSV response")

    # 5.7 Analytics GET
    res = client.get('/api/restaurants/me/analytics/')
    assert res.status_code == 200, f"analytics failed: {res.status_code}"
    analytics = res.json()
    assert 'prep_time_metrics' in analytics, "prep_time_metrics missing"
    assert 'operational_alerts' in analytics, "operational_alerts missing"
    print("  -> PASS: GET /api/restaurants/me/analytics/ returns Phase 22 enriched metrics")

    print("=" * 60)
    print("ALL 7 PHASE 22 AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
