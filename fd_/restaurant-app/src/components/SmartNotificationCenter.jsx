import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, X, Check, CheckCheck, Trash2, Settings, RefreshCw, 
  ShoppingBag, Truck, CreditCard, AlertTriangle, ShieldAlert,
  ChevronRight, Volume2, Globe, Sparkles
} from 'lucide-react';
import { 
  fetchNotifications, 
  fetchNotificationUnreadCount, 
  markNotificationRead, 
  markAllNotificationsRead, 
  dismissNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences
} from '../services/api';
import { getRealtimeClient } from '../utils/realtime.js';

export const SmartNotificationCenter = ({ isOpen, onClose, onNavigateResource }) => {
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'all' | 'settings'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  
  // User Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    in_app_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    order_updates: true,
    payment_updates: true,
    promotional_updates: false
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  // WebSocket reference
  const wsRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    // Skip silently without a session: avoids repeated 401 polling
    // when logged out (backend permission unchanged: IsAuthenticated).
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    try {
      const res = await fetchNotificationUnreadCount();
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Quiet fail on unauthenticated
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async (tab = activeTab, filter = selectedFilter) => {
    if (tab === 'settings') return;
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const unreadOnly = tab === 'unread';
      const eventFilter = filter !== 'ALL' ? filter : '';
      const res = await fetchNotifications({
        page: 1,
        unread_only: unreadOnly,
        notification_type: eventFilter
      });
      setNotifications(res.results || []);
      setUnreadCount(res.unread_count !== undefined ? res.unread_count : 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedFilter]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    const token = localStorage.getItem('fd_restaurant_token') || localStorage.getItem('fd_access_token');
    if (!token) return;
    try {
      const res = await fetchNotificationPreferences();
      setPreferences(res);
    } catch {
      // Ignore
    }
  }, []);

  // Save Preferences
  const handleSavePreferences = async (updatedFields) => {
    setSavingPrefs(true);
    setPrefsSuccess(false);
    try {
      const merged = { ...preferences, ...updatedFields };
      setPreferences(merged);
      const res = await updateNotificationPreferences(merged);
      setPreferences(res);
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 2500);
      loadNotifications();
    } catch (err) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Mark single as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (activeTab === 'unread') {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (activeTab === 'unread') {
        setNotifications([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to mark all as read');
    } finally {
      setActionLoading(false);
    }
  };

  // Dismiss notification
  const handleDismiss = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      loadUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  // Setup Centralized Real-Time Subscription & Reconciliation
  useEffect(() => {
    loadUnreadCount();

    const client = getRealtimeClient('RESTAURANT');
    const unsubscribeNotif = client.subscribe('notification.created', () => {
      loadUnreadCount();
      if (isOpen) {
        loadNotifications();
      }
    });

    const unsubscribeReconcile = client.registerReconciliation(() => {
      loadUnreadCount();
      if (isOpen) {
        loadNotifications();
      }
    });

    pollTimerRef.current = setInterval(() => {
      loadUnreadCount();
      if (isOpen && activeTab !== 'settings') {
        loadNotifications();
      }
    }, 30000);

    return () => {
      unsubscribeNotif();
      unsubscribeReconcile();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadUnreadCount, isOpen, activeTab, loadNotifications]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadPreferences();
    }
  }, [isOpen, activeTab, selectedFilter, loadNotifications, loadPreferences]);

  if (!isOpen) return null;

  // Icon resolver based on event_type or notification_type
  const getNotificationIcon = (item) => {
    const type = item.notification_type || '';
    const event = item.event_type || '';

    if (event.includes('payment') || type === 'PAYMENT') {
      return {
        icon: <CreditCard size={18} />,
        bg: 'rgba(16, 185, 129, 0.15)',
        color: '#10B981',
        label: 'Payment'
      };
    }
    if (event.includes('delivery') || type === 'DELIVERY') {
      return {
        icon: <Truck size={18} />,
        bg: 'rgba(2, 132, 199, 0.15)',
        color: '#0284C7',
        label: 'Delivery'
      };
    }
    if (event.includes('rejected') || event.includes('cancelled') || event.includes('failed')) {
      return {
        icon: <AlertTriangle size={18} />,
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#EF4444',
        label: 'Alert'
      };
    }
    if (event.includes('order') || type === 'ORDER') {
      return {
        icon: <ShoppingBag size={18} />,
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#22C55E',
        label: 'Kitchen Order'
      };
    }
    return {
      icon: <Bell size={18} />,
      bg: 'rgba(168, 85, 247, 0.15)',
      color: '#A855F7',
      label: 'System'
    };
  };

  // Format relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 30, 18, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'var(--ws-surface, #121820)',
          borderRadius: '24px',
          border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--ws-text-primary, #FFFFFF)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-subtle, rgba(255, 255, 255, 0.03))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Kitchen Order Alerts
                </h2>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted, #94A3B8)', marginTop: '2px' }}>
                Incoming orders, driver dispatches & kitchen notifications
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'unread' : 'settings')}
              title="Notification Settings"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))',
                background: activeTab === 'settings' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                color: activeTab === 'settings' ? '#22C55E' : 'var(--ws-text-secondary, #94A3B8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={16} />
            </button>

            <button
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))',
                background: 'transparent',
                color: 'var(--ws-text-muted, #94A3B8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--ws-border, rgba(255, 255, 255, 0.08))',
          background: 'var(--ws-surface, #121820)'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { setActiveTab('unread'); setSelectedFilter('ALL'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'unread' ? '#22C55E' : 'transparent',
                background: activeTab === 'unread' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                color: activeTab === 'unread' ? '#22C55E' : 'var(--ws-text-secondary, #94A3B8)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>

            <button
              onClick={() => { setActiveTab('all'); setSelectedFilter('ALL'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'all' ? '#22C55E' : 'transparent',
                background: activeTab === 'all' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                color: activeTab === 'all' ? '#22C55E' : 'var(--ws-text-secondary, #94A3B8)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              All History
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'settings' ? '#22C55E' : 'transparent',
                background: activeTab === 'settings' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                color: activeTab === 'settings' ? '#22C55E' : 'var(--ws-text-secondary, #94A3B8)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              ⚙ Preferences
            </button>
          </div>

          {activeTab !== 'settings' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#22C55E',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: actionLoading ? 'wait' : 'pointer'
              }}
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* SETTINGS VIEW */}
          {activeTab === 'settings' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Language Selector */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--ws-surface-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.08))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Globe size={18} color="#22C55E" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Notification Language / மொழி</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => handleSavePreferences({ language: 'en' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: `2px solid ${preferences.language === 'en' ? '#22C55E' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: preferences.language === 'en' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                      color: preferences.language === 'en' ? '#22C55E' : 'inherit',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    English (Default)
                  </button>
                  <button
                    onClick={() => handleSavePreferences({ language: 'ta' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: `2px solid ${preferences.language === 'ta' ? '#22C55E' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: preferences.language === 'ta' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                      color: preferences.language === 'ta' ? '#22C55E' : 'inherit',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>
              </div>

              {/* Delivery Channels */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--ws-surface-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.08))'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '12px' }}>
                  Delivery Channels
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'in_app_enabled', label: 'In-App Alerts', desc: 'Real-time kitchen order chime & popups' },
                    { key: 'email_enabled', label: 'Email Confirmations', desc: 'Summary of daily settlements and orders' },
                    { key: 'sms_enabled', label: 'SMS Alerts', desc: 'Critical operational dispatches' }
                  ].map(ch => (
                    <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ch.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted, #94A3B8)' }}>{ch.desc}</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={Boolean(preferences[ch.key])}
                        onChange={e => handleSavePreferences({ [ch.key]: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#22C55E', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--ws-surface-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.08))'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '12px' }}>
                  Notification Categories
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'order_updates', label: 'New Customer Orders', desc: 'Instant alerts on new customer orders placed' },
                    { key: 'payment_updates', label: 'Payout Settlements', desc: 'Daily kitchen revenue and payout updates' },
                    { key: 'promotional_updates', label: 'Merchant Campaigns', desc: 'Platform promotional schemes and boosts' }
                  ].map(tp => (
                    <div key={tp.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tp.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted, #94A3B8)' }}>{tp.desc}</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={Boolean(preferences[tp.key])}
                        onChange={e => handleSavePreferences({ [tp.key]: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#22C55E', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {prefsSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#22C55E',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  ✓ Preferences successfully updated!
                </div>
              )}
            </div>
          ) : (
            /* NOTIFICATIONS LIST VIEW */
            <>
              {/* Type Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['ALL', 'ORDER', 'DELIVERY', 'PAYMENT', 'SYSTEM'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFilter(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedFilter === cat ? '#22C55E' : 'rgba(255, 255, 255, 0.1)',
                      background: selectedFilter === cat ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                      color: selectedFilter === cat ? '#22C55E' : 'var(--ws-text-muted, #94A3B8)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Loading State */}
              {loading && notifications.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ws-text-muted, #94A3B8)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  <div>Loading live notifications...</div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{error}</span>
                  <button 
                    onClick={() => loadNotifications()}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && notifications.length === 0 && (
                <div style={{
                  padding: '50px 20px',
                  textAlign: 'center',
                  color: 'var(--ws-text-muted, #94A3B8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bell size={24} color="#64748B" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary, #FFFFFF)' }}>
                    Kitchen inbox is clear!
                  </div>
                  <div style={{ fontSize: '0.8rem', maxWidth: '300px' }}>
                    {activeTab === 'unread' 
                      ? 'No pending unread alerts right now. New customer orders will chime here.'
                      : 'No past order alerts found.'}
                  </div>
                </div>
              )}

              {/* Notification Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map(item => {
                  const meta = getNotificationIcon(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.is_read) handleMarkAsRead(item.id);
                        if (onNavigateResource && item.related_resource_type) {
                          onNavigateResource(item.related_resource_type, item.related_resource_id);
                          onClose();
                        }
                      }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: `1px solid ${!item.is_read ? 'rgba(34, 197, 94, 0.35)' : 'var(--ws-border, rgba(255, 255, 255, 0.08))'}`,
                        background: !item.is_read 
                          ? 'rgba(34, 197, 94, 0.06)' 
                          : 'var(--ws-surface-subtle, rgba(255, 255, 255, 0.02))',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: meta.bg,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--ws-text-primary, #FFFFFF)' }}>
                            {item.title}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted, #94A3B8)', whiteSpace: 'nowrap' }}>
                            {formatTimeAgo(item.created_at)}
                          </span>
                        </div>

                        <div style={{
                          fontSize: '0.78rem',
                          color: 'var(--ws-text-secondary, #CBD5E1)',
                          marginTop: '4px',
                          lineHeight: '1.4'
                        }}>
                          {item.message}
                        </div>

                        {/* Metadata bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: meta.bg,
                            color: meta.color
                          }}>
                            {meta.label}
                          </span>

                          {item.related_resource_type && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: 'var(--ws-text-muted, #94A3B8)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <span>View {item.related_resource_type}</span>
                              <ChevronRight size={10} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '4px' }}>
                        {!item.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            title="Mark as read"
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#22C55E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={13} />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDismiss(item.id, e)}
                          title="Dismiss notification"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--ws-text-muted, #94A3B8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
