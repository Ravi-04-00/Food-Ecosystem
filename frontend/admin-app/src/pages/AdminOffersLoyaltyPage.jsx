import React, { useState, useEffect } from 'react';
import {
  Tag, Award, Plus, Search, RefreshCw, Trash2, Edit3, CheckCircle2,
  AlertCircle, DollarSign, Users, Calendar, ArrowUpRight, ArrowDownLeft,
  Percent, ShieldCheck, ToggleLeft, ToggleRight, X, Sparkles, Filter
} from 'lucide-react';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  fetchAdminLoyaltyConfig,
  updateAdminLoyaltyConfig,
  fetchAdminPromotionStats,
  fetchAdminLoyaltyLedger
} from '../services/api.js';

export const AdminOffersLoyaltyPage = () => {
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'loyalty' | 'ledger'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponSearch, setCouponSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'PERCENTAGE',
    discount_amount: '20.00',
    max_discount_cap: '100.00',
    min_order_value: '299.00',
    start_date: '',
    expiry_date: '',
    max_uses: 500,
    max_uses_per_user: 1,
    first_order_only: false,
    is_combinable: false,
    is_active: true
  });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponFormError, setCouponFormError] = useState(null);

  // Loyalty Config State
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(null);

  // Ledger State
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [ledgerFilterType, setLedgerFilterType] = useState('');
  const [ledgerCustomerSearch, setLedgerCustomerSearch] = useState('');

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Overview Stats
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await fetchAdminPromotionStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load promotion stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Coupons
  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const data = await fetchAdminCoupons({
        search: couponSearch,
        is_active: statusFilter
      });
      setCoupons(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Load Loyalty Config
  const loadLoyaltyConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await fetchAdminLoyaltyConfig();
      setLoyaltyConfig(data);
    } catch (err) {
      console.error('Failed to load loyalty config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Load Ledger
  const loadLedger = async () => {
    try {
      setLoadingLedger(true);
      const data = await fetchAdminLoyaltyLedger({
        transaction_type: ledgerFilterType,
        customer_id: ledgerCustomerSearch
      });
      setLedgerEntries(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to load loyalty ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadCoupons();
    loadLoyaltyConfig();
    loadLedger();
  }, []);

  const handleOpenCreateCoupon = () => {
    setEditingCoupon(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    setCouponForm({
      code: '',
      title: '',
      description: '',
      discount_type: 'PERCENTAGE',
      discount_amount: '20.00',
      max_discount_cap: '100.00',
      min_order_value: '299.00',
      start_date: new Date().toISOString().slice(0, 16),
      expiry_date: tomorrow.toISOString().slice(0, 16),
      max_uses: 500,
      max_uses_per_user: 1,
      first_order_only: false,
      is_combinable: false,
      is_active: true
    });
    setCouponFormError(null);
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (cpn) => {
    setEditingCoupon(cpn);
    setCouponForm({
      code: cpn.code,
      title: cpn.title || '',
      description: cpn.description || '',
      discount_type: cpn.discount_type || 'PERCENTAGE',
      discount_amount: String(cpn.discount_amount || '0'),
      max_discount_cap: cpn.max_discount_cap ? String(cpn.max_discount_cap) : '',
      min_order_value: String(cpn.min_order_value || '0'),
      start_date: cpn.start_date ? cpn.start_date.slice(0, 16) : '',
      expiry_date: cpn.expiry_date ? cpn.expiry_date.slice(0, 16) : '',
      max_uses: cpn.max_uses || 500,
      max_uses_per_user: cpn.max_uses_per_user || 1,
      first_order_only: Boolean(cpn.first_order_only),
      is_combinable: Boolean(cpn.is_combinable),
      is_active: Boolean(cpn.is_active)
    });
    setCouponFormError(null);
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setCouponFormError(null);
    setSavingCoupon(true);

    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        title: couponForm.title.trim(),
        description: couponForm.description.trim(),
        discount_type: couponForm.discount_type,
        discount_amount: parseFloat(couponForm.discount_amount),
        max_discount_cap: couponForm.max_discount_cap ? parseFloat(couponForm.max_discount_cap) : null,
        min_order_value: parseFloat(couponForm.min_order_value || 0),
        start_date: couponForm.start_date ? new Date(couponForm.start_date).toISOString() : new Date().toISOString(),
        expiry_date: couponForm.expiry_date ? new Date(couponForm.expiry_date).toISOString() : null,
        max_uses: parseInt(couponForm.max_uses, 10),
        max_uses_per_user: parseInt(couponForm.max_uses_per_user, 10),
        first_order_only: couponForm.first_order_only,
        is_combinable: couponForm.is_combinable,
        is_active: couponForm.is_active
      };

      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon.id, payload);
        showToast(`Coupon ${payload.code} successfully updated!`);
      } else {
        await createAdminCoupon(payload);
        showToast(`Coupon ${payload.code} successfully created!`);
      }

      setIsCouponModalOpen(false);
      loadCoupons();
      loadStats();
    } catch (err) {
      setCouponFormError(err.message || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (cpn) => {
    try {
      await updateAdminCoupon(cpn.id, { is_active: !cpn.is_active });
      showToast(`Coupon ${cpn.code} is now ${!cpn.is_active ? 'Active' : 'Disabled'}`);
      loadCoupons();
      loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteCoupon = async (cpn) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${cpn.code}"?`)) return;
    try {
      await deleteAdminCoupon(cpn.id);
      showToast(`Coupon ${cpn.code} deleted.`);
      loadCoupons();
      loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to delete coupon');
    }
  };

  const handleSaveLoyaltyConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccess(null);
    try {
      await updateAdminLoyaltyConfig(loyaltyConfig);
      setConfigSuccess('Loyalty Program parameters updated and verified.');
      showToast('Loyalty Program settings updated!');
      loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to update configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.3))',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22C55E'
            }}>
              <Tag size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                Smart Offers, Coupons & Loyalty Engine
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
                Authoritative server-side discount governance, concurrency-safe redemption limits & auditable points ledger
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              loadStats();
              loadCoupons();
              loadLoyaltyConfig();
              loadLedger();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              color: 'var(--ws-text-secondary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            <RefreshCw size={15} />
            <span>Sync Engine</span>
          </button>

          <button
            onClick={handleOpenCreateCoupon}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid #22C55E',
          borderRadius: '12px',
          color: '#16A34A',
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>ACTIVE CAMPAIGNS</span>
            <Tag size={16} color="#22C55E" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
            {stats ? `${stats.active_coupons} / ${stats.total_coupons}` : '...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
            Active discount promos in market
          </div>
        </div>

        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>TOTAL REDEMPTIONS</span>
            <Users size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
            {stats ? stats.total_redemptions_committed : '...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
            Verified customer transactions
          </div>
        </div>

        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>DISCOUNTS GRANTED</span>
            <DollarSign size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>
            ₹{stats ? Number(stats.total_discount_disbursed_inr).toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
            Authoritative platform savings
          </div>
        </div>

        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
            <span>LOYALTY LIABILITY</span>
            <Award size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D97706' }}>
            ₹{stats ? Number(stats.total_loyalty_liability_inr).toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
            {stats ? stats.total_loyalty_points_outstanding : 0} points circulating
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--ws-border)',
        gap: '24px'
      }}>
        {[
          { id: 'coupons', label: 'Coupon Campaigns', count: coupons.length },
          { id: 'loyalty', label: 'Loyalty Program Governance', badge: 'CONFIG' },
          { id: 'ledger', label: 'Auditable Points Ledger', count: ledgerEntries.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid #22C55E' : '3px solid transparent',
              color: activeTab === tab.id ? '#16A34A' : 'var(--ws-text-secondary)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{
                background: activeTab === tab.id ? 'rgba(34, 197, 94, 0.18)' : 'var(--ws-surface-subtle)',
                color: activeTab === tab.id ? '#16A34A' : 'var(--ws-text-muted)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span style={{
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#D97706',
                padding: '1px 6px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 800
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: COUPONS MANAGEMENT */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--ws-surface)',
            padding: '14px 18px',
            borderRadius: '16px',
            border: '1px solid var(--ws-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '8px 12px',
                flex: 1
              }}>
                <Search size={16} color="var(--ws-text-muted)" />
                <input
                  type="text"
                  placeholder="Search by code, title or description..."
                  value={couponSearch}
                  onChange={e => setCouponSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadCoupons()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--ws-text-primary)',
                    fontSize: '0.85rem',
                    width: '100%'
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setTimeout(loadCoupons, 50);
                }}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Disabled Only</option>
              </select>
            </div>

            <button
              onClick={loadCoupons}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--ws-text-primary)',
                cursor: 'pointer'
              }}
            >
              Filter
            </button>
          </div>

          {/* Table Container */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            {loadingCoupons ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                Loading coupons database...
              </div>
            ) : coupons.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                No coupons match the current criteria. Click "Create New Coupon" to start a campaign.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ws-surface-subtle)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 18px' }}>Coupon Code</th>
                      <th style={{ padding: '14px 18px' }}>Discount</th>
                      <th style={{ padding: '14px 18px' }}>Min Order</th>
                      <th style={{ padding: '14px 18px' }}>Usage / Cap</th>
                      <th style={{ padding: '14px 18px' }}>Validity</th>
                      <th style={{ padding: '14px 18px' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((cpn) => {
                      const isExpired = cpn.expiry_date && new Date(cpn.expiry_date) < new Date();
                      const isExhausted = cpn.max_uses && cpn.current_uses >= cpn.max_uses;

                      return (
                        <tr key={cpn.id} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                color: '#16A34A',
                                background: 'rgba(34, 197, 94, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px dashed rgba(34, 197, 94, 0.3)',
                                fontSize: '0.9rem'
                              }}>
                                {cpn.code}
                              </span>
                              {cpn.first_order_only && (
                                <span style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#EF4444',
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 800
                                }}>
                                  1ST ORDER
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-primary)', marginTop: '4px', fontWeight: 600 }}>
                              {cpn.title || 'Promotional Offer'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                              {cpn.discount_type === 'PERCENTAGE' ? `${cpn.discount_amount}% OFF` : `₹${cpn.discount_amount} FLAT`}
                            </div>
                            {cpn.discount_type === 'PERCENTAGE' && cpn.max_discount_cap && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                                Cap: ₹{cpn.max_discount_cap}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                            ₹{cpn.min_order_value || '0'}
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: isExhausted ? '#EF4444' : 'var(--ws-text-primary)' }}>
                              {cpn.current_uses} / {cpn.max_uses || '∞'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                              {cpn.max_uses_per_user} per customer
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: '0.78rem', color: isExpired ? '#EF4444' : 'var(--ws-text-primary)', fontWeight: 600 }}>
                              {cpn.expiry_date ? new Date(cpn.expiry_date).toLocaleDateString() : 'No Expiry'}
                            </div>
                            {isExpired && (
                              <span style={{ color: '#EF4444', fontSize: '0.7rem', fontWeight: 800 }}>EXPIRED</span>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <button
                              onClick={() => handleToggleCouponActive(cpn)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: cpn.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: cpn.is_active ? '#16A34A' : '#EF4444'
                              }}>
                                {cpn.is_active ? '● Active' : '○ Disabled'}
                              </span>
                            </button>
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleOpenEditCoupon(cpn)}
                                title="Edit Coupon"
                                style={{
                                  background: 'var(--ws-surface-subtle)',
                                  border: '1px solid var(--ws-border)',
                                  borderRadius: '8px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  color: 'var(--ws-text-secondary)'
                                }}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(cpn)}
                                title="Delete Coupon"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  borderRadius: '8px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  color: '#EF4444'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOYALTY PROGRAM GOVERNANCE */}
      {activeTab === 'loyalty' && (
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: 'var(--ws-shadow-sm)',
          maxWidth: '800px'
        }}>
          {loadingConfig ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
              Loading loyalty program parameters...
            </div>
          ) : loyaltyConfig ? (
            <form onSubmit={handleSaveLoyaltyConfig} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Global Loyalty Program Parameters
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                    Controls point accumulation, redemption exchange rates and anti-fraud caps across all orders
                  </p>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={loyaltyConfig.is_enabled}
                    onChange={e => setLoyaltyConfig({ ...loyaltyConfig, is_enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#22C55E' }}
                  />
                  <span>Program Active</span>
                </label>
              </div>

              {configSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#16A34A', fontSize: '0.82rem', fontWeight: 700 }}>
                  {configSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Earning Spend Ratio (₹ Spend per 1 Point)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={loyaltyConfig.spend_amount_per_point}
                    onChange={e => setLoyaltyConfig({ ...loyaltyConfig, spend_amount_per_point: parseInt(e.target.value, 10) || 10 })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    Default: 10 (Customer spends ₹10 to earn 1 point)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Redemption Rate (₹ Value per 1 Point)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={loyaltyConfig.points_to_inr_rate}
                    onChange={e => setLoyaltyConfig({ ...loyaltyConfig, points_to_inr_rate: parseFloat(e.target.value) || 0.5 })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    Default: 0.50 (1 Point = ₹0.50 discount on checkout)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Minimum Points Threshold to Redeem
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={loyaltyConfig.min_points_to_redeem}
                    onChange={e => setLoyaltyConfig({ ...loyaltyConfig, min_points_to_redeem: parseInt(e.target.value, 10) || 50 })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    Customers cannot redeem until their balance reaches this minimum
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Maximum Order Subtotal Covered (%)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="100"
                    value={loyaltyConfig.max_points_discount_percent_subtotal}
                    onChange={e => setLoyaltyConfig({ ...loyaltyConfig, max_points_discount_percent_subtotal: parseInt(e.target.value, 10) || 50 })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    Anti-abuse cap (e.g. 50% max discount from loyalty points)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={savingConfig}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: savingConfig ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingConfig ? 'Saving Configuration...' : 'Save Loyalty Parameters'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* TAB 3: AUDITABLE POINTS LEDGER */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ledger Filter */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--ws-surface)',
            padding: '14px 18px',
            borderRadius: '16px',
            border: '1px solid var(--ws-border)'
          }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <select
                value={ledgerFilterType}
                onChange={e => {
                  setLedgerFilterType(e.target.value);
                  setTimeout(loadLedger, 50);
                }}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="">All Transaction Types</option>
                <option value="EARN">EARN (+ points from delivered orders)</option>
                <option value="REDEEM">REDEEM (- points spent on checkout)</option>
                <option value="CANCEL_REVERSAL">CANCEL_REVERSAL (restored points)</option>
                <option value="ADMIN_ADJUST">ADMIN_ADJUST (manual reconciliation)</option>
              </select>
            </div>

            <button
              onClick={loadLedger}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--ws-text-primary)',
                cursor: 'pointer'
              }}
            >
              Refresh Ledger
            </button>
          </div>

          {/* Ledger Table */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            {loadingLedger ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                Loading auditable loyalty ledger...
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                No loyalty ledger entries recorded yet. Points are awarded upon completed delivery.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ws-surface-subtle)', borderBottom: '1px solid var(--ws-border)', color: 'var(--ws-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 18px' }}>Timestamp</th>
                      <th style={{ padding: '14px 18px' }}>Customer ID</th>
                      <th style={{ padding: '14px 18px' }}>Type</th>
                      <th style={{ padding: '14px 18px' }}>Points Change</th>
                      <th style={{ padding: '14px 18px' }}>Balance After</th>
                      <th style={{ padding: '14px 18px' }}>Order Reference</th>
                      <th style={{ padding: '14px 18px' }}>Audit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.map((entry) => {
                      const isPositive = entry.points_change > 0;
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid var(--ws-border)' }}>
                          <td style={{ padding: '14px 18px', color: 'var(--ws-text-secondary)', fontSize: '0.78rem' }}>
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                            Customer #{entry.customer}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: entry.transaction_type === 'EARN' ? 'rgba(34, 197, 94, 0.15)' : (entry.transaction_type === 'REDEEM' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                              color: entry.transaction_type === 'EARN' ? '#16A34A' : (entry.transaction_type === 'REDEEM' ? '#EF4444' : '#2563EB')
                            }}>
                              {entry.transaction_type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 900, color: isPositive ? '#16A34A' : '#EF4444' }}>
                            {isPositive ? `+${entry.points_change}` : entry.points_change} pts
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                            {entry.balance_after} pts
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--ws-text-secondary)', fontSize: '0.8rem' }}>
                            {entry.order ? `Order #${entry.order}` : '—'}
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--ws-text-muted)', fontSize: '0.78rem' }}>
                            {entry.reason || 'Automated ledger event'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {isCouponModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
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
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  {editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : 'Create Promotional Coupon'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                  Authoritative validation rules stored in PostgreSQL
                </p>
              </div>

              <button
                onClick={() => setIsCouponModalOpen(false)}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ws-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {couponFormError && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{couponFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE30"
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      outline: 'none',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 30% Off on Weekend Feast"
                    value={couponForm.title}
                    onChange={e => setCouponForm({ ...couponForm, title: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                  Customer-Facing Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Applies to all eligible orders above ₹299..."
                  value={couponForm.description}
                  onChange={e => setCouponForm({ ...couponForm, description: e.target.value })}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--ws-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.discount_type}
                    onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT AMOUNT (₹)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={couponForm.discount_amount}
                    onChange={e => setCouponForm({ ...couponForm, discount_amount: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Max Cap (₹, for %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    value={couponForm.max_discount_cap}
                    onChange={e => setCouponForm({ ...couponForm, max_discount_cap: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Min Order Value (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={couponForm.min_order_value}
                    onChange={e => setCouponForm({ ...couponForm, min_order_value: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Total Redemptions Cap
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={couponForm.max_uses}
                    onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Max Uses Per Customer
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={couponForm.max_uses_per_user}
                    onChange={e => setCouponForm({ ...couponForm, max_uses_per_user: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
                    Campaign Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={couponForm.expiry_date}
                    onChange={e => setCouponForm({ ...couponForm, expiry_date: e.target.value })}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--ws-text-primary)',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={couponForm.first_order_only}
                      onChange={e => setCouponForm({ ...couponForm, first_order_only: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#22C55E' }}
                    />
                    <span>First Order Only (New Customers)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={couponForm.is_active}
                      onChange={e => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#22C55E' }}
                    />
                    <span>Coupon is Active</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    color: 'var(--ws-text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCoupon}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    cursor: savingCoupon ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingCoupon ? 'Saving Coupon...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
