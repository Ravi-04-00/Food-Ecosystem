import React, { useState, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  Sparkles, 
  Check, 
  X, 
  Navigation,
  Car
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const LiveOrderRequestModal = () => {
  const { incomingRequest, handleAcceptRequest, handleDeclineRequest, isActionPending } = useDelivery();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!incomingRequest) {
      setCountdown(30);
      return;
    }

    setCountdown(incomingRequest.expiry_seconds || 30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDeclineRequest('Timeout expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingRequest, handleDeclineRequest]);

  if (!incomingRequest) return null;

  const totalTime = incomingRequest.expiry_seconds || 30;
  const progressPercent = (countdown / totalTime) * 100;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      backgroundColor: 'rgba(25, 27, 31, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      userSelect: 'none'
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '26px',
          boxShadow: '0 16px 40px rgba(25, 27, 31, 0.12)',
          padding: '24px 22px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incoming-order-title"
      >
        {/* Top Header: FD Badge, Order Type, Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              FD
            </span>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 900,
              color: '#16A34A',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              NEW DELIVERY REQUEST
            </span>
          </div>

          <span style={{
            fontSize: '0.72rem',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: '#F8F6F2',
            border: '1px solid #EDE8DE',
            color: '#525760',
            fontWeight: 800,
            fontFamily: "'Space Grotesk', monospace"
          }}>
            #{incomingRequest.order_number}
          </span>
        </div>

        {/* 1. Expected Earnings Highlighted in Warm FD Yellow */}
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: '20px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 3px 12px rgba(245, 158, 11, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#92400E', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
              Expected Earnings
            </span>
            <div style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#D97706',
              lineHeight: 1,
              marginTop: '4px'
            }}>
              ₹{incomingRequest.estimated_earnings}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#78350F', marginTop: '4px', fontWeight: 600 }}>
              Base pay: ₹95 • Surge: +₹35 • Est. Tip: +₹18
            </div>
          </div>

          {/* Clean 30s Circular Countdown Timer with Controlled Red/Yellow accent */}
          <div style={{ position: 'relative', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="27" cy="27" r="23" stroke="#FDE68A" strokeWidth="3" fill="none" />
              <circle
                cx="27"
                cy="27"
                r="23"
                stroke={countdown <= 8 ? '#DC2626' : '#F59E0B'}
                strokeWidth="3.5"
                fill="none"
                strokeDasharray="144.5"
                strokeDashoffset={144.5 - (144.5 * progressPercent) / 100}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
            <span style={{
              position: 'absolute',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '1.05rem',
              fontWeight: 900,
              color: countdown <= 8 ? '#DC2626' : '#191B1F'
            }}>
              {countdown}s
            </span>
          </div>
        </div>

        {/* 2 & 3. Restaurant name & Restaurant distance / Customer distance */}
        <div style={{
          backgroundColor: '#FBF9F5',
          border: '1px solid #EDE8DE',
          borderRadius: '18px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Restaurant (Pickup) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              flexShrink: 0
            }}>
              <Store size={17} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>RESTAURANT</span>
                <span style={{ fontSize: '0.76rem', color: '#D97706', fontWeight: 800, fontFamily: "'Space Grotesk', monospace" }}>
                  {incomingRequest.pickup_distance_km} km away
                </span>
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#191B1F', marginTop: '1px' }}>
                {incomingRequest.restaurant_name}
              </div>
            </div>
          </div>

          <div style={{ marginLeft: '15px', height: '10px', borderLeft: '2px dashed #DDD6C9' }} />

          {/* Customer (Delivery Drop) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}>
              <MapPin size={17} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>CUSTOMER DISTANCE</span>
                <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 800, fontFamily: "'Space Grotesk', monospace" }}>
                  {incomingRequest.drop_distance_km} km to drop
                </span>
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#191B1F', marginTop: '1px' }}>
                {incomingRequest.customer_name}
              </div>
            </div>
          </div>
        </div>

        {/* 4, 5 & 7. Operational Signals: Total route, Estimated time, Traffic condition */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          textAlign: 'center'
        }}>
          <div style={{ padding: '10px 8px', backgroundColor: '#F8F6F2', borderRadius: '14px', border: '1px solid #EDE8DE' }}>
            <div style={{ fontSize: '0.64rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL ROUTE</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#191B1F', marginTop: '2px', fontFamily: "'Space Grotesk', monospace" }}>
              {incomingRequest.total_distance_km} km
            </div>
          </div>
          <div style={{ padding: '10px 8px', backgroundColor: '#F8F6F2', borderRadius: '14px', border: '1px solid #EDE8DE' }}>
            <div style={{ fontSize: '0.64rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>ESTIMATED TIME</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#059669', marginTop: '2px', fontFamily: "'Space Grotesk', monospace" }}>
              {incomingRequest.estimated_time_mins} min
            </div>
          </div>
          <div style={{ padding: '10px 8px', backgroundColor: '#F8F6F2', borderRadius: '14px', border: '1px solid #EDE8DE' }}>
            <div style={{ fontSize: '0.64rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>TRAFFIC CONDITION</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#191B1F', marginTop: '2px' }}>
              Moderate
            </div>
          </div>
        </div>

        {/* Actions: DECLINE and ACCEPT in FD Red */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={() => handleDeclineRequest('Normal decline')}
            disabled={isActionPending}
            type="button"
            className="btn-secondary-fresh"
            style={{ 
              flex: 1, 
              padding: '13px', 
              fontSize: '0.88rem',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              opacity: isActionPending ? 0.6 : 1,
              cursor: isActionPending ? 'not-allowed' : 'pointer'
            }}
          >
            DECLINE
          </button>

          <button
            onClick={() => handleAcceptRequest(incomingRequest)}
            disabled={isActionPending}
            type="button"
            className="btn-primary-fresh"
            style={{ 
              flex: 1.6, 
              padding: '13px', 
              fontSize: '0.88rem',
              fontWeight: 900,
              fontFamily: "'Space Grotesk', sans-serif",
              backgroundColor: isActionPending ? '#16A34A' : '#22C55E',
              opacity: isActionPending ? 0.7 : 1,
              cursor: isActionPending ? 'not-allowed' : 'pointer'
            }}
          >
            <Check size={18} />
            <span>{isActionPending ? 'ACCEPTING...' : 'ACCEPT'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
