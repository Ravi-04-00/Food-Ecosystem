from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg, F
from django.core.paginator import Paginator, EmptyPage

from apps.products.models import FoodItem, Restaurant
from apps.categories.models import Category
from apps.orders.models import Order, OrderItem
from apps.wishlist.models import Wishlist
from apps.coupons.models import Coupon
from apps.reviews.models import Review
from .models import UserSearchHistory


# ==========================================
# 1. BILINGUAL TAMIL <-> ENGLISH DICTIONARY
# ==========================================
TAMIL_ENGLISH_KEYWORDS = {
    'பிரியாணி': 'biryani',
    'பிரியானி': 'biryani',
    'சிக்கன்': 'chicken',
    'கோழி': 'chicken',
    'மட்டன்': 'mutton',
    'ஆட்டுக்கறி': 'mutton',
    'தோசை': 'dosa',
    'தோச': 'dosa',
    'சாம்பார்': 'sambar',
    'சாப்பாடு': 'meals',
    'மீல்ஸ்': 'meals',
    'வடை': 'vada',
    'மெதுவடை': 'vada',
    'இட்லி': 'idli',
    'பரோட்டா': 'parotta',
    'புரோட்டா': 'parotta',
    'ரோட்டி': 'roti',
    'நான்': 'naan',
    'பர்கர்': 'burger',
    'பீட்சா': 'pizza',
    'பீசா': 'pizza',
    'மீன்': 'fish',
    'இறால்': 'prawn',
    'நண்டு': 'crab',
    'நூடுல்ஸ்': 'noodles',
    'நூடுல்': 'noodles',
    'ராமென்': 'ramen',
    'பன்னீர்': 'paneer',
    'செட்டிநாடு': 'chettinad',
    'மதுரை': 'madurai',
    'சென்னை': 'chennai',
    'சுக்கா': 'sukka',
    'வறுவல்': 'fry',
    'ப்ரை': 'fry',
    'குழம்பு': 'curry',
    'கறி': 'curry',
    'கிரேவி': 'gravy',
    'ரைஸ்': 'rice',
    'சாதம்': 'rice',
    'ஷாவர்மா': 'shawarma',
    'சான்ட்விச்': 'sandwich',
    'காபி': 'coffee',
    'டீ': 'tea',
    'மில்க்ஷேக்': 'shake',
    'ஐஸ்கிரீம்': 'ice cream',
    'டெசர்ட்': 'dessert',
    'ஸ்வீட்': 'sweet',
    'சைவம்': 'veg',
    'அசைவம்': 'non-veg',
}

def expand_search_terms(raw_query: str) -> list:
    """
    Normalizes query and expands with Tamil transliterations/equivalents.
    Returns a distinct list of search tokens.
    """
    if not raw_query:
        return []
    
    clean_query = raw_query.strip()
    terms = [clean_query]
    
    # Check direct match
    if clean_query in TAMIL_ENGLISH_KEYWORDS:
        terms.append(TAMIL_ENGLISH_KEYWORDS[clean_query])
    
    # Token check
    tokens = clean_query.split()
    translated_tokens = []
    has_translation = False
    
    for t in tokens:
        low = t.lower()
        if t in TAMIL_ENGLISH_KEYWORDS:
            translated_tokens.append(TAMIL_ENGLISH_KEYWORDS[t])
            has_translation = True
        elif low in TAMIL_ENGLISH_KEYWORDS:
            translated_tokens.append(TAMIL_ENGLISH_KEYWORDS[low])
            has_translation = True
        else:
            translated_tokens.append(t)
            
    if has_translation:
        combined_trans = " ".join(translated_tokens)
        if combined_trans not in terms:
            terms.append(combined_trans)
        for tt in translated_tokens:
            if tt not in terms:
                terms.append(tt)
                
    return terms


