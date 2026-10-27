import React from 'react';
import { 
  Home, 
  Package, 
  Headphones, 
  TrendingUp, 
  Menu 
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'orders', label: 'Deliveries', icon: Package, hasLiveBadge: true },
  { id: 'earnings', label: 'Earnings', icon: TrendingUp },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: '__more__', label: 'More', icon: Menu, isAction: true }
];

export const MobileBottomNav = ({ activeTab, setActiveTab, onOpenMore }) => {
  const { activeTrip } = useDelivery();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 45,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E1EBE3',
        boxShadow: '0 -2px 14px rgba(22, 61, 43, 0.06)',
        padding: '6px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        fontFamily: "'Inter', sans-serif"
      }}
      className="flex md:hidden"
      aria-label="Mobile Navigation"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        maxWidth: '540px',
        margin: '0 auto'
      }}>
        {MOBILE_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = !item.isAction && activeTab === item.id;
          const isLive = item.hasLiveBadge && activeTrip;

          const handleClick = () => {
            if (item.isAction) {
              if (onOpenMore) onOpenMore();
            } else {
              if (setActiveTab) setActiveTab(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              type="button"
              aria-label={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: isActive ? '#163D2B' : '#65776B',
                cursor: 'pointer',
                position: 'relative',
                minWidth: '56px',
                minHeight: '48px',
                transition: 'color 0.15s ease'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon 
                  size={20} 
                  color={isActive ? '#163D2B' : '#65776B'} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                {isLive && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#52B788',
                    boxShadow: '0 0 6px #52B788'
                  }} />
                )}
              </div>

              <span style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 800 : 600,
                marginTop: '3px',
                color: isActive ? '#163D2B' : '#65776B'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
