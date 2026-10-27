import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  fetchFoods, 
  fetchRestaurants, 
  fetchCategories,
  fetchRestaurantDetail,
  fetchFoodDetail,
  fetchReels, 
  fetchOrders, 
  createOrder as apiCreateOrder,
  apiCheckoutOrder,
  fetchCustomerOrders,
  fetchCustomerOrderDetail,
  apiCancelCustomerOrder,
  loginCustomer,
  logoutCustomer,
  clearCustomerAuthData,
  fetchCurrentUser,
  fetchWithAuth,
  fetchCustomerProfile,
  updateCustomerProfile,
  deleteCustomerProfilePhoto,
  fetchUserSettings,
  updateUserSettings,
  fetchCustomerCart,
  apiAddToCart,
  apiUpdateCartItem,
  apiRemoveCartItem,
  apiClearCustomerCart,
  fetchCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  fetchWishlist as apiFetchWishlist,
  addWishlistItem as apiAddWishlistItem,
  removeWishlistItem as apiRemoveWishlistItem,
  FALLBACK_FOODS, 
  FALLBACK_RESTAURANTS, 
  FALLBACK_CATEGORIES,
  FALLBACK_REELS 
} from '../services/api.js';
import { applyTheme, applyLanguage } from '../utils/i18n.js';
import { getRealtimeClient } from '../utils/realtime.js';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  // Food, restaurant & social state (Guaranteed to be arrays)
  const [foods, setFoods] = useState(FALLBACK_FOODS);
  const [restaurants, setRestaurants] = useState(FALLBACK_RESTAURANTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [reels, setReels] = useState(FALLBACK_REELS);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [ordersFilter, setOrdersFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recently Viewed state persisted to localStorage
  const [recentlyViewedRestaurants, setRecentlyViewedRestaurants] = useState(() => {
    try {
      const saved = localStorage.getItem('fd_recently_viewed_restaurants');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewedFoods, setRecentlyViewedFoods] = useState(() => {
    try {
      const saved = localStorage.getItem('fd_recently_viewed_foods');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentlyViewedRestaurant = useCallback((restaurant) => {
    if (!restaurant || !restaurant.id) return;
    setRecentlyViewedRestaurants(prev => {
      const filtered = prev.filter(r => r.id !== restaurant.id);
      const updated = [restaurant, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('fd_recently_viewed_restaurants', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const addRecentlyViewedFood = useCallback((food) => {
    if (!food || !food.id) return;
    setRecentlyViewedFoods(prev => {
      const filtered = prev.filter(f => f.id !== food.id);
      const updated = [food, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('fd_recently_viewed_foods', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Phase 9: Cart & Address State
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [cartConflict, setCartConflict] = useState(null);
  const [cartFeedback, setCartFeedback] = useState('');
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [wishlistEntries, setWishlistEntries] = useState([]);
  const [wishlistError, setWishlistError] = useState(null);

  // Declared early: referenced by the bootstrap useEffect dependency list
  // below. Declaring it after that effect throws
  // "Cannot access 'loadWishlist' before initialization" during render.
  const loadWishlist = useCallback(async () => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    try {
      const { entries, foods } = await apiFetchWishlist();
      setWishlistEntries(Array.isArray(entries) ? entries : []);
      setWishlist(Array.isArray(foods) ? foods : []);
      setWishlistError(null);
    } catch (err) {
      setWishlistError(err?.message || 'Failed to load wishlist');
    }
  }, []);
  const [selectedDish, setSelectedDish] = useState(null);
  const [activeReel, setActiveReel] = useState(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState({
    id: 9021,
    order_number: 'WS-9021-ALPH',
    status: 'ON_THE_WAY',
    otp: '8492',
    grand_total: 725.40,
    eta_minutes: 14,
    restaurant_name: 'CYBER SMASH BURGERS 2099',
    customer_address: '704 Neon Tower, Level 42, Neo Bengaluru',
    items: [
      { name: 'Quantum Double Glaze Burger', quantity: 1, price: 349.00 },
      { name: 'Crispy Truffle Shroom Burger', quantity: 1, price: 299.00 }
    ],
    rider: {
      name: 'Kaelen Vance',
      vehicle: 'Cyber E-Superbike [KA-05-CY-7700]',
      rating: 4.96,
      phone: '+91 98765 00003'
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fd_customer_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 1,
      username: 'priya_ram',
      email: 'customer@wsfood.io',
      role: 'CUSTOMER',
      address: '704 Neon Tower, Level 42, Neo Bengaluru Grid',
      phone: '+91 98765 00001'
    };
  });

  // Phase 4: Centralized Authentication States
  // 'authenticated' | 'unauthenticated' | 'refreshing_token' | 'session_expired' | 'logging_out'
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    return token ? 'authenticated' : 'unauthenticated';
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState('');

  const handleSessionExpired = useCallback(() => {
    clearCustomerAuthData();
    setAuthState('session_expired');
    setShowSessionExpired(true);
    setCurrentUser(null);
  }, []);


  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token) return null;
    setIsLoadingProfile(true);
    try {
      const data = await fetchCustomerProfile();
      const p = data.profile || data;
      setUserProfile(p);
      setCurrentUser(prev => ({ ...(prev || {}), ...p }));
      return p;
    } catch (err) {
      console.warn('Customer profile fetch non-fatal:', err);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const updateProfile = async (formDataOrData) => {
    setIsLoadingProfile(true);
    try {
      const res = await updateCustomerProfile(formDataOrData);
      const updated = res.profile || res;
      setUserProfile(updated);
      setCurrentUser(prev => ({ ...(prev || {}), ...updated }));
      return updated;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const removeProfilePhoto = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await deleteCustomerProfilePhoto();
      const updated = res.profile || res;
      setUserProfile(updated);
      setCurrentUser(prev => ({ ...(prev || {}), profile_photo: '', avatar: '' }));
      return updated;
    } finally {
      setIsLoadingProfile(false);
    }
  };

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
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
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
      console.warn('Customer settings fetch non-fatal:', err);
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

  // Phase 9 & 10: Foundational Data Loader Callbacks
  const loadCart = useCallback(async () => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    setIsLoadingCart(true);
    try {
      const data = await fetchCustomerCart();
      if (data) {
        setCart(Array.isArray(data.items) ? data.items : []);
        setCartRestaurant(data.restaurant || null);
      }
    } catch (err) {
      console.warn('Customer cart load non-fatal:', err);
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (token) {
      try {
        await apiClearCustomerCart();
      } catch (err) {
        console.warn('Clear cart non-fatal:', err);
      }
    }
    setCart([]);
    setCartRestaurant(null);
  }, []);

  const loadAddresses = useCallback(async () => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token) return [];
    setIsLoadingAddresses(true);
    try {
      const list = await fetchCustomerAddresses();
      const safeList = Array.isArray(list) ? list : [];
      setAddresses(safeList);
      if (safeList.length > 0) {
        setSelectedAddress(prev => {
          if (prev && safeList.some(a => a.id === prev.id)) return prev;
          return safeList.find(a => a.is_default) || safeList[0];
        });
      }
      return safeList;
    } catch (err) {
      console.warn('Customer addresses load non-fatal:', err);
      return [];
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  const loadOrders = useCallback(async (filter = 'all') => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token) return [];
    setIsLoadingOrders(true);
    try {
      const list = await fetchCustomerOrders(filter);
      const safeList = Array.isArray(list) ? list : [];
      setOrders(safeList);
      return safeList;
    } catch (err) {
      console.warn('Load orders non-fatal:', err);
      return [];
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const handleLogin = async (identifier, password) => {
    const data = await loginCustomer(identifier, password);
    if (data.access_token) {
      localStorage.setItem('fd_customer_token', data.access_token);
      localStorage.setItem('fd_access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('fd_customer_refresh', data.refresh_token);
      localStorage.setItem('fd_refresh_token', data.refresh_token);
    }
    const profile = data.basic_profile_information || {
      id: data.user_id,
      email: data.email,
      role: data.role
    };
    localStorage.setItem('fd_customer_user', JSON.stringify(profile));
    setCurrentUser(profile);
    setAuthState('authenticated');
    setShowSessionExpired(false);
    fetchProfile();
    fetchSettings();
    loadCart();
    loadAddresses();
    loadOrders('all');
    loadWishlist();
    return data;
  };

  const promptLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setAuthState('logging_out');
    const refresh = localStorage.getItem('fd_customer_refresh') || localStorage.getItem('fd_refresh_token');
    await logoutCustomer(refresh);
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    setAuthState('unauthenticated');
    setCurrentUser(null);
    clearCart();
    setCart([]);
    setCartRestaurant(null);
    setAddresses([]);
    setSelectedAddress(null);
    setWishlist([]);
    setWishlistEntries([]);
    setLogoutFeedback('You have been logged out successfully.');
    setTimeout(() => setLogoutFeedback(''), 4000);
  };

  const handleLogout = () => {
    promptLogout();
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('fd_theme') || 'light';
    const savedLang = localStorage.getItem('fd_language') || 'en';
    applyTheme(savedTheme);
    applyLanguage(savedLang);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
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
            localStorage.setItem('fd_customer_user', JSON.stringify(profile));
            fetchProfile();
            fetchSettings();
            loadCart();
            loadAddresses();
            loadOrders('all');
            loadWishlist();
          }
        })
        .catch(() => {
          // Token expired or invalid
          handleSessionExpired();
        });
    } else {
      setAuthState('unauthenticated');
    }
  }, [handleSessionExpired, fetchProfile, fetchSettings, loadCart, loadAddresses, loadOrders, loadWishlist]);

  // Phase 28: Real-Time Order Synchronization & Reconnect Recovery
  useEffect(() => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token || authState !== 'authenticated') return;

    const client = getRealtimeClient('CUSTOMER');

    // Subscribe to order updates
    const unsubOrder = client.subscribe('order.updated', (payload) => {
      const updatedOrderId = payload.entity_id || payload.order_id || payload.data?.order_id;
      const updatedStatus = payload.data?.status || payload.status || payload.order_status;

      if (!updatedOrderId) return;

      // Update active order if matching
      setActiveOrder(prev => {
        if (prev && String(prev.id) === String(updatedOrderId)) {
          return {
            ...prev,
            status: updatedStatus || prev.status,
            order_status: updatedStatus || prev.order_status,
            ...(payload.data || {})
          };
        }
        return prev;
      });

      // Update orders list idempotently
      setOrders(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(item => {
          if (String(item.id) === String(updatedOrderId)) {
            return {
              ...item,
              status: updatedStatus || item.status,
              order_status: updatedStatus || item.order_status,
              ...(payload.data || {})
            };
          }
          return item;
        });
      });
    });

    // Reconcile on reconnect
    const unsubReconcile = client.registerReconciliation(async () => {
      await loadOrders('all');
    });

    return () => {
      unsubOrder();
      unsubReconcile();
    };
  }, [authState, loadOrders]);



  // Fetch foods, restaurants, categories, reels and orders from DRF API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [foodsData, restsData, catsData, reelsData] = await Promise.all([
        fetchFoods(),
        fetchRestaurants(),
        fetchCategories(),
        fetchReels()
      ]);

      const foodList = Array.isArray(foodsData) ? foodsData : (foodsData?.results || FALLBACK_FOODS);
      const restList = Array.isArray(restsData) ? restsData : (restsData?.results || FALLBACK_RESTAURANTS);
      const catList = Array.isArray(catsData) ? catsData : (catsData?.results || FALLBACK_CATEGORIES);

      setFoods(foodList.length > 0 ? foodList : FALLBACK_FOODS);
      setRestaurants(restList.length > 0 ? restList : FALLBACK_RESTAURANTS);
      setCategories(catList.length > 0 ? catList : FALLBACK_CATEGORIES);
      setReels(Array.isArray(reelsData) && reelsData.length > 0 ? reelsData : FALLBACK_REELS);

      try {
        const ordersData = await fetchOrders();
        if (Array.isArray(ordersData) && ordersData.length > 0) {
          setOrders(ordersData);
          if (ordersData[0]) {
            setActiveOrder(ordersData[0]);
          }
        }
      } catch (orderErr) {
        console.warn('Orders load non-critical warning:', orderErr);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
      setError(err?.message || 'Could not connect to FD FOODS backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Phase 9: Real-Life Cart Operations
  // ---------------------------------------------------------------------------
  const addToCart = async (food, quantity = 1, options = {}) => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    const safeQty = Math.max(1, Number(quantity) || 1);

    // If authenticated, sync with PostgreSQL Cart API
    if (token) {
      setIsLoadingCart(true);
      try {
        let safeVariantId = null;
        const candidateVariantId = options.variant_id !== undefined ? options.variant_id : options.variant?.id;
        if (typeof candidateVariantId === 'number' && candidateVariantId > 0) {
          safeVariantId = candidateVariantId;
        } else if (typeof candidateVariantId === 'string' && /^\d+$/.test(candidateVariantId.trim())) {
          safeVariantId = parseInt(candidateVariantId.trim(), 10);
        } else if (candidateVariantId !== null && candidateVariantId !== undefined && candidateVariantId !== '' && candidateVariantId !== 'null' && candidateVariantId !== 'undefined') {
          safeVariantId = candidateVariantId;
        }

        const rawAddons = options.addon_ids || (options.selected_addons || []).map(a => a.id);
        const safeAddonIds = Array.isArray(rawAddons)
          ? rawAddons
              .map(item => (typeof item === 'object' && item !== null) ? item.id : item)
              .filter(id => (typeof id === 'number' && id > 0) || (typeof id === 'string' && /^\d+$/.test(String(id).trim()) && parseInt(String(id).trim(), 10) > 0))
              .map(id => parseInt(id, 10))
          : [];

        const payload = {
          food_id: food.id,
          quantity: safeQty,
          variant_id: safeVariantId,
          addon_ids: safeAddonIds,
          special_instructions: options.special_instructions || '',
          clear_cart: !!options.clear_cart
        };
        const res = await apiAddToCart(payload);
        if (res.cart) {
          setCart(Array.isArray(res.cart.items) ? res.cart.items : []);
          setCartRestaurant(res.cart.restaurant || null);
        }
        setCartFeedback(res.message || `✓ Added ${safeQty}x ${food.name} to cart!`);
        setTimeout(() => setCartFeedback(''), 3500);
        return res;
      } catch (err) {
        if (err.conflict) {
          // Trigger Single Restaurant conflict confirmation modal
          setCartConflict({
            current_restaurant: err.current_restaurant,
            new_restaurant: err.new_restaurant,
            pendingItem: food,
            quantity: safeQty,
            options
          });
          return { conflict: true };
        } else {
          setCartFeedback(err.message || 'Failed to add item to cart.');
          setTimeout(() => setCartFeedback(''), 4000);
          throw err;
        }
      } finally {
        setIsLoadingCart(false);
      }
    }

    // Local / Guest fallback
    const targetRestId = food.restaurant || food.restaurant_id || (food.restaurant_name ? food.restaurant_name : null);
    if (cartRestaurant && cartRestaurant.id && targetRestId && cartRestaurant.id !== targetRestId && cart.length > 0) {
      if (!options.clear_cart) {
        setCartConflict({
          current_restaurant: cartRestaurant,
          new_restaurant: { id: targetRestId, name: food.restaurant_name || 'New Restaurant' },
          pendingItem: food,
          quantity: safeQty,
          options
        });
        return { conflict: true };
      } else {
        setCart([]);
      }
    }

    setCart(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const optVariantId = options.variant?.id || options.variant_id || null;
      const existingIndex = safePrev.findIndex(item => 
        item.id === food.id && 
        ((item.variant_details?.id || item.variant_id || null) === optVariantId)
      );
      if (existingIndex > -1) {
        const updated = [...safePrev];
        updated[existingIndex].quantity += safeQty;
        return updated;
      }
      return [...safePrev, {
        ...food,
        id: food.id,
        food_id: food.id,
        quantity: safeQty,
        selected_addons: options.selected_addons || [],
        variant_details: options.variant || null,
        special_instructions: options.special_instructions || '',
        unit_price: Number(food.price || 0) + (options.variant?.price_modifier || 0) + (options.selected_addons || []).reduce((s, a) => s + Number(a.price || 0), 0)
      }];
    });
    if (food.restaurant_id || food.restaurant_name) {
      setCartRestaurant({ id: food.restaurant_id, name: food.restaurant_name });
    }
    setCartFeedback(`✓ Added ${safeQty}x ${food.name} to cart!`);
    setTimeout(() => setCartFeedback(''), 3500);
  };

  const updateQuantity = async (itemId, deltaOrQty, isDelta = true) => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (token) {
      setIsLoadingCart(true);
      try {
        const res = await apiUpdateCartItem(itemId, isDelta ? { delta: deltaOrQty } : { quantity: deltaOrQty });
        if (res.cart) {
          setCart(Array.isArray(res.cart.items) ? res.cart.items : []);
          setCartRestaurant(res.cart.restaurant || null);
        }
        return res;
      } catch (err) {
        console.error('Update cart item error:', err);
      } finally {
        setIsLoadingCart(false);
      }
    }

    // Local fallback
    setCart(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(item => {
        if (item.id === itemId) {
          const nextQty = isDelta ? item.quantity + deltaOrQty : deltaOrQty;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = async (itemId) => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (token) {
      setIsLoadingCart(true);
      try {
        const res = await apiRemoveCartItem(itemId);
        if (res.cart) {
          setCart(Array.isArray(res.cart.items) ? res.cart.items : []);
          setCartRestaurant(res.cart.restaurant || null);
        }
        return res;
      } catch (err) {
        console.error('Remove cart item error:', err);
      } finally {
        setIsLoadingCart(false);
      }
    }

    setCart(prev => (Array.isArray(prev) ? prev.filter(item => item.id !== itemId) : []));
  };

  const resolveConflict = async (proceed) => {
    if (proceed && cartConflict) {
      const { pendingItem, quantity, options } = cartConflict;
      setCartConflict(null);
      await addToCart(pendingItem, quantity, { ...options, clear_cart: true });
    } else {
      setCartConflict(null);
    }
  };

  // Calculations
  const cartSubtotal = (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
    const price = Number(item.unit_price ?? item.food_price ?? item.price ?? 0);
    const qty = Number(item.quantity || 1);
    return sum + (price * qty);
  }, 0);
  const cartTotal = cartSubtotal;
  const cartCount = (Array.isArray(cart) ? cart : []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const cartDeliveryFee = cartCount > 0 ? 30 : 0;
  const cartPackagingFee = cartCount > 0 ? 15 : 0;
  const cartGrandTotal = cartSubtotal > 0 ? cartSubtotal + cartDeliveryFee + cartPackagingFee : 0;

  // ---------------------------------------------------------------------------
  // Phase 9: Real-Life Delivery Address Foundation
  // ---------------------------------------------------------------------------
  const addAddress = async (addrData) => {
    setIsLoadingAddresses(true);
    try {
      const created = await createCustomerAddress(addrData);
      await loadAddresses();
      return created;
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const editAddress = async (addrId, addrData) => {
    setIsLoadingAddresses(true);
    try {
      const updated = await updateCustomerAddress(addrId, addrData);
      await loadAddresses();
      return updated;
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const removeAddress = async (addrId) => {
    setIsLoadingAddresses(true);
    try {
      await deleteCustomerAddress(addrId);
      await loadAddresses();
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const chooseDefaultAddress = async (addrId) => {
    setIsLoadingAddresses(true);
    try {
      const res = await setDefaultCustomerAddress(addrId);
      await loadAddresses();
      return res;
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Wishlist toggle (real backend persistence; falls back to local-only for guests).
  // State + loader live near the top of the provider (see above) so the
  // bootstrap effect can safely list loadWishlist in its dependencies.
  const toggleWishlist = async (food) => {
    const token = localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token');
    if (!token || !food?.id) {
      // Guest or invalid item: local-only toggle (not persisted)
      setWishlist(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const exists = safePrev.some(item => item.id === food?.id);
        return exists ? safePrev.filter(item => item.id !== food.id) : [...safePrev, food];
      });
      return { persisted: false };
    }
    const entry = wishlistEntries.find(e => (e?.product?.id ?? e?.product_id) === food.id);
    try {
      if (entry) {
        await apiRemoveWishlistItem(entry.id);
      } else {
        await apiAddWishlistItem(food.id);
      }
      await loadWishlist();
      setWishlistError(null);
      return { persisted: true, added: !entry };
    } catch (err) {
      // Swallow here so fire-and-forget callers (food cards) never cause
      // unhandled promise rejections; surfaces via wishlistError state.
      setWishlistError(err?.message || 'Failed to save favorite');
      return { persisted: false, error: err?.message || 'Failed to save favorite' };
    }
  };

  // Phase 10: Real-Life Orders Foundation
  const checkoutOrder = async ({ 
    address_id, 
    payment_method = 'UPI (Instant)', 
    cooking_instructions = '',
    coupon_code = '',
    points_to_redeem = 0 
  }) => {
    setIsPlacingOrder(true);
    setOrderError(null);
    try {
      const res = await apiCheckoutOrder({
        address_id: address_id || selectedAddress?.id,
        payment_method,
        cooking_instructions,
        coupon_code,
        points_to_redeem
      });
      const created = res.order || res;
      setActiveOrder(created);
      // Synchronize fresh cart and orders from PostgreSQL
      await loadCart();
      await loadOrders('all');
      return created;
    } catch (err) {
      const msg = err.message || 'Failed to place order';
      setOrderError(msg);
      throw err;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const res = await apiCancelCustomerOrder(orderId);
      const updated = res.order;
      setOrders(prev => (Array.isArray(prev) ? prev.map(o => o.id === orderId ? (updated || { ...o, status: 'CANCELLED', order_status: 'CANCELLED', can_cancel: false }) : o) : []));
      if (activeOrder && activeOrder.id === orderId) {
        setActiveOrder(prev => ({ ...prev, status: 'CANCELLED', order_status: 'CANCELLED', can_cancel: false }));
      }
      return res;
    } catch (err) {
      console.error('Cancel order error:', err);
      throw err;
    }
  };

  // Legacy Order Placement compatibility
  const handleCreateOrder = async (orderData) => {
    try {
      return await checkoutOrder({
        address_id: orderData.address_id || selectedAddress?.id,
        payment_method: orderData.payment_method,
        cooking_instructions: orderData.cooking_instructions
      });
    } catch (err) {
      console.warn('Order API error, simulating local confirmation:', err);
      const fallbackPlaced = {
        ...orderData,
        id: Math.floor(10000 + Math.random() * 90000),
        status: 'CONFIRMED'
      };
      setActiveOrder(fallbackPlaced);
      setOrders(prev => [fallbackPlaced, ...(Array.isArray(prev) ? prev : [])]);
      clearCart();
      return fallbackPlaced;
    }
  };

  return (
    <CustomerContext.Provider value={{
      foods,
      setFoods,
      restaurants,
      setRestaurants,
      categories,
      setCategories,
      activeRestaurant,
      setActiveRestaurant,
      recentlyViewedRestaurants,
      recentlyViewedFoods,
      addRecentlyViewedRestaurant,
      addRecentlyViewedFood,
      fetchRestaurantDetail,
      fetchFoodDetail,
      fetchRestaurants,
      fetchFoods,
      fetchCategories,
      reels,
      setReels,
      orders,
      setOrders,
      loading,
      error,
      refreshData: loadData,
      // Phase 9: Cart State & Operations
      cart,
      setCart,
      cartRestaurant,
      cartConflict,
      setCartConflict,
      cartFeedback,
      isLoadingCart,
      loadCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      resolveConflict,
      cartSubtotal,
      cartTotal,
      cartCount,
      cartDeliveryFee,
      cartPackagingFee,
      cartGrandTotal,

      // Phase 9: Delivery Address State & Operations
      addresses,
      selectedAddress,
      setSelectedAddress,
      isLoadingAddresses,
      loadAddresses,
      addAddress,
      editAddress,
      removeAddress,
      chooseDefaultAddress,
      wishlist,
      toggleWishlist,
      loadWishlist,
      wishlistError,
      selectedDish,
      setSelectedDish,
      activeReel,
      setActiveReel,
      isAIOpen,
      setIsAIOpen,
      activeOrder,
      setActiveOrder,
      currentUser,
      setCurrentUser,
      userProfile,
      isLoadingProfile,
      fetchProfile,
      updateProfile,
      removeProfilePhoto,

      // Phase 6: Settings & Preferences
      userSettings,
      isLoadingSettings,
      fetchSettings,
      updateSettings,

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
      handleSessionExpired,
      login: handleLogin,
      logout: handleLogout,
      createOrder: handleCreateOrder,

      // Phase 10: Orders Foundation
      isLoadingOrders,
      isPlacingOrder,
      orderError,
      setOrderError,
      ordersFilter,
      setOrdersFilter,
      loadOrders,
      checkoutOrder,
      cancelOrder,
      fetchOrderDetail: fetchCustomerOrderDetail
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within CustomerProvider');
  return context;
};