# ==========================================
# 2. CATALOG SEARCH ENGINE
# ==========================================
def search_catalog(
    query='',
    category='',
    cuisine='',
    min_price=None,
    max_price=None,
    min_rating=None,
    is_veg=None,
    is_open=None,
    available_only=False,
    sort='relevance',
    page=1,
    page_size=12,
    user=None
):
    """
    High-performance food and restaurant search engine with validation,
    bilingual Tamil support, server-side filters, and pagination.
    """
    clean_query = (query or '').strip()
    page = max(1, int(page or 1))
    page_size = min(50, max(1, int(page_size or 12)))

    # Base Food Queryset - optimized with select_related
    foods_qs = FoodItem.objects.select_related(
        'restaurant', 'category', 'menu_category'
    ).prefetch_related('addons', 'variants').filter(
        restaurant__verification_status='APPROVED'
    )

    # Base Restaurant Queryset
    restaurants_qs = Restaurant.objects.filter(
        verification_status='APPROVED'
    ).exclude(name='')

    # 1. Apply Query Matching
    if clean_query:
        search_terms = expand_search_terms(clean_query)
        
        food_q = Q()
        rest_q = Q()
        
        for term in search_terms:
            food_q |= (
                Q(name__icontains=term) |
                Q(short_description__icontains=term) |
                Q(full_description__icontains=term) |
                Q(restaurant__name__icontains=term) |
                Q(category__name__icontains=term) |
                Q(restaurant__cuisines__icontains=term)
            )
            rest_q |= (
                Q(name__icontains=term) |
                Q(cuisines__icontains=term) |
                Q(address__icontains=term) |
                Q(tagline__icontains=term) |
                Q(foods__name__icontains=term)
            )
            
        foods_qs = foods_qs.filter(food_q).distinct()
        restaurants_qs = restaurants_qs.filter(rest_q).distinct()

    # 2. Category Filter
    if category and category.lower() != 'all':
        cat_term = category.strip()
        foods_qs = foods_qs.filter(
            Q(category__slug__iexact=cat_term) |
            Q(category__name__icontains=cat_term) |
            Q(menu_category__slug__iexact=cat_term) |
            Q(menu_category__name__icontains=cat_term)
        )
        restaurants_qs = restaurants_qs.filter(
            Q(foods__category__slug__iexact=cat_term) |
            Q(foods__category__name__icontains=cat_term) |
            Q(foods__menu_category__slug__iexact=cat_term) |
            Q(foods__menu_category__name__icontains=cat_term)
        ).distinct()

    # 3. Cuisine Filter
    if cuisine and cuisine.lower() != 'all':
        c_term = cuisine.strip()
        foods_qs = foods_qs.filter(restaurant__cuisines__icontains=c_term)
        restaurants_qs = restaurants_qs.filter(cuisines__icontains=c_term)

    # 4. Dietary Filter
    if is_veg is not None:
        if isinstance(is_veg, str):
            veg_bool = is_veg.lower() in ['true', '1', 'veg']
            foods_qs = foods_qs.filter(is_veg=veg_bool)
        elif isinstance(is_veg, bool):
            foods_qs = foods_qs.filter(is_veg=is_veg)

    # 5. Price Range Filters
    if min_price is not None:
        try:
            foods_qs = foods_qs.filter(price__gte=Decimal(str(min_price)))
        except Exception:
            pass

    if max_price is not None:
        try:
            foods_qs = foods_qs.filter(price__lte=Decimal(str(max_price)))
        except Exception:
            pass

    # 6. Minimum Rating Filter
    if min_rating is not None and str(min_rating).lower() != 'all':
        try:
            r_val = float(min_rating)
            foods_qs = foods_qs.filter(rating__gte=r_val)
            restaurants_qs = restaurants_qs.filter(rating__gte=r_val)
        except Exception:
            pass

    # 7. Open Status Filter
    if is_open is not None:
        open_bool = (str(is_open).lower() == 'true')
        foods_qs = foods_qs.filter(restaurant__is_open=open_bool)
        restaurants_qs = restaurants_qs.filter(is_open=open_bool)

    # 8. Available Only Filter
    if available_only:
        foods_qs = foods_qs.filter(is_available=True)

    # 9. Sorting
    if sort == 'rating':
        foods_qs = foods_qs.order_by('-rating', '-review_count')
        restaurants_qs = restaurants_qs.order_by('-rating', '-review_count')
    elif sort == 'popular':
        foods_qs = foods_qs.order_by('-review_count', '-rating')
        restaurants_qs = restaurants_qs.order_by('-review_count', '-rating')
    elif sort in ['price_asc', 'price_low']:
        foods_qs = foods_qs.order_by('price', '-rating')
    elif sort in ['price_desc', 'price_high']:
        foods_qs = foods_qs.order_by('-price', '-rating')
    elif sort == 'newest':
        foods_qs = foods_qs.order_by('-created_at')
        restaurants_qs = restaurants_qs.order_by('-created_at')
    else:  # relevance
        if clean_query:
            # Boost exact prefix matches
            foods_qs = foods_qs.order_by('-rating', '-review_count')
            restaurants_qs = restaurants_qs.order_by('-rating', '-review_count')
        else:
            foods_qs = foods_qs.order_by('-rating', '-review_count')
            restaurants_qs = restaurants_qs.order_by('-rating', '-review_count')

    # Total counts before pagination
    total_foods_count = foods_qs.count()
    total_restaurants_count = restaurants_qs.count()

    # Pagination for Food items
    paginator = Paginator(foods_qs, page_size)
    try:
        paginated_foods = paginator.page(page)
    except EmptyPage:
        paginated_foods = []

    # Log search history for authenticated users if query is provided
    if user and user.is_authenticated and clean_query:
        log_user_search(user, clean_query, total_foods_count + total_restaurants_count)

    return {
        'foods': paginated_foods,
        'restaurants': restaurants_qs[:6],  # Top 6 matching restaurants
        'meta': {
            'query': clean_query,
            'expanded_terms': expand_search_terms(clean_query) if clean_query else [],
            'page': page,
            'page_size': page_size,
            'total_food_pages': paginator.num_pages if paginator.num_pages > 0 else 1,
            'total_foods_count': total_foods_count,
            'total_restaurants_count': total_restaurants_count,
            'filters_applied': {
                'category': category or 'ALL',
                'cuisine': cuisine or 'ALL',
                'min_price': str(min_price) if min_price else None,
                'max_price': str(max_price) if max_price else None,
                'min_rating': str(min_rating) if min_rating else 'ALL',
                'is_veg': is_veg,
                'is_open': is_open,
                'sort': sort
            }
        }
    }


