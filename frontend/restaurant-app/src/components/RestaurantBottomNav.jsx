import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  UtensilsCrossed, 
  Menu 
} from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';

export const RestaurantBottomNav = ({ activeTab, setActiveTab, onOpenSidebar }) => {
  const { activeOrders = [] } = useShop();
  const activeCount = Array.isArray(activeOrders) ? activeOrders.length : 0;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: activeCount },
    { id: 'kds', label: 'KDS', icon: ChefHat },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: '__more__', label: 'More', icon: Menu, isAction: true }
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E1EBE3',
        boxShadow: '0 -2px 14px rgba(22, 61, 43, 0.06)',
        padding: '6px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        fontFamily: "'Inter', sans-serif"
      }}
      className="flex md:hidden"
      aria-label="Restaurant Mobile Navigation"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        maxWidth: '540px',
        margin: '0 auto'
      }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = !item.isAction && (activeTab === item.id || (item.id === 'orders' && (activeTab === 'orders' || activeTab === 'live-orders')));

          const handleClick = () => {
            if (item.isAction) {
              if (onOpenSidebar) onOpenSidebar();
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
              aria-current={isActive ? 'page' : undefined}
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
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '999px',
                    backgroundColor: '#52B788',
                    color: '#FFFFFF',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 4px rgba(82, 183, 136, 0.4)'
                  }}>
                    {item.badge}
                  </span>
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

export default RestaurantBottomNav;
