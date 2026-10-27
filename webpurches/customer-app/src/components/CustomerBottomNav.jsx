import React from 'react';
import { 
  Home, 
  Store, 
  PlayCircle, 
  Package, 
  ShoppingBag 
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';

export const CustomerBottomNav = ({ activeTab, setActiveTab }) => {
  const { cartCount } = useCustomer();

  const navItems = [
    { id: 'explore', label: 'Home', icon: Home },
    { id: 'restaurants', label: 'Explore', icon: Store },
    { id: 'reels', label: 'Reels', icon: PlayCircle },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartCount }
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
      aria-label="Customer Mobile Navigation"
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
          const isActive = activeTab === item.id || (item.id === 'explore' && activeTab === 'search');

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab && setActiveTab(item.id)}
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

export default CustomerBottomNav;
