import React, { useState } from 'react';
import { 
  Layers, 
  MapPin, 
  Store, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Sparkles,
  Zap,
  Check,
  ChevronRight
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const BatchDeliveryPage = ({ onGoToLiveTrip }) => {
  const { batchTrip, showToast } = useDelivery();
  const [currentStopIndex, setCurrentStopIndex] = useState(1);

  const stops = batchTrip.route_sequence;

  const handleAdvanceBatchStop = () => {
    if (currentStopIndex < stops.length) {
      setCurrentStopIndex(prev => prev + 1);
      showToast(`Stop #${currentStopIndex} confirmed. Navigating to Stop #${currentStopIndex + 1}.`, 'info');
    } else {
      showToast('Batch delivery route fully completed! ₹284 credited to balance.', 'success');
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #FFD4C2',
        borderRadius: '24px',
        padding: '28px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 18px rgba(255, 90, 31, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: '#FF5A1F'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid #BFDBFE'
            }}>
              AI OPTIMIZED BATCH
            </span>
            <span style={{ fontSize: '0.78rem', color: '#7A808C' }}>
              Batch Route #{batchTrip.id}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: '8px 0 2px'
          }}>
            Dual Batch Delivery (2 Orders)
          </h1>
          <div style={{ fontSize: '0.84rem', color: '#525760' }}>
            Consolidated multi-pickup sequence engineered to minimize route backtracking by 34%.
          </div>
        </div>

        {/* Combined Metrics Pill */}
        <div style={{
          backgroundColor: '#FBF9F5',
          border: '1px solid #EDE8DE',
          borderRadius: '20px',
          padding: '16px 22px',
          textAlign: 'right'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>
            COMBINED EARNINGS
          </span>
          <div style={{
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '2rem',
            fontWeight: 900,
            color: '#FF5A1F',
            lineHeight: 1,
            marginTop: '4px'
          }}>
            ₹{batchTrip.combined_earnings}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#525760', marginTop: '4px' }}>
            {batchTrip.combined_distance_km} km total • ~{batchTrip.estimated_completion_mins} mins
          </div>
        </div>
      </div>

      {/* 2 Orders Overview Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '20px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800 }}>ORDER 01 (#DP-10245)</span>
            <span style={{ fontSize: '0.82rem', color: '#FF5A1F', fontWeight: 800, fontFamily: "'Space Grotesk', monospace" }}>₹148 Payout</span>
          </div>
          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#191B1F' }}>
            Urban Bowl → Ravi Kumar
          </div>
          <div style={{ fontSize: '0.76rem', color: '#525760' }}>
            Indiranagar 100ft Rd → Heritage Tower (Drop Stop 3)
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '20px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800 }}>ORDER 02 (#DP-10248)</span>
            <span style={{ fontSize: '0.82rem', color: '#FF5A1F', fontWeight: 800, fontFamily: "'Space Grotesk', monospace" }}>₹136 Payout</span>
          </div>
          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#191B1F' }}>
            Green Earth Bistro → Dr. Sneha Menon
          </div>
          <div style={{ fontSize: '0.76rem', color: '#525760' }}>
            CMH Road → Palm Meadows (Drop Stop 4)
          </div>
        </div>
      </div>

      {/* Sequential Multi-Stop Route Timeline */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#191B1F',
            margin: 0
          }}>
            Multi-Stop Route Sequence
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#FF5A1F', fontWeight: 800 }}>
            Current: Stop {currentStopIndex} of {stops.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stops.map((stop, index) => {
            const isCompleted = index + 1 < currentStopIndex;
            const isCurrent = index + 1 === currentStopIndex;

            return (
              <div
                key={stop.stop_number}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: `1px solid ${isCurrent ? '#FFD4C2' : '#EDE8DE'}`,
                  backgroundColor: isCurrent ? '#FFF2EC' : (isCompleted ? '#F8F6F2' : '#FFFFFF'),
                  opacity: isCompleted ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Step Indicator */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isCurrent ? '#FF5A1F' : (isCompleted ? '#059669' : '#EDE8DE'),
                  color: isCurrent || isCompleted ? '#FFFFFF' : '#525760',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  {isCompleted ? '✓' : stop.stop_number}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      color: stop.type === 'PICKUP' ? '#FF5A1F' : '#059669'
                    }}>
                      STOP {stop.stop_number} • {stop.type}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#525760', fontFamily: "'Space Grotesk', monospace" }}>
                      {stop.eta}
                    </span>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#191B1F', marginTop: '2px' }}>
                    {stop.location_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#7A808C', overflowWrap: 'anywhere' }}>
                    {stop.address} • Order #{stop.order_id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handleAdvanceBatchStop}
            type="button"
            className="btn-primary-fresh"
            style={{ flex: 2, padding: '14px', fontSize: '0.92rem' }}
          >
            <Check size={18} />
            <span>CONFIRM STOP #{currentStopIndex} COMPLETED</span>
          </button>

          <button
            onClick={onGoToLiveTrip}
            type="button"
            className="btn-secondary-fresh"
            style={{ flex: 1, padding: '14px' }}
          >
            <span>VIEW IN MAP HUD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
