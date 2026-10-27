import React, { useEffect } from 'react';
import { 
  Home, 
  Store, 
  PlayCircle, 
  Tag, 
  Heart, 
  ShoppingBag, 
  Package, 
  Navigation, 
  Headphones, 
  Settings, 
  LogOut, 
  User, 
  X,
  LogIn
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';

export const CustomerSidebar = ({ 
  activeTab, 
  setActiveTab, 
  open, 
  onClose,
  onOpenAuth,
  onOpenRegister,
  onOpenProfile
}) => {
  const { cartCount, currentUser, authState, promptLogout, orders = [] } = useCustomer();
  const orderCount = Array.isArray(orders) ? orders.length : 0;
  const isLoggedIn = Boolean(currentUser || authState?.isAuthenticated);
  const displayName = currentUser?.name || currentUser?.full_name || currentUser?.username || 'Valued Foodie';

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

  const discoveryItems = [
    { id: 'explore', label: 'Home', icon: Home },
    { id: 'restaurants', label: 'Explore Kitchens', icon: Store },
    { id: 'reels', label: 'Food Reels', icon: PlayCircle },
    { id: 'offers', label: 'Offers & Deals', icon: Tag },
    { id: 'wishlist', label: 'Saved Wishlist', icon: Heart }
  ];

  const orderItems = [
    { id: 'cart', label: 'My Cart', icon: ShoppingBag, badge: cartCount > 0 ? String(cartCount) : null },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orderCount > 0 ? String(orderCount) : null },
    { id: 'tracking', label: 'Live Tracking', icon: Navigation },
    { id: 'support', label: 'Support & Help', icon: Headphones },
    { id: 'settings', label: 'Account Settings', icon: Settings }
  ];

  return (
    <>
      <style>{`
        .customer-sidebar-responsive {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 260px !important;
          min-width: 260px !important;
        }
        @media (max-width: 1023.5px) {
          .customer-sidebar-responsive {
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
          .customer-sidebar-responsive.open {
            transform: translateX(0) !important;
            pointer-events: auto !important;
          }
        }
        @media (min-width: 1024px) {
          .customer-sidebar-responsive {
            position: sticky !important;
            top: 0 !important;
            transform: none !important;
            pointer-events: auto !important;
            flex-shrink: 0 !important;
          }
          .customer-drawer-backdrop, .customer-drawer-close, .fd-drawer-backdrop, .fd-drawer-close { display: none !important; }
        }
      `}</style>

      {open && (
        <div
          className="customer-drawer-backdrop fd-drawer-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 89, backgroundColor: 'rgba(24, 49, 38, 0.45)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`customer-sidebar-responsive fd-desktop-sidebar${open ? ' open' : ''}`}
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
        aria-label="Customer Navigation"
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
          onClick={() => navigate('explore')}
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
              ROYAL FOODS • CUSTOMER
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
            aria-label="Close navigation"
            className="customer-drawer-close fd-drawer-close"
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
            Explore & Dine
          </div>

          {discoveryItems.map(item => {
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
            Orders & Profile
          </div>

          {orderItems.map(item => {
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
        </nav>

        {/* Footer: Account or Sign In */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid #E1EBE3',
          backgroundColor: '#F7FBF7',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {isLoggedIn ? (
            <>
              <div 
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  else navigate('settings');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#D8F3DC',
                  border: '1.5px solid #52B788',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#163D2B',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#163D2B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#65776B' }}>
                    Customer Account
                  </div>
                </div>
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
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth('login');
                  if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#163D2B',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <LogIn size={15} color="#FFFFFF" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenRegister) onOpenRegister();
                  else navigate('register');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E1EBE3',
                  backgroundColor: '#FFFFFF',
                  color: '#163D2B',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CustomerSidebar;