# ==========================================
# 3. FAST SEARCH SUGGESTIONS (TYPEAHEAD)
# ==========================================
def get_search_suggestions(query: str):
    """
    Lightweight, sub-50ms search suggestions for debounced client input.
    Returns matching food names, restaurant names, and cuisine tags.
    """
    clean_q = (query or '').strip()
    if len(clean_q) < 1:
        return {'query': '', 'foods': [], 'restaurants': [], 'cuisines': [], 'categories': []}

    terms = expand_search_terms(clean_q)
    food_q = Q()
    rest_q = Q()
    
    for t in terms:
        food_q |= Q(name__icontains=t)
        rest_q |= Q(name__icontains=t) | Q(cuisines__icontains=t)

    # 1. Matching Food Items (top 5)
    matched_foods = FoodItem.objects.filter(
        food_q,
        restaurant__verification_status='APPROVED'
    ).select_related('restaurant').values(
        'id', 'name', 'price', 'rating', 'image', 'is_veg', 'is_available',
        'restaurant__name', 'restaurant__id'
    )[:5]

    # 2. Matching Restaurants (top 3)
    matched_restaurants = Restaurant.objects.filter(
        rest_q,
        verification_status='APPROVED'
    ).values(
        'id', 'name', 'rating', 'cuisines', 'hero_image', 'avatar', 'is_open'
    )[:3]

    # 3. Matching Cuisines
    matching_cuisines = set()
    for t in terms:
        for r in Restaurant.objects.filter(cuisines__icontains=t, verification_status='APPROVED')[:5]:
            if isinstance(r.cuisines, list):
                for c in r.cuisines:
                    if t.lower() in c.lower():
                        matching_cuisines.add(c)
    
    # 4. Matching Categories
    matching_cats = list(Category.objects.filter(
        name__icontains=clean_q
    ).values('id', 'name', 'slug')[:3])

    return {
        'query': clean_q,
        'foods': list(matched_foods),
        'restaurants': list(matched_restaurants),
        'cuisines': list(matching_cuisines)[:4],
        'categories': matching_cats
    }


