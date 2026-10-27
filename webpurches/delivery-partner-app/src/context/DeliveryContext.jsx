import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_ACTIVE_TRIP, 
  INITIAL_DELIVERY_REQUESTS, 
  INITIAL_TRANSACTIONS, 
  AVAILABLE_SHIFTS, 
  VEHICLES_DATA, 
  KYC_DOCUMENTS, 
  INITIAL_NOTIFICATIONS, 
  DEMAND_ZONES,
  BATCH_DELIVERY_DATA,
  verifyDeliveryOTP,
  logoutPartner,
  clearDeliveryAuthData,
  fetchCurrentUser,
  fetchPartnerProfile,
  updatePartnerProfile,
  deletePartnerPhoto,
  fetchUserSettings,
  updateUserSettings,
  fetchAvailableJobs,
  fetchActiveTask,
  fetchTaskDetails,
  acceptDeliveryJob,
  markReachedRestaurant,
  confirmFoodPickup,
  reportDeliveryIssue,
  fetchCompletedDeliveries,
  fetchDeliveryDashboard,
  toggleRiderOnlineStatus,
  fetchDeliveryHistory,
  fetchDeliveryHistoryDetail,
  fetchDeliveryIssues,
  publishPartnerLocation,
  fetchNotifications,
  fetchNotificationUnreadCount,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  fetchCurrentOffer,
  acceptOffer,
  rejectOffer,
  fetchDeliveryEarnings,
  fetchRiderPayouts
} from '../services/api.js';
import { applyTheme, applyLanguage } from '../utils/i18n.js';
import { getRealtimeClient } from '../utils/realtime.js';
import { 
  playOrderAlert, 
  playStateAdvance, 
  playSuccess, 
  playClick, 
  isAudioMuted, 
  setAudioMuted 
} from '../utils/soundEffects.js';

const DeliveryContext = createContext();

