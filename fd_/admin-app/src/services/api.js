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

export const INITIAL_TELEMETRY = {
  total_customers: 1840,
  total_shops: 48,
  total_riders: 86,
  online_riders: 64,
  total_foods: 320,
  total_orders: 12450,
  active_orders: 18,
  gmv: 4825900.00,
  platform_revenue: 579100.00,
  health_score: 99.8,
  server_latency_ms: 18,
  map_nodes: {
    restaurants: [
      { id: 1, name: 'CYBER SMASH BURGERS 2099', lat: 12.9785, lng: 77.6015, rating: 4.9, is_open: true },
      { id: 2, name: 'NEO TOKYO NOODLE LAB', lat: 12.9730, lng: 77.6400, rating: 4.85, is_open: true },
      { id: 3, name: 'KINETIC BIRYANI VAULT', lat: 12.9352, lng: 77.6245, rating: 4.92, is_open: true }
    ],
    delivery_partners: [
      { id: 1, name: 'Kaelen Vance', lat: 12.9752, lng: 77.5980, is_online: true, battery: 92, vehicle: 'Cyber Superbike', rating: 4.96 },
      { id: 2, name: 'Rohan V.', lat: 12.9710, lng: 77.6090, is_online: true, battery: 78, vehicle: 'Neon E-Scooter', rating: 4.90 },
      { id: 3, name: 'Zoya Khan', lat: 12.9640, lng: 77.6180, is_online: true, battery: 84, vehicle: 'Hyper Cargo EV', rating: 4.98 }
    ],
    active_orders: [
      { id: 101, order_number: 'WS-9021-ALPH', status: 'ON_THE_WAY', grand_total: 725.40, customer: 'Aria Vance', restaurant: 'CYBER SMASH BURGERS', rider: 'Kaelen Vance', eta: 12 },
      { id: 102, order_number: 'WS-8831-OMEG', status: 'PREPARING', grand_total: 947.40, customer: 'Devon Miles', restaurant: 'CYBER SMASH BURGERS', rider: 'Unassigned', eta: 22 },
      { id: 103, order_number: 'WS-4412-BETA', status: 'READY', grand_total: 464.00, customer: 'Mira Chen', restaurant: 'NEO TOKYO NOODLE LAB', rider: 'Rohan V.', eta: 18 }
    ]
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const fetchTelemetry = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/ecosystem-telemetry/`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return INITIAL_TELEMETRY;
  }
};

export const loginAdmin = async (identifier, password) => {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password,
      role: 'ADMIN'
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

export const clearAdminAuthData = () => {
  localStorage.removeItem('fd_admin_token');
  localStorage.removeItem('fd_access_token');
  localStorage.removeItem('fd_admin_refresh');
  localStorage.removeItem('fd_refresh_token');
  localStorage.removeItem('fd_admin_session');
  localStorage.removeItem('fd_admin_user');
};

export const logoutAdmin = async (refreshToken) => {
  const token = localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token');
  const refresh = refreshToken || localStorage.getItem('fd_admin_refresh') || localStorage.getItem('fd_refresh_token');
  try {
    const res = await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ refresh_token: refresh })
    });
    return await res.json();
  } catch {
    // Graceful offline or network fault fallback
    return { success: true };
  } finally {
    clearAdminAuthData();
  }
};

let activeRefreshPromise = null;

export const fetchWithAuth = async (url, options = {}, onSessionExpired) => {
  let token = localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !options._retry) {
    const refreshToken = localStorage.getItem('fd_admin_refresh') || localStorage.getItem('fd_refresh_token');
    if (!refreshToken) {
      clearAdminAuthData();
      if (onSessionExpired) onSessionExpired();
      return response;
    }

    try {
      if (!activeRefreshPromise) {
        activeRefreshPromise = refreshAccessToken(refreshToken).finally(() => {
          activeRefreshPromise = null;
        });
      }

      const refreshData = await activeRefreshPromise;
      if (refreshData?.access) {
        localStorage.setItem('fd_admin_token', refreshData.access);
        localStorage.setItem('fd_access_token', refreshData.access);
        if (refreshData.refresh) {
          localStorage.setItem('fd_admin_refresh', refreshData.refresh);
          localStorage.setItem('fd_refresh_token', refreshData.refresh);
        }

        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${refreshData.access}`
        };
        return await fetch(url, { ...options, credentials: options.credentials, headers: retryHeaders, _retry: true });
      }
    } catch {
      clearAdminAuthData();
      if (onSessionExpired) onSessionExpired();
      return response;
    }
  }

  return response;
};

