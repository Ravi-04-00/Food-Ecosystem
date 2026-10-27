import os
import sys
import django
from datetime import time

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Restaurant, FoodItem

r = Restaurant.objects.filter(name__icontains='CYBER SMASH BURGERS 2099').first()
if not r:
    print("Restaurant not found!")
    sys.exit(1)

# Ensure verified, open, and standard operating hours
r.is_open = True
r.orders_paused = False
r.pause_reason = ''
r.verification_status = 'APPROVED'
r.opening_time = time(8, 0, 0)
r.closing_time = time(23, 0, 0)
r.timezone = 'Asia/Kolkata'
r.operating_hours = {}
r.exceptional_closures = []
r.save()

# Verify all food items for this restaurant are available
foods = FoodItem.objects.filter(restaurant=r)
updated_foods = 0
for f in foods:
    if not f.is_available or f.is_sold_out:
        f.is_available = True
        f.is_sold_out = False
        f.save(update_fields=['is_available', 'is_sold_out'])
        updated_foods += 1

is_open_ok, open_msg = r.is_currently_open()
print(f"Restaurant ID {r.id}: {r.name}")
print(f"Status: {r.verification_status}, is_open: {r.is_open}, is_currently_open(): {is_open_ok} ({open_msg})")
print(f"Total Foods: {foods.count()}, Foods reactivated: {updated_foods}")