export const DeliveryProvider = ({ children }) => {
  // Operational Status
  const [isOnline, setIsOnline] = useState(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [audioMuted, setAudioMutedState] = useState(isAudioMuted());

  // Active Trip (Full 8-Step Lifecycle State Machine)
  const [activeTrip, setActiveTrip] = useState(INITIAL_ACTIVE_TRIP);
  const [cachedTrip, setCachedTrip] = useState(INITIAL_ACTIVE_TRIP);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [batchTrip, setBatchTrip] = useState(BATCH_DELIVERY_DATA);

  // Speed and EV Telemetry
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(38);
  const [currentHeadingDeg, setCurrentHeadingDeg] = useState(42);
  const [activeVehicle, setActiveVehicle] = useState(VEHICLES_DATA[0]);

  // Operational Financials & Performance Metrics
  const [earnings, setEarnings] = useState({
    today: 1240.00,
    weekly: 9820.00,
    monthly: 41200.00,
    deliveries_today: 8,
    rating: 4.88,
    online_time: '6h 24m',
    distance_km: 42.6,
    tips_today: 180.00,
    surge_bonus_today: 240.00,
    incentives_today: 300.00,
    withdrawable_balance: 2480.00,
    pending_balance: 650.00,
    last_settlement_text: '₹8,250.00 settled yesterday at 11:45 PM'
  });

  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Phase 3A: Verified payout ledger (INTERNAL LEDGER, real backend data)
  const [ledger, setLedger] = useState({
    loading: false,
    error: null,
    summary: null,
    payouts: []
  });

  const loadLedger = useCallback(async () => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    setLedger(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [earningsData, payoutsData] = await Promise.all([
        fetchDeliveryEarnings(),
        fetchRiderPayouts()
      ]);
      setLedger({
        loading: false,
        error: null,
        summary: earningsData?.ledger || null,
        earnings: earningsData || null,
        payouts: Array.isArray(payoutsData?.payouts) ? payoutsData.payouts : []
      });
    } catch (err) {
      setLedger(prev => ({
        ...prev,
        loading: false,
        error: err?.message || 'Failed to load payout ledger'
      }));
    }
  }, []);
  const [shifts, setShifts] = useState(AVAILABLE_SHIFTS);
  const [documents, setDocuments] = useState(KYC_DOCUMENTS);
  const [sosActive, setSosActive] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Show Toast Notification
  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4500);
  }, []);

  // Phase 17: Notifications State & Derived Count
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(() => {
    return Array.isArray(notifications)
      ? notifications.filter(n => !n.read && !n.is_read).length
      : 0;
  });

  useEffect(() => {
    if (Array.isArray(notifications)) {
      setUnreadNotifsCount(notifications.filter(n => !n.read && !n.is_read).length);
    }
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    try {
      const data = await fetchNotifications();
      if (data && Array.isArray(data.results)) {
        setNotifications(data.results);
      }
      try {
        const countData = await fetchNotificationUnreadCount();
        if (countData && typeof countData.unread_count === 'number') {
          setUnreadNotifsCount(countData.unread_count);
        }
      } catch {
        // Retain local derived count if count API fails
      }
    } catch {
      // Retain existing notifications on failure
    }
  }, []);

  // Mark notification read
  const markNotificationRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n));
    setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
      try {
        await apiMarkNotificationRead(id);
      } catch (err) {
        console.warn('API mark notification read warning:', err);
      }
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
    setUnreadNotifsCount(0);
    try {
      await apiMarkAllNotificationsRead();
    } catch (err) {
      console.warn('API mark all notifications read warning:', err);
    }
    showToast('All notifications marked as read.', 'info');
  }, [showToast]);

  // Phase 4: Token Security, Session Management & Real Logout
  const [authState, setAuthState] = useState(() => {
    return (localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token')) ? 'authenticated' : 'unauthenticated';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fd_delivery_partner_session');
      if (saved) return JSON.parse(saved).profile || JSON.parse(saved);
    } catch {}
    return {
      email: 'courier@wsfood.io',
      role: 'DELIVERY_PARTNER',
      name: 'Rider Arjun Verma'
    };
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState('');

  const handleSessionExpired = useCallback(() => {
    clearDeliveryAuthData();
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
    const refresh = localStorage.getItem('fd_delivery_refresh') || localStorage.getItem('fd_refresh_token');
    await logoutPartner(refresh);
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    setAuthState('unauthenticated');
    setCurrentUser(null);
    setLogoutFeedback('You have been logged out successfully.');
    setTimeout(() => setLogoutFeedback(''), 4000);
  }, []);

  const [deliveryProfileData, setDeliveryProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token) return null;
    setIsLoadingProfile(true);
    try {
      const data = await fetchPartnerProfile();
      const p = data.profile || data;
      setDeliveryProfileData(p);
      setCurrentUser(prev => ({ ...(prev || {}), ...p }));
      return p;
    } catch (err) {
      console.warn('Delivery partner profile fetch non-fatal:', err);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const updateProfile = async (formDataOrData) => {
    setIsLoadingProfile(true);
    try {
      const res = await updatePartnerProfile(formDataOrData);
      const updated = res.profile || res;
      setDeliveryProfileData(updated);
      setCurrentUser(prev => ({ ...(prev || {}), ...updated }));
      return updated;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const removePartnerPhoto = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await deletePartnerPhoto();
      const updated = res.profile || res;
      setDeliveryProfileData(updated);
      setCurrentUser(prev => ({ ...(prev || {}), profile_photo: '', avatar: '' }));
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
    location_permission_preference: true,
    shift: 'OFFLINE',
    preferred_start_time: '09:00',
    preferred_end_time: '18:00',
    available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    break_start: '13:00',
    break_end: '14:00',
    preferred_zone: 'Central City',
    availability: 'Available'
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
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
      console.warn('Delivery partner settings fetch non-fatal:', err);
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

  useEffect(() => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
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
            localStorage.setItem('fd_delivery_user', JSON.stringify(profile));
            fetchProfile();
            fetchSettings();
            loadNotifications();
            loadLedger();
          }
        })
        .catch(() => {
          handleSessionExpired();
        });
    } else {
      setAuthState('unauthenticated');
    }
  }, [handleSessionExpired, fetchProfile, fetchSettings, loadNotifications, loadLedger]);

  // Phase 12 Real Delivery Operations State
  const [availableJobs, setAvailableJobs] = useState([]);
  const [realActiveTask, setRealActiveTask] = useState(null);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [cancelledTasks, setCancelledTasks] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({
    available_jobs: 0,
    active_task: 0,
    picked_up: 0,
    completed_today: 0
  });
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);

  // Phase 13 Delivery History & Issue Reporting State
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deliveryIssues, setDeliveryIssues] = useState([]);

  const refreshDashboardData = useCallback(async () => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    setIsLoadingJobs(true);
    setDeliveryError(null);
    try {
      const data = await fetchDeliveryDashboard();
      if (data) {
        if (data.summary) setDashboardSummary(data.summary);
        if (data.available_jobs) setAvailableJobs(data.available_jobs);
        if (data.active_task !== undefined) {
          setRealActiveTask(data.active_task);
        }
        if (data.completed_deliveries) setCompletedDeliveries(data.completed_deliveries);
        if (data.cancelled_tasks) setCancelledTasks(data.cancelled_tasks);
        if (data.partner && data.partner.is_online !== undefined) {
          setIsOnline(data.partner.is_online);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch non-fatal:', err);
      setDeliveryError(err.message || 'Failed to load delivery data');
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  const fetchHistory = useCallback(async (search = '', dateFilter = '') => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token) return { history: [], count: 0 };
    setIsLoadingHistory(true);
    try {
      const data = await fetchDeliveryHistory(search, dateFilter);
      setDeliveryHistory(data.history || []);
      return data;
    } catch (err) {
      console.warn('History fetch non-fatal:', err);
      return { history: [], count: 0 };
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleToggleOnline = useCallback(async () => {
    playClick();
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token) {
      setIsOnline(prev => !prev);
      return;
    }
    try {
      const res = await toggleRiderOnlineStatus();
      setIsOnline(res.is_online);
      showToast(res.is_online ? 'You are now ONLINE. Dispatch engine searching for orders.' : 'You are now OFFLINE. Shift paused.', res.is_online ? 'success' : 'warning');
      refreshDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle online status', 'error');
    }
  }, [showToast, refreshDashboardData]);

  const handleAcceptJob = useCallback(async (jobId) => {
    setIsActionPending(true);
    setDeliveryError(null);
    try {
      const res = await acceptDeliveryJob(jobId);
      showToast(res.message || 'Job accepted successfully!', 'success');
      playSuccess();
      await refreshDashboardData();
      return res;
    } catch (err) {
      const errorMsg = err.message || (err.status === 409 ? 'This job has already been accepted by another delivery partner.' : 'Failed to accept job.');
      setDeliveryError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setIsActionPending(false);
    }
  }, [showToast, refreshDashboardData]);

  const handleReachedRestaurant = useCallback(async (taskId) => {
    setIsActionPending(true);
    try {
      const res = await markReachedRestaurant(taskId);
      showToast('Arrived at restaurant location!', 'success');
      playSuccess();
      await refreshDashboardData();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to mark reached restaurant', 'error');
      throw err;
    } finally {
      setIsActionPending(false);
    }
  }, [showToast, refreshDashboardData]);

  const handleConfirmPickup = useCallback(async (taskId, payload = {}) => {
    setIsActionPending(true);
    try {
      const res = await confirmFoodPickup(taskId, payload);
      showToast('Food pickup confirmed! Order is in transit.', 'success');
      playSuccess();
      await refreshDashboardData();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to confirm pickup', 'error');
      throw err;
    } finally {
      setIsActionPending(false);
    }
  }, [showToast, refreshDashboardData]);

  const handleVerifyDeliveryOTP = useCallback(async (taskId, payloadOrOtp) => {
    setIsActionPending(true);
    setDeliveryError(null);
    try {
      const res = await verifyDeliveryOTP(taskId, payloadOrOtp);
      showToast(res.message || 'Delivery successfully verified and marked as delivered!', 'success');
      playSuccess();
      await refreshDashboardData();
      await fetchHistory();
      return res;
    } catch (err) {
      const msg = err.data?.error || err.message || 'Failed to verify delivery OTP.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsActionPending(false);
    }
  }, [showToast, refreshDashboardData, fetchHistory]);

  const handleReportIssue = useCallback(async (taskId, categoryOrPayload, descOrNotes = '', cancelTask = false) => {
    setIsActionPending(true);
    try {
      let payload;
      if (typeof categoryOrPayload === 'object' && categoryOrPayload !== null) {
        payload = categoryOrPayload;
      } else {
        payload = {
          category: categoryOrPayload,
          description: descOrNotes,
          notes: descOrNotes,
          cancel_task: cancelTask
        };
      }
      const res = await reportDeliveryIssue(taskId, payload);
      const isCancelled = res.cancelled || payload.cancel_task;
      showToast(
        isCancelled 
          ? 'Delivery issue reported. Task cancelled and released.' 
          : 'Delivery issue logged in operations system. Task remains active.',
        isCancelled ? 'warning' : 'info'
      );
      await refreshDashboardData();
      return res;
    } catch (err) {
      const msg = err.data?.error || err.message || 'Failed to report issue';
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsActionPending(false);
    }
  }, [showToast, refreshDashboardData]);

  useEffect(() => {
    refreshDashboardData();
    fetchHistory();
  }, [refreshDashboardData, fetchHistory]);

  // Audio Toggle
  const toggleAudio = useCallback(() => {
    const next = !audioMuted;
    setAudioMutedState(next);
    setAudioMuted(next);
    if (!next) playClick();
  }, [audioMuted]);

  // Online / Offline Switch
  const toggleOnline = handleToggleOnline;

  // Network Offline Mode Simulator
  const toggleOfflineSimulation = useCallback(() => {
    playClick();
    setIsSimulatedOffline(prev => {
      const next = !prev;
      if (next) {
        showToast("Offline Mode Active. Critical trip data cached locally.", "warning");
      } else {
        showToast("Network Connection Restored. Telemetry synced with command center.", "success");
      }
      return next;
    });
  }, [showToast]);

  // Cycle speed to simulate dynamic realistic transit
  useEffect(() => {
    if (!isOnline || !activeTrip || isSimulatedOffline) return;
    const interval = setInterval(() => {
      setCurrentSpeedKmh(Math.floor(Math.random() * 16) + 32);
      setCurrentHeadingDeg(prev => (prev + (Math.random() * 4 - 2)) % 360);
    }, 2500);
    return () => clearInterval(interval);
  }, [isOnline, activeTrip, isSimulatedOffline]);

  // Cache trip data when activeTrip updates
  useEffect(() => {
    if (activeTrip) {
      setCachedTrip(activeTrip);
    }
  }, [activeTrip]);

  // State Machine: Advance Trip Step
  const advanceTripStep = useCallback(() => {
    if (!activeTrip) return;
    const currentStep = activeTrip.step_index;
    const nextStep = currentStep + 1;

    // Steps:
    // 0: ORDER_ASSIGNED
    // 1: ARRIVING_AT_RESTAURANT
    // 2: ARRIVED_AT_RESTAURANT
    // 3: PICKUP_CONFIRMED
    // 4: ORDER_IN_TRANSIT
    // 5: ARRIVING_AT_CUSTOMER
    // 6: VERIFY_DELIVERY
    // 7: DELIVERED
    if (nextStep === 1) {
      playStateAdvance();
      setActiveTrip(prev => ({ ...prev, step_index: 1, status: 'ARRIVING_AT_RESTAURANT' }));
      showToast('Navigating to restaurant. Geofence tracking active.', 'info');
    } else if (nextStep === 2) {
      playStateAdvance();
      setActiveTrip(prev => ({ ...prev, step_index: 2, status: 'ARRIVED_AT_RESTAURANT' }));
      showToast("Arrived at merchant. Check items and collect package.", 'info');
    } else if (nextStep === 3) {
      playStateAdvance();
      setActiveTrip(prev => ({ ...prev, step_index: 3, status: 'PICKUP_CONFIRMED' }));
      showToast('Pickup verified! Package secured.', 'success');
    } else if (nextStep === 4) {
      playStateAdvance();
      setActiveTrip(prev => ({ ...prev, step_index: 4, status: 'ORDER_IN_TRANSIT' }));
      showToast('En route to customer drop point. Fastest lane locked.', 'info');
    } else if (nextStep === 5) {
      playStateAdvance();
      setActiveTrip(prev => ({ ...prev, step_index: 5, status: 'ARRIVING_AT_CUSTOMER' }));
      showToast('Approaching customer residence. Prepare handover.', 'info');
    } else if (nextStep === 6) {
      playStateAdvance();
      setActiveTrip(prev => ({ ...prev, step_index: 6, status: 'VERIFY_DELIVERY' }));
      showToast('Handover point reached. Please verify OTP or photo proof.', 'warning');
    } else if (nextStep >= 7) {
      // Completed Trip!
      playSuccess();
      const tripPayout = activeTrip.total_earnings || 148.00;
      const orderNum = activeTrip.order_number;

      // Update Financials
      setEarnings(prev => ({
        ...prev,
        today: prev.today + tripPayout,
        weekly: prev.weekly + tripPayout,
        deliveries_today: prev.deliveries_today + 1,
        withdrawable_balance: prev.withdrawable_balance + tripPayout
      }));

      // Add to Ledger
      const newTxn = {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        date: 'Just now',
        type: 'TRIP_PAYOUT',
        description: `Order #${orderNum} Delivered + Surge/Tips`,
        amount: tripPayout,
        status: 'SETTLED',
        method: 'Wallet Credit'
      };
      setTransactions(prev => [newTxn, ...prev]);

      showToast(`Order #${orderNum} Delivered! ₹${tripPayout} credited to balance.`, 'success');
      setActiveTrip(null);
    }
  }, [activeTrip, showToast]);

  // Jump to specific step (useful for UI controls)
  const setTripStep = useCallback((stepIndex, statusName) => {
    if (!activeTrip) return;
    playStateAdvance();
    setActiveTrip(prev => ({ ...prev, step_index: stepIndex, status: statusName }));
  }, [activeTrip]);

  // Phase 23 & 28: Live Real-Time & Polling Fallback for Dispatched Job Offers
  useEffect(() => {
    const token = localStorage.getItem('fd_delivery_token') || localStorage.getItem('fd_access_token');
    if (!token || !isOnline || realActiveTask) return;

    const checkOffer = async () => {
      try {
        const offer = await fetchCurrentOffer();
        if (offer && offer.id) {
          setIncomingRequest(prev => {
            if (prev && prev.offer_id === offer.id) return prev;
            playOrderAlert();
            return {
              id: offer.id,
              offer_id: offer.id,
              order_id: offer.order_id,
              order_number: offer.order_number,
              order_type: offer.order_type || 'Single Food Delivery',
              restaurant_name: offer.restaurant_name,
              restaurant_address: offer.restaurant_address,
              customer_name: offer.customer_name,
              customer_address: offer.customer_area,
              pickup_distance_km: parseFloat(offer.pickup_distance_km || 1.4),
              drop_distance_km: parseFloat(offer.drop_distance_km || 3.8),
              total_distance_km: parseFloat(offer.total_distance_km || 5.2),
              estimated_time_mins: offer.estimated_time_mins || 20,
              estimated_earnings: parseFloat(offer.estimated_earnings || 135),
              items_count: offer.items_count || 1,
              items: offer.items || [],
              expiry_seconds: offer.expiry_seconds || 45,
              expires_at: offer.expires_at,
              is_real_offer: true
            };
          });
        } else if (!offer) {
          setIncomingRequest(prev => (prev?.is_real_offer ? null : prev));
        }
      } catch (err) {
        // Non-fatal background check error
      }
    };

    checkOffer();

    // Instant real-time job offer listener via Daphne WebSocket
    const client = getRealtimeClient('DELIVERY');
    const unsubOffer = client.subscribe('delivery.job_offered', () => {
      checkOffer();
    });

    // Reconcile on reconnect
    const unsubReconcile = client.registerReconciliation(() => {
      checkOffer();
    });

    // Backed-off safety net polling (12s)
    const interval = setInterval(checkOffer, 12000);

    return () => {
      unsubOffer();
      unsubReconcile();
      clearInterval(interval);
    };
  }, [isOnline, realActiveTask]);

  // Accept incoming request
  const handleAcceptRequest = useCallback(async (req = null) => {
    const requestToAccept = req || incomingRequest || INITIAL_DELIVERY_REQUESTS[0];
    
    // Concurrency-Safe Real API Integration
    if (requestToAccept.is_real_offer && requestToAccept.offer_id) {
      setIsActionPending(true);
      try {
        const res = await acceptOffer(requestToAccept.offer_id);
        playSuccess();
        setIncomingRequest(null);
        showToast(res.message || `Order #${requestToAccept.order_number} Accepted! Navigating to merchant.`, 'success');
        await refreshDashboardData();
        return res;
      } catch (err) {
        const msg = err.data?.error || err.message || (err.status === 409 ? 'This job has already been accepted by another partner.' : 'Failed to accept job offer.');
        showToast(msg, 'error');
        setIncomingRequest(null);
        await refreshDashboardData();
        return;
      } finally {
        setIsActionPending(false);
      }
    }

    // Fallback for simulation / mock workflow
    playSuccess();
    setActiveTrip({
      id: requestToAccept.id,
      order_number: requestToAccept.order_number,
      order_type: requestToAccept.order_type || 'Single Food Delivery',
      restaurant_name: requestToAccept.restaurant_name,
      restaurant_address: requestToAccept.restaurant_address,
      restaurant_lat: requestToAccept.restaurant_lat || 12.9785,
      restaurant_lng: requestToAccept.restaurant_lng || 77.6015,
      restaurant_phone: '+91 80 4123 9988',
      restaurant_notes: 'Kitchen bay #3. Order packed in thermal sealed bag.',
      kitchen_status: 'Order Ready (Packed 2 mins ago)',
      parking_instructions: 'Designated 2-wheeler bay on eastern porch. Gate passes waived.',
      customer_name: requestToAccept.customer_name,
      customer_phone: requestToAccept.customer_phone || '+91 98765 00018',
      customer_address: requestToAccept.customer_address,
      customer_lat: requestToAccept.customer_lat || 12.9716,
      customer_lng: requestToAccept.customer_lng || 77.5946,
      customer_building_info: 'Tower B, 7th Floor, Elevator lobby on right. Security gate code #4012.',
      customer_instructions: 'Leave at doorstep or ring bell once. Contactless delivery preferred.',
      step_index: 1, // Heading to restaurant
      status: 'ARRIVING_AT_RESTAURANT',
      otp_required: '8492',
      payout: requestToAccept.estimated_earnings ? requestToAccept.estimated_earnings - 40 : 95.00,
      surge_bonus: 35.00,
      tip: 18.00,
      total_earnings: requestToAccept.estimated_earnings || 148.00,
      distance_km: requestToAccept.total_distance_km || 5.2,
      items: requestToAccept.items || [{ name: 'Chef Signature Selection', quantity: 2, verified: true }],
      geofence_verified: true,
      alternate_routes: [
        { name: 'Via 100ft Corridor (Primary)', distance_km: 5.2, duration_mins: 22, traffic: 'normal' },
        { name: 'Via Inner Ring Bypass', distance_km: 6.1, duration_mins: 26, traffic: 'heavy' }
      ]
    });

    setIncomingRequest(null);
    showToast(`Order #${requestToAccept.order_number} Accepted! Navigating to merchant.`, 'success');
  }, [incomingRequest, showToast, refreshDashboardData]);

  // Decline incoming request
  const handleDeclineRequest = useCallback(async (reason = 'Normal decline') => {
    playClick();
    if (incomingRequest?.is_real_offer && incomingRequest?.offer_id) {
      try {
        await rejectOffer(incomingRequest.offer_id, reason);
      } catch (err) {
        console.warn('Decline offer API notice:', err);
      }
    }
    setIncomingRequest(null);
    showToast(`Request declined (${reason}). Dispatch re-routing to standby partner.`, 'info');
    refreshDashboardData();
  }, [incomingRequest, showToast, refreshDashboardData]);

  // Manually trigger an incoming request simulation (for testing/demo)
  const triggerSimulatedRequest = useCallback(() => {
    playOrderAlert();
    const mockOrder = INITIAL_DELIVERY_REQUESTS[Math.floor(Math.random() * INITIAL_DELIVERY_REQUESTS.length)];
    setIncomingRequest(mockOrder);
    showToast('Incoming Dispatch Request Received!', 'warning');
  }, [showToast]);

  // Request Instant Payout
  const requestInstantPayout = useCallback((amount) => {
    playSuccess();
    const withdrawAmount = Number(amount);
    if (withdrawAmount <= 0 || withdrawAmount > earnings.withdrawable_balance) {
      showToast('Invalid payout amount or exceeds available balance.', 'danger');
      return false;
    }

    setEarnings(prev => ({
      ...prev,
      withdrawable_balance: prev.withdrawable_balance - withdrawAmount
    }));

    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: 'Just now',
      type: 'INSTANT_PAYOUT',
      description: 'Instant payout request to HDFC Bank (****9014) — admin approval pending',
      amount: -withdrawAmount,
      status: 'PENDING',
      method: 'Bank IMPS Payout (on approval)'
    };
    setTransactions(prev => [newTxn, ...prev]);
    showToast(`Payout request of ₹${withdrawAmount.toLocaleString()} noted. Transfer happens only after admin approval.`, 'info');
    return true;
  }, [earnings.withdrawable_balance, showToast]);

  // Reserve a Shift
  const reserveShift = useCallback((shiftId) => {
    playClick();
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return { ...s, status: 'RESERVED', slots_left: Math.max(0, s.slots_left - 1) };
      }
      return s;
    }));
    showToast('Shift slot reserved successfully. Reminder scheduled 30m prior.', 'success');
  }, [showToast]);

  // Trigger SOS Emergency
  const triggerSOS = useCallback((details = 'Immediate Security Dispatch') => {
    playOrderAlert();
    setSosActive(true);
    showToast('SOS ALARM ACTIVE: Real-time GPS dispatched to Central Security & ICE contacts.', 'danger');
  }, [showToast]);

  const cancelSOS = useCallback(() => {
    playClick();
    setSosActive(false);
    showToast('SOS Alarm deactivated. Incident standby logged.', 'info');
  }, [showToast]);


  // Phase 15: Live GPS Telemetry Publication & Tracking
  const [gpsStatus, setGpsStatus] = useState({
    isTracking: false,
    isBroadcasting: false,
    lastBroadcastAt: null,
    error: null,
    accuracyMeters: null,
    latitude: 12.9750,
    longitude: 77.5980,
    heading: 42,
    speed: 35
  });

  const handlePublishLocation = useCallback(async ({ order_id, latitude, longitude, heading = 0, speed = 0, battery = null }) => {
    try {
      const res = await publishPartnerLocation({
        order_id,
        latitude,
        longitude,
        heading,
        speed,
        battery: battery || activeVehicle?.battery_percent || null
      });
      setGpsStatus(prev => ({
        ...prev,
        isBroadcasting: true,
        lastBroadcastAt: new Date().toLocaleTimeString(),
        error: null,
        latitude,
        longitude,
        heading,
        speed
      }));
      return res;
    } catch (err) {
      console.warn('GPS location update notice:', err.message);
      setGpsStatus(prev => ({ ...prev, error: err.message }));
      throw err;
    }
  }, [activeVehicle?.battery_percent]);

  return (
    <DeliveryContext.Provider value={{
      isOnline,
      setIsOnline,
      toggleOnline,
      isSimulatedOffline,
      toggleOfflineSimulation,
      audioMuted,
      toggleAudio,
      
      activeTrip,
      setActiveTrip,
      cachedTrip,
      advanceTripStep,
      setTripStep,
      
      incomingRequest,
      setIncomingRequest,
      handleAcceptRequest,
      handleDeclineRequest,
      triggerSimulatedRequest,
      
      batchTrip,
      setBatchTrip,
      
      currentSpeedKmh,
      currentHeadingDeg,
      activeVehicle,
      setActiveVehicle,
      
      earnings,
      setEarnings,
      transactions,
      requestInstantPayout,
      ledger,
      loadLedger,
      
      shifts,
      reserveShift,
      
      documents,
      setDocuments,
      
      notifications,
      setNotifications,
      unreadNotifsCount,
      unreadNotificationsCount: unreadNotifsCount,
      unreadCount: unreadNotifsCount,
      setUnreadNotifsCount,
      loadNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      
      sosActive,
      triggerSOS,
      cancelSOS,
      
      toastMessage,
      showToast,

      // Phase 4: Token Security & Session Management
      authState,
      setAuthState,
      currentUser,
      setCurrentUser,
      deliveryProfileData,
      isLoadingProfile,
      fetchProfile,
      updateProfile,
      removePartnerPhoto,
      // Phase 6: Settings & Preferences
      userSettings,
      isLoadingSettings,
      fetchSettings,
      updateSettings,
      // Phase 12 Real Operations & Pickup Workflow
      availableJobs,
      realActiveTask,
      completedDeliveries,
      cancelledTasks,
      dashboardSummary,
      isLoadingJobs,
      isActionPending,
      deliveryError,
      refreshDashboardData,
      handleAcceptJob,
      handleReachedRestaurant,
      handleConfirmPickup,
      handleReportIssue,
      handleToggleOnline,
      // Phase 13 Delivery Completion, OTP Verification & History
      handleVerifyDeliveryOTP,
      deliveryHistory,
      isLoadingHistory,
      fetchHistory,
      deliveryIssues,
      // Phase 15: Google Maps & Live GPS Telemetry
      gpsStatus,
      setGpsStatus,
      handlePublishLocation,

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
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error('useDelivery must be used within DeliveryProvider');
  return context;
};
