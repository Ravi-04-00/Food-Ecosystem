import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, TrendingUp, Package, Award, ArrowUpRight, ArrowDownRight,
  Calendar, CreditCard, ShieldCheck, Download, RefreshCw, AlertCircle, 
  CheckCircle2, Star, ShoppingBag, Utensils, Percent, Clock
} from 'lucide-react';
import { 
  fetchRestaurantAnalytics, 
  downloadRestaurantAnalyticsCSV 
} from '../services/api.js';

export const RevenueAnalyticsPage = () => {
  // Date range filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preset, setPreset] = useState('7d');
  const [comparePrior, setComparePrior] = useState(true);

  // Data & loading states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Preset Date Calculator
  const calculatePresetDates = useCallback((p) => {
    const end = new Date();
    const start = new Date();
    if (p === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (p === '14d') {
      start.setDate(end.getDate() - 14);
    } else if (p === '30d') {
      start.setDate(end.getDate() - 30);
    } else if (p === '90d') {
      start.setDate(end.getDate() - 90);
    }
    setDateFrom(start.toISOString().slice(0, 10));
    setDateTo(end.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    calculatePresetDates('7d');
  }, [calculatePresetDates]);

  // Load Real Verified Restaurant Analytics
  const loadData = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchRestaurantAnalytics({
        start_date: dateFrom,
        end_date: dateTo,
        compare_prior: comparePrior
      });
      setAnalyticsData(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load restaurant analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, comparePrior]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadData();
    }
  }, [dateFrom, dateTo, comparePrior, loadData]);

  // Export CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    setDownloadSuccess('');
    setErrorMessage('');
    try {
      await downloadRestaurantAnalyticsCSV({
        start_date: dateFrom,
        end_date: dateTo
      });
      setDownloadSuccess('Store analytics CSV successfully downloaded.');
      setTimeout(() => setDownloadSuccess(''), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to export store analytics CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const orderMetrics = analyticsData?.order_metrics || {};
  const topItems = analyticsData?.top_selling_items || [];
  const menuPerf = analyticsData?.menu_performance || {};
  const ratings = analyticsData?.ratings_and_reviews || {};
  const prior = analyticsData?.prior_period_comparison;

  // Key KPI values
  const totalOrders = orderMetrics.total_orders || 0;
  const completedOrders = orderMetrics.completed_orders || 0;
  const cancelledOrders = orderMetrics.cancelled_orders || 0;
  const grossOrderValue = orderMetrics.gross_order_value || 0;
  const completedRevenue = orderMetrics.completed_revenue || 0;
  const itemSalesTotal = orderMetrics.item_sales_total || 0;
  const netPayout = orderMetrics.net_payout_estimated || 0;

  const fulfillmentRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '100.0';
  const cancellationRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Title & Filter Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            VERIFIED POSTGRESQL BUSINESS INTELLIGENCE
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Store Analytics & Revenue Payouts
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
            Audited store sales, actual top-selling items, menu availability, and real customer satisfaction
          </div>
        </div>

        {/* Action Buttons: Export & Sync */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Download size={15} color="#10B981" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            style={{
              background: 'var(--ws-primary, #22C55E)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 800
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Range Controls */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '18px',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        {/* Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'var(--ws-surface-subtle)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid var(--ws-border)'
          }}>
            {['7d', '14d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => {
                  setPreset(p);
                  calculatePresetDates(p);
                }}
                style={{
                  background: preset === p ? 'var(--ws-primary, #22C55E)' : 'transparent',
                  color: preset === p ? '#FFFFFF' : 'var(--ws-text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--ws-text-muted)" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value);
                setPreset('custom');
              }}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
            <span style={{ color: 'var(--ws-text-muted)', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value);
                setPreset('custom');
              }}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Prior Period Comparison Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={comparePrior}
              onChange={e => setComparePrior(e.target.checked)}
              style={{ accentColor: '#10B981' }}
            />
            <span>Compare with Prior Period</span>
          </label>
        </div>
      </div>

      {/* Notifications */}
      {downloadSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10B981',
          color: '#10B981',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #EF4444',
          color: '#EF4444',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4 Core Financial & Fulfillment Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Gross Order Value */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>GROSS SALES VALUE</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
            ₹{Number(grossOrderValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {prior?.gov_growth_pct !== null && prior?.gov_growth_pct !== undefined ? (
            <div style={{ fontSize: '0.75rem', color: prior.gov_growth_pct >= 0 ? '#10B981' : '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {prior.gov_growth_pct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{prior.gov_growth_pct}% vs prior {preset}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
              Completed GMV: ₹{Number(completedRevenue).toFixed(2)}
            </div>
          )}
        </div>

        {/* Estimated Net Payout */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>ESTIMATED NET PAYOUT</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', margin: '8px 0 2px 0' }}>
            ₹{Number(netPayout).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            After 10% platform fee deduction
          </div>
        </div>

        {/* Completed Orders */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>FULFILLED ORDERS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3B82F6', margin: '8px 0 2px 0' }}>
            {completedOrders}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            {fulfillmentRate}% completion ({totalOrders} total)
          </div>
        </div>

        {/* Store Satisfaction */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>CUSTOMER RATING</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <Star size={16} fill="#F59E0B" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
            {ratings.average_rating ? Number(ratings.average_rating).toFixed(1) : '5.0'} ★
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            Based on {ratings.total_reviews || 0} verified reviews
          </div>
        </div>
      </div>

      {/* 2-Column: Top-Selling Dishes & Menu Item Availability */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        gap: '20px'
      }}>
        {/* Top-Selling Dishes from actual OrderItem */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--ws-shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Top Selling Dishes
            </h3>
          </div>

          {topItems.length === 0 ? (
            <div style={{
              flex: 1,
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
                No completed order items recorded
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                Delivered dishes will automatically populate top item rankings.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topItems.map((item, idx) => (
                <div
                  key={item.food_id || idx}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--ws-text-primary)' }}>
                      #{idx + 1} {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                      {item.quantity_sold} portions ordered
                    </div>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#10B981' }}>
                    ₹{Number(item.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu Performance & Dish Availability */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--ws-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Menu Catalog & Availability
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
              Current active dish availability across customer ordering channels
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>TOTAL DISHES</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                {menuPerf.total_items || 0}
              </div>
            </div>

            <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>AVAILABLE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                {menuPerf.available_items || 0}
              </div>
            </div>

            <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>SOLD OUT</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
                {menuPerf.sold_out_items || 0}
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div style={{ borderTop: '1px solid var(--ws-border)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>VERIFIED RATING ATTRIBUTES</span>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <div style={{ flex: 1, background: 'var(--ws-surface-subtle)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--ws-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>Food Quality</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F59E0B' }}>
                  {ratings.food_quality_avg ? `${Number(ratings.food_quality_avg).toFixed(1)} ★` : '—'}
                </div>
              </div>

              <div style={{ flex: 1, background: 'var(--ws-surface-subtle)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--ws-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>Packaging Quality</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>
                  {ratings.packaging_avg ? `${Number(ratings.packaging_avg).toFixed(1)} ★` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
