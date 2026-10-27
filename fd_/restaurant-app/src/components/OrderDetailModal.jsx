import React, { useEffect, useState } from 'react';
import { 
  X, Clock, MapPin, User, Phone, CheckCircle2, AlertCircle, 
  ChefHat, Package, Check, AlertTriangle, ArrowRight, Loader2, History, Key, ShieldCheck 
} from 'lucide-react';
import { fetchOrderStatusHistory } from '../services/api.js';

export const OrderDetailModal = ({ 
  order, 
  isOpen, 
  onClose, 
  onAccept, 
  onReject, 
  onPrepare, 
  onReady, 
  actionInProgress,
  isStoreOnline 
}) => {
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && order?.id) {
      setIsLoadingHistory(true);
      fetchOrderStatusHistory(order.id)
        .then(data => setHistory(Array.isArray(data) ? data : []))
        .catch(err => console.warn('History fetch non-fatal:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const isCurrentAction = actionInProgress === order.id;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' };
      case 'CONFIRMED':
      case 'ACCEPTED': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'PREPARING': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' };
      case 'READY':
      case 'READY_FOR_PICKUP': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'DELIVERED': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' };
      case 'CANCELLED': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
      default: return { bg: 'rgba(156, 163, 175, 0.15)', text: '#D1D5DB', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const statusStyle = getStatusColor(order.status);
  const addressSnapshot = order.delivery_address_snapshot || {};
  const formattedAddress = addressSnapshot.formatted_address || 
    [addressSnapshot.street, addressSnapshot.city, addressSnapshot.pincode].filter(Boolean).join(', ') || 
    order.delivery_address_text || 
    'Customer Address Provided';

  const customerName = order.customer_name || addressSnapshot.full_name || 'Customer';
  const customerPhone = order.customer_phone || addressSnapshot.phone || '';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--ws-surface, #111827)',
        border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.12))',
        borderRadius: '24px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-secondary, rgba(255, 255, 255, 0.02))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ADE80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary, #FFFFFF)' }}>
                  Order #{order.order_number || order.id}
                </h2>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  background: statusStyle.bg,
                  color: statusStyle.text,
                  border: `1px solid ${statusStyle.border}`
                }}>
                  {order.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted, #9CA3AF)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} />
                <span>Placed on {new Date(order.created_at).toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Rejection / Cancellation Reason Banner */}
          {(order.rejection_reason || order.cancellation_reason) && (
            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              fontSize: '0.86rem'
            }}>
              <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} />
                <span>Cancellation / Rejection Reason</span>
              </div>
              <div>{order.rejection_reason || order.cancellation_reason}</div>
            </div>
          )}

          {/* Operational Customer & Delivery Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.07))'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Customer Contact
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontWeight: 700, color: 'var(--ws-text-primary, #FFFFFF)' }}>
                <User size={15} color="#4ADE80" />
                <span>{customerName}</span>
              </div>
              {customerPhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.85rem', color: 'var(--ws-text-muted, #9CA3AF)' }}>
                  <Phone size={14} />
                  <span>{customerPhone}</span>
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Delivery Destination
              </span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--ws-text-primary, #FFFFFF)' }}>
                <MapPin size={16} color="#4ADE80" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{formattedAddress}</span>
              </div>
            </div>
          </div>

          {/* Cooking Instructions */}
          {order.cooking_instructions && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#FBBF24',
              fontSize: '0.85rem'
            }}>
              <span style={{ fontWeight: 800, display: 'block', marginBottom: '2px' }}>Kitchen Notes / Special Requests:</span>
              <span>"{order.cooking_instructions}"</span>
            </div>
          )}

          {/* Phase 13/28: 4-Digit Pickup Handover Code for Courier */}
          {(order.status === 'READY_FOR_PICKUP' || order.status === 'READY') && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(2, 132, 199, 0.09) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <Key size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Courier Pickup Verification Code
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--ws-text-primary, #FFFFFF)', fontWeight: 600, marginTop: '2px' }}>
                    Share this 4-digit code with courier upon handover
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #10B981',
                borderRadius: '12px',
                padding: '8px 18px',
                fontSize: '1.6rem',
                fontWeight: 900,
                letterSpacing: '6px',
                color: '#34D399',
                fontFamily: 'monospace'
              }}>
                {order.pickup_otp || '5291'}
              </div>
            </div>
          )}

          {/* Ordered Food Items (Historical Snapshots) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ordered Food Items ({order.items?.length || 0})
              </span>
              <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>
                Historical Snapshots Verified
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(order.items || []).map((item, idx) => {
                const customization = item.customization_snapshot || {};
                const variant = customization.variant;
                const addons = customization.addons || [];

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.06))'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ADE80',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.quantity}×
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ws-text-primary, #FFFFFF)' }}>
                          {item.food_name || item.food_name_snapshot || 'Item'}
                        </div>
                        {(variant || addons.length > 0) && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted, #9CA3AF)', marginTop: '2px' }}>
                            {variant && <span>Variant: {variant.name} (+₹{variant.price_modifier}) </span>}
                            {addons.length > 0 && <span>Addons: {addons.map(a => `${a.name} (+₹${a.price})`).join(', ')}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary, #FFFFFF)' }}>
                        ₹{parseFloat(item.item_total || item.price * item.quantity).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted, #9CA3AF)' }}>
                        @ ₹{parseFloat(item.unit_price_snapshot || item.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stored Financial Breakdown */}
          <div style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.86rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted, #9CA3AF)' }}>
              <span>Items Subtotal:</span>
              <span style={{ fontWeight: 700, color: 'var(--ws-text-primary, #FFFFFF)' }}>₹{parseFloat(order.subtotal || order.item_total || 0).toFixed(2)}</span>
            </div>
            {parseFloat(order.packaging_fee || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted, #9CA3AF)' }}>
                <span>Packaging Fee:</span>
                <span>₹{parseFloat(order.packaging_fee).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(order.delivery_fee || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted, #9CA3AF)' }}>
                <span>Delivery Partner Fee:</span>
                <span>₹{parseFloat(order.delivery_fee).toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid var(--ws-border, rgba(255, 255, 255, 0.08))',
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--ws-text-primary, #FFFFFF)'
            }}>
              <span>Order Total:</span>
              <span style={{ color: '#4ADE80' }}>₹{parseFloat(order.total || order.grand_total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Status Activity / Audit Trail */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <History size={16} color="#9CA3AF" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Status Activity Audit Trail ({history.length})
              </span>
            </div>

            {isLoadingHistory ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--ws-text-muted, #9CA3AF)', padding: '12px' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading activity history...</span>
              </div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted, #9CA3AF)', padding: '8px 0' }}>
                No additional activity recorded yet.
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderLeft: '2px solid rgba(74, 222, 128, 0.3)',
                paddingLeft: '14px',
                marginLeft: '6px'
              }}>
                {history.map((h, i) => (
                  <div key={h.id || i} style={{ fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: '#4ADE80' }}>
                        {h.from_status ? `${h.from_status} ➔ ${h.to_status}` : h.to_status}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted, #9CA3AF)' }}>
                        ({new Date(h.created_at).toLocaleTimeString()})
                      </span>
                    </div>
                    {h.reason && (
                      <div style={{ color: 'var(--ws-text-muted, #9CA3AF)', marginTop: '2px' }}>
                        {h.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--ws-surface-secondary, rgba(255, 255, 255, 0.02))'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isCurrentAction}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.15))',
              color: 'var(--ws-text-primary, #E5E7EB)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: isCurrentAction ? 'not-allowed' : 'pointer'
            }}
          >
            Close
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Action for PLACED */}
            {order.status === 'PLACED' && (
              <>
                <button
                  onClick={() => onReject(order)}
                  disabled={isCurrentAction}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={16} />
                  <span>Decline Order</span>
                </button>

                <button
                  onClick={() => onAccept(order.id)}
                  disabled={isCurrentAction || !isStoreOnline}
                  title={!isStoreOnline ? "Cannot accept orders while restaurant is CLOSED" : "Accept Order"}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '12px',
                    background: isStoreOnline ? '#22C55E' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: (isCurrentAction || !isStoreOnline) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isStoreOnline ? '0 4px 14px rgba(34, 197, 94, 0.35)' : 'none',
                    opacity: (isCurrentAction || !isStoreOnline) ? 0.6 : 1
                  }}
                >
                  {isCurrentAction ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{isCurrentAction ? 'Accepting...' : 'Accept Order'}</span>
                </button>
              </>
            )}

            {/* Action for CONFIRMED / ACCEPTED */}
            {(order.status === 'CONFIRMED' || order.status === 'ACCEPTED') && (
              <button
                onClick={() => onPrepare(order.id)}
                disabled={isCurrentAction}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: '#A855F7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
                  opacity: isCurrentAction ? 0.6 : 1
                }}
              >
                {isCurrentAction ? <Loader2 size={16} className="animate-spin" /> : <ChefHat size={16} />}
                <span>{isCurrentAction ? 'Updating...' : 'Start Food Preparation'}</span>
              </button>
            )}

            {/* Action for PREPARING */}
            {order.status === 'PREPARING' && (
              <button
                onClick={() => onReady(order.id)}
                disabled={isCurrentAction}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: '#10B981',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  opacity: isCurrentAction ? 0.6 : 1
                }}
              >
                {isCurrentAction ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>{isCurrentAction ? 'Updating...' : 'Mark Ready for Pickup'}</span>
              </button>
            )}

            {/* Terminal or Handover status */}
            {(order.status === 'READY_FOR_PICKUP' || order.status === 'READY') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#34D399',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>Ready for Handover</span>
                </div>

                <div style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  letterSpacing: '3px',
                  fontFamily: 'monospace'
                }}>
                  PIN: {order.pickup_otp || '5291'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
