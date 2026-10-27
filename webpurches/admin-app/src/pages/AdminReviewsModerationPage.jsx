import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  EyeOff, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Package,
  Store,
  Bike,
  Check,
  X,
  FileText
} from 'lucide-react';
import { 
  fetchAdminReviewQueue, 
  adminModerateReview, 
  fetchAdminReviewReports, 
  adminResolveReviewReport, 
  fetchAdminReviewStats 
} from '../services/api.js';

export const AdminReviewsModerationPage = () => {
  // Main tabs: 'queue' | 'reports'
  const [activeTab, setActiveTab] = useState('queue');

  // Stats
  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Review Queue state
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState('');

  // Abuse Reports state
  const [reports, setReports] = useState([]);
  const [reportCount, setReportCount] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');

  // Moderation Action Modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    review: null,
    action: 'APPROVE', // 'APPROVE' | 'HIDE' | 'FLAG'
    reason: '',
    error: '',
    loading: false
  });

  // Report Resolution Modal
  const [resolveModal, setResolveModal] = useState({
    isOpen: false,
    report: null,
    action: 'RESOLVE_AND_HIDE', // 'RESOLVE_AND_HIDE' | 'DISMISS'
    adminNotes: '',
    error: '',
    loading: false
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await fetchAdminReviewStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load review stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Load Reviews Queue
  const loadReviews = useCallback(async () => {
    setIsQueueLoading(true);
    setQueueError('');
    try {
      const data = await fetchAdminReviewQueue({
        page: reviewPage,
        status: statusFilter
      });
      setReviews(data.results || []);
      setReviewCount(data.count || 0);
    } catch (err) {
      setQueueError(err.message || 'Failed to load reviews.');
    } finally {
      setIsQueueLoading(false);
    }
  }, [reviewPage, statusFilter]);

  // Load Abuse Reports
  const loadReports = useCallback(async () => {
    setIsReportsLoading(true);
    setReportsError('');
    try {
      const data = await fetchAdminReviewReports({
        page: reportPage,
        status: reportStatusFilter
      });
      setReports(data.results || []);
      setReportCount(data.count || 0);
    } catch (err) {
      setReportsError(err.message || 'Failed to load reports.');
    } finally {
      setIsReportsLoading(false);
    }
  }, [reportPage, reportStatusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'queue') {
      loadReviews();
    } else {
      loadReports();
    }
  }, [activeTab, loadReviews, loadReports]);

  // Trigger Action Modal
  const handleOpenActionModal = (review, action) => {
    let defaultReason = '';
    if (action === 'APPROVE') defaultReason = 'Verified review adheres to platform content standards.';
    if (action === 'HIDE') defaultReason = 'Content violates community guidelines or contains inappropriate language.';
    if (action === 'FLAG') defaultReason = 'Flagged for senior trust & safety evaluation.';

    setActionModal({
      isOpen: true,
      review,
      action,
      reason: defaultReason,
      error: '',
      loading: false
    });
  };

  // Submit Moderation Action
  const handleConfirmModeration = async () => {
    if (!actionModal.reason || actionModal.reason.trim().length < 3) {
      setActionModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is mandatory for auditing.' }));
      return;
    }

    setActionModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await adminModerateReview(actionModal.review.id, {
        action: actionModal.action,
        reason: actionModal.reason.trim()
      });

      showToast(`Review #${actionModal.review.id} updated to ${actionModal.action}`);
      setActionModal({ isOpen: false, review: null, action: 'APPROVE', reason: '', error: '', loading: false });
      loadReviews();
      loadStats();
    } catch (err) {
      setActionModal(prev => ({ ...prev, loading: false, error: err.message || 'Moderation action failed.' }));
    }
  };

  // Trigger Report Resolution Modal
  const handleOpenResolveModal = (report, action) => {
    setResolveModal({
      isOpen: true,
      report,
      action,
      adminNotes: action === 'RESOLVE_AND_HIDE' 
        ? 'Confirmed violation. Review has been unlisted from ecosystem.'
        : 'Reviewed. Found to comply with verified customer guidelines.',
      error: '',
      loading: false
    });
  };

  // Submit Report Resolution
  const handleConfirmResolve = async () => {
    setResolveModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await adminResolveReviewReport(resolveModal.report.id, {
        action: resolveModal.action,
        admin_notes: resolveModal.adminNotes.trim()
      });

      showToast(`Report #${resolveModal.report.id} resolved successfully.`);
      setResolveModal({ isOpen: false, report: null, action: 'RESOLVE_AND_HIDE', adminNotes: '', error: '', loading: false });
      loadReports();
      loadStats();
      if (activeTab === 'queue') loadReviews();
    } catch (err) {
      setResolveModal(prev => ({ ...prev, loading: false, error: err.message || 'Resolution failed.' }));
    }
  };

  const pageSize = 12;
  const totalReviewPages = Math.ceil(reviewCount / pageSize) || 1;
  const totalReportPages = Math.ceil(reportCount / pageSize) || 1;

  const renderTargetBadge = (targetType, review) => {
    if (targetType === 'RESTAURANT') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 107, 44, 0.12)',
          color: '#FF6B2C',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '0.74rem',
          fontWeight: 700
        }}>
          <Store size={12} />
          {review.target_name || 'Restaurant'}
        </span>
      );
    }
    if (targetType === 'FOOD_ITEM') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(59, 130, 246, 0.12)',
          color: '#60A5FA',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '0.74rem',
          fontWeight: 700
        }}>
          <Package size={12} />
          {review.target_name || 'Food Item'}
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(168, 85, 247, 0.12)',
        color: '#C084FC',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.74rem',
        fontWeight: 700
      }}>
        <Bike size={12} />
        {review.target_name || 'Delivery Partner'}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ADE80',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            <CheckCircle2 size={12} /> APPROVED
          </span>
        );
      case 'HIDDEN':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#F87171',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            <EyeOff size={12} /> HIDDEN
          </span>
        );
      case 'FLAGGED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#FBBF24',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            <Flag size={12} /> FLAGGED
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94A3B8',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? '#EF4444' : '#15803D',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toastMessage.msg}
        </div>
      )}

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
            VERIFIED REVIEWS & TRUST MODERATION
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 0 0' }}>
            Ratings, Reviews & Dispute Center
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Strict verified-order auditing, multi-target ratings recalculation, and mandatory reason moderation logs
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              loadStats();
              if (activeTab === 'queue') loadReviews();
              else loadReports();
            }}
            disabled={isQueueLoading || isReportsLoading || isStatsLoading}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '9px 16px',
              color: 'var(--ws-text-primary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={isQueueLoading || isReportsLoading ? 'spin-anim' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {/* Platform Avg Rating */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Platform Avg Rating
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FBBF24' }}>
              {stats?.platform_average_rating ? `${stats.platform_average_rating}` : '5.0'}
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} fill="#FBBF24" color="#FBBF24" />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
            Excludes unapproved or hidden entries
          </div>
        </div>

        {/* Total Reviews */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Reviews
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
            {stats?.total_reviews ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#4ADE80', fontWeight: 700 }}>
            {stats?.approved_count ?? 0} Approved & Visible
          </div>
        </div>

        {/* Flagged Queue */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Flagged for Review
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
            {stats?.flagged_count ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
            Multi-reported or system flagged
          </div>
        </div>

        {/* Hidden Reviews */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Hidden / Moderated
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F87171', marginTop: '2px' }}>
            {stats?.hidden_count ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
            Unlisted from public restaurant feeds
          </div>
        </div>

        {/* Pending Reports */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Pending Dispute Reports
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: (stats?.pending_reports || 0) > 0 ? '#FF6B2C' : 'var(--ws-text-primary)', marginTop: '2px' }}>
            {stats?.pending_reports ?? 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-secondary)' }}>
            Customer & merchant flagged reports
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--ws-border)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              background: activeTab === 'queue' ? 'rgba(34, 197, 94, 0.14)' : 'transparent',
              color: activeTab === 'queue' ? '#4ADE80' : 'var(--ws-text-muted)',
              border: activeTab === 'queue' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare size={15} />
            Moderation Queue ({reviewCount})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={{
              background: activeTab === 'reports' ? 'rgba(255, 107, 44, 0.14)' : 'transparent',
              color: activeTab === 'reports' ? '#FF6B2C' : 'var(--ws-text-muted)',
              border: activeTab === 'reports' ? '1px solid rgba(255, 107, 44, 0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldAlert size={15} />
            Abuse & Dispute Reports
            {(stats?.pending_reports || 0) > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.7rem',
                fontWeight: 900
              }}>
                {stats.pending_reports}
              </span>
            )}
          </button>
        </div>

        {/* Tab-specific Filters */}
        {activeTab === 'queue' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setReviewPage(1);
              }}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="">ALL STATUSES</option>
              <option value="FLAGGED">FLAGGED ONLY</option>
              <option value="APPROVED">APPROVED ONLY</option>
              <option value="HIDDEN">HIDDEN ONLY</option>
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>Filter Status:</span>
            <select
              value={reportStatusFilter}
              onChange={e => {
                setReportStatusFilter(e.target.value);
                setReportPage(1);
              }}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="">ALL REPORTS</option>
              <option value="PENDING">PENDING ONLY</option>
              <option value="RESOLVED">RESOLVED ONLY</option>
              <option value="DISMISSED">DISMISSED ONLY</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: REVIEWS MODERATION QUEUE */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {queueError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#F87171',
              fontSize: '0.85rem'
            }}>
              {queueError}
            </div>
          )}

          {isQueueLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 12px' }} />
              <div>Loading verified reviews queue...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--ws-text-muted)'
            }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No reviews in this queue</div>
              <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                {statusFilter ? `No reviews matching filter status "${statusFilter}".` : 'No reviews found in PostgreSQL database.'}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>ID / Order</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Target</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Reviewer</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Rating</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Comment / Feedback</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((rev) => (
                      <tr 
                        key={rev.id} 
                        style={{ 
                          borderBottom: '1px solid var(--ws-border)',
                          backgroundColor: rev.moderation_status === 'FLAGGED' ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                        }}
                      >
                        {/* ID / Order */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>#{rev.id}</div>
                          {rev.order_reference && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                              Order {rev.order_reference}
                            </div>
                          )}
                          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                            {new Date(rev.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Target */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          {renderTargetBadge(rev.target_type, rev)}
                        </td>

                        {/* Reviewer */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                            {rev.reviewer_name || 'Customer'}
                          </div>
                          {rev.is_verified_order && (
                            <span style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 700 }}>
                              ✓ Verified Order
                            </span>
                          )}
                        </td>

                        {/* Rating */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={14} fill="#FBBF24" color="#FBBF24" />
                            <span style={{ fontWeight: 900, color: '#FBBF24', fontSize: '0.95rem' }}>
                              {rev.rating}
                            </span>
                            <span style={{ color: 'var(--ws-text-muted)', fontSize: '0.75rem' }}>/ 5</span>
                          </div>
                          {/* Sub-ratings */}
                          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {rev.food_quality_rating && (
                              <span>Quality: {rev.food_quality_rating}★</span>
                            )}
                            {rev.packaging_rating && (
                              <span>Packaging: {rev.packaging_rating}★</span>
                            )}
                            {rev.delivery_rating && (
                              <span>Delivery: {rev.delivery_rating}★</span>
                            )}
                          </div>
                        </td>

                        {/* Comment */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '320px' }}>
                          <div style={{ color: 'var(--ws-text-primary)', fontStyle: rev.comment ? 'normal' : 'italic', fontSize: '0.84rem' }}>
                            {rev.comment || 'No written feedback provided.'}
                          </div>
                          {rev.moderation_reason && (
                            <div style={{
                              marginTop: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.04)',
                              borderLeft: '2px solid #FBBF24',
                              fontSize: '0.74rem',
                              color: 'var(--ws-text-secondary)'
                            }}>
                              <span style={{ fontWeight: 700 }}>Mod Note:</span> {rev.moderation_reason}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          {renderStatusBadge(rev.moderation_status)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {rev.moderation_status !== 'APPROVED' && (
                              <button
                                onClick={() => handleOpenActionModal(rev, 'APPROVE')}
                                title="Approve and make visible"
                                style={{
                                  background: 'rgba(34, 197, 94, 0.14)',
                                  color: '#4ADE80',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={12} /> Approve
                              </button>
                            )}

                            {rev.moderation_status !== 'FLAGGED' && (
                              <button
                                onClick={() => handleOpenActionModal(rev, 'FLAG')}
                                title="Flag for review"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.14)',
                                  color: '#FBBF24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Flag size={12} /> Flag
                              </button>
                            )}

                            {rev.moderation_status !== 'HIDDEN' && (
                              <button
                                onClick={() => handleOpenActionModal(rev, 'HIDE')}
                                title="Hide from public feeds"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.14)',
                                  color: '#F87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <EyeOff size={12} /> Hide
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalReviewPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderTop: '1px solid var(--ws-border)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                    Showing page {reviewPage} of {totalReviewPages} ({reviewCount} total reviews)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                      disabled={reviewPage <= 1}
                      style={{
                        background: 'var(--ws-surface)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: 'var(--ws-text-primary)',
                        fontSize: '0.8rem',
                        cursor: reviewPage <= 1 ? 'not-allowed' : 'pointer',
                        opacity: reviewPage <= 1 ? 0.5 : 1
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                      disabled={reviewPage >= totalReviewPages}
                      style={{
                        background: 'var(--ws-surface)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: 'var(--ws-text-primary)',
                        fontSize: '0.8rem',
                        cursor: reviewPage >= totalReviewPages ? 'not-allowed' : 'pointer',
                        opacity: reviewPage >= totalReviewPages ? 0.5 : 1
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ABUSE & DISPUTE REPORTS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reportsError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#F87171',
              fontSize: '0.85rem'
            }}>
              {reportsError}
            </div>
          )}

          {isReportsLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 12px' }} />
              <div>Loading abuse reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--ws-text-muted)'
            }}>
              <CheckCircle2 size={36} color="#4ADE80" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No Dispute Reports</div>
              <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                Zero active abuse flags or customer disputes pending resolution.
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Report ID</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Review Details</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Reported By</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Reason & Description</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((rep) => (
                      <tr 
                        key={rep.id} 
                        style={{ 
                          borderBottom: '1px solid var(--ws-border)',
                          backgroundColor: rep.status === 'PENDING' ? 'rgba(255, 107, 44, 0.04)' : 'transparent'
                        }}
                      >
                        {/* Report ID */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>#{rep.id}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                            {new Date(rep.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Review Details */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          {rep.review_details ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                <Star size={13} fill="#FBBF24" color="#FBBF24" />
                                <span>{rep.review_details.rating}★</span>
                                <span style={{ color: 'var(--ws-text-muted)' }}>Review #{rep.review_details.id}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                                "{rep.review_details.comment ? (rep.review_details.comment.length > 60 ? rep.review_details.comment.substring(0, 60) + '...' : rep.review_details.comment) : 'No comment'}"
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--ws-text-muted)' }}>Review #{rep.review}</span>
                          )}
                        </td>

                        {/* Reported By */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                            {rep.reporter_name || 'Ecosystem User'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                            ID: #{rep.reported_by}
                          </div>
                        </td>

                        {/* Reason & Description */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '300px' }}>
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.14)',
                            color: '#F87171',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-block',
                            marginBottom: '4px'
                          }}>
                            {rep.reason}
                          </span>
                          <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-primary)' }}>
                            {rep.description || 'No detailed description.'}
                          </div>
                          {rep.admin_notes && (
                            <div style={{
                              marginTop: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.04)',
                              fontSize: '0.74rem',
                              color: '#4ADE80'
                            }}>
                              <span style={{ fontWeight: 700 }}>Resolved Note:</span> {rep.admin_notes}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          {rep.status === 'PENDING' ? (
                            <span style={{
                              background: 'rgba(255, 107, 44, 0.15)',
                              color: '#FF6B2C',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800
                            }}>
                              PENDING
                            </span>
                          ) : rep.status === 'RESOLVED' ? (
                            <span style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ADE80',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800
                            }}>
                              RESOLVED
                            </span>
                          ) : (
                            <span style={{
                              background: 'rgba(148, 163, 184, 0.15)',
                              color: '#94A3B8',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800
                            }}>
                              DISMISSED
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                          {rep.status === 'PENDING' ? (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenResolveModal(rep, 'RESOLVE_AND_HIDE')}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.14)',
                                  color: '#F87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Resolve & Hide
                              </button>
                              <button
                                onClick={() => handleOpenResolveModal(rep, 'DISMISS')}
                                style={{
                                  background: 'rgba(148, 163, 184, 0.14)',
                                  color: '#CBD5E1',
                                  border: '1px solid rgba(148, 163, 184, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reports Pagination */}
              {totalReportPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderTop: '1px solid var(--ws-border)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                    Showing page {reportPage} of {totalReportPages} ({reportCount} total reports)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setReportPage(p => Math.max(1, p - 1))}
                      disabled={reportPage <= 1}
                      style={{
                        background: 'var(--ws-surface)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: 'var(--ws-text-primary)',
                        fontSize: '0.8rem',
                        cursor: reportPage <= 1 ? 'not-allowed' : 'pointer',
                        opacity: reportPage <= 1 ? 0.5 : 1
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))}
                      disabled={reportPage >= totalReportPages}
                      style={{
                        background: 'var(--ws-surface)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: 'var(--ws-text-primary)',
                        fontSize: '0.8rem',
                        cursor: reportPage >= totalReportPages ? 'not-allowed' : 'pointer',
                        opacity: reportPage >= totalReportPages ? 0.5 : 1
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: MANDATORY MODERATION ACTION */}
      {actionModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#FF6B2C" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                  Moderate Review #{actionModal.review?.id}
                </h3>
              </div>
              <button
                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Target & Content Summary */}
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ws-text-muted)' }}>Target:</span>
                <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                  {actionModal.review?.target_name} ({actionModal.review?.target_type})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ws-text-muted)' }}>Rating:</span>
                <span style={{ fontWeight: 700, color: '#FBBF24' }}>{actionModal.review?.rating} ★</span>
              </div>
              {actionModal.review?.comment && (
                <div style={{ fontStyle: 'italic', color: 'var(--ws-text-secondary)', marginTop: '4px' }}>
                  "{actionModal.review.comment}"
                </div>
              )}
            </div>

            {/* Action Selection */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                Moderation Action
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'APPROVE', label: 'Approve', color: '#4ADE80' },
                  { id: 'FLAG', label: 'Flag', color: '#FBBF24' },
                  { id: 'HIDE', label: 'Hide', color: '#F87171' }
                ].map(act => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActionModal(prev => ({ ...prev, action: act.id }))}
                    style={{
                      background: actionModal.action === act.id ? `${act.color}22` : 'rgba(255,255,255,0.04)',
                      border: actionModal.action === act.id ? `2px solid ${act.color}` : '1px solid var(--ws-border)',
                      color: actionModal.action === act.id ? act.color : 'var(--ws-text-secondary)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Reason Input */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                Mandatory Moderation Reason (Audit Logged) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={actionModal.reason}
                onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value, error: '' }))}
                placeholder="Explain why this review is being approved, flagged, or hidden..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--ws-bg)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {actionModal.error && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem' }}>
                {actionModal.error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                disabled={actionModal.loading}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModeration}
                disabled={actionModal.loading}
                style={{
                  background: 'linear-gradient(135deg, #15803D 0%, #22C55E 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: actionModal.loading ? 'not-allowed' : 'pointer'
                }}
              >
                {actionModal.loading ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT RESOLUTION MODAL */}
      {resolveModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#FF6B2C" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                  Resolve Abuse Report #{resolveModal.report?.id}
                </h3>
              </div>
              <button
                onClick={() => setResolveModal(prev => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div>
                <span style={{ color: 'var(--ws-text-muted)' }}>Report Reason:</span>{' '}
                <span style={{ color: '#F87171', fontWeight: 800 }}>{resolveModal.report?.reason}</span>
              </div>
              {resolveModal.report?.description && (
                <div style={{ color: 'var(--ws-text-secondary)', fontSize: '0.82rem' }}>
                  "{resolveModal.report.description}"
                </div>
              )}
            </div>

            {/* Resolution Action */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setResolveModal(prev => ({ ...prev, action: 'RESOLVE_AND_HIDE' }))}
                style={{
                  background: resolveModal.action === 'RESOLVE_AND_HIDE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: resolveModal.action === 'RESOLVE_AND_HIDE' ? '2px solid #EF4444' : '1px solid var(--ws-border)',
                  color: resolveModal.action === 'RESOLVE_AND_HIDE' ? '#F87171' : 'var(--ws-text-secondary)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Resolve & Hide Review
              </button>
              <button
                type="button"
                onClick={() => setResolveModal(prev => ({ ...prev, action: 'DISMISS' }))}
                style={{
                  background: resolveModal.action === 'DISMISS' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: resolveModal.action === 'DISMISS' ? '2px solid #94A3B8' : '1px solid var(--ws-border)',
                  color: resolveModal.action === 'DISMISS' ? '#E2E8F0' : 'var(--ws-text-secondary)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Dismiss Report
              </button>
            </div>

            {/* Admin Notes */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                Resolution Notes
              </label>
              <textarea
                value={resolveModal.adminNotes}
                onChange={e => setResolveModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                placeholder="Optional resolution notes recorded with this report..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--ws-bg)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {resolveModal.error && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem' }}>
                {resolveModal.error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setResolveModal(prev => ({ ...prev, isOpen: false }))}
                disabled={resolveModal.loading}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={resolveModal.loading}
                style={{
                  background: resolveModal.action === 'RESOLVE_AND_HIDE' ? '#EF4444' : '#3B82F6',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: resolveModal.loading ? 'not-allowed' : 'pointer'
                }}
              >
                {resolveModal.loading ? 'Processing...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
