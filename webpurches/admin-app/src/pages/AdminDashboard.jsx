import React, { useState, useEffect } from 'react';
import { 
  Users, Store, Bike, ShoppingBag, DollarSign, 
  TrendingUp, CheckCircle2, Clock, ChevronRight, Activity,
  RefreshCw, AlertCircle, ShieldAlert, Check, X, Eye
} from 'lucide-react';
import { LiveControlMap } from '../components/LiveControlMap.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { verifyRestaurant } from '../services/api.js';
import { FDAdminReferenceDashboard } from '../components/FDAdminReferenceDashboard.jsx';

export const AdminDashboard = ({ onNavigate }) => {
  const { 
    overviewData, 
    isLoadingOverview, 
    loadOverview,
    setInspectedOrder
  } = useAdmin();

  const [selectedDays, setSelectedDays] = useState(7);
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, restaurant: null, action: 'APPROVED', reason: '', error: '', loading: false });

  useEffect(() => {
    loadOverview(selectedDays);
  }, [selectedDays, loadOverview]);

  const kpis = overviewData?.kpis || {};
  const ordersOverTime = overviewData?.orders_over_time || [];
  const statusDist = overviewData?.order_status_distribution || [];
  const paymentDist = overviewData?.payment_status_distribution || [];
  const recentOrders = overviewData?.recent_orders || [];
  const pendingRestaurants = overviewData?.pending_restaurants || [];
  const fleetOverview = overviewData?.delivery_fleet_overview || [];

  const handleOpenApproval = (restaurant, action) => {
    setApprovalModal({
      isOpen: true,
      restaurant,
      action,
      reason: action === 'APPROVED' ? 'Verified FSSAI license and restaurant location details.' : 'Documentation incomplete or invalid.',
      error: '',
      loading: false
    });
  };

  const handleConfirmApproval = async () => {
    if (!approvalModal.reason.trim() || approvalModal.reason.trim().length < 3) {
      setApprovalModal(prev => ({ ...prev, error: 'A justification reason of at least 3 characters is required.' }));
      return;
    }
    setApprovalModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await verifyRestaurant(approvalModal.restaurant.id, approvalModal.action, approvalModal.reason);
      setApprovalModal({ isOpen: false, restaurant: null, action: 'APPROVED', reason: '', error: '', loading: false });
      await loadOverview(selectedDays);
    } catch (err) {
      setApprovalModal(prev => ({ ...prev, loading: false, error: err.message || 'Action failed.' }));
    }
  };

  const topStats = [
    { 
      label: 'Total Customers', 
      value: (kpis.total_customers || 0).toLocaleString(), 
      icon: Users, 
      color: '#FF5A1F', 
      subtext: 'Verified customer accounts' 
    },
    { 
      label: 'Partner Kitchens', 
      value: (kpis.total_restaurants || 0).toLocaleString(), 
      icon: Store, 
      color: '#10B981', 
      subtext: `${kpis.pending_restaurant_applications || 0} pending audit` 
    },
    { 
      label: 'Delivery Fleet', 
      value: (kpis.total_delivery_partners || 0).toLocaleString(), 
      icon: Bike, 
      color: '#0284C7', 
      subtext: `${kpis.online_delivery_partners || 0} couriers active` 
    },
    { 
      label: 'Total Orders', 
      value: (kpis.total_orders || 0).toLocaleString(), 
      icon: ShoppingBag, 
      color: '#8B5CF6', 
      subtext: `${kpis.active_orders || 0} currently active` 
    },
    { 
      label: 'Gross Revenue (GMV)', 
      value: `₹${Number(kpis.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: '#F59E0B', 
      subtext: `Today: ₹${Number(kpis.today_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Title & Range Filter Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div className="hidden md:block">
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ECOSYSTEM CENTRAL COMMAND • POSTGRESQL AGGREGATED
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Platform Mission Control
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
            Real PostgreSQL metrics, active fulfillment pipeline, and automated operational audits
          </div>
        </div>

        {/* Range Selector & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }} className="w-full md:w-auto">
          <div style={{
            display: 'flex',
            background: 'var(--ws-surface-subtle)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid var(--ws-border)'
          }}>
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                style={{
                  background: selectedDays === days ? 'var(--ws-primary, #22C55E)' : 'transparent',
                  color: selectedDays === days ? '#FFFFFF' : 'var(--ws-text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {days} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => loadOverview(selectedDays)}
            disabled={isLoadingOverview}
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
              fontSize: '0.8rem',
              fontWeight: 700
            }}
            title="Refresh Metrics"
          >
            <RefreshCw size={14} className={isLoadingOverview ? 'animate-spin' : ''} />
            <span>{isLoadingOverview ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* FD FOODS REFERENCE SPEC ADMIN DASHBOARD (EXACT SPEC MATCH) */}
      <FDAdminReferenceDashboard 
        kpis={kpis}
        onNavigate={onNavigate}
      />

      {/* Top 5 Real Aggregated KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {topStats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: 'var(--ws-shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {stat.label}
                </span>
                <div style={{
                  padding: '7px',
                  borderRadius: '10px',
                  background: `${stat.color}18`,
                  color: stat.color
                }}>
                  <Icon size={17} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '10px 0 3px 0' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                {stat.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Fulfillment Pipeline */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Order Lifecycle Pipeline Distribution
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
              Real-time aggregation of orders across lifecycle phases
            </div>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Manage All Orders</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {statusDist.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
            No orders registered in this database period.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px'
          }}>
            {statusDist.map(item => {
              const colors = {
                'NEW': '#3B82F6',
                'ACCEPTED': '#6366F1',
                'PREPARING': '#F59E0B',
                'READY_FOR_PICKUP': '#8B5CF6',
                'OUT_FOR_DELIVERY': '#EC4899',
                'DELIVERED': '#10B981',
                'CANCELLED': '#EF4444'
              };
              const color = colors[item.status] || '#64748B';

              return (
                <div
                  key={item.status}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                    {item.count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column Section: Restaurant Approval Queue & Live Courier Fleet */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '20px'
      }}>
        
        {/* Restaurant Approval Queue */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--ws-shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                Restaurant Approval Queue
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                New kitchen registrations awaiting compliance review
              </div>
            </div>
            <button
              onClick={() => onNavigate('restaurants')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ws-primary, #22C55E)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          {pendingRestaurants.length === 0 ? (
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
              <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                Approval Queue Clear
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                All restaurant onboarding applications have been processed.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingRestaurants.map(rest => (
                <div
                  key={rest.id}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>
                      {rest.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                      Owner: {rest.owner_email || rest.owner_name} • {rest.cuisine_type || 'General'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenApproval(rest, 'APPROVED')}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10B981',
                        color: '#10B981',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Approve Restaurant"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOpenApproval(rest, 'REJECTED')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid #EF4444',
                        color: '#EF4444',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Reject Application"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Fleet Availability Overview */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--ws-shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                Delivery Fleet Overview
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                Active rider shifts and online distribution
              </div>
            </div>
            <button
              onClick={() => onNavigate('fleet')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ws-primary, #22C55E)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Fleet Command
            </button>
          </div>

          {fleetOverview.length === 0 ? (
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
              <Bike size={32} color="var(--ws-text-muted)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                No Fleet Couriers Registered
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fleetOverview.map(partner => (
                <div
                  key={partner.id}
                  style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: partner.is_online ? '#10B981' : '#64748B'
                    }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--ws-text-primary)' }}>
                        {partner.user_full_name || partner.user_username}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--ws-text-muted)' }}>
                        {partner.vehicle_type || 'Vehicle'} • {partner.vehicle_number || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: partner.is_online ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: partner.is_online ? '#10B981' : '#64748B'
                    }}>
                      {partner.is_online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                      ★ {Number(partner.rating || 5.0).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Orders Table */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Recent Orders Feed
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
              Real-time audit stream of orders processed in database
            </div>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ws-primary, #22C55E)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View Full Orders Grid</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ws-text-muted)', fontSize: '0.88rem' }}>
            No recent orders recorded in the platform database.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '12px 14px' }}>Order Number</th>
                  <th style={{ padding: '12px 14px' }}>Customer</th>
                  <th style={{ padding: '12px 14px' }}>Restaurant</th>
                  <th style={{ padding: '12px 14px' }}>Amount</th>
                  <th style={{ padding: '12px 14px' }}>Order Status</th>
                  <th style={{ padding: '12px 14px' }}>Payment</th>
                  <th style={{ padding: '12px 14px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--ws-border)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--ws-text-secondary)' }}>
                      {order.customer_name || 'Customer'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--ws-text-secondary)' }}>
                      {order.restaurant_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#10B981' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: '#10B981'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: order.payment_status === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: order.payment_status === 'PAID' ? '#10B981' : '#F59E0B'
                      }}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => {
                          setInspectedOrder(order);
                          onNavigate('orders');
                        }}
                        style={{
                          background: 'var(--ws-surface-subtle)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: 'var(--ws-text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Map Surveillance Preview */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Live Telemetry Grid Surveillance
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
              GPS surveillance across active couriers and partner restaurant nodes
            </div>
          </div>
          <button
            onClick={() => onNavigate('maps')}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Full Live Map View</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ border: '1px solid var(--ws-border)', borderRadius: '16px', overflow: 'hidden' }}>
          <LiveControlMap height="400px" />
        </div>
      </div>

      {/* Restaurant Approval / Rejection Modal */}
      {approvalModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
              {approvalModal.action === 'APPROVED' ? 'Approve Restaurant Partner' : 'Reject Application'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ws-text-muted)' }}>
              Target: <strong>{approvalModal.restaurant?.name}</strong>
            </p>

            {approvalModal.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '12px'
              }}>
                {approvalModal.error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ws-text-primary)' }}>
              Mandatory Administrative Reason / Justification:
            </label>
            <textarea
              value={approvalModal.reason}
              onChange={e => setApprovalModal(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Provide clear justification for this action..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setApprovalModal({ isOpen: false, restaurant: null, action: 'APPROVED', reason: '', error: '', loading: false })}
                disabled={approvalModal.loading}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={approvalModal.loading}
                style={{
                  background: approvalModal.action === 'APPROVED' ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {approvalModal.loading ? 'Processing...' : `Confirm ${approvalModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
