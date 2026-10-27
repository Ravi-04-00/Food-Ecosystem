import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, Download, Calendar, RefreshCw, 
  TrendingUp, DollarSign, ShoppingBag, Bike, ShieldCheck,
  CheckCircle2, AlertCircle, FileText, Info, X, Store,
  Users, Percent, BarChart3, Clock, HelpCircle, ChevronRight
} from 'lucide-react';
import { 
  fetchAdminAnalyticsSummary,
  fetchAdminAnalyticsCharts,
  downloadAdminAnalyticsCSV,
  fetchMetricDefinitions,
  fetchAdminReportsSummary
} from '../services/api.js';

export const AdminReportsPage = () => {
  // Filters & State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preset, setPreset] = useState('7d');
  const [interval, setInterval] = useState('day');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [definitionsData, setDefinitionsData] = useState(null);
  const [showDefinitionsModal, setShowDefinitionsModal] = useState(false);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState({ orders: false, restaurants: false, delivery_partners: false, payments: false });
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

  // Load Verified Analytics Summary & Charts
  const loadAnalytics = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const filterParams = {
        start_date: dateFrom,
        end_date: dateTo,
        order_status: orderStatusFilter !== 'ALL' ? orderStatusFilter : undefined,
        payment_status: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
      };

      const [summaryRes, chartsRes] = await Promise.all([
        fetchAdminAnalyticsSummary(filterParams).catch(err => {
          console.warn('Analytics summary fallback:', err);
          return fetchAdminReportsSummary({ date_from: dateFrom, date_to: dateTo });
        }),
        fetchAdminAnalyticsCharts({
          start_date: dateFrom,
          end_date: dateTo,
          interval: interval
        }).catch(err => {
          console.warn('Charts load warning:', err);
          return null;
        })
      ]);

      setSummaryData(summaryRes);
      setChartsData(chartsRes);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load verified analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, interval, orderStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadAnalytics();
    }
  }, [dateFrom, dateTo, interval, orderStatusFilter, paymentStatusFilter, loadAnalytics]);

  // Load Metric Definitions
  const handleOpenDefinitions = async () => {
    setShowDefinitionsModal(true);
    if (!definitionsData) {
      try {
        const defs = await fetchMetricDefinitions();
        setDefinitionsData(defs);
      } catch (err) {
        console.warn('Error fetching definitions:', err);
      }
    }
  };

  // CSV Export with PII Masking and Audit Trail
  const handleExportCSV = async (reportType) => {
    setIsExporting(prev => ({ ...prev, [reportType]: true }));
    setDownloadSuccess('');
    setErrorMessage('');
    try {
      await downloadAdminAnalyticsCSV(reportType, {
        start_date: dateFrom,
        end_date: dateTo,
        order_status: orderStatusFilter !== 'ALL' ? orderStatusFilter : undefined
      });
      setDownloadSuccess(`Successfully generated & downloaded ${reportType.toUpperCase()} audit report CSV (PII masked, audit event logged).`);
      setTimeout(() => setDownloadSuccess(''), 6000);
    } catch (err) {
      setErrorMessage(err.message || `Failed to export ${reportType} CSV`);
    } finally {
      setIsExporting(prev => ({ ...prev, [reportType]: false }));
    }
  };

  // Safe KPI extractors
  const totalOrders = summaryData?.total_orders ?? summaryData?.orders?.total_orders ?? 0;
  const completedOrders = summaryData?.completed_orders ?? summaryData?.orders?.completed_orders ?? 0;
  const cancelledOrders = summaryData?.cancelled_orders ?? summaryData?.orders?.cancelled_orders ?? 0;
  const gov = summaryData?.gross_order_value ?? summaryData?.financial?.total_gmv ?? 0;
  const capturedPayments = summaryData?.verified_captured_payments ?? summaryData?.financial?.subtotal_items ?? 0;
  const refunds = summaryData?.verified_refunds ?? 0;
  const aov = summaryData?.average_order_value ?? (totalOrders > 0 ? (gov / totalOrders).toFixed(2) : '0.00');
  const activeRestaurants = summaryData?.active_restaurants ?? 0;
  const activeDeliveryPartners = summaryData?.active_delivery_partners ?? 0;

  const economics = summaryData?.economics || {};
  const discounts = summaryData?.discounts || {};

  // Chart datasets
  const timeline = chartsData?.orders_timeline || [];
  const paymentDist = chartsData?.payment_status_distribution || [];
  const orderStatusDist = chartsData?.order_status_distribution || [];
  const topRestaurants = chartsData?.restaurant_performance || [];
  const deliveryTrends = chartsData?.delivery_trends || [];
  const cancellationReasons = chartsData?.cancellation_reasons || [];
  const couponTrends = chartsData?.coupon_trends || [];

  // Max value for timeline chart scaling
  const maxTimelineGov = Math.max(...timeline.map(t => t.gross_order_value || 0), 100);
  const maxTimelineOrders = Math.max(...timeline.map(t => t.order_count || 0), 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Top Banner / Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            POSTGRESQL AUDITED BUSINESS INTELLIGENCE • ASIA/KOLKATA STANDARDIZED
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Advanced Analytics & BI Control
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Real aggregations, zero-fabrication metrics, strict escrow reconciliation & PII-masked streaming audit exports
          </div>
        </div>

        {/* Action Buttons: Metric Definitions & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenDefinitions}
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
            <HelpCircle size={15} color="#10B981" />
            <span>Metric Definitions</span>
          </button>

          <button
            onClick={loadAnalytics}
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
            <span>{isLoading ? 'Syncing...' : 'Sync BI Data'}</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
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
        {/* Presets & Custom Dates */}
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

        {/* Intervals & Status Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Interval Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>INTERVAL:</span>
            <div style={{
              display: 'flex',
              background: 'var(--ws-surface-subtle)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--ws-border)'
            }}>
              {['day', 'week', 'month'].map(int => (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  style={{
                    background: interval === int ? '#3B82F6' : 'transparent',
                    color: interval === int ? '#FFFFFF' : 'var(--ws-text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>

          {/* Order Status */}
          <select
            value={orderStatusFilter}
            onChange={e => setOrderStatusFilter(e.target.value)}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'var(--ws-text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            <option value="ALL">All Order Statuses</option>
            <option value="DELIVERED">Delivered Only</option>
            <option value="CANCELLED">Cancelled Only</option>
            <option value="NEW">New (Unconfirmed)</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentStatusFilter}
            onChange={e => setPaymentStatusFilter(e.target.value)}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'var(--ws-text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Captured (Paid / Settled)</option>
            <option value="PENDING">Pending Verification</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
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

      {/* 9 Verified Core KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* 1. Total Orders */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>TOTAL ORDERS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '8px' }}>
            {Number(totalOrders).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            All orders created in window
          </div>
        </div>

        {/* 2. Completed Orders */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>COMPLETED ORDERS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '8px' }}>
            {Number(completedOrders).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            {totalOrders > 0 ? `${((completedOrders / totalOrders) * 100).toFixed(1)}% fulfillment rate` : '0%'}
          </div>
        </div>

        {/* 3. Cancelled Orders */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>CANCELLED ORDERS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', marginTop: '8px' }}>
            {Number(cancelledOrders).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            {totalOrders > 0 ? `${((cancelledOrders / totalOrders) * 100).toFixed(1)}% dropoff` : '0%'}
          </div>
        </div>

        {/* 4. Gross Order Value (GOV) */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>GROSS ORDER VALUE</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '8px' }}>
            ₹{Number(gov).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Pre-settlement gross merchandise
          </div>
        </div>

        {/* 5. Verified Captured Payments */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>CAPTURED PAYMENTS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '8px' }}>
            ₹{Number(capturedPayments).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Verified in bank escrow
          </div>
        </div>

        {/* 6. Verified Refunds */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>VERIFIED REFUNDS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8B5CF6', marginTop: '8px' }}>
            ₹{Number(refunds).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Authoritative processed refunds
          </div>
        </div>

        {/* 7. Average Order Value (AOV) */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>AVERAGE ORDER VALUE</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '8px' }}>
            ₹{Number(aov).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Gross basket size per transaction
          </div>
        </div>

        {/* 8. Active Restaurants */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>ACTIVE RESTAURANTS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <Store size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '8px' }}>
            {Number(activeRestaurants).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Approved & currently accepting
          </div>
        </div>

        {/* 9. Active Delivery Partners */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '18px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>ACTIVE COURIERS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899' }}>
              <Bike size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '8px' }}>
            {Number(activeDeliveryPartners).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
            Verified & currently online
          </div>
        </div>
      </div>

      {/* Platform & Merchant Economics Strip */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>PLATFORM COMMISSION (10%)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            ₹{Number(economics.platform_commission || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>RESTAURANT SETTLEMENT POOL</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
            ₹{Number(economics.restaurant_settlement || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>DELIVERY FLEET PAYOUTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>
            ₹{Number(economics.delivery_payouts || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800 }}>PROMOTIONAL DISCOUNTS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>
            ₹{Number(discounts.total_discounts || 0).toFixed(2)}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>
            ({discounts.coupons_used_count || 0} coupons redeemed)
          </span>
        </div>
      </div>

      {/* Visualizations Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Chart 1: Orders and GOV Timeline */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '22px',
          padding: '24px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                Orders & Gross Order Value Timeline
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                Aggregated by {interval} ({dateFrom} to {dateTo})
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3B82F6' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>Orders</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10B981' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>Gross Value (₹)</span>
              </div>
            </div>
          </div>

          {timeline.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
              No orders registered during this timeframe.
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              height: '220px',
              paddingTop: '20px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--ws-border)'
            }}>
              {timeline.map((entry, idx) => {
                const orderPct = Math.min(100, Math.max(10, (entry.order_count / maxTimelineOrders) * 100));
                const govPct = Math.min(100, Math.max(10, (entry.gross_order_value / maxTimelineGov) * 100));
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 50px', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                      ₹{Math.round(entry.gross_order_value)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%', width: '100%', justifyContent: 'center' }}>
                      {/* Orders Bar */}
                      <div
                        style={{
                          width: '16px',
                          height: `${orderPct}%`,
                          background: '#3B82F6',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }}
                        title={`Orders: ${entry.order_count}`}
                      />
                      {/* GOV Bar */}
                      <div
                        style={{
                          width: '16px',
                          height: `${govPct}%`,
                          background: '#10B981',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }}
                        title={`GOV: ₹${entry.gross_order_value}`}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--ws-text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {entry.period.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2-Column Grid: Payment Distribution & Order Status Distribution */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px'
        }}>
          {/* Payment Status Distribution */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            padding: '22px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 14px 0' }}>
              Payment Status Distribution
            </h3>
            {paymentDist.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
                No payment transactions recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentDist.map(item => {
                  const colors = {
                    PAID: '#10B981',
                    VERIFIED_PAID: '#10B981',
                    SETTLED: '#059669',
                    PENDING: '#F59E0B',
                    PAYMENT_PENDING: '#F59E0B',
                    PAYMENT_PROCESSING: '#F59E0B',
                    FAILED: '#EF4444',
                    REFUNDED: '#8B5CF6',
                    PARTIALLY_REFUNDED: '#A78BFA'
                  };
                  const color = colors[item.status] || '#64748B';
                  return (
                    <div
                      key={item.status}
                      style={{
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                          ({item.count} txns)
                        </span>
                      </div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                        ₹{Number(item.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Status Distribution */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            padding: '22px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 14px 0' }}>
              Order Lifecycle Breakdown
            </h3>
            {orderStatusDist.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
                No order lifecycle entries found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {orderStatusDist.map(item => {
                  const colors = {
                    NEW: '#3B82F6',
                    ACCEPTED: '#6366F1',
                    PREPARING: '#F59E0B',
                    READY_FOR_PICKUP: '#8B5CF6',
                    OUT_FOR_DELIVERY: '#EC4899',
                    DELIVERED: '#10B981',
                    CANCELLED: '#EF4444'
                  };
                  const color = colors[item.status] || '#64748B';
                  return (
                    <div
                      key={item.status}
                      style={{
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '2px' }}>
                        {item.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Top Restaurants Performance & Delivery Trends */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px'
        }}>
          {/* Top Restaurant Performance */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            padding: '22px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 14px 0' }}>
              Top Performing Restaurants (Delivered Sales)
            </h3>
            {topRestaurants.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
                No completed restaurant orders recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topRestaurants.slice(0, 6).map((rest, idx) => (
                  <div
                    key={rest.restaurant__id || idx}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        #{idx + 1} {rest.restaurant__name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                        {rest.completed_orders} delivered of {rest.total_orders} total orders
                      </div>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#10B981' }}>
                      ₹{Number(rest.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Completion Trends */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            padding: '22px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 14px 0' }}>
              Delivery Fleet Completion Trends
            </h3>
            {deliveryTrends.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
                No dispatch assignments found for this period.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deliveryTrends.slice(-6).map((dt, idx) => (
                  <div
                    key={dt.period || idx}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        {dt.period}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                        Total Assigned: {dt.total_assigned}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>
                        ✓ {dt.completed} delivered
                      </span>
                      {dt.cancelled > 0 && (
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#EF4444' }}>
                          ✕ {dt.cancelled} dropped
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Cancellation Reasons & Coupon Usage Trends */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px'
        }}>
          {/* Cancellation Reasons Breakdown */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            padding: '22px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 14px 0' }}>
              Cancellation Reasons Distribution
            </h3>
            {cancellationReasons.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#10B981', fontSize: '0.85rem' }}>
                ✓ Zero cancelled orders recorded with logged reasons in this period!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cancellationReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)', fontWeight: 600 }}>
                      {reason.cancellation_reason}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EF4444' }}>
                      {reason.count} orders
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coupon Usage & Discount Trends */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '22px',
            padding: '22px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 14px 0' }}>
              Promotional Redemptions by {interval}
            </h3>
            {couponTrends.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
                No coupon redemptions recorded for this period.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {couponTrends.slice(-6).map((ct, idx) => (
                  <div
                    key={ct.period || idx}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                        {ct.period}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                        {ct.redemptions_count} coupons applied
                      </div>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#8B5CF6' }}>
                      -₹{Number(ct.total_discounts || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4 Streaming CSV Export Cards with PII Masking and Audit Trail */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
            Streaming CSV Audit Downloads
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
            Authoritative CSV exports streamed from PostgreSQL with phone numbers masked, coordinates excluded, and audited.
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {/* Orders CSV */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', marginBottom: '4px' }}>
                <FileSpreadsheet size={18} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>ORDERS REPORT CSV</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 4px 0' }}>
                Orders Audit Trail
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Orders, timestamps, fees, statuses, customer ID & phone masked (98****).
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('orders')}
              disabled={isExporting.orders}
              style={{
                background: 'var(--ws-primary, #22C55E)',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 14px',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>{isExporting.orders ? 'Generating...' : 'Download Orders CSV'}</span>
            </button>
          </div>

          {/* Restaurants CSV */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', marginBottom: '4px' }}>
                <Store size={18} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>RESTAURANTS CSV</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 4px 0' }}>
                Merchants Performance
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Active restaurants, orders handled, delivered sales volume & menu dish count.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('restaurants')}
              disabled={isExporting.restaurants}
              style={{
                background: '#F59E0B',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 14px',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>{isExporting.restaurants ? 'Generating...' : 'Download Kitchens CSV'}</span>
            </button>
          </div>

          {/* Delivery Partners CSV */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284C7', marginBottom: '4px' }}>
                <Bike size={18} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>DELIVERY FLEET CSV</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 4px 0' }}>
                Couriers Fulfillment
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Partner tasks, delivered count, avg transit minutes, earnings (no GPS leaked).
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('delivery_partners')}
              disabled={isExporting.delivery_partners}
              style={{
                background: '#0284C7',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 14px',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>{isExporting.delivery_partners ? 'Generating...' : 'Download Couriers CSV'}</span>
            </button>
          </div>

          {/* Payments CSV */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6', marginBottom: '4px' }}>
                <DollarSign size={18} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>PAYMENTS AUDIT CSV</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 4px 0' }}>
                Gateway Settlements
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Transaction IDs, methods, amounts, statuses, and refund records.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('payments')}
              disabled={isExporting.payments}
              style={{
                background: '#8B5CF6',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 14px',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>{isExporting.payments ? 'Generating...' : 'Download Payments CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Definitions & Accounting Policy Modal */}
      {showDefinitionsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>
                  BUSINESS INTELLIGENCE & AUDIT COMPLIANCE
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
                  Accounting Standards & Metric Definitions
                </h3>
              </div>
              <button
                onClick={() => setShowDefinitionsModal(false)}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '6px',
                  color: 'var(--ws-text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', color: 'var(--ws-text-secondary)', lineHeight: 1.5 }}>
              <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>1. Gross Order Value (GOV) vs Net Platform Revenue:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  GOV represents the total pre-settlement merchandise value of all placed orders including food items, delivery fees, and taxes. Recognized platform revenue strictly accounts only for the platform commission (10%) and delivery fees collected.
                </p>
              </div>

              <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>2. Captured Payments vs In-Flight/Failed:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Only payments with verified statuses (PAID, SETTLED, VERIFIED_PAID) are counted towards captured settlement amounts. Pending and failed transactions are segregated to ensure bank escrow integrity.
                </p>
              </div>

              <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>3. Authoritative Refund Auditing:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Refund amounts are tracked exclusively through explicit refund records on payment objects (refund_amount & REFUNDED status), never by guessing or subtracting order subtotals.
                </p>
              </div>

              <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>4. Average Delivery Duration Calculation:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Transit durations are computed strictly from real timestamps: (delivered_at - picked_up_at). Durations are verified to ensure delivered_at &gt; picked_up_at with reasonability bounds between 2 and 180 minutes. Missing or invalid timestamps are not fabricated.
                </p>
              </div>

              <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>5. PII Masking & Data Protection:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  All customer phone numbers are masked (e.g. 98****3210) and exact delivery GPS coordinates are completely excluded from analytics endpoints and CSV exports to maintain user privacy.
                </p>
              </div>

              <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>6. Timezone & Currency:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  All analytical aggregations and CSV exports are standardized in Indian Standard Time (Asia/Kolkata) and Indian Rupees (₹).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={() => setShowDefinitionsModal(false)}
                style={{
                  background: 'var(--ws-primary, #22C55E)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Close Policy Reference
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
