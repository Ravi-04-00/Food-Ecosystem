import React from 'react';
import { LogOut, X, Loader2 } from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

/**
 * Phase 4: Unified Restaurant Logout Confirmation Modal
 * Light Luxury FD Brand Styling
 */
export const FDLogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 46, 27, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#0A2E1B',
        borderRadius: '24px',
        border: '1px solid #DCFCE7',
        boxShadow: '0 24px 60px rgba(10, 46, 27, 0.22)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '28px 24px',
        gap: '16px'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#F4FBF7',
            border: '1px solid #DCFCE7',
            borderRadius: '10px',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            padding: '6px',
            display: 'flex',
            color: '#4B6B58'
          }}
          title="Cancel"
        >
          <X size={16} />
        </button>

        {/* Brand Monogram */}
        <FDOrganicLogo size="sm" showWordmark={false} theme="light" />

        {/* Danger Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          border: '1.5px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#DC2626',
          marginTop: '4px'
        }}>
          <LogOut size={24} />
        </div>

        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 6px 0', color: '#0A2E1B' }}>
            Logout?
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#4B6B58', margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to logout?
          </p>
          <p style={{ fontSize: '0.74rem', color: '#648270', margin: '6px 0 0 0' }}>
            Active kitchen KDS terminal session will be cleared.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            style={{
              padding: '11px',
              borderRadius: '12px',
              border: '1.5px solid #CBD5E1',
              background: '#F8FAF6',
              color: '#475569',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            style={{
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: isLoggingOut ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoggingOut ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Logging Out...</span>
              </>
            ) : (
              <span>Logout</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
