import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Wallet, CreditCard, Sparkles, ArrowDownLeft, ArrowUpRight, 
  Gift, Copy, Check, ShieldCheck, RefreshCw, AlertCircle, 
  CheckCircle2, Share2, Award, ChevronRight, Zap
} from 'lucide-react';
import { 
  fetchCustomerWallet, 
  topupCustomerWallet, 
  fetchCustomerLoyalty 
} from '../services/api.js';

/**
 * Fast Delivery (FD) — Customer Wallet, Loyalty Points & Referral Rewards Modal
 * Integrates real wallet balance, 1-tap top-ups, auditable transaction ledger,
 * VIP loyalty tiers, and viral referral sharing.
 */
export const CustomerWalletModal = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'loyalty' | 'referral'
  
  // Wallet States
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [customTopup, setCustomTopup] = useState('');
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [txnFilter, setTxnFilter] = useState('ALL'); // 'ALL' | 'CREDIT' | 'DEBIT' | 'CASHBACK'

  // Loyalty States
  const [loyalty, setLoyalty] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Status & Feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Generate deterministic referral code from username
  const referralCode = currentUser?.username 
    ? `FD-${currentUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'VIP'}77`
    : 'FD-BONUS100';

  // Load Wallet Data
  const loadWallet = useCallback(async () => {
    if (!currentUser) return;
    setWalletLoading(true);
    try {
      const data = await fetchCustomerWallet();
      setWallet(data);
    } catch (err) {
      console.warn('Failed to fetch wallet:', err);
    } finally {
      setWalletLoading(false);
    }
  }, [currentUser]);

  // Load Loyalty Data
  const loadLoyalty = useCallback(async () => {
    if (!currentUser) return;
    setLoyaltyLoading(true);
    try {
      const data = await fetchCustomerLoyalty();
      setLoyalty(data);
    } catch (err) {
      console.warn('Failed to fetch loyalty:', err);
    } finally {
      setLoyaltyLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      loadWallet();
      loadLoyalty();
    }
  }, [isOpen, loadWallet, loadLoyalty]);

  // Handle 1-Tap Wallet Top-Up
  const handleTopup = async (amt) => {
    const amountToCharge = amt || (customTopup ? parseFloat(customTopup) : topupAmount);
    if (!amountToCharge || amountToCharge < 10) {
      setFeedback({ type: 'error', message: 'Minimum top-up amount is ₹10.' });
      return;
    }
    setIsTopupLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await topupCustomerWallet(amountToCharge, `Instant 1-Tap Wallet Top-up (₹${amountToCharge})`);
      setFeedback({ type: 'success', message: `₹${amountToCharge.toFixed(2)} added to your Fast Delivery Wallet successfully!` });
      setCustomTopup('');
      loadWallet();
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to complete wallet top-up.' });
    } finally {
      setIsTopupLoading(false);
    }
  };

  // Copy Referral Code & Link
  const handleCopyReferral = () => {
    const textToCopy = `Use my invite code ${referralCode} to get ₹100 OFF your first order on FD Foods! Order now: https://fdfoods.in/invite/${referralCode}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 3000);
  };

  if (!isOpen) return null;

  const balance = Number(wallet?.balance || 0);
  const transactions = wallet?.transactions || [];
  const filteredTxns = txnFilter === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.transaction_type === txnFilter);

  const loyaltyProfile = loyalty?.profile || {};
  const loyaltyHistory = loyalty?.history || [];
  const points = loyaltyProfile.points || 0;
  const inrValue = loyaltyProfile.inr_value || (points * 0.5);
  const tier = loyaltyProfile.tier || 'SILVER';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(6, 40, 23, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--ws-surface, #FFFFFF)',
        border: '1px solid var(--ws-border)',
        borderRadius: '28px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(27, 67, 50, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1B4332 0%, #52B788 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                FD Wallet & Rewards
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)' }}>
                Instant checkout balance, loyalty tier rewards & referral bonuses
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ws-text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--ws-border)',
          background: 'var(--ws-surface-subtle)',
          padding: '4px 16px',
          gap: '6px'
        }}>
          {[
            { id: 'wallet', label: 'Wallet Balance & Top-Up', icon: Wallet },
            { id: 'loyalty', label: 'Loyalty & VIP Perks', icon: Award },
            { id: 'referral', label: 'Refer & Earn ₹100', icon: Gift }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '10px',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#1B4332' : 'var(--ws-text-muted)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} color={isActive ? '#1B4332' : 'var(--ws-text-muted)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Feedback */}
          {feedback.message && (
            <div style={{
              background: feedback.type === 'success' ? 'rgba(27, 67, 50, 0.08)' : 'rgba(92, 26, 36, 0.08)',
              border: `1px solid ${feedback.type === 'success' ? '#1B4332' : '#5C1A24'}`,
              color: feedback.type === 'success' ? '#1B4332' : '#5C1A24',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700
            }}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: WALLET BALANCE & TOP-UP */}
          {activeTab === 'wallet' && (
            <>
              {/* Royal Balance Hero Card */}
              <div style={{
                background: 'linear-gradient(135deg, #163D2B 0%, #1B4332 50%, #2D6A4F 100%)',
                borderRadius: '24px',
                padding: '24px',
                color: '#FFFFFF',
                boxShadow: '0 12px 32px rgba(22, 61, 43, 0.28)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#B7E4C7', fontWeight: 800 }}>
                      FAST DELIVERY DIGITAL CASH
                    </span>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '6px 0 2px 0', letterSpacing: '-0.5px' }}>
                      ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#D8F3DC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="#52B788" />
                      <span>Encrypted balance • Instant 1-tap checkout enabled</span>
                    </div>
                  </div>

                  <button
                    onClick={loadWallet}
                    disabled={walletLoading}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={15} style={{ animation: walletLoading ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
              </div>

              {/* Quick Top-Up Presets */}
              <div style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                    Top-Up Wallet Instantly
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#1B4332', fontWeight: 700 }}>
                    ⚡ Zero transaction fees
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {[100, 250, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => handleTopup(amt)}
                      disabled={isTopupLoading}
                      style={{
                        padding: '10px',
                        background: '#FFFFFF',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: '#1B4332',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                      }}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Form */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="number"
                    placeholder="Enter custom amount (₹)"
                    value={customTopup}
                    onChange={e => setCustomTopup(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#FFFFFF',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleTopup()}
                    disabled={isTopupLoading || !customTopup}
                    style={{
                      padding: '10px 18px',
                      background: '#1B4332',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: (isTopupLoading || !customTopup) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isTopupLoading ? 'Adding...' : 'Top Up'}
                  </button>
                </div>
              </div>

              {/* Transaction Ledger */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ws-text-primary)' }}>
                    Transaction Ledger ({transactions.length})
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['ALL', 'CREDIT', 'DEBIT', 'CASHBACK'].map(f => (
                      <button
                        key={f}
                        onClick={() => setTxnFilter(f)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: txnFilter === f ? '#1B4332' : 'var(--ws-surface-subtle)',
                          color: txnFilter === f ? '#FFFFFF' : 'var(--ws-text-muted)'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTxns.length === 0 ? (
                  <div style={{
                    padding: '28px',
                    textAlign: 'center',
                    background: 'var(--ws-surface-subtle)',
                    borderRadius: '16px',
                    border: '1px dashed var(--ws-border)',
                    fontSize: '0.82rem',
                    color: 'var(--ws-text-muted)'
                  }}>
                    No wallet transactions recorded in this category yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredTxns.map((t, idx) => {
                      const isCredit = t.transaction_type === 'CREDIT' || t.transaction_type === 'CASHBACK' || t.transaction_type === 'REFUND';
                      return (
                        <div
                          key={t.id || idx}
                          style={{
                            background: 'var(--ws-surface-subtle)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '14px',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: isCredit ? 'rgba(27, 67, 50, 0.1)' : 'rgba(92, 26, 36, 0.1)',
                              color: isCredit ? '#1B4332' : '#5C1A24',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--ws-text-primary)' }}>
                                {t.description || (isCredit ? 'Wallet Top-up' : 'Food Order Checkout')}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                                {t.created_at ? new Date(t.created_at).toLocaleString() : 'Just now'} • {t.transaction_type}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            fontWeight: 900,
                            fontSize: '0.92rem',
                            color: isCredit ? '#1B4332' : '#5C1A24'
                          }}>
                            {isCredit ? '+' : '-'} ₹{Number(t.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: LOYALTY & VIP REWARDS */}
          {activeTab === 'loyalty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* VIP Tier Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1B4332 0%, #0F2D1F 100%)',
                borderRadius: '24px',
                padding: '24px',
                color: '#FFFFFF',
                boxShadow: '0 12px 32px rgba(22, 61, 43, 0.28)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'rgba(216, 243, 220, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      color: '#D8F3DC'
                    }}>
                      VIP STATUS: {tier}
                    </span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, margin: '8px 0 2px 0' }}>
                      {points} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Loyalty Pts</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#B7E4C7' }}>
                      Redeemable Value: ₹{Number(inrValue).toFixed(2)} at checkout (1 pt = ₹0.50)
                    </div>
                  </div>

                  <Award size={48} color="#F2C230" />
                </div>
              </div>

              {/* Tier Privileges Grid */}
              <div style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                  Your {tier} Membership Benefits
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Earn 1 Loyalty Point for every ₹10 spent on all restaurants',
                    'Redeem points directly on checkout for instant cash discounts',
                    'Priority delivery dispatch during peak dinner and weekend hours',
                    'Exclusive chef secret menu items & weekend coupon access'
                  ].map((perk, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--ws-text-secondary)' }}>
                      <Check size={14} color="#1B4332" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points Ledger History */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ws-text-primary)', marginBottom: '10px' }}>
                  Points Ledger ({loyaltyHistory.length})
                </div>

                {loyaltyHistory.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--ws-surface-subtle)',
                    borderRadius: '16px',
                    border: '1px dashed var(--ws-border)',
                    fontSize: '0.82rem',
                    color: 'var(--ws-text-muted)'
                  }}>
                    Complete your first food delivery order to start accumulating points!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loyaltyHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          background: 'var(--ws-surface-subtle)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ws-text-primary)' }}>
                            {item.description || item.transaction_type}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>
                            Balance after: {item.balance_after} pts
                          </div>
                        </div>

                        <span style={{ fontWeight: 900, color: item.points >= 0 ? '#1B4332' : '#5C1A24', fontSize: '0.88rem' }}>
                          {item.points >= 0 ? '+' : ''}{item.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REFERRAL BONUSES */}
          {activeTab === 'referral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Referral Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #5C1A24 0%, #3B0E15 100%)',
                borderRadius: '24px',
                padding: '24px',
                color: '#FFFFFF',
                boxShadow: '0 12px 32px rgba(92, 26, 36, 0.28)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#F3EBDD', fontWeight: 800 }}>
                    SHARE THE TASTE • EARN REWARDS
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, margin: '6px 0 4px 0' }}>
                    Give ₹100, Get ₹50 + 150 Pts
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#F3EBDD' }}>
                    Your friends get ₹100 off their first order. You receive ₹50 cashback & 150 points when delivered!
                  </div>
                </div>

                <Gift size={44} color="#F2C230" />
              </div>

              {/* Referral Code Box */}
              <div style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--ws-text-primary)' }}>
                  Your Unique Referral Code
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '2px dashed #1B4332',
                  borderRadius: '14px',
                  padding: '12px 18px',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', color: '#1B4332' }}>
                    {referralCode}
                  </span>

                  <button
                    onClick={handleCopyReferral}
                    style={{
                      background: copiedReferral ? '#1B4332' : 'rgba(27, 67, 50, 0.1)',
                      color: copiedReferral ? '#FFFFFF' : '#1B4332',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copiedReferral ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedReferral ? 'Copied Link!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                  💡 Share this code directly with friends or paste the link into WhatsApp groups.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
