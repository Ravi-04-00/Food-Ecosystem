import React, { useState } from 'react';
import { 
  ShoppingBag, DollarSign, Clock, Star, TrendingUp, 
  ChevronDown, ArrowUpRight, CheckCircle2, AlertCircle, Eye, ChefHat, Bike
} from 'lucide-react';

export const FDRestaurantReferenceDashboard = ({ 
  orders = [], 
  restaurantName = 'The Green Bowl',
  onSelectOrder = null,
  onOpenAddDish = null 
}) => {
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [activeTab, setActiveTab] = useState('reference'); // 'reference' or 'live'

  // Reference spec numbers from uploaded UI
  const referenceKpis = [
    {
      id: 'orders',
      title: 'Total Orders',
      value: '128',
      growth: '+12%',
      growthPositive: true,
      icon: ShoppingBag,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    },
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '₹12,480',
      growth: '+18%',
      growthPositive: true,
      icon: DollarSign,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    },
    {
      id: 'pending',
      title: 'Pending Orders',
      value: '8',
      growth: 'Active kitchen queue',
      growthPositive: null,
      icon: Clock,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    },
    {
      id: 'rating',
      title: 'Rating',
      value: '4.5',
      growth: '2.3k reviews',
      growthPositive: null,
      icon: Star,
      iconBg: '#D8F3DC',
      iconColor: '#1B4332'
    }
  ];

  // Reference recent orders from uploaded UI specification
  const referenceRecentOrders = [
    {
      id: '#FD1289',
      customer: 'Priya S.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      items: '2 items',
      details: 'Garden Fresh Quinoa Bowl, Mint Cooler',
      amount: '₹340',
      status: 'Preparing',
      statusColor: '#D97706',
      statusBg: '#FEF3C7',
      statusBorder: '#FDE68A'
    },
    {
      id: '#FD1288',
      customer: 'Rahul M.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
      items: '1 item',
      details: 'Paneer Makhani Roll',
      amount: '₹180',
      status: 'Ready',
      statusColor: '#163D2B',
      statusBg: '#D8F3DC',
      statusBorder: '#B7E4C7'
    },
    {
      id: '#FD1287',
      customer: 'Ananya K.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
      items: '3 items',
      details: 'Mediterranean Falafel, Hummus, Lemon Soda',
      amount: '₹520',
      status: 'Out for Delivery',
      statusColor: '#2563EB',
      statusBg: '#DBEAFE',
      statusBorder: '#BFDBFE'
    }
  ];

  // Sales spline chart points for Last 7 Days (Mon-Sun)
  // Coordinates scaled for viewBox 0 0 600 200
  const chartPoints = [
    { day: 'Mon', val: '₹8.4k', x: 40, y: 150 },
    { day: 'Tue', val: '₹9.2k', x: 125, y: 130 },
    { day: 'Wed', val: '₹10.5k', x: 210, y: 105 },
    { day: 'Thu', val: '₹9.8k', x: 295, y: 120 },
    { day: 'Fri', val: '₹11.8k', x: 380, y: 75 },
    { day: 'Sat', val: '₹13.9k', x: 465, y: 45 },
    { day: 'Sun', val: '₹12.4k', x: 550, y: 65 }
  ];

  // Build smooth cubic bezier path for SVG area
  const svgPathD = `M 40 150 C 80 140, 100 135, 125 130 C 160 120, 180 110, 210 105 C 245 100, 270 125, 295 120 C 330 110, 355 85, 380 75 C 415 60, 440 45, 465 45 C 500 45, 525 65, 550 65`;
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
            <ChefHat size={26} />
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
                Restaurant Partner Dashboard
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
              Real-time kitchen orders, daily revenue metrics & customer satisfaction
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
              Live DB Queue ({orders.length})
            </button>
          </div>

          {onOpenAddDish && (
            <button
              onClick={onOpenAddDish}
              style={{
                background: '#52B788',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(82, 183, 136, 0.3)'
              }}
            >
              + Add Dish
            </button>
          )}
        </div>
      </div>

      {/* 4 Top KPI Cards Matching Reference Image Exact Proportions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {referenceKpis.map(card => {
          const Icon = card.icon;
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
                  {activeTab === 'live' && card.id === 'orders' ? (orders.length || '128') : card.value}
                </span>

                {card.growth && (
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: card.growthPositive ? '#163D2B' : '#65776B',
                    background: card.growthPositive ? '#D8F3DC' : 'transparent',
                    padding: card.growthPositive ? '2px 8px' : '0',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {card.growthPositive && <ArrowUpRight size={13} />}
                    {card.growth}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid: Sales Overview Chart + Recent Orders Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
        gap: '20px'
      }}>
        {/* Sales Overview Chart (Smooth Green Spline) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E1EBE3',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(22, 61, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
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
                Sales Overview
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#65776B' }}>
                Daily gross restaurant revenues & peak hours
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

          {/* SVG Smooth Spline Area Curve */}
          <div style={{ position: 'relative', width: '100%', height: '210px', marginTop: '10px' }}>
            <svg 
              viewBox="0 0 600 200" 
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="fdSalesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#52B788" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#52B788" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="45" x2="570" y2="45" stroke="#E1EBE3" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="30" y1="105" x2="570" y2="105" stroke="#E1EBE3" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="30" y1="160" x2="570" y2="160" stroke="#E1EBE3" strokeDasharray="4 4" strokeWidth="1" />

              {/* Gradient Filled Area */}
              <path 
                d={areaPathD} 
                fill="url(#fdSalesGradient)" 
              />

              {/* Smooth Stroke Line */}
              <path 
                d={svgPathD} 
                fill="none" 
                stroke="#52B788" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />

              {/* Data Points */}
              {chartPoints.map((pt, idx) => (
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
              Highest Sales Day: <strong style={{ color: '#163D2B' }}>Saturday (₹13,900)</strong>
            </span>
            <span style={{ color: '#163D2B', fontWeight: 800 }}>
              +18.4% vs last week
            </span>
          </div>
        </div>

        {/* Recent Orders Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E1EBE3',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(22, 61, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
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
                Recent Orders
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#65776B' }}>
                Latest orders received from customer apps
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
              ● LIVE
            </span>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E1EBE3' }}>
                  <th style={{ padding: '8px 12px', fontSize: '0.74rem', color: '#65776B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Order ID
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: '0.74rem', color: '#65776B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Customer
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: '0.74rem', color: '#65776B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Items
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: '0.74rem', color: '#65776B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Amount
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: '0.74rem', color: '#65776B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {referenceRecentOrders.map((ord, i) => (
                  <tr 
                    key={ord.id}
                    style={{
                      borderBottom: i < referenceRecentOrders.length - 1 ? '1px solid #F0F5F1' : 'none',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '14px 12px', fontSize: '0.84rem', fontWeight: 800, color: '#163D2B' }}>
                      {ord.id}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src={ord.avatar} 
                          alt={ord.customer} 
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#163D2B' }}>
                          {ord.customer}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#163D2B' }}>
                        {ord.items}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#65776B', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ord.details}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: '0.88rem', fontWeight: 900, color: '#163D2B' }}>
                      {ord.amount}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        background: ord.statusBg,
                        color: ord.statusColor,
                        border: `1px solid ${ord.statusBorder}`,
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-block'
                      }}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
