import React from 'react';
import { LogOut } from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

export const FDLogoutModal = ({ isOpen, isLoading = false, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(10, 46, 27, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-desc"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          boxShadow: '0 24px 60px rgba(10, 46, 27, 0.18)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'ws-slide-up 0.2s ease-out'
        }}
      >
        {/* FD Leaf Badge */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: '#DC2626'
        }}>
          <LogOut size={26} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <FDOrganicLogo size="sm" showWordmark={false} theme="light" />
        </div>

        <h3 id="logout-title" style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#0A2E1B',
          margin: '0 0 8px'
        }}>
          Logout?
        </h3>

        <p id="logout-desc" style={{
          fontSize: '0.88rem',
          color: '#64748B',
          lineHeight: 1.5,
          margin: '0 0 24px'
        }}>
          Are you sure you want to logout?
        </p>

        {/* Action Buttons: Cancel and Logout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          width: '100%'
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? (
              <span>Logging out...</span>
            ) : (
              <>
                <LogOut size={16} />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
