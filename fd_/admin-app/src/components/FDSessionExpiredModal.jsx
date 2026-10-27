import React from 'react';
import { Clock, LogIn } from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

export const FDSessionExpiredModal = ({ isOpen, onLoginAgain }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(10, 46, 27, 0.6)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-title"
        aria-describedby="session-desc"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          boxShadow: '0 24px 60px rgba(10, 46, 27, 0.25)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'ws-slide-up 0.2s ease-out'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'rgba(234, 179, 8, 0.12)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: '#CA8A04'
        }}>
          <Clock size={28} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <FDOrganicLogo size="sm" showWordmark={false} theme="light" />
        </div>

        <h3 id="session-title" style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#0A2E1B',
          margin: '0 0 8px'
        }}>
          Session Expired
        </h3>

        <p id="session-desc" style={{
          fontSize: '0.88rem',
          color: '#64748B',
          lineHeight: 1.5,
          margin: '0 0 24px'
        }}>
          Your session has expired. Please login again.
        </p>

        <button
          type="button"
          onClick={onLoginAgain}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <LogIn size={17} />
          <span>Login Again</span>
        </button>
      </div>
    </div>
  );
};
