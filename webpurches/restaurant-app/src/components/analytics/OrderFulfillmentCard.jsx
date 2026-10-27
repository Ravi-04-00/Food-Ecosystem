import React from 'react';
import { Clock, CheckCircle2, AlertCircle, ShoppingBag, Utensils, Timer, ShieldAlert } from 'lucide-react';

/**
 * Fast Delivery (FD) — Order Fulfillment, Kitchen Preparation Time & Funnel Card
 */
export const OrderFulfillmentCard = ({
  orderMetrics = {},
  prepTimeMetrics = {},
  operationalAlerts = []
}) => {
  const totalOrders = orderMetrics.total_orders || 0;
  const placed = orderMetrics.placed_orders || 0;
  const confirmed = orderMetrics.confirmed_orders || 0;
  const preparing = orderMetrics.preparing_orders || 0;
  const ready = orderMetrics.ready_orders || 0;
  const completed = orderMetrics.completed_orders || 0;
  const cancelled = orderMetrics.cancelled_orders || 0;

  const grossSales = Number(orderMetrics.gross_order_value || 0);
  const aov = completed > 0 ? (grossSales / completed).toFixed(2) : '—';

  const configuredPrep = prepTimeMetrics.configured_avg_prep_time_minutes || 20;
  const observedPrep = prepTimeMetrics.observed_prep_time_minutes;
  const isDelayed = prepTimeMetrics.is_delayed_alert;

  const funnelStages = [
    { label: 'Placed', count: placed, color: '#F59E0B' },
    { label: 'Confirmed', count: confirmed, color: '#3B82F6' },
    { label: 'Cooking', count: preparing, color: '#8B5CF6' },
    { label: 'Ready', count: ready, color: '#0EA5E9' },
    { label: 'Delivered', count: completed, color: '#10B981' },
    { label: 'Cancelled', count: cancelled, color: '#EF4444' }
  ];

  return (
    <div style={{
      background: 'var(--ws-surface)',
      border: '1px solid var(--ws-border)',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: 'var(--ws-shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
          Kitchen Efficiency & Order Lifecycle
        </h3>
        <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
          Real-time order stage distribution, kitchen turnaround speed, and operational alerts
        </div>
      </div>

      {/* Operational Alerts if any */}
      {operationalAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {operationalAlerts.map((alert, i) => (
            <div
              key={i}
              style={{
                background: alert.type === 'WARNING' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${alert.type === 'WARNING' ? '#EF4444' : '#F59E0B'}`,
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: alert.type === 'WARNING' ? '#EF4444' : '#B45309',
                fontWeight: 600
              }}
            >
              <ShieldAlert size={16} />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 2 Sub-metrics: AOV and Prep Turnaround */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Average Order Value */}
        <div style={{
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>
            AVG ORDER VALUE (AOV)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1B4332', marginTop: '4px' }}>
            {aov !== '—' ? `₹${aov}` : '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Per completed food order
          </div>
        </div>

        {/* Kitchen Prep Turnaround */}
        <div style={{
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>KITCHEN PREP TIME</span>
            <Timer size={16} color={isDelayed ? '#EF4444' : '#10B981'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isDelayed ? '#EF4444' : '#1B4332', marginTop: '4px' }}>
            {observedPrep ? `${observedPrep} mins` : `${configuredPrep} mins`}
          </div>
          <div style={{ fontSize: '0.74rem', color: isDelayed ? '#EF4444' : 'var(--ws-text-muted)', marginTop: '2px' }}>
            {isDelayed ? `Exceeding target (${configuredPrep}m)` : `Target: ${configuredPrep}m average`}
          </div>
        </div>
      </div>

      {/* Order Status Funnel Visual Breakdown */}
      <div>
        <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', fontWeight: 800, marginBottom: '8px' }}>
          ORDER STAGES VOLUME (TOTAL {totalOrders})
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: '8px'
        }}>
          {funnelStages.map((stg) => (
            <div
              key={stg.label}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>
                {stg.label}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: stg.color, marginTop: '2px' }}>
                {stg.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
