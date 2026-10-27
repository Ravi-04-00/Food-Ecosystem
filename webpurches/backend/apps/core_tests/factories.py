"""
Fast Delivery (FD) - Quality Engineering Test Data Factories
Provides deterministic, synthetic fixtures for all platform actors and entities.
Ensures zero reliance on production data and clean setup/teardown.
"""

import uuid
import datetime
from decimal import Decimal
from django.utils import timezone
from apps.accounts.models import User, Address, Profile, Wallet
from apps.products.models import Restaurant, Category, FoodItem, FoodVariant, FoodAddon
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.delivery.models import DeliveryPartner
from apps.coupons.models import Coupon
from apps.payments.models import Payment


def create_test_user(role='CUSTOMER', username=None, email=None, password='Password123!', **kwargs):
    """Creates a deterministic synthetic test user with wallet and profile."""
    uid = uuid.uuid4().hex[:6]
    username = username or f"test_{role.lower()}_{uid}"
    email = email or f"{username}@testfd.io"

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
        is_staff=(role == 'ADMIN'),
        is_superuser=(role == 'ADMIN'),
        **kwargs
    )
    Profile.objects.get_or_create(user=user, defaults={'full_name': f"Test {role.title()}"})
    Wallet.objects.get_or_create(user=user, defaults={'balance': Decimal('1000.00')})
    return user


def create_test_restaurant(owner=None, name=None, is_open=True, **kwargs):
    """Creates a test restaurant with 24/7 operating hours for deterministic testing."""
    if not owner:
        owner = create_test_user(role='SHOP')
    uid = uuid.uuid4().hex[:6]
    name = name or f"Test Kitchen {uid}"

    restaurant = Restaurant.objects.create(
        owner=owner,
        name=name,
        address=kwargs.get('address', '100 Cyber Boulevard, Food District'),
        latitude=Decimal(str(kwargs.get('latitude', 12.9716))),
        longitude=Decimal(str(kwargs.get('longitude', 77.5946))),
        is_open=is_open,
        orders_paused=False,
        verification_status='APPROVED',
        opening_time=datetime.time(0, 0),
        closing_time=datetime.time(23, 59),
        cuisines=['Fast Food', 'Burgers']
    )
    return restaurant


def create_test_category(name=None):
    """Creates a test category."""
    uid = uuid.uuid4().hex[:6]
    name = name or f"Test Category {uid}"
    category, _ = Category.objects.get_or_create(name=name)
    return category


def create_test_food(restaurant=None, category=None, name=None, price=Decimal('199.00'), stock=100, is_available=True):
    """Creates a test food item with stock and pricing."""
    if not restaurant:
        restaurant = create_test_restaurant()
    if not category:
        category = create_test_category()
    uid = uuid.uuid4().hex[:6]
    name = name or f"Cyber Deluxe Dish {uid}"

    food = FoodItem.objects.create(
        restaurant=restaurant,
        category=category,
        name=name,
        price=Decimal(str(price)),
        stock=stock,
        is_available=is_available,
        is_veg=True,
        spice_level=1,
        prep_time_minutes=15
    )
    return food


def create_test_address(user=None, label='HOME'):
    """Creates a synthetic customer delivery address."""
    if not user:
        user = create_test_user(role='CUSTOMER')
    return Address.objects.create(
        user=user,
        label=label,
        full_name=user.username,
        phone='9876543210',
        street='Flat 204, Alpha Heights',
        city='Metropolis',
        state='Karnataka',
        pincode='560001',
        country='India',
        latitude=Decimal('12.9720'),
        longitude=Decimal('77.5950'),
        is_default=True
    )


def create_test_rider(user=None, is_online=True):
    """Creates a verified delivery partner."""
    if not user:
        user = create_test_user(role='DELIVERY')
    uid = uuid.uuid4().hex[:6].upper()
    partner, created = DeliveryPartner.objects.get_or_create(
        user=user,
        defaults={
            'is_online': is_online,
            'is_verified': True,
            'verification_status': 'APPROVED',
            'vehicle_number': f"KA-03-{uid}",
            'vehicle_type': 'Bike',
            'current_latitude': Decimal('12.9718'),
            'current_longitude': Decimal('77.5948'),
            'rating': Decimal('4.9')
        }
    )
    if not created and partner.is_online != is_online:
        partner.is_online = is_online
        partner.save(update_fields=['is_online'])
    return partner


def create_test_order(customer=None, restaurant=None, rider=None, status='PLACED', grand_total=Decimal('250.00')):
    """Creates a test order with initial order status history."""
    if not customer:
        customer = create_test_user(role='CUSTOMER')
    if not restaurant:
        restaurant = create_test_restaurant()

    uid = uuid.uuid4().hex[:4].upper()
    order_number = f"FD-TEST-{uid}"

    order = Order.objects.create(
        order_number=order_number,
        customer=customer,
        restaurant=restaurant,
        rider=rider,
        status=status,
        payment_status='PAYMENT_PENDING' if status == 'PLACED' else 'PAID',
        payment_method='UPI (Instant)',
        subtotal=Decimal(str(grand_total)) - Decimal('50.00'),
        delivery_fee=Decimal('35.00'),
        packaging_fee=Decimal('15.00'),
        total=Decimal(str(grand_total)),
        grand_total=Decimal(str(grand_total)),
        otp='8492',
        delivery_address_text='Test Delivery Location',
        delivery_address_snapshot={'address': 'Test Delivery Location'}
    )

    OrderStatusHistory.objects.create(
        order=order,
        from_status='',
        to_status=status,
        actor=customer,
        actor_role='CUSTOMER',
        reason='Initial order generation for testing'
    )
    return order


def create_test_coupon(code='SAVE20', discount_percentage=20, min_order=Decimal('100.00'), max_discount=Decimal('100.00')):
    """Creates a test coupon with percentage discount."""
    coupon, _ = Coupon.objects.get_or_create(
        code=code.upper(),
        defaults={
            'title': f"{discount_percentage}% OFF Promo",
            'discount_type': 'PERCENTAGE',
            'discount_percentage': discount_percentage,
            'min_order_value': min_order,
            'max_discount_amount': max_discount,
            'is_active': True,
            'max_uses': 100,
            'start_date': timezone.now() - datetime.timedelta(days=1),
            'expiry_date': timezone.now() + datetime.timedelta(days=30)
        }
    )
    return coupon
