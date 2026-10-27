import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, ShieldAlert, CheckCircle2, XCircle, 
  Eye, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  Phone, Mail, Calendar, MapPin, ShoppingBag, DollarSign
} from 'lucide-react';
import { 
  fetchAdminCustomers, 
  fetchAdminCustomerDetail, 
  toggleCustomerStatus 
} from '../services/api.js';
import { useAdmin } from '../context/AdminContext.jsx';

export const CustomerManagerPage = () => {
  const { currentUser } = useAdmin();
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    customer: null,
    targetActive: false,
    reason: '',
    error: '',
    loading: false
  });

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        q: searchTerm,
        page: currentPage
      };
      if (statusFilter === 'ACTIVE') params.is_active = 'true';
      if (statusFilter === 'SUSPENDED') params.is_active = 'false';

      const res = await fetchAdminCustomers(params);
      setCustomers(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load customer list.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleOpenDetail = async (customerId) => {
    setIsDetailLoading(true);
    try {
      const detail = await fetchAdminCustomerDetail(customerId);
      setSelectedCustomer(detail);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load customer details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenActionModal = (customer, targetActive) => {
    // Check self-lockout
    if (currentUser && customer.id === currentUser.id) {
      setErrorMessage('Action forbidden: Administrators cannot modify their own administrative status through customer controls.');
      return;
    }
    setActionModal({
      isOpen: true,
      customer,
      targetActive,
      reason: targetActive ? 'Customer requested reactivation after review.' : 'Voluntary suspension / account security hold.',
      error: '',
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!actionModal.reason.trim() || actionModal.reason.trim().length < 3) {
      setActionModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is required.' }));
      return;
    }
    setActionModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await toggleCustomerStatus(actionModal.customer.id, actionModal.targetActive, actionModal.reason);
      setActionModal({ isOpen: false, customer: null, targetActive: false, reason: '', error: '', loading: false });
      if (selectedCustomer && selectedCustomer.id === actionModal.customer.id) {
        setSelectedCustomer(prev => ({ ...prev, is_active: actionModal.targetActive }));
      }
      loadCustomers();
    } catch (err) {
      setActionModal(prev => ({ ...prev, loading: false, error: err.message || 'Action failed.' }));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#FF6B2C', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            CUSTOMER IDENTITIES & LTV AUDIT
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 0 0' }}>
            Customer Accounts Management
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Real PostgreSQL customer records, lifetime order value, and administrative suspension controls
          </div>
        </div>

        {/* Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
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
                width: '260px'
              }}
            />
          </div>

          <button
            onClick={loadCustomers}
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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All Customers' },
          { id: 'ACTIVE', label: 'Active Only' },
          { id: 'SUSPENDED', label: 'Suspended Only' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setCurrentPage(1);
            }}
            style={{
              background: statusFilter === tab.id ? 'var(--ws-primary, #22C55E)' : 'var(--ws-surface)',
              color: statusFilter === tab.id ? '#FFFFFF' : 'var(--ws-text-secondary)',
              border: '1px solid',
              borderColor: statusFilter === tab.id ? 'var(--ws-primary, #22C55E)' : 'var(--ws-border)',
              padding: '7px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
          Total: <strong>{totalCount}</strong> records
        </span>
      </div>

      {/* Error State */}
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

      {/* Customer Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Querying PostgreSQL customer records...</div>
        </div>
      ) : customers.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--ws-surface)',
          borderRadius: '20px',
          border: '1px dashed var(--ws-border)',
          color: 'var(--ws-text-muted)'
        }}>
          <Users size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No customers found</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Try adjusting your search query or filter</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: '18px'
        }}>
          {customers.map(customer => {
            const isActive = customer.is_active;

            return (
              <div
                key={customer.id}
                style={{
                  background: 'var(--ws-surface)',
                  border: `1px solid ${isActive ? 'var(--ws-border)' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: 'var(--ws-shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isActive ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                      color: isActive ? '#10B981' : '#EF4444'
                    }}>
                      {isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>

                    <span style={{ color: 'var(--ws-text-muted)', fontSize: '0.74rem' }}>
                      ID #{customer.id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '12px 0 2px 0' }}>
                    {customer.full_name || customer.username}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                      {customer.phone}
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'var(--ws-surface-subtle)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>ORDERS</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
                      {customer.orders_count || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>TOTAL SPENT</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                      ₹{Number(customer.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenDetail(customer.id)}
                    style={{
                      flex: 1,
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      color: 'var(--ws-text-primary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Eye size={13} />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => handleOpenActionModal(customer, !isActive)}
                    style={{
                      background: isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      border: `1px solid ${isActive ? '#EF4444' : '#10B981'}`,
                      color: isActive ? '#EF4444' : '#10B981',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
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
            maxWidth: '600px',
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
                  background: selectedCustomer.is_active ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                  color: selectedCustomer.is_active ? '#10B981' : '#EF4444'
                }}>
                  {selectedCustomer.is_active ? 'ACCOUNT ACTIVE' : 'ACCOUNT SUSPENDED'}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
                  {selectedCustomer.full_name || selectedCustomer.username}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                  User #{selectedCustomer.id} • Joined {new Date(selectedCustomer.date_joined).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
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

            {/* Profile Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--ws-text-primary)' }}>
                <Mail size={15} color="var(--ws-text-muted)" />
                <span>{selectedCustomer.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--ws-text-primary)' }}>
                <Phone size={15} color="var(--ws-text-muted)" />
                <span>{selectedCustomer.phone || 'No phone registered'}</span>
              </div>
            </div>

            {/* Delivery Addresses */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px 0' }}>
                Saved Delivery Addresses ({selectedCustomer.addresses?.length || 0})
              </h4>
              {!selectedCustomer.addresses || selectedCustomer.addresses.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>No saved delivery addresses.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedCustomer.addresses.map(addr => (
                    <div
                      key={addr.id}
                      style={{
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--ws-text-primary)'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#10B981', fontSize: '0.75rem' }}>{addr.label}</div>
                      <div>{addr.street_address}, {addr.city} - {addr.postal_code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px 0' }}>
                Recent Orders ({selectedCustomer.recent_orders?.length || 0})
              </h4>
              {!selectedCustomer.recent_orders || selectedCustomer.recent_orders.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>No order history recorded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedCustomer.recent_orders.map(o => (
                    <div
                      key={o.id}
                      style={{
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>{o.order_number}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>{o.restaurant_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#10B981' }}>₹{Number(o.total_amount).toFixed(2)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>{o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedCustomer(null)}
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
                Close
              </button>
              <button
                onClick={() => {
                  handleOpenActionModal(selectedCustomer, !selectedCustomer.is_active);
                }}
                style={{
                  background: selectedCustomer.is_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${selectedCustomer.is_active ? '#EF4444' : '#10B981'}`,
                  color: selectedCustomer.is_active ? '#EF4444' : '#10B981',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {selectedCustomer.is_active ? 'Suspend Customer Account' : 'Reactivate Customer Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {actionModal.isOpen && (
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
              {actionModal.targetActive ? 'Reactivate Customer Account' : 'Suspend Customer Account'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Customer: <strong>{actionModal.customer?.email}</strong>
            </p>

            {actionModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '12px'
              }}>
                {actionModal.error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Mandatory Administrative Justification Reason:
            </label>
            <textarea
              value={actionModal.reason}
              onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
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
              placeholder="State the reason for this administrative status transition..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setActionModal({ isOpen: false, customer: null, targetActive: false, reason: '', error: '', loading: false })}
                disabled={actionModal.loading}
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
                onClick={handleConfirmAction}
                disabled={actionModal.loading}
                style={{
                  background: actionModal.targetActive ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {actionModal.loading ? 'Updating...' : `Confirm ${actionModal.targetActive ? 'Reactivation' : 'Suspension'}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
