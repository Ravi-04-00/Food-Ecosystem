import React, { useState, useEffect } from 'react';
import { 
  Package, DollarSign, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, X, Check, Flame, ChevronRight, TrendingUp, 
  Power, Store, UtensilsCrossed, Layers, RefreshCw, Loader2, 
  Search, ChefHat, Bell, AlertTriangle, Filter, Eye,
  Download, PauseCircle, PlayCircle, Timer, Award, Calendar
} from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';
import { fetchRestaurantAnalytics, exportRestaurantOrdersCSV } from '../services/api.js';
import { OrderRejectionModal } from '../components/OrderRejectionModal.jsx';
import { OrderDetailModal } from '../components/OrderDetailModal.jsx';

export const ShopDashboard = ({ onNavigate, onOpenAddFood }) => {
  const { 
    orders = [],
    newOrders = [],
    acceptedOrders = [],
    preparingOrders = [],
    readyOrders = [],
    cancelledOrders = [],
    historyOrders = [],
    isLoadingOrders,
    orderError,
    orderFilter,
    setOrderFilter,
    orderSearch,
    setOrderSearch,
    loadOrders,
    handleAcceptOrder,
    handleRejectOrder,
    handlePrepareOrder,
    handleReadyOrder,
    actionInProgress,
    orderFeedback,
    setOrderFeedback,
    restaurantProfileData,
    currentUser,
    authState,
    availabilityStatus,
    isStoreOnline,
    toggleAvailability,
    isTogglingAvailability,
    availabilityFeedback,
    menuItems = [],
    menuCategories = [],
    operatingSettings = {},
    toggleOrdersPaused,
    exportOrdersCSV
  } = useShop();

  // Selected Order for Detail Modal and Rejection Modal
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phase 22 Business Suite State: Analytics, Presets, and Orders Pause
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsPreset, setAnalyticsPreset] = useState('today');
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseReasonInput, setPauseReasonInput] = useState('');
  const [isPausing, setIsPausing] = useState(false);

  const loadAnalytics = async (preset = analyticsPreset) => {
    // Do not fire protected analytics without a session: prevents
    // repeated 401s for logged-out users (backend stays authoritative).
    if (authState !== 'authenticated') {
      setAnalyticsData(null);
      setIsLoadingAnalytics(false);
      return;
    }
    setIsLoadingAnalytics(true);
    try {
      const end = new Date();
      const start = new Date();
      if (preset === 'today') {
        start.setHours(0, 0, 0, 0);
      } else if (preset === '7d') {
        start.setDate(end.getDate() - 7);
      } else if (preset === '30d') {
        start.setDate(end.getDate() - 30);
      }
      const data = await fetchRestaurantAnalytics({
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10)
      });
      setAnalyticsData(data);
    } catch (err) {
      console.warn('Load restaurant analytics non-fatal:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (authState === 'authenticated') loadAnalytics(analyticsPreset);
    else {
      setAnalyticsData(null);
      setIsLoadingAnalytics(false);
    }
  }, [analyticsPreset, authState]);

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const end = new Date();
      const start = new Date();
      if (analyticsPreset === 'today') {
        start.setHours(0, 0, 0, 0);
      } else if (analyticsPreset === '7d') {
        start.setDate(end.getDate() - 7);
      } else if (analyticsPreset === '30d') {
        start.setDate(end.getDate() - 30);
      }
      await exportRestaurantOrdersCSV({
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10)
      });
    } catch (err) {
      console.error('Export CSV error:', err);
      setOrderFeedback({ type: 'error', message: 'Failed to export orders CSV: ' + (err.message || 'Error') });
      setTimeout(() => setOrderFeedback(null), 4000);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleTogglePause = async () => {
    setIsPausing(true);
    try {
      if (operatingSettings?.orders_paused) {
        await toggleOrdersPaused(false, '');
      } else {
        await toggleOrdersPaused(true, pauseReasonInput || 'Kitchen capacity high volume pause');
        setPauseModalOpen(false);
        setPauseReasonInput('');
      }
    } catch (err) {
      console.error('Pause toggle error:', err);
      setOrderFeedback({ type: 'error', message: 'Failed to update orders pause state: ' + (err.message || 'Error') });
      setTimeout(() => setOrderFeedback(null), 4000);
    } finally {
      setIsPausing(false);
    }
  };

  const isOpen = availabilityStatus === 'OPEN' || isStoreOnline;
  const isOrdersPaused = Boolean(operatingSettings?.orders_paused);
  const restaurantName = restaurantProfileData?.restaurant_name || currentUser?.restaurant_name || 'My Restaurant';
  const ownerName = restaurantProfileData?.owner_name || currentUser?.owner_name || currentUser?.name || 'Restaurant Partner';

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenRejectModal = (order) => {
    setRejectingOrder(order);
  };

  const handleConfirmReject = async (orderId, reason, explanation) => {
    setIsRejecting(true);
    try {
      await handleRejectOrder(orderId, reason, explanation);
      setRejectingOrder(null);
      if (selectedOrderDetail?.id === orderId) {
        setSelectedOrderDetail(prev => prev ? ({ ...prev, status: 'CANCELLED', rejection_reason: reason }) : null);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // Section tabs configuration
  const sections = [
    { id: 'all', label: 'Order Overview', count: orders.length },
    { id: 'new', label: 'New Orders', count: newOrders.length, highlight: newOrders.length > 0 },
    { id: 'accepted', label: 'Accepted Orders', count: acceptedOrders.length },
    { id: 'preparing', label: 'Preparing Orders', count: preparingOrders.length },
    { id: 'ready', label: 'Ready for Pickup', count: readyOrders.length },
    { id: 'cancelled', label: 'Rejected / Cancelled', count: cancelledOrders.length },
    { id: 'history', label: 'Order History', count: historyOrders.length }
  ];

  // Client-side search and section filter
  const displayedOrders = orders.filter(o => {
    // 1. Tab filtering
    if (orderFilter === 'new' && o.status !== 'PLACED') return false;
    if (orderFilter === 'accepted' && o.status !== 'CONFIRMED' && o.status !== 'ACCEPTED') return false;
    if (orderFilter === 'preparing' && o.status !== 'PREPARING') return false;
    if (orderFilter === 'ready' && o.status !== 'READY_FOR_PICKUP' && o.status !== 'READY') return false;
    if (orderFilter === 'cancelled' && o.status !== 'CANCELLED') return false;
    if (orderFilter === 'history' && !['DELIVERED', 'CANCELLED'].includes(o.status)) return false;

    // 2. Search query filter
    if (orderSearch && orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const numMatch = (o.order_number || '').toLowerCase().includes(q);
      const custMatch = (o.customer_name || '').toLowerCase().includes(q);
      const itemMatch = (o.items || []).some(item => 
        (item.food_name || item.food_name_snapshot || '').toLowerCase().includes(q)
      );
      return numMatch || custMatch || itemMatch;
    }
    return true;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PLACED': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)', label: 'NEW ORDER' };
      case 'CONFIRMED':
      case 'ACCEPTED': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)', label: 'ACCEPTED' };
      case 'PREPARING': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)', label: 'PREPARING' };
      case 'READY':
      case 'READY_FOR_PICKUP': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)', label: 'READY' };
      case 'DELIVERED': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)', label: 'DELIVERED' };
      case 'CANCELLED': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)', label: 'CANCELLED' };
      default: return { bg: 'rgba(156, 163, 175, 0.15)', text: '#D1D5DB', border: 'rgba(156, 163, 175, 0.3)', label: status };
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Toast / Action Feedback Banner */}
      {orderFeedback && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '16px',
          background: orderFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${orderFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          color: orderFeedback.type === 'error' ? '#EF4444' : '#10B981',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.25s ease'
        }}>
          {orderFeedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{orderFeedback.message}</span>
        </div>
      )}

      {/* Availability Feedback Banner */}
      {availabilityFeedback && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '16px',
          background: isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: isOpen ? '#10B981' : '#EF4444',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {isOpen ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{availabilityFeedback} (Persisted in PostgreSQL)</span>
        </div>
      )}

      {/* Closed Kitchen Warning Banner */}
      {!isOpen && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '18px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#F87171',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
              Kitchen is currently CLOSED for new incoming orders
            </strong>
            <span>
              You cannot accept newly placed orders while marked CLOSED. Toggle your restaurant to OPEN above to accept orders. Previously confirmed orders can still be prepared and marked ready.
            </span>
          </div>
        </div>
      )}

      {/* Welcome Banner (Desktop/Tablet) */}
      <div className="hidden md:flex" style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '28px 32px',
        boxShadow: 'var(--ws-shadow-sm)',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: isOpen ? '#10B981' : '#EF4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {restaurantName} • KITCHEN CONTROL
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '6px 0 4px 0' }}>
            Welcome back, {ownerName} 👋
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', margin: 0 }}>
            {isOpen 
              ? 'Your restaurant is OPEN. Live ordering is active across the ecosystem.'
              : 'Your restaurant is currently CLOSED. Customer ordering is paused.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenAddFood}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+ Add New Dish</span>
          </button>
          
          <button
            onClick={() => onNavigate && onNavigate('menu')}
            style={{
              background: 'var(--ws-surface-subtle)',
              color: 'var(--ws-text-primary)',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              padding: '12px 18px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UtensilsCrossed size={16} />
            <span>Manage Menu</span>
          </button>
        </div>
      </div>

      {/* Real analytics dashboard below (live API data only) */}

      {/* PHASE 8: RESTAURANT AVAILABILITY CONTROL CARD */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px 30px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `2px solid ${isOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOpen ? '#10B981' : '#EF4444'
          }}>
            <Power size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                Restaurant Store Status
              </h2>
              <span style={{
                background: isOpen ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                color: isOpen ? '#10B981' : '#EF4444',
                border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                borderRadius: '999px',
                padding: '3px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                ● {isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--ws-text-secondary)', margin: '4px 0 0 0' }}>
              {isOpen 
                ? 'Your kitchen is OPEN and receiving live orders from customers across the city.' 
                : 'Your kitchen is CLOSED. New orders will not be accepted until opened.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => toggleAvailability()}
          disabled={isTogglingAvailability}
          style={{
            background: isOpen 
              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '12px 24px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: isTogglingAvailability ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: isOpen ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 14px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease',
            opacity: isTogglingAvailability ? 0.7 : 1
          }}
        >
          {isTogglingAvailability ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Power size={18} />
          )}
          <span>
            {isTogglingAvailability 
              ? 'Updating...' 
              : isOpen 
                ? 'Close Restaurant (Turn OFF)' 
                : 'Open Restaurant (Turn ON)'}
          </span>
        </button>
      </div>

      {/* PHASE 22: OPERATIONAL ALERTS */}
      {isOrdersPaused && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '18px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <PauseCircle size={26} color="#EF4444" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.98rem', color: '#EF4444', marginBottom: '2px' }}>
                Store Orders Temporarily Paused
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--ws-text-secondary)' }}>
                Reason: "{operatingSettings?.pause_reason || 'Kitchen high-volume overload'}" • Customer cart checkout will be prevented until resumed.
              </span>
            </div>
          </div>
          <button
            onClick={handleTogglePause}
            disabled={isPausing}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: isPausing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PlayCircle size={16} />
            <span>{isPausing ? 'Resuming...' : 'Resume Taking Orders'}</span>
          </button>
        </div>
      )}

      {/* Preparation Delay Alert */}
      {analyticsData?.prep_time_metrics?.is_delayed_alert && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '16px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#D97706',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.88rem'
        }}>
          <Clock size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Kitchen Prep Time Alert:</strong> Observed average preparation time ({analyticsData?.prep_time_metrics?.observed_prep_time_minutes} min) is currently exceeding your configured benchmark ({operatingSettings?.avg_prep_time_minutes || 25} min). Consider updating your benchmark or pausing new orders.
          </div>
        </div>
      )}

      {/* Sold-out items alert */}
      {menuItems.some(item => item.is_sold_out) && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '14px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#2563EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UtensilsCrossed size={16} />
            <span>
              <strong>{menuItems.filter(i => i.is_sold_out).length} menu dish(es)</strong> are currently marked as <strong>Sold Out</strong> today.
            </span>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('menu')}
            style={{
              background: 'transparent',
              border: '1px solid #2563EB',
              color: '#2563EB',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Review Dishes →
          </button>
        </div>
      )}

      {/* PHASE 22: FINANCIAL & PREPARATION PERFORMANCE SUITE */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px 28px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header with Date Presets & Export Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                BUSINESS PERFORMANCE METRICS
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderRadius: '6px', padding: '2px 6px', fontSize: '0.68rem', fontWeight: 800 }}>
                VERIFIED POSTGRESQL
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 0 0' }}>
              Financial Breakdown & Prep Time Velocity
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Date Preset Filter */}
            <div style={{
              display: 'flex',
              background: 'var(--ws-surface-subtle)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid var(--ws-border)'
            }}>
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setAnalyticsPreset(p.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: analyticsPreset === p.id ? 'var(--ws-surface)' : 'transparent',
                    color: analyticsPreset === p.id ? '#10B981' : 'var(--ws-text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: analyticsPreset === p.id ? 'var(--ws-shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Pause Orders Master Switch */}
            <button
              onClick={() => {
                if (isOrdersPaused) {
                  handleTogglePause();
                } else {
                  setPauseModalOpen(true);
                }
              }}
              style={{
                background: isOrdersPaused ? 'rgba(239, 68, 68, 0.15)' : 'var(--ws-surface-subtle)',
                border: `1px solid ${isOrdersPaused ? '#EF4444' : 'var(--ws-border)'}`,
                color: isOrdersPaused ? '#EF4444' : 'var(--ws-text-primary)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isOrdersPaused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
              <span>{isOrdersPaused ? 'Resume Orders' : 'Pause Orders'}</span>
            </button>

            {/* Export Orders CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: isExportingCSV ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Download size={14} />
              <span>{isExportingCSV ? 'Exporting...' : 'Export Orders CSV'}</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px'
        }}>
          {/* Gross Order Value */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--ws-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Gross Order Value (GOV)
              </span>
              <DollarSign size={16} color="#10B981" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px' }}>
              ₹{parseFloat(analyticsData?.order_metrics?.gross_order_value !== undefined ? analyticsData.order_metrics.gross_order_value : orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
              Total item & order volume placed
            </div>
          </div>

          {/* Captured Payments */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--ws-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Captured Payments
              </span>
              <CheckCircle2 size={16} color="#22C55E" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', margin: '4px 0 2px' }}>
              ₹{parseFloat(analyticsData?.order_metrics?.completed_revenue !== undefined ? analyticsData.order_metrics.completed_revenue : orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
              Completed & verified revenue
            </div>
          </div>

          {/* Refunds Processed */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--ws-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Refunds Processed
              </span>
              <AlertCircle size={16} color="#EF4444" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EF4444', margin: '4px 0 2px' }}>
              ₹{parseFloat(analyticsData?.order_metrics?.refunds_processed || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
              Cancelled / returned orders
            </div>
          </div>

          {/* Net Merchant Payout */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--ws-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Est. Net Earnings
              </span>
              <TrendingUp size={16} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#3B82F6', margin: '4px 0 2px' }}>
              ₹{parseFloat(analyticsData?.order_metrics?.net_payout_estimated || ((analyticsData?.order_metrics?.completed_revenue || 0) * 0.88)).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
              After standard 12% platform fee
            </div>
          </div>

          {/* Prep Time Comparison Metric */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: `1px solid ${analyticsData?.prep_time_metrics?.is_delayed_alert ? '#F59E0B' : 'var(--ws-border)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Prep Time Metric
              </span>
              <Timer size={16} color={analyticsData?.prep_time_metrics?.is_delayed_alert ? '#F59E0B' : '#10B981'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 2px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                {operatingSettings?.avg_prep_time_minutes || 25}m
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>
                cfg / {analyticsData?.prep_time_metrics?.observed_prep_time_minutes !== null && analyticsData?.prep_time_metrics?.observed_prep_time_minutes !== undefined ? `${analyticsData.prep_time_metrics.observed_prep_time_minutes}m obs` : 'obs pending'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: analyticsData?.prep_time_metrics?.is_delayed_alert ? '#D97706' : 'var(--ws-text-secondary)' }}>
              {analyticsData?.prep_time_metrics?.is_delayed_alert 
                ? '⚠️ Delayed vs target' 
                : analyticsData?.prep_time_metrics?.has_sufficient_history 
                  ? '✅ Cooking pace on benchmark' 
                  : 'Benchmark: ' + (operatingSettings?.avg_prep_time_minutes || 25) + ' mins'}
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 11 & 22: 6 SUMMARY CARDS (Strictly Real Orders by Stage) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
              Live Order Stages
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)' }}>
              Real-time PostgreSQL order status breakdown for {restaurantName}
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingOrders}
            style={{
              background: 'transparent',
              border: '1px solid var(--ws-border)',
              color: 'var(--ws-text-primary)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: (isRefreshing || isLoadingOrders) ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={(isRefreshing || isLoadingOrders) ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {/* Summary Card 1: New Orders */}
          <div 
            onClick={() => setOrderFilter('new')}
            style={{
              background: orderFilter === 'new' ? 'rgba(59, 130, 246, 0.12)' : 'var(--ws-surface)',
              border: `2px solid ${orderFilter === 'new' ? '#3B82F6' : 'var(--ws-border)'}`,
              borderRadius: '18px',
              padding: '16px 18px',
              boxShadow: 'var(--ws-shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {newOrders.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '999px',
                padding: '2px 7px',
                fontSize: '0.65rem',
                fontWeight: 900,
                letterSpacing: '0.5px'
              }}>
                NEW
              </span>
            )}
            <div style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Placed (NEW)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0' }}>
              {newOrders.length}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
              Awaiting accept
            </div>
          </div>

          {/* Summary Card 2: Accepted Orders */}
          <div 
            onClick={() => setOrderFilter('accepted')}
            style={{
              background: orderFilter === 'accepted' ? 'rgba(245, 158, 11, 0.12)' : 'var(--ws-surface)',
              border: `2px solid ${orderFilter === 'accepted' ? '#F59E0B' : 'var(--ws-border)'}`,
              borderRadius: '18px',
              padding: '16px 18px',
              boxShadow: 'var(--ws-shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Confirmed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0' }}>
              {acceptedOrders.length}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
              Queued for line
            </div>
          </div>

          {/* Summary Card 3: Preparing Orders */}
          <div 
            onClick={() => setOrderFilter('preparing')}
            style={{
              background: orderFilter === 'preparing' ? 'rgba(168, 85, 247, 0.12)' : 'var(--ws-surface)',
              border: `2px solid ${orderFilter === 'preparing' ? '#A855F7' : 'var(--ws-border)'}`,
              borderRadius: '18px',
              padding: '16px 18px',
              boxShadow: 'var(--ws-shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#C084FC', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preparing (COOK)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0' }}>
              {preparingOrders.length}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
              Active on stove
            </div>
          </div>

          {/* Summary Card 4: Ready for Pickup */}
          <div 
            onClick={() => setOrderFilter('ready')}
            style={{
              background: orderFilter === 'ready' ? 'rgba(16, 185, 129, 0.12)' : 'var(--ws-surface)',
              border: `2px solid ${orderFilter === 'ready' ? '#10B981' : 'var(--ws-border)'}`,
              borderRadius: '18px',
              padding: '16px 18px',
              boxShadow: 'var(--ws-shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ready for Pickup
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0' }}>
              {readyOrders.length}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
              Packed for courier
            </div>
          </div>

          {/* Summary Card 5: Delivered Orders */}
          <div 
            onClick={() => setOrderFilter('history')}
            style={{
              background: orderFilter === 'history' ? 'rgba(34, 197, 94, 0.12)' : 'var(--ws-surface)',
              border: `2px solid ${orderFilter === 'history' ? '#22C55E' : 'var(--ws-border)'}`,
              borderRadius: '18px',
              padding: '16px 18px',
              boxShadow: 'var(--ws-shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Delivered (DONE)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0' }}>
              {orders.filter(o => o.status === 'DELIVERED').length}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
              Completed fulfilled
            </div>
          </div>

          {/* Summary Card 6: Cancelled Orders */}
          <div 
            onClick={() => setOrderFilter('cancelled')}
            style={{
              background: orderFilter === 'cancelled' ? 'rgba(239, 68, 68, 0.12)' : 'var(--ws-surface)',
              border: `2px solid ${orderFilter === 'cancelled' ? '#EF4444' : 'var(--ws-border)'}`,
              borderRadius: '18px',
              padding: '16px 18px',
              boxShadow: 'var(--ws-shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#F87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cancelled / Rejected
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0' }}>
              {cancelledOrders.length}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
              Voided orders
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 22: MENU DISH RANKINGS - TOP SELLING VS LOW SELLING */}
      {(analyticsData?.top_selling_items?.length > 0 || analyticsData?.low_selling_items?.length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '20px'
        }}>
          {/* Top-Selling Dishes */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '20px 24px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                Top-Selling Dishes
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(analyticsData?.top_selling_items || []).slice(0, 5).map((item, idx) => (
                <div key={item.food_id || idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#F59E0B' : 'rgba(156, 163, 175, 0.2)',
                      color: idx === 0 ? '#FFFFFF' : 'var(--ws-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 900
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--ws-text-primary)' }}>
                      {item.food_name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#10B981' }}>
                      {item.units_sold} sold
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                      ₹{parseFloat(item.item_revenue || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low-Selling Dishes */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '20px 24px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <TrendingUp size={18} color="#6B7280" style={{ transform: 'rotate(180deg)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                Low-Selling & Inventory Alerts
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(analyticsData?.low_selling_items || []).slice(0, 5).map((item, idx) => (
                <div key={item.food_id || idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--ws-text-primary)' }}>
                      {item.food_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                      Stock: {item.stock} left
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: item.is_sold_out ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.is_sold_out ? '#EF4444' : '#F59E0B'
                    }}>
                      {item.is_sold_out ? 'SOLD OUT' : `${item.units_sold} sold`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE ORDERS REASON MODAL */}
      {pauseModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PauseCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Pause New Orders
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)' }}>
                  Temporarily pause incoming tickets during rush
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Customers will see your kitchen is temporarily at full capacity and will not be able to complete new checkouts until you resume.
            </p>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Reason for Pause (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kitchen high volume overload, equipment cleaning"
                value={pauseReasonInput}
                onChange={(e) => setPauseReasonInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setPauseModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border)',
                  background: 'transparent',
                  color: 'var(--ws-text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTogglePause}
                disabled={isPausing}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isPausing ? 'wait' : 'pointer'
                }}
              >
                {isPausing ? 'Pausing...' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 11: ORDERS DASHBOARD WITH SECTIONS & SEARCH */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Search Bar & Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
              Restaurant Order Management
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)' }}>
              Showing verified orders for {restaurantName}
            </span>
          </div>

          {/* Search by Order Number / Customer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--ws-surface-subtle)',
            border: '1px solid var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 14px',
            minWidth: '280px'
          }}>
            <Search size={16} color="var(--ws-text-muted)" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--ws-text-primary)',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
            {orderSearch && (
              <X 
                size={16} 
                style={{ cursor: 'pointer', color: 'var(--ws-text-muted)' }} 
                onClick={() => setOrderSearch('')} 
              />
            )}
          </div>
        </div>

        {/* Section Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '6px',
          borderBottom: '1px solid var(--ws-border)'
        }}>
          {sections.map(section => {
            const isSelected = orderFilter === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setOrderFilter(section.id)}
                style={{
                  background: isSelected ? '#10B981' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--ws-text-secondary)',
                  border: isSelected ? '1px solid #10B981' : '1px solid transparent',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{section.label}</span>
                <span style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--ws-surface-subtle)',
                  color: isSelected ? '#FFFFFF' : 'var(--ws-text-muted)',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {section.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders List Container */}
        {isLoadingOrders ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#10B981' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loading restaurant orders from PostgreSQL...</div>
          </div>
        ) : orderError ? (
          <div style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            textAlign: 'center'
          }}>
            <AlertCircle size={32} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>Error Loading Orders</div>
            <div style={{ fontSize: '0.85rem' }}>{orderError}</div>
            <button
              onClick={handleManualRefresh}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '18px',
            background: 'var(--ws-surface-subtle)',
            border: '1px dashed var(--ws-border)'
          }}>
            <Package size={38} color="var(--ws-text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              No orders found
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)', margin: '4px 0 0 0' }}>
              {orderSearch 
                ? `No orders matching "${orderSearch}"` 
                : orderFilter === 'all' 
                  ? 'No incoming orders currently. Incoming customer orders will appear here in real-time.' 
                  : `No orders in the '${sections.find(s => s.id === orderFilter)?.label}' stage.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayedOrders.map((order) => {
              const statusStyle = getStatusBadgeStyle(order.status);
              const itemCount = order.item_count || (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
              const isCurrentAction = actionInProgress === order.id;

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '18px',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: 'var(--ws-shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Left: Order Info & Items */}
                  <div style={{ flex: '1 1 360px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 900, color: '#10B981', fontSize: '0.95rem' }}>
                        #{order.order_number || order.id}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`
                      }}>
                        {statusStyle.label}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    {/* Items preview */}
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ws-text-primary)', marginBottom: '4px' }}>
                      {order.items && order.items.length > 0 ? (
                        <span>
                          {order.items.map(it => `${it.quantity}x ${it.food_name || it.food_name_snapshot || 'Item'}`).join(', ')}
                        </span>
                      ) : (
                        <span>{itemCount} item(s)</span>
                      )}
                    </div>

                    {/* Operational Details */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span>Customer: <strong>{order.customer_name || 'Customer'}</strong></span>
                      {order.cooking_instructions && (
                        <span style={{ color: '#FBBF24' }}>Note: "{order.cooking_instructions}"</span>
                      )}
                      {order.rejection_reason && (
                        <span style={{ color: '#F87171' }}>Rejection: "{order.rejection_reason}"</span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Financials */}
                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                      ₹{parseFloat(order.subtotal || order.total || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                      Total: ₹{parseFloat(order.total || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedOrderDetail(order)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--ws-border)',
                        color: 'var(--ws-text-primary)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="View complete order ticket & snapshots"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>

                    {/* Action: PLACED -> Accept or Reject */}
                    {order.status === 'PLACED' && (
                      <>
                        <button
                          onClick={() => handleOpenRejectModal(order)}
                          disabled={isCurrentAction}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#EF4444',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: isCurrentAction ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Decline
                        </button>

                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={isCurrentAction || !isOpen}
                          title={!isOpen ? "Cannot accept orders while restaurant is CLOSED" : "Accept Order"}
                          style={{
                            background: isOpen ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 18px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: (isCurrentAction || !isOpen) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: isOpen ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                            opacity: (isCurrentAction || !isOpen) ? 0.6 : 1
                          }}
                        >
                          {isCurrentAction ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          <span>Accept</span>
                        </button>
                      </>
                    )}

                    {/* Action: CONFIRMED / ACCEPTED -> Start Preparation */}
                    {(order.status === 'CONFIRMED' || order.status === 'ACCEPTED') && (
                      <button
                        onClick={() => handlePrepareOrder(order.id)}
                        disabled={isCurrentAction}
                        style={{
                          background: '#A855F7',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 18px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)'
                        }}
                      >
                        {isCurrentAction ? <Loader2 size={14} className="animate-spin" /> : <ChefHat size={14} />}
                        <span>Start Prep</span>
                      </button>
                    )}

                    {/* Action: PREPARING -> Ready for Pickup */}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleReadyOrder(order.id)}
                        disabled={isCurrentAction}
                        style={{
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 18px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        {isCurrentAction ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {/* Status: READY_FOR_PICKUP */}
                    {(order.status === 'READY_FOR_PICKUP' || order.status === 'READY') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          Awaiting Rider Handover
                        </span>

                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid #10B981',
                          color: '#34D399',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          letterSpacing: '2px',
                          fontFamily: 'monospace'
                        }}>
                          PIN: {order.pickup_otp || '5291'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Rejection Modal */}
      <OrderRejectionModal
        order={rejectingOrder}
        isOpen={!!rejectingOrder}
        onClose={() => setRejectingOrder(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isRejecting}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrderDetail}
        isOpen={!!selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
        onAccept={handleAcceptOrder}
        onReject={handleOpenRejectModal}
        onPrepare={handlePrepareOrder}
        onReady={handleReadyOrder}
        actionInProgress={actionInProgress}
        isStoreOnline={isOpen}
      />

    </div>
  );
};
