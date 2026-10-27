// Delivery Partner Operations Data & API Service
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

// Intelligent Order Assignment Mock
export const INITIAL_DELIVERY_REQUESTS = [
  {
    id: 501,
    order_number: 'DP-10246',
    order_type: 'Single Food Delivery',
    restaurant_name: 'Urban Bowl',
    restaurant_address: '14 Heritage Boulevard, Indiranagar, 100ft Rd',
    restaurant_lat: 12.9785,
    restaurant_lng: 77.6015,
    customer_name: 'Aria Vance',
    customer_address: 'Penthouse 702, Skyline Residency, HAL 2nd Stage',
    customer_lat: 12.9716,
    customer_lng: 77.5946,
    customer_phone: '+91 98765 00018',
    pickup_distance_km: 1.4,
    drop_distance_km: 3.8,
    total_distance_km: 5.2,
    estimated_time_mins: 22,
    estimated_earnings: 148.00,
    earnings_breakdown: {
      base_pay: 95.00,
      surge_bonus: 35.00,
      tip_estimate: 18.00
    },
    vehicle_compatibility: 'Compatible (2-Wheeler / Ather EV)',
    traffic_condition: 'Moderate (Flowing corridor, 12 min drop transit)',
    weather_condition: 'Clear, 28°C',
    items_count: 3,
    items: [
      { name: 'Signature Avocado Truffle Bowl', quantity: 2 },
      { name: 'Cold Pressed Citrus Zest', quantity: 1 }
    ],
    expiry_seconds: 30,
    smart_match_reason: 'Assigned based on proximity (1.4 km), optimal route efficiency and low current vehicle battery drain.'
  },
  {
    id: 502,
    order_number: 'DP-10247',
    order_type: 'Batch Delivery (Combined)',
    restaurant_name: 'Green Earth Bistro',
    restaurant_address: '42 CMH Road, Indiranagar',
    customer_name: 'Dr. Sneha Menon',
    customer_address: 'Villa 18, Palm Meadows, Whitefield Corridor',
    pickup_distance_km: 0.9,
    drop_distance_km: 4.1,
    total_distance_km: 5.0,
    estimated_time_mins: 24,
    estimated_earnings: 165.00,
    earnings_breakdown: {
      base_pay: 110.00,
      surge_bonus: 35.00,
      tip_estimate: 20.00
    },
    vehicle_compatibility: 'Compatible (2-Wheeler / EV)',
    traffic_condition: 'Light (Ring road priority)',
    weather_condition: 'Clear, 28°C',
    items_count: 2,
    items: [
      { name: 'Artisan Burrata Salad', quantity: 1 },
      { name: 'Sourdough Garlic Bruschetta', quantity: 1 }
    ],
    expiry_seconds: 30,
    smart_match_reason: 'Assigned based on high customer satisfaction rating and zero active backlog.'
  }
];

// Active Trip with 8-State Delivery Lifecycle
export const INITIAL_ACTIVE_TRIP = {
  id: 10245,
  order_number: 'DP-10245',
  order_type: 'Priority Express Delivery',
  restaurant_name: 'Urban Bowl',
  restaurant_address: '14 Heritage Boulevard, Indiranagar, 100ft Rd',
  restaurant_lat: 12.9785,
  restaurant_lng: 77.6015,
  restaurant_phone: '+91 80 4123 9988',
  restaurant_notes: 'Kitchen bay #3. Order packed in thermal sealed bag.',
  kitchen_status: 'Order Ready (Packed 2 mins ago)',
  parking_instructions: 'Designated 2-wheeler bay on eastern porch. Gate passes waived.',
  
  customer_name: 'Ravi Kumar',
  customer_phone: '+91 98765 00001',
  customer_address: 'Apt 704, Heritage Grand Tower, 12th Cross Road',
  customer_lat: 12.9716,
  customer_lng: 77.5946,
  customer_building_info: 'Tower B, 7th Floor, Elevator lobby on right. Security gate code #4012.',
  customer_instructions: 'Leave at doorstep or ring bell once. Contactless delivery preferred.',
  
  // State Machine:
  // 0: ORDER_ASSIGNED
  // 1: ARRIVING_AT_RESTAURANT
  // 2: ARRIVED_AT_RESTAURANT (You're here)
  // 3: PICKUP_CONFIRMED
  // 4: ORDER_IN_TRANSIT
  // 5: ARRIVING_AT_CUSTOMER
  // 6: VERIFY_DELIVERY (OTP / Photo / Signature)
  // 7: DELIVERED
  step_index: 2, 
  status: 'ARRIVED_AT_RESTAURANT',
  
  otp_required: '8492',
  payout: 95.00,
  surge_bonus: 35.00,
  tip: 18.00,
  total_earnings: 148.00,
  distance_km: 5.2,
  items: [
    { name: 'Signature Avocado Truffle Bowl', quantity: 2, verified: true },
    { name: 'Cold Pressed Citrus Zest', quantity: 1, verified: true }
  ],
  geofence_verified: true,
  alternate_routes: [
    { name: 'Via 100ft Corridor (Primary)', distance_km: 5.2, duration_mins: 22, traffic: 'normal' },
    { name: 'Via Inner Ring Bypass', distance_km: 6.1, duration_mins: 26, traffic: 'heavy' }
  ]
};

