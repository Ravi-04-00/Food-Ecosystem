import { ApiError, extractErrorMessage, normalizeApiError, safeFetchWithRetry } from './apiErrors.js';
export { ApiError, extractErrorMessage, normalizeApiError, safeFetchWithRetry };

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const isStandardPort = window.location.port === '' || window.location.port === '80' || window.location.port === '443';
    if (isStandardPort) {
      return '/api';
    }
  }
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

// Fallback Cyberpunk Food Data
export const FALLBACK_FOODS = [
  {
    id: 1,
    name: 'Quantum Double Glaze Burger',
    restaurant_name: 'CYBER SMASH BURGERS 2099',
    category_name: 'Neon Burgers',
    price: 349.00,
    original_price: 399.00,
    discount: '12% OFF',
    is_veg: false,
    spice_level: 2,
    prep_time_minutes: 14,
    rating: 4.95,
    review_count: 142,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    short_description: 'Double smashed wagyu patties, smoked chipotle glaze, cheddar melt on activated charcoal brioche.',
    full_description: 'Precision smash-grilled at 500°F. Caramelized edges, molten aged cheddar, artisan black brioche bun with smoked chipotle glaze.',
    ingredients: ['Double Wagyu Patty', 'Charcoal Brioche', 'Aged Cheddar', 'Smoked Glaze', 'Crispy Shallots'],
    allergens: ['Gluten', 'Dairy'],
    addons: [
      { id: 101, name: 'Truffle Aioli Dip', price: 45.00 },
      { id: 102, name: 'Extra Cheddar Glaze', price: 50.00 }
    ]
  },
  {
    id: 2,
    name: 'Tokyo Nitro Black Ramen',
    restaurant_name: 'NEO TOKYO NOODLE LAB',
    category_name: 'Cyber Bowls',
    price: 399.00,
    original_price: 450.00,
    discount: '10% OFF',
    is_veg: false,
    spice_level: 2,
    prep_time_minutes: 18,
    rating: 4.96,
    review_count: 210,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    short_description: 'Rich 16hr pork broth, roasted black garlic oil, ajitsuke tamago egg, handmade wavy noodles.',
    full_description: 'Traditional kinetic boiling meets modern nitro aeration for an unctuous, rich collagen broth paired with springy rye noodles.',
    ingredients: ['Tonkotsu Broth', 'Handmade Noodles', 'Black Garlic Oil', 'Nitama Egg', 'Chashu Pork'],
    allergens: ['Gluten', 'Egg', 'Soy'],
    addons: [
      { id: 201, name: 'Extra Ajitsuke Egg', price: 40.00 },
      { id: 202, name: 'Spicy Chili Paste Bomb', price: 30.00 }
    ]
  },
  {
    id: 3,
    name: 'Cyber Smoked Dum Biryani',
    restaurant_name: 'KINETIC BIRYANI VAULT',
    category_name: 'Kinetic Biryani',
    price: 329.00,
    original_price: 380.00,
    discount: '15% OFF',
    is_veg: false,
    spice_level: 3,
    prep_time_minutes: 20,
    rating: 4.98,
    review_count: 380,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    short_description: 'Slow-steamed aged basmati layered with tender chicken thigh, saffron mist, and fried shallots.',
    full_description: 'Clay pot dum-cooked with genuine royal saffron strands and cold-pressed spice oils for unforgettable fragrant layers.',
    ingredients: ['Basmati Rice', 'Farm Chicken', 'Saffron', 'Kewra Water', 'Caramelized Onion'],
    allergens: ['Dairy'],
    addons: [
      { id: 301, name: 'Burani Garlic Raita', price: 35.00 },
      { id: 302, name: 'Mirchi Ka Salan Cup', price: 40.00 }
    ]
  },
  {
    id: 4,
    name: 'Crispy Truffle Shroom Burger',
    restaurant_name: 'CYBER SMASH BURGERS 2099',
    category_name: 'Neon Burgers',
    price: 299.00,
    original_price: 349.00,
    discount: '15% OFF',
    is_veg: true,
    spice_level: 1,
    prep_time_minutes: 12,
    rating: 4.88,
    review_count: 98,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    short_description: 'Crisp panko portobello with black truffle aioli, arugula, and slow-melt fontina cheese.',
    full_description: 'Golden crust panko portobello cap stuffed with fontina cheese that oozes at first bite. Infused with black summer truffle oils.',
    ingredients: ['Portobello Mushroom', 'Truffle Aioli', 'Fontina Cheese', 'Arugula', 'Sesame Bun'],
    allergens: ['Gluten', 'Dairy'],
    addons: [
      { id: 401, name: 'Extra Truffle Aioli', price: 45.00 }
    ]
  },
  {
    id: 5,
    name: 'Electric Cyan Nitro Cold Brew',
    restaurant_name: 'CYBER SMASH BURGERS 2099',
    category_name: 'Nitro Drinks',
    price: 180.00,
    original_price: 220.00,
    discount: '18% OFF',
    is_veg: true,
    spice_level: 0,
    prep_time_minutes: 4,
    rating: 4.91,
    review_count: 115,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    short_description: 'Velvety cold brew infused with nitrogen micro-bubbles and blue spirulina coconut cream float.',
    full_description: 'Smooth, naturally sweet nitrogen-cascading cold brew topped with vivid cyan organic spirulina froth.',
    ingredients: ['Cold Brew Coffee', 'Liquid Nitrogen', 'Blue Spirulina', 'Coconut Cream'],
    allergens: [],
    addons: []
  },
  {
    id: 6,
    name: 'Molecular Matcha Lava Tart',
    restaurant_name: 'NEO TOKYO NOODLE LAB',
    category_name: 'Glitch Desserts',
    price: 240.00,
    original_price: 280.00,
    discount: '15% OFF',
    is_veg: true,
    spice_level: 0,
    prep_time_minutes: 10,
    rating: 4.94,
    review_count: 188,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    short_description: 'Uji ceremonial matcha flowing warm center encased in dark cocoa shortcrust pastry.',
    full_description: 'Crisp French cocoa butter crust concealing a molten vivid green ceremonial tea ganache. Garnished with edible gold flakes.',
    ingredients: ['Ceremonial Matcha', 'Valrhona Cocoa Crust', 'White Chocolate Core', 'Gold Dust'],
    allergens: ['Dairy', 'Gluten', 'Egg'],
    addons: []
  }
];

