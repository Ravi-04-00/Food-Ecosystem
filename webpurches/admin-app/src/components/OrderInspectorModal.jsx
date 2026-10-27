import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { ReassignPartnerModal } from './ReassignPartnerModal.jsx';
import { DelayControlSection } from './DelayControlSection.jsx';

export const OrderInspectorModal = () => {
  const { inspectedOrder, setInspectedOrder, refundOrder } = useAdmin();
  const [reassignOpen, setReassignOpen] = useState(false);

  if (!inspectedOrder) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(8, 9, 13, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0D1117',
        border: '1px solid rgba(168, 255, 62, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(168, 255, 62, 0.15)',
        position: 'relative'
      }}>
        {/* Top Glow Bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #A8FF3E, #24D9FF, #FF6B2C)'
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '0.72rem',
                letterSpacing: '2px',
                color: '#A8FF3E',
                textTransform: 'uppercase',
                fontWeight: 800,
                background: 'rgba(168, 255, 62, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(168, 255, 62, 0.25)'
              }}>
                TELEMETRY INSPECTION
              </span>
              <span style={{ color: '#8B929D', fontSize: '0.82rem' }}>UUID #{inspectedOrder.id}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: '6px 0 0 0', letterSpacing: '0.5px' }}>
              ORDER {inspectedOrder.order_number}
            </h2>
          </div>

          <button
            onClick={() => setInspectedOrder(null)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8B929D',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status & Escrow Pill */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(255,255,255,0.02)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8B929D', textTransform: 'uppercase' }}>ORDER STATE</div>
              <div style={{
                color: inspectedOrder.status === 'CANCELLED_REFUNDED' ? '#FF4F64' : '#A8FF3E',
                fontWeight: 800,
                fontSize: '1rem',
                marginTop: '4px'
              }}>
                {inspectedOrder.status.replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8B929D', textTransform: 'uppercase' }}>ESCROW STATUS</div>
              <div style={{ color: '#24D9FF', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                {inspectedOrder.payment_status}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8B929D', textTransform: 'uppercase' }}>FRAUD AI SCORE</div>
              <div style={{ color: '#A8FF3E', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                {inspectedOrder.fraud_score}
              </div>
            </div>
          </div>

          {/* Node Entities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Customer Node */}
            <div style={{
              background: 'rgba(255, 107, 44, 0.05)',
              border: '1px solid rgba(255, 107, 44, 0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#FF6B2C', fontWeight: 800, letterSpacing: '1px' }}>
                CUSTOMER NODE
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                {inspectedOrder.customer}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#8B929D', marginTop: '4px' }}>
                {inspectedOrder.customer_phone}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#E8EBEF', marginTop: '8px' }}>
                📍 Drop Pod: Level 42, Cyber Tower A
              </div>
            </div>

            {/* Restaurant Node */}
            <div style={{
              background: 'rgba(255, 210, 63, 0.05)',
              border: '1px solid rgba(255, 210, 63, 0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#FFD23F', fontWeight: 800, letterSpacing: '1px' }}>
                RESTAURANT NODE
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                {inspectedOrder.restaurant}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#8B929D', marginTop: '4px' }}>
                Kitchen Protocol: Ready in {inspectedOrder.eta_minutes}m
              </div>
              <div style={{ fontSize: '0.78rem', color: '#E8EBEF', marginTop: '8px' }}>
                🍳 Commission Split: 12% Platform Fee
              </div>
            </div>
          </div>

          {/* Courier Dispatch Node */}
          <div style={{
            background: 'rgba(36, 217, 255, 0.05)',
            border: '1px solid rgba(36, 217, 255, 0.2)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#24D9FF', fontWeight: 800, letterSpacing: '1px' }}>
              DISPATCH COURIER NODE
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {inspectedOrder.rider}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#8B929D', marginTop: '2px' }}>
                  {inspectedOrder.rider_phone || 'Awaiting dynamic fleet assignment'}
                </div>
                {inspectedOrder.assignment && (
                  <div style={{ fontSize: '0.76rem', color: '#8B929D', marginTop: '2px' }}>
                    Assignment #{inspectedOrder.assignment.id} · {inspectedOrder.assignment.status}
                  </div>
                )}
              </div>
              <div style={{
                background: 'rgba(36, 217, 255, 0.1)',
                border: '1px solid rgba(36, 217, 255, 0.3)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#24D9FF',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                GPS Active • 92% EV Battery
              </div>
            </div>
          </div>

          <DelayControlSection order={inspectedOrder} onUpdated={setInspectedOrder} />

          {/* Ledger Breakdown */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#8B929D', fontWeight: 700, marginBottom: '12px' }}>
              FINANCIAL ESCROW LEDGER
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#E8EBEF', marginBottom: '8px' }}>
              <span>Gross Order Value:</span>
              <span>₹{(inspectedOrder.grand_total * 0.88).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#E8EBEF', marginBottom: '8px' }}>
              <span>FD Foods Commission (12%):</span>
              <span style={{ color: '#52B788' }}>+₹{(inspectedOrder.grand_total * 0.12).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#E8EBEF', marginBottom: '8px' }}>
              <span>Delivery Partner Escrow:</span>
              <span style={{ color: '#24D9FF' }}>₹85.00</span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF' }}>
              <span>Grand Total Settled:</span>
              <span style={{ color: '#FFD23F' }}>₹{Number(inspectedOrder.grand_total).toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          {inspectedOrder.status !== 'CANCELLED_REFUNDED' ? (
            <button
              onClick={() => {
                if (window.confirm(`Issue instant full refund of ₹${inspectedOrder.grand_total} to ${inspectedOrder.customer}?`)) {
                  refundOrder(inspectedOrder.id);
                }
              }}
              style={{
                background: 'rgba(255, 79, 100, 0.15)',
                border: '1px solid #FF4F64',
                color: '#FF4F64',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ⚡ INSTANT ESCROW REFUND
            </button>
          ) : (
            <span style={{ color: '#FF4F64', fontWeight: 800, fontSize: '0.85rem' }}>
              REFUND COMPLETED TO CUSTOMER WALLET
            </span>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setReassignOpen(true)}
              style={{
                background: 'rgba(36, 217, 255, 0.15)',
                border: '1px solid #24D9FF',
                color: '#24D9FF',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🔄 REASSIGN FLEET
            </button>
            <button
              onClick={() => setInspectedOrder(null)}
              style={{
                background: '#A8FF3E',
                border: 'none',
                color: '#08090D',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              CLOSE
            </button>
          </div>
        </div>

      </div>
      {reassignOpen && (
        <ReassignPartnerModal
          order={inspectedOrder}
          assignment={inspectedOrder.assignment}
          onClose={() => setReassignOpen(false)}
          onDone={(fresh) => setInspectedOrder(fresh)}
        />
      )}
    </div>
  );
};
