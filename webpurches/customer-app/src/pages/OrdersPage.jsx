import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Clock, MapPin, Store, ChevronRight, X, AlertTriangle, 
  CheckCircle2, RefreshCw, XCircle, ArrowLeft, ArrowRight, ShieldCheck, Star, Headphones
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { FoodReviewModal } from '../components/FoodReviewModal.jsx';

export const OrdersPage = ({ onContinueShopping, onTrackOrder, onDisputeOrder }) => {
  const { 
    orders = [], 
    loadOrders, 
    isLoadingOrders, 
    cancelOrder, 
    setActiveOrder 
  } = useCustomer();

  const [filter, setFilter] = useState('all'); // all, active, completed, cancelled
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [reviewModalOrder, setReviewModalOrder] = useState(null);

  useEffect(() => {
    loadOrders(filter);
  }, [filter, loadOrders]);

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    try {
      await cancelOrder(cancelModalOrder.id);
      setCancelFeedback(`Order #${cancelModalOrder.order_number} has been cancelled successfully.`);
      setCancelModalOrder(null);
      await loadOrders(filter);
      setTimeout(() => setCancelFeedback(null), 4000);
    } catch (err) {
      setCancelFeedback(err.message || 'Failed to cancel order.');
      setTimeout(() => setCancelFeedback(null), 4000);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PLACED') {
      return { label: 'Placed (Awaiting Kitchen)', bg: 'rgba(59, 130, 246, 0.12)', text: '#2563EB', border: 'rgba(59, 130, 246, 0.3)' };
    }
    if (s === 'CONFIRMED' || s === 'ACCEPTED') {
      return { label: 'Confirmed by Kitchen', bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (s === 'PREPARING') {
      return { label: 'Kitchen Preparing', bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706', border: 'rgba(245, 158, 11, 0.3)' };
    }
    if (s === 'READY' || s === 'READY_FOR_PICKUP') {
      return { label: 'Ready for Pickup', bg: 'rgba(147, 51, 234, 0.12)', text: '#7C3AED', border: 'rgba(147, 51, 234, 0.3)' };
    }
    if (s === 'ON_THE_WAY' || s === 'PICKED_UP' || s === 'OUT_FOR_DELIVERY') {
      return { label: 'Out for Delivery', bg: 'rgba(2, 132, 199, 0.12)', text: '#0284C7', border: 'rgba(2, 132, 199, 0.3)' };
    }
    if (s === 'DELIVERED') {
      return { label: 'Delivered', bg: 'rgba(34, 197, 94, 0.15)', text: '#16A34A', border: 'rgba(34, 197, 94, 0.3)' };
    }
    if (s === 'CANCELLED') {
      return { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.12)', text: '#DC2626', border: 'rgba(239, 68, 68, 0.3)' };
    }
    return { label: s, bg: 'var(--ws-surface-subtle)', text: 'var(--ws-text-muted)', border: 'var(--ws-border)' };
  };

  const getPaymentBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID' || s === 'VERIFIED_PAID' || s === 'COMPLETED') {
      return { label: '✓ Paid Online', bg: 'rgba(34, 197, 94, 0.15)', text: '#16A34A', border: 'rgba(34, 197, 94, 0.3)' };
    }
    if (s === 'PAYMENT_PENDING' || s === 'PENDING') {
      return { label: '⏳ Payment Pending', bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', border: 'rgba(245, 158, 11, 0.3)' };
    }
    if (s === 'FAILED') {
      return { label: '✕ Failed', bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (s === 'REFUNDED') {
      return { label: '↩ Refunded', bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB', border: 'rgba(59, 130, 246, 0.3)' };
    }
    return { label: s || 'Pending', bg: 'var(--ws-surface-subtle)', text: 'var(--ws-text-muted)', border: 'var(--ws-border)' };
  };

  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <button
            onClick={onContinueShopping}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ws-text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '6px'
            }}
          >
            <ArrowLeft size={16} /> Explore Kitchens
          </button>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
            My Orders
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', marginTop: '2px' }}>
            View your active deliveries, past meals, and real-time status in PostgreSQL
          </div>
        </div>

        <button
          onClick={() => loadOrders(filter)}
          disabled={isLoadingOrders}
          style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--ws-text-primary)',
            cursor: isLoadingOrders ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}
        >
          <RefreshCw size={15} className={isLoadingOrders ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Cancellation Feedback Toast */}
      {cancelFeedback && (
        <div style={{
          background: '#064E3B',
          color: '#ECFDF5',
          border: '1.5px solid #34D399',
          borderRadius: '14px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--ws-border)',
        paddingBottom: '10px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'active', label: 'Active Kitchen Runs' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                background: isActive ? '#22C55E' : 'var(--ws-surface)',
                color: isActive ? '#FFFFFF' : 'var(--ws-text-secondary)',
                border: '1px solid',
                borderColor: isActive ? '#22C55E' : 'var(--ws-border)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {isLoadingOrders && safeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ws-text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading your orders from PostgreSQL...</div>
        </div>
      ) : safeOrders.length === 0 ? (
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '24px',
          padding: '48px 24px',
          textAlign: 'center',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShoppingBag size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 6px 0' }}>
            No Orders Found
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', margin: '0 0 20px 0' }}>
            {filter === 'all' 
              ? "You haven't placed any orders yet. Discover top-rated kitchens in your area!" 
              : `No orders matching filter '${filter}'.`}
          </p>
          <button
            onClick={onContinueShopping}
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
            }}
          >
            Order Delicious Food
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {safeOrders.map(order => {
            const statusBadge = getStatusBadge(order.status || order.order_status);
            const addressSnapshot = order.delivery_address_snapshot || {};
            const items = Array.isArray(order.items) ? order.items : [];
            const formattedDate = order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recent';

            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--ws-surface)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '20px',
                  padding: '22px',
                  boxShadow: 'var(--ws-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Header: Order Number, Date, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ws-text-primary)', overflowWrap: 'anywhere' }}>
                        {order.order_number}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: statusBadge.bg,
                        color: statusBadge.text,
                        border: `1px solid ${statusBadge.border}`
                      }}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Placed on {formattedDate}</span>
                      <span>•</span>
                      <span>Method: <strong style={{ color: 'var(--ws-text-primary)' }}>{order.payment_method || 'UPI'}</strong></span>
                      {(() => {
                        const payBadge = getPaymentBadge(order.payment_status);
                        return (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: payBadge.bg,
                            color: payBadge.text,
                            border: `1px solid ${payBadge.border}`
                          }}>
                            {payBadge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      TOTAL BILL
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                      ₹{Number(order.total || order.grand_total || 0).toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--ws-surface-subtle)', borderRadius: '12px' }}>
                  <Store size={18} color="#FF5A1F" />
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                    {order.restaurant_name || 'Kitchen Partner'}
                  </div>
                  {order.restaurant_address && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                      • {order.restaurant_address}
                    </span>
                  )}
                </div>

                {/* Ordered Items List Snapshot */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((item, i) => (
                    <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.dietary_type === 'NON_VEG' ? '#DC2626' : '#16A34A'
                        }} />
                        <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                          {item.food_name || item.food_name_snapshot}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                          × {item.quantity}
                        </span>
                        {item.customization_snapshot?.variant && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--ws-surface-subtle)', padding: '2px 6px', borderRadius: '4px', color: 'var(--ws-text-secondary)' }}>
                            {item.customization_snapshot.variant.name}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                        ₹{Number(item.item_total || (item.unit_price_snapshot * item.quantity) || 0).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery Address Snapshot */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem', color: 'var(--ws-text-secondary)', borderTop: '1px solid var(--ws-border)', paddingTop: '10px' }}>
                  <MapPin size={15} color="#22C55E" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ overflowWrap: 'anywhere', minWidth: 0 }}>
                    <strong style={{ color: 'var(--ws-text-primary)' }}>Delivered to: </strong>
                    {addressSnapshot.formatted_address || 
                     [addressSnapshot.street, addressSnapshot.city, addressSnapshot.pincode].filter(Boolean).join(', ') ||
                     order.delivery_address_text || 'Customer Delivery Address'}
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Eligible Order Cancellation */}
                    {order.status === 'PLACED' && (
                      <button
                        onClick={() => setCancelModalOrder(order)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '10px',
                          padding: '7px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <XCircle size={15} />
                        <span>Cancel Order</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedOrderDetail(order)}
                      style={{
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '10px',
                        padding: '7px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--ws-text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      View Full Receipt
                    </button>

                    <button
                      onClick={() => onDisputeOrder && onDisputeOrder(order.order_number)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '10px',
                        padding: '7px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Headphones size={13} />
                      <span>Need Help / Dispute</span>
                    </button>
                  </div>

                  {/* Active Tracker Button */}
                  {['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'ARRIVING'].includes(order.status) && (
                    <button
                      onClick={() => {
                        setActiveOrder(order);
                        if (onTrackOrder) onTrackOrder(order);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 3px 10px rgba(34, 197, 94, 0.25)'
                      }}
                    >
                      <span>Track Live Dispatch</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {/* Phase 18: Rate & Review Button for Delivered Orders */}
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => setReviewModalOrder(order)}
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 3px 10px rgba(245, 158, 11, 0.25)'
                      }}
                    >
                      <Star size={14} fill="#FFFFFF" />
                      <span>Rate & Review</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {cancelModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--ws-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={30} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 6px 0', overflowWrap: 'anywhere' }}>
                Cancel Order #{cancelModalOrder.order_number}?
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Your order is currently in <strong>PLACED</strong> status and has not yet been prepared by the kitchen. 
                Are you sure you want to cancel this order?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                onClick={() => setCancelModalOrder(null)}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: 'var(--ws-text-primary)',
                  cursor: isCancelling ? 'not-allowed' : 'pointer'
                }}
              >
                Keep Order
              </button>

              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL RECEIPT / ORDER DETAIL MODAL */}
      {selectedOrderDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--ws-shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  RECEIPT BREAKDOWN
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0, overflowWrap: 'anywhere' }}>
                  Order #{selectedOrderDetail.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Restaurant & Date */}
            <div style={{ background: 'var(--ws-surface-subtle)', borderRadius: '14px', padding: '14px', border: '1px solid var(--ws-border)' }}>
              <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.95rem' }}>
                {selectedOrderDetail.restaurant_name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                {selectedOrderDetail.restaurant_address || 'Partner Restaurant'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', marginTop: '6px' }}>
                Status: <strong>{selectedOrderDetail.status}</strong> • OTP: <strong>{selectedOrderDetail.otp || '8492'}</strong>
              </div>
            </div>

            {/* Items with customizations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
                ORDERED DISHES
              </span>
              {(selectedOrderDetail.items || []).map((item, idx) => (
                <div key={idx} style={{ padding: '8px 0', borderBottom: '1px dashed var(--ws-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                      {item.food_name || item.food_name_snapshot} × {item.quantity}
                    </div>
                    {item.customization_snapshot?.variant && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)' }}>
                        Portion: {item.customization_snapshot.variant.name} (+₹{item.customization_snapshot.variant.price_modifier})
                      </div>
                    )}
                    {item.customization_snapshot?.addons?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)' }}>
                        Addons: {item.customization_snapshot.addons.map(a => `${a.name} (₹${a.price})`).join(', ')}
                      </div>
                    )}
                    {item.customization_snapshot?.special_instructions && (
                      <div style={{ fontSize: '0.75rem', color: '#16A34A', fontStyle: 'italic' }}>
                        Note: "{item.customization_snapshot.special_instructions}"
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.9rem' }}>
                    ₹{Number(item.item_total || 0).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--ws-border)', paddingTop: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{Number(selectedOrderDetail.subtotal || selectedOrderDetail.item_total || 0).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-secondary)' }}>
                <span>Delivery Fee</span>
                <span>₹{Number(selectedOrderDetail.delivery_fee || 30).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-secondary)' }}>
                <span>Packaging Fee</span>
                <span>₹{Number(selectedOrderDetail.packaging_fee || selectedOrderDetail.platform_fee || 15).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem', color: 'var(--ws-text-primary)', borderTop: '1px solid var(--ws-border)', paddingTop: '8px' }}>
                <span>Total Paid</span>
                <span>₹{Number(selectedOrderDetail.total || selectedOrderDetail.grand_total || 0).toFixed(0)}</span>
              </div>
            </div>

            {/* Delivery Snapshot */}
            <div style={{ background: 'var(--ws-surface-subtle)', borderRadius: '12px', padding: '12px', fontSize: '0.78rem', color: 'var(--ws-text-secondary)', overflowWrap: 'anywhere' }}>
              <strong style={{ color: 'var(--ws-text-primary)', display: 'block', marginBottom: '2px' }}>
                Delivery Address Snapshot:
              </strong>
              {selectedOrderDetail.delivery_address_snapshot?.formatted_address || 
               [selectedOrderDetail.delivery_address_snapshot?.street, selectedOrderDetail.delivery_address_snapshot?.city].filter(Boolean).join(', ') ||
               selectedOrderDetail.delivery_address_text}
            </div>

            {/* Payment Verification Status */}
            <div style={{
              background: 'var(--ws-surface-subtle)',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid var(--ws-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem'
            }}>
              <div>
                <strong style={{ color: 'var(--ws-text-primary)', display: 'block' }}>Payment Details:</strong>
                <span style={{ color: 'var(--ws-text-secondary)' }}>{selectedOrderDetail.payment_method || 'UPI (Instant)'}</span>
              </div>
              <div>
                {(() => {
                  const payBadge = getPaymentBadge(selectedOrderDetail.payment_status);
                  return (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: payBadge.bg,
                      color: payBadge.text,
                      border: `1px solid ${payBadge.border}`
                    }}>
                      {payBadge.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Phase 18: Verified Review Modal */}
      <FoodReviewModal
        isOpen={!!reviewModalOrder}
        onClose={() => {
          setReviewModalOrder(null);
          loadOrders(filter);
        }}
        orderId={reviewModalOrder?.id}
        orderNumber={reviewModalOrder?.order_number}
        restaurantName={reviewModalOrder?.restaurant?.name}
      />
    </div>
  );
};
