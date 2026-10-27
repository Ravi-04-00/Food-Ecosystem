import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, User, LogOut, Settings, Package, 
  HelpCircle, ChevronDown, Menu, X, ExternalLink, Wallet
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { fetchNotificationUnreadCount } from '../services/api.js';

export const CustomerNavbar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenAuth, 
  onOpenRegister,
  onOpenProfile,
  onOpenSidebar,
  onOpenWallet,
  sidebarOpen = false
}) => {
  const { cartCount, currentUser, authState, promptLogout, orders } = useCustomer();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close menus on outside click
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

  // Customer Ultra-Simple desktop text links: Home | Explore
  const navLinks = [
    { id: 'explore', label: 'Home' },
    { id: 'restaurants', label: 'Explore' }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const isExploreActive = activeTab === 'restaurants';
  const isHomeActive = activeTab === 'explore' || activeTab === 'search';

  return (
    <>
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
        {/* Left: Sidebar Toggle (mobile/tablet only <1024px) + Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
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

          <div 
            onClick={() => handleNavClick('explore')}
            className="flex lg:hidden fd-header-mobile-logo items-center"
            style={{ 
              cursor: 'pointer', 
              userSelect: 'none'
            }}
            title="FD Foods"
          >
            <FDOrganicLogo 
              size="sm" 
              layout="horizontal"
              showWordmark={true} 
              showTagline={false} 
            />
          </div>
        </div>

          {/* Center: Desktop Horizontal Navigation Links */}
          <nav 
            className="hidden md:flex" 
            style={{ 
              alignItems: 'center', 
              gap: '28px' 
            }}
          >
            {[
              { id: 'explore', label: 'Home' },
              { id: 'restaurants', label: 'Explore' },
              { id: 'reels', label: 'Food Reels' },
              { id: 'orders', label: 'My Orders' }
            ].map(link => {
              const isActive = (link.id === 'explore' && isHomeActive) || 
                               (link.id === 'restaurants' && isExploreActive) || 
                               (activeTab === link.id);
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 4px',
                    fontSize: '0.94rem',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? '#163D2B' : '#65776B',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'color 0.15s ease',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '2.5px',
                      borderRadius: '2px',
                      backgroundColor: '#52B788'
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Cart Icon | Profile Icon (Desktop) & Menu Icon (Mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Quick Wallet & Rewards Pill */}
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenWallet) onOpenWallet();
                }}
                title="FD Wallet & Rewards"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(27, 67, 50, 0.15)',
                  background: 'rgba(216, 243, 220, 0.4)',
                  color: '#1B4332',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Wallet size={15} color="#1B4332" />
                <span className="hidden sm:inline">Wallet</span>
              </button>
            )}

            {/* Cart Icon with Live Item-Count Badge */}
            <button type="button"
              onClick={() => handleNavClick('cart')}
              title="Cart"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: activeTab === 'cart' ? '1.5px solid #52B788' : '1px solid #E1EBE3',
                background: activeTab === 'cart' ? '#F7FBF7' : '#FFFFFF',
                color: '#163D2B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
            >
              <ShoppingBag size={20} color="#163D2B" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#52B788',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  minWidth: '18px',
                  height: '18px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #FFFFFF',
                  lineHeight: 1
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Icon / Dropdown Menu (Desktop) */}
            <div ref={profileMenuRef} style={{ position: 'relative' }} className="hidden md:block">
              <button type="button"
                onClick={() => setProfileMenuOpen(prev => !prev)}
                aria-expanded={profileMenuOpen ? 'true' : 'false'}
                aria-haspopup="menu"
                title="Account Menu"
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

              {/* Profile Menu Dropdown */}
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
                  {/* Account Header */}
                  <div style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid #E1EBE3',
                    marginBottom: '4px'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '0.90rem', color: '#163D2B' }}>
                      {currentUser?.full_name || (authState === 'authenticated' ? 'FD Foods Foodie' : 'Guest Customer')}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#65776B' }}>
                      {currentUser?.email || (authState === 'authenticated' ? 'Logged In' : 'Sign in to order')}
                    </div>
                  </div>

                  {authState === 'authenticated' ? (
                    <>
                      <button type="button"
                        onClick={() => {
                          if (onOpenProfile) onOpenProfile();
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
                        <span>Profile</span>
                      </button>

                      {/* Orders link inside Profile menu */}
                      <button type="button"
                        onClick={() => {
                          setActiveTab('orders');
                          setProfileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Package size={16} color="#52B788" />
                          <span>Orders History</span>
                        </div>
                        {orders?.length > 0 && (
                          <span style={{
                            background: '#D8F3DC',
                            color: '#163D2B',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '99px'
                          }}>
                            {orders.length}
                          </span>
                        )}
                      </button>

                      {/* FD Wallet & Rewards inside Profile menu */}
                      <button type="button"
                        onClick={() => {
                          if (onOpenWallet) onOpenWallet();
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
                        <Wallet size={16} color="#52B788" />
                        <span>FD Wallet & Rewards</span>
                      </button>

                      {/* Help & Support inside Profile menu */}
                      <button type="button"
                        onClick={() => {
                          setActiveTab('support');
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
                        <HelpCircle size={16} color="#52B788" />
                        <span>Help & Support</span>
                      </button>

                      {/* Settings inside Profile menu */}
                      <button type="button"
                        onClick={() => {
                          setActiveTab('settings');
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
                        <span>Settings</span>
                      </button>

                      <div style={{ borderTop: '1px solid #E1EBE3', margin: '4px 0' }} />

                      {/* Logout inside Profile menu */}
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
                    </>
                  ) : (
                    <>
                      <button type="button"
                        onClick={() => {
                          if (onOpenAuth) onOpenAuth('login');
                          setProfileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#163D2B',
                          color: '#FFFFFF',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <span>Sign In</span>
                      </button>

                      <button type="button"
                        onClick={() => {
                          if (onOpenRegister) onOpenRegister();
                          else setActiveTab('register');
                          setProfileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E1EBE3',
                          background: '#F7FBF7',
                          color: '#163D2B',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <span>Create Account</span>
                      </button>

                      <button type="button"
                        onClick={() => {
                          setActiveTab('support');
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
                          textAlign: 'left',
                          marginTop: '4px'
                        }}
                      >
                        <HelpCircle size={16} color="#52B788" />
                        <span>Help & Support</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Theme and Language Toggles (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

          </div>
        </div>
      </header>
    </>
  );
};
