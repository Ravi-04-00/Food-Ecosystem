import React, { useEffect } from 'react';
import {
  Home,
  Package,
  TrendingUp,
  Gauge,
  FileCheck2,
  Bike,
  HelpCircle,
  User,
  Settings,
  ChevronRight,
  LogOut,
  Star,
  X,
  Clock,
  Award,
  MapPin,
  Shield,
  Wallet
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';
import { FDOrganicLogo } from '../FDOrganicLogo.jsx';

export const PRIMARY_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'orders', label: 'Deliveries', icon: Package, hasLiveBadge: true },
  { id: 'batch', label: 'Batch Jobs', icon: Gauge },
  { id: 'earnings', label: 'Earnings', icon: TrendingUp },
  { id: 'wallet', label: 'Wallet', icon: Wallet }
];

export const SECONDARY_NAV_ITEMS = [
  { id: 'schedule', label: 'Shift Schedule', icon: Clock },
  { id: 'incentives', label: 'Incentives', icon: Award },
  { id: 'heatmap', label: 'Demand Heatmap', icon: MapPin },
  { id: 'vehicle', label: 'Vehicle Details', icon: Bike },
  { id: 'documents', label: 'Documents & KYC', icon: FileCheck2 },
  { id: 'safety', label: 'Safety Guidelines', icon: Shield },
  { id: 'feedback', label: 'Ratings & Feedback', icon: Star },
  { id: 'profile', label: 'Partner Profile', icon: User },
  { id: 'support', label: 'Support Center', icon: HelpCircle },
  { id: 'settings', label: 'Terminal Settings', icon: Settings }
];

export const DESKTOP_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

/**
 * Responsive sidebar: permanently visible on desktop (lg+ >= 1024px) with 260px width.
 * Slide-out drawer on tablet/mobile (<1024px).
 * Desktop requirement: no collapsible toggle button and stable layout during navigation.
 */
export const Sidebar = ({ activeTab, setActiveTab, open, onClose }) => {
  const { activeTrip, isOnline, earnings, promptLogout } = useDelivery();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    const onResize = () => {
      if (window.innerWidth >= 1024 && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const prevOverflow = document.body.style.overflow;
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const navigate = (id) => {
    if (setActiveTab) setActiveTab(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (onClose) onClose();
    }
  };

  const goTab = (id) => {
    if (setActiveTab) setActiveTab(id);
  };

  const renderBody = (inDrawer) => {
    const go = inDrawer ? navigate : goTab;
    return (
      <>
      <div>
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #E1EBE3',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px'
        }} onClick={() => go('dashboard')}>
          <div>
            <FDOrganicLogo
              size="md"
              theme="light"
              showWordmark={true}
              showTagline={false}
            />
            <div style={{
              fontSize: '0.68rem',
              color: '#52B788',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginTop: '6px'
            }}>
              DELIVERY OPERATIONS HUB
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
            aria-label="Close navigation"
            className="delivery-drawer-close fd-drawer-close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65776B', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }} aria-label="Operations Navigation">
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#65776B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '4px 12px 8px'
          }}>
            Active Dispatch
          </div>
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLive = item.hasLiveBadge && activeTrip;

            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#D8F3DC' : 'transparent',
                  color: isActive ? '#163D2B' : '#65776B',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon
                    size={17}
                    color={isActive ? '#163D2B' : '#52B788'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{item.label}</span>
                </div>

                {isLive && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px #10B981'
                  }} className="animate-breathe" />
                )}
              </button>
            );
          })}

          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#65776B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '14px 12px 6px',
            borderTop: '1px solid #E1EBE3',
            marginTop: '8px'
          }}>
            Partner Management
          </div>

          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#D8F3DC' : 'transparent',
                  color: isActive ? '#163D2B' : '#65776B',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon
                  size={17}
                  color={isActive ? '#163D2B' : '#52B788'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ padding: '16px 14px', borderTop: '1px solid #E1EBE3', backgroundColor: '#F7FBF7' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E1EBE3',
          borderRadius: '14px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#65776B', fontWeight: 700, textTransform: 'uppercase' }}>
              CURRENT SHIFT
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: isOnline ? '#059669' : '#DC2626',
              backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2',
              padding: '2px 8px',
              borderRadius: '999px',
              border: `1px solid ${isOnline ? '#A7F3D0' : '#FECACA'}`
            }}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#65776B' }}>Today:</span>
            <span style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '1rem', fontWeight: 900, color: '#163D2B' }}>
              ₹{earnings?.today ? Number(earnings.today).toLocaleString() : '0'}
            </span>
          </div>
        </div>

        <button
          onClick={promptLogout}
          type="button"
          style={{
            marginTop: '10px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: 'none',
            color: '#DC2626',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <LogOut size={15} color="#DC2626" />
          <span>Logout Terminal</span>
        </button>
      </div>
      </>
    );
  };

  return (
    <>
      <style>{`
        .delivery-sidebar-responsive {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 260px !important;
          min-width: 260px !important;
        }
        @media (max-width: 1023.5px) {
          .delivery-sidebar-responsive {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh !important;
            min-height: 100vh !important;
            z-index: 90;
            box-shadow: 8px 0 30px rgba(24, 49, 38, 0.18);
            transform: translateX(-105%);
            pointer-events: none;
          }
          .delivery-sidebar-responsive.open {
            transform: translateX(0) !important;
            pointer-events: auto !important;
          }
        }
        @media (min-width: 1024px) {
          .delivery-sidebar-responsive {
            position: sticky !important;
            top: 0 !important;
            transform: none !important;
            pointer-events: auto !important;
            flex-shrink: 0 !important;
          }
          .delivery-drawer-backdrop, .delivery-drawer-close, .fd-drawer-backdrop, .fd-drawer-close { display: none !important; }
        }
      `}</style>

      {open && (
        <div
          className="delivery-drawer-backdrop fd-drawer-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 89, backgroundColor: 'rgba(22, 61, 43, 0.45)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Persistent desktop sidebar on >= 1024px, slide drawer on < 1024px */}
      <aside
        className={`delivery-sidebar-responsive fd-desktop-sidebar${open ? ' open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          maxWidth: '85vw',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E1EBE3',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 40,
          flexShrink: 0,
          overflowY: 'auto',
          fontFamily: "'Inter', sans-serif"
        }}
        aria-label="Operations Navigation"
      >
        {renderBody(true)}
      </aside>
    </>
  );
};

export default Sidebar;
