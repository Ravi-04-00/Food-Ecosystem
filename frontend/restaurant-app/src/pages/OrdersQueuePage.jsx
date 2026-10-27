import React, { useState } from 'react';
import { useShop } from '../context/ShopContext.jsx';
import { 
  ArrowRight, Check, Clock, User, Phone, CheckCircle2, ChevronRight, 
  ChefHat, Package, Eye, Loader2, AlertCircle, X, Power 
} from 'lucide-react';
import { OrderDetailModal } from '../components/OrderDetailModal.jsx';
import { OrderRejectionModal } from '../components/OrderRejectionModal.jsx';

export const OrdersQueuePage = () => {
  const { 
    orders = [], 
    loadOrders,
    handleAcceptOrder, 
    handleRejectOrder, 
    handlePrepareOrder, 
    handleReadyOrder, 
    actionInProgress,
    isLoadingOrders,
    isStoreOnline 
  } = useShop();

  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const stages = [
    { key: 'PLACED', label: 'NEW ORDERS', color: '#3B82F6', badgeBg: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' },
    { key: 'CONFIRMED', label: 'ACCEPTED', color: '#F59E0B', badgeBg: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
    { key: 'PREPARING', label: 'PREPARING', color: '#A855F7', badgeBg: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)' },
    { key: 'READY_FOR_PICKUP', label: 'READY FOR PICKUP', color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
    { key: 'DELIVERED', label: 'COMPLETED', color: '#64748B', badgeBg: 'rgba(100, 116, 139, 0.15)', borderColor: 'rgba(100, 116, 139, 0.3)' }
  ];

  const handleConfirmReject = async (orderId, reason, explanation) => {
    setIsRejecting(true);
    try {
      await handleRejectOrder(orderId, reason, explanation);
      setRejectingOrder(null);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            KITCHEN KANBAN PIPELINE
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Live Orders Pipeline Board
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
            Real-time PostgreSQL lifecycle: PLACED ➔ CONFIRMED ➔ PREPARING ➔ READY FOR PICKUP
          </div>
        </div>

        <button
          onClick={() => loadOrders()}
          disabled={isLoadingOrders}
          style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            color: 'var(--ws-text-primary)',
            borderRadius: '12px',
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: isLoadingOrders ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isLoadingOrders ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
          <span>Refresh Queue ({orders.length})</span>
        </button>
      </div>

      {/* Closed Kitchen Warning */}
      {!isStoreOnline && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '14px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Power size={18} />
          <span>Restaurant is CLOSED. You cannot accept new PLACED orders until reopened.</span>
        </div>
      )}

      {/* 5-Column Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {stages.map(stage => {
          const stageOrders = orders.filter(o => {
            if (stage.key === 'CONFIRMED') return o.status === 'CONFIRMED' || o.status === 'ACCEPTED';
            if (stage.key === 'READY_FOR_PICKUP') return o.status === 'READY_FOR_PICKUP' || o.status === 'READY';
            return o.status === stage.key;
          });

          return (
            <div
              key={stage.key}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '380px',
                boxShadow: 'var(--ws-shadow-sm)'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: `2px solid ${stage.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: stage.color, letterSpacing: '0.5px' }}>
                    {stage.label}
                  </span>
                </div>
                <span style={{
                  background: stage.badgeBg,
                  color: stage.color,
                  border: `1px solid ${stage.borderColor}`,
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 900
                }}>
                  {stageOrders.length}
                </span>
              </div>

              {/* Column Cards */}
              {stageOrders.length === 0 ? (
                <div style={{
                  padding: '40px 12px',
                  textAlign: 'center',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 500
                }}>
                  No orders in this stage
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stageOrders.map(order => {
                    const isCurrentAction = actionInProgress === order.id;
                    const items = order.items || [];
                    const itemCount = order.item_count || items.reduce((acc, it) => acc + (it.quantity || 1), 0);

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: 'var(--ws-surface-subtle)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Top: Order # & Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: stage.color }}>
                            #{order.order_number?.slice(-6) || order.id}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Customer & Items */}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ws-text-primary)' }}>
                            {items.length > 0 ? (
                              <span>{items.map(it => `${it.quantity}x ${it.food_name || it.food_name_snapshot || 'Item'}`).join(', ')}</span>
                            ) : (
                              <span>{itemCount} item(s)</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                            Customer: {order.customer_name || 'Customer'}
                          </div>
                        </div>

                        {/* Bottom Total & Actions */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--ws-border)'
                        }}>
                          <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--ws-text-primary)' }}>
                            ₹{parseFloat(order.subtotal || order.total || 0).toFixed(2)}
                          </span>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedOrderDetail(order)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--ws-border)',
                                color: 'var(--ws-text-muted)',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Details"
                            >
                              <Eye size={12} />
                            </button>

                            {/* PLACED Actions */}
                            {order.status === 'PLACED' && (
                              <>
                                <button
                                  onClick={() => setRejectingOrder(order)}
                                  disabled={isCurrentAction}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#EF4444',
                                    borderRadius: '8px',
                                    padding: '4px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: isCurrentAction ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleAcceptOrder(order.id)}
                                  disabled={isCurrentAction || !isStoreOnline}
                                  style={{
                                    background: isStoreOnline ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    borderRadius: '8px',
                                    padding: '4px 10px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    cursor: (isCurrentAction || !isStoreOnline) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {isCurrentAction ? '...' : 'Accept'}
                                </button>
                              </>
                            )}

                            {/* CONFIRMED Actions */}
                            {(order.status === 'CONFIRMED' || order.status === 'ACCEPTED') && (
                              <button
                                onClick={() => handlePrepareOrder(order.id)}
                                disabled={isCurrentAction}
                                style={{
                                  background: '#A855F7',
                                  border: 'none',
                                  color: '#FFFFFF',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {isCurrentAction ? '...' : <ChefHat size={12} />}
                                <span>Prep</span>
                              </button>
                            )}

                            {/* PREPARING Actions */}
                            {order.status === 'PREPARING' && (
                              <button
                                onClick={() => handleReadyOrder(order.id)}
                                disabled={isCurrentAction}
                                style={{
                                  background: '#10B981',
                                  border: 'none',
                                  color: '#FFFFFF',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: isCurrentAction ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {isCurrentAction ? '...' : <CheckCircle2 size={12} />}
                                <span>Ready</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <OrderRejectionModal
        order={rejectingOrder}
        isOpen={!!rejectingOrder}
        onClose={() => setRejectingOrder(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isRejecting}
      />

      <OrderDetailModal
        order={selectedOrderDetail}
        isOpen={!!selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
        onAccept={handleAcceptOrder}
        onReject={(order) => setRejectingOrder(order)}
        onPrepare={handlePrepareOrder}
        onReady={handleReadyOrder}
        actionInProgress={actionInProgress}
        isStoreOnline={isStoreOnline}
      />

    </div>
  );
};
