import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  UtensilsCrossed, 
  Layers, 
  Landmark, 
  Star, 
  AlertTriangle, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  X,
  Power
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { useShop } from '../context/ShopContext.jsx';

export const RestaurantSidebar = ({ activeTab, setActiveTab, open, onClose }) => {
  const { 
    isStoreOnline, 
    availabilityStatus, 
    toggleAvailability, 
    activeOrders = [], 
    currentUser, 
    promptLogout,
    restaurantProfileData
  } = useShop();

  const isOpen = availabilityStatus === 'OPEN' || isStoreOnline;
  const activeCount = Array.isArray(activeOrders) ? activeOrders.length : 0;
  const restaurantName = restaurantProfileData?.restaurant_name || currentUser?.restaurant_name || 'My Kitchen';

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

  const coreNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Live Orders', icon: ShoppingBag, badge: activeCount > 0 ? String(activeCount) : null },
    { id: 'kds', label: 'Kitchen Display', icon: ChefHat },
    { id: 'menu', label: 'Menu Manager', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Inventory', icon: Layers }
  ];

  const businessNavItems = [
    { id: 'settlements', label: 'Settlements', icon: Landmark },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'kyc', label: 'Kitchen KYC', icon: ShieldCheck },
    { id: 'settings', label: 'Terminal Settings', icon: Settings }
  ];

  return (
    <>
      <style>{`
        .restaurant-sidebar-responsive {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 260px !important;
          min-width: 260px !important;
        }
        @media (max-width: 1023.5px) {
          .restaurant-sidebar-responsive {
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
          .restaurant-sidebar-responsive.open {
            transform: translateX(0) !important;
            pointer-events: auto !important;
          }
        }
        @media (min-width: 1024px) {
          .restaurant-sidebar-responsive {
            position: sticky !important;
            top: 0 !important;
            transform: none !important;
            pointer-events: auto !important;
            flex-shrink: 0 !important;
          }
          .restaurant-drawer-backdrop, .restaurant-drawer-close, .fd-drawer-backdrop, .fd-drawer-close { display: none !important; }
        }
      `}</style>

      {open && (
        <div
          className="restaurant-drawer-backdrop fd-drawer-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 89, backgroundColor: 'rgba(24, 49, 38, 0.45)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`restaurant-sidebar-responsive fd-desktop-sidebar${open ? ' open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          maxWidth: '85vw',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E1EBE3',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
          userSelect: 'none',
          fontFamily: "'Inter', sans-serif"
        }}
        aria-label="Restaurant Partner Navigation"
      >
        {/* Brand Header */}
        <div 
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #E1EBE3',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '8px'
          }} 
          onClick={() => navigate('dashboard')}
        >
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
              KITCHEN PARTNER TERMINAL
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
            aria-label="Close navigation"
            className="restaurant-drawer-close fd-drawer-close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65776B', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          padding: '16px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#65776B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '4px 12px 8px'
          }}>
            Kitchen Operations
          </div>

          {coreNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button 
                type="button"
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#D8F3DC' : 'transparent',
                  color: isActive ? '#163D2B' : '#65776B',
                  cursor: 'pointer',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.86rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} color={isActive ? '#163D2B' : '#52B788'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: '#10B981',
                    color: '#FFFFFF'
                  }}>
                    {item.badge}
                  </span>
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
            Business & Settings
          </div>

          {businessNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button 
                type="button"
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#D8F3DC' : 'transparent',
                  color: isActive ? '#163D2B' : '#65776B',
                  cursor: 'pointer',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.86rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <Icon size={17} color={isActive ? '#163D2B' : '#52B788'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Status Toggle & Logout */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid #E1EBE3',
          backgroundColor: '#F7FBF7',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Availability Status Card */}
          <div style={{
            padding: '10px 12px',
            borderRadius: '12px',
            backgroundColor: isOpen ? '#D8F3DC' : '#FEF2F2',
            border: `1px solid ${isOpen ? '#B7E4C7' : '#FECACA'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOpen ? '#10B981' : '#EF4444'
              }} />
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: isOpen ? '#163D2B' : '#DC2626'
              }}>
                {isOpen ? 'Kitchen Open' : 'Kitchen Paused'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAvailability}
              title={isOpen ? 'Pause incoming orders' : 'Open kitchen for orders'}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isOpen ? '#1B4332' : '#DC2626',
                background: '#FFFFFF',
                border: '1px solid #E1EBE3',
                borderRadius: '8px',
                padding: '3px 8px',
                cursor: 'pointer'
              }}
            >
              Toggle
            </button>
          </div>

          <button
            type="button"
            onClick={promptLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#DC2626',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={14} color="#DC2626" />
            <span>Logout Terminal</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default RestaurantSidebar;
