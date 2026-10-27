import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const ToastBanner = () => {
  const { toastMessage } = useDelivery();

  if (!toastMessage) return null;

  const { msg, type } = toastMessage;

  const config = {
    success: { icon: CheckCircle2, color: 'var(--bp-success)', bg: 'var(--bp-success-subtle)', border: 'var(--bp-success-border)' },
    warning: { icon: AlertTriangle, color: 'var(--bp-warning)', bg: 'var(--bp-warning-subtle)', border: 'var(--bp-warning-border)' },
    danger: { icon: AlertCircle, color: 'var(--bp-danger)', bg: 'var(--bp-danger-subtle)', border: 'var(--bp-danger-border)' },
    info: { icon: Info, color: 'var(--bp-gold-solid)', bg: 'rgba(212, 175, 55, 0.12)', border: 'var(--bp-border-gold)' }
  }[type] || { icon: Info, color: 'var(--bp-gold-solid)', bg: 'rgba(212, 175, 55, 0.12)', border: 'var(--bp-border-gold)' };

  const Icon = config.icon;

  return (
    <div style={{
      position: 'fixed',
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 150,
      maxWidth: '92%',
      width: '460px',
      backgroundColor: 'var(--bp-bg-surface-elevated)',
      border: `1px solid ${config.border}`,
      boxShadow: 'var(--bp-shadow-elevated)',
      borderRadius: 'var(--bp-radius-lg)',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: config.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: config.color,
        flexShrink: 0
      }}>
        <Icon size={18} />
      </div>

      <div style={{ flex: 1, fontSize: '0.84rem', fontWeight: 600, color: 'var(--bp-text-primary)' }}>
        {msg}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};