// Batch Delivery Mockup Data
export const BATCH_DELIVERY_DATA = {
  id: 'BATCH-402',
  title: 'Optimized Dual Dispatch',
  total_orders: 2,
  combined_distance_km: 8.4,
  estimated_completion_mins: 38,
  combined_earnings: 284.00,
  route_sequence: [
    {
      stop_number: 1,
      type: 'PICKUP',
      location_name: 'Urban Bowl (Restaurant A)',
      address: '14 Heritage Boulevard, Indiranagar',
      order_id: 'DP-10245',
      status: 'COMPLETED',
      eta: 'Done'
    },
    {
      stop_number: 2,
      type: 'PICKUP',
      location_name: 'Green Earth Bistro (Restaurant B)',
      address: '42 CMH Road, Indiranagar',
      order_id: 'DP-10248',
      status: 'IN_PROGRESS',
      eta: '4 mins (1.2 km)'
    },
    {
      stop_number: 3,
      type: 'DROP',
      location_name: 'Customer A (Ravi Kumar)',
      address: 'Apt 704, Heritage Grand Tower',
      order_id: 'DP-10245',
      status: 'PENDING',
      eta: '16 mins'
    },
    {
      stop_number: 4,
      type: 'DROP',
      location_name: 'Customer B (Dr. Sneha Menon)',
      address: 'Villa 18, Palm Meadows',
      order_id: 'DP-10248',
      status: 'PENDING',
      eta: '34 mins'
    }
  ]
};

// Financial Wallet & Transactions Ledger
export const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN-98421',
    date: 'Today, 01:15 PM',
    type: 'TRIP_PAYOUT',
    description: 'Order #DP-10244 Delivery Payout + Tip',
    amount: 142.00,
    status: 'SETTLED',
    method: 'Wallet Credit'
  },
  {
    id: 'TXN-98418',
    date: 'Today, 12:20 PM',
    type: 'TRIP_PAYOUT',
    description: 'Order #DP-10243 Delivery Payout',
    amount: 115.00,
    status: 'SETTLED',
    method: 'Wallet Credit'
  },
  {
    id: 'TXN-98402',
    date: 'Today, 11:30 AM',
    type: 'SURGE_BONUS',
    description: 'Peak Lunch Window Guarantee Multiplier',
    amount: 80.00,
    status: 'SETTLED',
    method: 'Bonus Incentive'
  },
  {
    id: 'TXN-97880',
    date: 'Yesterday, 11:45 PM',
    type: 'INSTANT_PAYOUT',
    description: 'Direct Transfer to HDFC Bank ****9014 (IMPS)',
    amount: -8250.00,
    status: 'SETTLED',
    method: 'Bank IMPS Payout'
  },
  {
    id: 'TXN-97640',
    date: 'Yesterday, 09:10 PM',
    type: 'INCENTIVE_TARGET',
    description: 'Target Milestone: 12 Deliveries Completed',
    amount: 400.00,
    status: 'SETTLED',
    method: 'Incentive Credit'
  }
];

