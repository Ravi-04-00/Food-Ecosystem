import React, { useState } from 'react';
import { 
  X, 
  Store, 
  User, 
  Building2, 
  MapPin, 
  Key, 
  Package, 
  Wrench, 
  Wallet, 
  ShieldAlert, 
  PhoneCall, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Navigation
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const HelpBottomSheet = ({ isOpen, onClose, contextScreen = 'General' }) => {
  const { triggerSOS, showToast } = useDelivery();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sosConfirming, setSosConfirming] = useState(false);

  if (!isOpen) return null;

  // The 8 exact categories required by FD Delivery Operations + Emergency SOS
  const categories = [
    { 
      id: 'restaurant_problem', 
      label: 'Restaurant problem', 
      desc: 'Kitchen delay, order not ready, packaging spill, merchant closed', 
      icon: Store,
      solutions: [
        'Report Kitchen Delay (>10m Wait Pay)',
        'Merchant Needs Order Repackaging',
        'Restaurant Closed / Unreachable'
      ]
    },
    { 
      id: 'customer_problem', 
      label: 'Customer problem', 
      desc: 'Phone unreachable, incorrect phone number, customer refusal', 
      icon: User,
      solutions: [
        'Send Priority FD Automated Call',
        'Customer Unreachable (>5m Timer)',
        'Customer Requested Address Change'
      ]
    },
    { 
      id: 'apartment_gate_problem', 
      label: 'Apartment gate problem', 
      desc: 'Security denying entry, gate pass required, visitor gate blocked', 
      icon: Building2,
      solutions: [
        'Generate Instant FD Gate Pass SMS',
        'Call Resident via Security Intercom',
        'Request Customer Meet at Gate'
      ]
    },
    { 
      id: 'wrong_location', 
      label: 'Wrong location', 
      desc: 'GPS pin mismatch, barricaded street, incorrect building tagged', 
      icon: MapPin,
      solutions: [
        'Recalibrate GPS to Actual Residence',
        'Report Road Closed / Barricade Detour',
        'Correct Customer Location Pin'
      ]
    },
    { 
      id: 'otp_problem', 
      label: 'OTP problem', 
      desc: 'Customer phone dead, SMS delay, unable to receive 4-digit code', 
      icon: Key,
      solutions: [
        'Switch to Doorstep Photo Verification',
        'Resend SMS OTP to Customer',
        'Manager Override with Dispatch'
      ]
    },
    { 
      id: 'order_problem', 
      label: 'Order problem', 
      desc: 'Spilled beverage, damaged packaging, missing items from bag', 
      icon: Package,
      solutions: [
        'Upload Photo of Damaged Container',
        'Report Missing Item Component',
        'Initiate Partial Delivery Waiver'
      ]
    },
    { 
      id: 'vehicle_problem', 
      label: 'Vehicle problem', 
      desc: 'Tyre puncture, electric battery depleted, breakdown, accident', 
      icon: Wrench,
      solutions: [
        'Request Roadside Assistance / Tow',
        'Reassign Order to Nearby FD Partner',
        'Report Flat Tyre / EV Battery Drop'
      ]
    },
    { 
      id: 'payment_problem', 
      label: 'Payment problem', 
      desc: 'Trip earnings mismatch, delayed tip, toll/surge pay issue', 
      icon: Wallet,
      solutions: [
        'Request Route Distance Pay Recalculation',
        'Claim Heavy Rain / Peak Surge Pay',
        'Wallet Instant Payout Support'
      ]
    },
    { 
      id: 'emergency_sos', 
      label: 'Emergency SOS', 
      desc: 'Accident, physical threat, severe health emergency on route', 
      icon: ShieldAlert, 
      isEmergency: true 
    }
  ];

  const handleSelect = (cat) => {
    if (cat.isEmergency) {
      setSosConfirming(true);
      return;
    }
    setSelectedCategory(cat);
  };

  const handleConfirmSOS = () => {
    triggerSOS('Triggered via FD Emergency Assistant');
    setSosConfirming(false);
    onClose();
  };

  const handleResolve = (action) => {
    showToast(`FD Support Ticket Created: ${selectedCategory.label} — ${action}. Priority team alerted.`, 'info');
    setSelectedCategory(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 250,
      backgroundColor: 'rgba(25, 27, 31, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.15s ease'
    }}>
      {/* Click outside to close */}
      <div style={{ flex: 1 }} onClick={onClose} aria-hidden="true" />

      {/* Sheet Container */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        borderTop: '1px solid #EDE8DE',
        boxShadow: '0 -8px 30px rgba(25, 27, 31, 0.08)',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Handle & Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F3EFE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '36px',
              height: '4px',
              backgroundColor: '#DDD6C9',
              borderRadius: '999px',
              margin: '0 auto 8px'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '5px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                FD
              </div>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#191B1F',
                margin: 0
              }}>
                Partner Help & Support
              </h3>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#7A808C' }}>
              Always-accessible operational assistance • Screen: {contextScreen}
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close Help Sheet"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#F8F6F2',
              border: '1px solid #EDE8DE',
              color: '#525760',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px 32px', overflowY: 'auto' }}>
          
          {/* Emergency Confirmation View */}
          {sosConfirming && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FECACA',
              borderRadius: '18px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
              }}>
                <ShieldAlert size={30} />
              </div>

              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#991B1B', margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Confirm Emergency SOS Alert?
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#B91C1C', margin: 0, lineHeight: 1.45 }}>
                  This immediately activates priority emergency protocol, alerts 24/7 FD Safety Command, and transmits your exact live GPS coordinates. (Prevents accidental triggers).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={() => setSosConfirming(false)}
                  type="button"
                  className="btn-secondary-fresh"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSOS}
                  type="button"
                  style={{
                    flex: 1.6,
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  YES, TRIGGER SOS NOW
                </button>
              </div>
            </div>
          )}

          {/* Selected Category Solution Wizard */}
          {selectedCategory && !sosConfirming && (
            <div style={{
              backgroundColor: '#F8F6F2',
              border: '1px solid #EDE8DE',
              borderRadius: '18px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <selectedCategory.icon size={18} />
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#191B1F' }}>
                    {selectedCategory.label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: 'none', border: 'none', color: '#7A808C', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  ← Back to Categories
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#525760', margin: 0 }}>
                {selectedCategory.desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7A808C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Suggested Instant Fixes
                </div>

                {selectedCategory.solutions?.map((sol, i) => (
                  <button
                    key={i}
                    onClick={() => handleResolve(sol)}
                    type="button"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #EDE8DE',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#191B1F',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#DC2626';
                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#EDE8DE';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    <span>{sol}</span>
                    <span style={{ color: '#DC2626', fontWeight: 800 }}>→</span>
                  </button>
                ))}

                <button
                  onClick={() => handleResolve('Connected with FD Operations Support Team')}
                  type="button"
                  className="btn-secondary-fresh"
                  style={{ padding: '12px 14px', fontSize: '0.84rem', marginTop: '6px' }}
                >
                  <PhoneCall size={16} />
                  <span>Call 24/7 FD Support Rider Helpline</span>
                </button>
              </div>
            </div>
          )}

          {/* List of 8 Clean Categories + Emergency SOS */}
          {!selectedCategory && !sosConfirming && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '10px' }}>
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect(cat)}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '13px 15px',
                      backgroundColor: cat.isEmergency ? '#FEF2F2' : '#FFFFFF',
                      border: `1.5px solid ${cat.isEmergency ? '#FECACA' : '#EDE8DE'}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!cat.isEmergency) {
                        e.currentTarget.style.borderColor = '#DC2626';
                        e.currentTarget.style.backgroundColor = '#FFFBFB';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!cat.isEmergency) {
                        e.currentTarget.style.borderColor = '#EDE8DE';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      backgroundColor: cat.isEmergency ? '#FEE2E2' : '#FEF2F2',
                      color: cat.isEmergency ? '#DC2626' : '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={19} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: cat.isEmergency ? '#DC2626' : '#191B1F'
                      }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#7A808C', marginTop: '2px', lineHeight: 1.3 }}>
                        {cat.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
