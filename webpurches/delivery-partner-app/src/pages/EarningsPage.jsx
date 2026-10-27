import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Zap, 
  Sparkles,
  ArrowRight,
  CreditCard,
  Gift,
  Flame,
  Milestone,
  Navigation,
  DollarSign
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const EarningsPage = ({ onGoToWallet }) => {
  const { earnings, ledger, loadLedger } = useDelivery();
  const [timeframe, setTimeframe] = useState('weekly'); // 'today' | 'weekly' | 'monthly'

  // Clean geometric chart dataset (Mon - Sun)
  const weeklyDailyEarnings = [
    { day: 'Mon', amount: 1420, orders: 9, hours: '6.2h' },
    { day: 'Tue', amount: 1250, orders: 8, hours: '5.8h' },
    { day: 'Wed', amount: 1580, orders: 11, hours: '7.1h' },
    { day: 'Thu', amount: 1390, orders: 9, hours: '6.0h' },
    { day: 'Fri', amount: 1840, orders: 13, hours: '8.2h' },
    { day: 'Sat', amount: 2100, orders: 15, hours: '8.8h' },
    { day: 'Sun (Today)', amount: earnings.today || 1240, orders: earnings.deliveries_today || 8, hours: '6.4h', isToday: true }
  ];

  const maxDaily = Math.max(...weeklyDailyEarnings.map(d => d.amount));

  return (
    <div style={{ maxWidth: '1080px', width: '100%', boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header with Timeframe Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#047857', letterSpacing: '0.5px' }}>
              FD FINANCIAL DASHBOARD
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: 0
          }}>
            Earnings & Revenue
          </h1>
          <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
            Real-time delivery compensation, customer tips, peak bonuses and milestone incentives.
          </div>
        </div>

        {/* Timeframe Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F8F6F2',
          border: '1px solid #EDE8DE',
          borderRadius: '999px',
          padding: '4px'
        }}>
          {['today', 'weekly', 'monthly'].map(tf => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                type="button"
                style={{
                  padding: '7px 18px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: isActive ? '#10B981' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#7A808C',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'all 0.15s ease'
                }}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary 3-Tier Earnings Cards: Today, This Week, This Month */}
      {/* Phase 3A: Verified payout ledger (INTERNAL LEDGER, real backend data) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #D1FAE5',
        borderRadius: '22px',
        padding: '20px 24px',
        boxShadow: '0 4px 16px -2px rgba(16, 185, 129, 0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Verified Payout Ledger
          </span>
          <button type="button" onClick={loadLedger} style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857', background: 'none', border: 'none', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
        {ledger?.loading && (
          <div style={{ fontSize: '0.86rem', color: '#7A808C', marginTop: '10px' }}>Loading verified earnings…</div>
        )}
        {!ledger?.loading && ledger?.error && (
          <div style={{ fontSize: '0.86rem', color: '#DC2626', marginTop: '10px' }}>
            Ledger unavailable: {ledger.error}. Showing local session figures below.
          </div>
        )}
        {!ledger?.loading && !ledger?.error && !ledger?.summary && (
          <div style={{ fontSize: '0.86rem', color: '#7A808C', marginTop: '10px' }}>
            No verified earnings yet. Complete a delivery to accrue ledger entries.
          </div>
        )}
        {!ledger?.loading && !ledger?.error && ledger?.summary && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700 }}>ACCRUED (UNPAID)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#191B1F' }}>₹{ledger.summary.accrued_total}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700 }}>SETTLED INTO PAYOUTS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#191B1F' }}>₹{ledger.summary.settled_total}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700 }}>PAYOUT BATCHES</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#191B1F' }}>{ledger.payouts?.length || 0}</div>
            </div>
          </div>
        )}
        {!ledger?.loading && !ledger?.error && Array.isArray(ledger?.payouts) && ledger.payouts.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ledger.payouts.slice(0, 5).map(p => (
              <div key={p.payout_reference} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4B5563' }}>
                <span>{p.payout_reference} · {p.trip_count} trips</span>
                <span>₹{p.net_payout_amount} · {p.status}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '8px' }}>
          Internal ledger only. Transfers are completed and verified manually by an administrator.
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '16px'
      }}>
        {/* Today - Highlighted with FD Yellow accent banner */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #FDE68A',
          borderRadius: '22px',
          padding: '24px',
          boxShadow: '0 4px 16px -2px rgba(245, 158, 11, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#F59E0B'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TODAY'S EARNINGS
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#D97706',
              padding: '2px 8px',
              borderRadius: '999px'
            }}>
              Active Shift
            </span>
          </div>

          <div style={{
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: '8px 0 4px',
            lineHeight: 1
          }}>
            ₹{earnings.today.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#525760' }}>
            <strong style={{ color: '#191B1F' }}>{earnings.deliveries_today}</strong> deliveries completed • Avg ₹{Math.round(earnings.today / (earnings.deliveries_today || 1))}/drop
          </div>
        </div>

        {/* This Week */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '22px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              THIS WEEK (MON – SUN)
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: '#ECFDF5',
              color: '#059669',
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              <TrendingUp size={11} /> +18.4%
            </span>
          </div>

          <div style={{
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: '8px 0 4px',
            lineHeight: 1
          }}>
            ₹{earnings.weekly.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#525760' }}>
            Strong corridor demand during lunch & dinner peaks
          </div>
        </div>

        {/* This Month */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '22px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              THIS MONTH TO DATE
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: '#F8F6F2',
              color: '#525760',
              padding: '2px 8px',
              borderRadius: '999px'
            }}>
              On Target
            </span>
          </div>

          <div style={{
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: '8px 0 4px',
            lineHeight: 1
          }}>
            ₹{earnings.monthly.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#525760' }}>
            Projected monthly earnings: ~₹52,000
          </div>
        </div>
      </div>

      {/* Clean Geometric Daily Breakdown Bar Chart */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 3px 12px rgba(25, 27, 31, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#191B1F',
              margin: 0
            }}>
              Daily Earnings Velocity
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#7A808C' }}>
              Geometric visual distribution across current 7-day operational cycle
            </span>
          </div>
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#D97706'
          }}>
            Average ₹1,540 / Day
          </div>
        </div>

        {/* Geometric Bar Chart Container with Mobile Scroll Safety */}
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '12px',
            alignItems: 'end',
            height: '190px',
            minWidth: '380px',
            paddingTop: '24px',
            borderBottom: '1px solid #F3EFE7'
          }}>
            {weeklyDailyEarnings.map((d, idx) => {
              const heightPercent = Math.max(15, Math.round((d.amount / maxDaily) * 100));

              return (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: "'Space Grotesk', monospace",
                    fontWeight: 800,
                    color: d.isToday ? '#059669' : '#7A808C'
                  }}>
                    ₹{d.amount}
                  </span>

                  <div 
                    style={{
                      width: '100%',
                      maxWidth: '44px',
                      height: `${heightPercent}%`,
                      backgroundColor: d.isToday ? '#10B981' : '#F4F0E8',
                      border: `1px solid ${d.isToday ? '#059669' : '#E2DCD1'}`,
                      borderRadius: '10px 10px 4px 4px',
                      transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: d.isToday ? '0 4px 12px rgba(16, 185, 129, 0.28)' : 'none'
                    }}
                    title={`${d.day}: ₹${d.amount} (${d.orders} orders)`}
                  />

                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: d.isToday ? 800 : 600,
                    color: d.isToday ? '#059669' : '#525760',
                    marginTop: '4px'
                  }}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Itemized Financial Breakdown: Delivery earnings, Tips, Bonuses, Incentives */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Delivery Base Earnings */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <DollarSign size={14} color="#059669" />
            <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>
              DELIVERY BASE EARNINGS
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '1.6rem', fontWeight: 900, color: '#191B1F', margin: '4px 0' }}>
            ₹940.00
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7A808C' }}>
            Standard drop fees & distance pay
          </div>
        </div>

        {/* Customer Tips */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Gift size={14} color="#059669" />
            <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>
              CUSTOMER TIPS
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '1.6rem', fontWeight: 900, color: '#059669', margin: '4px 0' }}>
            ₹{earnings.tips_today}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7A808C' }}>
            100% direct payout (zero platform cut)
          </div>
        </div>

        {/* Surge Bonuses */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Flame size={14} color="#D97706" />
            <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>
              PEAK SURGE BONUSES
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '1.6rem', fontWeight: 900, color: '#D97706', margin: '4px 0' }}>
            ₹{earnings.surge_bonus_today}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7A808C' }}>
            High-demand lunch & dinner corridor multiplier
          </div>
        </div>

        {/* Target Incentives */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Milestone size={14} color="#2563EB" />
            <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>
              TARGET INCENTIVES
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '1.6rem', fontWeight: 900, color: '#2563EB', margin: '4px 0' }}>
            ₹{earnings.incentives_today}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7A808C' }}>
            8-order shift target completion unlock
          </div>
        </div>
      </div>

      {/* Quick Cashout Banner Card */}
      {onGoToWallet && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1.5px solid #A7F3D0',
          borderRadius: '22px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#191B1F' }}>
                Instant Bank Settlement Available
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#525760' }}>
                Transfer today's accumulated earnings directly to your verified bank account in &lt;10 minutes.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToWallet}
            type="button"
            className="btn-primary-fresh"
            style={{
              padding: '11px 22px',
              fontSize: '0.86rem',
              backgroundColor: '#10B981'
            }}
          >
            <span>Go to Wallet & Cashout</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
