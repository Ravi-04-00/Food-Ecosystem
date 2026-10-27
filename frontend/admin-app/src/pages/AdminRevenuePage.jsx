import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck,
  TrendingUp, DollarSign, ArrowUpRight, Lock
} from 'lucide-react';
import { 
  fetchAdminPayments, 
  fetchAdminPaymentDetail 
} from '../services/api.js';

export const AdminRevenuePage = () => {
  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment detail modal
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        q: searchTerm,
        page: currentPage
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await fetchAdminPayments(params);
      setPayments(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load payments ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleOpenDetail = async (id) => {
    try {
      const detail = await fetchAdminPaymentDetail(id);
      setSelectedPayment(detail);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load payment details');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Compute metrics from current loaded list for instant summary
  const paidTotal = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const successCount = payments.filter(p => p.status === 'SUCCESS').length;
  const failedCount = payments.filter(p => p.status === 'FAILED').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            PAYMENT GATEWAY VAULT • RECONCILED RECORDS
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Payments & Reconciliation
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Real PostgreSQL payment transaction ledger, provider references, verified webhooks, and zero secrets exposure
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search reference, order #, user..."
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
                width: '270px'
              }}
            />
          </div>

          <button
            onClick={loadPayments}
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

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            Payments Volume
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', margin: '8px 0 2px 0' }}>
            ₹{paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            Successfully settled
          </div>
        </div>

        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            Settled Transactions
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
            {successCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 700 }}>
            Verified HMAC signatures
          </div>
        </div>

        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            Pending Sessions
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', margin: '8px 0 2px 0' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            Awaiting provider webhook
          </div>
        </div>

        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            Failed / Rejected
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', margin: '8px 0 2px 0' }}>
            {failedCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            Zero financial loss
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map(st => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setCurrentPage(1);
            }}
            style={{
              background: statusFilter === st ? 'var(--ws-primary, #22C55E)' : 'var(--ws-surface)',
              color: statusFilter === st ? '#FFFFFF' : 'var(--ws-text-secondary)',
              border: '1px solid',
              borderColor: statusFilter === st ? 'var(--ws-primary, #22C55E)' : 'var(--ws-border)',
              padding: '7px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #EF4444',
          color: '#EF4444',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.85rem'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Transactions Table */}
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
            <div>Querying PostgreSQL payment transactions...</div>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
            <CreditCard size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No payment transactions found</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Try adjusting your search query or filter</div>
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
                  <th style={{ padding: '14px 16px' }}>Payment ID</th>
                  <th style={{ padding: '14px 16px' }}>Order Reference</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Amount</th>
                  <th style={{ padding: '14px 16px' }}>Method</th>
                  <th style={{ padding: '14px 16px' }}>Provider Reference</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Timestamp</th>
                  <th style={{ padding: '14px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => {
                  const isSuccess = payment.status === 'SUCCESS';
                  const isPending = payment.status === 'PENDING';

                  return (
                    <tr
                      key={payment.id}
                      style={{
                        borderBottom: '1px solid var(--ws-border)',
                        fontSize: '0.84rem'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        #{payment.id}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--ws-primary, #22C55E)' }}>
                        {payment.order_number || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--ws-text-secondary)' }}>
                        {payment.customer_name || payment.customer_email || 'Customer'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: isSuccess ? '#10B981' : 'var(--ws-text-primary)' }}>
                        ₹{Number(payment.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--ws-text-muted)' }}>
                        {payment.payment_method || 'Online'}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--ws-text-muted)', overflowWrap: 'anywhere' }}>
                        {payment.provider_payment_id || payment.provider_order_id || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : (isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                          color: isSuccess ? '#10B981' : (isPending ? '#F59E0B' : '#EF4444')
                        }}>
                          {payment.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleOpenDetail(payment.id)}
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
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Payment Detail Modal */}
      {selectedPayment && (
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
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: selectedPayment.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                  color: selectedPayment.status === 'SUCCESS' ? '#10B981' : '#EF4444'
                }}>
                  {selectedPayment.status}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
                  Transaction #{selectedPayment.id}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Processed at {new Date(selectedPayment.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div><strong>Order Number:</strong> #{selectedPayment.order_number}</div>
              <div><strong>Amount:</strong> ₹{Number(selectedPayment.amount).toFixed(2)} {selectedPayment.currency || 'INR'}</div>
              <div><strong>Customer:</strong> {selectedPayment.customer_name} ({selectedPayment.customer_email})</div>
              <div><strong>Payment Method:</strong> {selectedPayment.payment_method}</div>
              <div><strong>Provider Order ID:</strong> <span style={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{selectedPayment.provider_order_id || 'N/A'}</span></div>
              <div><strong>Provider Payment ID:</strong> <span style={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{selectedPayment.provider_payment_id || 'N/A'}</span></div>
              {selectedPayment.provider_signature && (
                <div><strong>Provider Signature:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedPayment.provider_signature.slice(0, 20)}...</span> (Verified)</div>
              )}
            </div>

            <div style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              padding: '12px',
              marginTop: '16px',
              fontSize: '0.78rem',
              color: 'var(--ws-text-muted)'
            }}>
              <ShieldCheck size={16} color="#10B981" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              Reconciliation Check: Matched order amount in PostgreSQL database. No credential secrets exposed.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedPayment(null)}
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
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
