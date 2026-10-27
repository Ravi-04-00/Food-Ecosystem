import React from 'react';
import { AlertTriangle, Trash2, ArrowRight, X, Store, ShoppingBag } from 'lucide-react';

export const CartConflictModal = ({ isOpen, conflictData, onConfirm, onCancel }) => {
  if (!isOpen || !conflictData) return null;

  const currentRestName = conflictData.current_restaurant?.name || 'Previous Restaurant';
  const newRestName = conflictData.new_restaurant?.name || 'New Restaurant';
  const pendingDishName = conflictData.pendingItem?.name || 'selected item';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: 'var(--ws-shadow-lg)',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header Strip */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                Replace Cart Items?
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                Single Restaurant Cart Rule
              </span>
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--ws-border)',
              background: 'var(--ws-surface)',
              color: 'var(--ws-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Your cart currently contains dishes from <strong>{currentRestName}</strong>. Fast Delivery prepares and dispatches orders from one restaurant at a time.
          </p>

          {/* Restaurant Comparison Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--ws-surface-subtle)',
            border: '1px solid var(--ws-border)',
            borderRadius: '16px',
            padding: '14px 18px',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShoppingBag size={16} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>CURRENT CART</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentRestName}
                </div>
              </div>
            </div>

            <ArrowRight size={16} color="var(--ws-text-muted)" />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 0, overflow: 'hidden', textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 700 }}>NEW KITCHEN</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {newRestName}
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Store size={16} />
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--ws-text-muted)',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px'
          }}>
            Do you want to discard your existing cart items and add <strong>{pendingDishName}</strong> from <strong>{newRestName}</strong>?
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--ws-border)',
          background: 'var(--ws-surface-subtle)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid var(--ws-border)',
              background: 'var(--ws-surface)',
              color: 'var(--ws-text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Keep Current Cart
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Trash2 size={15} />
            <span>Clear & Add New</span>
          </button>
        </div>
      </div>
    </div>
  );
};
