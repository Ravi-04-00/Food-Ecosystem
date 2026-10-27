import React, { useState } from 'react';
import { 
  Users, Store, Bike, ShoppingBag, ArrowUpRight, 
  ChevronDown, ShieldCheck, CheckCircle2, UserPlus, PackageCheck, UserCheck
} from 'lucide-react';

export const FDAdminReferenceDashboard = ({
  kpis = {},
  onNavigate = null
}) => {
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [activeTab, setActiveTab] = useState('reference'); // 'reference' or 'live'

  // Reference KPI Cards from the uploaded master image
  const referenceKpis = [
    {
      id: 'users',
      title: 'Total Users',
      value: '12,458',
      growth: '+8%',
      growthPositive: true,
      icon: Users,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    },
    {
      id: 'restaurants',
      title: 'Restaurants',
      value: '248',
      growth: '+5%',
      growthPositive: true,
      icon: Store,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    },
    {
      id: 'delivery',
      title: 'Delivery Partners',
      value: '642',
      growth: '+12%',
      growthPositive: true,
      icon: Bike,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: '8,932',
      growth: '+14%',
      growthPositive: true,
      icon: ShoppingBag,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    }
  ];

  // Reference Recent Activity Feed from the uploaded master image
  const referenceRecentActivity = [
    {
      id: 1,
      title: 'New restaurant approved',
      detail: 'The Green Bowl',
      time: '5m ago',
      icon: Store,
      iconBg: '#D8F3DC',
      iconColor: '#163D2B'
    },
    {
      id: 2,
      title: 'User registered',
      detail: 'David K.',
      time: '12m ago',
      icon: UserPlus,
      iconBg: '#DBEAFE',
      iconColor: '#1E40AF'
    },
    {
      id: 3,
      title: 'Order completed',
      detail: '#FD8921',
      time: '15m ago',
      icon: PackageCheck,
      iconBg: '#D8F3DC',
      iconColor: '#163D2B'
    },
    {
      id: 4,
      title: 'New delivery partner',
      detail: 'Arun P.',
      time: '25m ago',
      icon: Bike,
      iconBg: '#EDE9FE',
      iconColor: '#6D28D9'
    }
  ];

  // SVG Chart points for Last 7 Days (Mon-Sun orders)
  const chartPoints = [
    { day: 'Mon', val: '820', x: 40, y: 155 },
    { day: 'Tue', val: '980', x: 125, y: 135 },
    { day: 'Wed', val: '1,150', x: 210, y: 110 },
    { day: 'Thu', val: '1,040', x: 295, y: 125 },
    { day: 'Fri', val: '1,380', x: 380, y: 70 },
    { day: 'Sat', val: '1,650', x: 465, y: 40 },
    { day: 'Sun', val: '1,490', x: 550, y: 55 }
  ];

  const svgPathD = `M 40 155 C 80 145, 100 140, 125 135 C 160 125, 185 115, 210 110 C 245 105, 270 130, 295 125 C 330 115, 355 80, 380 70 C 415 55, 440 40, 465 40 C 500 40, 525 55, 550 55`;
  const areaPathD = `${svgPathD} L 550 185 L 40 185 Z`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Reference Design Header Banner */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '24px 28px',
        border: '1px solid #E1EBE3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 10px rgba(22, 61, 43, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #163D2B 0%, #1B4332 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(22, 61, 43, 0.2)'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#163D2B',
                margin: 0,
                fontFamily: "'Manrope', sans-serif"
              }}>
                Admin Dashboard
              </h1>
              <span style={{
                background: '#D8F3DC',
                color: '#163D2B',
                border: '1px solid #B7E4C7',
                borderRadius: '999px',
                padding: '2px 10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                FD SPEC MATCH
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#65776B', margin: '4px 0 0 0' }}>
              Platform-wide ecosystem telemetry, rider fleet activity & growth metrics
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            background: '#F7FBF7',
            border: '1px solid #E1EBE3',
            borderRadius: '10px',
            padding: '3px'
          }}>
            <button
              onClick={() => setActiveTab('reference')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'reference' ? '#163D2B' : 'transparent',
                color: activeTab === 'reference' ? '#FFFFFF' : '#65776B',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Exact Spec View
            </button>
            <button
              onClick={() => setActiveTab('live')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'live' ? '#163D2B' : 'transparent',
                color: activeTab === 'live' ? '#FFFFFF' : '#65776B',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Live DB Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* 4 Top Metric Cards (Exact Proportions and Color System) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {referenceKpis.map(card => {
          const Icon = card.icon;
          let val = card.value;
          if (activeTab === 'live') {
            if (card.id === 'users' && kpis.total_customers) val = kpis.total_customers.toLocaleString();
            if (card.id === 'restaurants' && kpis.total_restaurants) val = kpis.total_restaurants.toLocaleString();
            if (card.id === 'delivery' && kpis.total_delivery_partners) val = kpis.total_delivery_partners.toLocaleString();
            if (card.id === 'orders' && kpis.total_orders) val = kpis.total_orders.toLocaleString();
          }

          return (
            <div
              key={card.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #E1EBE3',
                padding: '20px 22px',
                boxShadow: '0 2px 8px rgba(22, 61, 43, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.84rem',
                  color: '#65776B',
                  fontWeight: 600
                }}>
                  {card.title}
                </span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.iconColor
                }}>
                  <Icon size={19} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: '#163D2B',
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: '-0.5px'
                }}>
                  {val}
                </span>

                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#163D2B',
                  background: '#D8F3DC',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  <ArrowUpRight size={13} />
                  {card.growth}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid: Order Overview Chart (Left) + Recent Activity Feed (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Order Overview Chart */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E1EBE3',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(22, 61, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: '1.4'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#163D2B',
                margin: 0,
                fontFamily: "'Manrope', sans-serif"
              }}>
                Order Overview
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#65776B' }}>
                Ecosystem order volume trends across city zones
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #E1EBE3',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#163D2B',
              background: '#F7FBF7',
              cursor: 'pointer'
            }}>
              <span>{timeRange}</span>
              <ChevronDown size={14} color="#65776B" />
            </div>
          </div>

          {/* SVG Smooth Line Spline */}
          <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: '10px' }}>
            <svg 
              viewBox="0 0 600 200" 
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="fdAdminOrderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#52B788" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#52B788" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="40" x2="570" y2="40" stroke="#E1EBE3" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="30" y1="100" x2="570" y2="100" stroke="#E1EBE3" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="30" y1="160" x2="570" y2="160" stroke="#E1EBE3" strokeDasharray="4 4" strokeWidth="1" />

              {/* Gradient Filled Area */}
              <path 
                d={areaPathD} 
                fill="url(#fdAdminOrderGradient)" 
              />

              {/* Line Stroke */}
              <path 
                d={svgPathD} 
                fill="none" 
                stroke="#52B788" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />

              {/* Points */}
              {chartPoints.map((pt) => (
                <g key={pt.day}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="5" 
                    fill="#163D2B" 
                    stroke="#FFFFFF" 
                    strokeWidth="2.5" 
                  />
                  <text 
                    x={pt.x} 
                    y="196" 
                    textAnchor="middle" 
                    fontSize="11" 
                    fill="#65776B" 
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                  >
                    {pt.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid #E1EBE3',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: '#65776B' }}>
              Fulfillment Rate: <strong style={{ color: '#163D2B' }}>99.2% Successful</strong>
            </span>
            <span style={{ color: '#163D2B', fontWeight: 800 }}>
              Avg Delivery Time: 26 mins
            </span>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E1EBE3',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(22, 61, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: '1'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#163D2B',
                margin: 0,
                fontFamily: "'Manrope', sans-serif"
              }}>
                Recent Activity
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#65776B' }}>
                Real-time operational events log
              </span>
            </div>

            <span style={{
              background: '#D8F3DC',
              color: '#163D2B',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              ● LIVE STREAM
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
            {referenceRecentActivity.map((act) => {
              const Icon = act.icon;
              return (
                <div 
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: '#F7FBF7',
                    border: '1px solid #E1EBE3',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: act.iconBg,
                      color: act.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#163D2B' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#65776B', fontWeight: 500 }}>
                        {act.detail}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.74rem',
                    color: '#65776B',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {act.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
