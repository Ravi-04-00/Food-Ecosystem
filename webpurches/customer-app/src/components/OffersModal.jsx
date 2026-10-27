import React, { useState, useEffect, useCallback } from 'react';
import { X, Tag, Sparkles, AlertCircle, CheckCircle2, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchActiveOffers } from '../services/api.js';

export const OffersModal = ({ isOpen, onClose, onApplyCode, currentSubtotal = 0, restaurantId = null }) => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActiveOffers(currentSubtotal, restaurantId);
      setOffers(data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError(err.message || 'Unable to retrieve available offers.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSubtotal, restaurantId]);

  useEffect(() => {
    if (isOpen) {
      loadOffers();
    }
  }, [isOpen, loadOffers]);

  if (!isOpen) return null;

  const handleApply = (code) => {
    setCopiedCode(code);
    if (onApplyCode) onApplyCode(code);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(6, 40, 23, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: '0 24px 60px rgba(6, 40, 23, 0.25)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#22C55E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Tag size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                Coupons & Smart Offers
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)' }}>
                உடனடி தள்ளுபடி • Real PostgreSQL validated discounts
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid var(--ws-border)',
              background: 'var(--ws-surface)',
              color: 'var(--ws-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 10px' }} />
              <div>Checking eligible offers with server...</div>
            </div>
          ) : error ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              color: '#F87171',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          ) : offers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <Tag size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>No Active Offers Right Now</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Check back soon for festive and seasonal restaurant discounts!</div>
            </div>
          ) : (
            offers.map(offer => {
              const elig = offer.eligibility;
              const isEligible = elig ? elig.is_eligible : true;

              return (
                <div key={offer.code} style={{
                  border: isEligible ? '1.5px dashed #22C55E' : '1.5px dashed var(--ws-border)',
                  borderRadius: '18px',
                  padding: '18px',
                  background: isEligible ? 'rgba(34, 197, 94, 0.04)' : 'var(--ws-surface-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative'
                }}>
                  {/* Top Bar: Code & Apply Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          letterSpacing: '1px',
                          color: '#16A34A',
                          background: 'rgba(34, 197, 94, 0.15)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          {offer.code}
                        </span>
                        {offer.first_order_only && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#FF6B2C',
                            background: 'rgba(255, 107, 44, 0.12)',
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}>
                            FIRST ORDER
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--ws-text-primary)', marginTop: '8px' }}>
                        {offer.title || offer.formatted_discount}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApply(offer.code)}
                      disabled={!isEligible}
                      style={{
                        background: copiedCode === offer.code 
                          ? '#10B981' 
                          : isEligible 
                            ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' 
                            : 'var(--ws-border)',
                        color: isEligible ? '#FFFFFF' : 'var(--ws-text-muted)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: isEligible ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: isEligible ? '0 2px 8px rgba(34, 197, 94, 0.25)' : 'none'
                      }}
                    >
                      {copiedCode === offer.code ? 'APPLIED ✓' : isEligible ? 'APPLY CODE' : 'INELIGIBLE'}
                    </button>
                  </div>

                  {/* Description */}
                  {offer.description && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', lineHeight: 1.4 }}>
                      {offer.description}
                    </div>
                  )}

                  {/* Eligibility / Potential Discount Feedback */}
                  {elig && (
                    <div style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      background: isEligible ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isEligible ? '#16A34A' : '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {isEligible ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Saves ₹{elig.potential_discount.toFixed(2)} on this order!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} />
                          <span>{elig.error_message}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Footer Terms */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--ws-text-muted)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderTop: '1px solid var(--ws-border)',
                    paddingTop: '8px',
                    alignItems: 'center'
                  }}>
                    <span>Min Order: ₹{Number(offer.min_order_value).toFixed(0)}</span>
                    <span>•</span>
                    {offer.discount_type === 'PERCENTAGE' && (
                      <>
                        <span>Max Cap: ₹{Number(offer.max_discount_amount).toFixed(0)}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{offer.expiry_date ? `Expires ${new Date(offer.expiry_date).toLocaleDateString()}` : 'Valid anytime'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
