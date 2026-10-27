import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_TELEMETRY, 
  fetchTelemetry, 
  logoutAdmin, 
  clearAdminAuthData, 
  fetchCurrentUser,
  fetchAdminProfile,
  updateAdminProfile,
  fetchUserSettings,
  updateUserSettings,
  fetchAdminOverview
} from '../services/api.js';
import { applyTheme, applyLanguage } from '../utils/i18n.js';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [overviewData, setOverviewData] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [inspectedOrder, setInspectedOrder] = useState(null);
  const [inspectedEntity, setInspectedEntity] = useState(null);

  const [restaurants, setRestaurants] = useState([
    { id: 1, name: 'CYBER SMASH BURGERS 2099', owner: 'chef_kane@wsfood.io', status: 'VERIFIED', commission: 12.0, sales_today: 19200, rating: 4.9 },
    { id: 2, name: 'NEO TOKYO NOODLE LAB', owner: 'kenji@wsfood.io', status: 'VERIFIED', commission: 12.0, sales_today: 14800, rating: 4.85 },
    { id: 3, name: 'KINETIC BIRYANI VAULT', owner: 'zafar@wsfood.io', status: 'VERIFIED', commission: 12.0, sales_today: 24500, rating: 4.92 },
    { id: 4, name: 'QUANTUM SLICE PODS', owner: 'luigi@wsfood.io', status: 'PENDING_AUDIT', commission: 15.0, sales_today: 6400, rating: 4.6 }
  ]);

  const [couriers, setCouriers] = useState([
    { id: 1, name: 'Kaelen Vance', phone: '+91 98765 00003', vehicle: 'Cyber Superbike EV', status: 'ONLINE', rating: 4.96, deliveries: 218, battery: 92 },
    { id: 2, name: 'Rohan Varma', phone: '+91 98765 00012', vehicle: 'Neon E-Scooter', status: 'ONLINE', rating: 4.90, deliveries: 164, battery: 78 },
    { id: 3, name: 'Zoya Khan', phone: '+91 98765 00021', vehicle: 'Hyper Cargo EV', status: 'ONLINE', rating: 4.98, deliveries: 310, battery: 84 },
    { id: 4, name: 'Alex Rivera', phone: '+91 98765 00035', vehicle: 'Cyber Drone Pod', status: 'OFFLINE', rating: 4.88, deliveries: 95, battery: 42 }
  ]);

  const [customers, setCustomers] = useState([
    { id: 1, name: 'Aria Vance', email: 'customer@wsfood.io', orders_count: 28, total_spent: 18450, status: 'ACTIVE', pod: 'Level 42, Neon Tower' },
    { id: 2, name: 'Devon Miles', email: 'devon@wsfood.io', orders_count: 14, total_spent: 9800, status: 'ACTIVE', pod: 'Grid 8, Skyway' },
    { id: 3, name: 'Mira Chen', email: 'mira@wsfood.io', orders_count: 9, total_spent: 6200, status: 'ACTIVE', pod: 'Sector 3, Indiranagar' },
    { id: 4, name: 'Siddharth Rao', email: 'sid@wsfood.io', orders_count: 42, total_spent: 31200, status: 'ACTIVE', pod: 'Koramangala Pod 19' }
  ]);

  const [activeOrders, setActiveOrders] = useState([
    {
      id: 101,
      order_number: 'WS-9021-ALPH',
      status: 'ON_THE_WAY',
      grand_total: 725.40,
      customer: 'Aria Vance',
      customer_phone: '+91 98765 00001',
      restaurant: 'CYBER SMASH BURGERS 2099',
      rider: 'Kaelen Vance',
      rider_phone: '+91 98765 00003',
      payment_method: 'Cyber UPI',
      payment_status: 'ESCROW_AUTHORIZED',
      eta_minutes: 12,
      fraud_score: '0.02 (CLEAN)'
    },
    {
      id: 102,
      order_number: 'WS-8831-OMEG',
      status: 'PREPARING',
      grand_total: 947.40,
      customer: 'Devon Miles',
      customer_phone: '+91 98765 00008',
      restaurant: 'CYBER SMASH BURGERS 2099',
      rider: 'Pending Dispatch Assignment',
      rider_phone: '',
      payment_method: 'Neon Card Escrow',
      payment_status: 'ESCROW_AUTHORIZED',
      eta_minutes: 22,
      fraud_score: '0.01 (CLEAN)'
    },
    {
      id: 103,
      order_number: 'WS-4412-BETA',
      status: 'READY',
      grand_total: 464.00,
      customer: 'Mira Chen',
      customer_phone: '+91 98765 00044',
      restaurant: 'NEO TOKYO NOODLE LAB',
      rider: 'Rohan Varma',
      rider_phone: '+91 98765 00012',
      payment_method: 'Cyber Wallet',
      payment_status: 'ESCROW_AUTHORIZED',
      eta_minutes: 16,
      fraud_score: '0.03 (CLEAN)'
    }
  ]);

  const toggleRestaurantVerification = (id) => {
    setRestaurants(prev => prev.map(r => r.id === id ? {
      ...r, status: r.status === 'VERIFIED' ? 'SUSPENDED' : 'VERIFIED'
    } : r));
  };

  const toggleCourierStatus = (id) => {
    setCouriers(prev => prev.map(c => c.id === id ? {
      ...c, status: c.status === 'ONLINE' ? 'SUSPENDED' : 'ONLINE'
    } : c));
  };

  const refundOrder = (orderId) => {
    setActiveOrders(prev => prev.map(o => o.id === orderId ? {
      ...o, status: 'CANCELLED_REFUNDED', payment_status: 'REFUNDED_TO_CUSTOMER'
    } : o));
    if (inspectedOrder?.id === orderId) {
      setInspectedOrder(prev => ({
        ...prev, status: 'CANCELLED_REFUNDED', payment_status: 'REFUNDED_TO_CUSTOMER'
      }));
    }
  };

  // Phase 4: Session Security & Token Invalidation
  const [authState, setAuthState] = useState(() => {
    return (localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token')) ? 'authenticated' : 'unauthenticated';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fd_admin_session');
      if (saved) return JSON.parse(saved).profile || JSON.parse(saved);
    } catch {}
    return {
      email: 'admin@wsfood.io',
      role: 'ADMIN',
      name: 'System Administrator'
    };
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState('');

  const handleSessionExpired = useCallback(() => {
    clearAdminAuthData();
    setAuthState('session_expired');
    setShowSessionExpired(true);
    setCurrentUser(null);
  }, []);

  const promptLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const cancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  const confirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setAuthState('logging_out');
    const refresh = localStorage.getItem('fd_admin_refresh') || localStorage.getItem('fd_refresh_token');
    await logoutAdmin(refresh);
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    setAuthState('unauthenticated');
    setCurrentUser(null);
    setLogoutFeedback('You have been logged out successfully.');
    setTimeout(() => setLogoutFeedback(''), 4000);
  }, []);

  const [adminProfileData, setAdminProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token');
    if (!token) return null;
    setIsLoadingProfile(true);
    try {
      const data = await fetchAdminProfile();
      const p = data.profile || data;
      setAdminProfileData(p);
      setCurrentUser(prev => ({ ...(prev || {}), ...p }));
      return p;
    } catch (err) {
      console.warn('Admin profile fetch non-fatal:', err);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const updateProfile = async (formDataOrData) => {
    setIsLoadingProfile(true);
    try {
      const res = await updateAdminProfile(formDataOrData);
      const updated = res.profile || res;
      setAdminProfileData(updated);
      setCurrentUser(prev => ({ ...(prev || {}), ...updated }));
      return updated;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Phase 6: Settings & Preferences State
  const [userSettings, setUserSettings] = useState({
    theme: localStorage.getItem('fd_theme') || 'light',
    language: localStorage.getItem('fd_language') || 'en',
    push_notifications: true,
    email_notifications: true,
    sms_notifications: true,
    personalization: true,
    location_permission_preference: true
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token');
    if (!token) return null;
    setIsLoadingSettings(true);
    try {
      const data = await fetchUserSettings();
      const s = data.settings || data;
      setUserSettings(s);
      if (s.theme) applyTheme(s.theme);
      if (s.language) applyLanguage(s.language);
      return s;
    } catch (err) {
      console.warn('Admin settings fetch non-fatal:', err);
      return null;
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  const updateSettings = async (newSettings) => {
    setIsLoadingSettings(true);
    try {
      const res = await updateUserSettings(newSettings);
      const updated = res.settings || res;
      setUserSettings(prev => ({ ...prev, ...updated }));
      if (updated.theme) applyTheme(updated.theme);
      if (updated.language) applyLanguage(updated.language);
      return updated;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('fd_theme') || 'light';
    const savedLang = localStorage.getItem('fd_language') || 'en';
    applyTheme(savedTheme);
    applyLanguage(savedLang);
  }, []);

  const loadOverview = useCallback(async (days = 7) => {
    setIsLoadingOverview(true);
    try {
      const data = await fetchAdminOverview(days);
      setOverviewData(data);
      return data;
    } catch (err) {
      console.warn('Overview fetch non-fatal:', err);
      return null;
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry().then(setTelemetry);

    const token = localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token');
    if (token) {
      fetchCurrentUser(token)
        .then(userData => {
          if (userData && userData.user_id) {
            const profile = userData.basic_profile_information || {
              id: userData.user_id,
              email: userData.email,
              role: userData.role
            };
            setCurrentUser(profile);
            setAuthState('authenticated');
            localStorage.setItem('fd_admin_user', JSON.stringify(profile));
            fetchProfile();
            fetchSettings();
            loadOverview(7);
          }
        })
        .catch(() => {
          handleSessionExpired();
        });
    } else {
      setAuthState('unauthenticated');
    }
  }, [handleSessionExpired, fetchProfile, fetchSettings, loadOverview]);

  return (
    <AdminContext.Provider value={{
      telemetry,
      restaurants,
      toggleRestaurantVerification,
      couriers,
      toggleCourierStatus,
      customers,
      activeOrders,
      refundOrder,
      inspectedOrder,
      setInspectedOrder,
      inspectedEntity,
      setInspectedEntity,

      // Phase 16: Platform Overview & Ecosystem Metrics
      overviewData,
      isLoadingOverview,
      loadOverview,

      // Phase 4: Token Security, Session Management & Logout
      authState,
      setAuthState,
      currentUser,
      setCurrentUser,
      showLogoutConfirm,
      setShowLogoutConfirm,
      showSessionExpired,
      setShowSessionExpired,
      isLoggingOut,
      logoutFeedback,
      promptLogout,
      cancelLogout,
      confirmLogout,
      handleSessionExpired,

      // Phase 5: Profile Management
      adminProfileData,
      isLoadingProfile,
      fetchProfile,
      updateProfile,

      // Phase 6: Settings & Preferences
      userSettings,
      isLoadingSettings,
      fetchSettings,
      updateSettings
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
