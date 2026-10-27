import React, { useState, useEffect } from 'react';
import { 
  Star, ShieldCheck, Flag, Bike, AlertCircle, 
  CheckCircle2, Loader2, RefreshCw, X, MessageSquare, ShieldAlert
} from 'lucide-react';
import { 
  fetchDeliveryPartnerReviewsFeed, 
  reportReview 
} from '../services/api.js';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const DeliveryFeedbackPage = () => {
  const { currentRider, partnerProfile } = useDelivery();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Report dispute modal state
  const [reportModalId, setReportModalId] = useState(null);
  const [reportReason, setReportReason] = useState('ABUSIVE');
  const [reportExplanation, setReportExplanation] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDeliveryPartnerReviewsFeed();
      setReviews(data.results || data || []);
    } catch (err) {
      console.warn('Delivery reviews feed load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportModalId) return;
    setReportSubmitting(true);
    try {
      await reportReview(reportModalId, {
        reason: reportReason,
        explanation: reportExplanation
      });
      setReportFeedback('Dispute submitted to Admin safety team. You will be notified of the review outcome.');
      setTimeout(() => {
        setReportModalId(null);
        setReportFeedback(null);
        setReportExplanation('');
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to submit dispute');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Calculate aggregates from permitted feedback
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.delivery_rating || r.rating || 5), 0) / totalReviews).toFixed(2)
    : (partnerProfile?.rating || '4.95');

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const s = Math.round(r.delivery_rating || r.rating || 5);
    if (ratingCounts[s] !== undefined) ratingCounts[s] += 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--bp-text-primary, #111827)', margin: 0 }}>
            Delivery Ratings & Feedback
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--bp-text-muted, #6B7280)', margin: '4px 0 0 0' }}>
            Customer ratings for your completed trips • Privacy protected
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            background: 'var(--bp-surface, #FFFFFF)',
            border: '1px solid var(--bp-border, #E5E7EB)',
            borderRadius: '12px',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--bp-text-secondary, #4B5563)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Privacy Guarantee Banner */}
      <div style={{
        background: 'rgba(34, 197, 94, 0.08)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldCheck size={20} color="#15803D" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#166534' }}>
          <strong>Partner Privacy Shield:</strong> Customer personal coordinates, phone numbers, and full addresses are withheld. Only delivery experience scores and respectful feedback are surfaced.
        </div>
      </div>

      {/* Analytics Summary Card */}
      <div style={{
        background: 'var(--bp-surface, #FFFFFF)',
        borderRadius: '24px',
        border: '1px solid var(--bp-border, #E5E7EB)',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '20px 24px',
            textAlign: 'center',
            minWidth: '130px'
          }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#D97706', lineHeight: 1 }}>
              {avgRating}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', margin: '6px 0 4px 0' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round(Number(avgRating)) ? '#F59E0B' : 'none'}
                  color="#F59E0B"
                />
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--bp-text-muted, #6B7280)', fontWeight: 700 }}>
              {totalReviews} Trip Reviews
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--bp-text-primary, #111827)' }}>
              Fleet Performance Standing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#15803D' }}>
              <ShieldCheck size={16} />
              <span>Elite Partner Rating (98% Satisfaction Rating)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--bp-text-muted, #6B7280)' }}>
              High customer ratings unlock bonus batch dispatches & fuel incentives.
            </div>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div style={{ flex: 1, minWidth: '260px', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingCounts[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                <span style={{ width: '28px', fontWeight: 700, color: 'var(--bp-text-secondary, #4B5563)' }}>{star} ★</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--bp-surface-subtle, #F3F4F6)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '28px', textAlign: 'right', color: 'var(--bp-text-muted, #6B7280)' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} color="#22C55E" />
        </div>
      ) : reviews.length === 0 ? (
        <div style={{
          background: 'var(--bp-surface, #FFFFFF)',
          borderRadius: '20px',
          border: '1px solid var(--bp-border, #E5E7EB)',
          padding: '60px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <MessageSquare size={36} color="#9CA3AF" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>No delivery reviews yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--bp-text-muted, #6B7280)', margin: 0, maxWidth: '420px' }}>
            When customers rate their delivery experience upon OTP confirmation, their verified feedback will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map(rev => (
            <div
              key={rev.id}
              style={{
                background: 'var(--bp-surface, #FFFFFF)',
                borderRadius: '18px',
                border: '1px solid var(--bp-border, #E5E7EB)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                    color: '#FFF',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {rev.user_name?.[0] || 'C'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--bp-text-primary, #111827)' }}>
                        {rev.user_name || 'Customer'}
                      </span>
                      {rev.is_verified_purchase && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: 'rgba(34, 197, 94, 0.12)',
                          color: '#15803D',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldCheck size={11} color="#15803D" />
                          <span>Delivered Order</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--bp-text-muted, #6B7280)', marginTop: '2px' }}>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                      {rev.order_number ? ` • Order #${rev.order_number}` : ''}
                    </div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={15}
                      fill={s <= (rev.delivery_rating || rev.rating || 5) ? '#F59E0B' : 'none'}
                      color={s <= (rev.delivery_rating || rev.rating || 5) ? '#F59E0B' : '#D1D5DB'}
                    />
                  ))}
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D97706', marginLeft: '4px' }}>
                    {(rev.delivery_rating || rev.rating || 5)}.0
                  </span>
                </div>
              </div>

              {/* Customer Comment */}
              {rev.comment && (
                <p style={{ fontSize: '0.85rem', color: 'var(--bp-text-secondary, #4B5563)', lineHeight: 1.5, margin: 0 }}>
                  "{rev.comment}"
                </p>
              )}

              {/* Dispute Feedback Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--bp-border, #E5E7EB)', paddingTop: '8px' }}>
                <button
                  onClick={() => setReportModalId(rev.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--bp-text-muted, #6B7280)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Flag size={12} />
                  <span>Report Unfair or Abusive Feedback</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispute Modal */}
      {reportModalId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bp-surface, #FFFFFF)',
            borderRadius: '20px',
            border: '1px solid var(--bp-border, #E5E7EB)',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--bp-text-primary, #111827)'
          }}>
            <button
              onClick={() => setReportModalId(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bp-text-muted, #6B7280)' }}
            >
              <X size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '0.78rem', fontWeight: 800 }}>
                <ShieldAlert size={16} />
                <span>RIDER DISPUTE APPEAL</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 2px 0' }}>Report Review #{reportModalId}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--bp-text-muted, #6B7280)', margin: 0 }}>
                File a report if this feedback contains abusive language or was penalised for kitchen delays.
              </p>
            </div>

            {reportFeedback ? (
              <div style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#15803D', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                {reportFeedback}
              </div>
            ) : (
              <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Reason:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--bp-border, #E5E7EB)',
                      background: 'var(--bp-bg, #F9FAFB)',
                      color: 'var(--bp-text-primary, #111827)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="ABUSIVE">Abusive or discriminatory language</option>
                    <option value="IRRELEVANT">Complaining about food taste instead of delivery</option>
                    <option value="FRAUDULENT">False claim / delivery was verified on time</option>
                    <option value="PII">Includes phone number or private info</option>
                    <option value="OTHER">Other dispute</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Explanation:
                  </label>
                  <textarea
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Explain the incident for dispatcher review..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--bp-border, #E5E7EB)',
                      background: 'var(--bp-bg, #F9FAFB)',
                      color: 'var(--bp-text-primary, #111827)',
                      fontSize: '0.82rem',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setReportModalId(null)}
                    style={{
                      border: '1px solid var(--bp-border, #E5E7EB)',
                      background: 'none',
                      color: 'var(--bp-text-secondary, #4B5563)',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    style={{
                      border: 'none',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: reportSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Appeal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
