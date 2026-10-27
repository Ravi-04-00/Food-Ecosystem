import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_MENU_ITEMS, 
  fetchRestaurantOrders,
  fetchRestaurantOrderDetail,
  acceptRestaurantOrder,
  rejectRestaurantOrder,
  prepareRestaurantOrder,
  readyRestaurantOrder,
  fetchOrderStatusHistory,
  updateOrderStatus as apiUpdateOrderStatus,
  loginRestaurant, 
  logoutRestaurant, 
  clearRestaurantAuthData, 
  fetchCurrentUser,
  fetchRestaurantProfile,
  updateRestaurantProfile,
  deleteRestaurantLogo,
  fetchRestaurantAvailability,
  toggleRestaurantAvailability as apiToggleRestaurantAvailability,
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  toggleMenuCategoryActive,
  fetchFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  toggleFoodStock,
  fetchUserSettings,
  updateUserSettings,
  fetchRestaurantAnalytics,
  downloadRestaurantAnalyticsCSV,
  fetchOperatingSettings,
  updateOperatingSettings as apiUpdateOperatingSettings,
  toggleOrdersPaused as apiToggleOrdersPaused,
  updateMenuItemSchedule as apiUpdateMenuItemSchedule,
  toggleMenuItemSoldOut as apiToggleMenuItemSoldOut,
  exportRestaurantOrdersCSV as apiExportRestaurantOrdersCSV
} from '../services/api.js';
import { applyTheme, applyLanguage } from '../utils/i18n.js';
import { getRealtimeClient } from '../utils/realtime.js';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // Phase 11: Real PostgreSQL Orders State (No fake order data)
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [orderFeedback, setOrderFeedback] = useState(null);

  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [menuCategories, setMenuCategories] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  // Phase 4: Centralized Authentication States
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    return token ? 'authenticated' : 'unauthenticated';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fd_restaurant_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      email: 'shop@wsfood.io',
      role: 'RESTAURANT',
      name: 'Master Chef Kane'
    };
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState('');

  const handleSessionExpired = useCallback(() => {
    clearRestaurantAuthData();
    setAuthState('session_expired');
    setShowSessionExpired(true);
    setCurrentUser(null);
  }, []);

  const promptLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setAuthState('logging_out');
    const refresh = localStorage.getItem('fd_restaurant_refresh') || localStorage.getItem('fd_refresh_token');
    await logoutRestaurant(refresh);
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    setAuthState('unauthenticated');
    setCurrentUser(null);
    setLogoutFeedback('You have been logged out successfully.');
    setTimeout(() => setLogoutFeedback(''), 4000);
  };

  // Phase 8: Restaurant Profile
  const [restaurantProfileData, setRestaurantProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Phase 8: Availability State ('OPEN' | 'CLOSED')
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState('OPEN');
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [availabilityFeedback, setAvailabilityFeedback] = useState('');

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return null;
    setIsLoadingProfile(true);
    try {
      const data = await fetchRestaurantProfile();
      const p = data.profile || data;
      setRestaurantProfileData(p);
      const online = p.is_open !== false;
      setIsStoreOnline(online);
      setAvailabilityStatus(online ? 'OPEN' : 'CLOSED');
      setCurrentUser(prev => ({ ...(prev || {}), ...p }));
      return p;
    } catch (err) {
      console.warn('Restaurant profile fetch non-fatal:', err);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const updateProfile = async (formDataOrData) => {
    setIsLoadingProfile(true);
    try {
      const res = await updateRestaurantProfile(formDataOrData);
      const updated = res.profile || res;
      setRestaurantProfileData(updated);
      setCurrentUser(prev => ({ ...(prev || {}), ...updated }));
      if (updated.is_open !== undefined) {
        setIsStoreOnline(updated.is_open);
        setAvailabilityStatus(updated.is_open ? 'OPEN' : 'CLOSED');
      }
      return updated;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const removeRestaurantLogo = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await deleteRestaurantLogo();
      const updated = res.profile || res;
      setRestaurantProfileData(updated);
      setCurrentUser(prev => ({ ...(prev || {}), restaurant_logo: '', logo: '' }));
      return updated;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Phase 8: Toggle Restaurant Availability Action
  const toggleAvailability = async (targetStatus) => {
    setIsTogglingAvailability(true);
    try {
      const param = targetStatus || (availabilityStatus === 'OPEN' ? 'CLOSED' : 'OPEN');
      const res = await apiToggleRestaurantAvailability(param);
      const nextOpen = res.is_open !== false;
      const nextStatus = res.status || (nextOpen ? 'OPEN' : 'CLOSED');
      setIsStoreOnline(nextOpen);
      setAvailabilityStatus(nextStatus);
      setRestaurantProfileData(prev => prev ? ({ ...prev, is_open: nextOpen, status: nextStatus }) : prev);
      setAvailabilityFeedback(res.message || `Restaurant is now ${nextStatus}`);
      setTimeout(() => setAvailabilityFeedback(''), 4000);
      return res;
    } catch (err) {
      console.error('Toggle availability failed:', err);
      // Fallback local toggle for offline demo resiliency
      const nextOpen = !isStoreOnline;
      const nextStatus = nextOpen ? 'OPEN' : 'CLOSED';
      setIsStoreOnline(nextOpen);
      setAvailabilityStatus(nextStatus);
      setAvailabilityFeedback(`Restaurant availability switched to ${nextStatus} (offline mode)`);
      setTimeout(() => setAvailabilityFeedback(''), 4000);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Phase 8: Menu Categories Actions
  const loadCategories = useCallback(async () => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    setIsLoadingCategories(true);
    try {
      const cats = await fetchMenuCategories();
      setMenuCategories(cats);
      return cats;
    } catch (err) {
      console.warn('Load categories non-fatal:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const addCategory = async (catData) => {
    setIsLoadingCategories(true);
    try {
      const created = await createMenuCategory(catData);
      setMenuCategories(prev => [...prev, created]);
      return created;
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const editCategory = async (catId, catData) => {
    setIsLoadingCategories(true);
    try {
      const updated = await updateMenuCategory(catId, catData);
      setMenuCategories(prev => prev.map(c => c.id === catId ? updated : c));
      return updated;
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const removeCategory = async (catId) => {
    setIsLoadingCategories(true);
    try {
      await deleteMenuCategory(catId);
      setMenuCategories(prev => prev.filter(c => c.id !== catId));
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const toggleCategoryStatus = async (catId) => {
    try {
      const res = await toggleMenuCategoryActive(catId);
      setMenuCategories(prev => prev.map(c => c.id === catId ? { ...c, is_active: res.is_active } : c));
      return res;
    } catch (err) {
      console.error('Toggle category active failed:', err);
      throw err;
    }
  };

  // Phase 8: Food Items Actions
  const loadFoods = useCallback(async () => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    setIsLoadingMenu(true);
    try {
      const foods = await fetchFoodItems();
      if (Array.isArray(foods) && foods.length > 0) {
        setMenuItems(foods);
      }
      return foods;
    } catch (err) {
      console.warn('Load foods non-fatal:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  const addFoodItem = async (formDataOrData) => {
    setIsLoadingMenu(true);
    try {
      const created = await createFoodItem(formDataOrData);
      setMenuItems(prev => [created, ...prev]);
      await loadCategories(); // refresh category count
      return created;
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const editFoodItem = async (foodId, formDataOrData) => {
    setIsLoadingMenu(true);
    try {
      const updated = await updateFoodItem(foodId, formDataOrData);
      setMenuItems(prev => prev.map(f => f.id === foodId ? updated : f));
      await loadCategories();
      return updated;
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const deleteMenuItem = async (foodId) => {
    try {
      await deleteFoodItem(foodId);
      setMenuItems(prev => prev.filter(f => f.id !== foodId));
      await loadCategories();
    } catch (err) {
      // Do NOT remove locally on failure: surface the backend error instead.
      console.error('Delete food item failed:', err);
      throw err;
    }
  };

  const toggleItemAvailability = async (foodId) => {
    try {
      const res = await toggleFoodStock(foodId);
      setMenuItems(prev => prev.map(f => f.id === foodId ? { ...f, is_available: res.is_available, stock: res.stock } : f));
      return res;
    } catch (err) {
      // Fallback local toggle
      setMenuItems(prev => prev.map(f => f.id === foodId ? { ...f, is_available: !f.is_available } : f));
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
    location_permission_preference: true,
    order_alerts: true,
    business_status: 'OPEN'
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
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
      console.warn('Restaurant settings fetch non-fatal:', err);
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

  // Phase 22: Restaurant Business Suite - Operating & Schedule State
  const [operatingSettings, setOperatingSettings] = useState({
    opening_time: '09:00',
    closing_time: '23:00',
    orders_paused: false,
    pause_reason: '',
    avg_prep_time_minutes: 25,
    timezone: 'Asia/Kolkata',
    operating_hours: {},
    exceptional_closures: []
  });
  const [isLoadingOperatingSettings, setIsLoadingOperatingSettings] = useState(false);
  const [operatingSettingsFeedback, setOperatingSettingsFeedback] = useState(null);

  const loadOperatingSettings = useCallback(async () => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return null;
    setIsLoadingOperatingSettings(true);
    try {
      const data = await fetchOperatingSettings();
      setOperatingSettings(data);
      return data;
    } catch (err) {
      console.warn('Failed to load operating settings:', err);
      return null;
    } finally {
      setIsLoadingOperatingSettings(false);
    }
  }, []);

  const handleUpdateOperatingSettings = async (settingsData) => {
    setIsLoadingOperatingSettings(true);
    try {
      const updated = await apiUpdateOperatingSettings(settingsData);
      setOperatingSettings(prev => ({ ...prev, ...updated }));
      setOperatingSettingsFeedback({ type: 'success', message: 'Operating settings updated successfully' });
      setTimeout(() => setOperatingSettingsFeedback(null), 4000);
      return updated;
    } catch (err) {
      setOperatingSettingsFeedback({ type: 'error', message: err.message || 'Failed to update operating settings' });
      setTimeout(() => setOperatingSettingsFeedback(null), 4000);
      throw err;
    } finally {
      setIsLoadingOperatingSettings(false);
    }
  };

  const handleToggleOrdersPaused = async (paused = null, reason = '') => {
    setIsLoadingOperatingSettings(true);
    try {
      const res = await apiToggleOrdersPaused(paused, reason);
      setOperatingSettings(prev => ({
        ...prev,
        orders_paused: res.orders_paused,
        pause_reason: res.pause_reason
      }));
      setOperatingSettingsFeedback({
        type: 'success',
        message: res.orders_paused ? 'Orders are now temporarily paused' : 'Orders have been resumed'
      });
      setTimeout(() => setOperatingSettingsFeedback(null), 4000);
      return res;
    } catch (err) {
      setOperatingSettingsFeedback({ type: 'error', message: err.message || 'Failed to toggle pause status' });
      setTimeout(() => setOperatingSettingsFeedback(null), 4000);
      throw err;
    } finally {
      setIsLoadingOperatingSettings(false);
    }
  };

  const handleUpdateMenuItemSchedule = async (foodId, scheduleData) => {
    try {
      const res = await apiUpdateMenuItemSchedule(foodId, scheduleData);
      const updated = res.item || res;
      setMenuItems(prev => prev.map(item => item.id === foodId ? { ...item, ...updated } : item));
      return res;
    } catch (err) {
      console.error('Update schedule error:', err);
      throw err;
    }
  };

  const handleToggleMenuItemSoldOut = async (foodId, isSoldOut = null) => {
    try {
      const res = await apiToggleMenuItemSoldOut(foodId, isSoldOut);
      setMenuItems(prev => prev.map(item => item.id === foodId ? { ...item, is_sold_out: res.is_sold_out } : item));
      return res;
    } catch (err) {
      console.error('Toggle sold-out error:', err);
      throw err;
    }
  };

  const handleExportOrdersCSV = async (params = {}) => {
    return await apiExportRestaurantOrdersCSV(params);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('fd_theme') || 'light';
    const savedLang = localStorage.getItem('fd_language') || 'en';
    applyTheme(savedTheme);
    applyLanguage(savedLang);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
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
            localStorage.setItem('fd_restaurant_user', JSON.stringify(profile));
            fetchProfile();
            fetchSettings();
            loadCategories();
            loadFoods();
            loadOperatingSettings();
          }
        })
        .catch(() => {
          handleSessionExpired();
        });
    } else {
      setAuthState('unauthenticated');
    }
  }, [handleSessionExpired, fetchProfile, fetchSettings, loadCategories, loadFoods, loadOperatingSettings]);

  // Phase 11: Real Restaurant Orders Loader
  const loadOrders = useCallback(async (params = {}) => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return [];
    setIsLoadingOrders(true);
    setOrderError('');
    try {
      const activeFilter = params.filter !== undefined ? params.filter : orderFilter;
      const activeSearch = params.search !== undefined ? params.search : orderSearch;
      const queryParams = {};
      if (activeFilter && activeFilter !== 'all') queryParams.filter = activeFilter;
      if (activeSearch && activeSearch.trim()) queryParams.search = activeSearch.trim();

      const data = await fetchRestaurantOrders(queryParams);
      const ordersList = Array.isArray(data) ? data : [];
      setOrders(ordersList);
      return ordersList;
    } catch (err) {
      console.warn('Load restaurant orders error:', err);
      setOrderError(err.message || 'Failed to load restaurant orders.');
      return [];
    } finally {
      setIsLoadingOrders(false);
    }
  }, [orderFilter, orderSearch]);

  // Automatically load orders whenever authenticated or filter/search changes
  useEffect(() => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (token && authState === 'authenticated') {
      loadOrders();
    }
  }, [authState, orderFilter, orderSearch, loadOrders]);

  // Phase 28: Real-Time Restaurant Order Queue & Reconnect Recovery
  useEffect(() => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token || authState !== 'authenticated') return;

    const client = getRealtimeClient('RESTAURANT');

    // Real-time new order listener
    const unsubNewOrder = client.subscribe('order.created', (payload) => {
      const newOrder = payload.data || payload;
      if (!newOrder.order_id && !newOrder.id) return;

      const orderObj = {
        id: newOrder.order_id || newOrder.id,
        order_number: newOrder.order_number,
        status: newOrder.status || 'PLACED',
        customer_name: newOrder.customer_name || 'Customer',
        total: newOrder.grand_total || newOrder.total || 0,
        grand_total: newOrder.grand_total || newOrder.total || 0,
        created_at: newOrder.created_at || new Date().toISOString(),
        items: newOrder.items || [],
        ...newOrder
      };

      // Idempotently prepend order to orders list without duplicating
      setOrders(prev => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some(o => String(o.id) === String(orderObj.id))) {
          return list; // Already exists, drop duplicate
        }
        return [orderObj, ...list];
      });

      setNewOrderAlert(orderObj);
    });

    // Real-time order status transition listener
    const unsubUpdateOrder = client.subscribe('order.updated', (payload) => {
      const orderId = payload.entity_id || payload.order_id || payload.data?.order_id;
      const nextStatus = payload.data?.status || payload.status;
      if (!orderId) return;

      setOrders(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(o => {
          if (String(o.id) === String(orderId)) {
            return {
              ...o,
              status: nextStatus || o.status,
              ...(payload.data || {})
            };
          }
          return o;
        });
      });
    });

    // Reconcile on reconnect
    const unsubReconcile = client.registerReconciliation(async () => {
      await loadOrders();
    });

    return () => {
      unsubNewOrder();
      unsubUpdateOrder();
      unsubReconcile();
    };
  }, [authState, loadOrders]);

  const [revenueStats, setRevenueStats] = useState({
    today_gross: 19200.00,
    today_orders_count: 42,
    weekly_gross: 114500.00,
    monthly_gross: 480000.00,
    platform_fee_percent: 12.0,
    net_earnings_today: 16896.00,
    pending_payout: 48200.00
  });

  // Action: Accept Order (PLACED -> CONFIRMED)
  const handleAcceptOrder = async (orderId) => {
    if (!isStoreOnline) {
      setOrderFeedback({
        type: 'error',
        message: 'Cannot accept new orders while restaurant is CLOSED. Please toggle your restaurant to OPEN first.'
      });
      setTimeout(() => setOrderFeedback(null), 5000);
      return;
    }

    setActionInProgress(orderId);
    try {
      const res = await acceptRestaurantOrder(orderId);
      const updated = res.order;
      setOrders(prev => prev.map(o => o.id === orderId ? (updated || { ...o, status: 'CONFIRMED' }) : o));
      setOrderFeedback({
        type: 'success',
        message: `Order #${updated?.order_number || orderId} accepted & confirmed by kitchen!`
      });
      setTimeout(() => setOrderFeedback(null), 4000);
      return res;
    } catch (err) {
      setOrderFeedback({
        type: 'error',
        message: err.message || 'Failed to accept order.'
      });
      setTimeout(() => setOrderFeedback(null), 5000);
      throw err;
    } finally {
      setActionInProgress(null);
    }
  };

  // Action: Reject Order with Reason (PLACED -> CANCELLED)
  const handleRejectOrder = async (orderId, reason, explanation = '') => {
    setActionInProgress(orderId);
    try {
      const res = await rejectRestaurantOrder(orderId, { reason, explanation });
      const updated = res.order;
      setOrders(prev => prev.map(o => o.id === orderId ? (updated || { ...o, status: 'CANCELLED', rejection_reason: reason }) : o));
      setOrderFeedback({
        type: 'success',
        message: `Order #${updated?.order_number || orderId} declined: ${reason}`
      });
      setTimeout(() => setOrderFeedback(null), 4000);
      return res;
    } catch (err) {
      setOrderFeedback({
        type: 'error',
        message: err.message || 'Failed to reject order.'
      });
      setTimeout(() => setOrderFeedback(null), 5000);
      throw err;
    } finally {
      setActionInProgress(null);
    }
  };

  // Action: Mark Preparing (CONFIRMED -> PREPARING)
  const handlePrepareOrder = async (orderId) => {
    setActionInProgress(orderId);
    try {
      const res = await prepareRestaurantOrder(orderId);
      const updated = res.order;
      setOrders(prev => prev.map(o => o.id === orderId ? (updated || { ...o, status: 'PREPARING' }) : o));
      setOrderFeedback({
        type: 'success',
        message: `Order #${updated?.order_number || orderId} is now PREPARING in the kitchen.`
      });
      setTimeout(() => setOrderFeedback(null), 4000);
      return res;
    } catch (err) {
      setOrderFeedback({
        type: 'error',
        message: err.message || 'Failed to mark order as preparing.'
      });
      setTimeout(() => setOrderFeedback(null), 5000);
      throw err;
    } finally {
      setActionInProgress(null);
    }
  };

  // Action: Mark Ready for Pickup (PREPARING -> READY_FOR_PICKUP)
  const handleReadyOrder = async (orderId) => {
    setActionInProgress(orderId);
    try {
      const res = await readyRestaurantOrder(orderId);
      const updated = res.order;
      setOrders(prev => prev.map(o => o.id === orderId ? (updated || { ...o, status: 'READY_FOR_PICKUP' }) : o));
      setOrderFeedback({
        type: 'success',
        message: `Order #${updated?.order_number || orderId} marked READY FOR PICKUP!`
      });
      setTimeout(() => setOrderFeedback(null), 4000);
      return res;
    } catch (err) {
      setOrderFeedback({
        type: 'error',
        message: err.message || 'Failed to mark order ready for pickup.'
      });
      setTimeout(() => setOrderFeedback(null), 5000);
      throw err;
    } finally {
      setActionInProgress(null);
    }
  };

  const updateOrderStatusFn = async (orderId, newStatus, reason = '') => {
    const res = await apiUpdateOrderStatus(orderId, newStatus, reason);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    return res;
  };

  return (
    <ShopContext.Provider value={{
      // Phase 11: Real Restaurant Orders State & Actions
      orders,
      activeOrders: orders.filter(o => ['PLACED', 'CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'READY'].includes(o.status)),
      newOrders: orders.filter(o => o.status === 'PLACED'),
      acceptedOrders: orders.filter(o => o.status === 'CONFIRMED' || o.status === 'ACCEPTED'),
      preparingOrders: orders.filter(o => o.status === 'PREPARING'),
      readyOrders: orders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'READY'),
      cancelledOrders: orders.filter(o => o.status === 'CANCELLED'),
      completedOrders: orders.filter(o => o.status === 'DELIVERED'),
      historyOrders: orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status)),
      isLoadingOrders,
      orderError,
      orderFilter,
      setOrderFilter,
      orderSearch,
      setOrderSearch,
      actionInProgress,
      orderFeedback,
      setOrderFeedback,
      loadOrders,
      handleAcceptOrder,
      handleRejectOrder,
      handlePrepareOrder,
      handleReadyOrder,
      handleMarkReady: handleReadyOrder,
      updateOrderStatus: updateOrderStatusFn,
      // Phase 8: Menu & Categories
      menuItems,
      loadFoods,
      addFoodItem,
      addMenuItem: addFoodItem,
      editFoodItem,
      deleteMenuItem,
      toggleItemAvailability,
      isLoadingMenu,
      menuCategories,
      loadCategories,
      addCategory,
      editCategory,
      removeCategory,
      toggleCategoryStatus,
      isLoadingCategories,
      // Phase 8: Restaurant Availability
      isStoreOnline,
      setIsStoreOnline,
      availabilityStatus,
      setAvailabilityStatus,
      isTogglingAvailability,
      toggleAvailability,
      availabilityFeedback,
      // Phase 8: Restaurant Profile
      currentUser,
      setCurrentUser,
      restaurantProfileData,
      isLoadingProfile,
      fetchProfile,
      updateProfile,
      removeRestaurantLogo,
      // Stats & Alerts
      newOrderAlert,
      setNewOrderAlert,
      revenueStats,
      stats: revenueStats,
      // Phase 6: Settings & Preferences
      userSettings,
      isLoadingSettings,
      fetchSettings,
      updateSettings,
      // Phase 22: Restaurant Business Suite
      operatingSettings,
      isLoadingOperatingSettings,
      operatingSettingsFeedback,
      loadOperatingSettings,
      updateOperatingSettings: handleUpdateOperatingSettings,
      toggleOrdersPaused: handleToggleOrdersPaused,
      updateMenuItemSchedule: handleUpdateMenuItemSchedule,
      toggleMenuItemSoldOut: handleToggleMenuItemSoldOut,
      exportRestaurantOrdersCSV: handleExportOrdersCSV,
      exportOrdersCSV: handleExportOrdersCSV,
      // Auth States
      authState,
      showLogoutConfirm,
      setShowLogoutConfirm,
      showSessionExpired,
      setShowSessionExpired,
      isLoggingOut,
      logoutFeedback,
      promptLogout,
      cancelLogout,
      confirmLogout,
      handleSessionExpired
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within ShopProvider');
  return context;
};
