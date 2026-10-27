import React, { useState, useEffect, useCallback } from 'react';
import { 
  Tag, 
  Sparkles, 
  Gift, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Award, 
  ArrowRight,
  TrendingUp,
  Percent,
  History,
  ShieldCheck
} from 'lucide-react';
import { fetchActiveOffers, fetchCustomerLoyalty } from '../services/api.js';
import { useCustomer } from '../context/CustomerContext.jsx';

export const OffersPage = ({ onApplyCouponToCart, onGoToCart }) => {
  const { currentUser, authState } = useCustomer();
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'loyalty'

  // Offers state
  const [offers, setOffers] = useState([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  // Loyalty state
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState(null);

  const loadOffers = useCallback(async () => {
    setIsOffersLoading(true);
    setOffersError(null);
    try {
      const data = await fetchActiveOffers();
      setOffers(data || []);
    } catch (err) {
      setOffersError(err.message || 'Failed to load offers.');
    } finally {
      setIsOffersLoading(false);
    }
  }, []);

  const loadLoyalty = useCallback(async () => {
    setIsLoyaltyLoading(true);
    setLoyaltyError(null);
    try {
      const data = await fetchCustomerLoyalty();
      setLoyaltyData(data);
    } catch (err) {
      setLoyaltyError(err.message || 'Failed to load loyalty rewards.');
    } finally {
      setIsLoyaltyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
    if (currentUser || authState?.isAuthenticated) {
      loadLoyalty();
    }
  }, [currentUser, authState, loadOffers, loadLoyalty]);

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    if (onApplyCouponToCart) {
      onApplyCouponToCart(code);
    }
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const profile = loyaltyData?.profile;
  const history = loyaltyData?.history || [];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 20px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '24px',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16A34A', letterSpacing: '1px', textTransform: 'uppercase' }}>
            PROMOTIONS & LOYALTY REWARDS • ஆஃபர்கள் & லாயல்டி
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '6px 0 0' }}>
            Smart Savings & Rewards Center
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', margin: '4px 0 0' }}>
            Live PostgreSQL-verified discounts, order cash savings, and VIP dining perks.
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--ws-surface)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--ws-border)'
        }}>
          <button
            onClick={() => setActiveTab('offers')}
            style={{
              background: activeTab === 'offers' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'transparent',
              color: activeTab === 'offers' ? '#FFFFFF' : 'var(--ws-text-muted)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Tag size={16} />
            <span>Coupons ({offers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            style={{
              background: activeTab === 'loyalty' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'transparent',
              color: activeTab === 'loyalty' ? '#FFFFFF' : 'var(--ws-text-muted)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Award size={16} />
            <span>Loyalty Points {profile ? `(${profile.points} pts)` : ''}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE OFFERS & COUPONS */}
      {activeTab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isOffersLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px' }} />
              <div>Fetching verified promotional codes...</div>
            </div>
          ) : offersError ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              color: '#F87171'
            }}>
              {offersError}
            </div>
          ) : offers.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--ws-text-muted)'
            }}>
              <Tag size={44} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ws-text-primary)' }}>No Active Coupons Currently</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Check back later for flash discounts and weekend promotions.</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: '18px'
            }}>
              {offers.map(offer => (
                <div key={offer.code} style={{
                  background: 'var(--ws-surface)',
                  border: '1.5px solid var(--ws-border)',
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--ws-shadow-sm)',
                  position: 'relative'
                }}>
                  <div>
                    {/* Top Row: Code Pill & Type */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        color: '#16A34A',
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px dashed #22C55E',
                        padding: '4px 12px',
                        borderRadius: '10px'
                      }}>
                        {offer.code}
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: offer.discount_type === 'PERCENTAGE' ? '#3B82F6' : '#FF6B2C',
                        background: offer.discount_type === 'PERCENTAGE' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 107, 44, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {offer.discount_type === 'PERCENTAGE' ? 'PERCENTAGE OFF' : 'FLAT DISCOUNT'}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '14px 0 6px' }}>
                      {offer.title || offer.formatted_discount}
                    </h3>

                    <p style={{ fontSize: '0.84rem', color: 'var(--ws-text-secondary)', margin: '0 0 14px', lineHeight: 1.45 }}>
                      {offer.description || 'Valid on select kitchen items and standard delivery orders.'}
                    </p>

                    {/* Conditions */}
                    <div style={{
                      background: 'var(--ws-surface-subtle)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '0.76rem',
                      color: 'var(--ws-text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Minimum Order Subtotal:</span>
                        <strong style={{ color: 'var(--ws-text-primary)' }}>₹{Number(offer.min_order_value).toFixed(0)}</strong>
                      </div>
                      {offer.discount_type === 'PERCENTAGE' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Maximum Discount Cap:</span>
                          <strong style={{ color: 'var(--ws-text-primary)' }}>₹{Number(offer.max_discount_amount).toFixed(0)}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Validity Window:</span>
                        <strong style={{ color: 'var(--ws-text-primary)' }}>
                          {offer.expiry_date ? `Ends ${new Date(offer.expiry_date).toLocaleDateString()}` : 'Always Active'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      style={{
                        flex: 1,
                        background: copiedCode === offer.code 
                          ? '#10B981' 
                          : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
                      }}
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check size={16} />
                          <span>COPIED TO CART ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>COPY & APPLY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOYALTY POINTS & VIP REWARDS */}
      {activeTab === 'loyalty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {isLoyaltyLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px' }} />
              <div>Loading loyalty profile and points ledger...</div>
            </div>
          ) : !profile ? (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--ws-text-muted)'
            }}>
              <Award size={44} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ws-text-primary)' }}>Sign In to View Loyalty Rewards</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Every meal you order earns real points redeemable for discounts on checkout.</div>
            </div>
          ) : (
            <>
              {/* VIP Profile Card */}
              <div style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '24px',
                padding: '28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                boxShadow: 'var(--ws-shadow-sm)'
              }}>
                {/* Available Points */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
                    Available Points Balance
                  </span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#16A34A', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span>{profile.points}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>PTS</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
                    Equivalent to <strong>₹{profile.inr_value.toFixed(2)}</strong> discount
                  </div>
                </div>

                {/* VIP Tier */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
                    Current VIP Tier
                  </span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FBBF24', marginTop: '4px' }}>
                    {profile.tier}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)' }}>
                    {profile.lifetime_orders} lifetime orders completed
                  </div>
                </div>

                {/* Lifetime Savings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
                    Total Savings to Date
                  </span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                    ₹{Number(profile.total_saved).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 700 }}>
                    Saved via Fast Delivery Rewards
                  </div>
                </div>

                {/* Earning & Redemption Policy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>
                    Program Conversion Rate
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginTop: '6px' }}>
                    1 Pt = ₹{profile.points_to_inr_rate.toFixed(2)} Discount
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)' }}>
                    {profile.earn_rate_description}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    Min {profile.min_points_to_redeem} pts required to redeem
                  </div>
                </div>
              </div>

              {/* Points Ledger Transactions */}
              <div style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--ws-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <History size={18} color="#16A34A" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                    Points Activity Ledger
                  </h3>
                </div>

                {history.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                    No points transactions recorded yet. Complete an order to earn your first points!
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--ws-surface-subtle)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)' }}>
                          <th style={{ padding: '12px 18px', fontWeight: 800 }}>Date</th>
                          <th style={{ padding: '12px 18px', fontWeight: 800 }}>Type</th>
                          <th style={{ padding: '12px 18px', fontWeight: 800 }}>Description</th>
                          <th style={{ padding: '12px 18px', fontWeight: 800, textAlign: 'right' }}>Points</th>
                          <th style={{ padding: '12px 18px', fontWeight: 800, textAlign: 'right' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(entry => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                            <td style={{ padding: '12px 18px', color: 'var(--ws-text-muted)' }}>
                              {new Date(entry.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px 18px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: entry.transaction_type === 'AWARD' 
                                  ? 'rgba(34, 197, 94, 0.12)' 
                                  : entry.transaction_type === 'REDEEM' 
                                    ? 'rgba(59, 130, 246, 0.12)' 
                                    : 'rgba(239, 68, 68, 0.12)',
                                color: entry.transaction_type === 'AWARD' 
                                  ? '#16A34A' 
                                  : entry.transaction_type === 'REDEEM' 
                                    ? '#2563EB' 
                                    : '#DC2626'
                              }}>
                                {entry.transaction_type}
                              </span>
                            </td>
                            <td style={{ padding: '12px 18px', color: 'var(--ws-text-primary)' }}>
                              {entry.description}
                              {entry.order_number && (
                                <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                                  ({entry.order_number})
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: entry.points >= 0 ? '#16A34A' : '#EF4444' }}>
                              {entry.points >= 0 ? `+${entry.points}` : entry.points}
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                              {entry.balance_after} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
