"""Release due scheduled orders (run via cron/scheduler).

Usage:
    py manage.py release_scheduled_orders
"""
from django.core.management.base import BaseCommand

from apps.orders.scheduling import release_due_scheduled_orders


class Command(BaseCommand):
    help = 'Release CONFIRMED scheduled orders whose slot has started.'

    def handle(self, *args, **options):
        result = release_due_scheduled_orders()
        self.stdout.write(
            'released=%d expired=%d' % (len(result['released']), len(result['expired'])))
        for order_number in result['released']:
            self.stdout.write('  RELEASED %s' % order_number)
        for item in result['expired']:
            self.stdout.write('  EXPIRED id=%s reason=%s' % (item['id'], item['reason']))
