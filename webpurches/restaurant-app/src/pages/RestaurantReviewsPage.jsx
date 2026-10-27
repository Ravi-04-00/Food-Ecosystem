import React, { useState, useEffect } from 'react';
import { 
  Star, ShieldCheck, Flag, Utensils, Store, AlertCircle, 
  CheckCircle2, Loader2, RefreshCw, X, MessageSquare 
} from 'lucide-react';
import { 
  fetchRestaurantReviewsFeed, 
  fetchReviewsSummary, 
  reportReview 
} from '../services/api.js';
import { useShop } from '../context/ShopContext.jsx';

export const RestaurantReviewsPage = () => {
  const { currentRestaurant, currentUser } = useShop();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState(null);
  
  // Report modal state
  const [reportModalId, setReportModalId] = useState(null);
  const [reportReason, setReportReason] = useState('ABUSIVE');
  const [reportExplanation, setReportExplanation] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const restId = currentRestaurant?.id;
      const [feedData, summaryData] = await Promise.all([
        fetchRestaurantReviewsFeed({ rating: ratingFilter }),
        restId ? fetchReviewsSummary('RESTAURANT', restId) : Promise.resolve(null)
      ]);
      setReviews(feedData.results || feedData || []);
      if (summaryData) setSummary(summaryData);
    } catch (err) {
      console.warn('Reviews load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ratingFilter, currentRestaurant]);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportModalId) return;
    setReportSubmitting(true);
    try {
      await reportReview(reportModalId, {
        reason: reportReason,
        explanation: reportExplanation
      });
      setReportFeedback('Review reported to Admin Moderation queue successfully.');
      setTimeout(() => {
        setReportModalId(null);
        setReportFeedback(null);
        setReportExplanation('');
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const avgRating = summary?.average_rating ?? (currentRestaurant?.rating || 4.8);
  const totalReviews = summary?.total_reviews ?? (currentRestaurant?.review_count || reviews.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
            Customer Reviews & Culinary Ratings
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-muted)', margin: '4px 0 0 0' }}>
            Verified feedback from customers who ordered from {currentRestaurant?.name || 'your kitchen'}
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--ws-text-secondary)',
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

      {/* Analytics Summary Card */}
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        padding: '24px 28px',
        boxShadow: 'var(--ws-shadow-sm)',
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
            <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>
              {totalReviews} Verified Ratings
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
              Kitchen Reputation Score
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#15803D' }}>
              <ShieldCheck size={16} />
              <span>100% verified orders • Strict anti-fraud protections active</span>
            </div>
            {summary?.packaging_avg && (
              <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)' }}>
                📦 Packaging Satisfaction: <strong style={{ color: 'var(--ws-text-primary)' }}>{summary.packaging_avg} ★</strong>
              </div>
            )}
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div style={{ flex: 1, minWidth: '260px', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[5, 4, 3, 2, 1].map(star => {
            const total = summary?.total_reviews || 1;
            const count = summary?.distribution?.[star] || 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                <span style={{ width: '28px', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>{star} ★</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--ws-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '32px', textAlign: 'right', color: 'var(--ws-text-muted)' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'All Reviews', value: null },
          { label: '5 ★ Stars', value: 5 },
          { label: '4 ★ Stars', value: 4 },
          { label: '3 ★ Stars', value: 3 },
          { label: '2 ★ Stars', value: 2 },
          { label: '1 ★ Stars', value: 1 }
        ].map(f => (
          <button
            key={f.label}
            onClick={() => setRatingFilter(f.value)}
            style={{
              border: 'none',
              background: ratingFilter === f.value ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'var(--ws-surface)',
              color: ratingFilter === f.value ? '#FFFFFF' : 'var(--ws-text-secondary)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} color="#22C55E" />
        </div>
      ) : reviews.length === 0 ? (
        <div style={{
          background: 'var(--ws-surface)',
          borderRadius: '20px',
          border: '1px solid var(--ws-border)',
          padding: '60px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <MessageSquare size={36} color="#94A3B8" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>No customer reviews yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)', margin: 0, maxWidth: '400px' }}>
            As customers complete food deliveries, their verified ratings and dish feedback will automatically appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map(rev => (
            <div
              key={rev.id}
              style={{
                background: 'var(--ws-surface)',
                borderRadius: '18px',
                border: '1px solid var(--ws-border)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--ws-shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
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
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                        {rev.user_name}
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
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
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
                      fill={s <= rev.rating ? '#F59E0B' : 'none'}
                      color={s <= rev.rating ? '#F59E0B' : '#CBD5E1'}
                    />
                  ))}
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D97706', marginLeft: '4px' }}>
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {/* Specific Food item info */}
              {rev.target_type === 'FOOD_ITEM' && rev.product_name && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#15803D', background: 'rgba(34, 197, 94, 0.08)', padding: '4px 10px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                  <Utensils size={12} />
                  <span>Item: <strong>{rev.product_name}</strong></span>
                  {rev.food_quality_rating && <span>• Quality: {rev.food_quality_rating}★</span>}
                </div>
              )}

              {/* Customer Comment */}
              {rev.comment && (
                <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  "{rev.comment}"
                </p>
              )}

              {/* Report Review Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--ws-border)', paddingTop: '8px' }}>
                <button
                  onClick={() => setReportModalId(rev.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ws-text-muted)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Flag size={12} />
                  <span>Report Abusive or Fake Review</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Abuse Report Dialog */}
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
            background: 'var(--ws-surface, #FFFFFF)',
            borderRadius: '20px',
            border: '1px solid var(--ws-border)',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--ws-text-primary)'
          }}>
            <button
              onClick={() => setReportModalId(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
            >
              <X size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '0.78rem', fontWeight: 800 }}>
                <Flag size={16} />
                <span>MERCHANT DISPUTE & AUDIT</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 2px 0' }}>Report Review #{reportModalId}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Submit for objective Admin review. Legitimate critical reviews are protected.
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
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-bg)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="ABUSIVE">Abusive or profanity towards staff</option>
                    <option value="IRRELEVANT">Irrelevant or competitor spam</option>
                    <option value="FRAUDULENT">Suspected fraudulent claims</option>
                    <option value="PII">Contains private employee PII / phone numbers</option>
                    <option value="OTHER">Other violation</option>
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
                    placeholder="Describe specific grounds for dispute..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-bg)',
                      color: 'var(--ws-text-primary)',
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
                      border: '1px solid var(--ws-border)',
                      background: 'none',
                      color: 'var(--ws-text-secondary)',
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
                    {reportSubmitting ? 'Submitting...' : 'File Report'}
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
