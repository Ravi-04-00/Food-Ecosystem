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

export const INITIAL_SHOP_ORDERS = [
  {
    id: 101,
    order_number: 'WS10245',
    customer_name: 'Ravi',
    customer_phone: '+91 98765 00001',
    delivery_address: '704 Heritage Tower, 12th Cross',
    status: 'PLACED', // New Order needing Acceptance
    time_ago: '1m ago',
    items: [
      { name: 'Classic Double Cheddar Smash Burger', quantity: 2, price: 249.00 },
      { name: 'Vintage Cold Malt Brew', quantity: 1, price: 120.00 }
    ],
    item_total: 618.00,
    grand_total: 457.00,
    cooking_instructions: 'Extra spicy, sauce on side',
    payment_status: 'VERIFIED_PAID'
  },
  {
    id: 102,
    order_number: 'WS10246',
    customer_name: 'Aria',
    customer_phone: '+91 98765 00008',
    delivery_address: '14 Elm Street, Indiranagar',
    status: 'PREPARING',
    time_ago: '8m ago',
    items: [
      { name: 'Crispy Retro Truffle Burger', quantity: 1, price: 189.00 }
    ],
    item_total: 189.00,
    grand_total: 219.00,
    cooking_instructions: 'No onions, extra toasted brioche',
    payment_status: 'VERIFIED_PAID'
  },
  {
    id: 103,
    order_number: 'WS10247',
    customer_name: 'Devon',
    customer_phone: '+91 98765 00003',
    delivery_address: 'Central Boulevard Pod 4',
    status: 'READY',
    time_ago: '14m ago',
    items: [
      { name: 'Classic Double Cheddar Smash Burger', quantity: 1, price: 249.00 }
    ],
    item_total: 249.00,
    grand_total: 289.00,
    rider_name: 'Arun 🛵',
    payment_status: 'VERIFIED_PAID'
  }
];

export const INITIAL_MENU_ITEMS = [
  {
    id: 1,
    name: 'Classic Double Cheddar Smash Burger',
    category: 'Burgers',
    price: 249.00,
    discount: '15',
    is_veg: false,
    spice_level: 'Medium',
    prep_time_minutes: 15,
    stock: 45,
    is_available: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    short_description: 'Double smashed prime patties, melted aged cheddar, crisp lettuce and vintage house sauce.',
    addons: [{ id: 1, name: 'Extra Cheddar Melt', price: 30.00 }]
  },
  {
    id: 2,
    name: 'Crispy Retro Truffle Shroom Burger',
    category: 'Burgers',
    price: 219.00,
    discount: '10',
    is_veg: true,
    spice_level: 'Mild',
    prep_time_minutes: 12,
    stock: 30,
    is_available: true,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    short_description: 'Golden fried portobello mushroom patty, black truffle aioli, and caramelized sweet onions.',
    addons: [{ id: 2, name: 'Extra Truffle Sauce', price: 25.00 }]
  },
  {
    id: 3,
    name: 'Vintage Cold Malt Brew',
    category: 'Beverages',
    price: 120.00,
    discount: '0',
    is_veg: true,
    spice_level: 'None',
    prep_time_minutes: 5,
    stock: 60,
    is_available: true,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    short_description: 'Slow-dripped roasted Arabica coffee blended with cold milk and organic brown cane syrup.',
    addons: []
  }
];

export const loginRestaurant = async (identifier, password) => {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password,
      role: 'RESTAURANT'
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

export const clearRestaurantAuthData = () => {
  localStorage.removeItem('fd_restaurant_token');
  localStorage.removeItem('fd_restaurant_refresh');
  localStorage.removeItem('fd_restaurant_user');
  localStorage.removeItem('fd_access_token');
  localStorage.removeItem('fd_refresh_token');
};

export const logoutRestaurant = async (refreshToken) => {
  try {
    const token = refreshToken || localStorage.getItem('fd_restaurant_refresh') || localStorage.getItem('fd_refresh_token');
    const access = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (access) headers['Authorization'] = `Bearer ${access}`;

    await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: token })
    });
  } catch {
    // Graceful offline fallback
  } finally {
    clearRestaurantAuthData();
  }
  return { success: true, message: 'You have been logged out successfully.' };
};

// Concurrency-safe refresh mutex for restaurant app
let activeRestaurantRefreshPromise = null;