export const FALLBACK_RESTAURANTS = [
  {
    id: 1,
    name: 'CYBER SMASH BURGERS 2099',
    tagline: 'Charcoal-Brioche Gourmet Smash Engineering',
    cuisines: ['Cyber Burgers', 'Truffle Fries', 'Shakes'],
    rating: 4.9,
    review_count: 382,
    delivery_time_text: '18-22 min',
    price_for_two: '₹450 for two',
    hero_image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    is_open: true,
    address: 'Grid 4, Tech Corridor, Neo Bengaluru'
  },
  {
    id: 2,
    name: 'NEO TOKYO NOODLE LAB',
    tagline: 'Authentic Kinetic Ramen & Craft Broths',
    cuisines: ['Ramen', 'Gyoza', 'Bao', 'Matcha'],
    rating: 4.85,
    review_count: 264,
    delivery_time_text: '22-28 min',
    price_for_two: '₹550 for two',
    hero_image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    is_open: true,
    address: 'Level 2, Cyber Skywalk, Indiranagar Grid'
  },
  {
    id: 3,
    name: 'KINETIC BIRYANI VAULT',
    tagline: 'Dum-Sealed Royal Spice Heritage',
    cuisines: ['Nawabi Dum Biryani', 'Kebabs', 'Mirchi Ka Salan'],
    rating: 4.92,
    review_count: 512,
    delivery_time_text: '25-30 min',
    price_for_two: '₹500 for two',
    hero_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    is_open: true,
    address: 'Vault 12, Spice District, Koramangala Grid'
  }
];

export const FALLBACK_REELS = [
  {
    id: 1,
    title: 'Smashing the Cyber Wagyu Patty at 500°F',
    caption: 'Watch that glorious crust develop on our chrome griddle! Pure kinetic flavor 🔥',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-burger-with-french-fries-40893-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    restaurant_name: 'CYBER SMASH BURGERS 2099',
    food_name: 'Quantum Double Glaze Burger',
    food_price: 349.00,
    likes_count: 842,
    comments_count: 64,
    audio_title: 'Cyber Beat - Griddle Sizzle #01'
  },
  {
    id: 2,
    title: 'Pouring Liquid Gold Tonkotsu Broth',
    caption: '16 hours of extraction for the silkiest broth in the district 🍜',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-serving-delicious-ramen-soup-41005-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    restaurant_name: 'NEO TOKYO NOODLE LAB',
    food_name: 'Tokyo Nitro Black Ramen',
    food_price: 399.00,
    likes_count: 1240,
    comments_count: 98,
    audio_title: 'Neo Tokyo Nights - Lofi Kitchen'
  },
  {
    id: 3,
    title: 'Breaking the Saffron Dum Clay Seal',
    caption: 'The aroma released when breaking the kinetic clay seal is unbeatable! ✨',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-steam-rising-from-a-hot-dish-43302-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    restaurant_name: 'KINETIC BIRYANI VAULT',
    food_name: 'Cyber Smoked Dum Biryani',
    food_price: 329.00,
    likes_count: 1950,
    comments_count: 142,
    audio_title: 'Kinetic Saffron - Royal Beats'
  }
];