// Demand Heatmap Zones
export const DEMAND_ZONES = [
  {
    id: 'zone-1',
    name: 'T. Nagar Central Hub',
    demand_level: 'HIGH',
    surge_rate: '+₹40 – ₹80',
    surge_color: '#D4AF37',
    active_orders_per_hr: 48,
    distance_km: 2.1,
    travel_time_mins: 8,
    description: 'Heavy corporate lunch dispatch spike. Fast turnaround.'
  },
  {
    id: 'zone-2',
    name: 'Indiranagar 100ft Road Corridor',
    demand_level: 'HIGH',
    surge_rate: '+₹50 Flat',
    surge_color: '#ECC870',
    active_orders_per_hr: 42,
    distance_km: 0.8,
    travel_time_mins: 3,
    description: 'Dense gourmet cluster. Average drop distance 3.2 km.'
  },
  {
    id: 'zone-3',
    name: 'Koramangala 4th Block',
    demand_level: 'MEDIUM',
    surge_rate: '+₹25 Flat',
    surge_color: '#3B82F6',
    active_orders_per_hr: 28,
    distance_km: 4.6,
    travel_time_mins: 14,
    description: 'Steady demand across artisan kitchens & cafes.'
  },
  {
    id: 'zone-4',
    name: 'Whitefield EPIP Tech Zone',
    demand_level: 'STANDARD',
    surge_rate: '+₹0 Standard',
    surge_color: '#6B7280',
    active_orders_per_hr: 16,
    distance_km: 11.2,
    travel_time_mins: 28,
    description: 'Long distance campus drops with extra distance allowance.'
  }
];

// Shifts Schedule
export const AVAILABLE_SHIFTS = [
  {
    id: 'shift-today-lunch',
    name: 'Downtown Peak Lunch',
    time: '11:30 AM – 03:30 PM',
    status: 'ACTIVE_NOW',
    multiplier: '1.25x Payout Guarantee',
    estimated_earnings: '₹1,200 – ₹1,600',
    slots_left: 4
  },
  {
    id: 'shift-today-dinner',
    name: 'Evening Gourmet Rush',
    time: '07:00 PM – 11:30 PM',
    status: 'RESERVED',
    multiplier: '1.35x Surge Guarantee',
    estimated_earnings: '₹1,500 – ₹2,100',
    slots_left: 0
  },
  {
    id: 'shift-tomorrow-breakfast',
    name: 'Early Bird Breakfast Run',
    time: '06:30 AM – 10:30 AM',
    status: 'AVAILABLE',
    multiplier: 'Standard + ₹15/drop',
    estimated_earnings: '₹800 – ₹1,100',
    slots_left: 12
  },
  {
    id: 'shift-tomorrow-weekend-rush',
    name: 'Saturday Night Prime',
    time: '06:00 PM – 01:00 AM',
    status: 'AVAILABLE',
    multiplier: '1.40x Surge + Rain Guard',
    estimated_earnings: '₹2,400 – ₹3,200',
    slots_left: 7
  }
];

// Vehicle Profiles & EV Infrastructure
export const VEHICLES_DATA = [
  {
    id: 'veh-ev-1',
    type: 'EV Scooter',
    model: 'Ather 450X (Gen 3)',
    plate_number: 'KA-01-WS-8492',
    is_active: true,
    battery_percent: 86,
    range_km: 68,
    efficiency: '24 Wh/km',
    insurance_valid_until: 'Nov 2027',
    pollution_valid_until: 'Exempt (Zero Emission)',
    nearby_chargers: [
      { name: 'Ather Grid Rapid Hub - Indiranagar', distance_km: 1.1, plugs_free: 3, charge_speed: '1.5 km/min' },
      { name: 'Tata Power EZ Charge - CMH Metro', distance_km: 2.4, plugs_free: 2, charge_speed: 'Fast DC' }
    ]
  },
  {
    id: 'veh-ice-1',
    type: 'Fuel Scooter',
    model: 'Honda Activa 6G Premium',
    plate_number: 'KA-05-AB-4190',
    is_active: false,
    fuel_level_percent: 70,
    range_km: 180,
    insurance_valid_until: 'Aug 2027',
    pollution_valid_until: 'Oct 2027'
  }
];

