import React, { useState } from 'react';
import { TrendingUp, BarChart3, Calendar, DollarSign, Package } from 'lucide-react';

/**
 * Fast Delivery (FD) — Responsive Pure SVG Sales & Revenue Analytics Chart
 * Renders daily timeline curves, interactive hover tooltips, and revenue/order toggle modes.
 */
export const SalesRevenueChart = ({ timeline = [], period = {} }) => {
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue' | 'orders' | 'combo'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '36px 20px',
        textAlign: 'center',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <BarChart3 size={36} color="var(--ws-text-muted)" style={{ margin: '0 auto 12px auto' }} />
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>
          No timeline activity in this date range
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
          Select a wider date range or complete customer orders to view daily revenue trends.
        </div>
      </div>
    );
  }

  // Chart dimensions & scaling
  const chartWidth = 800;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Maximum values for scaling
  const maxRevenue = Math.max(...timeline.map(t => Number(t.gross_sales || 0)), 100);
  const maxOrders = Math.max(...timeline.map(t => Number(t.orders || 0)), 5);

  const getX = (idx) => {
    if (timeline.length === 1) return paddingX + innerWidth / 2;
    return paddingX + (idx / (timeline.length - 1)) * innerWidth;
  };

  const getRevenueY = (val) => {
    return paddingY + innerHeight - (val / maxRevenue) * innerHeight;
  };

  const getOrdersY = (val) => {
    return paddingY + innerHeight - (val / maxOrders) * innerHeight;
  };

  // Generate SVG path points
  const revenuePoints = timeline.map((item, idx) => ({
    x: getX(idx),
    y: getRevenueY(Number(item.gross_sales || 0)),
    data: item
  }));

  const ordersPoints = timeline.map((item, idx) => ({
    x: getX(idx),
    y: getOrdersY(Number(item.orders || 0)),
    data: item
  }));

  const makeLinePath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x - 10} ${pts[0].y} L ${pts[0].x + 10} ${pts[0].y}`;
    return pts.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');
  };

  const makeAreaPath = (pts) => {
    if (pts.length <= 1) return '';
    const line = makeLinePath(pts);
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const bottomY = paddingY + innerHeight;
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Format short date: "2026-10-27" -> "27 Oct"
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{
      background: 'var(--ws-surface)',
      border: '1px solid var(--ws-border)',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: 'var(--ws-shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Chart Control Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="#1B4332" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
            Sales & Orders Performance Curve
          </h3>
        </div>

        {/* View Switcher: Revenue | Orders | Combo */}
        <div style={{
          display: 'flex',
          background: 'var(--ws-surface-subtle)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--ws-border)',
          gap: '4px'
        }}>
          <button
            onClick={() => setMetricMode('revenue')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: metricMode === 'revenue' ? '#1B4332' : 'transparent',
              color: metricMode === 'revenue' ? '#FFFFFF' : 'var(--ws-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Gross Revenue (₹)
          </button>
          <button
            onClick={() => setMetricMode('orders')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: metricMode === 'orders' ? '#1B4332' : 'transparent',
              color: metricMode === 'orders' ? '#FFFFFF' : 'var(--ws-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Order Volume (#)
          </button>
          <button
            onClick={() => setMetricMode('combo')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: metricMode === 'combo' ? '#1B4332' : 'transparent',
              color: metricMode === 'combo' ? '#FFFFFF' : 'var(--ws-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Combined View
          </button>
        </div>
      </div>

      {/* SVG Responsive Container */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Emerald Gradient for Revenue */}
            <linearGradient id="fdRevenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52B788" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#52B788" stopOpacity="0.0" />
            </linearGradient>

            {/* Amber Gradient for Orders */}
            <linearGradient id="fdOrdersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + innerHeight * (1 - pct);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="var(--ws-border)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--ws-text-muted)"
                  fontWeight="600"
                >
                  {metricMode === 'orders'
                    ? Math.round(maxOrders * pct)
                    : `₹${Math.round(maxRevenue * pct)}`}
                </text>
              </g>
            );
          })}

          {/* Revenue Area & Line */}
          {(metricMode === 'revenue' || metricMode === 'combo') && (
            <>
              <path
                d={makeAreaPath(revenuePoints)}
                fill="url(#fdRevenueGrad)"
              />
              <path
                d={makeLinePath(revenuePoints)}
                fill="none"
                stroke="#1B4332"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {revenuePoints.map((pt, i) => (
                <circle
                  key={`rev-pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.idx === i ? 6 : 4}
                  fill="#52B788"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint({ idx: i, ...pt })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </>
          )}

          {/* Orders Area & Line */}
          {(metricMode === 'orders' || metricMode === 'combo') && (
            <>
              {metricMode === 'orders' && (
                <path
                  d={makeAreaPath(ordersPoints)}
                  fill="url(#fdOrdersGrad)"
                />
              )}
              <path
                d={makeLinePath(ordersPoints)}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray={metricMode === 'combo' ? '4 3' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {ordersPoints.map((pt, i) => (
                <circle
                  key={`ord-pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.idx === i ? 5 : 3.5}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint({ idx: i, ...pt })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </>
          )}

          {/* X Axis Date Labels */}
          {timeline.map((item, idx) => {
            // Show dates evenly spaced (at most 8 labels)
            const step = Math.ceil(timeline.length / 8);
            if (idx % step !== 0 && idx !== timeline.length - 1) return null;
            return (
              <text
                key={`label-${idx}`}
                x={getX(idx)}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ws-text-muted)"
                fontWeight="600"
              >
                {formatDateLabel(item.date)}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / chartWidth) * 100}%`,
            top: `${(hoveredPoint.y / chartHeight) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'var(--ws-surface-elevated, #FFFFFF)',
            border: '1px solid var(--ws-border)',
            boxShadow: '0 8px 24px rgba(27, 67, 50, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '4px' }}>
              {formatDateLabel(hoveredPoint.data.date)}
            </div>
            <div style={{ color: '#1B4332', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#52B788' }}></span>
              Gross Sales: ₹{Number(hoveredPoint.data.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></span>
              Orders: {hoveredPoint.data.orders} ({hoveredPoint.data.completed} fulfilled)
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        fontSize: '0.78rem',
        color: 'var(--ws-text-muted)',
        borderTop: '1px solid var(--ws-border)',
        paddingTop: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#1B4332', borderRadius: '2px' }}></span>
          <span>Gross Revenue Curve (INR)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#F59E0B', borderRadius: '2px' }}></span>
          <span>Order Volume (#)</span>
        </div>
      </div>
    </div>
  );
};
