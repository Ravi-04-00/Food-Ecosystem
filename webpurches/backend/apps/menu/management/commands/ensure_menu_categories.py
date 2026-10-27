"""
Development-only starter menu categories (idempotent).

Creates the standard starter set ONLY for restaurants that currently have
zero menu categories, using get_or_create on (restaurant, name) so
re-runs never duplicate. Never touches existing categories.

Usage (PowerShell, from backend/):
    $env:FD_DEMO_SEED = '1'
    py manage.py ensure_menu_categories
"""
import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.products.models import Restaurant
from apps.menu.models import MenuCategory

STARTER_CATEGORIES = [
    'Breakfast',
    'Starters',
    'Main Course',
    'Rice & Biryani',
    'Breads',
    'Desserts',
    'Beverages',
]


class Command(BaseCommand):
    help = 'Seed starter menu categories for restaurants that have none (dev only).'

    def handle(self, *args, **options):
        if not settings.DEBUG or os.environ.get('FD_DEMO_SEED') != '1':
            raise CommandError(
                'Refusing to run: requires DEBUG=True AND FD_DEMO_SEED=1.')
        total_existing = MenuCategory.objects.count()
        added = 0
        skipped_restaurants = 0
        touched = 0
        for restaurant in Restaurant.objects.order_by('id'):
            if MenuCategory.objects.filter(restaurant=restaurant).exists():
                skipped_restaurants += 1
                continue
            touched += 1
            for order, name in enumerate(STARTER_CATEGORIES):
                _, created = MenuCategory.objects.get_or_create(
                    restaurant=restaurant, name=name,
                    defaults={'display_order': order, 'is_active': True})
                if created:
                    added += 1
        self.stdout.write(
            'menu_categories before=%d added=%d restaurants_seeded=%d '
            'restaurants_skipped(non-empty)=%d' % (
                total_existing, added, touched, skipped_restaurants))
