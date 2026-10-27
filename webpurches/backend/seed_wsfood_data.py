import os
import django
from datetime import timedelta, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.accounts.models import (
    User, Profile, Address, Wallet, WalletTransaction,
    LoyaltyProfile, LoginActivity, SecurityAlert, AuditLog,
    SupportTicket, TicketMessage
)
from apps.categories.models import Category
from apps.products.models import Restaurant, FoodItem, FoodAddon, FoodReel, FoodPost
from apps.orders.models import Order, OrderItem
from apps.delivery.models import DeliveryPartner
from apps.coupons.models import Coupon
from apps.shifts.models import ShiftSlot, Shift, ShiftBooking, CheckIn, BreakLog, ShiftBonus
from apps.social.models import SocialPost, SocialReel, PhotoReview

def seed():
    print("=================================================================")
    print("[*] SEEDING WS FOOD PRODUCTION ECOSYSTEM (CHENNAI METRO AREA)")
    print("   Requirement: 10 Restaurants, 60 Foods, 5 Riders, 20 Orders")
    print("=================================================================")

    # 1. CORE ACCOUNTS & AUTH
    # Customer
    customer_user, _ = User.objects.get_or_create(
        email='customer@wsfood.io',
        defaults={'username': 'priya_ram', 'role': 'CUSTOMER', 'phone': '+91 98765 00001'}
    )
    customer_user.set_password('wsfood123')
    customer_user.save()
    Profile.objects.get_or_create(
        user=customer_user,
        defaults={
            'full_name': 'Priya Ramanathan',
            'phone': '+91 98765 00001',
            'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            'current_lat': 13.0418,
            'current_lng': 80.2341
        }
    )
    Address.objects.get_or_create(
        user=customer_user,
        defaults={
            'label': 'Home - T. Nagar',
            'full_name': 'Priya Ramanathan',
            'street': 'Flat 4B, Lotus Apartments, Usman Road',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'pincode': '600017',
            'phone': '+91 98765 00001',
            'latitude': 13.0418,
            'longitude': 80.2341,
            'is_default': True
        }
    )
    cust_wallet, _ = Wallet.objects.get_or_create(user=customer_user, defaults={'balance': 850.00})
    cust_loyalty, _ = LoyaltyProfile.objects.get_or_create(
        user=customer_user,
        defaults={'points': 450, 'tier': 'GOLD', 'lifetime_orders': 24, 'total_saved': 1240.00}
    )

    # Restaurant User
    shop_user, _ = User.objects.get_or_create(
        email='shop@wsfood.io',
        defaults={'username': 'chef_marcus_kane', 'role': 'RESTAURANT', 'phone': '+91 98765 00002'}
    )
    shop_user.set_password('wsfood123')
    shop_user.save()
    Profile.objects.get_or_create(
        user=shop_user,
        defaults={
            'full_name': 'Master Chef Kane',
            'avatar': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
            'phone': '+91 98765 00002'
        }
    )

    # Lead Delivery Rider
    lead_rider, _ = User.objects.get_or_create(
        email='rider@wsfood.io',
        defaults={'username': 'kaelen_vance', 'role': 'DELIVERY', 'phone': '+91 98765 00003'}
    )
    lead_rider.set_password('wsfood123')
    lead_rider.save()
    Profile.objects.get_or_create(
        user=lead_rider,
        defaults={
            'full_name': 'Kaelen Vance',
            'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            'phone': '+91 98765 00003',
            'current_lat': 13.0827,
            'current_lng': 80.2707
        }
    )

    # Admin User
    admin_user, _ = User.objects.get_or_create(
        email='admin@wsfood.io',
        defaults={'username': 'ws_commander', 'role': 'ADMIN', 'is_staff': True, 'is_superuser': True, 'phone': '+91 98765 00000'}
    )
    admin_user.set_password('wsfood123')
    admin_user.save()
    Profile.objects.get_or_create(user=admin_user, defaults={'full_name': 'WS System Commander'})

    # 2. SEED 5 RIDERS (Chennai Metro Fleet)
    riders_data = [
        (lead_rider, 'E_BIKE', 'TN-01-CY-2099', 'DL-TN-01-9876', 13.0827, 80.2707, 218, 4.96, 1850.00, 9820.00, 48200.00, 460.00),
        ('rider_rajesh@wsfood.io', 'Rajesh Kumar', 'SCOOTER', 'TN-02-AK-4412', 'DL-TN-02-1144', 13.0850, 80.2100, 194, 4.88, 1620.00, 8940.00, 42100.00, 380.00),
        ('rider_vignesh@wsfood.io', 'Vignesh Sundar', 'E_BIKE', 'TN-07-VS-9011', 'DL-TN-07-2288', 13.0418, 80.2341, 240, 4.92, 1950.00, 10200.00, 52400.00, 510.00),
        ('rider_dinesh@wsfood.io', 'Dinesh Karthik', 'HOVER', 'TN-09-DK-7733', 'DL-TN-09-3399', 13.0012, 80.2565, 178, 4.95, 1740.00, 9150.00, 39800.00, 420.00),
        ('rider_arif@wsfood.io', 'Mohammed Arif', 'VAN', 'TN-10-MA-5566', 'DL-TN-10-4411', 12.9815, 80.2180, 162, 4.87, 1580.00, 8600.00, 36500.00, 340.00),
    ]

    seeded_riders = []
    for item in riders_data:
        if isinstance(item[0], User):
            r_user = item[0]
        else:
            email, name, v_type, v_no, lic, lat, lng, tot_del, rat, t_earn, w_earn, all_earn, tips = item
            r_user, _ = User.objects.get_or_create(
                email=email,
                defaults={'username': email.split('@')[0], 'role': 'DELIVERY', 'phone': f'+91 98765 {len(seeded_riders)+10:05d}'}
            )
            r_user.set_password('wsfood123')
            r_user.save()
            Profile.objects.get_or_create(user=r_user, defaults={'full_name': name, 'phone': r_user.phone, 'current_lat': lat, 'current_lng': lng})

        dp, _ = DeliveryPartner.objects.get_or_create(
            user=r_user,
            defaults={
                'vehicle_type': item[1] if isinstance(item[0], User) else item[2],
                'vehicle_number': item[2] if isinstance(item[0], User) else item[3],
                'driving_license': item[3] if isinstance(item[0], User) else item[4],
                'is_verified': True,
                'is_online': True,
                'current_latitude': item[4] if isinstance(item[0], User) else item[5],
                'current_longitude': item[5] if isinstance(item[0], User) else item[6],
                'total_deliveries': item[6] if isinstance(item[0], User) else item[7],
                'rating': item[7] if isinstance(item[0], User) else item[8],
                'today_earnings': item[8] if isinstance(item[0], User) else item[9],
                'weekly_earnings': item[9] if isinstance(item[0], User) else item[10],
                'total_earnings': item[10] if isinstance(item[0], User) else item[11],
                'tips_earned': item[11] if isinstance(item[0], User) else item[12],
            }
        )
        seeded_riders.append(dp)

    print(f"   [+] Seeded {len(seeded_riders)} Active Delivery Partners")

    # 3. CATEGORIES
    categories_info = [
        ('cyber-bowls', 'Cyber Bowls', '🍲', 'Nutritious kinetic power bowls loaded with high-protein grains and vibrant veggies', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
        ('neon-burgers', 'Neon Burgers', '🍔', 'Smash-grilled wagyu and crispy plant protein with electrified smoky sauces', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'),
        ('quantum-pizza', 'Quantum Pizza', '🍕', '48-hour fermented kinetic dough topped with buffalo mozzarella and fiery toppings', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
        ('kinetic-biryani', 'Kinetic Biryani', '🍛', 'Aromatic dum sealed basmati pots infused with saffron and slow-braised spices', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'),
        ('chettinad-specials', 'Chettinad Heritage', '🥘', 'Hand-ground pepper masala curries, kothu parotta, and coastal coastal stews', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80'),
        ('madras-tiffin', 'Madras Tiffin', '🥞', 'Golden ghee roast dosas, steamed button idlis, and foaming degree filter coffee', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
        ('nitro-drinks', 'Nitro Drinks', '🥤', 'Electrolyte cold brews, glowing matcha shots, and botanical fizz infusions', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'),
        ('glitch-desserts', 'Glitch Desserts', '🧁', 'Molecular nitro cakes, molten cyber tarts, and chromatic puddings', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'),
    ]

    cat_map = {}
    for slug, name, icon, desc, img in categories_info:
        c, _ = Category.objects.get_or_create(slug=slug, defaults={'name': name, 'icon': icon, 'description': desc, 'image': img})
        cat_map[slug] = c

    # 4. SEED 10 RESTAURANTS (Chennai Localities)
    restaurants_raw = [
        {
            'name': 'CYBER SMASH BURGERS 2099',
            'tagline': 'Charcoal-Brioche Gourmet Smash Engineering',
            'cuisines': ['Smash Burgers', 'Truffle Fries', 'Shakes'],
            'rating': 4.90, 'reviews': 382,
            'address': '2nd Avenue, Anna Nagar Roundtana, Chennai',
            'lat': 13.0850, 'lng': 80.2100,
            'hero': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '18-24 min'
        },
        {
            'name': 'MADRAS DUM BIRYANI VAULT',
            'tagline': 'Authentic Saffron-Infused Seeraga Samba & Basmati',
            'cuisines': ['Chettinad Biryani', 'Mutton Sukka', 'Kebabs'],
            'rating': 4.94, 'reviews': 612,
            'address': 'RK Mutt Road, Mylapore Tank, Chennai',
            'lat': 13.0368, 'lng': 80.2676,
            'hero': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '22-28 min'
        },
        {
            'name': 'NEO TOKYO NOODLE LAB',
            'tagline': '16-Hour Simmered Broths & Kinetic Ramen',
            'cuisines': ['Artisanal Ramen', 'Gyoza', 'Bao', 'Matcha'],
            'rating': 4.88, 'reviews': 294,
            'address': 'Khadar Nawaz Khan Road, Nungambakkam, Chennai',
            'lat': 13.0604, 'lng': 80.2415,
            'hero': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '20-25 min'
        },
        {
            'name': 'MARINA COASTAL CATCH',
            'tagline': 'Fresh Bay Catch & Peppery Crab Roasts',
            'cuisines': ['Seafood', 'Prawn Masala', 'Fish Fry', 'Appam'],
            'rating': 4.92, 'reviews': 480,
            'address': 'Beach Road, Besant Nagar Promenade, Chennai',
            'lat': 12.9982, 'lng': 80.2690,
            'hero': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '25-30 min'
        },
        {
            'name': 'CHETTINAD HERITAGE MESS',
            'tagline': 'Hand-Ground Masala Roasts & Kothu Parotta',
            'cuisines': ['Chettinad Curries', 'Kothu Parotta', 'Nattu Kozhi'],
            'rating': 4.86, 'reviews': 340,
            'address': 'Usman Road, T. Nagar Shopping Hub, Chennai',
            'lat': 13.0418, 'lng': 80.2341,
            'hero': 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '15-20 min'
        },
        {
            'name': 'QUANTUM PIZZA ALCHEMISTS',
            'tagline': '48-Hr Fermented Dough & San Marzano Melts',
            'cuisines': ['Woodfired Pizza', 'Truffle Burrata', 'Tiramisu'],
            'rating': 4.91, 'reviews': 275,
            'address': 'TTK Road, Alwarpet Cultural Corridor, Chennai',
            'lat': 13.0336, 'lng': 80.2510,
            'hero': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '22-26 min'
        },
        {
            'name': 'FILTER COFFEE & TIFFIN REPUBLIC',
            'tagline': 'Ghee Podi Crisps & Pure Arabica Brews',
            'cuisines': ['Ghee Roast', 'Button Idli', 'Filter Coffee', 'Vada'],
            'rating': 4.95, 'reviews': 820,
            'address': 'Poonamallee High Road, Kilpauk, Chennai',
            'lat': 13.0784, 'lng': 80.2413,
            'hero': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '14-18 min'
        },
        {
            'name': 'OMR TECH BOWL LAB',
            'tagline': 'Macro-Optimized Superfood Bowls & Salads',
            'cuisines': ['High Protein Bowls', 'Keto Salads', 'Smoothies'],
            'rating': 4.84, 'reviews': 190,
            'address': 'OMR Cyber Gateway, Thoraipakkam, Chennai',
            'lat': 12.9352, 'lng': 80.2337,
            'hero': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '18-22 min'
        },
        {
            'name': 'THE SWEET GLITCH BAKERY',
            'tagline': 'Molecular Nitro Desserts & Chromatic Crepes',
            'cuisines': ['Molten Lava Tarts', 'Matcha Cheesecakes', 'Macarons'],
            'rating': 4.93, 'reviews': 310,
            'address': '100 Feet Bypass Road, Velachery, Chennai',
            'lat': 12.9815, 'lng': 80.2180,
            'hero': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '20-25 min'
        },
        {
            'name': 'MADRAS SPICE VAULT',
            'tagline': 'Smoky Tandoor Roasts & Peshawari Rotis',
            'cuisines': ['Tandoori Platters', 'Butter Chicken', 'Dal Makhani'],
            'rating': 4.89, 'reviews': 420,
            'address': 'EVR Periyar Salai, Chennai Central District, Chennai',
            'lat': 13.0827, 'lng': 80.2707,
            'hero': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            'avatar': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=200&q=80',
            'delivery_time': '20-28 min'
        },
    ]

    seeded_restaurants = []
    for r_data in restaurants_raw:
        r_obj, _ = Restaurant.objects.get_or_create(
            name=r_data['name'],
            defaults={
                'owner': shop_user,
                'tagline': r_data['tagline'],
                'description': f"{r_data['tagline']}. Highest culinary standards with kinetic speed delivery.",
                'cuisines': r_data['cuisines'],
                'rating': r_data['rating'],
                'review_count': r_data['reviews'],
                'address': r_data['address'],
                'latitude': r_data['lat'],
                'longitude': r_data['lng'],
                'delivery_time_text': r_data['delivery_time'],
                'hero_image': r_data['hero'],
                'avatar': r_data['avatar'],
                'is_open': True,
                'revenue_today': 18500.00,
                'revenue_weekly': 112000.00,
                'revenue_monthly': 480000.00,
                'total_orders': 420
            }
        )
        seeded_restaurants.append(r_obj)

    print(f"   [+] Seeded {len(seeded_restaurants)} Distinct Restaurants across Chennai localities")

    # 5. SEED 60 FOOD ITEMS (6 items per restaurant)
    foods_blueprint = [
        # Rest 0: Cyber Smash Burgers
        [
            ('Quantum Double Glaze Burger', 'quantum-double-glaze-burger', 'Double wagyu smashed patties, smoked chipotle glaze, cheddar melt.', 349.00, 399.00, '12% OFF', False, 'neon-burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'),
            ('Crispy Truffle Shroom Burger', 'crispy-truffle-shroom-burger', 'Crisp panko portobello with black truffle aioli, fontina melt.', 299.00, 349.00, '15% OFF', True, 'neon-burgers', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'),
            ('Nitro Electric Smash Wings', 'nitro-electric-smash-wings', 'Glazed crispy chicken wings tossed in fiery scotch bonnet sauce.', 269.00, 310.00, '10% OFF', False, 'neon-burgers', 'https://images.unsplash.com/photo-1527477378406-444a5b1215ea?auto=format&fit=crop&w=600&q=80'),
            ('Cyber Fries with Melted Fontina', 'cyber-fries-melted-fontina', 'Double-fried russet cut fries smothered in smoked cheese drizzle.', 179.00, 210.00, '15% OFF', True, 'neon-burgers', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80'),
            ('Smoked Bacon & Cheddar Stack', 'smoked-bacon-cheddar-stack', 'Charred beef patty, applewood smoked bacon, caramelized onion relish.', 379.00, 420.00, '10% OFF', False, 'neon-burgers', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80'),
            ('Electric Mango Habanero Shake', 'electric-mango-habanero-shake', 'Creamy alphonso mango shake with mild habanero tingle and whipped froth.', 189.00, 220.00, '14% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 1: Madras Dum Biryani
        [
            ('Royal Mutton Seeraga Samba Dum', 'royal-mutton-seeraga-samba-dum', 'Fragrant short-grain samba simmered with tender mutton & ghee.', 399.00, 450.00, '12% OFF', False, 'kinetic-biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'),
            ('Nawabi Saffron Chicken Dum Biryani', 'nawabi-saffron-chicken-dum', 'Slow-cooked aged basmati layered with farm chicken and saffron ghee.', 329.00, 370.00, '10% OFF', False, 'kinetic-biryani', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80'),
            ('Chettinad Spicy Mutton Sukka', 'chettinad-spicy-mutton-sukka', 'Dry-roasted mutton chunks with shallots, crushed pepper, curry leaves.', 349.00, 390.00, '10% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80'),
            ('Charcoal Paneer Tikka Dum Pot', 'charcoal-paneer-tikka-dum-pot', 'Marinated charcoal cottage cheese cubes with mint-infused rice.', 289.00, 320.00, '10% OFF', True, 'kinetic-biryani', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80'),
            ('Madras Chicken 65 Boneless', 'madras-chicken-65-boneless', 'Crispy spiced chicken bites tossed with fried green chilies & garlic.', 249.00, 280.00, '12% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80'),
            ('Mirchi Ka Salan & Onion Raitha', 'mirchi-ka-salan-onion-raitha', 'Traditional roasted peanut-sesame curry served with chilled curd raitha.', 120.00, 140.00, '15% OFF', True, 'kinetic-biryani', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 2: Neo Tokyo Noodle Lab
        [
            ('Tokyo Nitro Black Garlic Ramen', 'tokyo-nitro-black-garlic-ramen', '16hr pork broth, roasted black garlic oil, ajitsuke tamago egg.', 399.00, 440.00, '10% OFF', False, 'cyber-bowls', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80'),
            ('Spicy Miso Tofu Kinetic Ramen', 'spicy-miso-tofu-kinetic-ramen', 'Rich fermented red miso broth, springy noodles, silken tofu, nori.', 349.00, 390.00, '10% OFF', True, 'cyber-bowls', 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80'),
            ('Crisp Pan-Fried Pork Gyoza (6pcs)', 'crisp-pan-fried-pork-gyoza', 'Crispy bottom dumplings with juicy pork filling & soy-chili dip.', 269.00, 299.00, '10% OFF', False, 'cyber-bowls', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80'),
            ('Steamed Chashu Pork Bao Buns', 'steamed-chashu-pork-bao-buns', 'Fluffy cloud buns with glazed pork belly, scallions, hoisin mist.', 289.00, 320.00, '10% OFF', False, 'cyber-bowls', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'),
            ('Edamame Sea Salt & Togarashi', 'edamame-sea-salt-togarashi', 'Steamed green soybean pods dusted with flaky salt and Japanese spice.', 180.00, 200.00, '10% OFF', True, 'cyber-bowls', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
            ('Ceremonial Uji Iced Matcha Latte', 'ceremonial-uji-iced-matcha-latte', 'Stone-ground Kyoto green tea whipped over oat milk and ice.', 210.00, 240.00, '12% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 3: Marina Coastal Catch
        [
            ('Marina Tawa Pomfret Fry', 'marina-tawa-pomfret-fry', 'Whole silver pomfret crusted with fiery red chili masala on hot iron.', 450.00, 520.00, '14% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80'),
            ('Tiger Prawn Ghee Roast Roast', 'tiger-prawn-ghee-roast', 'Jumbo sea prawns slow-roasted with Byadgi chilies and cultured ghee.', 420.00, 480.00, '12% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1559742811-822863cb4cb7?auto=format&fit=crop&w=600&q=80'),
            ('Spicy Bay Crab Masala Bowl', 'spicy-bay-crab-masala-bowl', 'Fresh coastal blue crab simmered in roasted coconut & shallot gravy.', 410.00, 460.00, '11% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80'),
            ('Fluffy Soft Appams with Stew (3pcs)', 'fluffy-soft-appams-with-stew', 'Lacy fermented rice crepes with creamy aromatic coconut milk stew.', 199.00, 230.00, '15% OFF', True, 'madras-tiffin', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
            ('Squid Butter Garlic Calamari', 'squid-butter-garlic-calamari', 'Tender squid rings tossed in cracked pepper, golden butter and garlic.', 340.00, 380.00, '10% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80'),
            ('Tender Coconut Kinetic Cooler', 'tender-coconut-kinetic-cooler', 'Fresh coastal elaneer blended with mint, lemon zest and crushed ice.', 140.00, 160.00, '12% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 4: Chettinad Heritage Mess
        [
            ('Signature Chicken Kothu Parotta', 'signature-chicken-kothu-parotta', 'Flaky shredded parotta beaten on hot griddle with egg, chicken salna.', 249.00, 280.00, '11% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80'),
            ('Nattu Kozhi Peppery Milagu Roast', 'nattu-kozhi-peppery-milagu-roast', 'Country chicken braised with stone-ground black pepper and shallots.', 320.00, 360.00, '11% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80'),
            ('Flaky Ceylon Egg Parotta (2pcs)', 'flaky-ceylon-egg-parotta', 'Multi-layered buttery parottas served with rich aromatic salna gravy.', 160.00, 180.00, '10% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
            ('Chettinad Mushroom Chukka', 'chettinad-mushroom-chukka', 'Fresh button mushrooms dry-roasted with fennel, curry leaves and chili.', 210.00, 240.00, '12% OFF', True, 'chettinad-specials', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
            ('Vazhaipoo Banana Blossom Vadai', 'vazhaipoo-banana-blossom-vadai', 'Crunchy lentil fritters infused with finely chopped banana blossom.', 140.00, 160.00, '12% OFF', True, 'madras-tiffin', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
            ('Jigarthanda Madurai Special', 'jigarthanda-madurai-special', 'Chilled almond gum milk, nannari syrup, topped with rich basundi scoop.', 160.00, 180.00, '11% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 5: Quantum Pizza Alchemists
        [
            ('Diavola Fiery Calabrese Pizza', 'diavola-fiery-calabrese-pizza', '48hr kinetic dough, San Marzano sauce, spicy pepperoni, fresh basil.', 449.00, 499.00, '10% OFF', False, 'quantum-pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
            ('Truffle Wild Mushroom Burrata Pizza', 'truffle-wild-mushroom-burrata-pizza', 'Black truffle paste, portobello mushrooms, fresh creamy burrata ball.', 499.00, 560.00, '11% OFF', True, 'quantum-pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80'),
            ('Margherita D.O.P Buffalo Mozzarella', 'margherita-dop-buffalo-mozzarella', 'Crushed Italian tomatoes, buffalo mozzarella, fresh basil, olive oil.', 369.00, 410.00, '10% OFF', True, 'quantum-pizza', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80'),
            ('Creamy Pesto Genovese Penne', 'creamy-pesto-genovese-penne', 'Artisanal bronze-die pasta tossed in basil-pine nut pesto and cream.', 340.00, 380.00, '10% OFF', True, 'quantum-pizza', 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=600&q=80'),
            ('Crispy Garlic Pull-Apart Bread', 'crispy-garlic-pull-apart-bread', 'Fresh baked dough knot loaded with garlic butter and melted mozzarella.', 199.00, 220.00, '10% OFF', True, 'quantum-pizza', 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=600&q=80'),
            ('Classic Venetian Tiramisu Jar', 'classic-venetian-tiramisu-jar', 'Espresso-soaked savoiardi biscuits layered with mascarpone cream.', 240.00, 270.00, '11% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 6: Filter Coffee & Tiffin Republic
        [
            ('Madras Ghee Podi Crisp Roast', 'madras-ghee-podi-crisp-roast', 'Extra thin golden dosa smeared with spicy gun-powder podi and butter.', 160.00, 180.00, '11% OFF', True, 'madras-tiffin', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
            ('14-Mini Button Ghee Sambar Idli', '14-mini-button-ghee-sambar-idli', '14 bite-sized fluffy idlis submerged in piping hot shallot sambar.', 140.00, 160.00, '12% OFF', True, 'madras-tiffin', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
            ('Chettinad Onion Rava Masala Dosa', 'chettinad-onion-rava-masala-dosa', 'Semolina batter crisp lace dosa stuffed with spiced potato masala.', 175.00, 195.00, '10% OFF', True, 'madras-tiffin', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80'),
            ('Crispy Medu Vada Duo (2pcs)', 'crispy-medu-vada-duo', 'Crisp fried urad dal donuts served with coconut and tomato chutneys.', 90.00, 110.00, '18% OFF', True, 'madras-tiffin', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'),
            ('Kumbakonam Degree Filter Coffee', 'kumbakonam-degree-filter-coffee', 'Strong chicory drip coffee frothed with thick cows milk in brass davarah.', 60.00, 75.00, '20% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'),
            ('Melt-in-Mouth Ghee Mysore Pak', 'melt-in-mouth-ghee-mysore-pak', 'Velvety gram flour confectionery soaked in pure fragrant desi ghee.', 120.00, 140.00, '14% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 7: OMR Tech Bowl Lab
        [
            ('Avocado & Edamame Kinetic Glow Bowl', 'avocado-edamame-kinetic-glow-bowl', 'Hass avocado, purple quinoa, edamame, pomegranate, tahini drizzle.', 320.00, 360.00, '11% OFF', True, 'cyber-bowls', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
            ('Grilled Teriyaki Chicken Macro Bowl', 'grilled-teriyaki-chicken-macro-bowl', 'Lean grilled chicken breast, brown rice, broccoli florets, sesame seeds.', 340.00, 380.00, '10% OFF', False, 'cyber-bowls', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'),
            ('Crispy Tofu & Peanut Satay Bowl', 'crispy-tofu-peanut-satay-bowl', 'Glazed tofu cubes, zucchini noodles, peanut dressing, crushed cashews.', 290.00, 320.00, '10% OFF', True, 'cyber-bowls', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'),
            ('Citrus Salmon Omega Power Bowl', 'citrus-salmon-omega-power-bowl', 'Pan-seared Norwegian salmon, wild greens, avocado, ponzu vinaigrette.', 480.00, 540.00, '11% OFF', False, 'cyber-bowls', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
            ('Blue Spirulina Electrolyte Cooler', 'blue-spirulina-electrolyte-cooler', 'Cold pressed coconut water, blue majik spirulina, lime, pink salt.', 160.00, 190.00, '15% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'),
            ('Raw Chia Seed Berry Pudding Pot', 'raw-chia-seed-berry-pudding-pot', 'Coconut milk chia pudding layered with organic strawberry compote.', 180.00, 210.00, '14% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 8: The Sweet Glitch Bakery
        [
            ('Molten Belgian Dark Chocolate Tart', 'molten-belgian-dark-chocolate-tart', '70% Valrhona dark chocolate lava cake encased in buttery shortcrust.', 240.00, 280.00, '14% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'),
            ('Japanese Fluffy Souffle Pancake', 'japanese-fluffy-souffle-pancake', 'Cloud-soft souffles with pure maple syrup, cultured butter and berries.', 260.00, 299.00, '13% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80'),
            ('Nitro Cold Brew Tiramisu Shake', 'nitro-cold-brew-tiramisu-shake', 'Cold drip concentrate blended with mascarpone cream and cocoa dust.', 210.00, 240.00, '12% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80'),
            ('Basque Burnt Caramel Cheesecake', 'basque-burnt-caramel-cheesecake', 'Caramelized top cheesecake with an ultra-creamy molten center.', 260.00, 290.00, '10% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80'),
            ('Chromatic Rainbow Macaron Box (5pcs)', 'chromatic-rainbow-macaron-box', 'Assorted Parisian almond shells: passionfruit, pistachio, raspberry, mocha.', 280.00, 320.00, '12% OFF', True, 'glitch-desserts', 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80'),
            ('Nitro Red Berry Sparkling Hibiscus', 'nitro-red-berry-sparkling-hibiscus', 'Cold steeped hibiscus flowers with carbonated strawberry fizz.', 160.00, 180.00, '11% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'),
        ],
        # Rest 9: Madras Spice Vault
        [
            ('Smoked Murgh Tikka Angara Platter', 'smoked-murgh-tikka-angara-platter', 'Succulent boneless chicken skewers smoked over charcoal and spices.', 340.00, 380.00, '10% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80'),
            ('Old Delhi Velvety Butter Chicken', 'old-delhi-velvety-butter-chicken', 'Tandoor grilled chicken simmered in rich tomato, butter & cashew gravy.', 360.00, 410.00, '12% OFF', False, 'chettinad-specials', 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80'),
            ('Smoky Paneer Tikka Masala Pot', 'smoky-paneer-tikka-masala-pot', 'Charred cottage cheese cubes cooked in spicy spiced capsicum gravy.', 310.00, 350.00, '11% OFF', True, 'chettinad-specials', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80'),
            ('Slow-Simmered Dal Makhani Vault', 'slow-simmered-dal-makhani-vault', 'Black urad lentils cooked overnight on tandoor with fresh churned butter.', 260.00, 290.00, '10% OFF', True, 'chettinad-specials', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'),
            ('Butter Garlic Naan Bread (2pcs)', 'butter-garlic-naan-bread', 'Clay oven charred leavened flatbreads brushed with butter and garlic.', 120.00, 140.00, '14% OFF', True, 'chettinad-specials', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'),
            ('Smoky Spiced Chaas Buttermilk', 'smoky-spiced-chaas-buttermilk', 'Churned curd tempered with roasted cumin, green chili, and black salt.', 80.00, 99.00, '19% OFF', True, 'nitro-drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'),
        ],
    ]

    all_seeded_foods = []
    for r_idx, food_list in enumerate(foods_blueprint):
        restaurant = seeded_restaurants[r_idx]
        for name, slug, desc, price, orig_p, disc, is_veg, cat_slug, img in food_list:
            cat = cat_map.get(cat_slug, cat_map['neon-burgers'])
            f_item, _ = FoodItem.objects.get_or_create(
                slug=slug,
                defaults={
                    'restaurant': restaurant,
                    'category': cat,
                    'name': name,
                    'short_description': desc,
                    'full_description': f"{desc} Prepared fresh to order with certified premium ingredients.",
                    'price': price,
                    'original_price': orig_p,
                    'discount': disc,
                    'is_veg': is_veg,
                    'spice_level': 2 if not is_veg else 1,
                    'prep_time_minutes': 15,
                    'ingredients': ['Chef Secret Spices', 'Organic Butter', 'Himalayan Salt'],
                    'allergens': ['Dairy'] if is_veg else ['Gluten', 'Dairy'],
                    'image': img,
                    'rating': 4.90,
                    'review_count': 120,
                    'is_available': True,
                    'is_featured': True,
                    'stock': 40
                }
            )
            # Add-ons
            FoodAddon.objects.get_or_create(food=f_item, name='Extra Truffle Melt', defaults={'price': 45.00})
            FoodAddon.objects.get_or_create(food=f_item, name='Spiced Crispy Dip', defaults={'price': 30.00})
            all_seeded_foods.append(f_item)

    print(f"   [+] Seeded {len(all_seeded_foods)} Distinct Food Items across 10 restaurants")

    # 6. SEED 20 ORDERS (Chennai Metro Area)
    # Statuses to distribute across
    status_flow = [
        'ON_THE_WAY', 'PREPARING', 'READY', 'ACCEPTED', 'ARRIVING',
        'DELIVERED', 'DELIVERED', 'DELIVERED', 'PLACED', 'ON_THE_WAY',
        'PREPARING', 'DELIVERED', 'READY', 'ON_THE_WAY', 'DELIVERED',
        'ACCEPTED', 'ARRIVING', 'DELIVERED', 'PLACED', 'ON_THE_WAY'
    ]

    seeded_orders = []
    for i in range(20):
        order_num = f"WS-CHN-{1001 + i}"
        rest = seeded_restaurants[i % len(seeded_restaurants)]
        rider = seeded_riders[i % len(seeded_riders)].user
        st = status_flow[i]
        
        # Select 2 food items from restaurant
        rest_foods = [f for f in all_seeded_foods if f.restaurant_id == rest.id]
        food_a = rest_foods[0] if rest_foods else all_seeded_foods[0]
        food_b = rest_foods[1] if len(rest_foods) > 1 else all_seeded_foods[1]

        item_total = float(food_a.price) + float(food_b.price)
        grand = round(item_total + 35.00 + 20.00 + 10.00 - 40.00, 2)

        order_obj, created = Order.objects.get_or_create(
            order_number=order_num,
            defaults={
                'customer': customer_user,
                'restaurant': rest,
                'rider': rider if st in ['ON_THE_WAY', 'ARRIVING', 'DELIVERED'] else None,
                'status': st,
                'otp': f"{7000 + i}",
                'item_total': item_total,
                'delivery_fee': 35.00,
                'taxes': 20.00,
                'platform_fee': 10.00,
                'discount': 40.00,
                'grand_total': grand,
                'payment_method': 'UPI (Google Pay / PhonePe)' if i % 2 == 0 else 'WS Food Balance Wallet',
                'payment_status': 'VERIFIED_PAID',
                'delivery_address_text': f"Flat {i+1}A, Cyber Residency, Chennai Metro",
                'cooking_instructions': 'Contact-free delivery, extra mint dip',
                'customer_lat': 13.0418 + (i * 0.003),
                'customer_lng': 80.2341 + (i * 0.002),
                'restaurant_lat': rest.latitude,
                'restaurant_lng': rest.longitude,
                'rider_lat': float(rest.latitude) + 0.004,
                'rider_lng': float(rest.longitude) + 0.003,
                'eta_minutes': 14 + (i % 15)
            }
        )
        if created:
            OrderItem.objects.create(order=order_obj, food_item=food_a, quantity=1, price=food_a.price)
            OrderItem.objects.create(order=order_obj, food_item=food_b, quantity=1, price=food_b.price)

        seeded_orders.append(order_obj)

    # Link active order to lead rider
    seeded_riders[0].active_order = seeded_orders[0]
    seeded_riders[0].save()

    print(f"   [+] Seeded {len(seeded_orders)} Orders across 7 operational statuses")

    # 7. SEED SHIFT SLOTS & SHIFT MANAGEMENT (Chennai Metro)
    slot_configs = [
        ('Morning Rush (6 AM - 11 AM)', 'MORNING', time(6, 0), time(11, 0), 1.0, False),
        ('Lunch Rush (11 AM - 3 PM)', 'LUNCH', time(11, 0), time(15, 0), 1.2, True),
        ('Evening Slot (3 PM - 7 PM)', 'EVENING', time(15, 0), time(19, 0), 1.0, False),
        ('Dinner Rush (7 PM - 11 PM)', 'DINNER', time(19, 0), time(23, 0), 1.5, True),
        ('Late Night (11 PM - 2 AM)', 'LATE_NIGHT', time(23, 0), time(2, 0), 1.2, True),
    ]

    today = timezone.now().date()
    zones = ['Chennai Central', 'Anna Nagar', 'T. Nagar', 'Adyar - Besant Nagar', 'OMR Cyber Corridor']

    created_slots = []
    for zone in zones:
        for s_name, s_type, s_start, s_end, mult, is_p in slot_configs:
            slot_obj, _ = ShiftSlot.objects.get_or_create(
                name=f"{s_name} - {zone}",
                defaults={
                    'slot_type': s_type,
                    'start_time': s_start,
                    'end_time': s_end,
                    'multiplier': mult,
                    'is_peak': is_p,
                    'zone': zone,
                    'zone_lat': 13.0827,
                    'zone_lng': 80.2707,
                    'geofence_radius_km': 5.0,
                    'max_capacity': 8
                }
            )
            created_slots.append(slot_obj)

    # Create shifts for the week and book lead rider into Lunch & Dinner shifts
    lead_lunch_slot = [s for s in created_slots if s.slot_type == 'LUNCH' and s.zone == 'Chennai Central'][0]
    lead_shift, _ = Shift.objects.get_or_create(
        slot=lead_lunch_slot,
        date=today,
        zone='Chennai Central',
        defaults={'capacity': 8, 'booked_count': 3}
    )

    booking, _ = ShiftBooking.objects.get_or_create(
        shift=lead_shift,
        rider=lead_rider,
        date=today,
        defaults={'status': 'CHECKED_IN'}
    )

    # Check-in lead rider
    checkin, _ = CheckIn.objects.get_or_create(
        booking=booking,
        rider=lead_rider,
        defaults={
            'check_in_lat': 13.0827,
            'check_in_lng': 80.2707,
            'is_late': False,
            'status': 'ACTIVE',
            'orders_delivered': 6,
            'shift_earnings': 840.00
        }
    )

    # Streak bonus for lead rider
    ShiftBonus.objects.get_or_create(
        rider=lead_rider,
        streak_count=5,
        defaults={'bonus_amount': 500.00, 'reason': '5 Completed Shifts Streak Bonus!', 'is_claimed': False}
    )

    print(f"   [+] Seeded {len(created_slots)} Shift Slots with Peak Multipliers & Capacity Controls")

    # 8. SEED SOCIAL CONTENT & REVIEWS
    SocialPost.objects.get_or_create(
        title='Madras Dum Biryani Special Weekend',
        defaults={
            'author': shop_user,
            'restaurant': seeded_restaurants[1],
            'caption': 'Our royal dum sealed claypot biryani is ready! Order now to taste authentic saffron bliss 🔥',
            'image': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            'likes_count': 420,
            'comments_count': 32
        }
    )

    SocialReel.objects.get_or_create(
        title='Sizzling Smash Wagyu at 500°F',
        defaults={
            'author': shop_user,
            'restaurant': seeded_restaurants[0],
            'caption': 'Pure kinetic flavor! Crispy edges, melted triple fontina 🍔',
            'video_url': 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-burger-with-french-fries-40893-large.mp4',
            'thumbnail': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
            'likes_count': 1240,
            'comments_count': 89,
            'views_count': 8400
        }
    )

    PhotoReview.objects.get_or_create(
        restaurant=seeded_restaurants[0],
        user=customer_user,
        defaults={
            'rating': 5.0,
            'comment': 'Best smashed wagyu in Chennai! Arrived boiling hot in 18 minutes. The truffle aioli is incredible.',
            'photos': ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'],
            'reply': 'Thank you Priya! Our kitchen team is thrilled you enjoyed the kinetic crisp.',
            'replied_at': timezone.now()
        }
    )

    # 9. SEED COUPONS & PROMOS
    Coupon.objects.get_or_create(code='CHENNAI50', defaults={'description': '50% Welcome Discount for Chennai Foodies', 'discount_percentage': 50, 'max_discount_amount': 150.00, 'min_order_value': 249.00})
    Coupon.objects.get_or_create(code='WSFREESHIP', defaults={'description': 'Free Delivery on Orders Above ₹199', 'discount_percentage': 15, 'max_discount_amount': 40.00, 'min_order_value': 199.00})
    Coupon.objects.get_or_create(code='PEAKBOOST', defaults={'description': 'Flat ₹75 OFF on Dinner Rush Orders', 'discount_percentage': 20, 'max_discount_amount': 75.00, 'min_order_value': 349.00})

    # 10. SECURITY AUDIT & TELEMETRY LOGS
    LoginActivity.objects.get_or_create(
        email='customer@wsfood.io',
        defaults={'user': customer_user, 'status': 'SUCCESS', 'ip_address': '127.0.0.1', 'user_agent': 'Mozilla/5.0 Chrome/130'}
    )
    SecurityAlert.objects.get_or_create(
        alert_type='SYSTEM_INITIALIZED',
        defaults={'severity': 'LOW', 'description': 'WS FOOD Chennai Metro cluster nodes online and synchronized.', 'is_resolved': True}
    )
    AuditLog.objects.get_or_create(
        action='System Initialized & Chennai Metro Cluster Seeded',
        defaults={'actor': admin_user, 'target_model': 'Ecosystem', 'target_id': 'CHENNAI_METRO_01'}
    )

    print("=================================================================")
    print("[SUCCESS] WS FOOD PRODUCTION DATABASE SEEDED FULLY!")
    print("   10 Restaurants, 60 Foods, 5 Riders, 20 Orders, 5 Shift Slots")
    print("   Demo Credentials:")
    print("     Customer:   customer@wsfood.io   / wsfood123")
    print("     Restaurant: shop@wsfood.io       / wsfood123")
    print("     Delivery:   rider@wsfood.io      / wsfood123 (OTP: 8492)")
    print("     Admin:      admin@wsfood.io      / wsfood123")
    print("=================================================================")

if __name__ == '__main__':
    seed()
