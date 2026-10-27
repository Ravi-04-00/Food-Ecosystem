import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, MessageSquare, Check, Clock, MapPin, Send, X, ShieldCheck, Star, HelpCircle, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { LiveDeliveryMap } from '../components/LiveDeliveryMap.jsx';
import { FoodReviewModal } from '../components/FoodReviewModal.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { fetchOrderTracking } from '../services/api.js';
import { getRealtimeClient } from '../utils/realtime.js';

export const TrackingPage = ({ onBackHome }) => {
  const { activeOrder, orders = [], setActiveOrder } = useCustomer();
  const safeOrders = Array.isArray(orders) ? orders : [];
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isDelivered, setIsDelivered] = useState(activeOrder?.status === 'DELIVERED');
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const pollIntervalRef = useRef(null);
  const [lastLocationReceivedAt, setLastLocationReceivedAt] = useState(Date.now());
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  // Timer to keep location age indicator ticking accurately
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

  // Poll live tracking telemetry for active order + subscribe to real-time location stream
  useEffect(() => {
    if (!activeOrder?.id) return;

    let isMounted = true;
    const loadTracking = async () => {
      try {
        const data = await fetchOrderTracking(activeOrder.id);
        if (isMounted) {
          setTrackingData(data);
          if (data.status === 'DELIVERED') {
            setIsDelivered(true);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else if (data.status === 'CANCELLED') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Live tracking fetch notice:', err.message);
        }
      }
    };

    loadTracking();

    // Real-time location stream listener (Daphne Channels)
    const client = getRealtimeClient('CUSTOMER');
    const unsubLocation = client.subscribe('location_update', (payload) => {
      const orderId = payload.order_id || payload.entity_id;
      if (String(orderId) === String(activeOrder.id)) {
        setLastLocationReceivedAt(Date.now());
        setTrackingData(prev => ({
          ...prev,
          rider_lat: payload.latitude ?? prev?.rider_lat,
          rider_lng: payload.longitude ?? prev?.rider_lng,
          rider_heading: payload.heading ?? prev?.rider_heading,
          last_location_updated_at: payload.server_timestamp || new Date().toISOString()
        }));
      }
    });

    // Reconcile tracking immediately on reconnect
    const unsubReconcile = client.registerReconciliation(() => {
      loadTracking();
    });

    // 8-second fallback polling loop (only if active)
    if (activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED') {
      pollIntervalRef.current = setInterval(loadTracking, 8000);
    }

    return () => {
      isMounted = false;
      unsubLocation();
      unsubReconcile();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeOrder?.id, activeOrder?.status]);

  const [chatMessages, setChatMessages] = useState([
    { sender: 'rider', text: 'Hi! I have picked up your order and am en route. 🛵', time: '2m ago' },
    { sender: 'customer', text: 'Thank you! Looking forward to it.', time: '1m ago' }
  ]);
  const [inputText, setInputText] = useState('');

  const orderNumber = activeOrder?.order_number || 'WS10245';

  const orderSteps = [
    { label: 'Order Confirmed', status: 'completed' },
    { label: 'Kitchen Accepted', status: 'completed' },
    { label: 'Preparing Fresh', status: 'completed' },
    { label: 'Ready for Pickup', status: 'completed' },
    { label: 'Rider Picked Up', status: 'completed' },
    { label: 'On the Way', status: isDelivered ? 'completed' : 'active' },
    { label: 'Delivered', status: isDelivered ? 'completed' : 'pending' }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setChatMessages([...chatMessages, { sender: 'customer', text: inputText, time: 'Just now' }]);
    setInputText('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'rider', text: 'Turning into your street right now. See you in 2 mins!', time: 'Just now' }
      ]);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBackHome}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ws-text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <span style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '999px',
          padding: '4px 12px',
          fontWeight: 700,
          fontSize: '0.75rem',
          color: '#10B981',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', animation: 'ws-pulse-live 1.8s infinite' }} />
          <span>LIVE TRACKING HUD</span>
        </span>
      </div>

      {/* Order Status Card */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
              Order #{orderNumber}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', marginTop: '4px' }}>
              Estimated Delivery: <strong style={{ color: 'var(--ws-text-primary)' }}>
                {trackingData?.eta_minutes ? `${trackingData.eta_minutes} mins` : (activeOrder?.eta_minutes ? `${activeOrder.eta_minutes} mins` : '18–22 mins')}
              </strong> • {trackingData?.is_trackable ? 'Live GPS Corridor' : 'Standard Delivery'}
            </div>
          </div>

          {/* Secure Handover OTP Badge */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            border: '1.5px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '16px',
            padding: '10px 18px',
            textAlign: 'right',
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.08)'
          }}>
            <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              4-DIGIT DELIVERY OTP
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', letterSpacing: '5px', fontFamily: 'monospace' }}>
              {activeOrder?.delivery_otp || activeOrder?.otp || '8492'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)', fontWeight: 600, marginTop: '2px' }}>
              Share only with courier at door
            </div>
          </div>
        </div>

        {/* Step Progress Checklist */}
        <div style={{
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {orderSteps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: step.status === 'completed' ? '#10B981' : step.status === 'active' ? '#22C55E' : 'var(--ws-surface)',
                border: '1px solid',
                borderColor: step.status === 'completed' ? '#10B981' : step.status === 'active' ? '#22C55E' : 'var(--ws-border)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 900,
                flexShrink: 0
              }}>
                {step.status === 'completed' ? '✓' : step.status === 'active' ? '●' : '○'}
              </div>
              <span style={{
                fontWeight: step.status === 'active' ? 800 : step.status === 'completed' ? 600 : 500,
                color: step.status === 'active' ? '#22C55E' : step.status === 'completed' ? 'var(--ws-text-primary)' : 'var(--ws-text-muted)'
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Delivery Partner Profile Strip */}
        <div style={{
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'var(--ws-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(14, 165, 233, 0.25) 100%)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem'
            }}>
              🛵
            </div>

            <div>
              <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '1rem' }}>
                Delivery Partner: {trackingData?.delivery_partner?.name || activeOrder?.rider?.name || 'Arun K.'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                Vehicle: <strong>{trackingData?.delivery_partner?.vehicle_type || '2-Wheeler'} {trackingData?.delivery_partner?.vehicle_number ? `(${trackingData.delivery_partner.vehicle_number})` : ''}</strong>
                {trackingData?.delivery_partner?.is_stale && (
                  <span style={{ color: '#D97706', marginLeft: '8px', fontWeight: 700 }}>
                    • ⚠️ GPS Signal delayed ({trackingData.delivery_partner.staleness_seconds}s)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => alert(`Calling partner at ${trackingData?.delivery_partner?.phone || activeOrder?.rider?.phone || '+91 98765 00003'}...`)}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: 'var(--ws-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Phone size={15} color="#10B981" />
              <span>Call</span>
            </button>

            <button
              onClick={() => setChatOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(255, 90, 31, 0.3)'
              }}
            >
              <MessageSquare size={15} />
              <span>Chat</span>
            </button>
          </div>
        </div>

        {/* Quick Simulator & Actions Banner */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '14px 18px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                {isDelivered ? 'Order Delivered Successfully!' : 'Handover in progress with Arun'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                {isDelivered 
                  ? `Delivered via verified 4-digit OTP (${activeOrder?.delivery_otp || activeOrder?.otp || '8492'})` 
                  : `Share 4-digit OTP (${activeOrder?.delivery_otp || activeOrder?.otp || '8492'}) upon rider arrival`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!isDelivered ? (
              <button
                onClick={() => {
                  setIsDelivered(true);
                  setTimeout(() => setReviewOpen(true), 400);
                }}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Check size={14} /> Simulate Delivery & Review
              </button>
            ) : (
              <button
                onClick={() => setReviewOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Star size={14} fill="#FFFFFF" /> Rate & Review Order
              </button>
            )}

            <button
              onClick={() => alert('Support Ticket #SUP1022 is connected to Admin Mission Control. Support agents respond in <2 mins.')}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: 'var(--ws-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <HelpCircle size={14} color="#0284C7" /> Need Help (#SUP1022)
            </button>
          </div>
        </div>

        {/* Live Delivery Map HUD with Location Freshness Bar */}
        <div style={{
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          overflow: 'hidden'
        }}>
          {(() => {
            const locTime = trackingData?.last_location_updated_at ? new Date(trackingData.last_location_updated_at).getTime() : lastLocationReceivedAt;
            const ageSec = Math.max(0, Math.floor((nowTimestamp - locTime) / 1000));
            const isLive = ageSec <= 15;
            const isDelayed = ageSec > 15 && ageSec <= 60;
            return (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 16px',
                background: isLive ? 'rgba(34, 197, 94, 0.12)' : isDelayed ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                borderBottom: '1px solid var(--ws-border)',
                fontSize: '0.78rem',
                fontWeight: 600
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isLive ? '#22C55E' : isDelayed ? '#F59E0B' : '#EF4444',
                    boxShadow: isLive ? '0 0 8px #22C55E' : 'none'
                  }} />
                  <span style={{ color: isLive ? '#15803D' : isDelayed ? '#B45309' : '#B91C1C' }}>
                    {isLive ? `Live GPS Stream (Updated ${ageSec}s ago)` : isDelayed ? `Signal Delayed (Last ping ${ageSec}s ago)` : `Signal Lost (Showing last known position from ${ageSec}s ago)`}
                  </span>
                </div>
                <span style={{ color: 'var(--ws-text-muted)', fontSize: '0.72rem' }}>
                  {isLive ? 'நேரடி ஜிபிஎஸ்' : isDelayed ? 'சிக்னல் தாமதம்' : 'கடைசியாக அறியப்பட்ட இடம்'}
                </span>
              </div>
            );
          })()}
          <LiveDeliveryMap trackingData={trackingData} onOpenChat={() => setChatOpen(true)} />
        </div>

        {/* Order History Section */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                Recent Order History 📜
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 500 }}>
                Orders placed from your customer account
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22C55E' }}>
              {safeOrders.length} {safeOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {safeOrders.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface-subtle)',
              borderRadius: '14px',
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--ws-text-muted)'
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📦</div>
              <div style={{ fontWeight: 700, color: 'var(--ws-text-primary)', fontSize: '0.9rem' }}>No Past Orders Found</div>
              <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>Your completed orders will appear here for 1-tap reordering.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {safeOrders.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  onClick={() => setActiveOrder && setActiveOrder(order)}
                  style={{
                    border: '1px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    background: activeOrder?.id === order.id ? 'rgba(255, 90, 31, 0.08)' : 'var(--ws-surface-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>
                        #{order.order_number}
                      </span>
                      <span style={{
                        background: order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 90, 31, 0.12)',
                        color: order.status === 'DELIVERED' ? '#10B981' : '#22C55E',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '3px' }}>
                      {order.restaurant_name || 'FD Kitchen'} • ₹{Number(order.grand_total || order.total_amount || 457).toFixed(0)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22C55E', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span>Track</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Chat Modal / Drawer */}
      {chatOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '440px',
            height: '520px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--ws-shadow-lg)'
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--ws-border)',
              background: 'var(--ws-surface-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.95rem' }}>
                  Chat with Arun (Delivery Partner)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                  ● Active on route
                </div>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ws-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: msg.sender === 'customer' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'var(--ws-surface-subtle)',
                    color: msg.sender === 'customer' ? '#FFFFFF' : 'var(--ws-text-primary)',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    border: msg.sender === 'customer' ? 'none' : '1px solid var(--ws-border)'
                  }}
                >
                  <div>{msg.text}</div>
                  <div style={{
                    fontSize: '0.65rem',
                    marginTop: '4px',
                    textAlign: 'right',
                    opacity: 0.75
                  }}>
                    {msg.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--ws-border)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type a message to Arun..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  color: 'var(--ws-text-primary)'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <FoodReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        orderNumber={orderNumber}
        orderId={activeOrder?.id}
        restaurantName={activeOrder?.restaurant?.name || trackingData?.restaurant_name}
      />
    </div>
  );
};