export const fetchAdminProfile = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch admin profile');
  return await res.json();
};

export const updateAdminProfile = async (data) => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
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
// Phase 16: Advanced Admin Mission Control API
// ---------------------------------------------------------------------------

export const fetchAdminOverview = async (days = 7) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/overview/?days=${days}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin overview KPIs');
  }
  return await res.json();
};

export const fetchAdminCustomers = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.is_active !== undefined && params.is_active !== '') query.append('is_active', params.is_active);
  if (params.page) query.append('page', params.page);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/customers/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch customers');
  }
  return await res.json();
};

export const fetchAdminCustomerDetail = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/customers/${id}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch customer details');
  }
  return await res.json();
};

export const toggleCustomerStatus = async (id, isActive, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/customers/${id}/toggle-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update customer status');
  }
  return data;
};

export const fetchAdminRestaurants = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.verification_status) query.append('verification_status', params.verification_status);
  if (params.is_open !== undefined && params.is_open !== '') query.append('is_open', params.is_open);
  if (params.page) query.append('page', params.page);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/restaurants/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch restaurants');
  }
  return await res.json();
};

export const fetchAdminRestaurantDetail = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/restaurants/${id}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch restaurant details');
  }
  return await res.json();
};

export const verifyRestaurant = async (id, status, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/restaurants/${id}/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify restaurant');
  }
  return data;
};

export const toggleRestaurantAccess = async (id, isActive, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/restaurants/${id}/toggle-access/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update restaurant access');
  }
  return data;
};

export const fetchAdminPartners = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.verification_status) query.append('verification_status', params.verification_status);
  if (params.is_online !== undefined && params.is_online !== '') query.append('is_online', params.is_online);
  if (params.page) query.append('page', params.page);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/partners/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch delivery partners');
  }
  return await res.json();
};

export const fetchAdminPartnerDetail = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/partners/${id}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch partner details');
  }
  return await res.json();
};

export const verifyPartner = async (id, status, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/partners/${id}/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify partner');
  }
  return data;
};

export const togglePartnerStatus = async (id, isActive, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/partners/${id}/toggle-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update partner status');
  }
  return data;
};

export const fetchAdminOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.status) query.append('status', params.status);
  if (params.payment_status) query.append('payment_status', params.payment_status);
  if (params.restaurant_id) query.append('restaurant_id', params.restaurant_id);
  if (params.rider_id) query.append('rider_id', params.rider_id);
  if (params.date_from) query.append('date_from', params.date_from);
  if (params.date_to) query.append('date_to', params.date_to);
  if (params.page) query.append('page', params.page);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/orders/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch orders');
  }
  return await res.json();
};

export const fetchAdminOrderDetail = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/orders/${id}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch order details');
  }
  return await res.json();
};

export const interveneOrderStatus = async (id, toStatus, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/orders/${id}/status-intervention/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_status: toStatus, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update order status');
  }
  return data;
};

export const fetchAdminPayments = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', params.page);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/payments/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch payments');
  }
  return await res.json();
};

export const fetchAdminPaymentDetail = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/payments/${id}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch payment details');
  }
  return await res.json();
};

export const fetchAdminReportsSummary = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.date_from) query.append('date_from', params.date_from);
  if (params.date_to) query.append('date_to', params.date_to);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/reports/summary/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch reports summary');
  }
  return await res.json();
};

export const downloadAdminCSV = async (type = 'orders', params = {}) => {
  const query = new URLSearchParams({ type });
  if (params.date_from) query.append('date_from', params.date_from);
  if (params.date_to) query.append('date_to', params.date_to);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/reports/export-csv/?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to export CSV report');
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `report_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

// ---------------------------------------------------------------------------
// Phase 21: Advanced Analytics and Business Intelligence
// ---------------------------------------------------------------------------

export const fetchAdminAnalyticsSummary = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.order_status) query.append('order_status', params.order_status);
  if (params.restaurant_id) query.append('restaurant_id', params.restaurant_id);
  if (params.delivery_partner_id) query.append('delivery_partner_id', params.delivery_partner_id);
  if (params.payment_status) query.append('payment_status', params.payment_status);

  const res = await fetchWithAuth(`${API_BASE}/analytics/admin/summary/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin analytics summary');
  }
  return await res.json();
};

