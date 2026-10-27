import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navigation, Search, RefreshCw, Filter, Clock, CheckCircle2, 
  XCircle, AlertTriangle, UserCheck, Bike, ArrowRight, Shield, 
  ChevronLeft, ChevronRight, Store, MapPin, Zap, AlertCircle
} from 'lucide-react';
import { 
  fetchAdminDispatchMonitor, 
  reassignAdminDispatch, 
  fetchAdminEligiblePartners,
  triggerOrderDispatch
} from '../services/api.js';

export const AdminDispatchPage = () => {
  const [data, setData] = useState({
    kpis: {
      unassigned_eligible: 0,
      pending_offers: 0,
      accepted_assignments: 0,
      expired_offers: 0,
      active_deliveries: 0,
      completed_today: 0,
      total_assignments: 0
    },
    results: [],
    count: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Eligible partners for reassignment
  const [eligiblePartners, setEligiblePartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadDispatchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetchAdminDispatchMonitor({
        status: statusFilter,
        q: searchTerm,
        date: dateFilter,
        page: currentPage,
        page_size: pageSize
      });
      setData(res);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load live dispatch monitor data');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, dateFilter, currentPage]);

  useEffect(() => {
    loadDispatchData();
    // Auto-refresh monitor every 12 seconds
    const interval = setInterval(loadDispatchData, 12000);
    return () => clearInterval(interval);
  }, [loadDispatchData]);

  // Load partners when opening reassignment modal
  const handleOpenReassignModal = async (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedPartnerId('');
    setReassignReason('Administrative reassignment - workload balancing');
    setShowReassignModal(true);
    try {
      const partners = await fetchAdminEligiblePartners();
      setEligiblePartners(partners);
      if (partners.length > 0) {
        setSelectedPartnerId(String(partners[0].id));
      }
    } catch (err) {
      setErrorMessage('Failed to load eligible delivery partners');
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedAssignment || !selectedPartnerId) return;
    setIsReassigning(true);
    setErrorMessage('');
    try {
      const res = await reassignAdminDispatch(
        selectedAssignment.id,
        selectedPartnerId,
        reassignReason
      );
      setSuccessMessage(res.message || 'Order successfully reassigned!');
      setShowReassignModal(false);
      setTimeout(() => setSuccessMessage(''), 5000);
      await loadDispatchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reassign delivery order');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleTriggerDispatch = async (orderId = null) => {
    setIsTriggering(true);
    setErrorMessage('');
    try {
      const res = await triggerOrderDispatch(orderId);
      setSuccessMessage(res.message || 'Dispatch initiated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      await loadDispatchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to trigger dispatch');
    } finally {
      setIsTriggering(false);
    }
  };

  const kpis = data?.kpis || {};
  const totalPages = Math.ceil((data?.count || 0) / pageSize) || 1;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OFFERED':
        return { label: 'Offer Dispatched', bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' };
      case 'ACCEPTED':
        return { label: 'Partner Assigned', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' };
      case 'AWAITING_PARTNER':
        return { label: 'Awaiting Partner', bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' };
      case 'AVAILABLE':
        return { label: 'Ready for Dispatch', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'PICKED_UP':
        return { label: 'In Transit', bg: '#E0E7FF', color: '#4338CA', border: '#C7D2FE' };
      case 'DELIVERED':
        return { label: 'Completed', bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
      default:
        return { label: status, bg: '#F8F9FA', color: '#495057', border: '#DEE2E6' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22C55E'
            }}>
              <Navigation size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                Smart Dispatch & Fleet Matching
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', margin: '2px 0 0 0' }}>
                Automated workload-aware partner dispatch with sequential offer progression & race-condition protection.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handleTriggerDispatch(null)}
            disabled={isTriggering}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isTriggering ? 'not-allowed' : 'pointer',
              opacity: isTriggering ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)'
            }}
          >
            <Zap size={16} />
            <span>{isTriggering ? 'Dispatching...' : 'Scan & Dispatch Ready Orders'}</span>
          </button>

          <button
            onClick={loadDispatchData}
            disabled={isLoading}
            style={{
              padding: '9px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--ws-surface)',
              color: 'var(--ws-text-primary)',
              border: '1px solid var(--ws-border)',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '14px',
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          color: '#15803D',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '14px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#B91C1C',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5 Real Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        <div style={{
          backgroundColor: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
            Unassigned Eligible
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#3B82F6', fontFamily: 'monospace' }}>
            {kpis.unassigned_eligible ?? 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>Ready kitchen orders</span>
        </div>

        <div style={{
          backgroundColor: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
            Pending Offers
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace' }}>
            {kpis.pending_offers ?? 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>Countdown active (45-60s)</span>
        </div>

        <div style={{
          backgroundColor: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
            Accepted Assignments
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
            {kpis.accepted_assignments ?? 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>Rider heading to merchant</span>
        </div>

        <div style={{
          backgroundColor: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
            Expired / Rejected
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#EF4444', fontFamily: 'monospace' }}>
            {kpis.expired_offers ?? 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>Auto-progressed to next rider</span>
        </div>

        <div style={{
          backgroundColor: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
            Active in Transit
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#8B5CF6', fontFamily: 'monospace' }}>
            {kpis.active_deliveries ?? 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>Active last-mile transit</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        backgroundColor: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--ws-bg-page)',
            border: '1px solid var(--ws-border)',
            borderRadius: '10px',
            padding: '7px 12px',
            minWidth: '240px'
          }}>
            <Search size={16} color="var(--ws-text-muted)" />
            <input
              type="text"
              placeholder="Search Order #, merchant, partner..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--ws-text-primary)',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '10px',
                backgroundColor: 'var(--ws-bg-page)',
                border: '1px solid var(--ws-border)',
                color: 'var(--ws-text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="ALL">All States</option>
              <option value="OFFERED">Offer Dispatched</option>
              <option value="AVAILABLE">Available for Pickup</option>
              <option value="AWAITING_PARTNER">Awaiting Partner</option>
              <option value="ACCEPTED">Partner Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '10px',
                backgroundColor: 'var(--ws-bg-page)',
                border: '1px solid var(--ws-border)',
                color: 'var(--ws-text-primary)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>
          Showing {data?.results?.length || 0} of {data?.count || 0} assignments
        </span>
      </div>

      {/* Live Dispatch Queue Table */}
      <div style={{
        backgroundColor: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '18px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--ws-bg-page)',
                borderBottom: '1px solid var(--ws-border)',
                color: 'var(--ws-text-muted)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                <th style={{ padding: '14px 18px' }}>Order</th>
                <th style={{ padding: '14px 18px' }}>Merchant</th>
                <th style={{ padding: '14px 18px' }}>Delivery Area</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Partner Candidate</th>
                <th style={{ padding: '14px 18px' }}>Attempts</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                    No delivery dispatch records matching the selected criteria.
                  </td>
                </tr>
              ) : (
                data?.results?.map((row) => {
                  const badge = getStatusBadge(row.status);
                  const activeOffer = row.active_offer;

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid var(--ws-border)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Order Number */}
                      <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--ws-text-primary)' }}>
                            #{row.order_number}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 500 }}>
                            {row.order_status}
                          </span>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td style={{ padding: '14px 18px', color: 'var(--ws-text-primary)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Store size={14} color="#D97706" />
                          <span>{row.restaurant_name}</span>
                        </div>
                      </td>

                      {/* Area */}
                      <td style={{ padding: '14px 18px', color: 'var(--ws-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#059669" />
                          <span>{row.delivery_area}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontWeight: 800,
                          fontSize: '0.74rem'
                        }}>
                          {row.status === 'OFFERED' && <Clock size={12} />}
                          {row.status === 'ACCEPTED' && <CheckCircle2 size={12} />}
                          {badge.label}
                        </span>
                      </td>

                      {/* Partner Candidate */}
                      <td style={{ padding: '14px 18px' }}>
                        {row.assigned_partner_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Bike size={14} color="#22C55E" />
                            <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                              {row.assigned_partner_name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ws-text-muted)', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                        {activeOffer && (
                          <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: '2px', fontWeight: 600 }}>
                            {activeOffer.expiry_seconds}s timeout remaining
                          </div>
                        )}
                      </td>

                      {/* Attempts count */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: row.attempt_count >= row.max_retries ? '#DC2626' : 'var(--ws-text-primary)'
                        }}>
                          {row.attempt_count} / {row.max_retries}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedAssignment(row);
                              setShowHistoryModal(true);
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--ws-border)',
                              color: 'var(--ws-text-primary)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Attempts Log
                          </button>

                          {row.status !== 'DELIVERED' && row.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleOpenReassignModal(row)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                border: '1px solid #86EFAC',
                                color: '#15803D',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Reassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--ws-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--ws-text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--ws-border)',
                  backgroundColor: 'var(--ws-surface)',
                  color: 'var(--ws-text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--ws-border)',
                  backgroundColor: 'var(--ws-surface)',
                  color: 'var(--ws-text-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attempts History Modal */}
      {showHistoryModal && selectedAssignment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            width: '100%',
            maxWidth: '650px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Sequential Dispatch Attempts
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Order #{selectedAssignment.order_number} • Merchant: {selectedAssignment.restaurant_name}
                </span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: 'var(--ws-text-muted)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {selectedAssignment.attempts_history?.length === 0 ? (
              <p style={{ color: 'var(--ws-text-muted)', padding: '20px 0', textAlign: 'center' }}>
                No partner offers have been dispatched yet for this assignment.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedAssignment.attempts_history?.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      backgroundColor: 'var(--ws-bg-page)',
                      border: '1px solid var(--ws-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.9rem' }}>
                        Attempt #{att.attempt_number}: {att.partner_full_name || att.partner_username}
                      </span>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor: att.status === 'ACCEPTED' ? '#DCFCE7' : (att.status === 'EXPIRED' ? '#FEE2E2' : '#FEF3C7'),
                        color: att.status === 'ACCEPTED' ? '#15803D' : (att.status === 'EXPIRED' ? '#B91C1C' : '#D97706')
                      }}>
                        {att.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--ws-text-secondary)' }}>
                      <span>Distance: {att.distance_km} km</span>
                      <span>Matching Score: {att.matching_score}</span>
                      <span>Payout: ₹{att.estimated_payout}</span>
                    </div>

                    {att.rejection_reason && (
                      <span style={{ fontSize: '0.76rem', color: '#DC2626', fontWeight: 600 }}>
                        Rejection reason: {att.rejection_reason}
                      </span>
                    )}

                    <span style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                      Offered at: {new Date(att.offered_at).toLocaleTimeString()}
                      {att.responded_at && ` • Responded: ${new Date(att.responded_at).toLocaleTimeString()}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowHistoryModal(false)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: 'var(--ws-bg-page)',
                border: '1px solid var(--ws-border)',
                color: 'var(--ws-text-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manual Reassignment Modal */}
      {showReassignModal && selectedAssignment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Authorized Manual Reassignment
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Order #{selectedAssignment.order_number} • Current Status: {selectedAssignment.status}
                </span>
              </div>
              <button
                onClick={() => setShowReassignModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: 'var(--ws-text-muted)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ws-text-secondary)' }}>
                Select Online Delivery Partner:
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--ws-bg-page)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontWeight: 600
                }}
              >
                {eligiblePartners.length === 0 ? (
                  <option value="">No online delivery partners found</option>
                ) : (
                  eligiblePartners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.vehicle_type}) • Rating: {p.rating} • Active Orders: {p.active_orders_count}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ws-text-secondary)' }}>
                Administrative Justification / Reason:
              </label>
              <input
                type="text"
                placeholder="Reason for manual reassignment..."
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--ws-bg-page)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setShowReassignModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--ws-bg-page)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReassign}
                disabled={isReassigning || !selectedPartnerId}
                style={{
                  flex: 1.5,
                  padding: '11px',
                  borderRadius: '10px',
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  cursor: isReassigning || !selectedPartnerId ? 'not-allowed' : 'pointer',
                  opacity: isReassigning || !selectedPartnerId ? 0.6 : 1
                }}
              >
                {isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
