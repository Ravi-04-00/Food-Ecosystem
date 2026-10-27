import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bike, Search, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, Eye, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, BatteryCharging, AlertOctagon, Check, X
} from 'lucide-react';
import { 
  fetchAdminPartners, 
  fetchAdminPartnerDetail, 
  verifyPartner, 
  togglePartnerStatus 
} from '../services/api.js';
import { KYCReviewPanel } from '../components/KYCReviewPanel.jsx';
import { AddPartnerModal } from '../components/AddPartnerModal.jsx';

export const FleetManagerPage = () => {
  const [partners, setPartners] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [verStatusFilter, setVerStatusFilter] = useState('ALL');
  const [onlineFilter, setOnlineFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    partner: null,
    status: 'APPROVED',
    reason: '',
    error: '',
    loading: false
  });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    partner: null,
    targetActive: false,
    reason: '',
    error: '',
    loading: false
  });
  const [addOpen, setAddOpen] = useState(false);

  const loadPartners = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        q: searchTerm,
        page: currentPage
      };
      if (verStatusFilter !== 'ALL') params.verification_status = verStatusFilter;
      if (onlineFilter === 'ONLINE') params.is_online = 'true';
      if (onlineFilter === 'OFFLINE') params.is_online = 'false';

      const res = await fetchAdminPartners(params);
      setPartners(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load delivery partners.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, verStatusFilter, onlineFilter, currentPage]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const handleOpenDetail = async (id) => {
    try {
      const detail = await fetchAdminPartnerDetail(id);
      setSelectedPartner(detail);
    } catch (err) {
      alert(err.message || 'Failed to load partner details');
    }
  };

  const handleOpenVerifyModal = (partner, status) => {
    setVerifyModal({
      isOpen: true,
      partner,
      status,
      reason: status === 'APPROVED' ? 'Driving license and EV vehicle documentation verified.' : 'Invalid registration documents provided.',
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
      await verifyPartner(verifyModal.partner.id, verifyModal.status, verifyModal.reason);
      setVerifyModal({ isOpen: false, partner: null, status: 'APPROVED', reason: '', error: '', loading: false });
      if (selectedPartner && selectedPartner.id === verifyModal.partner.id) {
        setSelectedPartner(prev => ({
          ...prev,
          verification_status: verifyModal.status,
          is_verified: verifyModal.status === 'APPROVED'
        }));
      }
      loadPartners();
    } catch (err) {
      setVerifyModal(prev => ({ ...prev, loading: false, error: err.message || 'Action failed.' }));
    }
  };

  const handleOpenStatusModal = (partner, targetActive) => {
    setStatusModal({
      isOpen: true,
      partner,
      targetActive,
      reason: targetActive ? 'Courier reactivated following safety review.' : 'Courier suspended due to reported delivery incident.',
      error: '',
      loading: false
    });
  };

  const handleConfirmStatus = async () => {
    if (!statusModal.reason.trim() || statusModal.reason.trim().length < 3) {
      setStatusModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is required.' }));
      return;
    }
    setStatusModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await togglePartnerStatus(statusModal.partner.id, statusModal.targetActive, statusModal.reason);
      setStatusModal({ isOpen: false, partner: null, targetActive: false, reason: '', error: '', loading: false });
      if (selectedPartner && selectedPartner.id === statusModal.partner.id) {
        setSelectedPartner(prev => ({
          ...prev,
          is_active: statusModal.targetActive
        }));
      }
      loadPartners();
    } catch (err) {
      setStatusModal(prev => ({ ...prev, loading: false, error: err.message || 'Action failed.' }));
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
          <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            DELIVERY FLEET COMMAND & SAFETY
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 0 0' }}>
            Delivery Fleet Management
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Real PostgreSQL fleet records, onboarding approvals, shift tracking, and safety incident surveillance
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
            + Add Partner
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search rider, phone, vehicle..."
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
            onClick={loadPartners}
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
          { id: 'ALL', label: 'All Fleet Couriers' },
          { id: 'PENDING', label: 'Onboarding Queue (Pending)' },
          { id: 'APPROVED', label: 'Approved Couriers' },
          { id: 'REJECTED', label: 'Rejected Applications' }
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
          {['ALL', 'ONLINE', 'OFFLINE'].map(op => (
            <button
              key={op}
              onClick={() => {
                setOnlineFilter(op);
                setCurrentPage(1);
              }}
              style={{
                background: onlineFilter === op ? 'var(--ws-surface-subtle)' : 'transparent',
                border: '1px solid var(--ws-border)',
                color: 'var(--ws-text-secondary)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: onlineFilter === op ? 800 : 500,
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

      {/* Partner Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Querying PostgreSQL delivery partner fleet...</div>
        </div>
      ) : partners.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--ws-surface)',
          borderRadius: '20px',
          border: '1px dashed var(--ws-border)',
          color: 'var(--ws-text-muted)'
        }}>
          <Bike size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No couriers found</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Try adjusting your filters or search terms</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: '18px'
        }}>
          {partners.map(partner => {
            const isApproved = partner.verification_status === 'APPROVED';
            const isPending = partner.verification_status === 'PENDING';
            const isActive = partner.is_active;

            return (
              <div
                key={partner.id}
                style={{
                  background: 'var(--ws-surface)',
                  border: `1px solid ${isPending ? '#F59E0B' : (isActive ? 'var(--ws-border)' : 'rgba(239, 68, 68, 0.4)')}`,
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
                        {partner.verification_status}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: partner.is_online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                        color: partner.is_online ? '#10B981' : '#64748B'
                      }}>
                        {partner.is_online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#F59E0B', fontWeight: 800 }}>
                      ★ {Number(partner.rating || 5.0).toFixed(1)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '12px 0 2px 0' }}>
                    {partner.user_full_name || partner.user_username}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                    {partner.user_email} • {partner.user_phone || 'No phone'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                    {partner.vehicle_type || 'Vehicle'} • {partner.vehicle_number || 'No plate'}
                  </div>
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>DELIVERIES</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
                      {partner.completed_deliveries || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>ACTIVE TASK</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: partner.active_order_number ? '#10B981' : 'var(--ws-text-muted)', marginTop: '4px' }}>
                      {partner.active_order_number || 'Idle'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenDetail(partner.id)}
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
                      <span>Details & Logs</span>
                    </button>

                    <button
                      onClick={() => handleOpenStatusModal(partner, !isActive)}
                      style={{
                        background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${isActive ? '#EF4444' : '#10B981'}`,
                        color: isActive ? '#EF4444' : '#10B981',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenVerifyModal(partner, 'APPROVED')}
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
                        ✓ Approve Onboarding
                      </button>
                      <button
                        onClick={() => handleOpenVerifyModal(partner, 'REJECTED')}
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

      {/* Partner Detail Modal */}
      {selectedPartner && (
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
                  background: selectedPartner.verification_status === 'APPROVED' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: selectedPartner.verification_status === 'APPROVED' ? '#10B981' : '#F59E0B'
                }}>
                  {selectedPartner.verification_status}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
                  {selectedPartner.user_full_name || selectedPartner.user_username}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                  Partner #{selectedPartner.id} • Registered {new Date(selectedPartner.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
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
              <div><strong>Email:</strong> {selectedPartner.user_email}</div>
              <div><strong>Phone:</strong> {selectedPartner.user_phone || 'N/A'}</div>
              <div><strong>Vehicle:</strong> {selectedPartner.vehicle_type} ({selectedPartner.vehicle_number || 'N/A'})</div>
              <div><strong>Shift Status:</strong> {selectedPartner.is_online ? 'Online Shift Active' : 'Offline'}</div>
              <div><strong>Rating:</strong> ★ {Number(selectedPartner.rating || 5.0).toFixed(1)}</div>
              <div><strong>Total Completed Deliveries:</strong> {selectedPartner.completed_deliveries || 0}</div>
              {selectedPartner.active_order_number && (
                <div><strong>Current Assignment:</strong> Order #{selectedPartner.active_order_number}</div>
              )}
            </div>

            {/* Delivery Issues Section */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px 0' }}>
                Reported Delivery Issues ({selectedPartner.reported_issues?.length || 0})
              </h4>
              {!selectedPartner.reported_issues || selectedPartner.reported_issues.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#10B981' }}>✓ Clean safety record — zero reported delivery incidents.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPartner.reported_issues.map(iss => (
                    <div
                      key={iss.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#EF4444' }}>{iss.issue_type}</div>
                      <div style={{ color: 'var(--ws-text-primary)', marginTop: '2px' }}>{iss.description}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                        Reported: {new Date(iss.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPartner.user_id && (
              <KYCReviewPanel userId={selectedPartner.user_id} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedPartner(null)}
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

      {/* Verify Modal */}
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
              {verifyModal.status === 'APPROVED' ? 'Approve Delivery Partner' : 'Reject Partner Application'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Courier: <strong>{verifyModal.partner?.user_full_name || verifyModal.partner?.user_username}</strong>
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
              placeholder="State reason for verification decision..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setVerifyModal({ isOpen: false, partner: null, status: 'APPROVED', reason: '', error: '', loading: false })}
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

      {/* Suspend / Reactivate Modal */}
      {statusModal.isOpen && (
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
              {statusModal.targetActive ? 'Reactivate Delivery Partner' : 'Suspend Delivery Partner'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Courier: <strong>{statusModal.partner?.user_full_name || statusModal.partner?.user_username}</strong>
            </p>

            {statusModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '12px'
              }}>
                {statusModal.error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Mandatory Administrative Reason / Justification:
            </label>
            <textarea
              value={statusModal.reason}
              onChange={e => setStatusModal(prev => ({ ...prev, reason: e.target.value }))}
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
              placeholder="State reason for status suspension/reactivation..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setStatusModal({ isOpen: false, partner: null, targetActive: false, reason: '', error: '', loading: false })}
                disabled={statusModal.loading}
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
                onClick={handleConfirmStatus}
                disabled={statusModal.loading}
                style={{
                  background: statusModal.targetActive ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {statusModal.loading ? 'Updating...' : `Confirm ${statusModal.targetActive ? 'Reactivation' : 'Suspension'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddPartnerModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => loadPartners()}
      />

    </div>
  );
};
