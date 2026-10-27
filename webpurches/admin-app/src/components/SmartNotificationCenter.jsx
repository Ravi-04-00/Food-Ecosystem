import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, X, Check, CheckCheck, Trash2, Settings, RefreshCw, 
  ShoppingBag, Truck, CreditCard, AlertTriangle, ShieldAlert,
  ChevronRight, Globe, Activity, ShieldCheck
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
    sms_enabled: true,
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
    try {
      const res = await fetchNotificationUnreadCount();
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Ignore
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async (tab = activeTab, filter = selectedFilter) => {
    if (tab === 'settings') return;
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

    const client = getRealtimeClient('ADMIN');
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
        bg: 'rgba(36, 217, 255, 0.15)',
        color: '#24D9FF',
        label: 'Payment'
      };
    }
    if (event.includes('delivery') || type === 'DELIVERY') {
      return {
        icon: <Truck size={18} />,
        bg: 'rgba(255, 210, 63, 0.15)',
        color: '#FFD23F',
        label: 'Fleet'
      };
    }
    if (event.includes('rejected') || event.includes('cancelled') || event.includes('failed') || event.includes('issue')) {
      return {
        icon: <AlertTriangle size={18} />,
        bg: 'rgba(255, 79, 100, 0.15)',
        color: '#FF4F64',
        label: 'Alert'
      };
    }
    if (event.includes('order') || type === 'ORDER') {
      return {
        icon: <ShoppingBag size={18} />,
        bg: 'rgba(168, 255, 62, 0.15)',
        color: '#A8FF3E',
        label: 'Order'
      };
    }
    return {
      icon: <Activity size={18} />,
      bg: 'rgba(168, 85, 247, 0.15)',
      color: '#A855F7',
      label: 'Mission Control'
    };
  };

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
        backgroundColor: 'rgba(4, 6, 10, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          backgroundColor: '#0D1117',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#FFFFFF',
          fontFamily: "'Space Grotesk', system-ui, sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#141A23'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#A8FF3E',
              color: '#08090D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(168, 255, 62, 0.35)'
            }}>
              <Bell size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, letterSpacing: '0.5px' }}>
                  MISSION CONTROL ALERTS
                </h2>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#FF4F64',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 6px rgba(255, 79, 100, 0.4)'
                  }}>
                    {unreadCount} UNREAD
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8B929D', marginTop: '2px' }}>
                Platform management, restaurant approvals & fleet incident alerts
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
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: activeTab === 'settings' ? 'rgba(168, 255, 62, 0.2)' : '#141A23',
                color: activeTab === 'settings' ? '#A8FF3E' : '#8B929D',
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
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: '#141A23',
                color: '#8B929D',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0D1117'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { setActiveTab('unread'); setSelectedFilter('ALL'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'unread' ? '#A8FF3E' : 'transparent',
                background: activeTab === 'unread' ? 'rgba(168, 255, 62, 0.16)' : 'transparent',
                color: activeTab === 'unread' ? '#A8FF3E' : '#8B929D',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              UNREAD {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>

            <button
              onClick={() => { setActiveTab('all'); setSelectedFilter('ALL'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'all' ? '#A8FF3E' : 'transparent',
                background: activeTab === 'all' ? 'rgba(168, 255, 62, 0.16)' : 'transparent',
                color: activeTab === 'all' ? '#A8FF3E' : '#8B929D',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ALL AUDIT LOGS
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'settings' ? '#A8FF3E' : 'transparent',
                background: activeTab === 'settings' ? 'rgba(168, 255, 62, 0.16)' : 'transparent',
                color: activeTab === 'settings' ? '#A8FF3E' : '#8B929D',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ⚙ PREFERENCES
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
                color: '#A8FF3E',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: actionLoading ? 'wait' : 'pointer'
              }}
            >
              <CheckCheck size={14} />
              <span>MARK ALL READ</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'settings' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: '#141A23',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Globe size={18} color="#A8FF3E" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>ALERT TEMPLATE LANGUAGE / மொழி</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => handleSavePreferences({ language: 'en' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: `2px solid ${preferences.language === 'en' ? '#A8FF3E' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: preferences.language === 'en' ? 'rgba(168, 255, 62, 0.15)' : 'transparent',
                      color: preferences.language === 'en' ? '#A8FF3E' : 'inherit',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    English (Standard)
                  </button>
                  <button
                    onClick={() => handleSavePreferences({ language: 'ta' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: `2px solid ${preferences.language === 'ta' ? '#A8FF3E' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: preferences.language === 'ta' ? 'rgba(168, 255, 62, 0.15)' : 'transparent',
                      color: preferences.language === 'ta' ? '#A8FF3E' : 'inherit',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: '#141A23',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '12px' }}>
                  OPERATIONAL DISPATCH CHANNELS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'in_app_enabled', label: 'Dashboard Banners & HUD Alerts', desc: 'Real-time alert banner updates' },
                    { key: 'email_enabled', label: 'Admin Security Invoices & Digests', desc: 'Audit log digests and platform reports' },
                    { key: 'order_updates', label: 'New Restaurant Applications', desc: 'Alerts when restaurants require verification' }
                  ].map(ch => (
                    <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ch.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8B929D' }}>{ch.desc}</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={Boolean(preferences[ch.key])}
                        onChange={e => handleSavePreferences({ [ch.key]: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#A8FF3E', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {prefsSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(168, 255, 62, 0.15)',
                  border: '1px solid rgba(168, 255, 62, 0.4)',
                  color: '#A8FF3E',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textAlign: 'center'
                }}>
                  ✓ Preferences successfully updated!
                </div>
              )}
            </div>
          ) : (
            <>
              {loading && notifications.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#8B929D' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  <div>Syncing mission control alerts...</div>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 79, 100, 0.15)',
                  border: '1px solid rgba(255, 79, 100, 0.3)',
                  color: '#FF4F64',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{error}</span>
                  <button 
                    onClick={() => loadNotifications()}
                    style={{ background: 'none', border: 'none', color: '#FF4F64', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div style={{
                  padding: '50px 20px',
                  textAlign: 'center',
                  color: '#8B929D',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#141A23',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheck size={24} color="#A8FF3E" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>
                    All Systems Operational
                  </div>
                  <div style={{ fontSize: '0.8rem', maxWidth: '300px' }}>
                    {activeTab === 'unread' 
                      ? 'No unresolved platform issues or unread events.'
                      : 'No alert logs recorded.'}
                  </div>
                </div>
              )}

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
                        border: `1px solid ${!item.is_read ? 'rgba(168, 255, 62, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                        background: !item.is_read ? 'rgba(168, 255, 62, 0.08)' : '#141A23',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
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

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF' }}>
                            {item.title}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#8B929D', whiteSpace: 'nowrap' }}>
                            {formatTimeAgo(item.created_at)}
                          </span>
                        </div>

                        <div style={{
                          fontSize: '0.78rem',
                          color: '#CBD5E1',
                          marginTop: '4px',
                          lineHeight: '1.4'
                        }}>
                          {item.message}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
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
                              fontWeight: 700,
                              color: '#8B929D',
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
                              background: 'rgba(168, 255, 62, 0.2)',
                              color: '#A8FF3E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Check size={13} strokeWidth={2.5} />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDismiss(item.id, e)}
                          title="Dismiss"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#8B929D',
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