export const fetchAdminAnalyticsCharts = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.interval) query.append('interval', params.interval);
  if (params.restaurant_id) query.append('restaurant_id', params.restaurant_id);

  const res = await fetchWithAuth(`${API_BASE}/analytics/admin/charts/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin analytics charts');
  }
  return await res.json();
};

export const downloadAdminAnalyticsCSV = async (reportType = 'orders', params = {}) => {
  const query = new URLSearchParams({ report_type: reportType });
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.order_status) query.append('order_status', params.order_status);

  const res = await fetchWithAuth(`${API_BASE}/analytics/admin/export/?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to export analytics CSV report');
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `analytics_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

export const fetchMetricDefinitions = async () => {
  const res = await fetchWithAuth(`${API_BASE}/analytics/definitions/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch metric definitions');
  }
  return await res.json();
};

export const fetchAdminSettings = async () => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/settings/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load system settings');
  }
  return await res.json();
};

export const updateAdminSettings = async (settingsData) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/settings/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update system settings');
  }
  return data;
};

export const fetchAdminAuditLogs = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.action) query.append('action', params.action);
  if (params.date_from) query.append('date_from', params.date_from);
  if (params.date_to) query.append('date_to', params.date_to);
  if (params.page) query.append('page', params.page);
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/audit-logs/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch audit logs');
  }
  return await res.json();
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

  const res = await fetchWithAuth(`${API_BASE}/notifications/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch notifications');
  }
  return data;
};

export const fetchNotificationUnreadCount = async () => {
  const res = await fetchWithAuth(`${API_BASE}/notifications/unread-count/`);
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
  const res = await fetchWithAuth(`${API_BASE}/notifications/preferences/`);
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

export const fetchAdminReviewQueue = async ({ page = 1, status = '' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (status) params.append('status', status);

  const res = await fetchWithAuth(`${API_BASE}/reviews/admin/queue/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load review moderation queue');
  }
  return data;
};

export const adminModerateReview = async (reviewId, { action, reason }) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/admin/${reviewId}/moderate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to execute moderation action');
  }
  return data;
};

export const fetchAdminReviewReports = async ({ page = 1, status = '' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (status) params.append('status', status);

  const res = await fetchWithAuth(`${API_BASE}/reviews/admin/reports/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load abuse reports queue');
  }
  return data;
};

export const adminResolveReviewReport = async (reportId, { action, admin_notes }) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/admin/reports/${reportId}/resolve/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, admin_notes })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to resolve abuse report');
  }
  return data;
};

export const fetchAdminReviewStats = async () => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/admin/stats/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load review statistics');
  }
  return data;
};

// ==========================================
// PHASE 19: OFFERS, COUPONS & LOYALTY
// ==========================================

export const fetchAdminCoupons = async ({ is_active = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (is_active !== '') params.append('is_active', is_active);
  if (search) params.append('search', search);

  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch coupon promotions');
  }
  return data;
};

export const createAdminCoupon = async (couponData) => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.code ? data.code[0] : (data.error || data.detail || 'Failed to create coupon');
    throw new Error(errorMsg);
  }
  return data;
};

export const updateAdminCoupon = async (couponId, couponData) => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/${couponId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.code ? data.code[0] : (data.error || data.detail || 'Failed to update coupon');
    throw new Error(errorMsg);
  }
  return data;
};

export const deleteAdminCoupon = async (couponId) => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/${couponId}/`, {
    method: 'DELETE'
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Failed to delete coupon');
  }
  return true;
};

export const fetchAdminLoyaltyConfig = async () => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/loyalty-config/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch loyalty program configuration');
  }
  return data;
};

export const updateAdminLoyaltyConfig = async (configData) => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/loyalty-config/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update loyalty program configuration');
  }
  return data;
};

export const fetchAdminPromotionStats = async () => {
  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/stats/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch promotional metrics');
  }
  return data;
};

export const fetchAdminLoyaltyLedger = async ({ customer_id = '', transaction_type = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (customer_id) params.append('customer_id', customer_id);
  if (transaction_type) params.append('transaction_type', transaction_type);
  if (page) params.append('page', page);

  const res = await fetchWithAuth(`${API_BASE}/coupons/admin/loyalty-ledger/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch loyalty ledger audit entries');
  }
  return data;
};

// ===========================================================================
// Phase 23: Smart Delivery Dispatch & Partner Matching API
// ===========================================================================

export const fetchAdminDispatchMonitor = async ({ status = '', q = '', date = '', page = 1, page_size = 15 } = {}) => {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.append('status', status);
  if (q) query.append('q', q);
  if (date) query.append('date', date);
  if (page) query.append('page', page);
  if (page_size) query.append('page_size', page_size);

  const res = await fetchWithAuth(`${API_BASE}/delivery/admin/dispatch/?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch dispatch monitor data');
  }
  return await res.json();
};

export const reassignAdminDispatch = async (assignmentId, partnerId, reason = '', handoverConfirmed = false) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/admin/dispatch/${assignmentId}/reassign/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partner_id: partnerId, reason, handover_confirmed: handoverConfirmed })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reassign delivery order');
  }
  return data;
};

