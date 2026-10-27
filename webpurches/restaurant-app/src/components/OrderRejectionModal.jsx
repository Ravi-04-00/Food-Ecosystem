import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const PREDEFINED_REASONS = [
  'Item or ingredients out of stock',
  'Kitchen at capacity / Restaurant too busy',
  'Unable to fulfill order at this time',
  'Store closing soon',
  'Special instructions cannot be accommodated',
  'Other operational constraint'
];

export const OrderRejectionModal = ({ order, isOpen, onClose, onConfirm, isSubmitting }) => {
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a rejection reason.');
      return;
    }
    setError('');
    onConfirm(order.id, selectedReason, explanation.trim());
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--ws-surface, #111827)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '24px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        animation: 'scaleUp 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary, #F9FAFB)' }}>
                Decline Order #{order.order_number?.slice(-6) || order.id}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted, #9CA3AF)', margin: '2px 0 0 0' }}>
                Customer will be informed with this rejection reason
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ws-text-muted, #9CA3AF)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--ws-text-primary, #F9FAFB)' }}>
              Select Reason <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PREDEFINED_REASONS.map((reason) => (
                <label
                  key={reason}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: selectedReason === reason ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${selectedReason === reason ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    color: selectedReason === reason ? '#EF4444' : 'var(--ws-text-primary, #E5E7EB)',
                    fontWeight: selectedReason === reason ? 700 : 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    style={{ accentColor: '#EF4444' }}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary, #F9FAFB)' }}>
              Additional Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide more context (e.g. out of chicken patties until 7 PM)..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.12))',
                color: 'var(--ws-text-primary, #FFFFFF)',
                fontSize: '0.88rem',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.15))',
                color: 'var(--ws-text-primary, #E5E7EB)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                background: '#EF4444',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
