import React, { useState } from 'react';
import { 
  Flame, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  TrendingUp,
  Compass,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { DEMAND_ZONES } from '../services/api.js';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const DemandHeatmapPage = ({ onGoToMap }) => {
  const { showToast } = useDelivery();
  const [selectedZone, setSelectedZone] = useState(DEMAND_ZONES[0]);

  const handleNavigateToZone = (zone) => {
    setSelectedZone(zone);
    showToast(`GPS Navigation locked to ${zone.name}. Travel safely within speed limits.`, 'info');
    if (onGoToMap) onGoToMap();
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF2EC', border: '1px solid #FFD4C2', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF5A1F' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#FF5A1F', letterSpacing: '0.5px' }}>
            REAL-TIME DISPATCH HEATMAP
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Regional Demand & Surge Clusters
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          Dynamic algorithmic hotspots based on customer order volume, live kitchen prep queues, and courier availability.
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div style={{
        backgroundColor: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '16px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#B45309',
        fontSize: '0.82rem'
      }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <span>
          <strong>Safe Riding Policy:</strong> Surge incentives are unlocked upon safe arrival and order pickup. Speed limits and local traffic guidelines must be strictly observed.
        </span>
      </div>

      {/* Demand Zones Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '16px'
      }}>
        {DEMAND_ZONES.map(zone => {
          const isHigh = zone.demand_level === 'HIGH';
          const isMedium = zone.demand_level === 'MEDIUM';

          return (
            <div
              key={zone.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${isHigh ? '#FFD4C2' : '#EDE8DE'}`,
                borderRadius: '24px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: isHigh ? '0 4px 16px rgba(255, 90, 31, 0.08)' : '0 2px 6px rgba(25, 27, 31, 0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    letterSpacing: '0.6px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: isHigh ? '#FFF2EC' : (isMedium ? '#EFF6FF' : '#F8F6F2'),
                    color: isHigh ? '#FF5A1F' : (isMedium ? '#2563EB' : '#7A808C'),
                    border: `1px solid ${isHigh ? '#FFD4C2' : (isMedium ? '#BFDBFE' : '#EDE8DE')}`
                  }}>
                    {zone.demand_level} DEMAND
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#191B1F', margin: '8px 0 2px' }}>
                    {zone.name}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>SURGE PAY</span>
                  <div style={{
                    fontFamily: "'Space Grotesk', monospace",
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    color: isHigh ? '#FF5A1F' : '#059669'
                  }}>
                    {zone.surge_rate}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#525760', margin: 0, lineHeight: 1.45 }}>
                {zone.description}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#525760',
                backgroundColor: '#FBF9F5',
                border: '1px solid #EDE8DE',
                padding: '10px 14px',
                borderRadius: '14px'
              }}>
                <span>Orders: <strong style={{ color: '#191B1F' }}>{zone.active_orders_per_hr}/hr</strong></span>
                <span>Distance: <strong style={{ color: '#191B1F' }}>{zone.distance_km} km</strong></span>
                <span>ETA: <strong style={{ color: '#191B1F' }}>~{zone.travel_time_mins}m</strong></span>
              </div>

              <button
                onClick={() => handleNavigateToZone(zone)}
                type="button"
                className={isHigh ? "btn-primary-fresh" : "btn-secondary-fresh"}
                style={{ width: '100%', padding: '12px', fontSize: '0.84rem' }}
              >
                <Navigation size={16} />
                <span>Go to Zone ({zone.distance_km} km)</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
