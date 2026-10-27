import React, { useState } from 'react';
import { 
  Bike, 
  BatteryCharging, 
  Zap, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Gauge,
  Navigation
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { VEHICLES_DATA } from '../services/api.js';

export const VehiclePage = () => {
  const { activeVehicle, setActiveVehicle, showToast } = useDelivery();
  const [vehicleList, setVehicleList] = useState(VEHICLES_DATA);

  const handleSelectVehicle = (veh) => {
    setActiveVehicle(veh);
    setVehicleList(prev => prev.map(v => ({ ...v, is_active: v.id === veh.id })));
    showToast(`Active operational vehicle switched to ${veh.model}.`, 'success');
  };

  return (
    <div style={{ maxWidth: '1080px', width: '100%', boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#047857', letterSpacing: '0.5px' }}>
            MOBILITY & ASSET FLEET
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Vehicle Telemetry & EV Suite
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          Real-time battery SOC, range estimation, zero-emission verification, and charging infrastructure.
        </div>
      </div>

      {/* Hero Active Vehicle Profile Card */}
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: '#ECFDF5',
                color: '#059669',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid #A7F3D0'
              }}>
                PRIMARY DEPLOYED VEHICLE
              </span>
              <span style={{ fontSize: '0.78rem', color: '#7A808C', fontFamily: "'Space Grotesk', monospace" }}>
                {activeVehicle.type}
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#191B1F',
              margin: '8px 0 2px'
            }}>
              {activeVehicle.model}
            </h2>
            <div style={{ fontSize: '0.84rem', color: '#525760', fontFamily: "'Space Grotesk', monospace" }}>
              Registration: <strong style={{ color: '#191B1F' }}>{activeVehicle.plate_number}</strong> • Commercial RC Active
            </div>
          </div>

          {/* Battery Status Pill */}
          {activeVehicle.battery_percent && (
            <div style={{
              backgroundColor: '#FBF9F5',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '16px 22px',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>
                BATTERY SOC
              </span>
              <div style={{
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '2rem',
                fontWeight: 900,
                color: '#059669',
                lineHeight: 1,
                marginTop: '4px'
              }}>
                {activeVehicle.battery_percent}%
              </div>
              <div style={{ fontSize: '0.74rem', color: '#525760', marginTop: '4px' }}>
                {activeVehicle.range_km} km estimated range
              </div>
            </div>
          )}
        </div>

        {/* EV Telemetry Stats Bar */}
        {activeVehicle.battery_percent && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: '12px',
            borderTop: '1px solid #F3EFE7',
            paddingTop: '18px'
          }}>
            <div style={{ backgroundColor: '#FBF9F5', padding: '14px', borderRadius: '16px', border: '1px solid #EDE8DE' }}>
              <span style={{ fontSize: '0.7rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>ENERGY EFFICIENCY</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#191B1F', marginTop: '2px' }}>
                {activeVehicle.efficiency}
              </div>
            </div>

            <div style={{ backgroundColor: '#FBF9F5', padding: '14px', borderRadius: '16px', border: '1px solid #EDE8DE' }}>
              <span style={{ fontSize: '0.7rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>INSURANCE EXPIRY</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#191B1F', marginTop: '2px' }}>
                {activeVehicle.insurance_valid_until}
              </div>
            </div>

            <div style={{ backgroundColor: '#FBF9F5', padding: '14px', borderRadius: '16px', border: '1px solid #EDE8DE' }}>
              <span style={{ fontSize: '0.7rem', color: '#7A808C', textTransform: 'uppercase', fontWeight: 700 }}>EMISSION RATING</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                {activeVehicle.pollution_valid_until}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rapid EV Charging Infrastructure List */}
      {activeVehicle.nearby_chargers && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
        }}>
          <div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#191B1F',
              margin: 0
            }}>
              Nearby Rapid EV Charging Hubs
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#7A808C' }}>
              Partner priority stalls with discounted operational charging tariffs
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
            {activeVehicle.nearby_chargers.map((station, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #EDE8DE',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#191B1F' }}>
                    {station.name}
                  </span>
                  <span style={{
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid #A7F3D0'
                  }}>
                    {station.plugs_free} STALLS FREE
                  </span>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#525760' }}>
                  Distance: <strong>{station.distance_km} km away</strong> • Speed: <strong>{station.charge_speed}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => showToast(`Route set to ${station.name}.`, 'info')}
                  className="btn-secondary-fresh"
                  style={{ padding: '8px', fontSize: '0.76rem', marginTop: '4px' }}
                >
                  <Navigation size={14} />
                  <span>Navigate to Charger</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Switch Vehicle Profile */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
      }}>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.2rem',
          fontWeight: 800,
          color: '#191B1F',
          margin: 0
        }}>
          Registered Fleet Vehicles
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {vehicleList.map(veh => {
            const isCurrentlyActive = veh.id === activeVehicle.id;

            return (
              <div
                key={veh.id}
                style={{
                  backgroundColor: isCurrentlyActive ? '#ECFDF5' : '#FBF9F5',
                  border: `1px solid ${isCurrentlyActive ? '#A7F3D0' : '#EDE8DE'}`,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B1F' }}>
                    {veh.model}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#7A808C', fontFamily: "'Space Grotesk', monospace" }}>
                    {veh.plate_number} • {veh.type}
                  </div>
                </div>

                {isCurrentlyActive ? (
                  <span style={{
                    color: '#059669',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle2 size={16} />
                    <span>ACTIVE ON DUTY</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelectVehicle(veh)}
                    type="button"
                    className="btn-secondary-fresh"
                    style={{ padding: '8px 16px', fontSize: '0.76rem' }}
                  >
                    Switch to this vehicle
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
