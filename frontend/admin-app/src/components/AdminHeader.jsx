import React, { useState, useRef, useEffect } from 'react';
import { 
  User, LogOut, Settings, HelpCircle, 
  Menu, Bell, ShieldCheck
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { useAdmin } from '../context/AdminContext.jsx';

export const AdminHeader = ({ 
  activeTab = 'dashboard', 
  setActiveTab, 
  unreadCount = 0,
  onOpenSidebar,
  sidebarOpen = false
}) => {
  const { authState, currentUser, promptLogout } = useAdmin();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
  };

  const isDashboardActive = activeTab === 'dashboard';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
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
          
          {/* Logo on mobile and tablet where sidebar is in drawer */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex lg:hidden fd-header-mobile-logo items-center"
            style={{ 
              cursor: 'pointer', 
              userSelect: 'none'
            }}
            title="FD Foods Admin"
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
              Mission Control
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

        {/* Right Controls: Profile Icon (Desktop) & Menu (Mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Profile Icon / Dropdown Menu (Desktop) */}
          <div ref={profileMenuRef} style={{ position: 'relative' }} className="hidden md:block">
            <button type="button"
              onClick={() => setProfileMenuOpen(prev => !prev)}
              aria-expanded={profileMenuOpen ? 'true' : 'false'}
              aria-haspopup="menu"
              title="Admin Profile"
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
                    {currentUser?.full_name || 'System Administrator'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#65776B' }}>
                    {currentUser?.email || 'Superadmin Access'}
                  </div>
                </div>

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
                  <span>Platform Settings</span>
                </button>

                <button type="button"
                  onClick={() => {
                    handleNavClick('support');
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

        </div>
      </div>
    </header>
  );
};
