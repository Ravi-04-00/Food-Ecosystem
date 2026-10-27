import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, CheckCircle2, AlertCircle, Loader2, Package, 
  Flame, Bell, Volume2, VolumeX, ArrowRight, Play, Check, 
  Filter, AlertTriangle, User, Bike, Sparkles
} from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';

export const KitchenDisplayPage = () => {
  const { 
    orders = [], 
    newOrders = [],
    acceptedOrders = [],
    preparingOrders = [],
    readyOrders = [],
    handleAcceptOrder,
    handlePrepareOrder,
    handleReadyOrder,
    actionInProgress,
    isLoadingOrders,
    operatingSettings = {}
  } = useShop();

  // KDS View Filter: 'ALL' | 'INCOMING' | 'PREPARING' | 'READY'
  const [kdsStage, setKdsStage] = useState('ALL');
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Live timer tick every 10 seconds to update ticket age in minutes
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed ticket age
  const getElapsedMinutes = (order) => {
    if (!order.created_at) return 0;
    const created = new Date(order.created_at);
    return Math.max(0, Math.floor((currentTime - created.getTime()) / 60000));
  };

  const getAgeBadge = (mins) => {
    const target = operatingSettings?.avg_prep_time_minutes || 25;
    if (mins < 15) {
      return { 
        bg: 'rgba(16, 185, 129, 0.15)', 
        color: '#10B981', 
        border: 'rgba(16, 185, 129, 0.3)', 
        label: `${mins}m • ON TRACK` 
      };
    } else if (mins <= target) {
      return { 
        bg: 'rgba(245, 158, 11, 0.15)', 
        color: '#F59E0B', 
        border: 'rgba(245, 158, 11, 0.3)', 
        label: `${mins}m • PRIORITY` 
      };
    } else {
      return { 
        bg: 'rgba(239, 68, 68, 0.18)', 
        color: '#EF4444', 
        border: 'rgba(239, 68, 68, 0.4)', 
        label: `${mins}m • OVERDUE` 
      };
    }
  };

  // Group active orders
  const incomingTickets = orders.filter(o => ['PLACED', 'CONFIRMED', 'ACCEPTED'].includes(o.status));
  const prepTickets = orders.filter(o => o.status === 'PREPARING');
  const readyTickets = orders.filter(o => ['READY_FOR_PICKUP', 'READY'].includes(o.status));

  // Play audio chime effect on incoming orders when enabled
  useEffect(() => {
    if (soundAlerts && newOrders.length > 0) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
    }
  }, [newOrders.length, soundAlerts]);

  // Render an individual ticket card
  const renderTicketCard = (order, stageType) => {
    const isCurrentAction = actionInProgress === order.id;
    const items = order.items || [];
    const mins = getElapsedMinutes(order);
    const ageInfo = getAgeBadge(mins);

    return (
      <div 
        key={order.id} 
        style={{
          background: 'var(--ws-surface)',
          border: mins > (operatingSettings?.avg_prep_time_minutes || 25) 
            ? '2px solid rgba(239, 68, 68, 0.5)' 
            : '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--ws-shadow-sm)',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Top Header: Order Number, Age Timer & Type */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                #{order.order_number?.slice(-6) || order.id}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                background: 'var(--ws-surface-subtle)',
                color: 'var(--ws-text-secondary)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {order.order_type || 'DELIVERY'}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={12} />
              <span>{order.customer_name || 'Customer'}</span>
            </div>
          </div>

          {/* Age Counter Pill */}
          <div style={{
            background: ageInfo.bg,
            color: ageInfo.color,
            border: `1px solid ${ageInfo.border}`,
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Clock size={12} />
            <span>{ageInfo.label}</span>
          </div>
        </div>

        {/* Dish Items - Large, high visibility for line cooks */}
        <div style={{
          background: 'var(--ws-surface-subtle)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {items.map((it, i) => {
            const custom = it.customization_snapshot || {};
            const itemNotes = custom.special_instructions || it.special_instructions;

            return (
              <div 
                key={it.id || i} 
                style={{ 
                  borderBottom: i < items.length - 1 ? '1px dashed var(--ws-border)' : 'none', 
                  paddingBottom: i < items.length - 1 ? '8px' : '0' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                    <span style={{ color: '#10B981', marginRight: '6px', fontSize: '1.05rem', fontWeight: 900 }}>
                      {it.quantity}x
                    </span>
                    {it.food_name || it.food_name_snapshot || 'Dish Item'}
                  </span>
                </div>
                {itemNotes && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#D97706', 
                    fontWeight: 700, 
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <AlertTriangle size={11} />
                    <span>Note: {itemNotes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Global Cooking Instructions Banner */}
        {order.cooking_instructions && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#D97706',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            Chef Instruction: "{order.cooking_instructions}"
          </div>
        )}

        {/* Delivery Partner status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Bike size={13} color="#10B981" />
            <span>
              {order.delivery_partner_name 
                ? `Rider: ${order.delivery_partner_name}` 
                : 'Awaiting rider allocation'}
            </span>
          </div>
          <span>Total: ₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
        </div>

        {/* 1-Click Transition Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
          {stageType === 'INCOMING' && (
            <button
              onClick={() => order.status === 'PLACED' ? handleAcceptOrder(order.id) : handlePrepareOrder(order.id)}
              disabled={isCurrentAction}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: isCurrentAction ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
              }}
            >
              {isCurrentAction ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Flame size={16} />
              )}
              <span>{isCurrentAction ? 'UPDATING...' : (order.status === 'PLACED' ? 'ACCEPT ORDER' : 'START PREPARING')}</span>
            </button>
          )}

          {stageType === 'PREPARING' && (
            <button
              onClick={() => handleReadyOrder(order.id)}
              disabled={isCurrentAction}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: isCurrentAction ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isCurrentAction ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{isCurrentAction ? 'UPDATING...' : 'MARK READY FOR PICKUP'}</span>
            </button>
          )}

          {stageType === 'READY' && (
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '8px',
                textAlign: 'center',
                color: '#10B981',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <Package size={15} />
                <span>PACKED & WAITING AT COUNTER</span>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1.5px solid #10B981',
                borderRadius: '10px',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 700 }}>COURIER PIN:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34D399', letterSpacing: '4px', fontFamily: 'monospace' }}>
                  {order.pickup_otp || '5291'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* KDS Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #0A2E1B 0%, #16A34A 100%)',
        color: '#FFFFFF',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ChefHat size={26} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
              Kitchen Display System (KDS Live)
            </h1>
            <div style={{ fontSize: '0.82rem', color: '#DCFCE7', marginTop: '2px' }}>
              Real-time ticket progression & elapsed cook age timer • Target: {operatingSettings?.avg_prep_time_minutes || 25} mins
            </div>
          </div>
        </div>

        {/* Quick KDS Tools: Sound Chime Toggle & Stage Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            style={{
              background: soundAlerts ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {soundAlerts ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundAlerts ? 'Audio Chime ON' : 'Audio Muted'}</span>
          </button>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontWeight: 800,
            fontSize: '0.82rem',
            color: '#DCFCE7'
          }}>
            Active Queue: {incomingTickets.length + prepTickets.length + readyTickets.length}
          </div>
        </div>
      </div>

      {/* KDS Stage Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'ALL', label: 'All Active Tickets', count: incomingTickets.length + prepTickets.length + readyTickets.length },
          { id: 'INCOMING', label: '1. Incoming / New', count: incomingTickets.length },
          { id: 'PREPARING', label: '2. In Preparation', count: prepTickets.length },
          { id: 'READY', label: '3. Ready for Handover', count: readyTickets.length }
        ].map(tab => {
          const isSelected = kdsStage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setKdsStage(tab.id)}
              style={{
                background: isSelected ? '#10B981' : 'var(--ws-surface)',
                color: isSelected ? '#FFFFFF' : 'var(--ws-text-secondary)',
                border: isSelected ? '1px solid #10B981' : '1px solid var(--ws-border)',
                borderRadius: '12px',
                padding: '9px 16px',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--ws-surface-subtle)',
                color: isSelected ? '#FFFFFF' : 'var(--ws-text-muted)',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoadingOrders ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#10B981' }} />
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Loading active kitchen tickets from PostgreSQL...</div>
        </div>
      ) : (
        /* KDS Multi-Column or Filtered Stage View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Column 1: Incoming Orders */}
          {(kdsStage === 'ALL' || kdsStage === 'INCOMING') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#3B82F6'
                }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Incoming Orders ({incomingTickets.length})
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                  Queued for chef line
                </span>
              </div>

              {incomingTickets.length === 0 ? (
                <div style={{
                  background: 'var(--ws-surface)',
                  border: '1px dashed var(--ws-border)',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.85rem'
                }}>
                  No incoming orders waiting to be cooked.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                  gap: '16px'
                }}>
                  {incomingTickets.map(order => renderTicketCard(order, 'INCOMING'))}
                </div>
              )}
            </div>
          )}

          {/* Column 2: In Preparation */}
          {(kdsStage === 'ALL' || kdsStage === 'PREPARING') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#A855F7'
                }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  In Preparation ({prepTickets.length})
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                  Active on stoves & grill
                </span>
              </div>

              {prepTickets.length === 0 ? (
                <div style={{
                  background: 'var(--ws-surface)',
                  border: '1px dashed var(--ws-border)',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.85rem'
                }}>
                  No tickets currently cooking in kitchen.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                  gap: '16px'
                }}>
                  {prepTickets.map(order => renderTicketCard(order, 'PREPARING'))}
                </div>
              )}
            </div>
          )}

          {/* Column 3: Ready for Pickup */}
          {(kdsStage === 'ALL' || kdsStage === 'READY') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981'
                }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Ready for Pickup ({readyTickets.length})
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                  Packed at expedite handover counter
                </span>
              </div>

              {readyTickets.length === 0 ? (
                <div style={{
                  background: 'var(--ws-surface)',
                  border: '1px dashed var(--ws-border)',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.85rem'
                }}>
                  No packed orders waiting for collection.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                  gap: '16px'
                }}>
                  {readyTickets.map(order => renderTicketCard(order, 'READY'))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
