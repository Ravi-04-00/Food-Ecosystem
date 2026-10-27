import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const InstantPayoutModal = ({ isOpen, onClose }) => {
  const { earnings, requestInstantPayout } = useDelivery();
  const [amount, setAmount] = useState(earnings.withdrawable_balance || 2480);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      const ok = requestInstantPayout(amount);
      setIsProcessing(false);
      if (ok) onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 220,
      backgroundColor: 'rgba(25, 27, 31, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '26px 22px',
        boxShadow: '0 12px 32px rgba(25, 27, 31, 0.12)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#7A808C',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div>
          <span style={{
            fontSize: '0.72rem',
            fontFamily: "'Space Grotesk', monospace",
            fontWeight: 800,
            color: '#FF5A1F',
            letterSpacing: '0.5px'
          }}>
            INSTANT SETTLEMENT
          </span>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#191B1F',
            margin: '4px 0 0'
          }}>
            Initiate Instant Payout
          </h2>
          <div style={{ fontSize: '0.76rem', color: '#7A808C', marginTop: '2px' }}>
            Funds transferred within 10 minutes via IMPS Direct Rail
          </div>
        </div>

        {/* Balance Status */}
        <div style={{
          backgroundColor: '#FBF9F5',
          border: '1px solid #EDE8DE',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>
              Available Withdrawable Balance
            </span>
            <div style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#191B1F',
              marginTop: '2px'
            }}>
              ₹{earnings.withdrawable_balance.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAmount(earnings.withdrawable_balance)}
            style={{
              backgroundColor: '#FFF2EC',
              border: '1px solid #FFD4C2',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#FF5A1F',
              cursor: 'pointer'
            }}
          >
            WITHDRAW ALL
          </button>
        </div>

        {/* Transfer Destination with Privacy Mask */}
        <div style={{
          backgroundColor: '#FBF9F5',
          border: '1px solid #EDE8DE',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
              VERIFIED DESTINATION
            </span>
            <button
              type="button"
              onClick={() => setShowAccountDetails(!showAccountDetails)}
              style={{
                background: 'none',
                border: 'none',
                color: '#7A808C',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem'
              }}
            >
              {showAccountDetails ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showAccountDetails ? 'Mask' : 'Reveal'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: '#FFF2EC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF5A1F'
            }}>
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#191B1F' }}>
                HDFC Bank Ltd • Savings
              </div>
              <div style={{ fontSize: '0.74rem', color: '#7A808C', fontFamily: "'Space Grotesk', monospace" }}>
                {showAccountDetails ? 'A/C: 501004829014 • IFSC: HDFC0000128' : 'A/C: ••••••••9014 • Verified'}
              </div>
            </div>
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: '#7A808C', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
              ENTER WITHDRAWAL AMOUNT (₹)
            </label>
            <input
              type="number"
              min="100"
              max={earnings.withdrawable_balance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                width: '100%',
                backgroundColor: '#FBF9F5',
                border: '1px solid #EDE8DE',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '1.4rem',
                fontFamily: "'Space Grotesk', monospace",
                fontWeight: 800,
                color: '#191B1F',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ fontSize: '0.74rem', color: '#525760', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Zero transfer fees applied for Tier 1 Master Partners.</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || amount <= 0 || amount > earnings.withdrawable_balance}
            className="btn-primary-fresh"
            style={{ width: '100%', padding: '14px', opacity: isProcessing ? 0.6 : 1, fontSize: '0.9rem' }}
          >
            {isProcessing ? 'PROCESSING IMPS TRANSFER...' : `CONFIRM ₹${Number(amount).toLocaleString()} PAYOUT`}
          </button>
        </form>
      </div>
    </div>
  );
};
