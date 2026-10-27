import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

/**
 * Phase 4: Unified Restaurant Session Expired Modal
 */
export const FDSessionExpiredModal = ({ isOpen, onLoginAgain }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 46, 27, 0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#0A2E1B',
        borderRadius: '24px',
        border: '1px solid #DCFCE7',
        boxShadow: '0 24px 60px rgba(10, 46, 27, 0.25)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '30px 24px',
        gap: '16px'
      }}>
        {/* Brand Monogram */}
        <FDOrganicLogo size="sm" showWordmark={false} theme="light" appName="RESTAURANT" />

        {/* Expired Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#FEF3C7',
          border: '1.5px solid #FDE68A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D97706',
          marginTop: '4px'
        }}>
          <Clock size={24} />
        </div>

        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 6px 0', color: '#0A2E1B' }}>
            Session Expired
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#4B6B58', margin: 0, lineHeight: 1.5 }}>
            Your session has expired. Please login again.
          </p>
          <p style={{ fontSize: '0.74rem', color: '#648270', margin: '6px 0 0 0' }}>
            Kitchen security tokens have expired. Re-authenticate to resume dispatch.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onLoginAgain}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
            transition: 'all 0.15s ease',
            marginTop: '8px'
          }}
        >
          <span>Login Again</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
