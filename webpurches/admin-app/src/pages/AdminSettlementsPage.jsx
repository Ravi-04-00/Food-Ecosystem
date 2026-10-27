import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark, DollarSign, Search, RefreshCw, Filter, Eye, CheckCircle2,
  AlertCircle, Clock, ShieldCheck, Download, Plus, X, ArrowUpRight,
  TrendingUp, Percent, FileSpreadsheet, ShieldAlert, Check, ChevronRight
} from 'lucide-react';
import {
  fetchAdminSettlements,
  fetchAdminSettlementDetail,
  createAdminSettlementBatch,
  transitionAdminSettlementStatus,
  addAdminSettlementAdjustment,
  fetchAdminPaymentReconciliation,
  downloadAdminReconciliationCSV,
  fetchAdminCommissionRules,
  updateAdminCommissionRules,
  fetchAdminRestaurants
} from '../services/api.js';

export const AdminSettlementsPage = () => {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'reconciliation' | 'rules'

  // Settlements Queue State
  const [settlements, setSettlements] = useState([]);
  const [summaryCards, setSummaryCards] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected Settlement Detail Modal
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Create Batch Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [newBatchData, setNewBatchData] = useState({
    restaurant_id: '',
    period_start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Status Transition Modal (Mark Processing / Mark Paid)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('PROCESSING');
  const [statusForm, setStatusForm] = useState({
    provider_utr: '',
    provider_reference: '',
    reason: ''
  });
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Add Adjustment Modal
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_type: 'MANUAL_CORRECTION',
    amount: '',
    reason: ''
  });
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Reconciliation State
  const [reconciliation, setReconciliation] = useState(null);
  const [isReconLoading, setIsReconLoading] = useState(false);

  // Commission Rules State
  const [commissionRules, setCommissionRules] = useState(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesForm, setRulesForm] = useState({
    platform_commission_percentage: '',
    platform_commission_fixed_fee: '',
    reason: ''
  });
  const [isUpdatingRules, setIsUpdatingRules] = useState(false);

  // Load Settlements List
  const loadSettlements = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await fetchAdminSettlements(params);
      setSettlements(res.results || []);
      if (res.summary_cards) setSummaryCards(res.summary_cards);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load settlements');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  // Load Reconciliation Report
  const loadReconciliation = useCallback(async () => {
    setIsReconLoading(true);
    try {
      const res = await fetchAdminPaymentReconciliation();
      setReconciliation(res);
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsReconLoading(false);
    }
  }, []);

  // Load Commission Rules
  const loadCommissionRules = useCallback(async () => {
    try {
      const res = await fetchAdminCommissionRules();
      setCommissionRules(res);
      setRulesForm({
        platform_commission_percentage: res.platform_commission_percentage || '18.0',
        platform_commission_fixed_fee: res.platform_commission_fixed_fee || '0.0',
        reason: ''
      });
    } catch (err) {
      console.error('Commission rules error:', err);
    }
  }, []);

  // Load Restaurants for Create Modal
  const loadRestaurants = async () => {
    try {
      const res = await fetchAdminRestaurants({ page_size: 100 });
      setRestaurantsList(res.results || []);
    } catch (err) {
      console.error('Restaurants load error:', err);
    }
  };

  useEffect(() => {
    loadSettlements();
    loadReconciliation();
    loadCommissionRules();
  }, [loadSettlements, loadReconciliation, loadCommissionRules]);

  // Open Settlement Detail Modal
  const handleOpenDetail = async (ref) => {
    setIsDetailLoading(true);
    try {
      const detail = await fetchAdminSettlementDetail(ref);
      setSelectedSettlement(detail);
    } catch (err) {
      alert(err.message || 'Failed to fetch settlement detail');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Submit Create Settlement Batch
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatchData.restaurant_id) {
      alert('Please select a restaurant');
      return;
    }
    setIsSubmittingBatch(true);
    try {
      const res = await createAdminSettlementBatch(newBatchData);
      setActionSuccess(`Batch #${res.settlement.settlement_reference} created with ${res.settlement.order_count} orders.`);
      setCreateModalOpen(false);
      loadSettlements();
      loadReconciliation();
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      alert(err.error || 'Failed to create settlement batch.');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Submit Status Transition
  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (targetStatus === 'PAID' && !statusForm.provider_utr.trim()) {
      alert('A verified provider UTR or settlement transaction reference is strictly mandatory.');
      return;
    }
    setIsSubmittingStatus(true);
    try {
      const res = await transitionAdminSettlementStatus(selectedSettlement.settlement_reference, {
        status: targetStatus,
        provider_utr: statusForm.provider_utr,
        provider_reference: statusForm.provider_reference,
        reason: statusForm.reason
      });
      setSelectedSettlement(res.settlement);
      setActionSuccess(`Settlement transitioned to ${targetStatus} successfully.`);
      setStatusModalOpen(false);
      loadSettlements();
      loadReconciliation();
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      alert(err.error || 'Failed to update status.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Submit Adjustment
  const handleAddAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentForm.reason.trim() || !adjustmentForm.amount) {
      alert('Amount and reason are mandatory.');
      return;
    }
    setIsSubmittingAdjustment(true);
    try {
      const res = await addAdminSettlementAdjustment(selectedSettlement.settlement_reference, {
        adjustment_type: adjustmentForm.adjustment_type,
        amount: adjustmentForm.amount,
        reason: adjustmentForm.reason
      });
      setSelectedSettlement(res.settlement);
      setActionSuccess(`Adjustment of ₹${adjustmentForm.amount} applied.`);
      setAdjustmentModalOpen(false);
      loadSettlements();
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      alert(err.error || 'Failed to apply adjustment.');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Submit Commission Rules Update
  const handleUpdateRules = async (e) => {
    e.preventDefault();
    if (!rulesForm.reason.trim()) {
      alert('Audit reason is required.');
      return;
    }
    setIsUpdatingRules(true);
    try {
      await updateAdminCommissionRules({
        platform_commission_percentage: rulesForm.platform_commission_percentage,
        platform_commission_fixed_fee: rulesForm.platform_commission_fixed_fee,
        reason: rulesForm.reason
      });
      setActionSuccess('Platform commission rules updated successfully.');
      setRulesModalOpen(false);
      loadCommissionRules();
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      alert(err.error || 'Failed to update commission rules');
    } finally {
      setIsUpdatingRules(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            POSTGRESQL FINANCIAL VAULT • SETTLEMENTS & RECONCILIATION
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Restaurant Settlements & Reconciliation
          </h1>
          <div style={{ fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
            Audited payout batches, explicit subtotal commission calculations, UTR verification, and zero fabricated balances
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              loadRestaurants();
              setCreateModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 16px',
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
            <Plus size={16} />
            <span>Generate Settlement Batch</span>
          </button>

          <button
            onClick={() => downloadAdminReconciliationCSV()}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '9px 14px',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Download size={14} />
            <span>Reconciliation CSV</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', color: '#10B981', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', color: '#EF4444', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Overview Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* Pending Review */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Pending Review</span>
            <Clock size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
            ₹{summaryCards.pending_amount || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            {summaryCards.pending_count || 0} batches awaiting admin approval
          </div>
        </div>

        {/* In Processing */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>In Bank Processing</span>
            <Landmark size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3B82F6' }}>
            ₹{summaryCards.processing_amount || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            {summaryCards.processing_count || 0} approved; awaiting UTR proof
          </div>
        </div>

        {/* Verified Paid Payouts */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Completed Payouts</span>
            <ShieldCheck size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981' }}>
            ₹{summaryCards.paid_amount || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            {summaryCards.paid_count || 0} batches confirmed with bank UTR
          </div>
        </div>

        {/* Unsettled Accrued Orders */}
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--ws-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase' }}>Unsettled Accruals</span>
            <DollarSign size={16} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6' }}>
            ₹{summaryCards.unsettled_accrued_amount || '0.00'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
            {summaryCards.unsettled_accrued_orders || 0} delivered orders ready to batch
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ws-border)', gap: '16px' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'queue' ? '2px solid #10B981' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'queue' ? '#10B981' : 'var(--ws-text-secondary)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Settlements Operational Queue ({settlements.length})
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'reconciliation' ? '2px solid #10B981' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'reconciliation' ? '#10B981' : 'var(--ws-text-secondary)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Payment Gateway Reconciliation & Audit
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'rules' ? '2px solid #10B981' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'rules' ? '#10B981' : 'var(--ws-text-secondary)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Platform Commission Rules
        </button>
      </div>

      {/* TAB 1: SETTLEMENTS QUEUE */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filters Bar */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)' }}>STATUS:</span>
              {['ALL', 'PENDING', 'PROCESSING', 'PAID', 'FAILED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background: statusFilter === st ? '#10B981' : 'transparent',
                    color: statusFilter === st ? '#FFFFFF' : 'var(--ws-text-secondary)',
                    border: '1px solid',
                    borderColor: statusFilter === st ? '#10B981' : 'var(--ws-border)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search reference, restaurant, UTR..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--ws-bg)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  borderRadius: '8px',
                  padding: '6px 10px 6px 30px',
                  fontSize: '0.78rem',
                  width: '260px'
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--ws-shadow-sm)' }}>
            {settlements.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                <Landmark size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No settlements match current filters.</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click "Generate Settlement Batch" to create a payout batch for a restaurant.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ws-bg)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)', fontWeight: 800 }}>
                      <th style={{ padding: '12px 16px' }}>SETTLEMENT REF</th>
                      <th style={{ padding: '12px 16px' }}>RESTAURANT</th>
                      <th style={{ padding: '12px 16px' }}>PERIOD</th>
                      <th style={{ padding: '12px 16px' }}>ORDERS</th>
                      <th style={{ padding: '12px 16px' }}>GROSS SALES</th>
                      <th style={{ padding: '12px 16px' }}>COMMISSION</th>
                      <th style={{ padding: '12px 16px' }}>NET PAYABLE</th>
                      <th style={{ padding: '12px 16px' }}>STATUS</th>
                      <th style={{ padding: '12px 16px' }}>BANK UTR</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s, idx) => (
                      <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                          {s.settlement_reference}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                          {s.restaurant_name}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--ws-text-secondary)', fontSize: '0.78rem' }}>
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
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                          {s.provider_utr || s.provider_reference || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenDetail(s.settlement_reference)}
                            style={{
                              background: 'var(--ws-bg)',
                              border: '1px solid var(--ws-border)',
                              borderRadius: '8px',
                              padding: '5px 12px',
                              color: 'var(--ws-text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            Inspect & Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT GATEWAY RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Reconciliation Stats Card */}
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--ws-shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800 }}>LIVE 4-DIMENSIONAL AUDIT</span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
                  Gateway vs Orders vs Commissions vs Settlements
                </h2>
              </div>
              <button
                onClick={loadReconciliation}
                disabled={isReconLoading}
                style={{
                  background: 'var(--ws-bg)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: 'var(--ws-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <RefreshCw size={14} className={isReconLoading ? 'animate-spin' : ''} />
                <span>Re-Audit</span>
              </button>
            </div>

            {reconciliation && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--ws-bg)', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>CAPTURED GATEWAY PAYMENTS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                    ₹{reconciliation.summary.verified_captured_payments_total}
                  </div>
                </div>
                <div style={{ background: 'var(--ws-bg)', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>TOTAL ACCRUED COMMISSION</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                    ₹{reconciliation.summary.total_platform_commission_accrued}
                  </div>
                </div>
                <div style={{ background: 'var(--ws-bg)', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>COMPLETED SETTLED PAYOUTS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3B82F6' }}>
                    ₹{reconciliation.summary.total_settled_payout_paid}
                  </div>
                </div>
                <div style={{ background: 'var(--ws-bg)', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>DISCREPANCIES DETECTED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: reconciliation.summary.total_discrepancies_found > 0 ? '#EF4444' : '#10B981' }}>
                    {reconciliation.summary.total_discrepancies_found} ({reconciliation.summary.critical_discrepancies} critical)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Discrepancies Table */}
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ws-border)', fontWeight: 800, fontSize: '0.88rem' }}>
              Reconciliation Discrepancies & Recommended Actions
            </div>

            {(!reconciliation || reconciliation.discrepancies.length === 0) ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#10B981' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>100% Reconciled - Zero Discrepancies Found!</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                  All gateway charges, delivered orders, commission snapshots, and settlement payouts match perfectly.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ws-bg)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)', fontWeight: 800 }}>
                      <th style={{ padding: '12px 16px' }}>SEVERITY</th>
                      <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                      <th style={{ padding: '12px 16px' }}>AFFECTED REFERENCE</th>
                      <th style={{ padding: '12px 16px' }}>DIFFERENCE</th>
                      <th style={{ padding: '12px 16px' }}>DESCRIPTION</th>
                      <th style={{ padding: '12px 16px' }}>RECOMMENDED ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliation.discrepancies.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            backgroundColor: item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: item.severity === 'CRITICAL' || item.severity === 'HIGH' ? '#EF4444' : '#F59E0B'
                          }}>
                            {item.severity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{item.category}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{item.affected_reference}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#EF4444' }}>₹{item.difference_amount}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--ws-text-secondary)', maxWidth: '280px' }}>{item.description}</td>
                        <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: 700, maxWidth: '240px' }}>{item.recommended_action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSION RULES */}
      {activeTab === 'rules' && (
        <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '24px', maxWidth: '780px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800 }}>SETTINGS ARCHITECTURE</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
                Platform Commission Rules
              </h2>
            </div>
            <button
              onClick={() => setRulesModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Update Commission Rules
            </button>
          </div>

          {commissionRules && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--ws-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--ws-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>DEFAULT PLATFORM COMMISSION RATE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                  {commissionRules.platform_commission_percentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                  Fixed Fee per Order: ₹{commissionRules.platform_commission_fixed_fee}
                </div>
              </div>

              <div style={{ background: 'var(--ws-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--ws-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>CALCULATION BASE DEFINITION</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                  {commissionRules.calculation_base_description}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                Last updated at: {commissionRules.last_updated_at ? new Date(commissionRules.last_updated_at).toLocaleString() : 'System Baseline'} by {commissionRules.last_updated_by}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE SETTLEMENT BATCH */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '24px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: 'var(--ws-shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                Generate Settlement Batch
              </h2>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>RESTAURANT</label>
                <select
                  value={newBatchData.restaurant_id}
                  onChange={e => setNewBatchData({ ...newBatchData, restaurant_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                  required
                >
                  <option value="">Select a partner kitchen...</option>
                  {restaurantsList.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (#{r.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>PERIOD START</label>
                  <input
                    type="date"
                    value={newBatchData.period_start}
                    onChange={e => setNewBatchData({ ...newBatchData, period_start: e.target.value })}
                    style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>PERIOD END</label>
                  <input
                    type="date"
                    value={newBatchData.period_end}
                    onChange={e => setNewBatchData({ ...newBatchData, period_end: e.target.value })}
                    style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>OPERATIONAL NOTES</label>
                <textarea
                  rows={3}
                  value={newBatchData.notes}
                  onChange={e => setNewBatchData({ ...newBatchData, notes: e.target.value })}
                  placeholder="Optional batch notes or disbursement schedule..."
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--ws-text-primary)', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingBatch} style={{ background: '#10B981', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#FFFFFF', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                  {isSubmittingBatch ? 'Batching...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SETTLEMENT DETAIL INSPECTOR */}
      {selectedSettlement && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '24px', maxWidth: '860px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--ws-shadow-lg)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ws-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800 }}>SETTLEMENT BATCH AUDIT</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
                  {selectedSettlement.settlement_reference} ({selectedSettlement.restaurant_name})
                </h2>
              </div>
              <button onClick={() => setSelectedSettlement(null)} style={{ background: 'transparent', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Summary Strip */}
            <div style={{ padding: '16px 24px', background: 'var(--ws-bg)', borderBottom: '1px solid var(--ws-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>NET PAYOUT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>₹{selectedSettlement.net_payout_amount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>STATUS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{selectedSettlement.status}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>BANK UTR PROOF</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedSettlement.provider_utr || 'Pending Verification'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>APPROVED BY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedSettlement.approved_by_name || 'Awaiting Approval'}</div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
              
              {/* Action Buttons Strip */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {selectedSettlement.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setTargetStatus('PROCESSING');
                      setStatusForm({ provider_utr: '', provider_reference: '', reason: '' });
                      setStatusModalOpen(true);
                    }}
                    style={{ background: '#3B82F6', border: 'none', borderRadius: '8px', padding: '7px 14px', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Approve & Move to Processing
                  </button>
                )}

                {selectedSettlement.status === 'PROCESSING' && (
                  <button
                    onClick={() => {
                      setTargetStatus('PAID');
                      setStatusForm({ provider_utr: '', provider_reference: '', reason: '' });
                      setStatusModalOpen(true);
                    }}
                    style={{ background: '#10B981', border: 'none', borderRadius: '8px', padding: '7px 14px', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Mark as Paid & Input UTR
                  </button>
                )}

                {selectedSettlement.status !== 'PAID' && (
                  <button
                    onClick={() => {
                      setAdjustmentForm({ adjustment_type: 'MANUAL_CORRECTION', amount: '', reason: '' });
                      setAdjustmentModalOpen(true);
                    }}
                    style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '8px', padding: '7px 14px', color: 'var(--ws-text-primary)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    + Add Audited Adjustment
                  </button>
                )}
              </div>

              {/* Commission Entries List */}
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '10px' }}>
                Included Delivered Orders ({selectedSettlement.commission_entries?.length || 0})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedSettlement.commission_entries || []).map((entry, i) => (
                  <div key={i} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.82rem' }}>
                        #{entry.order_number} • Customer: {entry.customer_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                        Base: ₹{entry.calculation_base} | Packaging: +₹{entry.packaging_fee} | Comm ({entry.rate_percentage}%): -₹{entry.commission_amount}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#10B981', fontSize: '0.88rem' }}>
                        ₹{entry.net_restaurant_amount}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)' }}>Net Accrued</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjustments List */}
              {(selectedSettlement.adjustments || []).length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '8px' }}>
                    Audited Adjustments ({selectedSettlement.adjustments.length})
                  </div>
                  {selectedSettlement.adjustments.map((adj, i) => (
                    <div key={i} style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid #3B82F6', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.82rem' }}>
                        <span>{adj.adjustment_type} (by {adj.authorized_by_name})</span>
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
              <button onClick={() => setSelectedSettlement(null)} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '10px', padding: '8px 18px', color: 'var(--ws-text-primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STATUS TRANSITION (MARK PROCESSING / PAID) */}
      {statusModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 12px 0' }}>
              Transition Settlement to {targetStatus}
            </h3>

            <form onSubmit={handleStatusTransition} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {targetStatus === 'PAID' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10B981', display: 'block', marginBottom: '4px' }}>
                    BANK UTR / SETTLEMENT TRANSACTION REF (MANDATORY) *
                  </label>
                  <input
                    type="text"
                    value={statusForm.provider_utr}
                    onChange={e => setStatusForm({ ...statusForm, provider_utr: e.target.value })}
                    placeholder="e.g. UTR_HDFC_20261010_0099"
                    required
                    style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                    Cannot mark settlement as paid without a verified bank transfer UTR.
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  GATEWAY REFERENCE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={statusForm.provider_reference}
                  onChange={e => setStatusForm({ ...statusForm, provider_reference: e.target.value })}
                  placeholder="e.g. pout_882910"
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  AUDIT REASON
                </label>
                <textarea
                  rows={2}
                  value={statusForm.reason}
                  onChange={e => setStatusForm({ ...statusForm, reason: e.target.value })}
                  placeholder="Administrative action justification..."
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setStatusModalOpen(false)} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--ws-text-primary)', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingStatus} style={{ background: '#10B981', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#FFFFFF', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                  {isSubmittingStatus ? 'Updating...' : `Confirm ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD ADJUSTMENT */}
      {adjustmentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 12px 0' }}>
              Add Audited Settlement Adjustment
            </h3>

            <form onSubmit={handleAddAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>ADJUSTMENT TYPE</label>
                <select
                  value={adjustmentForm.adjustment_type}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })}
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                >
                  <option value="MANUAL_CORRECTION">Administrative Adjustment</option>
                  <option value="DISPUTE_DEDUCTION">Dispute Deduction / Damaged Food Charge</option>
                  <option value="PROMOTION_CREDIT">Marketing Subsidy / Platform Credit</option>
                  <option value="TAX_CORRECTION">Tax Withholding / Correction</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  AMOUNT (₹) (Use negative for deduction e.g. -50.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentForm.amount}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  placeholder="e.g. 50.00 or -50.00"
                  required
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  MANDATORY REASON *
                </label>
                <textarea
                  rows={3}
                  value={adjustmentForm.reason}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  placeholder="Detailed justification for audit log compliance..."
                  required
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setAdjustmentModalOpen(false)} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--ws-text-primary)', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingAdjustment} style={{ background: '#10B981', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#FFFFFF', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                  {isSubmittingAdjustment ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: UPDATE COMMISSION RULES */}
      {rulesModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '0 0 12px 0' }}>
              Update Platform Commission Rules
            </h3>

            <form onSubmit={handleUpdateRules} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  COMMISSION PERCENTAGE (%) (0 - 50%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={rulesForm.platform_commission_percentage}
                  onChange={e => setRulesForm({ ...rulesForm, platform_commission_percentage: e.target.value })}
                  required
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  FIXED FEE (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rulesForm.platform_commission_fixed_fee}
                  onChange={e => setRulesForm({ ...rulesForm, platform_commission_fixed_fee: e.target.value })}
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '4px' }}>
                  MANDATORY AUDIT REASON *
                </label>
                <textarea
                  rows={3}
                  value={rulesForm.reason}
                  onChange={e => setRulesForm({ ...rulesForm, reason: e.target.value })}
                  placeholder="Justification for commission rate adjustment..."
                  required
                  style={{ width: '100%', background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', color: 'var(--ws-text-primary)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setRulesModalOpen(false)} style={{ background: 'var(--ws-bg)', border: '1px solid var(--ws-border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--ws-text-primary)', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isUpdatingRules} style={{ background: '#10B981', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#FFFFFF', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                  {isUpdatingRules ? 'Saving...' : 'Save Commission Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