export const fetchWithAuth = async (url, options = {}, onSessionExpired) => {
  const accessToken = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');

  const headers = new Headers(options.headers || {});
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const modifiedOptions = { ...options, headers };
  const response = await fetch(url, modifiedOptions);

  if (response.status === 401 && !options._retry) {
    const refreshToken = localStorage.getItem('fd_restaurant_refresh') || localStorage.getItem('fd_refresh_token');
    if (!refreshToken) {
      clearRestaurantAuthData();
      if (onSessionExpired) onSessionExpired();
      return response;
    }

    if (!activeRestaurantRefreshPromise) {
      activeRestaurantRefreshPromise = refreshAccessToken(refreshToken)
        .then(data => {
          if (data && data.access) {
            localStorage.setItem('fd_restaurant_token', data.access);
            localStorage.setItem('fd_access_token', data.access);
            if (data.refresh) {
              localStorage.setItem('fd_restaurant_refresh', data.refresh);
              localStorage.setItem('fd_refresh_token', data.refresh);
            }
            return data.access;
          }
          throw new Error('Refresh failed');
        })
        .catch(err => {
          clearRestaurantAuthData();
          if (onSessionExpired) onSessionExpired();
          throw err;
        })
        .finally(() => {
          activeRestaurantRefreshPromise = null;
        });
    }

    try {
      const newAccessToken = await activeRestaurantRefreshPromise;
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

export const fetchRestaurantOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.filter) query.append('filter', params.filter);
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetchWithAuth(`${API_BASE}/orders/${queryString}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch restaurant orders');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const fetchRestaurantOrderDetail = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch order details');
  }
  return await res.json();
};

export const acceptRestaurantOrder = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/accept/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to accept order');
  }
  return data;
};

export const rejectRestaurantOrder = async (orderId, { reason, explanation = '' }) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, explanation })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reject order');
  }
  return data;
};

export const prepareRestaurantOrder = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/prepare/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark order as preparing');
  }
  return data;
};

export const readyRestaurantOrder = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/ready/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark order ready for pickup');
  }
  return data;
};

export const fetchOrderStatusHistory = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/history/`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch status history');
  }
  return await res.json();
};

export const fetchShopOrders = async (params) => {
  try {
    return await fetchRestaurantOrders(params);
  } catch (err) {
    console.warn('fetchShopOrders non-fatal fallback:', err);
    return [];
  }
};

export const updateOrderStatus = async (orderId, newStatus, reason = '') => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus, reason })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update order status');
  }
  return data;
};

export const registerRestaurant = async (formData) => {
  const isFormData = formData instanceof FormData;
  const res = await fetch(`${API_BASE}/auth/register/restaurant/`, {
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

// ---------------------------------------------------------------------------
// Phase 5: Real-Life Profile Management API
// ---------------------------------------------------------------------------

export const fetchRestaurantProfile = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load restaurant profile');
  }
  return await res.json();
};

export const updateRestaurantProfile = async (formDataOrData) => {
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
    const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to update restaurant profile');
    const err = new Error(msg);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
};

export const deleteRestaurantLogo = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/photo/`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove restaurant logo');
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
    const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to save settings');
    const err = new Error(msg);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 8: Restaurant Availability, Menu Categories & Food Management API
// ---------------------------------------------------------------------------

export const fetchRestaurantAvailability = async () => {
  const res = await fetchWithAuth(`${API_BASE}/restaurants/me/availability/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch restaurant availability');
  }
  return await res.json();
};

export const toggleRestaurantAvailability = async (statusOrIsOpen) => {
  let body = {};
  if (typeof statusOrIsOpen === 'string') {
    body = { status: statusOrIsOpen };
  } else if (typeof statusOrIsOpen === 'boolean') {
    body = { is_open: statusOrIsOpen };
  }
  const res = await fetchWithAuth(`${API_BASE}/restaurants/me/toggle-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update restaurant availability');
  }
  return data;
};

export const fetchMenuCategories = async (restaurantId) => {
  const url = restaurantId 
    ? `${API_BASE}/menu/categories/?restaurant_id=${restaurantId}`
    : `${API_BASE}/menu/categories/`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load menu categories');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const createMenuCategory = async (categoryData) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/categories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.name ? data.name[0] : (data.detail || 'Failed to create category');
    const err = new Error(msg);
    err.errors = data;
    throw err;
  }
  return data;
};

export const updateMenuCategory = async (categoryId, categoryData) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/categories/${categoryId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.name ? data.name[0] : (data.detail || 'Failed to update category');
    const err = new Error(msg);
    err.errors = data;
    throw err;
  }
  return data;
};

export const deleteMenuCategory = async (categoryId) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/categories/${categoryId}/`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.detail || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Cannot delete category');
    const err = new Error(msg);
    err.errors = data;
    throw err;
  }
  return { success: true };
};

