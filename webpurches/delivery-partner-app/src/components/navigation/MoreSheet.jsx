import React from 'react';
import { 
  X, 
  Wallet, 
  CalendarClock, 
  Gauge, 
  Award, 
  FileCheck2, 
  Bike, 
  ShieldAlert, 
  Headphones, 
  UserCircle, 
  Settings,
  Layers,
  MapPin,
  ChevronRight,
  Star
} from 'lucide-react';

export const MORE_NAV_ITEMS = [
  { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet, desc: 'Instant IMPS transfer, settlements & balance' },
  { id: 'feedback', label: 'Ratings & Reviews', icon: Star, desc: 'Customer ratings, compliments & dispute reports' },
  { id: 'batch', label: 'Batch Dispatch', icon: Layers, desc: 'Multi-order sequential routing engine' },
  { id: 'schedule', label: 'Shifts & Schedule', icon: CalendarClock, desc: 'Reserve slots & AI demand recommendations' },
  { id: 'incentives', label: 'Incentives & Targets', icon: Award, desc: 'Milestone tiers, surge multipliers & bonuses' },
  { id: 'heatmap', label: 'Demand Heatmap', icon: MapPin, desc: 'Live hot zones with surge multipliers' },
  { id: 'documents', label: 'Documents & KYC', icon: FileCheck2, desc: 'Driving license, RC, insurance & verification' },
  { id: 'vehicle', label: 'Vehicle & Fleet', icon: Bike, desc: 'EV battery telemetry, range & charging hubs' },
  { id: 'safety', label: 'Safety Command Center', icon: ShieldAlert, desc: 'SOS emergency, crash reporting & guidance' },
  { id: 'support', label: 'Operations Support', icon: Headphones, desc: '24/7 partner helpline & operational triage' },
  { id: 'profile', label: 'Partner Profile', icon: UserCircle, desc: 'Credentials, FD ID card & ratings' },
  { id: 'settings', label: 'App Settings', icon: Settings, desc: 'Language, sound effects, battery saver & themes' }
];

export const MoreSheet = ({ isOpen, onClose, onSelectTab }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(25, 27, 31, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.15s ease'
    }}>
      {/* Background click to close */}
      <div 
        style={{ flex: 1 }} 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Sheet Content */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #EDE8DE',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -8px 30px rgba(25, 27, 31, 0.08)',
        animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Drag handle / Header */}
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
                fontSize: '0.68rem',
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
                Operations Directory
              </h3>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#7A808C' }}>
              FD secondary operational modules & partner tools
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close Directory"
            style={{
              width: '34px',
              height: '34px',
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

        {/* Modules List */}
        <div style={{
          padding: '12px 16px 36px',
          overflowY: 'auto',
          display: 'grid',
          gap: '8px'
        }}>
          {MORE_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isSafety = item.id === 'safety';

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #EDE8DE',
                  borderRadius: '16px',
                  color: '#191B1F',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.backgroundColor = '#FFFBFB';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#EDE8DE';
                  e.currentTarget.style.backgroundColor = '#FBF9F5';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: isSafety ? '#FEF2F2' : '#FEF2F2',
                    border: `1px solid ${isSafety ? '#FECACA' : '#FECACA'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#DC2626',
                    flexShrink: 0
                  }}>
                    <Icon size={19} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#7A808C', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <ChevronRight size={18} color="#A5ABB6" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
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
