import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  X, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Store,
  MapPin,
  Calendar,
  RefreshCw,
  Package
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const OrdersPage = ({ onGoToTrip }) => {
  const { 
    activeTrip, 
    triggerSimulatedRequest, 
    deliveryHistory, 
    isLoadingHistory, 
    fetchHistory 
  } = useDelivery();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week'
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchHistory(searchQuery, dateFilter);
  }, [searchQuery, dateFilter, fetchHistory]);

  const pastOrders = [
    {
      id: 'FD-10244',
      restaurant: 'Urban Bowl Gourmet',
      customer: 'Siddharth Rao',
      customer_address: 'Penthouse 802, Prestige Tower, Indiranagar',
      timestamp: 'Today, 01:15 PM',
      distance_km: 3.4,
      payout: 95.00,
      surge: 30.00,
      tip: 17.00,
      total: 142.00,
      status: 'DELIVERED',
      items: [{ name: 'Signature Truffle Bowl', quantity: 2, item_total: 420 }]
    },
    {
      id: 'FD-10243',
      restaurant: 'Artisan Woodfire Pizzeria',
      customer: 'Pooja Verma',
      customer_address: 'Flat 401, Palm Grove, HAL 2nd Stage',
      timestamp: 'Today, 12:20 PM',
      distance_km: 2.8,
      payout: 85.00,
      surge: 30.00,
      tip: 0.00,
      total: 115.00,
      status: 'DELIVERED',
      items: [{ name: 'Smoked Burrata Margherita', quantity: 1, item_total: 380 }]
    }
  ];

  const realOrdersFormatted = (deliveryHistory || []).map(d => ({
    id: d.order_number || `ORD-${d.order_id}`,
    task_id: d.id,
    restaurant: d.restaurant_name,
    restaurant_address: d.restaurant_address,
    customer: d.customer_name || 'Customer',
    customer_address: d.customer_address || '',
    timestamp: d.delivered_at ? new Date(d.delivered_at).toLocaleString() : 'Delivered',
    delivered_at: d.delivered_at,
    distance_km: 0,
    payout: parseFloat(d.delivery_fee || 0),
    surge: 0,
    tip: 0,
    total: parseFloat(d.delivery_fee || 0),
    status: d.task_status || 'DELIVERED',
    items_count: d.items_count || (d.items ? d.items.length : 0),
    items: d.items || (d.items_summary ? d.items_summary.map(s => ({ name: s, quantity: 1 })) : [])
  }));

  const allOrders = realOrdersFormatted.length > 0 ? realOrdersFormatted : pastOrders;

  const filteredOrders = allOrders.filter(order => {
    const q = searchQuery.toLowerCase();
    return order.id.toLowerCase().includes(q) ||
           order.restaurant.toLowerCase().includes(q) ||
           order.customer.toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '880px', width: '100%', boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: "'Space Grotesk', sans-serif" }}>
            FD OPERATIONS LOG
          </span>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#191B1F',
            margin: '2px 0 0'
          }}>
            Orders & Trip History
          </h1>
        </div>

        <button
          onClick={triggerSimulatedRequest}
          type="button"
          className="btn-secondary-fresh"
          style={{ padding: '8px 16px', fontSize: '0.8rem', minHeight: '38px' }}
        >
          <Sparkles size={15} color="#10B981" />
          <span>Simulate Incoming</span>
        </button>
      </div>

      {/* Active Trip Quick Card */}
      {activeTrip && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #A7F3D0',
          borderRadius: '20px',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '999px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                ACTIVE IN PROGRESS
              </span>
              <span style={{ fontSize: '0.82rem', color: '#7A808C', fontFamily: "'Space Grotesk', monospace", fontWeight: 700 }}>
                Order #{activeTrip.order_number}
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191B1F', marginTop: '4px' }}>
              {activeTrip.restaurant_name} → {activeTrip.customer_name}
            </div>
          </div>

          <button
            onClick={onGoToTrip}
            type="button"
            className="btn-primary-fresh"
            style={{ padding: '9px 18px', fontSize: '0.84rem', minHeight: '38px', backgroundColor: '#DC2626' }}
          >
            <span>Open Delivery Flow</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Date Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {[
            { id: 'all', label: 'All Deliveries' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' }
          ].map(tab => {
            const isActive = dateFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                type="button"
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: isActive ? '1.5px solid #DC2626' : '1px solid #EDE8DE',
                  backgroundColor: isActive ? '#FEF2F2' : '#FFFFFF',
                  color: isActive ? '#DC2626' : '#525760',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '16px',
          padding: '10px 16px'
        }}>
          <Search size={18} color="#7A808C" />
          <input
            type="text"
            placeholder="Search by order #, restaurant or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.86rem',
              color: '#191B1F',
              backgroundColor: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#7A808C', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoadingHistory && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          color: '#7A808C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '0.88rem'
        }}>
          <RefreshCw size={18} className="animate-spin" />
          <span>Loading delivery records...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingHistory && filteredOrders.length === 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '20px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <Package size={44} color="#A0A5B1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#191B1F' }}>
            No Delivery Records Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A808C', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
            Completed deliveries with successful customer OTP verifications will automatically populate in this verified ledger.
          </p>
        </div>
      )}

      {/* Orders List */}
      {!isLoadingHistory && filteredOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredOrders.map(order => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EDE8DE',
                borderRadius: '18px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(25, 27, 31, 0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: "'Space Grotesk', monospace", fontWeight: 800, fontSize: '0.88rem', color: '#191B1F', overflowWrap: 'anywhere' }}>
                    #{order.id}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#7A808C' }}>
                    {order.timestamp}
                  </span>
                  <span style={{
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {order.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#191B1F', marginTop: '4px' }}>
                  {order.restaurant}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#525760', marginTop: '2px' }}>
                  📍 Customer: {order.customer} · {order.customer_address ? order.customer_address.slice(0, 45) + '...' : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', monospace",
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#059669'
                  }}>
                    ₹{order.total.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 600 }}>
                    Delivery Fee
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReceipt(order)}
                  type="button"
                  className="btn-secondary-fresh"
                  style={{ padding: '7px 15px', fontSize: '0.78rem', minHeight: '34px' }}
                >
                  <Eye size={14} />
                  <span>Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Snapshot Receipt / Details Modal */}
      {selectedReceipt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 220,
          backgroundColor: 'rgba(25, 27, 31, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #EDE8DE',
            borderRadius: '24px',
            padding: '26px',
            boxShadow: '0 16px 40px rgba(25, 27, 31, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedReceipt(null)}
              type="button"
              aria-label="Close receipt"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: '#7A808C',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#ECFDF5', padding: '3px 8px', borderRadius: '6px', marginBottom: '4px' }}>
                <CheckCircle2 size={13} color="#059669" />
                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif" }}>
                  VERIFIED DELIVERED TASK
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#191B1F', margin: '2px 0 0' }}>
                Order #{selectedReceipt.id}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#7A808C' }}>
                Delivered at: {selectedReceipt.timestamp}
              </div>
            </div>

            {/* Restaurant Details */}
            <div style={{
              backgroundColor: '#FBF9F5',
              border: '1px solid #EDE8DE',
              borderRadius: '14px',
              padding: '12px 14px'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 800, textTransform: 'uppercase' }}>
                Pickup Merchant
              </span>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B1F', marginTop: '2px' }}>
                {selectedReceipt.restaurant}
              </div>
              {selectedReceipt.restaurant_address && (
                <div style={{ fontSize: '0.78rem', color: '#525760' }}>
                  📍 {selectedReceipt.restaurant_address}
                </div>
              )}
            </div>

            {/* Customer Details Snapshot */}
            <div style={{
              backgroundColor: '#FBF9F5',
              border: '1px solid #EDE8DE',
              borderRadius: '14px',
              padding: '12px 14px'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
                Delivery Destination
              </span>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B1F', marginTop: '2px' }}>
                {selectedReceipt.customer}
              </div>
              {selectedReceipt.customer_address && (
                <div style={{ fontSize: '0.78rem', color: '#525760' }}>
                  📍 {selectedReceipt.customer_address}
                </div>
              )}
            </div>

            {/* Items Snapshot */}
            {selectedReceipt.items && selectedReceipt.items.length > 0 && (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EDE8DE',
                borderRadius: '14px',
                padding: '12px 14px'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase' }}>
                  Ordered Items ({selectedReceipt.items.length})
                </span>
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedReceipt.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '2px 0' }}>
                      <span>{it.quantity || 1}x {it.name}</span>
                      {it.item_total && <span style={{ fontWeight: 700 }}>₹{parseFloat(it.item_total).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div style={{
              backgroundColor: '#F8F6F2',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#525760' }}>Delivery Fee Compensation:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>₹{selectedReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              type="button"
              className="btn-secondary-fresh"
              style={{ width: '100%', padding: '10px' }}
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