export const toggleMenuCategoryActive = async (categoryId) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/categories/${categoryId}/toggle/`, {
    method: 'POST'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle category');
  }
  return data;
};

export const fetchFoodItems = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/menu/items/?${query}` : `${API_BASE}/menu/items/`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load food items');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const createFoodItem = async (formDataOrData) => {
  const isFormData = typeof FormData !== 'undefined' && formDataOrData instanceof FormData;
  const options = {
    method: 'POST',
    body: isFormData ? formDataOrData : JSON.stringify(formDataOrData)
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetchWithAuth(`${API_BASE}/menu/items/`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = 'Failed to create food item';
    if (data.name) msg = data.name[0];
    else if (data.price) msg = data.price[0];
    else if (data.category) msg = data.category[0];
    else if (data.detail) msg = data.detail;
    else if (data.message) msg = data.message;
    const err = new Error(msg);
    err.errors = data;
    throw err;
  }
  return data;
};

export const updateFoodItem = async (foodId, formDataOrData) => {
  const isFormData = typeof FormData !== 'undefined' && formDataOrData instanceof FormData;
  const options = {
    method: 'PATCH',
    body: isFormData ? formDataOrData : JSON.stringify(formDataOrData)
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetchWithAuth(`${API_BASE}/menu/items/${foodId}/`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = 'Failed to update food item';
    if (data.name) msg = data.name[0];
    else if (data.price) msg = data.price[0];
    else if (data.category) msg = data.category[0];
    else if (data.detail) msg = data.detail;
    const err = new Error(msg);
    err.errors = data;
    throw err;
  }
  return data;
};

export const deleteFoodItem = async (foodId) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/items/${foodId}/`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete food item');
  }
  return { success: true };
};

export const toggleFoodStock = async (foodId) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/items/${foodId}/toggle-stock/`, {
    method: 'POST'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle food availability');
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

export const fetchRestaurantReviewsFeed = async ({ page = 1, rating = null } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (rating) params.append('rating', rating);

  const res = await fetchWithAuth(`${API_BASE}/reviews/restaurant-feed/?${params.toString()}`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load restaurant reviews');
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
      average_rating: 4.8,
      total_reviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
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
    throw new Error(data.error || data.detail || 'Failed to submit abuse report');
  }
  return data;
};

// ==========================================
// Phase 21: Restaurant Business Intelligence
// ==========================================

export const fetchRestaurantAnalytics = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.restaurant_id) query.append('restaurant_id', params.restaurant_id);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.compare_prior !== undefined) query.append('compare_prior', params.compare_prior);

  const res = await fetchWithAuth(`${API_BASE}/analytics/restaurant/?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Failed to fetch restaurant analytics');
  }
  return await res.json();
};

export const downloadRestaurantAnalyticsCSV = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.restaurant_id) query.append('restaurant_id', params.restaurant_id);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const res = await fetchWithAuth(`${API_BASE}/analytics/restaurant/export/?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Failed to export restaurant analytics CSV');
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `restaurant_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

// ==========================================
// Phase 22: Restaurant Business Suite APIs
// ==========================================

export const fetchOperatingSettings = async () => {
  const res = await fetchWithAuth(`${API_BASE}/restaurants/me/operating-settings/`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load restaurant operating settings');
  }
  return await res.json();
};

export const updateOperatingSettings = async (settingsData) => {
  const res = await fetchWithAuth(`${API_BASE}/restaurants/me/operating-settings/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save operating settings');
  }
  return await res.json();
};

export const toggleOrdersPaused = async (paused = null, reason = '') => {
  const payload = {};
  if (paused !== null) payload.paused = paused;
  if (reason) payload.reason = reason;

  const res = await fetchWithAuth(`${API_BASE}/restaurants/me/pause-orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to toggle orders pause state');
  }
  return await res.json();
};

export const updateMenuItemSchedule = async (foodId, scheduleData) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/items/${foodId}/schedule/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update menu item schedule');
  }
  return await res.json();
};

export const toggleMenuItemSoldOut = async (foodId, isSoldOut = null) => {
  const payload = {};
  if (isSoldOut !== null) payload.is_sold_out = isSoldOut;

  const res = await fetchWithAuth(`${API_BASE}/menu/items/${foodId}/toggle-sold-out/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to toggle sold-out state');
  }
  return await res.json();
};

