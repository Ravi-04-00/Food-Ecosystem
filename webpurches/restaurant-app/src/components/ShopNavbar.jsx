import React, { useState, useEffect, useRef } from 'react';
import { 
  User, LogOut, Settings, HelpCircle, 
  Menu, X, Bell, Store, Package, UtensilsCrossed, TrendingUp, ShieldCheck
} from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

export const ShopNavbar = ({ 
  activeTab = 'dashboard', 
  setActiveTab, 
  onOpenProfile,
  onOpenAuth,
  onOpenRegister,
  onOpenSidebar,
  sidebarOpen = false,
  onOpenNotifications
}) => {
  const { 
    isStoreOnline, 
    availabilityStatus, 
    toggleAvailability, 
    activeOrders = [], 
    currentUser, 
    authState, 
    promptLogout,
    restaurantProfileData
  } = useShop();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNavClick = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const isOpen = availabilityStatus === 'OPEN' || isStoreOnline;
  const isDashboardActive = activeTab === 'dashboard';
  const isOrdersActive = activeTab === 'orders' || activeTab === 'live-orders' || activeTab === 'kds';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E1EBE3',
      height: '68px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      boxShadow: '0 1px 3px rgba(22, 61, 43, 0.03)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left: Sidebar Toggle (mobile/tablet only) + Logo / Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button"
            onClick={() => onOpenSidebar && onOpenSidebar()}
            title="Open navigation menu"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen ? 'true' : 'false'}
            className="flex lg:hidden fd-header-mobile-toggle items-center justify-center shrink-0"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #E1EBE3',
              background: '#F7FBF7',
              color: '#163D2B',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} color="#163D2B" />
          </button>

          {/* Logo on mobile and tablet */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex lg:hidden fd-header-mobile-logo items-center"
            style={{ 
              cursor: 'pointer', 
              userSelect: 'none'
            }}
            title="FD Foods Partner"
          >
            <FDOrganicLogo 
              size="sm" 
              layout="horizontal"
              showWordmark={true} 
              showTagline={false} 
            />
          </div>

          {/* Desktop Breadcrumb Navigation */}
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#163D2B' }}>
              Kitchen Partner
            </span>
            <span style={{ fontSize: '0.78rem', color: '#8E9F94' }}>/</span>
            <span style={{ 
              fontSize: '0.84rem', 
              fontWeight: 600, 
              color: '#52B788', 
              textTransform: 'capitalize',
              backgroundColor: '#F7FBF7',
              border: '1px solid #E1EBE3',
              padding: '2px 10px',
              borderRadius: '999px'
            }}>
              {activeTab}
            </span>
          </div>
        </div>

        {/* Center / Text Links: Dashboard | Orders (Desktop) */}
        <nav 
          className="hidden md:flex" 
          style={{ 
            alignItems: 'center', 
            gap: '24px' 
          }}
        >
          <button type="button"
            onClick={() => handleNavClick('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              fontSize: '0.94rem',
              fontWeight: isDashboardActive ? 700 : 500,
              color: isDashboardActive ? '#163D2B' : '#65776B',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.15s ease',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <span>Dashboard</span>
            {isDashboardActive && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '2.5px',
                borderRadius: '2px',
                backgroundColor: '#52B788'
              }} />
            )}
          </button>

          <button type="button"
            onClick={() => handleNavClick('orders')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              fontSize: '0.94rem',
              fontWeight: isOrdersActive ? 700 : 500,
              color: isOrdersActive ? '#163D2B' : '#65776B',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.15s ease',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <span>Orders</span>
            {isOrdersActive && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '2.5px',
                borderRadius: '2px',
                backgroundColor: '#52B788'
              }} />
            )}
          </button>
        </nav>

        {/* Right Controls: Kitchen Availability | Profile Icon (Desktop) & Menu (Mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Kitchen Status Pill */}
          <button
            onClick={toggleAvailability}
            type="button"
            title={isOpen ? 'Kitchen Open - Click to pause' : 'Kitchen Paused - Click to open'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: `1px solid ${isOpen ? '#B7E4C7' : '#FECACA'}`,
              backgroundColor: isOpen ? '#D8F3DC' : '#FEF2F2',
              color: isOpen ? '#163D2B' : '#DC2626',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isOpen ? '#52B788' : '#DC2626'
            }} />
            <span>{isOpen ? 'Open' : 'Paused'}</span>
          </button>

          {/* Profile Icon / Dropdown Menu (Desktop) */}
          <div ref={profileMenuRef} style={{ position: 'relative' }} className="hidden md:block">
            <button type="button"
              onClick={() => setProfileMenuOpen(prev => !prev)}
              aria-expanded={profileMenuOpen ? 'true' : 'false'}
              aria-haspopup="menu"
              title="Restaurant Account"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: profileMenuOpen ? '1.5px solid #52B788' : '1px solid #E1EBE3',
                background: '#F7FBF7',
                color: '#163D2B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={20} color="#163D2B" />
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: '#FFFFFF',
                border: '1px solid #E1EBE3',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(22, 61, 43, 0.08)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 60
              }}>
                <div style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid #E1EBE3',
                  marginBottom: '4px'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.90rem', color: '#163D2B' }}>
                    {restaurantProfileData?.restaurant_name || currentUser?.restaurant_name || 'Partner Kitchen'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#65776B' }}>
                    {currentUser?.email || 'Verified Partner'}
                  </div>
                </div>

                <button type="button"
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                    else handleNavClick('profile');
                    setProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#163D2B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <User size={16} color="#52B788" />
                  <span>Restaurant Profile</span>
                </button>

                <button type="button"
                  onClick={() => {
                    handleNavClick('menu');
                    setProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#163D2B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <UtensilsCrossed size={16} color="#52B788" />
                  <span>Menu Catalog</span>
                </button>

                <button type="button"
                  onClick={() => {
                    handleNavClick('revenue');
                    setProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#163D2B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <TrendingUp size={16} color="#52B788" />
                  <span>Revenue & Analytics</span>
                </button>

                <button type="button"
                  onClick={() => {
                    handleNavClick('kyc');
                    setProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#163D2B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <ShieldCheck size={16} color="#52B788" />
                  <span>Restaurant KYC</span>
                </button>

                <button type="button"
                  onClick={() => {
                    handleNavClick('settings');
                    setProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#163D2B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Settings size={16} color="#52B788" />
                  <span>Terminal Settings</span>
                </button>

                <div style={{ borderTop: '1px solid #E1EBE3', margin: '4px 0' }} />

                <button type="button"
                  onClick={() => {
                    promptLogout();
                    setProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#DC2626',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={16} color="#DC2626" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Profile / Account Menu (Right) */}
          <div ref={mobileMenuRef} className="md:hidden" style={{ position: 'relative' }}>
            <button type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-expanded={mobileMenuOpen ? 'true' : 'false'}
              aria-haspopup="menu"
              title="Partner Account"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '1px solid #E1EBE3',
                background: '#F7FBF7',
                color: '#163D2B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {mobileMenuOpen ? <X size={20} color="#163D2B" /> : <User size={20} color="#163D2B" />}
            </button>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: '#FFFFFF',
                border: '1px solid #E1EBE3',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(22, 61, 43, 0.12)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 60
              }}>
                <button type="button"
                  onClick={() => handleNavClick('dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isDashboardActive ? 'rgba(82, 183, 136, 0.12)' : 'transparent',
                    color: isDashboardActive ? '#163D2B' : '#65776B',
                    fontSize: '0.90rem',
                    fontWeight: isDashboardActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Dashboard
                </button>

                <button type="button"
                  onClick={() => handleNavClick('orders')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isOrdersActive ? 'rgba(82, 183, 136, 0.12)' : 'transparent',
                    color: isOrdersActive ? '#163D2B' : '#65776B',
                    fontSize: '0.90rem',
                    fontWeight: isOrdersActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Orders
                </button>

                <button type="button"
                  onClick={() => handleNavClick('profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'profile' ? 'rgba(82, 183, 136, 0.12)' : 'transparent',
                    color: activeTab === 'profile' ? '#163D2B' : '#65776B',
                    fontSize: '0.90rem',
                    fontWeight: activeTab === 'profile' ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Profile
                </button>

                <div style={{ borderTop: '1px solid #E1EBE3', margin: '4px 0' }} />

                <button type="button"
                  onClick={() => {
                    promptLogout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#DC2626',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={16} color="#DC2626" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
