"""
Development-only demo login accounts (idempotent).

Usage (PowerShell, from backend/):
    $env:FD_DEMO_SEED = '1'
    py manage.py seed_demo_accounts

Safety:
- Refuses to run unless DEBUG is True AND FD_DEMO_SEED=1.
- get_or_create by email: re-running NEVER duplicates and NEVER resets
  an existing user's password (existing accounts are reported + skipped).
- Passwords are hashed with set_password; plaintext never touches the DB.
- Admin demo gets role='ADMIN' only (is_staff=False, is_superuser=False).
- Documented demo fixture: rider/restaurant Profiles are marked APPROVED
  so the documented login flow works in dev. Not for production data.
"""
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.test import Client

from apps.accounts.models import Profile, Wallet, LoyaltyProfile

DEMO_PASSWORD = os.environ.get('FD_DEMO_PASSWORD', 'Demo1234!')

DEMOS = [
    {'email': 'demo.customer@fdfoods.test', 'username': 'demo_customer',
     'role': 'CUSTOMER', 'full_name': 'Demo Customer'},
    {'email': 'demo.rider@fdfoods.test', 'username': 'demo_rider',
     'role': 'DELIVERY', 'full_name': 'Demo Rider'},
    {'email': 'demo.restaurant@fdfoods.test', 'username': 'demo_restaurant',
     'role': 'RESTAURANT', 'full_name': 'Demo Owner'},
    {'email': 'demo.admin@fdfoods.test', 'username': 'demo_admin',
     'role': 'ADMIN', 'full_name': 'Demo Admin'},
]


class Command(BaseCommand):
    help = 'Create idempotent development-only demo login accounts.'

    def handle(self, *args, **options):
        if not settings.DEBUG or os.environ.get('FD_DEMO_SEED') != '1':
            raise CommandError(
                'Refusing to run: requires DEBUG=True AND FD_DEMO_SEED=1. '
                'Never run demo seeding against production.')
        User = get_user_model()
        results = []
        for spec in DEMOS:
            user, created = User.objects.get_or_create(
                email=spec['email'],
                defaults={'username': spec['username'], 'role': spec['role'],
                          'is_active': True},
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.is_active = True
                # Never grant staff/superuser via demo seeding.
                user.is_staff = False
                user.is_superuser = False
                user.save()
                Profile.objects.get_or_create(
                    user=user,
                    defaults={'full_name': spec['full_name'],
                              'verification_status': 'APPROVED',
                              'is_verified': True},
                )
                Wallet.objects.get_or_create(user=user)
                LoyaltyProfile.objects.get_or_create(user=user)
                self._link_role_records(user, spec['role'])
                results.append((spec, 'CREATED'))
            else:
                results.append((spec, 'EXISTS (password unchanged)'))
        # Self-verify: login each account via the real endpoint.
        client = Client()
        for spec, state in results:
            resp = client.post('/api/auth/login/', {
                'identifier': spec['email'], 'password': DEMO_PASSWORD,
                'role': self._login_role(spec['role']),
            }, content_type='application/json')
            ok = resp.status_code == 200 and bool(
                resp.json().get('access') or resp.json().get('access_token'))
            self.stdout.write(
                '%s %-32s role=%-10s login=%s' % (
                    state, spec['email'], spec['role'],
                    'OK' if ok else 'FAILED(%s)' % resp.status_code))
        self.stdout.write(self.style.WARNING(
            'DEV ONLY credentials -- password: %s (from FD_DEMO_PASSWORD or default). '
            'Do not use in production.' % DEMO_PASSWORD))

    @staticmethod
    def _login_role(role):
        return {'DELIVERY': 'DELIVERY_PARTNER'}.get(role, role)

    @staticmethod
    def _link_role_records(user, role):
        if role == 'RESTAURANT':
            from apps.products.models import Restaurant
            Restaurant.objects.get_or_create(
                owner=user,
                defaults={'name': 'Demo Kitchen',
                          'verification_status': 'APPROVED',
                          'is_verified': True, 'is_open': True},
            )
        elif role == 'DELIVERY':
            from apps.delivery.models import DeliveryPartner
            DeliveryPartner.objects.get_or_create(
                user=user,
                defaults={'vehicle_number': 'KA-01-DEMO-%s' % user.id,
                          'verification_status': 'APPROVED',
                          'is_verified': True},
            )
