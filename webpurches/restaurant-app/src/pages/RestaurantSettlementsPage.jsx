import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, TrendingUp, Package, ShieldCheck, Download, RefreshCw, 
  AlertCircle, CheckCircle2, Clock, Landmark, Calendar, ChevronRight,
  Eye, FileSpreadsheet, Percent, HelpCircle, ArrowUpRight, X, ArrowDownRight
} from 'lucide-react';
import { 
  fetchRestaurantEarnings,
  fetchRestaurantSettlements,
  fetchRestaurantSettlementDetail,
  fetchRestaurantCommissionOrders,
  downloadRestaurantSettlementStatementCSV
} from '../services/api.js';

export const RestaurantSettlementsPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('batches'); // 'batches' | 'orders'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preset, setPreset] = useState('30d');

  // Earnings Summary & Settlement Data
  const [earnings, setEarnings] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [commissionOrders, setCommissionOrders] = useState([]);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Preset Date Calculator
  const applyPreset = useCallback((p) => {
    setPreset(p);
    const end = new Date();
    const start = new Date();
    if (p === '7d') start.setDate(end.getDate() - 7);
    else if (p === '30d') start.setDate(end.getDate() - 30);
    else if (p === '90d') start.setDate(end.getDate() - 90);
    setDateFrom(start.toISOString().slice(0, 10));
    setDateTo(end.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    applyPreset('30d');
  }, [applyPreset]);

  // Load All Financial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = { start_date: dateFrom, end_date: dateTo };
      const [earningsRes, settlementsRes, ordersRes] = await Promise.all([
        fetchRestaurantEarnings(params).catch(() => null),
        fetchRestaurantSettlements(params).catch(() => ({ results: [] })),
        fetchRestaurantCommissionOrders(params).catch(() => ({ results: [] }))
      ]);

      if (earningsRes) setEarnings(earningsRes);
      if (settlementsRes) setSettlements(settlementsRes.results || []);
      if (ordersRes) setCommissionOrders(ordersRes.results || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load financial ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadData();
    }
  }, [dateFrom, dateTo, loadData]);

  // View Settlement Breakdown Modal
  const handleOpenDetail = async (ref) => {
    try {
      const detail = await fetchRestaurantSettlementDetail(ref);
      setSelectedSettlement(detail);
    } catch (err) {
      alert(err.message || 'Failed to fetch settlement detail');
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    setIsExporting(true);
    setDownloadSuccess('');
    try {
      await downloadRestaurantSettlementStatementCSV({ start_date: dateFrom, end_date: dateTo });
      setDownloadSuccess('Settlement statement CSV downloaded successfully.');
      setTimeout(() => setDownloadSuccess(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to export CSV statement');
    } finally {
      setIsExporting(false);
    }
  };

  const metrics = earnings?.metrics || {};

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            POSTGRESQL AUDITED EARNINGS & SETTLEMENTS
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Restaurant Earnings & Settlements
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
            Explicit food subtotal commission base, merchant packaging credit, verified bank UTRs, and zero fabricated balances
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={isLoading}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Download size={14} />
            <span>{isExporting ? 'Exporting...' : 'Download Statement CSV'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', color: '#10B981', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', color: '#EF4444', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Date Filter Strip */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '16px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)' }}>PRESET:</span>
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              style={{
                background: preset === p ? '#10B981' : 'transparent',
                color: preset === p ? '#FFFFFF' : 'var(--ws-text-secondary)',
                border: '1px solid',
                borderColor: preset === p ? '#10B981' : 'var(--ws-border)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
            <Calendar size={14} />
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setPreset('custom'); setDateFrom(e.target.value); }}
              style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setPreset('custom'); setDateTo(e.target.value); }}
              style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
            />
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Gross Food Subtotal */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px 18px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>Eligible Gross Sales</span>
            <DollarSign size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
            ₹{metrics.gross_order_value || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            Base food total across {metrics.order_count || 0} delivered orders
          </div>
        </div>

        {/* Platform Commission Deducted */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px 18px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>Platform Commission</span>
            <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
              {earnings?.active_commission_rate ? `${earnings.active_commission_rate}%` : '18%'}
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444' }}>
            -₹{metrics.platform_commission || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            Server-authoritative rate snapshot
          </div>
        </div>

        {/* Packaging Fees Credited */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px 18px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase' }}>Packaging Fees</span>
            <Package size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3B82F6' }}>
            +₹{metrics.packaging_fees || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            Direct merchant packaging reimbursement
          </div>
        </div>

        {/* Finalized Net Payable */}
        <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.15))', border: '1px solid #10B981', borderRadius: '16px', padding: '16px 18px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Finalized Net Earnings</span>
            <ShieldCheck size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>
            ₹{metrics.finalized_earnings || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-secondary)', marginTop: '4px' }}>
            Gross + Packaging - Commission
          </div>
        </div>
      </div>

      {/* Secondary Status Balances: Unsettled vs In-Flight vs Paid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Unsettled Balance (Ready for Payout) */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Unsettled Balance (Ready)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
            ₹{metrics.unsettled_balance || '0.00'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>Delivered & accrued; pending next batch</div>
        </div>

        {/* Pending Settlement Batches */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>In Settlement Processing</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
            ₹{metrics.pending_settlement || '0.00'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>Grouped in pending/processing batches</div>
        </div>

        {/* Estimated Earnings (In-Flight Orders) */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase' }}>Estimated In-Flight Earnings</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
            ₹{metrics.estimated_earnings || '0.00'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>Active prep/transit; not finalized yet</div>
        </div>

        {/* Lifetime Paid Payouts */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Completed Bank Payouts</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            ₹{metrics.completed_payout || '0.00'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>Verified transfers with bank UTR proof</div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ws-border)', gap: '16px' }}>
        <button
          onClick={() => setActiveSubTab('batches')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeSubTab === 'batches' ? '2px solid #10B981' : '2px solid transparent',
            background: 'transparent',
            color: activeSubTab === 'batches' ? '#10B981' : 'var(--ws-text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          Settlement Batches & Payouts ({settlements.length})
        </button>
        <button
          onClick={() => setActiveSubTab('orders')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeSubTab === 'orders' ? '2px solid #10B981' : '2px solid transparent',
            background: 'transparent',
            color: activeSubTab === 'orders' ? '#10B981' : 'var(--ws-text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          Order-by-Order Commission Ledger ({commissionOrders.length})
        </button>
      </div>

      {/* SUB-TAB 1: SETTLEMENT BATCHES TABLE */}
      {activeSubTab === 'batches' && (
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ws-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
              Audited Settlement Batches
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
              Grouped batches prevent duplicate payout
            </span>
          </div>

          {settlements.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <Landmark size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No settlement batches found for this period.</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Eligible delivered orders accrue in unsettled balance until batched by platform operations.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--ws-bg)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)', fontWeight: 800 }}>
                    <th style={{ padding: '12px 16px' }}>SETTLEMENT REF</th>
                    <th style={{ padding: '12px 16px' }}>PERIOD</th>
                    <th style={{ padding: '12px 16px' }}>ORDERS</th>
                    <th style={{ padding: '12px 16px' }}>GROSS SALES</th>
                    <th style={{ padding: '12px 16px' }}>COMMISSION</th>
                    <th style={{ padding: '12px 16px' }}>ADJUSTMENTS</th>
                    <th style={{ padding: '12px 16px' }}>NET PAYABLE</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px' }}>UTR / BANK PROOF</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        {s.settlement_reference}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ws-text-secondary)' }}>
                        {s.period_start} to {s.period_end}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {s.order_count}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        ₹{s.gross_sales_amount}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#EF4444', fontWeight: 700 }}>
                        -₹{s.total_commission_deducted}
                      </td>
                      <td style={{ padding: '12px 16px', color: Number(s.total_adjustments) >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                        {Number(s.total_adjustments) >= 0 ? `+₹${s.total_adjustments}` : `-₹${Math.abs(Number(s.total_adjustments))}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10B981' }}>
                        ₹{s.net_payout_amount}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor:
                            s.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' :
                            s.status === 'PROCESSING' ? 'rgba(59, 130, 246, 0.15)' :
                            s.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color:
                            s.status === 'PAID' ? '#10B981' :
                            s.status === 'PROCESSING' ? '#3B82F6' :
                            s.status === 'FAILED' ? '#EF4444' : '#F59E0B'
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ws-text-muted)', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                        {s.provider_utr || s.provider_reference || 'Pending Payout'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenDetail(s.settlement_reference)}
                          style={{
                            background: 'var(--ws-bg)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            color: 'var(--ws-text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          Breakdown
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ORDER-BY-ORDER COMMISSION LEDGER */}
      {activeSubTab === 'orders' && (
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ws-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
              Delivered Orders Commission & Net Payout Ledger
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
              Customer PII masked for merchant privacy compliance
            </span>
          </div>

          {commissionOrders.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              <Package size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No delivered commission entries found.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--ws-bg)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)', fontWeight: 800 }}>
                    <th style={{ padding: '12px 16px' }}>ORDER #</th>
                    <th style={{ padding: '12px 16px' }}>CUSTOMER</th>
                    <th style={{ padding: '12px 16px' }}>BASE SUB-TOTAL</th>
                    <th style={{ padding: '12px 16px' }}>PACKAGING</th>
                    <th style={{ padding: '12px 16px' }}>RATE %</th>
                    <th style={{ padding: '12px 16px' }}>COMMISSION</th>
                    <th style={{ padding: '12px 16px' }}>NET PAYOUT</th>
                    <th style={{ padding: '12px 16px' }}>LEDGER STATUS</th>
                    <th style={{ padding: '12px 16px' }}>DELIVERED AT</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionOrders.map((c, idx) => (
                    <tr key={c.id || idx} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                        {c.order_number}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ws-text-secondary)' }}>
                        {c.customer_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        ₹{c.calculation_base}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#3B82F6', fontWeight: 700 }}>
                        +₹{c.packaging_fee}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {c.rate_percentage}%
                      </td>
                      <td style={{ padding: '12px 16px', color: '#EF4444', fontWeight: 700 }}>
                        -₹{c.commission_amount}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10B981' }}>
                        ₹{c.net_restaurant_amount}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: c.status === 'SETTLED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: c.status === 'SETTLED' ? '#10B981' : '#F59E0B'
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ws-text-muted)', fontSize: '0.75rem' }}>
                        {c.order_delivered_at ? new Date(c.order_delivered_at).toLocaleString() : new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settlement Detail Breakdown Modal */}
      {selectedSettlement && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--ws-shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ws-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800 }}>SETTLEMENT BATCH BREAKDOWN</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
                  {selectedSettlement.settlement_reference}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Summary Strip */}
            <div style={{ padding: '16px 24px', background: 'var(--ws-bg)', borderBottom: '1px solid var(--ws-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>NET PAYOUT</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>₹{selectedSettlement.net_payout_amount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>STATUS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{selectedSettlement.status}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>BANK UTR PROOF</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedSettlement.provider_utr || 'Pending Transfer'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>PERIOD</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedSettlement.period_start} to {selectedSettlement.period_end}</div>
              </div>
            </div>

            {/* Attached Orders List */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '12px' }}>
                Included Delivered Orders ({selectedSettlement.commission_entries?.length || 0})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedSettlement.commission_entries || []).map((entry, i) => (
                  <div key={i} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.85rem' }}>
                        #{entry.order_number} • Customer: {entry.customer_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                        Base: ₹{entry.calculation_base} | Packaging: +₹{entry.packaging_fee} | Comm ({entry.rate_percentage}%): -₹{entry.commission_amount}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#10B981', fontSize: '0.92rem' }}>
                        ₹{entry.net_restaurant_amount}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>
                        Net Accrued
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjustments Section (if any) */}
              {(selectedSettlement.adjustments || []).length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '8px' }}>
                    Audited Adjustments ({selectedSettlement.adjustments.length})
                  </div>
                  {selectedSettlement.adjustments.map((adj, i) => (
                    <div key={i} style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid #3B82F6', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.82rem' }}>
                        <span>{adj.adjustment_type} by {adj.authorized_by_name}</span>
                        <span style={{ color: Number(adj.amount) >= 0 ? '#10B981' : '#EF4444' }}>
                          {Number(adj.amount) >= 0 ? `+₹${adj.amount}` : `-₹${Math.abs(Number(adj.amount))}`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)', marginTop: '2px' }}>
                        Reason: {adj.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--ws-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSettlement(null)}
                style={{
                  background: 'var(--ws-bg)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  color: 'var(--ws-text-primary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
