import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Eye, AlertTriangle, CheckCircle2, Clock, MapPin, User, Store,
  Bike, DollarSign, ShieldAlert, ArrowRight, FileText
} from 'lucide-react';
import { 
  fetchAdminOrders, 
  fetchAdminOrderDetail, 
  interveneOrderStatus 
} from '../services/api.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { getRealtimeClient } from '../utils/realtime.js';

export const OrdersOverviewPage = () => {
  const { inspectedOrder: contextInspectedOrder, setInspectedOrder: setContextInspectedOrder } = useAdmin();

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Inspector & Intervention Modals
  const [activeOrderDetail, setActiveOrderDetail] = useState(null);
  const [interventionModal, setInterventionModal] = useState({
    isOpen: false,
    order: null,
    toStatus: 'CANCELLED_ADMIN',
    reason: '',
    error: '',
    loading: false
  });

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        q: searchTerm,
        page: currentPage
      };
      if (orderStatusFilter !== 'ALL') params.status = orderStatusFilter;
      if (paymentStatusFilter !== 'ALL') params.payment_status = paymentStatusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await fetchAdminOrders(params);
      setOrders(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load orders feed.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, orderStatusFilter, paymentStatusFilter, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Phase 28: Real-Time Order Stream & Reconnect Recovery for Admin Feed
  useEffect(() => {
    const client = getRealtimeClient('ADMIN');

    const unsubCreated = client.subscribe('order.created', (payload) => {
      const newOrder = payload.data || payload;
      if (!newOrder.id && !newOrder.order_id) return;

      const orderObj = {
        id: newOrder.id || newOrder.order_id,
        order_number: newOrder.order_number,
        status: newOrder.status || 'PLACED',
        customer_name: newOrder.customer_name || 'Customer',
        restaurant_name: newOrder.restaurant_name || 'Restaurant',
        grand_total: newOrder.grand_total || newOrder.total || 0,
        total: newOrder.grand_total || newOrder.total || 0,
        created_at: newOrder.created_at || new Date().toISOString(),
        payment_status: newOrder.payment_status || 'PAYMENT_PENDING',
        ...newOrder
      };

      setOrders(prev => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some(o => String(o.id) === String(orderObj.id))) {
          return list;
        }
        return [orderObj, ...list.slice(0, 14)];
      });
      setTotalCount(prev => prev + 1);
    });

    const unsubUpdated = client.subscribe('order.updated', (payload) => {
      const orderId = payload.entity_id || payload.order_id || payload.data?.order_id;
      const nextStatus = payload.data?.status || payload.status;
      if (!orderId) return;

      setOrders(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(o => {
          if (String(o.id) === String(orderId)) {
            return {
              ...o,
              status: nextStatus || o.status,
              ...(payload.data || {})
            };
          }
          return o;
        });
      });
    });

    // Reconcile feed on reconnect
    const unsubReconcile = client.registerReconciliation(() => {
      loadOrders();
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubReconcile();
    };
  }, [loadOrders]);

  const handleOpenDetail = useCallback(async (id) => {
    try {
      const detail = await fetchAdminOrderDetail(id);
      setActiveOrderDetail(detail);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load order details');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  }, []);

  // Open inspector if contextInspectedOrder was set
  useEffect(() => {
    if (contextInspectedOrder && contextInspectedOrder.id) {
      handleOpenDetail(contextInspectedOrder.id);
    }
  }, [contextInspectedOrder, handleOpenDetail]);

  const handleOpenInterventionModal = (order) => {
    setInterventionModal({
      isOpen: true,
      order,
      toStatus: order.status === 'DELIVERED' ? 'CANCELLED_ADMIN' : 'DELIVERED',
      reason: 'Administrative override following customer and kitchen inquiry.',
      error: '',
      loading: false
    });
  };

  const handleConfirmIntervention = async () => {
    if (!interventionModal.reason.trim() || interventionModal.reason.trim().length < 3) {
      setInterventionModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is required.' }));
      return;
    }
    setInterventionModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await interveneOrderStatus(interventionModal.order.id, interventionModal.toStatus, interventionModal.reason);
      setInterventionModal({ isOpen: false, order: null, toStatus: 'CANCELLED_ADMIN', reason: '', error: '', loading: false });
      if (activeOrderDetail && activeOrderDetail.id === interventionModal.order.id) {
        handleOpenDetail(interventionModal.order.id);
      }
      loadOrders();
    } catch (err) {
      setInterventionModal(prev => ({ ...prev, loading: false, error: err.message || 'Intervention failed.' }));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const orderStatuses = [
    'ALL', 'NEW', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  ];

  const paymentStatuses = [
    'ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            TRANSACTION AUDIT STREAM • SEPARATE ORDER & PAYMENT STATES
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 0 0' }}>
            Ecosystem Orders Feed
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Real-time PostgreSQL orders ledger, itemized breakdown, status history timeline, and controlled overrides
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by order #, customer, kitchen..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '9px 14px 9px 36px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '280px'
              }}
            />
          </div>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '9px 12px',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Order Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', minWidth: '90px' }}>
            Order State:
          </span>
          {orderStatuses.map(st => (
            <button
              key={st}
              onClick={() => {
                setOrderStatusFilter(st);
                setCurrentPage(1);
              }}
              style={{
                background: orderStatusFilter === st ? 'var(--ws-primary, #22C55E)' : 'var(--ws-surface-subtle)',
                color: orderStatusFilter === st ? '#FFFFFF' : 'var(--ws-text-secondary)',
                border: '1px solid',
                borderColor: orderStatusFilter === st ? 'var(--ws-primary, #22C55E)' : 'var(--ws-border)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Payment Status & Date Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', minWidth: '90px' }}>
              Payment State:
            </span>
            {paymentStatuses.map(pst => (
              <button
                key={pst}
                onClick={() => {
                  setPaymentStatusFilter(pst);
                  setCurrentPage(1);
                }}
                style={{
                  background: paymentStatusFilter === pst ? '#8B5CF6' : 'var(--ws-surface-subtle)',
                  color: paymentStatusFilter === pst ? '#FFFFFF' : 'var(--ws-text-secondary)',
                  border: '1px solid',
                  borderColor: paymentStatusFilter === pst ? '#8B5CF6' : 'var(--ws-border)',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: 'pointer'
                }}
              >
                {pst}
              </button>
            ))}
          </div>

          {/* Date range inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>Dates:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            />
            <span style={{ color: 'var(--ws-text-muted)' }}>-</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setCurrentPage(1);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Loading PostgreSQL orders stream...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
            <ShoppingBag size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No orders match this query</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Try clearing filters or search terms</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{
                  background: 'var(--ws-surface-subtle)',
                  borderBottom: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '14px 16px' }}>Order Number</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Restaurant</th>
                  <th style={{ padding: '14px 16px' }}>Courier Partner</th>
                  <th style={{ padding: '14px 16px' }}>Total Amount</th>
                  <th style={{ padding: '14px 16px' }}>Order State</th>
                  <th style={{ padding: '14px 16px' }}>Payment State</th>
                  <th style={{ padding: '14px 16px' }}>Created</th>
                  <th style={{ padding: '14px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--ws-border)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-secondary)' }}>
                      {order.customer_name || 'Customer'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-secondary)' }}>
                      {order.restaurant_name}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-muted)' }}>
                      {order.rider_name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#10B981' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: '#10B981'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: order.payment_status === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: order.payment_status === 'PAID' ? '#10B981' : '#F59E0B'
                      }}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenDetail(order.id)}
                          style={{
                            background: 'var(--ws-surface-subtle)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            color: 'var(--ws-text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => handleOpenInterventionModal(order)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}
                        >
                          Override
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--ws-text-primary)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--ws-text-primary)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Order Detail Inspector Modal */}
      {activeOrderDetail && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(34, 197, 94, 0.14)',
                    color: '#10B981'
                  }}>
                    ORDER: {activeOrderDetail.status}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: activeOrderDetail.payment_status === 'PAID' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                    color: activeOrderDetail.payment_status === 'PAID' ? '#10B981' : '#F59E0B'
                  }}>
                    PAYMENT: {activeOrderDetail.payment_status}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 2px 0', overflowWrap: 'anywhere' }}>
                  Order #{activeOrderDetail.order_number}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Placed on {new Date(activeOrderDetail.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveOrderDetail(null);
                  setContextInspectedOrder(null);
                }}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--ws-text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Participants Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '0.8rem'
            }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--ws-text-muted)', fontSize: '0.72rem' }}>CUSTOMER</div>
                <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
                  {activeOrderDetail.customer_name || 'Customer'}
                </div>
                <div style={{ color: 'var(--ws-text-muted)', fontSize: '0.74rem' }}>{activeOrderDetail.customer_email}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--ws-text-muted)', fontSize: '0.72rem' }}>RESTAURANT</div>
                <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
                  {activeOrderDetail.restaurant_name}
                </div>
                <div style={{ color: 'var(--ws-text-muted)', fontSize: '0.74rem' }}>{activeOrderDetail.restaurant_phone || 'Verified Kitchen'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--ws-text-muted)', fontSize: '0.72rem' }}>DELIVERY PARTNER</div>
                <div style={{ fontWeight: 800, color: activeOrderDetail.rider_name ? '#10B981' : 'var(--ws-text-muted)', marginTop: '2px' }}>
                  {activeOrderDetail.rider_name || 'Awaiting dispatch'}
                </div>
                <div style={{ color: 'var(--ws-text-muted)', fontSize: '0.74rem' }}>{activeOrderDetail.rider_phone || 'No rider assigned'}</div>
              </div>
            </div>

            {/* Address Snapshot */}
            <div style={{ marginBottom: '20px', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--ws-text-muted)', fontSize: '0.74rem', marginBottom: '4px' }}>
                DELIVERY DESTINATION
              </div>
              <div style={{ color: 'var(--ws-text-primary)', overflowWrap: 'anywhere' }}>
                {activeOrderDetail.delivery_address_snapshot || 'Standard Address'}
              </div>
              {activeOrderDetail.delivery_instructions && (
                <div style={{ color: 'var(--ws-text-muted)', fontSize: '0.76rem', marginTop: '2px' }}>
                  Instructions: {activeOrderDetail.delivery_instructions}
                </div>
              )}
            </div>

            {/* Order Items Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: 'var(--ws-text-muted)', fontSize: '0.74rem', marginBottom: '8px' }}>
                ORDER ITEMS BREAKDOWN
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(activeOrderDetail.items || []).map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        {item.quantity}x {item.food_name}
                      </div>
                      {item.customization_details && Object.keys(item.customization_details).length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                          {JSON.stringify(item.customization_details)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                      ₹{Number(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)' }}>
                <span>Subtotal Items:</span>
                <span>₹{Number(activeOrderDetail.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)' }}>
                <span>Delivery Fee:</span>
                <span>₹{Number(activeOrderDetail.delivery_fee || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)' }}>
                <span>Platform Fee:</span>
                <span>₹{Number(activeOrderDetail.platform_fee || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)' }}>
                <span>GST Tax:</span>
                <span>₹{Number(activeOrderDetail.tax || 0).toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 900,
                fontSize: '1rem',
                color: 'var(--ws-text-primary)',
                borderTop: '1px solid var(--ws-border)',
                paddingTop: '6px',
                marginTop: '4px'
              }}>
                <span>Grand Total:</span>
                <span style={{ color: '#10B981' }}>₹{Number(activeOrderDetail.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Order Status History Timeline */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 800, color: 'var(--ws-text-muted)', fontSize: '0.74rem', marginBottom: '8px' }}>
                IMMUTABLE STATUS HISTORY TIMELINE
              </div>
              {(!activeOrderDetail.status_history || activeOrderDetail.status_history.length === 0) ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>No historical transitions recorded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeOrderDetail.status_history.map(hist => (
                    <div
                      key={hist.id}
                      style={{
                        borderLeft: '2px solid #10B981',
                        paddingLeft: '12px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        {hist.from_status} → {hist.to_status}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                        By {hist.actor_username || 'System'} • {new Date(hist.timestamp).toLocaleString()}
                      </div>
                      {hist.reason && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)', marginTop: '2px' }}>
                          Reason: {hist.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setActiveOrderDetail(null);
                  setContextInspectedOrder(null);
                }}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Inspector
              </button>
              <button
                onClick={() => handleOpenInterventionModal(activeOrderDetail)}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Administrative Status Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Status Intervention Modal */}
      {interventionModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
              Administrative Status Intervention
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Order: <strong>#{interventionModal.order?.order_number}</strong> (Current: {interventionModal.order?.status})
            </p>

            {interventionModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '12px'
              }}>
                {interventionModal.error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Select Override Status:
            </label>
            <select
              value={interventionModal.toStatus}
              onChange={e => setInterventionModal(prev => ({ ...prev, toStatus: e.target.value }))}
              style={{
                width: '100%',
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.84rem',
                outline: 'none',
                marginBottom: '14px'
              }}
            >
              <option value="NEW">NEW</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PREPARING">PREPARING</option>
              <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED (Administrative Cancellation)</option>
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Mandatory Justification Reason:
            </label>
            <textarea
              value={interventionModal.reason}
              onChange={e => setInterventionModal(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="State clear operational reason for manual status override..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setInterventionModal({ isOpen: false, order: null, toStatus: 'CANCELLED_ADMIN', reason: '', error: '', loading: false })}
                disabled={interventionModal.loading}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIntervention}
                disabled={interventionModal.loading}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {interventionModal.loading ? 'Updating...' : 'Commit Status Override'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