// Partner KYC Documents
export const KYC_DOCUMENTS = [
  {
    id: 'doc-dl',
    title: 'Driving License',
    type: 'Commercial 2-Wheeler / LMV',
    doc_number: 'DL-KA01-20190084920',
    valid_until: '14 Dec 2029',
    status: 'VERIFIED',
    last_verified: '02 Jan 2026'
  },
  {
    id: 'doc-rc',
    title: 'Vehicle Registration (RC)',
    type: 'Ather 450X Electric',
    doc_number: 'RC-KA01WS8492-V',
    valid_until: '08 Mar 2038',
    status: 'VERIFIED',
    last_verified: '02 Jan 2026'
  },
  {
    id: 'doc-ins',
    title: 'Comprehensive Commercial Insurance',
    type: 'Third Party + Zero Dep Collision',
    doc_number: 'BA-COMM-9812-74',
    valid_until: '24 Nov 2026',
    status: 'ACTION_REQUIRED', // within 60 days
    note: 'Policy renewal window open. Upload updated cover note before Nov 20.'
  },
  {
    id: 'doc-id',
    title: 'Identity Verification (Aadhaar / National ID)',
    type: 'Biometric Authenticated',
    doc_number: '•••• •••• 9842',
    valid_until: 'Permanent',
    status: 'VERIFIED',
    last_verified: '10 Jan 2026'
  },
  {
    id: 'doc-bank',
    title: 'Settlement Bank & PAN Card',
    type: 'Direct IMPS Settlement Vault',
    doc_number: 'HDFC Bank • Account ending 9014',
    valid_until: 'Active',
    status: 'VERIFIED',
    last_verified: '10 Jan 2026'
  }
];

// Notifications Feed
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'ORDERS',
    title: 'Dispatch Assignment Available',
    message: 'High payout order #DP-10246 available from Urban Bowl (₹148).',
    timestamp: 'Just now',
    read: false,
    urgent: true
  },
  {
    id: 'notif-2',
    category: 'FINANCIAL',
    title: 'Shift Multiplier Credited',
    message: '₹80.00 added to wallet for peak lunch corridor guarantee.',
    timestamp: '18 mins ago',
    read: false,
    urgent: false
  },
  {
    id: 'notif-3',
    category: 'SAFETY',
    title: 'Traffic Advisory: 100ft Road',
    message: 'Slow moving traffic near Metro Pillar 140. Alternate expressway route recommended.',
    timestamp: '45 mins ago',
    read: true,
    urgent: false
  },
  {
    id: 'notif-4',
    category: 'INCENTIVES',
    title: "Target Milestone: 3 Orders Left",
    message: "Complete 3 more orders before 03:30 PM to claim ₹300 cash bonus.",
    timestamp: '1 hour ago',
    read: true,
    urgent: false
  }
];

