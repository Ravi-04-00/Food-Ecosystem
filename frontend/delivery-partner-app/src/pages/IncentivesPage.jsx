import React from 'react';
import { 
  Award, 
  Flame, 
  CloudRain, 
  Zap, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Share2
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const IncentivesPage = () => {
  const { earnings, showToast } = useDelivery();

  const handleShareReferral = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('DP-GOLD-8492');
      showToast('Referral code DP-GOLD-8492 copied to clipboard!', 'success');
    } else {
      showToast('Referral code: DP-GOLD-8492', 'info');
    }
  };

  const activeIncentives = [
    {
      id: 'target-daily',
      title: "Today's Operational Target",
      subtitle: 'Complete 10 deliveries before 03:30 PM',
      reward: '₹300 BONUS',
      current: 8,
      target: 10,
      status: 'IN_PROGRESS',
      icon: Zap,
      accent: '#FF5A1F'
    },
    {
      id: 'surge-peak',
      title: 'Peak Lunch Multiplier Guarantee',
      subtitle: 'Active on all deliveries in Indiranagar & Koramangala corridor',
      reward: '+₹40 / TRIP',
      current: 5,
      target: 5,
      status: 'CLAIMED',
      icon: Flame,
      accent: '#F59E0B'
    },
    {
      id: 'rain-guard',
      title: 'Monsoon Rain Guard Allowance',
      subtitle: 'Automatic surge applied during active precipitation warnings',
      reward: '+₹35 / DROP',
      current: 0,
      target: 1,
      status: 'ACTIVE_STANDBY',
      icon: CloudRain,
      accent: '#2563EB'
    },
    {
      id: 'streak-zero-cancel',
      title: 'Zero Cancellation Streak (15 Trips)',
      subtitle: 'Maintain 100% order acceptance and zero cancellations',
      reward: '₹250 BONUS',
      current: 12,
      target: 15,
      status: 'IN_PROGRESS',
      icon: CheckCircle2,
      accent: '#059669'
    },
    {
      id: 'weekend-tier',
      title: 'Weekend Prime Milestone',
      subtitle: 'Complete 35 deliveries across Friday – Sunday',
      reward: '₹1,200 BONUS',
      current: 24,
      target: 35,
      status: 'IN_PROGRESS',
      icon: Award,
      accent: '#7C3AED'
    }
  ];

  return (
    <div style={{ maxWidth: '1080px', width: '100%', boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#047857', letterSpacing: '0.5px' }}>
            PERFORMANCE MILESTONES
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Incentives & Operational Targets
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          Transparent geometric targets designed to reward high reliability, shift punctuality, and route consistency.
        </div>
      </div>

      {/* Hero Active Target: Complete 10 deliveries */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #A7F3D0',
        borderRadius: '24px',
        padding: '30px 26px',
        boxShadow: '0 4px 18px rgba(16, 185, 129, 0.08)',
        display: 'flex',
        flexDirection: 'column',
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              PRIMARY DAILY OBJECTIVE
            </span>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.6rem',
              fontWeight: 900,
              color: '#191B1F',
              margin: '4px 0 0'
            }}>
              Complete 10 Shift Deliveries
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#525760', marginTop: '2px' }}>
              Valid for Downtown Lunch Rush (Ends at 03:30 PM)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 900,
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #A7F3D0'
            }}>
              ₹300 BONUS UNLOCK
            </span>
            <div style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#059669',
              marginTop: '6px'
            }}>
              8 / 10
            </div>
          </div>
        </div>

        {/* Geometric Progress Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            height: '10px',
            backgroundColor: '#F3EFE7',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid #EDE8DE'
          }}>
            <div style={{
              width: '80%',
              height: '100%',
              backgroundColor: '#10B981',
              borderRadius: '999px'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#7A808C' }}>
            <span>80% Completed</span>
            <span>2 more deliveries to credit ₹300 directly to Wallet balance</span>
          </div>
        </div>
      </div>

      {/* Grid of Other Active Incentives */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '16px'
      }}>
        {activeIncentives.map(inc => {
          const Icon = inc.icon;
          const percent = Math.min(100, Math.round((inc.current / inc.target) * 100));

          return (
            <div
              key={inc.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EDE8DE',
                borderRadius: '20px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: '#FBF9F5',
                    border: '1px solid #EDE8DE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: inc.accent
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B1F', margin: 0 }}>
                      {inc.title}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#7A808C', marginTop: '2px' }}>
                      {inc.subtitle}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontFamily: "'Space Grotesk', monospace",
                  fontWeight: 800,
                  color: inc.accent,
                  backgroundColor: '#F8F6F2',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid #EDE8DE',
                  whiteSpace: 'nowrap'
                }}>
                  {inc.reward}
                </span>
              </div>

              {/* Metric Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: '#7A808C' }}>Progress: {inc.current} / {inc.target}</span>
                  <span style={{ fontWeight: 800, color: '#191B1F' }}>{percent}%</span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: '#F3EFE7',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    backgroundColor: inc.accent,
                    borderRadius: '999px'
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partner Referral Section */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: '#FFF2EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF5A1F'
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191B1F' }}>
              Partner Referral Program: Earn ₹1,000
            </div>
            <div style={{ fontSize: '0.78rem', color: '#525760' }}>
              Invite trusted riders. Unlock ₹1,000 bonus once they complete 25 verified deliveries.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: '#F8F6F2',
            border: '1px solid #EDE8DE',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontFamily: "'Space Grotesk', monospace",
            fontWeight: 800,
            color: '#FF5A1F'
          }}>
            DP-GOLD-8492
          </div>

          <button
            onClick={handleShareReferral}
            type="button"
            className="btn-primary-fresh"
            style={{ padding: '9px 18px', fontSize: '0.82rem' }}
          >
            <Share2 size={15} />
            <span>COPY CODE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