export const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Biryani', slug: 'kinetic-biryani', icon: '🍛', product_count: 4 },
  { id: 2, name: 'Burgers', slug: 'neon-burgers', icon: '🍔', product_count: 5 },
  { id: 3, name: 'Pizza', slug: 'quantum-pizza', icon: '🍕', product_count: 5 },
  { id: 4, name: 'Bowls', slug: 'cyber-bowls', icon: '🍜', product_count: 9 },
  { id: 5, name: 'South Indian', slug: 'chettinad-specials', icon: '🥘', product_count: 15 },
  { id: 6, name: 'Tiffin', slug: 'madras-tiffin', icon: '☕', product_count: 6 },
  { id: 7, name: 'Desserts', slug: 'glitch-desserts', icon: '🍰', product_count: 8 },
  { id: 8, name: 'Drinks', slug: 'nitro-drinks', icon: '🥤', product_count: 8 }
];

export const extractList = (data, fallback = []) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return fallback;
};

export const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories/`);
    if (!res.ok) throw new Error('Categories API failed');
    const data = await res.json();
    const list = extractList(data, FALLBACK_CATEGORIES);
    return list.length > 0 ? list : FALLBACK_CATEGORIES;
  } catch (err) {
    console.warn('API error in fetchCategories, using fallbacks:', err);
    return FALLBACK_CATEGORIES;
  }
};

export const fetchFoods = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'ALL' && params.category !== 'all') query.set('category', params.category);
    if (params.veg_only) query.set('veg_only', 'true');
    if (params.non_veg_only) query.set('non_veg_only', 'true');
    if (params.dietary && params.dietary !== 'ALL') query.set('dietary', params.dietary);
    if (params.max_price) query.set('max_price', params.max_price);
    if (params.min_rating) query.set('min_rating', params.min_rating);
    if (params.restaurant) query.set('restaurant', params.restaurant);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page);
    if (params.is_available !== undefined && params.is_available !== null) query.set('is_available', params.is_available);

    const queryString = query.toString();
    const url = `${API_BASE}/foods/${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Foods API failed');
    const data = await res.json();
    return {
      results: extractList(data, FALLBACK_FOODS),
      count: data?.count || (Array.isArray(data) ? data.length : FALLBACK_FOODS.length),
      next: data?.next || null,
      previous: data?.previous || null
    };
  } catch (err) {
    console.warn('API error in fetchFoods, using fallbacks:', err);
    return {
      results: FALLBACK_FOODS,
      count: FALLBACK_FOODS.length,
      next: null,
      previous: null
    };
  }
};

export const fetchRestaurants = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'ALL' && params.category !== 'all') query.set('category', params.category);
    if (params.cuisine && params.cuisine !== 'ALL' && params.cuisine !== 'all') query.set('cuisine', params.cuisine);
    if (params.is_open !== undefined && params.is_open !== null) query.set('is_open', params.is_open);
    if (params.min_rating) query.set('min_rating', params.min_rating);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page);

    const queryString = query.toString();
    const url = `${API_BASE}/restaurants/${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Restaurants API failed');
    const data = await res.json();
    return {
      results: extractList(data, FALLBACK_RESTAURANTS),
      count: data?.count || (Array.isArray(data) ? data.length : FALLBACK_RESTAURANTS.length),
      next: data?.next || null,
      previous: data?.previous || null
    };
  } catch (err) {
    console.warn('API error in fetchRestaurants, using fallbacks:', err);
    return {
      results: FALLBACK_RESTAURANTS,
      count: FALLBACK_RESTAURANTS.length,
      next: null,
      previous: null
    };
  }
};

export const fetchRestaurantDetail = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/restaurants/${id}/`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('This restaurant is currently unavailable.');
      }
      throw new Error('Failed to fetch restaurant details');
    }
    return await res.json();
  } catch (err) {
    console.warn(`API error in fetchRestaurantDetail(${id}):`, err);
    const found = FALLBACK_RESTAURANTS.find(r => r.id === Number(id));
    if (found) {
      return {
        ...found,
        menu_categories: [
          { id: 1, name: 'Chef Specials', count: 3 },
          { id: 2, name: 'Popular Combos', count: 2 }
        ],
        foods: FALLBACK_FOODS.filter(f => f.restaurant_name === found.name)
      };
    }
    throw err;
  }
};