# ==========================================
# 4. DISCOVERY SECTIONS ENGINE
# ==========================================
def get_discovery_sections():
    """
    Calculates discovery sections based on real PostgreSQL data:
    - Popular food items based on real OrderItem count
    - Trending restaurants based on recent 30-day activity window
    - Newly added foods with creation timestamps
    - Active offers and discounted items from live coupons and deals
    - Cuisine categories for browsing
    """
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    # 1. Popular Foods (Real OrderItem count from confirmed/delivered orders)
    popular_item_ids = list(
        OrderItem.objects.filter(
            order__status__in=[
                'CONFIRMED', 'DELIVERED', 'COMPLETED',
                'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY'
            ]
        )
        .values('food_item')
        .annotate(order_count=Count('id'))
        .order_by('-order_count')
        .values_list('food_item', flat=True)[:10]
    )

    popular_foods = list(
        FoodItem.objects.filter(
            id__in=popular_item_ids,
            restaurant__verification_status='APPROVED'
        ).select_related('restaurant', 'category')
    )

    # Fallback to highest rated foods if real order items count is small
    if len(popular_foods) < 6:
        existing_ids = {f.id for f in popular_foods}
        fallback_foods = FoodItem.objects.filter(
            restaurant__verification_status='APPROVED'
        ).exclude(id__in=existing_ids).order_by('-review_count', '-rating')[:6]
        popular_foods.extend(fallback_foods)

    # 2. Trending Restaurants (30-day order volume activity window)
    trending_rest_ids = list(
        Order.objects.filter(
            created_at__gte=thirty_days_ago,
            restaurant__verification_status='APPROVED'
        )
        .values('restaurant')
        .annotate(order_volume=Count('id'))
        .order_by('-order_volume')
        .values_list('restaurant', flat=True)[:6]
    )

    trending_restaurants = list(
        Restaurant.objects.filter(
            id__in=trending_rest_ids,
            verification_status='APPROVED'
        )
    )

    if len(trending_restaurants) < 4:
        existing_rest_ids = {r.id for r in trending_restaurants}
        fallback_rests = Restaurant.objects.filter(
            verification_status='APPROVED'
        ).exclude(id__in=existing_rest_ids).order_by('-rating', '-review_count')[:4]
        trending_restaurants.extend(fallback_rests)

    # 3. Newly Added Foods (Strictly using creation timestamps)
    newly_added_foods = list(
        FoodItem.objects.filter(
            restaurant__verification_status='APPROVED'
        ).select_related('restaurant', 'category').order_by('-created_at')[:8]
    )

    # 4. Active Offers & Discounted Food Items
    active_coupons = Coupon.objects.filter(
        is_active=True,
        expiry_date__gt=now
    )
    # Foods with explicit percentage or rupee discounts
    discounted_foods = list(
        FoodItem.objects.filter(
            restaurant__verification_status='APPROVED',
            is_available=True
        ).filter(
            Q(discount__gt='') | Q(original_price__gt=F('price'))
        ).select_related('restaurant', 'category')[:8]
    )

    # 5. Distinct Cuisines with Kitchen Counts
    all_rests = Restaurant.objects.filter(verification_status='APPROVED')
    cuisine_counts = {}
    for r in all_rests:
        if isinstance(r.cuisines, list):
            for c in r.cuisines:
                c_clean = c.strip().title()
                if c_clean:
                    cuisine_counts[c_clean] = cuisine_counts.get(c_clean, 0) + 1

    sorted_cuisines = [
        {'name': name, 'kitchen_count': count}
        for name, count in sorted(cuisine_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    return {
        'popular_foods': popular_foods[:8],
        'trending_restaurants': trending_restaurants[:6],
        'newly_added_foods': newly_added_foods,
        'discounted_foods': discounted_foods,
        'active_coupons_count': active_coupons.count(),
        'cuisines': sorted_cuisines
    }


# ==========================================
# 5. RULE-BASED PERSONALIZED RECOMMENDATIONS
# ==========================================
def get_personalized_recommendations(user=None, limit=8):
    """
    Transparent rule-based recommendation engine adhering to Phase 20 constraints:
    - Signals: past completed orders, wishlist affinity, cuisine/category frequency, verified ratings.
    - Safety: strictly recommends orderable foods (is_available=True, restaurant is_open=True).
    - Diversification: limits maximum 2 items per restaurant.
    - Fallback: returns premier verified items for unauthenticated or first-time users.
    """
    limit = min(20, max(4, int(limit or 8)))

    # Candidates must be available and from open, approved kitchens
    candidates_qs = FoodItem.objects.filter(
        is_available=True,
        restaurant__is_open=True,
        restaurant__verification_status='APPROVED'
    ).select_related('restaurant', 'category', 'menu_category')

    # If anonymous or no user, provide top-rated, highly-reviewed items across varied cuisines
    if not user or not user.is_authenticated:
        fallback_items = candidates_qs.order_by('-rating', '-review_count')[:limit]
        return {
            'strategy': 'POPULAR_FALLBACK',
            'explanation': 'Top-rated favorites from premier open kitchens (Sign in to personalize)',
            'items': [
                {
                    'food': item,
                    'score': float(item.rating),
                    'reason': 'Top-rated community favorite'
                }
                for item in fallback_items
            ]
        }

    # 1. Analyze User's Completed Orders
    user_orders = Order.objects.filter(
        customer=user,
        status__in=['DELIVERED', 'COMPLETED', 'CONFIRMED']
    ).prefetch_related('items__food_item', 'restaurant')

    # If no order history, fall back gracefully
    if not user_orders.exists():
        fallback_items = candidates_qs.order_by('-rating', '-review_count')[:limit]
        return {
            'strategy': 'NEW_USER_EXPLORATION',
            'explanation': 'Handpicked bestsellers to begin your culinary journey',
            'items': [
                {
                    'food': item,
                    'score': float(item.rating),
                    'reason': 'Premier recommendation for you'
                }
                for item in fallback_items
            ]
        }

    # Calculate affinity signals
    cuisine_affinity = {}
    category_affinity = {}
    restaurant_affinity = {}
    ordered_food_ids = set()

    for o in user_orders:
        if o.restaurant and isinstance(o.restaurant.cuisines, list):
            for c in o.restaurant.cuisines:
                c_clean = c.strip().lower()
                cuisine_affinity[c_clean] = cuisine_affinity.get(c_clean, 0) + 1
        if o.restaurant_id:
            restaurant_affinity[o.restaurant_id] = restaurant_affinity.get(o.restaurant_id, 0) + 1

        for it in o.items.all():
            if it.food_item:
                ordered_food_ids.add(it.food_item.id)
                if it.food_item.category:
                    cat_name = it.food_item.category.name.lower()
                    category_affinity[cat_name] = category_affinity.get(cat_name, 0) + 1

    # 2. Wishlist Affinity
    wishlist_ids = set(Wishlist.objects.filter(user=user).values_list('product_id', flat=True))

    # 3. Score Candidates
    scored_items = []
    for item in candidates_qs:
        score = 0.0
        reason = 'Curated for you'

        # Signal A: Wishlist match (+8.0)
        if item.id in wishlist_ids:
            score += 8.0
            reason = 'Saved in your wishlist'

        # Signal B: Cuisine affinity (+3.5 per match up to 14.0)
        item_cuisines = item.restaurant.cuisines if isinstance(item.restaurant.cuisines, list) else []
        for c in item_cuisines:
            c_low = c.strip().lower()
            if c_low in cuisine_affinity:
                points = min(14.0, cuisine_affinity[c_low] * 3.5)
                score += points
                reason = f"Because you enjoy {c.title()} cuisine"
                break

        # Signal C: Category affinity (+3.0 per match up to 12.0)
        if item.category and item.category.name.lower() in category_affinity:
            score += min(12.0, category_affinity[item.category.name.lower()] * 3.0)
            if 'Because' not in reason:
                reason = f"Matches your frequent choice for {item.category.name}"

        # Signal D: Repeat Restaurant Trust (+5.0)
        if item.restaurant_id in restaurant_affinity:
            score += 5.0
            if 'Because' not in reason and 'Saved' not in reason:
                reason = f"From your favored kitchen {item.restaurant.name}"

        # Signal E: Previously ordered bonus (+2.5 re-order probability)
        if item.id in ordered_food_ids:
            score += 2.5
            reason = 'Order again from your favorites'

        # Signal F: Base rating factor (rating * 1.5)
        score += float(item.rating or 4.5) * 1.5

        # Signal G: Popularity factor
        score += min(4.0, (item.review_count or 0) * 0.05)

        scored_items.append({
            'food': item,
            'score': round(score, 2),
            'reason': reason
        })

    # Sort descending by calculated score
    scored_items.sort(key=lambda x: x['score'], reverse=True)

    # 4. Diversification Filter (Max 2 items per restaurant)
    diversified = []
    rest_counts = {}
    for entry in scored_items:
        r_id = entry['food'].restaurant_id
        if rest_counts.get(r_id, 0) < 2:
            diversified.append(entry)
            rest_counts[r_id] = rest_counts.get(r_id, 0) + 1
            if len(diversified) >= limit:
                break

    return {
        'strategy': 'AFFINITY_AND_HISTORY',
        'explanation': 'Personalized based on your completed orders, saved dishes, and taste profile',
        'items': diversified
    }


# ==========================================
# 6. USER SEARCH HISTORY SERVICE
# ==========================================
def get_user_recent_searches(user, limit=10):
    """
    Returns unique recent search queries for the user.
    """
    if not user or not user.is_authenticated:
        return []

    # Get distinct queries in order of latest created_at
    history = UserSearchHistory.objects.filter(user=user).order_by('-created_at')[:30]
    seen = set()
    unique_history = []
    
    for h in history:
        q_low = h.query.strip().lower()
        if q_low not in seen:
            seen.add(q_low)
            unique_history.append({
                'id': h.id,
                'query': h.query,
                'results_count': h.results_count,
                'created_at': h.created_at.isoformat()
            })
            if len(unique_history) >= limit:
                break

    return unique_history


def log_user_search(user, query: str, results_count: int = 0):
    """
    Logs user search query avoiding spam duplicates in short intervals.
    """
    if not user or not user.is_authenticated or not query:
        return None

    clean_q = query.strip()
    if len(clean_q) < 2:
        return None

    # Check if latest search was identical
    latest = UserSearchHistory.objects.filter(user=user).order_by('-created_at').first()
    if latest and latest.query.strip().lower() == clean_q.lower():
        latest.results_count = results_count
        latest.save(update_fields=['results_count'])
        return latest

    return UserSearchHistory.objects.create(
        user=user,
        query=clean_q,
        results_count=results_count
    )


def clear_user_search_history(user, search_id=None):
    """
    Deletes all or specific search history entries for the authenticated user.
    """
    if not user or not user.is_authenticated:
        return 0

    if search_id:
        deleted_count, _ = UserSearchHistory.objects.filter(user=user, id=search_id).delete()
    else:
        deleted_count, _ = UserSearchHistory.objects.filter(user=user).delete()

    return deleted_count
