import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, TrendingUp, Package, Award, ArrowUpRight, ArrowDownRight,
  Calendar, CreditCard, ShieldCheck, Download, RefreshCw, AlertCircle, 
  CheckCircle2, Star, ShoppingBag, Utensils, Percent, Clock, Sparkles
} from 'lucide-react';
import { 
  fetchRestaurantAnalytics, 
  downloadRestaurantAnalyticsCSV 
} from '../services/api.js';
import { SalesRevenueChart } from '../components/analytics/SalesRevenueChart.jsx';
import { DishPerformanceCard } from '../components/analytics/DishPerformanceCard.jsx';
import { OrderFulfillmentCard } from '../components/analytics/OrderFulfillmentCard.jsx';

/**
 * Fast Delivery (FD) — Advanced Restaurant Analytics & Performance Dashboard
 * Provides audited sales curves, dish popularity breakdowns, kitchen efficiency metrics,
 * prior period comparisons, and instant CSV financial report exports.
 */
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
    if (p === '1d') {
      // Today
    } else if (p === '7d') {
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
    setPreset(p);
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

  // Export CSV Report
  const handleExportCSV = async () => {
    setIsExporting(true);
    setDownloadSuccess('');
    setErrorMessage('');
    try {
      await downloadRestaurantAnalyticsCSV({
        start_date: dateFrom,
        end_date: dateTo
      });
      setDownloadSuccess('Store financial analytics CSV successfully exported.');
      setTimeout(() => setDownloadSuccess(''), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to export store analytics CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const orderMetrics = analyticsData?.order_metrics || {};
  const topItems = analyticsData?.top_selling_items || [];
  const lowSellingItems = analyticsData?.low_selling_items || [];
  const menuPerf = analyticsData?.menu_performance || {};
  const ratings = analyticsData?.ratings_and_reviews || {};
  const timeline = analyticsData?.order_timeline || [];
  const prepTimeMetrics = analyticsData?.prep_time_metrics || {};
  const operationalAlerts = analyticsData?.operational_alerts || [];
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

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Title & Filter Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.74rem', color: '#1B4332', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', background: 'rgba(27, 67, 50, 0.08)', padding: '3px 8px', borderRadius: '6px' }}>
            FD Foods Business Intelligence
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '6px 0 2px 0' }}>
            Store Performance & Revenue Dashboard
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
            Real-time sales tracking, top-selling dishes, kitchen velocity, and financial payout reports
          </div>
        </div>

        {/* Action Buttons: Export & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              padding: '9px 16px',
              color: 'var(--ws-text-primary)',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              boxShadow: 'var(--ws-shadow-sm)',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={15} color="#1B4332" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            style={{
              background: '#1B4332',
              border: 'none',
              borderRadius: '12px',
              padding: '9px 16px',
              color: '#FFFFFF',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(27, 67, 50, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Date Range & Preset Filter Bar */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '18px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        {/* Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 800, marginRight: '4px' }}>
            PRESETS:
          </span>
          {[
            { id: '1d', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '14d', label: '14 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: 'Quarter (90d)' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => calculatePresetDates(p.id)}
              style={{
                background: preset === p.id ? '#1B4332' : 'var(--ws-surface-subtle)',
                color: preset === p.id ? '#FFFFFF' : 'var(--ws-text-secondary)',
                border: `1px solid ${preset === p.id ? '#1B4332' : 'var(--ws-border)'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {/* Prior Period Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--ws-text-secondary)', fontWeight: 600, marginLeft: '8px' }}>
            <input
              type="checkbox"
              checked={comparePrior}
              onChange={e => setComparePrior(e.target.checked)}
              style={{ accentColor: '#1B4332' }}
            />
            <span>Compare Prior</span>
          </label>
        </div>
      </div>

      {/* Notifications */}
      {downloadSuccess && (
        <div style={{
          background: 'rgba(27, 67, 50, 0.08)',
          border: '1px solid #1B4332',
          color: '#1B4332',
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
          background: 'rgba(92, 26, 36, 0.08)',
          border: '1px solid #5C1A24',
          color: '#5C1A24',
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

      {/* 4 Core Financial & Fulfillment KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        {/* Gross Order Value */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
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
            <div style={{ fontSize: '0.75rem', color: prior.gov_growth_pct >= 0 ? '#1B4332' : '#5C1A24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {prior.gov_growth_pct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{prior.gov_growth_pct}% vs prior period</span>
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
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>ESTIMATED NET PAYOUT</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(27, 67, 50, 0.12)', color: '#1B4332' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1B4332', margin: '8px 0 2px 0' }}>
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
          borderRadius: '20px',
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
            {fulfillmentRate}% fulfillment ({totalOrders} total)
          </div>
        </div>

        {/* Customer Rating */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>STORE RATING</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <Star size={16} fill="#F59E0B" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
            {ratings.average_rating ? Number(ratings.average_rating).toFixed(1) : '5.0'} ★
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
            Based on {ratings.total_reviews || 0} customer reviews
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart: Interactive Pure SVG Revenue & Orders Curve */}
      <SalesRevenueChart timeline={timeline} period={analyticsData?.period} />

      {/* 2-Column: Dish Performance Breakdown & Kitchen Efficiency Funnel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
        gap: '20px'
      }}>
        <DishPerformanceCard
          topItems={topItems}
          lowSellingItems={lowSellingItems}
          totalItemSales={itemSalesTotal}
        />

        <OrderFulfillmentCard
          orderMetrics={orderMetrics}
          prepTimeMetrics={prepTimeMetrics}
          operationalAlerts={operationalAlerts}
        />
      </div>

    </div>
  );
};