export const fetchFoodDetail = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/foods/${id}/`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('This food item is currently unavailable.');
      }
      throw new Error('Failed to fetch food details');
    }
    return await res.json();
  } catch (err) {
    console.warn(`API error in fetchFoodDetail(${id}):`, err);
    const found = FALLBACK_FOODS.find(f => f.id === Number(id));
    if (found) return found;
    throw err;
  }
};

export const fetchReels = async () => {
  try {
    const res = await fetch(`${API_BASE}/social/reels/`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    const list = extractList(data, FALLBACK_REELS);
    return list.length > 0 ? list : FALLBACK_REELS;
  } catch (err) {
    console.warn('API error in fetchReels, using fallbacks:', err);
    return FALLBACK_REELS;
  }
};

export const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_BASE}/orders/`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return extractList(data, []);
  } catch (err) {
    console.warn('API error in fetchOrders, using empty list:', err);
    return [];
  }
};

export const queryAIAssistant = async (query) => {
  try {
    const res = await fetch(`${API_BASE}/foods/ai/assistant/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('AI API failed');
    return await res.json();
  } catch {
    // Intelligent local fallback
    const q = query.toLowerCase();
    const matched = FALLBACK_FOODS.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.category_name.toLowerCase().includes(q) ||
      (q.includes('veg') && f.is_veg) ||
      (q.includes('spicy') && f.spice_level >= 2)
    );
    return {
      query,
      reply: `⚡ Neural Kitchen processed: '${query}'. Found ${matched.length || 3} optimal culinary matches dispatched via hyper-speed delivery route.`,
      recommended_foods: matched.length ? matched : FALLBACK_FOODS.slice(0, 3),
      predicted_eta: '18-24 mins',
      cyber_score: 99.4
    };
  }
};

export const createOrder = async (orderData) => {
  try {
    const res = await fetch(`${API_BASE}/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Order creation failed');
    return await res.json();
  } catch {
    // Fallback simulation
    return {
      id: Math.floor(Math.random() * 9000) + 1000,
      order_number: `WS-${Math.floor(Math.random() * 8999) + 1000}-CYBER`,
      status: 'ON_THE_WAY',
      otp: '8492',
      grand_total: orderData.grand_total || 725.40,
      eta_minutes: 19,
      customer_lat: 12.9716,
      customer_lng: 77.5946,
      rider_lat: 12.9752,
      rider_lng: 77.5980,
      restaurant_name: 'CYBER SMASH BURGERS 2099',
      payment_method: orderData.payment_method || 'Cyber UPI'
    };
  }
};

export const registerCustomer = async (formData) => {
  const isFormData = formData instanceof FormData;
  const res = await fetch(`${API_BASE}/auth/register/customer/`, {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? formData : JSON.stringify(formData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data;
};

export const loginCustomer = async (identifier, password) => {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password,
      role: 'CUSTOMER'
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data;
};

export const fetchCurrentUser = async (token) => {
  const res = await fetch(`${API_BASE}/auth/me/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }
  return await res.json();
};

export const refreshAccessToken = async (refreshToken) => {
  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken })
  });
  if (!res.ok) {
    throw new Error('Failed to refresh token');
  }
  return await res.json();
};

export const clearCustomerAuthData = () => {
  localStorage.removeItem('fd_customer_token');
  localStorage.removeItem('fd_customer_refresh');
  localStorage.removeItem('fd_customer_user');
  localStorage.removeItem('fd_access_token');
  localStorage.removeItem('fd_refresh_token');
};

export const logoutCustomer = async (refreshToken) => {
  try {
    const token = refreshToken || localStorage.getItem('fd_customer_refresh') || localStorage.getItem('fd_refresh_token');
    const access = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (access) headers['Authorization'] = `Bearer ${access}`;

    await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: token })
    });
  } catch (err) {
    // Graceful network offline handling
  } finally {
    clearCustomerAuthData();
  }
  return { success: true, message: 'You have been logged out successfully.' };
};

// Concurrency-safe refresh mutex to prevent duplicate refresh calls & loops
let activeCustomerRefreshPromise = null;

export const fetchWithAuth = async (url, options = {}, onSessionExpired) => {
  const accessToken = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');

  const headers = new Headers(options.headers || {});
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const modifiedOptions = { ...options, headers };
  const response = await fetch(url, modifiedOptions);

  // If 401 Unauthorized, attempt refresh once
  if (response.status === 401 && !options._retry) {
    const refreshToken = localStorage.getItem('fd_customer_refresh') || localStorage.getItem('fd_refresh_token');
    if (!refreshToken) {
      clearCustomerAuthData();
      if (onSessionExpired) onSessionExpired();
      return response;
    }

    // Prevent multiple concurrent refresh requests
    if (!activeCustomerRefreshPromise) {
      activeCustomerRefreshPromise = refreshAccessToken(refreshToken)
        .then(data => {
          if (data && data.access) {
            localStorage.setItem('fd_customer_token', data.access);
            localStorage.setItem('fd_access_token', data.access);
            if (data.refresh) {
              localStorage.setItem('fd_customer_refresh', data.refresh);
              localStorage.setItem('fd_refresh_token', data.refresh);
            }
            return data.access;
          }
          throw new Error('Refresh failed');
        })
        .catch(err => {
          clearCustomerAuthData();
          if (onSessionExpired) onSessionExpired();
          throw err;
        })
        .finally(() => {
          activeCustomerRefreshPromise = null;
        });
    }

    try {
      const newAccessToken = await activeCustomerRefreshPromise;
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      return await fetch(url, { ...options, headers: retryHeaders, _retry: true });
    } catch {
      if (onSessionExpired) onSessionExpired();
      return response;
    }
  }

  return response;
};

// ---------------------------------------------------------------------------
// Phase 5: Real-Life Profile Management API
// ---------------------------------------------------------------------------

export const fetchCustomerProfile = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load customer profile');
  }
  return await res.json();
};

export const updateCustomerProfile = async (formDataOrData) => {
  const isFormData = typeof FormData !== 'undefined' && formDataOrData instanceof FormData;
  const options = {
    method: 'PATCH',
    body: isFormData ? formDataOrData : JSON.stringify(formDataOrData)
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to update profile');
    const err = new Error(msg);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
};

export const deleteCustomerProfilePhoto = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/photo/`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove profile photo');
  }
  return await res.json();
};

// ---------------------------------------------------------------------------
// Phase 6: Real-Life Settings & Preferences API
// ---------------------------------------------------------------------------

export const fetchUserSettings = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/settings/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load user settings');
  }
  return await res.json();
};

export const updateUserSettings = async (settingsData) => {
  const res = await fetchWithAuth(`${API_BASE}/auth/settings/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to update settings');
    const err = new Error(msg);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 9: Real-Life Cart & Food Customization API
// ---------------------------------------------------------------------------

export const fetchCustomerCart = async () => {
  const res = await fetchWithAuth(`${API_BASE}/cart/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to load cart');
  }
  return await res.json();
};

export const apiAddToCart = async ({ food_id, quantity = 1, variant_id = null, addon_ids = [], special_instructions = '', clear_cart = false }) => {
  const res = await fetchWithAuth(`${API_BASE}/cart/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      food_id,
      quantity,
      variant_id,
      addon_ids,
      special_instructions,
      clear_cart
    })
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    // Single Restaurant conflict
    const conflictErr = new Error(data.message || 'Cart contains items from another restaurant');
    conflictErr.conflict = true;
    conflictErr.current_restaurant = data.current_restaurant;
    conflictErr.new_restaurant = data.new_restaurant;
    throw conflictErr;
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to add item to cart');
  }
  return data;
};

export const apiUpdateCartItem = async (itemId, { quantity, delta }) => {
  const payload = {};
  if (quantity !== undefined) payload.quantity = quantity;
  if (delta !== undefined) payload.delta = delta;

  const res = await fetchWithAuth(`${API_BASE}/cart/items/${itemId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to update cart item');
  }
  return data;
};

export const apiRemoveCartItem = async (itemId) => {
  const res = await fetchWithAuth(`${API_BASE}/cart/items/${itemId}/`, {
    method: 'DELETE'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to remove cart item');
  }
  return data;
};

export const apiClearCustomerCart = async () => {
  const res = await fetchWithAuth(`${API_BASE}/cart/clear/`, {
    method: 'POST'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to clear cart');
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 9: Real-Life Delivery Address Foundation API
// ---------------------------------------------------------------------------

export const fetchCustomerAddresses = async () => {
  const res = await fetchWithAuth(`${API_BASE}/accounts/addresses/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to load addresses');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const createCustomerAddress = async (addressData) => {
  const res = await fetchWithAuth(`${API_BASE}/accounts/addresses/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addressData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldErrors = data.errors && typeof data.errors === 'object' ? data.errors : data;
    const firstFieldError = fieldErrors && typeof fieldErrors === 'object'
      ? Object.values(fieldErrors).flat().find(v => typeof v === 'string')
      : null;
    const msg = data.error || data.message || data.detail || firstFieldError || 'Failed to save address';
    const err = new Error(msg);
    err.errors = data.errors || data;
    throw err;
  }
  return data;
};

export const updateCustomerAddress = async (addressId, addressData) => {
  const res = await fetchWithAuth(`${API_BASE}/accounts/addresses/${addressId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addressData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const firstFieldError = data && typeof data === 'object'
      ? Object.values(data).flat().find(v => typeof v === 'string')
      : null;
    const msg = data.error || data.message || data.detail || firstFieldError || 'Failed to update address';
    const err = new Error(msg);
    err.errors = data.errors || data;
    throw err;
  }
  return data;
};

export const deleteCustomerAddress = async (addressId) => {
  const res = await fetchWithAuth(`${API_BASE}/accounts/addresses/${addressId}/`, {
    method: 'DELETE'
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || 'Failed to delete address');
  }
  return { success: true };
};

export const setDefaultCustomerAddress = async (addressId) => {
  const res = await fetchWithAuth(`${API_BASE}/accounts/addresses/${addressId}/set-default/`, {
    method: 'POST'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to set default address');
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 10: Customer App — Checkout, Order Creation & Order Status Foundation
// ---------------------------------------------------------------------------

export const apiCheckoutOrder = async ({ 
  address_id, 
  payment_method = 'UPI (Instant)', 
  cooking_instructions = '',
  coupon_code = '',
  points_to_redeem = 0 
}) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/checkout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address_id,
      payment_method,
      cooking_instructions,
      coupon_code: coupon_code ? String(coupon_code).trim().toUpperCase() : '',
      points_to_redeem: Number(points_to_redeem) || 0
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || 'Failed to place order';
    const err = new Error(errorMsg);
    err.data = data;
    throw err;
  }
  return data;
};

export const fetchCustomerOrders = async (filterType = 'all') => {
  let url = `${API_BASE}/orders/`;
  if (filterType && filterType !== 'all') {
    url += `?filter=${encodeURIComponent(filterType)}`;
  }
  const res = await fetchWithAuth(url, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch orders');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const fetchCustomerOrderDetail = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to load order details');
  }
  return await res.json();
};

export const apiCancelCustomerOrder = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/cancel/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to cancel order');
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 14: Food Delivery Platform — Secure Online Payments & Webhooks
// ---------------------------------------------------------------------------

export const apiInitializePayment = async ({ order_id, payment_method = 'UPI' }) => {
  const res = await fetchWithAuth(`${API_BASE}/payments/initialize/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id,
      payment_method
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.detail || 'Failed to initialize payment gateway';
    const err = new Error(errorMsg);
    err.data = data;
    throw err;
  }
  return data;
};

export const apiVerifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const res = await fetchWithAuth(`${API_BASE}/payments/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.detail || 'Payment verification failed: cryptographic signature mismatch';
    const err = new Error(errorMsg);
    err.data = data;
    throw err;
  }
  return data;
};

export const apiReportPaymentFailure = async ({ provider_order_id, error_code, error_description, reason }) => {
  const res = await fetchWithAuth(`${API_BASE}/payments/failure/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider_order_id,
      error_code: error_code || 'CHECKOUT_CANCELLED',
      error_description: error_description || reason || 'Payment checkout cancelled by user',
      reason: reason || error_description || 'Payment checkout cancelled'
    })
  });
  return await res.json().catch(() => ({}));
};

export const apiFetchPaymentStatus = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/payments/status/${orderId}/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to load payment status');
  }
  return await res.json();
};

// ---------------------------------------------------------------------------
// Phase 15: Google Maps Integration + Live GPS Order Tracking
// ---------------------------------------------------------------------------

export const fetchOrderTracking = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/tracking/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to fetch live tracking details');
    err.status = res.status;
    throw err;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 17: Smart Notifications Center and Messaging Infrastructure
// ---------------------------------------------------------------------------

export const fetchNotifications = async ({ page = 1, unread_only = false, event_type = '', notification_type = '' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (unread_only) params.append('unread_only', 'true');
  if (event_type) params.append('event_type', event_type);
  if (notification_type) params.append('notification_type', notification_type);

  const res = await fetchWithAuth(`${API_BASE}/notifications/?${params.toString()}`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch notifications');
  }
  return data;
};

export const fetchNotificationUnreadCount = async () => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/unread-count/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({ unread_count: 0 }));
  if (!res.ok) {
    return { unread_count: 0 };
  }
  return data;
};