export const recordOrderDelay = async (orderId, { delay_type, reason, notes, new_eta_minutes }) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/orders/${orderId}/delay/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delay_type, reason, notes, new_eta_minutes })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to record delay');
  }
  return data;
};

export const fetchAdminEligiblePartners = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/admin/dispatch/partners/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load eligible delivery partners');
  }
  return await res.json();
};

export const triggerOrderDispatch = async (orderId = null) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/dispatch/trigger/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderId ? { order_id: orderId } : {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to trigger dispatch');
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 24: Admin Dispute & Support Operations APIs
// ---------------------------------------------------------------------------

export const fetchAdminTickets = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/support/admin/tickets/?${query}` : `${API_BASE}/support/admin/tickets/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load admin support tickets');
    return await res.json();
  } catch (err) {
    console.error('Error fetching admin tickets:', err);
    return { results: [], count: 0, stats: {} };
  }
};

export const fetchAdminTicketDetail = async (ticketNumber) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/admin/tickets/${ticketNumber}/`);
    if (!res.ok) throw new Error('Failed to load ticket detail');
    return await res.json();
  } catch (err) {
    console.error('Error fetching admin ticket detail:', err);
    throw err;
  }
};

export const replyAdminTicket = async (ticketNumber, formDataOrObj) => {
  try {
    const isFormData = formDataOrObj instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const res = await fetchWithAuth(`${API_BASE}/support/admin/tickets/${ticketNumber}/reply/`, options);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error submitting admin reply:', err);
    throw err;
  }
};

export const assignAdminTicket = async (ticketNumber, agentId) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/admin/tickets/${ticketNumber}/assign/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error assigning agent:', err);
    throw err;
  }
};

export const escalateAdminTicket = async (ticketNumber, reason) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/admin/tickets/${ticketNumber}/escalate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error escalating ticket:', err);
    throw err;
  }
};

export const resolveAdminTicket = async (ticketNumber, resolutionSummary) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/admin/tickets/${ticketNumber}/resolve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_summary: resolutionSummary })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error resolving ticket:', err);
    throw err;
  }
};

export const closeAdminTicket = async (ticketNumber, notes = '') => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/admin/tickets/${ticketNumber}/close/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error closing ticket:', err);
    throw err;
  }
};

export const autoEscalateAdminTickets = async (hours = 24) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/admin/auto-escalate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error auto-escalating tickets:', err);
    throw err;
  }
};

// ==========================================
// PHASE 25: SETTLEMENTS & PAYMENT RECONCILIATION
// ==========================================

export const fetchAdminSettlements = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/payments/admin/settlements/?${query}` : `${API_BASE}/payments/admin/settlements/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load settlements queue');
    return await res.json();
  } catch (err) {
    console.error('Error fetching admin settlements:', err);
    throw err;
  }
};

export const fetchAdminSettlementDetail = async (reference) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/admin/settlements/${reference}/`);
    if (!res.ok) throw new Error('Failed to load settlement detail');
    return await res.json();
  } catch (err) {
    console.error('Error fetching admin settlement detail:', err);
    throw err;
  }
};

export const createAdminSettlementBatch = async (batchData) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/admin/settlements/create-batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error creating settlement batch:', err);
    throw err;
  }
};

export const transitionAdminSettlementStatus = async (reference, payload) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/admin/settlements/${reference}/status/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error transitioning settlement status:', err);
    throw err;
  }
};

export const addAdminSettlementAdjustment = async (reference, payload) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/admin/settlements/${reference}/adjustments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error adding settlement adjustment:', err);
    throw err;
  }
};

export const fetchAdminPaymentReconciliation = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/payments/admin/reconciliation/?${query}` : `${API_BASE}/payments/admin/reconciliation/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load payment reconciliation');
    return await res.json();
  } catch (err) {
    console.error('Error fetching payment reconciliation:', err);
    throw err;
  }
};

export const downloadAdminReconciliationCSV = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/payments/admin/reconciliation/export-csv/?${query}` : `${API_BASE}/payments/admin/reconciliation/export-csv/`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to download reconciliation CSV');

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `payment_reconciliation_audit_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

