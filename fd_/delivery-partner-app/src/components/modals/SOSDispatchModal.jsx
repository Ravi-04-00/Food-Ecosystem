import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  AlertTriangle, 
  X, 
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const SOSDispatchModal = ({ isOpen, onClose }) => {
  const { sosActive, triggerSOS, cancelSOS, currentSpeedKmh } = useDelivery();
  const [countdown, setCountdown] = useState(5);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setIsDispatched(false);
      return;
    }

    if (sosActive) {
      setIsDispatched(true);
      return;
    }

    // 5-second automatic failsafe countdown before triggering dispatch
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSOS();
          setIsDispatched(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, sosActive, triggerSOS]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      backgroundColor: 'rgba(25, 27, 31, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#FFFFFF',
        border: '2px solid #EF4444',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 16px 40px rgba(239, 68, 68, 0.15)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'center'
      }}>
        {/* Close / Cancel Button */}
        <button
          onClick={() => {
            cancelSOS();
            onClose();
          }}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: '#F8F6F2',
            border: '1px solid #EDE8DE',
            borderRadius: '50%',
            color: '#525760',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        {/* Big Emergency Icon */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 18px rgba(239, 68, 68, 0.4)'
          }}>
            <ShieldAlert size={40} />
          </div>
        </div>

        <div>
          <span style={{
            fontSize: '0.74rem',
            fontFamily: "'Space Grotesk', monospace",
            fontWeight: 800,
            color: '#DC2626',
            letterSpacing: '1px'
          }}>
            EMERGENCY RESPONSE PROTOCOL
          </span>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: '6px 0 0'
          }}>
            {isDispatched ? 'SOS ACTIVE — DISPATCH ALERTED' : `SOS DISPATCH IN ${countdown}s`}
          </h2>
          <div style={{ fontSize: '0.82rem', color: '#525760', marginTop: '4px' }}>
            Broadcasting live GPS coordinates & vehicle telemetry to 24/7 Ops Room and Police Control.
          </div>
        </div>

        {/* Live Coordinate Card */}
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '16px',
          padding: '14px',
          textAlign: 'left',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 800 }}>
            <MapPin size={16} color="#EF4444" />
            <span>Current Telemetry: 12.9785° N, 77.6015° E</span>
          </div>
          <div style={{ color: '#B91C1C', marginTop: '4px', fontSize: '0.74rem' }}>
            Speed: {currentSpeedKmh} km/h • Vehicle: Ather 450X (KA-01-WS-8492) • Battery: 86%
          </div>
        </div>

        {/* Emergency Call Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="tel:112"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.94rem',
              padding: '14px',
              borderRadius: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}
          >
            <PhoneCall size={18} />
            <span>CALL EMERGENCY SERVICES (112)</span>
          </a>

          <a
            href="tel:18002008899"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#F8F6F2',
              border: '1px solid #EDE8DE',
              color: '#191B1F',
              fontWeight: 800,
              fontSize: '0.88rem',
              padding: '12px',
              borderRadius: '14px',
              textDecoration: 'none'
            }}
          >
            <PhoneCall size={16} color="#FF5A1F" />
            <span>CALL OPERATIONS SECURITY DESK</span>
          </a>
        </div>

        {/* Cancellation Button */}
        <button
          onClick={() => {
            cancelSOS();
            onClose();
          }}
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#7A808C',
            fontSize: '0.78rem',
            cursor: 'pointer',
            padding: '6px',
            fontWeight: 700
          }}
        >
          False Alarm? Click here to cancel SOS
        </button>
      </div>
    </div>
  );
};