export const markNotificationRead = async (notificationId) => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/${notificationId}/read/`, {
    method: 'PATCH'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark notification as read');
  }
  return data;
};

export const markAllNotificationsRead = async () => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/mark-all-read/`, {
    method: 'POST'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark all notifications as read');
  }
  return data;
};

export const dismissNotification = async (notificationId) => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/${notificationId}/`, {
    method: 'DELETE'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dismiss notification');
  }
  return data;
};

export const fetchNotificationPreferences = async () => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/preferences/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch notification preferences');
  }
  return data;
};

export const updateNotificationPreferences = async (preferencesData) => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/preferences/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferencesData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update notification preferences');
  }
  return data;
};

// ==========================================
// Phase 18: Verified Ratings & Reviews API
// ==========================================

export const fetchReviewEligibility = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/eligibility/?order_id=${orderId}`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify review eligibility');
  }
  return data;
};

export const createReview = async (reviewData) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.non_field_errors?.[0] || data.order_id?.[0] || data.product_id?.[0] || data.error || 'Failed to submit review';
    throw new Error(errorMsg);
  }
  return data;
};

export const fetchCustomerReviews = async () => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/my-reviews/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load your reviews');
  }
  return data.results || data || [];
};

export const updateReview = async (reviewId, updateData) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update review');
  }
  return data;
};

