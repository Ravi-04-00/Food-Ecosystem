import React, { useState } from 'react';
import { Award, AlertTriangle, Utensils, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

/**
 * Fast Delivery (FD) — Dish Performance & Menu Velocity Analytics Card
 * Displays ranked top-selling items with proportional sales bars, and low-velocity inventory warnings.
 */
export const DishPerformanceCard = ({ 
  topItems = [], 
  lowSellingItems = [], 
  totalItemSales = 0 
}) => {
  const [activeTab, setActiveTab] = useState('top'); // 'top' | 'low'

  const maxSales = Math.max(...topItems.map(i => Number(i.total_sales || 0)), 1);

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
      {/* Header with Tab Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'top' ? <Award size={20} color="#F59E0B" /> : <AlertTriangle size={20} color="#EF4444" />}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
            {activeTab === 'top' ? 'Top Selling Menu Items' : 'Low Velocity Inventory Alerts'}
          </h3>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--ws-surface-subtle)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--ws-border)',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('top')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'top' ? '#1B4332' : 'transparent',
              color: activeTab === 'top' ? '#FFFFFF' : 'var(--ws-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Top Sellers ({topItems.length})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'low' ? '#5C1A24' : 'transparent',
              color: activeTab === 'low' ? '#FFFFFF' : 'var(--ws-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Needs Promotion ({lowSellingItems.length})
          </button>
        </div>
      </div>

      {/* TOP SELLERS TAB CONTENT */}
      {activeTab === 'top' && (
        <>
          {topItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 16px',
              textAlign: 'center',
              background: 'var(--ws-surface-subtle)',
              borderRadius: '16px',
              border: '1px dashed var(--ws-border)'
            }}>
              <Utensils size={32} color="var(--ws-text-muted)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                No completed order items in this date range
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                Delivered dishes will automatically populate item revenue rankings.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topItems.map((item, idx) => {
                const sales = Number(item.total_sales || 0);
                const pctOfMax = Math.min(100, Math.round((sales / maxSales) * 100));
                const shareOfTotal = totalItemSales > 0 ? ((sales / totalItemSales) * 100).toFixed(1) : '—';

                return (
                  <div
                    key={item.food_id || idx}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#1B4332',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                            {item.quantity_sold} portions sold • {shareOfTotal}% revenue share
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.96rem', color: '#1B4332' }}>
                          ₹{sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(27, 67, 50, 0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pctOfMax}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #1B4332 0%, #52B788 100%)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* LOW-SELLING / INVENTORY ALERTS TAB */}
      {activeTab === 'low' && (
        <>
          {lowSellingItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 16px',
              textAlign: 'center',
              background: 'var(--ws-surface-subtle)',
              borderRadius: '16px',
              border: '1px dashed var(--ws-border)'
            }}>
              <Sparkles size={32} color="#10B981" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                Healthy Menu Velocity!
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                All available catalog items have healthy customer ordering activity.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                Active dishes with zero or minimal orders in this date range. Consider adjusting price, photos, or running discounts:
              </div>

              {lowSellingItems.map((item, idx) => (
                <div
                  key={item.food_id || idx}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid rgba(92, 26, 36, 0.15)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--ws-text-primary)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                      Stock on Hand: <strong style={{ color: item.stock <= 5 ? '#EF4444' : 'var(--ws-text-primary)' }}>{item.stock}</strong> units
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#5C1A24' }}>
                      ₹{Number(item.price || 0).toFixed(2)}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 700 }}>
                      0 orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
