import React, { useState } from 'react';
import { 
  CalendarClock, 
  Clock, 
  Sparkles, 
  Check, 
  Calendar, 
  Zap, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const SchedulePage = () => {
  const { shifts, reserveShift, isOnline, toggleOnline, showToast } = useDelivery();
  const [selectedDay, setSelectedDay] = useState('Today');

  return (
    <div style={{ maxWidth: '1080px', width: '100%', boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#047857', letterSpacing: '0.5px' }}>
            SHIFT OPERATIONS
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Schedule & Peak Reservations
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          Reserve dedicated delivery slots for priority dispatch assignments and minimum earnings guarantees.
        </div>
      </div>

      {/* AI Recommended Schedule Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #A7F3D0',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 18px rgba(16, 185, 129, 0.08)',
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

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '680px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            flexShrink: 0
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#191B1F' }}>
                AI Recommended Optimal Schedule
              </span>
              <span style={{
                fontSize: '0.68rem',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 800,
                border: '1px solid #BFDBFE'
              }}>
                PREDICTIVE ESTIMATE
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#525760', margin: '4px 0 0', lineHeight: 1.45 }}>
              "Based on your historical route efficiency and local dining traffic, Friday & Saturday <strong>07:00 PM – 10:30 PM</strong> offers up to <strong>34% higher earnings per hour</strong>."
            </p>
            <div style={{ fontSize: '0.72rem', color: '#7A808C', marginTop: '4px' }}>
              *Probabilistic estimates based on real-time city demand algorithms.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            reserveShift('shift-today-dinner');
            showToast('AI recommended shift reserved for 07:00 PM.', 'success');
          }}
          type="button"
          className="btn-primary-fresh"
          style={{ padding: '10px 20px', fontSize: '0.84rem' }}
        >
          <span>RESERVE 7–10 PM</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Current Shift Status Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '22px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
      }}>
        <div>
          <span style={{ fontSize: '0.74rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>
            CURRENT ACTIVE SHIFT
          </span>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#191B1F', marginTop: '2px' }}>
            Downtown Peak Lunch (11:30 AM – 03:30 PM)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#525760', marginTop: '2px' }}>
            Status: <strong style={{ color: '#059669' }}>Active • 1.25x Surge Multiplier Applied</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => showToast('Break mode enabled for 15 minutes. Dispatches paused.', 'warning')}
            type="button"
            className="btn-secondary-fresh"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            <span>Take 15m Break</span>
          </button>
          <button
            onClick={() => {
              toggleOnline();
            }}
            type="button"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              borderRadius: '12px',
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            End Shift
          </button>
        </div>
      </div>

      {/* Available Shift Slots */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#191B1F',
            margin: 0
          }}>
            Available Shift Reservations
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#7A808C' }}>
            Slots guarantee minimum hourly floor
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shifts.map(shift => {
            const isReserved = shift.status === 'RESERVED' || shift.status === 'ACTIVE_NOW';

            return (
              <div
                key={shift.id}
                style={{
                  backgroundColor: isReserved ? '#ECFDF5' : '#FBF9F5',
                  border: `1px solid ${isReserved ? '#A7F3D0' : '#EDE8DE'}`,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#191B1F' }}>
                      {shift.name}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: isReserved ? '#D1FAE5' : '#EDE8DE',
                      color: isReserved ? '#047857' : '#525760'
                    }}>
                      {shift.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#525760', marginTop: '3px' }}>
                    ⏰ {shift.time} • Multiplier: <strong style={{ color: '#059669' }}>{shift.multiplier}</strong>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#7A808C', marginTop: '2px' }}>
                    Expected: {shift.estimated_earnings} • {shift.slots_left} slots available
                  </div>
                </div>

                {isReserved ? (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#059669',
                    fontSize: '0.82rem',
                    fontWeight: 800
                  }}>
                    <Check size={16} />
                    <span>Slot Confirmed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => reserveShift(shift.id)}
                    type="button"
                    className="btn-secondary-fresh"
                    style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                  >
                    RESERVE SLOT
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