export const deleteReview = async (reviewId) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}/`, {
    method: 'DELETE'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete review');
  }
  return data;
};

export const fetchReviewsSummary = async (targetType, targetId) => {
  try {
    const res = await fetch(`${API_BASE}/reviews/summary/?target_type=${targetType}&target_id=${targetId}`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return {
      average_rating: 4.9,
      total_reviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
};

export const fetchProductReviews = async (productId, ordering = 'newest', rating = null) => {
  try {
    let url = `${API_BASE}/reviews/?product=${productId}&ordering=${ordering}`;
    if (rating) url += `&rating=${rating}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.results || data || [];
  } catch {
    return [];
  }
};

export const fetchRestaurantReviews = async (restaurantId, ordering = 'newest', rating = null) => {
  try {
    let url = `${API_BASE}/reviews/?restaurant=${restaurantId}&ordering=${ordering}`;
    if (rating) url += `&rating=${rating}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.results || data || [];
  } catch {
    return [];
  }
};

export const reportReview = async (reviewId, reportData) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}/report/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to report review');
  }
  return data;
};

// ==========================================
// PHASE 19: OFFERS, COUPONS & LOYALTY REWARDS
// ==========================================

export const fetchActiveOffers = async (subtotal = 0, restaurantId = null) => {
  const params = new URLSearchParams();
  if (subtotal) params.append('subtotal', subtotal);
  if (restaurantId) params.append('restaurant_id', restaurantId);

  const res = await fetch(`${API_BASE}/coupons/?${params.toString()}`);
  const data = await res.json().catch(() => ({ results: [] }));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load offers');
  }
  return data.results || data || [];
};

export const validateCouponCode = async (code, subtotal = 0, restaurantId = null) => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/validate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: code.trim().toUpperCase(),
      subtotal,
      restaurant_id: restaurantId
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Invalid or ineligible coupon code.');
  }
  return data;
};

export const fetchOrderTotalsPreview = async (payload) => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/preview/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to preview order totals.');
  }
  return data;
};

export const fetchCustomerLoyalty = async () => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/loyalty/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch loyalty rewards profile.');
  }
  return data;
};

// ==========================================
// PHASE 20: SMART SEARCH & RECOMMENDATIONS
// ==========================================

export const searchCatalog = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.q) params.append('q', filters.q);
  if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
  if (filters.cuisine && filters.cuisine !== 'ALL') params.append('cuisine', filters.cuisine);
  if (filters.min_price) params.append('min_price', filters.min_price);
  if (filters.max_price) params.append('max_price', filters.max_price);
  if (filters.min_rating && filters.min_rating !== 'ALL') params.append('min_rating', filters.min_rating);
  if (filters.is_veg !== undefined && filters.is_veg !== null && filters.is_veg !== 'ALL') {
    params.append('is_veg', filters.is_veg === true || filters.is_veg === 'VEG');
  }
  if (filters.is_open !== undefined && filters.is_open !== null) params.append('is_open', filters.is_open);
  if (filters.available_only) params.append('available_only', filters.available_only);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', filters.page);
  if (filters.page_size) params.append('page_size', filters.page_size);

  const token = localStorage.getItem('fd_access_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/discovery/search/?${params.toString()}`, { headers });
  const data = await res.json().catch(() => ({ foods: [], restaurants: [], meta: {} }));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to search catalog');
  }
  return data;
};

