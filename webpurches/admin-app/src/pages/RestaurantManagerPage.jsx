import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, Search, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, Eye, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  Clock, MapPin, DollarSign, Star, Utensils
} from 'lucide-react';
import {
  fetchAdminRestaurants, 
  fetchAdminRestaurantDetail, 
  verifyRestaurant, 
  toggleRestaurantAccess 
} from '../services/api.js';
import { KYCReviewPanel } from '../components/KYCReviewPanel.jsx';
import { AddRestaurantModal } from '../components/AddRestaurantModal.jsx';

export const RestaurantManagerPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [verStatusFilter, setVerStatusFilter] = useState('ALL');
  const [isOpenFilter, setIsOpenFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    restaurant: null,
    status: 'APPROVED',
    reason: '',
    error: '',
    loading: false
  });
  const [accessModal, setAccessModal] = useState({
    isOpen: false,
    restaurant: null,
    targetActive: false,
    reason: '',
    error: '',
    loading: false
  });
  const [addOpen, setAddOpen] = useState(false);

  const loadRestaurants = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        q: searchTerm,
        page: currentPage
      };
      if (verStatusFilter !== 'ALL') params.verification_status = verStatusFilter;
      if (isOpenFilter === 'OPEN') params.is_open = 'true';
      if (isOpenFilter === 'CLOSED') params.is_open = 'false';

      const res = await fetchAdminRestaurants(params);
      setRestaurants(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, verStatusFilter, isOpenFilter, currentPage]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const handleOpenDetail = async (id) => {
    try {
      const detail = await fetchAdminRestaurantDetail(id);
      setSelectedRestaurant(detail);
    } catch (err) {
      alert(err.message || 'Failed to load restaurant details');
    }
  };

  const handleOpenVerifyModal = (restaurant, status) => {
    setVerifyModal({
      isOpen: true,
      restaurant,
      status,
      reason: status === 'APPROVED' ? 'Commercial registration and hygiene inspection verified.' : 'Missing valid food safety documentation.',
      error: '',
      loading: false
    });
  };

  const handleConfirmVerify = async () => {
    if (!verifyModal.reason.trim() || verifyModal.reason.trim().length < 3) {
      setVerifyModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is required.' }));
      return;
    }
    setVerifyModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await verifyRestaurant(verifyModal.restaurant.id, verifyModal.status, verifyModal.reason);
      setVerifyModal({ isOpen: false, restaurant: null, status: 'APPROVED', reason: '', error: '', loading: false });
      if (selectedRestaurant && selectedRestaurant.id === verifyModal.restaurant.id) {
        setSelectedRestaurant(prev => ({
          ...prev,
          verification_status: verifyModal.status,
          is_verified: verifyModal.status === 'APPROVED'
        }));
      }
      loadRestaurants();
    } catch (err) {
      setVerifyModal(prev => ({ ...prev, loading: false, error: err.message || 'Action failed.' }));
    }
  };

  const handleOpenAccessModal = (restaurant, targetActive) => {
    setAccessModal({
      isOpen: true,
      restaurant,
      targetActive,
      reason: targetActive ? 'Access restored following compliance remediation.' : 'Account suspended due to policy investigation.',
      error: '',
      loading: false
    });
  };

  const handleConfirmAccess = async () => {
    if (!accessModal.reason.trim() || accessModal.reason.trim().length < 3) {
      setAccessModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is required.' }));
      return;
    }
    setAccessModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await toggleRestaurantAccess(accessModal.restaurant.id, accessModal.targetActive, accessModal.reason);
      setAccessModal({ isOpen: false, restaurant: null, targetActive: false, reason: '', error: '', loading: false });
      if (selectedRestaurant && selectedRestaurant.id === accessModal.restaurant.id) {
        setSelectedRestaurant(prev => ({
          ...prev,
          owner_is_active: accessModal.targetActive
        }));
      }
      loadRestaurants();
    } catch (err) {
      setAccessModal(prev => ({ ...prev, loading: false, error: err.message || 'Action failed.' }));
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
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            PARTNER KITCHENS & COMPLIANCE
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 0 0' }}>
            Restaurant Partners Management
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Onboarding verification queue, access control, menu audit, and operational tracking
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            style={{
              background: '#15803D',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 16px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 800
            }}
          >
            + Add Restaurant
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search kitchen, owner, cuisine..."
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
            onClick={loadRestaurants}
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
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { id: 'ALL', label: 'All Restaurants' },
          { id: 'PENDING', label: 'Approval Queue (Pending)' },
          { id: 'APPROVED', label: 'Approved Only' },
          { id: 'REJECTED', label: 'Rejected Only' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setVerStatusFilter(tab.id);
              setCurrentPage(1);
            }}
            style={{
              background: verStatusFilter === tab.id ? 'var(--ws-primary, #22C55E)' : 'var(--ws-surface)',
              color: verStatusFilter === tab.id ? '#FFFFFF' : 'var(--ws-text-secondary)',
              border: '1px solid',
              borderColor: verStatusFilter === tab.id ? 'var(--ws-primary, #22C55E)' : 'var(--ws-border)',
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

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {['ALL', 'OPEN', 'CLOSED'].map(op => (
            <button
              key={op}
              onClick={() => {
                setIsOpenFilter(op);
                setCurrentPage(1);
              }}
              style={{
                background: isOpenFilter === op ? 'var(--ws-surface-subtle)' : 'transparent',
                border: '1px solid var(--ws-border)',
                color: 'var(--ws-text-secondary)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: isOpenFilter === op ? 800 : 500,
                cursor: 'pointer'
              }}
            >
              {op}
            </button>
          ))}
        </div>
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

      {/* Restaurant Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Querying PostgreSQL restaurant partners...</div>
        </div>
      ) : restaurants.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--ws-surface)',
          borderRadius: '20px',
          border: '1px dashed var(--ws-border)',
          color: 'var(--ws-text-muted)'
        }}>
          <Store size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No restaurants found</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Try adjusting your filters or search terms</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: '18px'
        }}>
          {restaurants.map(rest => {
            const isApproved = rest.verification_status === 'APPROVED';
            const isPending = rest.verification_status === 'PENDING';
            const isRejected = rest.verification_status === 'REJECTED';
            const isAccessActive = rest.owner_is_active;

            return (
              <div
                key={rest.id}
                style={{
                  background: 'var(--ws-surface)',
                  border: `1px solid ${isPending ? '#F59E0B' : (isAccessActive ? 'var(--ws-border)' : 'rgba(239, 68, 68, 0.4)')}`,
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
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isApproved ? 'rgba(16, 185, 129, 0.14)' : (isPending ? 'rgba(245, 158, 11, 0.14)' : 'rgba(239, 68, 68, 0.14)'),
                        color: isApproved ? '#10B981' : (isPending ? '#F59E0B' : '#EF4444')
                      }}>
                        {rest.verification_status}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: rest.is_open ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                        color: rest.is_open ? '#10B981' : '#64748B'
                      }}>
                        {rest.is_open ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#F59E0B', fontWeight: 800 }}>
                      ★ {Number(rest.rating || 5.0).toFixed(1)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '12px 0 2px 0' }}>
                    {rest.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                    Owner: {rest.owner_email || rest.owner_name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                    {rest.cuisine_type || 'General'} • {rest.city || 'Ecosystem'}
                  </div>
                </div>

                {/* Stats */}
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>MENU ITEMS</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
                      {rest.food_items_count || 0} items
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>COMMISSION</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                      {rest.commission_rate || 12.0}%
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenDetail(rest.id)}
                      style={{
                        flex: 1,
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        color: 'var(--ws-text-primary)',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenAccessModal(rest, !isAccessActive)}
                      style={{
                        background: isAccessActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${isAccessActive ? '#EF4444' : '#10B981'}`,
                        color: isAccessActive ? '#EF4444' : '#10B981',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isAccessActive ? 'Disable Access' : 'Enable Access'}
                    </button>
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenVerifyModal(rest, 'APPROVED')}
                        style={{
                          flex: 1,
                          background: '#10B981',
                          border: 'none',
                          color: '#FFFFFF',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Approve Application
                      </button>
                      <button
                        onClick={() => handleOpenVerifyModal(rest, 'REJECTED')}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #EF4444',
                          color: '#EF4444',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
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
                  background: selectedRestaurant.verification_status === 'APPROVED' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: selectedRestaurant.verification_status === 'APPROVED' ? '#10B981' : '#F59E0B'
                }}>
                  {selectedRestaurant.verification_status}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
                  {selectedRestaurant.name}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                  Restaurant #{selectedRestaurant.id} • Registered {new Date(selectedRestaurant.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div><strong>Owner:</strong> {selectedRestaurant.owner_name} ({selectedRestaurant.owner_email})</div>
              <div><strong>Phone:</strong> {selectedRestaurant.phone_number || selectedRestaurant.owner_phone || 'N/A'}</div>
              <div><strong>Address:</strong> {selectedRestaurant.address_line}, {selectedRestaurant.city} - {selectedRestaurant.postal_code}</div>
              <div><strong>Cuisine:</strong> {selectedRestaurant.cuisine_type || 'General'}</div>
              <div><strong>Rating:</strong> ★ {Number(selectedRestaurant.rating || 5.0).toFixed(1)}</div>
              <div><strong>Categories:</strong> {selectedRestaurant.categories?.length || 0} categories</div>
              <div><strong>Active Food Items:</strong> {selectedRestaurant.food_items_count || 0} items</div>
            </div>

            {selectedRestaurant.owner_id && (
              <KYCReviewPanel userId={selectedRestaurant.owner_id} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedRestaurant(null)}
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
            </div>
          </div>
        </div>
      )}

      {/* Verify / Reject Modal */}
      {verifyModal.isOpen && (
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
              {verifyModal.status === 'APPROVED' ? 'Approve Restaurant Partner' : 'Reject Application'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Kitchen: <strong>{verifyModal.restaurant?.name}</strong>
            </p>

            {verifyModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '12px'
              }}>
                {verifyModal.error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Mandatory Administrative Reason / Justification:
            </label>
            <textarea
              value={verifyModal.reason}
              onChange={e => setVerifyModal(prev => ({ ...prev, reason: e.target.value }))}
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
              placeholder="State clear reasons for onboarding decision..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setVerifyModal({ isOpen: false, restaurant: null, status: 'APPROVED', reason: '', error: '', loading: false })}
                disabled={verifyModal.loading}
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
                onClick={handleConfirmVerify}
                disabled={verifyModal.loading}
                style={{
                  background: verifyModal.status === 'APPROVED' ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {verifyModal.loading ? 'Updating...' : `Confirm ${verifyModal.status === 'APPROVED' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enable / Disable Access Modal */}
      {accessModal.isOpen && (
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
              {accessModal.targetActive ? 'Enable Restaurant Platform Access' : 'Disable Restaurant Platform Access'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Kitchen: <strong>{accessModal.restaurant?.name}</strong>
            </p>

            {accessModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '12px'
              }}>
                {accessModal.error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Mandatory Administrative Reason / Justification:
            </label>
            <textarea
              value={accessModal.reason}
              onChange={e => setAccessModal(prev => ({ ...prev, reason: e.target.value }))}
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
              placeholder="State reason for access modification..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setAccessModal({ isOpen: false, restaurant: null, targetActive: false, reason: '', error: '', loading: false })}
                disabled={accessModal.loading}
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
                onClick={handleConfirmAccess}
                disabled={accessModal.loading}
                style={{
                  background: accessModal.targetActive ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {accessModal.loading ? 'Updating...' : `Confirm ${accessModal.targetActive ? 'Enable' : 'Disable'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddRestaurantModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => loadRestaurants()}
      />

    </div>
  );
};
