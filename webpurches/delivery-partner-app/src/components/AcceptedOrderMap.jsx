import React, { useEffect, useState } from 'react';
import { OperationalMapCanvas } from './map/OperationalMapCanvas.jsx';
import { fetchOrderTracking } from '../services/api.js';

/**
 * Integrated route map for an accepted order. Rendered directly below the
 * accepted-order details (never a standalone page). Coordinates come from
 * GET /api/orders/<id>/tracking/ — no invented locations.
 */
export const AcceptedOrderMap = ({ orderId, orderNumber }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchOrderTracking(orderId)
      .then(data => {
        if (!cancelled) {
          setTracking(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load route');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div style={{
      backgroundColor: '#FBF9F5',
      border: '1px solid #EDE8DE',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ fontSize: '0.72rem', color: '#176B45', fontWeight: 900, textTransform: 'uppercase' }}>
        DELIVERY ROUTE {orderNumber ? `· Order #${orderNumber}` : ''}
      </div>
      {loading && (
        <div style={{ fontSize: '0.84rem', color: '#7A808C' }}>Loading route map…</div>
      )}
      {!loading && error && (
        <div>
          <div style={{ fontSize: '0.84rem', color: '#B91C1C', fontWeight: 700 }}>{error}</div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchOrderTracking(orderId)
                .then(data => { setTracking(data); setLoading(false); })
                .catch(err => { setError(err?.message || 'Failed to load route'); setLoading(false); });
            }}
            style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #EDE8DE', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Retry Map
          </button>
        </div>
      )}
      {!loading && !error && tracking && tracking.is_trackable === false && (
        <div style={{ fontSize: '0.84rem', color: '#7A808C' }}>
          {tracking.message || 'Live route is not available for this order.'}
        </div>
      )}
      {!loading && !error && tracking && tracking.is_trackable !== false && (
        <>
          <div style={{ fontSize: '0.8rem', color: '#525760', overflowWrap: 'anywhere' }}>
            📍 Pickup: {tracking.restaurant?.name} — {tracking.restaurant?.address}
            <br />
            📍 Drop: {tracking.customer?.delivery_address || ''}
          </div>
          <OperationalMapCanvas
            height="260px"
            targetStage="customer"
            restaurantCoords={{
              latitude: tracking.restaurant?.latitude,
              longitude: tracking.restaurant?.longitude,
              name: tracking.restaurant?.name,
              address: tracking.restaurant?.address
            }}
            customerCoords={{
              latitude: tracking.customer?.latitude,
              longitude: tracking.customer?.longitude,
              name: 'Customer',
              address: tracking.customer?.delivery_address
            }}
            partnerCoords={tracking.delivery_partner ? {
              latitude: tracking.delivery_partner?.latitude,
              longitude: tracking.delivery_partner?.longitude,
              heading: tracking.delivery_partner?.heading
            } : null}
          />
          {tracking.delivery_partner?.is_stale && (
            <div style={{ fontSize: '0.76rem', color: '#B45309' }}>
              Rider position may be stale — last update {tracking.delivery_partner?.staleness_seconds || '?'}s ago.
            </div>
          )}
        </>
      )}
    </div>
  );
};
