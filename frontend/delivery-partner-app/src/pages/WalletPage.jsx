import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { InstantPayoutModal } from '../components/modals/InstantPayoutModal.jsx';

export const WalletPage = () => {
  const { earnings, transactions } = useDelivery();
  const [instantModalOpen, setInstantModalOpen] = useState(false);
  const [showSensitiveDetails, setShowSensitiveDetails] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CREDITS' | 'PAYOUTS'

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'CREDITS') return t.amount > 0;
    if (filterType === 'PAYOUTS') return t.amount < 0;
    return true;
  });

  return (
    <div style={{ maxWidth: '1080px', width: '100%', boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#047857', letterSpacing: '0.5px' }}>
            PARTNER TREASURY
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Wallet & Payout Settlements
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          Direct integration with banking rail • Instant IMPS withdrawals or scheduled auto-settlement.
        </div>
      </div>

      {/* Hero Balance Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #A7F3D0',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 4px 18px rgba(16, 185, 129, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: '#10B981'
        }} />

        <div>
          <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            AVAILABLE WITHDRAWABLE BALANCE
          </span>
          <div style={{
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '3rem',
            fontWeight: 900,
            color: '#191B1F',
            lineHeight: 1.1,
            marginTop: '4px'
          }}>
            ₹{earnings.withdrawable_balance.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#525760', marginTop: '8px' }}>
            Pending Clearance: <strong style={{ color: '#191B1F' }}>₹{earnings.pending_balance.toLocaleString()}</strong> • Next Auto-Settlement at Midnight
          </div>
        </div>

        <button
          onClick={() => setInstantModalOpen(true)}
          type="button"
          className="btn-primary-fresh"
          style={{ padding: '14px 28px', fontSize: '0.92rem' }}
        >
          <ArrowUpRight size={18} />
          <span>REQUEST INSTANT PAYOUT</span>
        </button>
      </div>

      {/* Linked Bank & Settlement Channels */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#191B1F',
            margin: 0
          }}>
            Settlement Channels & Verification
          </h3>

          <button
            onClick={() => setShowSensitiveDetails(!showSensitiveDetails)}
            type="button"
            style={{
              background: '#F8F6F2',
              border: '1px solid #EDE8DE',
              borderRadius: '999px',
              padding: '6px 12px',
              color: '#525760',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {showSensitiveDetails ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showSensitiveDetails ? 'Mask Details' : 'Show Sensitive Data'}</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '14px'
        }}>
          {/* Primary Bank */}
          <div style={{
            backgroundColor: '#FBF9F5',
            border: '1px solid #EDE8DE',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}>
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
                  HDFC Bank Ltd (Primary)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#7A808C', fontFamily: "'Space Grotesk', monospace" }}>
                  {showSensitiveDetails ? 'A/C: 501004829014 • IFSC: HDFC0000128' : 'Account: ••••••••9014'}
                </div>
              </div>
            </div>

            <span style={{
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid #A7F3D0'
            }}>
              VERIFIED IMPS
            </span>
          </div>

          {/* UPI Handle */}
          <div style={{
            backgroundColor: '#FBF9F5',
            border: '1px solid #EDE8DE',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}>
                <CreditCard size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
                  UPI Virtual ID
                </div>
                <div style={{ fontSize: '0.74rem', color: '#7A808C', fontFamily: "'Space Grotesk', monospace" }}>
                  {showSensitiveDetails ? 'arun.courier@okhdfcbank' : 'arun••••@okhdfcbank'}
                </div>
              </div>
            </div>

            <span style={{
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid #A7F3D0'
            }}>
              LINKED
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#191B1F',
              margin: 0
            }}>
              Settlement Ledger & Transactions
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#7A808C' }}>
              Real-time audit log of credits, surge adjustments, and withdrawals
            </span>
          </div>

          <div style={{
            display: 'flex',
            backgroundColor: '#F8F6F2',
            borderRadius: '999px',
            padding: '3px'
          }}>
            {['ALL', 'CREDITS', 'PAYOUTS'].map(ft => {
              const isActive = filterType === ft;
              return (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  type="button"
                  style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: isActive ? '#10B981' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#7A808C',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {ft}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTransactions.map(txn => {
            const isCredit = txn.amount > 0;

            return (
              <div
                key={txn.id}
                style={{
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #EDE8DE',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: isCredit ? '#ECFDF5' : '#F1F5F9',
                    color: isCredit ? '#059669' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
                      {txn.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#7A808C' }}>
                      {txn.id} • {txn.date} • {txn.method}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', monospace",
                    fontSize: '1.15rem',
                    fontWeight: 900,
                    color: isCredit ? '#059669' : '#191B1F'
                  }}>
                    {isCredit ? `+₹${txn.amount.toLocaleString()}` : `-₹${Math.abs(txn.amount).toLocaleString()}`}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 600 }}>
                    {txn.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instant Payout Modal */}
      <InstantPayoutModal
        isOpen={instantModalOpen}
        onClose={() => setInstantModalOpen(false)}
      />
    </div>
  );
};