export const exportRestaurantOrdersCSV = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const res = await fetchWithAuth(`${API_BASE}/restaurants/me/export-orders-csv/?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to export orders CSV');
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `orders_${params.start_date || 'feed'}_to_${params.end_date || 'now'}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

// ---------------------------------------------------------------------------
// Phase 24: Restaurant Dispute & Support APIs
// ---------------------------------------------------------------------------

export const fetchRestaurantTickets = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/support/restaurant/tickets/?${query}` : `${API_BASE}/support/restaurant/tickets/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load restaurant dispute tickets');
    return await res.json();
  } catch (err) {
    console.error('Error fetching restaurant tickets:', err);
    return { results: [], count: 0 };
  }
};

export const fetchRestaurantTicketDetail = async (ticketNumber) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/restaurant/tickets/${ticketNumber}/`);
    if (!res.ok) throw new Error('Failed to load dispute details');
    return await res.json();
  } catch (err) {
    console.error('Error fetching restaurant ticket detail:', err);
    throw err;
  }
};

export const replyRestaurantTicket = async (ticketNumber, formDataOrObj) => {
  try {
    const isFormData = formDataOrObj instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const res = await fetchWithAuth(`${API_BASE}/support/restaurant/tickets/${ticketNumber}/reply/`, options);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error submitting restaurant reply:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Phase 25: Restaurant Commission, Earnings and Settlement APIs
// ---------------------------------------------------------------------------

export const fetchRestaurantEarnings = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/payments/restaurant/earnings/?${query}` : `${API_BASE}/payments/restaurant/earnings/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load restaurant earnings');
    return await res.json();
  } catch (err) {
    console.error('Error fetching restaurant earnings:', err);
    throw err;
  }
};

export const fetchRestaurantSettlements = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/payments/restaurant/settlements/?${query}` : `${API_BASE}/payments/restaurant/settlements/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load restaurant settlements');
    return await res.json();
  } catch (err) {
    console.error('Error fetching restaurant settlements:', err);
    return { results: [], count: 0 };
  }
};

export const fetchRestaurantSettlementDetail = async (reference) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/restaurant/settlements/${reference}/`);
    if (!res.ok) throw new Error('Failed to load settlement detail');
    return await res.json();
  } catch (err) {
    console.error('Error fetching settlement detail:', err);
    throw err;
  }
};

export const fetchRestaurantCommissionOrders = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/payments/restaurant/commission-orders/?${query}` : `${API_BASE}/payments/restaurant/commission-orders/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load order commission entries');
    return await res.json();
  } catch (err) {
    console.error('Error fetching commission entries:', err);
    return { results: [], count: 0 };
  }
};

export const downloadRestaurantSettlementStatementCSV = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/payments/restaurant/earnings/statement/?${query}` : `${API_BASE}/payments/restaurant/earnings/statement/`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to download settlement statement CSV');
  
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `settlement_statement_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

// ---------------------------------------------------------------------------
// Role-based KYC API (real backend, private documents)
// ---------------------------------------------------------------------------

export const fetchKYCStatus = async () => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/status/`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const saveKYCDraft = async (data, consentGiven) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/draft/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, consent_given: consentGiven })
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw out;
  return out;
};

export const submitKYC = async (consentGiven) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consent_given: consentGiven })
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw out;
  return out;
};

export const uploadKYCDocument = async (docType, file, expiresAt) => {
  const form = new FormData();
  form.append('doc_type', docType);
  form.append('file', file);
  if (expiresAt) form.append('expires_at', expiresAt);
  const res = await fetchWithAuth(`${API_BASE}/kyc/documents/`, {
    method: 'POST',
    body: form
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw out;
  return out;
};

export const deleteKYCDocument = async (docId) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/documents/${docId}/`, { method: 'DELETE' });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw out;
  return out;
};

export const downloadKYCDocument = async (docId) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/documents/${docId}/download/`, { method: 'GET' });
  if (!res.ok) throw new Error('Download not permitted');
  return await res.blob();
};


