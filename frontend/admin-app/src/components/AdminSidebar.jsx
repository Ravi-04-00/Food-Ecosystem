import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Store, Bike, ShoppingBag, 
  UtensilsCrossed, Landmark, FileSpreadsheet, Headphones, Settings,
  Navigation, Map, Tag, Star, Shield, ChevronDown, ChevronRight, LogOut, X
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { useTranslation } from '../utils/i18n.js';

export const AdminSidebar = ({ activeTab, setActiveTab, open, onClose }) => {
  const { authState, currentUser, promptLogout, overviewData } = useAdmin();
  const { t } = useTranslation();
  const kpis = overviewData?.kpis || {};

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

  const [platformToolsExpanded, setPlatformToolsExpanded] = useState(false);

  // Main 10 core administrative navigation items strictly per specification
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Users', icon: Users, badge: kpis.total_customers !== undefined ? String(kpis.total_customers) : undefined },
    { id: 'restaurants', label: 'Restaurants', icon: Store, badge: kpis.total_restaurants !== undefined ? String(kpis.total_restaurants) : undefined },
    { id: 'fleet', label: 'Delivery Partners', icon: Bike, badge: kpis.total_delivery_partners !== undefined ? String(kpis.total_delivery_partners) : undefined },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: kpis.total_orders !== undefined ? String(kpis.total_orders) : undefined },
    { id: 'menu', label: 'Menu & Categories', icon: UtensilsCrossed },
    { id: 'settlements', label: 'Payments', icon: Landmark },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Secondary platform management tools grouped under expandable section
  const secondaryNavItems = [
    { id: 'dispatch', label: 'Dispatch Engine', icon: Navigation },
    { id: 'maps', label: 'Live Fleet Map', icon: Map },
    { id: 'offers', label: 'Offers & Loyalty', icon: Tag },
    { id: 'reviews', label: 'Reviews Moderation', icon: Star },
    { id: 'security', label: 'Security & Audit', icon: Shield }
  ];

  const isSecondaryActive = secondaryNavItems.some(item => item.id === activeTab);

  return (
    <>
    <style>{`
      .admin-sidebar-responsive {
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        width: 260px !important;
        min-width: 260px !important;
      }
      @media (max-width: 1023.5px) {
        .admin-sidebar-responsive {
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
        .admin-sidebar-responsive.open {
          transform: translateX(0) !important;
          pointer-events: auto !important;
        }
      }
      @media (min-width: 1024px) {
        .admin-sidebar-responsive {
          position: sticky !important;
          top: 0 !important;
          transform: none !important;
          pointer-events: auto !important;
          flex-shrink: 0 !important;
        }
        .admin-drawer-backdrop, .admin-drawer-close, .fd-drawer-backdrop, .fd-drawer-close { display: none !important; }
      }
    `}</style>
    {open && (
      <div
        className="admin-drawer-backdrop fd-drawer-backdrop"
        style={{ position: 'fixed', inset: 0, zIndex: 89, backgroundColor: 'rgba(24, 49, 38, 0.45)' }}
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <aside className={`admin-sidebar-responsive fd-desktop-sidebar${open ? ' open' : ''}`} style={{
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
    aria-label="Admin Mission Control Navigation"
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
          MISSION CONTROL • ADMIN
        </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
          aria-label="Close navigation"
          className="admin-drawer-close fd-drawer-close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65776B', padding: '6px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav List */}
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
          Admin Navigation
        </div>

        {/* 10 Core Main Admin Navigation Items */}
        {mainNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button type="button"
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
                  background: isActive ? '#163D2B' : '#F7FBF7',
                  color: isActive ? '#FFFFFF' : '#65776B',
                  border: isActive ? 'none' : '1px solid #E1EBE3'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Expandable Secondary Platform Operations */}
        <div style={{ marginTop: '12px', borderTop: '1px solid #E1EBE3', paddingTop: '10px' }}>
          <button type="button"
            onClick={() => setPlatformToolsExpanded(!platformToolsExpanded)}
            aria-expanded={(platformToolsExpanded || isSecondaryActive) ? 'true' : 'false'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: isSecondaryActive ? 'rgba(82, 183, 136, 0.08)' : 'transparent',
              color: isSecondaryActive ? '#163D2B' : '#65776B',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer'
            }}
          >
            <span>Advanced Modules</span>
            {platformToolsExpanded || isSecondaryActive ? (
              <ChevronDown size={14} color="#65776B" />
            ) : (
              <ChevronRight size={14} color="#65776B" />
            )}
          </button>

          {(platformToolsExpanded || isSecondaryActive) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              {secondaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button type="button"
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px 8px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isActive ? '#D8F3DC' : 'transparent',
                      color: isActive ? '#163D2B' : '#65776B',
                      cursor: 'pointer',
                      fontWeight: isActive ? 800 : 500,
                      fontSize: '0.82rem',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={15} color={isActive ? '#163D2B' : '#52B788'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid #E1EBE3',
        backgroundColor: '#F7FBF7',
        fontSize: '0.74rem',
        color: '#65776B',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ fontWeight: 800, color: '#163D2B' }}>FD Foods Ecosystem</div>
        <div>Admin Mission Control • Port 3003</div>
      </div>
    </aside>
    </>
  );
};