// Profile API
export const fetchDeliveryProfile = async () => {
  try {
    const res = await fetch(`${API_BASE}/delivery/profile/`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return {
      partner_id: 'DP-84920',
      username: 'arun_courier',
      full_name: 'Arun Kumar',
      tier: 'Tier 1 — Master Gold Partner',
      rating: 4.88,
      total_reviews: 420,
      joining_date: 'March 2024 (2 Years Active)',
      vehicle_type: 'Ather 450X (EV)',
      vehicle_plate: 'KA-01-WS-8492',
      is_online: true,
      battery_percentage: 86,
      today_earnings: 1240.00,
      weekly_earnings: 9820.00,
      monthly_earnings: 41200.00,
      total_lifetime_deliveries: 1840,
      acceptance_rate: 96.4,
      completion_rate: 99.2,
      on_time_rate: 97.8
    };
  }
};

export const registerDeliveryPartner = async (formData) => {
  const isFormData = formData instanceof FormData;
  const res = await fetch(`${API_BASE}/auth/register/delivery-partner/`, {
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

export const loginPartner = async (identifier, password) => {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password,
      role: 'DELIVERY_PARTNER'
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

export const clearDeliveryAuthData = () => {
  sessionStorage.removeItem('bp_intro_seen');
  localStorage.removeItem('fd_delivery_token');
  localStorage.removeItem('fd_access_token');
  localStorage.removeItem('fd_delivery_refresh');
  localStorage.removeItem('fd_refresh_token');
  localStorage.removeItem('fd_delivery_partner_session');
  localStorage.removeItem('fd_delivery_user');
};

export const logoutPartner = async (refreshToken) => {
  const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
  const refresh = refreshToken || localStorage.getItem('fd_delivery_refresh') || localStorage.getItem('fd_refresh_token');
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
    clearDeliveryAuthData();
  }
};

let activeRefreshPromise = null;

export const fetchWithAuth = async (url, options = {}, onSessionExpired) => {
  let token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !options._retry) {
    const refreshToken = localStorage.getItem('fd_delivery_refresh') || localStorage.getItem('fd_refresh_token');
    if (!refreshToken) {
      clearDeliveryAuthData();
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
        localStorage.setItem('fd_delivery_token', refreshData.access);
        localStorage.setItem('fd_access_token', refreshData.access);
        if (refreshData.refresh) {
          localStorage.setItem('fd_delivery_refresh', refreshData.refresh);
          localStorage.setItem('fd_refresh_token', refreshData.refresh);
        }

        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${refreshData.access}`
        };
        return await fetch(url, { ...options, credentials: options.credentials, headers: retryHeaders, _retry: true });
      }
    } catch {
      clearDeliveryAuthData();
      if (onSessionExpired) onSessionExpired();
      return response;
    }
  }

  return response;
};

// ---------------------------------------------------------------------------
// Phase 5: Real-Life Profile Management API
// ---------------------------------------------------------------------------

export const fetchPartnerProfile = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to load partner profile');
  }
  return await res.json();
};

export const updatePartnerProfile = async (formDataOrData) => {
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
    const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to update partner profile');
    const err = new Error(msg);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
};

export const deletePartnerPhoto = async () => {
  const res = await fetchWithAuth(`${API_BASE}/auth/profile/photo/`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove partner photo');
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
// Phase 12: Real Delivery Partner Workflow API Methods
// ---------------------------------------------------------------------------

export const fetchAvailableJobs = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/jobs/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch available delivery jobs.');
  }
  return data;
};

export const fetchActiveTask = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/active/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch active delivery task.');
  }
  return data.active_task || null;
};

export const fetchTaskDetails = async (taskId) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/${taskId}/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch task details.');
  }
  return data;
};

export const acceptDeliveryJob = async (jobId) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/jobs/${jobId}/accept/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to accept job offer.');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const markReachedRestaurant = async (taskId) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/${taskId}/reached-restaurant/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark reached restaurant.');
  }
  return data;
};

export const confirmFoodPickup = async (taskId, payload = {}) => {
  let headers = {};
  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/${taskId}/confirm-pickup/`, {
    method: 'POST',
    headers,
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to confirm food pickup.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const reportDeliveryIssue = async (taskId, payloadOrReason, notes = '') => {
  let body;
  if (typeof payloadOrReason === 'object' && payloadOrReason !== null) {
    body = JSON.stringify(payloadOrReason);
  } else {
    body = JSON.stringify({ reason: payloadOrReason, notes });
  }
  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/${taskId}/report-issue/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to report delivery issue.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 13: Customer Handover, OTP Verification & Delivery History APIs
// ---------------------------------------------------------------------------

export const verifyDeliveryOTP = async (taskId, payloadOrOtp = {}) => {
  let headers = {};
  let body;
  if (payloadOrOtp instanceof FormData) {
    body = payloadOrOtp;
  } else if (typeof payloadOrOtp === 'object' && payloadOrOtp !== null) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payloadOrOtp);
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ otp: String(payloadOrOtp || '').trim() });
  }

  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/${taskId}/verify-otp/`, {
    method: 'POST',
    headers,
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to verify delivery OTP.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const fetchDeliveryHistory = async (search = '', dateFilter = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (dateFilter && dateFilter !== 'all') params.append('date_filter', dateFilter);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetchWithAuth(`${API_BASE}/delivery/history/${qs}`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load delivery history.');
  }
  return data;
};

export const fetchDeliveryHistoryDetail = async (taskId) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/history/${taskId}/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load delivery history details.');
  }
  return data;
};

export const fetchDeliveryIssues = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/issues/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load delivery issue reports.');
  }
  return data;
};

export const fetchCompletedDeliveries = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/tasks/completed/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load completed deliveries.');
  }
  return data;
};

export const fetchDeliveryDashboard = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/dashboard/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load delivery dashboard overview.');
  }
  return data;
};

export const toggleRiderOnlineStatus = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/toggle-status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle rider status.');
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 15: Google Maps Integration + Live GPS Telemetry Publication
// ---------------------------------------------------------------------------

export const publishPartnerLocation = async ({ order_id, latitude, longitude, heading = 0, speed = 0, battery = null }) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/location/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      heading: Number(heading || 0),
      speed: Number(speed || 0),
      battery: battery !== null && battery !== undefined ? Number(battery) : undefined
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to update GPS location');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchOrderTracking = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/tracking/`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to fetch order tracking');
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

export const fetchDeliveryPartnerReviewsFeed = async ({ page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);

  const res = await fetchWithAuth(`${API_BASE}/reviews/partner-feed/?${params.toString()}`, {
    method: 'GET'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load delivery ratings feed');
  }
  return data;
};

export const reportReview = async (reviewId, reportData) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}/report/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to submit review report');
  }
  return data;
};

// ==========================================
// Phase 21: Delivery Partner Analytics & BI
// ==========================================

export const fetchDeliveryPartnerAnalytics = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const res = await fetchWithAuth(`${API_BASE}/analytics/delivery-partner/?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Failed to fetch delivery partner analytics');
  }
  return await res.json();
};

export const downloadDeliveryPartnerAnalyticsCSV = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const res = await fetchWithAuth(`${API_BASE}/analytics/delivery-partner/export/?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Failed to export delivery partner CSV');
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `rider_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

// ==========================================
// Phase 23: Smart Dispatch & Job Offers API
// ==========================================

export const fetchCurrentOffer = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/offers/current/`, {
    method: 'GET'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch current job offer.');
  }
  const data = await res.json();
  return data.offer || null;
};

export const acceptOffer = async (offerId) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/offers/${offerId}/accept/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to accept job offer.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const rejectOffer = async (offerId, reason = 'Declined by partner') => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/offers/${offerId}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to decline job offer.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Phase 24: Delivery Partner Complaints & Incident Support APIs
// ---------------------------------------------------------------------------

export const fetchDeliveryTickets = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/support/delivery/tickets/?${query}` : `${API_BASE}/support/delivery/tickets/`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to load delivery dispute tickets');
    return await res.json();
  } catch (err) {
    console.error('Error fetching delivery tickets:', err);
    return { results: [], count: 0 };
  }
};

export const fetchDeliveryTicketDetail = async (ticketNumber) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/support/delivery/tickets/${ticketNumber}/`);
    if (!res.ok) throw new Error('Failed to load dispute details');
    return await res.json();
  } catch (err) {
    console.error('Error fetching delivery ticket detail:', err);
    throw err;
  }
};

export const replyDeliveryTicket = async (ticketNumber, formDataOrObj) => {
  try {
    const isFormData = formDataOrObj instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const res = await fetchWithAuth(`${API_BASE}/support/delivery/tickets/${ticketNumber}/reply/`, options);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error('Error submitting delivery reply:', err);
    throw err;
  }
};




// ---------------------------------------------------------------------------
// Phase 3A: Rider Payout Ledger API (INTERNAL LEDGER only)
// ---------------------------------------------------------------------------

export const fetchDeliveryEarnings = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/earnings/`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load earnings');
  }
  return await res.json();
};

export const fetchRiderPayouts = async () => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/payouts/`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load payouts');
  }
  return await res.json();
};

export const fetchRiderPayoutDetail = async (reference) => {
  const res = await fetchWithAuth(`${API_BASE}/delivery/payouts/${reference}/`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load payout detail');
  }
  return await res.json();
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
