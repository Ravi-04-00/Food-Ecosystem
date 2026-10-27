import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Restaurant

for r in Restaurant.objects.all():
    is_ok, msg = r.is_currently_open()
    print(f"[{r.id}] {r.name:32} | is_open: {r.is_open} | paused: {r.orders_paused} | status: {r.verification_status} | open_ok: {is_ok} | msg: {msg}")