export const fetchSearchSuggestions = async (query = '') => {
  if (!query || !query.trim()) {
    return { query: '', foods: [], restaurants: [], cuisines: [], categories: [] };
  }
  const params = new URLSearchParams({ q: query.trim() });
  const res = await fetch(`${API_BASE}/discovery/suggestions/?${params.toString()}`);
  const data = await res.json().catch(() => ({ foods: [], restaurants: [], cuisines: [], categories: [] }));
  return data;
};

export const fetchDiscoverySections = async () => {
  const res = await fetch(`${API_BASE}/discovery/sections/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch discovery sections');
  }
  return data;
};

export const fetchPersonalizedRecommendations = async (limit = 8) => {
  const token = localStorage.getItem('fd_access_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/discovery/recommendations/?limit=${limit}`, { headers });
  const data = await res.json().catch(() => ({ strategy: 'FALLBACK', explanation: '', items: [] }));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch recommendations');
  }
  return data;
};

export const fetchUserSearchHistory = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/discovery/history/`);
    const data = await res.json().catch(() => ({ history: [] }));
    if (!res.ok) return [];
    return data.history || [];
  } catch {
    return [];
  }
};

export const recordUserSearch = async (query, resultsCount = 0) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/discovery/history/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, results_count: resultsCount })
    });
    return await res.json().catch(() => ({}));
  } catch {
    return null;
  }
};

export const clearUserSearchHistory = async (searchId = null) => {
  try {
    const url = searchId ? `${API_BASE}/discovery/history/?id=${searchId}` : `${API_BASE}/discovery/history/`;
    const res = await fetchWithAuth(url, { method: 'DELETE' });
    return await res.json().catch(() => ({}));
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Phase 24: Customer Support & Dispute Resolution APIs
// ---------------------------------------------------------------------------

export const fetchCustomerTickets = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/support/tickets/?${query}` : `${API_BASE}/support/tickets/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load tickets');
    return await res.json();
  } catch (err) {
    console.error('Error fetching customer tickets:', err);
    return { results: [], count: 0 };
  }
};

export const fetchCustomerTicketDetail = async (ticketNumber) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/tickets/${ticketNumber}/`);
    if (!res.ok) throw new Error('Failed to load ticket detail');
    return await res.json();
  } catch (err) {
    console.error('Error fetching ticket detail:', err);
    throw err;
  }
};

