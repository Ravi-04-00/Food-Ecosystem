import React, { useState, useEffect } from 'react';
import { 
  Star, X, Check, Store, Bike, Utensils, AlertCircle, 
  ShieldCheck, Loader2, Sparkles, CheckCircle2, Edit3 
} from 'lucide-react';
import { 
  fetchReviewEligibility, 
  createReview, 
  updateReview 
} from '../services/api.js';

export const FoodReviewModal = ({ isOpen, onClose, orderNumber, orderId, restaurantName }) => {
  const [lang, setLang] = useState('en'); // 'en' | 'ta'
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);

  // Active review target: 'RESTAURANT' | 'FOOD_ITEM' | 'DELIVERY_PARTNER'
  const [targetType, setTargetType] = useState('RESTAURANT');
  const [selectedFoodId, setSelectedFoodId] = useState(null);

  // Form fields
  const [rating, setRating] = useState(5);
  const [subRating, setSubRating] = useState(5); // food_quality, packaging, or delivery rating
  const [comment, setComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);

  const t = {
    en: {
      title: 'Verified Customer Feedback',
      subtitle: 'Share your verified experience to help other foodies',
      orderEligible: 'Verified Completed Delivery',
      ineligible: 'Order is not eligible for review yet.',
      tabRestaurant: 'Restaurant',
      tabFood: 'Ordered Food',
      tabDelivery: 'Rider & Delivery',
      ratingPrompt: 'Overall Rating',
      packagingPrompt: 'Packaging & Temperature (1-5★)',
      foodQualityPrompt: 'Taste & Food Quality (1-5★)',
      deliveryPrompt: 'Delivery Speed & Courtesy (1-5★)',
      commentPlaceholder: 'Tell us what you loved or how we can improve (optional, max 1000 characters)...',
      submitBtn: 'Submit Verified Review',
      updateBtn: 'Update Review',
      alreadyReviewed: 'You have already reviewed this target',
      editAction: 'Edit',
      verifiedBadge: 'Verified Purchase',
      successMsg: 'Thank you! Your verified review has been recorded.'
    },
    ta: {
      title: 'உறுதிப்படுத்தப்பட்ட வாடிக்கையாளர் மதிப்பீடு',
      subtitle: 'உங்கள் உண்மையான அனுபவத்தைப் பகிர்ந்து மற்றவர்களுக்கு உதவுங்கள்',
      orderEligible: 'வெற்றிகரமாக டெலிவரி செய்யப்பட்டது',
      ineligible: 'இந்த ஆர்டரை இப்போது மதிப்பாய்வு செய்ய முடியாது.',
      tabRestaurant: 'உணவகம்',
      tabFood: 'உணவு வகை',
      tabDelivery: 'டெலிவரி பார்ட்னர்',
      ratingPrompt: 'மொத்த மதிப்பீடு',
      packagingPrompt: 'பேக்கிங் தரம் (1-5★)',
      foodQualityPrompt: 'சுவை & உணவின் தரம் (1-5★)',
      deliveryPrompt: 'டெலிவரி வேகம் & நடத்தை (1-5★)',
      commentPlaceholder: 'உங்கள் அனுபவத்தை எழுதுங்கள் (அதிகபட்சம் 1000 எழுத்துக்கள்)...',
      submitBtn: 'மதிப்பாய்வைச் சமர்ப்பிக்கவும்',
      updateBtn: 'மதிப்பாய்வை மாற்றியமைக்கவும்',
      alreadyReviewed: 'நீங்கள் ஏற்கனவே மதிப்பாய்வு செய்துள்ளீர்கள்',
      editAction: 'திருத்து',
      verifiedBadge: 'சரிபார்க்கப்பட்ட கொள்முதல்',
      successMsg: 'நன்றி! உங்கள் மதிப்பாய்வு வெற்றிகரமாக பதிவு செய்யப்பட்டது.'
    }
  }[lang];

  // Load Eligibility when modal opens
  const loadEligibility = async () => {
    if (!orderId && !orderNumber) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviewEligibility(orderId || orderNumber);
      setEligibility(data);
      if (data?.order?.items?.length > 0) {
        setSelectedFoodId(data.order.items[0].food_item_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify review eligibility.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEligibility();
      setFeedbackSuccess(null);
      setRating(5);
      setSubRating(5);
      setComment('');
      setEditingReviewId(null);
    }
  }, [isOpen, orderId, orderNumber]);

  // Sync form when target or item changes
  useEffect(() => {
    if (!eligibility?.order) return;

    if (targetType === 'RESTAURANT') {
      const restReview = eligibility.order.restaurant?.review;
      if (restReview) {
        setRating(restReview.rating || 5);
        setSubRating(restReview.packaging_rating || 5);
        setComment(restReview.comment || '');
        setEditingReviewId(restReview.id);
      } else {
        setRating(5);
        setSubRating(5);
        setComment('');
        setEditingReviewId(null);
      }
    } else if (targetType === 'FOOD_ITEM') {
      const itemObj = eligibility.order.items?.find(it => it.food_item_id === selectedFoodId);
      if (itemObj?.review) {
        setRating(itemObj.review.rating || 5);
        setSubRating(itemObj.review.food_quality_rating || 5);
        setComment(itemObj.review.comment || '');
        setEditingReviewId(itemObj.review.id);
      } else {
        setRating(5);
        setSubRating(5);
        setComment('');
        setEditingReviewId(null);
      }
    } else if (targetType === 'DELIVERY_PARTNER') {
      const riderReview = eligibility.order.delivery_partner?.review;
      if (riderReview) {
        setRating(riderReview.rating || 5);
        setSubRating(riderReview.delivery_rating || 5);
        setComment(riderReview.comment || '');
        setEditingReviewId(riderReview.id);
      } else {
        setRating(5);
        setSubRating(5);
        setComment('');
        setEditingReviewId(null);
      }
    }
  }, [targetType, selectedFoodId, eligibility]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setFeedbackSuccess(null);

    try {
      if (editingReviewId) {
        // Update existing review
        const payload = {
          rating,
          comment,
          language: lang
        };
        if (targetType === 'FOOD_ITEM') payload.food_quality_rating = subRating;
        else if (targetType === 'RESTAURANT') payload.packaging_rating = subRating;
        else if (targetType === 'DELIVERY_PARTNER') payload.delivery_rating = subRating;

        await updateReview(editingReviewId, payload);
        setFeedbackSuccess(t.successMsg);
        await loadEligibility();
      } else {
        // Create new review
        const payload = {
          order_id: eligibility.order.id,
          target_type: targetType,
          rating,
          comment,
          language: lang
        };

        if (targetType === 'FOOD_ITEM') {
          payload.product_id = selectedFoodId;
          payload.food_quality_rating = subRating;
        } else if (targetType === 'RESTAURANT') {
          payload.restaurant_id = eligibility.order.restaurant?.restaurant_id;
          payload.packaging_rating = subRating;
        } else if (targetType === 'DELIVERY_PARTNER') {
          payload.delivery_partner_id = eligibility.order.delivery_partner?.rider_id;
          payload.delivery_rating = subRating;
        }

        await createReview(payload);
        setFeedbackSuccess(t.successMsg);
        await loadEligibility();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const order = eligibility?.order;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 20, 15, 0.78)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--ws-surface, #FFFFFF)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border, #E2E8F0)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: 'var(--ws-text-primary, #0F172A)'
      }}>
        {/* Top Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Language Switch */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--ws-surface-subtle, #F1F5F9)', padding: '3px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                border: 'none',
                background: lang === 'en' ? '#22C55E' : 'transparent',
                color: lang === 'en' ? '#FFFFFF' : 'var(--ws-text-muted, #64748B)',
                fontWeight: 800,
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ta')}
              style={{
                border: 'none',
                background: lang === 'ta' ? '#22C55E' : 'transparent',
                color: lang === 'ta' ? '#FFFFFF' : 'var(--ws-text-muted, #64748B)',
                fontWeight: 800,
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              தமிழ்
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--ws-surface-subtle, #F1F5F9)',
              border: 'none',
              borderRadius: '10px',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--ws-text-muted, #64748B)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Verified Badge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={18} color="#22C55E" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.verifiedBadge} • Order #{order?.order_number || orderNumber}
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '2px 0 4px 0' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted, #64748B)', margin: 0 }}>
            {restaurantName || order?.restaurant?.name ? `${restaurantName || order?.restaurant?.name} • ` : ''}{t.subtitle}
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} color="#22C55E" />
            <span style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>Verifying order status with kitchen vault...</span>
          </div>
        )}

        {/* Ineligible Order State */}
        {!loading && eligibility && !eligibility.is_eligible && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertCircle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.9rem' }}>
                {t.ineligible}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', marginTop: '4px' }}>
                {eligibility.reason}
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Feedback */}
        {feedbackSuccess && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: '#15803D',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#15803D" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {/* Eligible Review Form */}
        {!loading && eligibility?.is_eligible && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Target Switcher Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'var(--ws-surface-subtle, #F1F5F9)', padding: '4px', borderRadius: '14px' }}>
              <button
                type="button"
                onClick={() => setTargetType('RESTAURANT')}
                style={{
                  border: 'none',
                  background: targetType === 'RESTAURANT' ? 'var(--ws-surface, #FFFFFF)' : 'transparent',
                  color: targetType === 'RESTAURANT' ? '#15803D' : 'var(--ws-text-muted)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: targetType === 'RESTAURANT' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Store size={14} />
                <span>{t.tabRestaurant}</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('FOOD_ITEM')}
                style={{
                  border: 'none',
                  background: targetType === 'FOOD_ITEM' ? 'var(--ws-surface, #FFFFFF)' : 'transparent',
                  color: targetType === 'FOOD_ITEM' ? '#15803D' : 'var(--ws-text-muted)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: targetType === 'FOOD_ITEM' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Utensils size={14} />
                <span>{t.tabFood}</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('DELIVERY_PARTNER')}
                style={{
                  border: 'none',
                  background: targetType === 'DELIVERY_PARTNER' ? 'var(--ws-surface, #FFFFFF)' : 'transparent',
                  color: targetType === 'DELIVERY_PARTNER' ? '#15803D' : 'var(--ws-text-muted)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: targetType === 'DELIVERY_PARTNER' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Bike size={14} />
                <span>{t.tabDelivery}</span>
              </button>
            </div>

            {/* Food Item Selector if FOOD_ITEM active */}
            {targetType === 'FOOD_ITEM' && order?.items?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-secondary)' }}>
                  SELECT PURCHASED ITEM:
                </span>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {order.items.map(item => (
                    <button
                      key={item.food_item_id}
                      type="button"
                      onClick={() => setSelectedFoodId(item.food_item_id)}
                      style={{
                        flexShrink: 0,
                        border: selectedFoodId === item.food_item_id ? '2px solid #22C55E' : '1px solid var(--ws-border)',
                        background: selectedFoodId === item.food_item_id ? 'rgba(34, 197, 94, 0.1)' : 'var(--ws-surface-subtle)',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: selectedFoodId === item.food_item_id ? '#15803D' : 'var(--ws-text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{item.food_name}</span>
                      {item.already_reviewed && (
                        <span style={{ background: '#22C55E', color: '#FFF', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editing Existing Review Notice */}
            {editingReviewId && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Edit3 size={14} />
                <span>{t.alreadyReviewed} — editing review #{editingReviewId}</span>
              </div>
            )}

            {/* Star Rating Control */}
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-secondary)', marginBottom: '8px' }}>
                {t.ratingPrompt} ({rating} / 5 ★)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star
                      size={36}
                      fill={star <= rating ? '#F59E0B' : 'none'}
                      color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Rating (Quality / Packaging / Delivery) */}
            <div style={{ background: 'var(--ws-surface-subtle)', padding: '12px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                {targetType === 'FOOD_ITEM' && t.foodQualityPrompt}
                {targetType === 'RESTAURANT' && t.packagingPrompt}
                {targetType === 'DELIVERY_PARTNER' && t.deliveryPrompt}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubRating(s)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <Star
                      size={20}
                      fill={s <= subRating ? '#F59E0B' : 'none'}
                      color={s <= subRating ? '#F59E0B' : '#CBD5E1'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                placeholder={t.commentPlaceholder}
                rows={3}
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  border: '1px solid var(--ws-border)',
                  padding: '12px 14px',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  background: 'var(--ws-bg)',
                  color: 'var(--ws-text-primary)',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                {comment.length} / 1000
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>{editingReviewId ? t.updateBtn : t.submitBtn}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