export const fetchAdminCommissionRules = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/admin/commission-rules/`);
    if (!res.ok) throw new Error('Failed to load commission rules');
    return await res.json();
  } catch (err) {
    console.error('Error fetching commission rules:', err);
    throw err;
  }
};

export const updateAdminCommissionRules = async (payload) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/payments/admin/commission-rules/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error updating commission rules:', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Role-based KYC review API (private documents, admin only)
// ---------------------------------------------------------------------------

const kycGet = async (path) => {
  const res = await fetchWithAuth(`${API_BASE}${path}`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const fetchKYCPending = async (params = {}) => {
  const q = new URLSearchParams();
  if (params.kind) q.append('kind', params.kind);
  if (params.status) q.append('status', params.status);
  return kycGet(`/kyc/admin/pending/?${q.toString()}`);
};

export const fetchKYCDetail = async (userId) => kycGet(`/kyc/admin/${userId}/`);

export const approveKYC = async (userId) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/admin/${userId}/approve/`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const rejectKYC = async (userId, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/admin/${userId}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const requestKYCInfo = async (userId, reason) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/admin/${userId}/request-info/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const downloadKYCDocumentAdmin = async (docId) => {
  const res = await fetchWithAuth(`${API_BASE}/kyc/documents/${docId}/download/`, { method: 'GET' });
  if (!res.ok) throw new Error('Download not permitted');
  return await res.blob();
};

// ---------------------------------------------------------------------------
// Callback requests (admin queue; manual callbacks, no telephony provider)
// ---------------------------------------------------------------------------

export const fetchAdminCalls = async (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.append('status', params.status);
  if (params.q) q.append('q', params.q);
  const res = await fetchWithAuth(`${API_BASE}/calls/calls/admin/?${q.toString()}`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const transitionAdminCall = async (callId, payload) => {
  const res = await fetchWithAuth(`${API_BASE}/calls/calls/admin/${callId}/status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

// ---------------------------------------------------------------------------
// Support-agent queue (flag-only access, never admin APIs)
// ---------------------------------------------------------------------------

export const fetchAgentQueue = async () => {
  const res = await fetchWithAuth(`${API_BASE}/support/agent/queue/`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const claimAgentTicket = async (ticketNumber) => {
  const res = await fetchWithAuth(`${API_BASE}/support/agent/tickets/${ticketNumber}/claim/`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const replyAgentTicket = async (ticketNumber, message) => {
  const res = await fetchWithAuth(`${API_BASE}/support/agent/tickets/${ticketNumber}/reply/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

export const fetchAgentCalls = async () => {
  const res = await fetchWithAuth(`${API_BASE}/support/agent/calls/`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
};

// ---------------------------------------------------------------------------
// Admin manual creation (restaurant + partner, duplicates blocked server-side)
// ---------------------------------------------------------------------------

export const createAdminRestaurant = async (payload) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/restaurants/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to create restaurant');
  return data;
};

export const createAdminPartner = async (payload) => {
  const res = await fetchWithAuth(`${API_BASE}/adminpanel/partners/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to create partner');
  return data;
};

// ---------------------------------------------------------------------------
// Menu dish management (admin creates for any restaurant via restaurant_id)
// ---------------------------------------------------------------------------

const _menuGet = async (path) => {
  const res = await fetchWithAuth(`${API_BASE}${path}`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return Array.isArray(data) ? data : (data?.results || []);
};

export const fetchAdminDishes = async (restaurantId) =>
  _menuGet(`/menu/items/?restaurant_id=${restaurantId}`);

export const fetchAdminMenuCategories = async (restaurantId) =>
  _menuGet(`/menu/categories/?restaurant_id=${restaurantId}`);

export const createAdminDish = async (formData) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/items/`, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = data && typeof data === 'object'
      ? Object.values(data).flat().find(v => typeof v === 'string') : null;
    throw new Error(first || data?.detail || 'Failed to create dish');
  }
  return data;
};

export const updateAdminDish = async (dishId, payload) => {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
  const res = await fetchWithAuth(`${API_BASE}/menu/items/${dishId}/`, {
    method: 'PATCH',
    body: isForm ? payload : JSON.stringify(payload),
    ...(isForm ? {} : { headers: { 'Content-Type': 'application/json' } })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = data && typeof data === 'object'
      ? Object.values(data).flat().find(v => typeof v === 'string') : null;
    throw new Error(first || 'Failed to update dish');
  }
  return data;
};

export const deleteAdminDish = async (dishId) => {
  const res = await fetchWithAuth(`${API_BASE}/menu/items/${dishId}/`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || 'Failed to delete dish');
  }
  return true;
};