export const createCustomerTicket = async (formDataOrObj) => {
  try {
    const isFormData = formDataOrObj instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const res = await fetchWithAuth(`${API_BASE}/support/tickets/`, options);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error creating ticket:', err);
    throw err;
  }
};

export const replyCustomerTicket = async (ticketNumber, formDataOrObj) => {
  try {
    const isFormData = formDataOrObj instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const res = await fetchWithAuth(`${API_BASE}/support/tickets/${ticketNumber}/reply/`, options);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error replying to ticket:', err);
    throw err;
  }
};

export const confirmCustomerTicketResolution = async (ticketNumber, action = 'confirm_resolve', notes = '') => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/tickets/${ticketNumber}/confirm-resolution/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error confirming ticket resolution:', err);
    throw err;
  }
};

export const fetchCustomerEligibleOrders = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/orders/eligible/`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching eligible orders:', err);
    return [];
  }
};

// ---------------------------------------------------------------------------
// Wishlist API (real backend persistence)
// ---------------------------------------------------------------------------
// (existing wishlist functions follow)

// ---------------------------------------------------------------------------
// Callback requests (real backend workflow, no telephony provider)
// ---------------------------------------------------------------------------

export const fetchCallRequests = async () => {
  const res = await fetchWithAuth(`${API_BASE}/calls/calls/`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Failed to load call requests');
  return data?.calls || [];
};

export const createCallRequest = async ({ topic, phone, subject, order_number, priority }) => {
  const res = await fetchWithAuth(`${API_BASE}/calls/calls/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, phone, subject, order_number, priority })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.detail || 'Failed to request callback');
  return data;
};

export const cancelCallRequest = async (callId) => {
  const res = await fetchWithAuth(`${API_BASE}/calls/calls/${callId}/cancel/`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to cancel request');
  return data;
};

// ---------------------------------------------------------------------------
// Scheduled orders (future slots; immediate checkout untouched)
// ---------------------------------------------------------------------------

export const fetchDeliverySlots = async (restaurantId) => {
  const q = restaurantId ? `?restaurant_id=${restaurantId}` : '';
  const res = await fetchWithAuth(`${API_BASE}/orders/slots/${q}`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to load slots');
  return data?.slots || [];
};

export const fetchScheduledOrders = async () => {
  const res = await fetchWithAuth(`${API_BASE}/orders/scheduled/`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to load scheduled orders');
  return data?.scheduled_orders || [];
};

export const createScheduledOrder = async (payload) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/scheduled/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to schedule order');
  return data;
};

export const cancelScheduledOrder = async (scheduledId, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/scheduled/${scheduledId}/cancel/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason || '' })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to cancel scheduled order');
  return data;
};

const normalizeWishlist = (data) => {
  const items = Array.isArray(data) ? data : (data?.results || []);
  return items.map(entry => entry?.product || entry).filter(Boolean);
};

export const fetchWishlist = async () => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist/`, { method: 'GET' });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(data?.detail || 'Failed to load wishlist');
  return { entries: Array.isArray(data) ? data : (data?.results || []), foods: normalizeWishlist(data) };
};

export const addWishlistItem = async (productId) => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.non_field_errors?.[0] || data?.detail || 'Failed to save favorite';
    throw new Error(msg);
  }
  return data;
};

export const removeWishlistItem = async (wishlistId) => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist/${wishlistId}/`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Failed to remove favorite');
  }
  return true;
};









