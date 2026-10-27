import React, { useEffect, useState, useRef, useCallback } from 'react';
import { OperationalMapCanvas } from './map/OperationalMapCanvas.jsx';
import { fetchOrderTracking } from '../services/api.js';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { Navigation, MapPin, AlertCircle, Radio, CheckCircle2 } from 'lucide-react';

/**
 * Integrated route map for an accepted order. Rendered directly below the
 * accepted-order details (never a standalone page). Coordinates come from
 * GET /api/orders/<id>/tracking/ and real device navigator.geolocation (throttled to 10s).
 * No invented or fabricated locations.
 */
export const AcceptedOrderMap = ({ orderId, orderNumber }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live GPS tracking state
  const deliveryCtx = useDelivery?.() || {};
  const handlePublishLocation = deliveryCtx.handlePublishLocation;

  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);
  const [gpsPermissionState, setGpsPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [gpsError, setGpsError] = useState(null);
  const [liveCoords, setLiveCoords] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const watchIdRef = useRef(null);
  const lastSyncTimestampRef = useRef(0);

  // Initial order tracking fetch
  const loadTracking = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    fetchOrderTracking(orderId)
      .then(data => {
        setTracking(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err?.message || 'Failed to load route');
        setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  // Check geolocation API availability
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsPermissionState('unsupported');
    } else if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setGpsPermissionState(result.state);
          result.onchange = () => setGpsPermissionState(result.state);
        })
        .catch(() => {
          // Permissions query unsupported for geolocation on some browsers
        });
    }
  }, []);

  // Live GPS watchPosition lifecycle
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveGpsActive(false);
  }, []);

  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsPermissionState('unsupported');
      return;
    }

    setGpsError(null);
    setIsLiveGpsActive(true);

    const successHandler = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const heading = position.coords.heading || 0;
      const speedKmh = Math.round((position.coords.speed || 0) * 3.6);

      setGpsPermissionState('granted');
      setLiveCoords({
        latitude: lat,
        longitude: lng,
        heading,
        speed: speedKmh
      });

      // Throttle backend publishing to at most once every 10 seconds
      const now = Date.now();
      if (now - lastSyncTimestampRef.current >= 10000) {
        lastSyncTimestampRef.current = now;
        if (handlePublishLocation && orderId) {
          handlePublishLocation({
            order_id: orderId,
            latitude: lat,
            longitude: lng,
            heading,
            speed: speedKmh
          })
            .then(() => {
              setLastSyncTime(new Date().toLocaleTimeString());
            })
            .catch(pubErr => {
              console.warn('GPS publish error:', pubErr.message);
            });
        }
      }
    };

    const errorHandler = (err) => {
      console.warn('Geolocation error:', err.message);
      if (err.code === 1) { // PERMISSION_DENIED
        setGpsPermissionState('denied');
        setGpsError('Location access was denied. Please allow location permissions to share live delivery status.');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setGpsError('Location unavailable. Waiting for GPS lock…');
      } else if (err.code === 3) { // TIMEOUT
        setGpsError('Location acquisition timed out. Retrying…');
      } else {
        setGpsError(err.message || 'Error acquiring device location.');
      }
      setIsLiveGpsActive(false);
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        successHandler,
        errorHandler,
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );
    } catch (e) {
      setGpsError(e.message);
      setIsLiveGpsActive(false);
    }
  }, [handlePublishLocation, orderId]);

  // Clean up watcher on unmount or order change
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [orderId]);

  if (!orderId) return null;

  // Determine active partner coordinates (prefer live device GPS if tracking, else backend tracking data)
  const resolvedPartnerCoords = liveCoords || (tracking?.delivery_partner ? {
    latitude: tracking.delivery_partner?.latitude,
    longitude: tracking.delivery_partner?.longitude,
    heading: tracking.delivery_partner?.heading
  } : null);

  return (
    <div style={{
      backgroundColor: '#FBF9F5',
      border: '1px solid #EDE8DE',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '0.72rem', color: '#176B45', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Navigation size={14} />
          <span>DELIVERY ROUTE {orderNumber ? `· Order #${orderNumber}` : ''}</span>
        </div>

        {/* Live GPS Telemetry Broadcast Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLiveGpsActive ? (
            <button
              type="button"
              onClick={stopLiveTracking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Radio size={12} className="animate-pulse" />
              <span>Broadcasting Live GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startLiveTracking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#176B45',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <MapPin size={12} />
              <span>Share Live Location</span>
            </button>
          )}
        </div>
      </div>

      {gpsError && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '10px',
          padding: '8px 12px',
          fontSize: '0.78rem',
          color: '#991B1B',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{gpsError}</span>
        </div>
      )}

      {isLiveGpsActive && lastSyncTime && (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '0.74rem',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={13} color="#16A34A" />
          <span>Broadcasting accurate GPS position (synced at {lastSyncTime}, 10s intervals)</span>
        </div>
      )}

      {loading && (
        <div style={{ fontSize: '0.84rem', color: '#7A808C' }}>Loading route map…</div>
      )}

      {!loading && error && (
        <div>
          <div style={{ fontSize: '0.84rem', color: '#B91C1C', fontWeight: 700 }}>{error}</div>
          <button
            type="button"
            onClick={loadTracking}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #EDE8DE',
              background: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
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
          <div style={{ fontSize: '0.8rem', color: '#525760', overflowWrap: 'anywhere', lineHeight: 1.5 }}>
            <strong>📍 Pickup:</strong> {tracking.restaurant?.name} — {tracking.restaurant?.address}
            <br />
            <strong>📍 Drop:</strong> {tracking.customer?.delivery_address || 'Customer location'}
          </div>

          <OperationalMapCanvas
            height="280px"
            targetStage={tracking.order_status === 'PICKED_UP' ? 'customer' : 'restaurant'}
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
            partnerCoords={resolvedPartnerCoords}
          />

          {!isLiveGpsActive && tracking.delivery_partner?.is_stale && (
            <div style={{ fontSize: '0.76rem', color: '#B45309' }}>
              Rider position may be stale — last server update {tracking.delivery_partner?.staleness_seconds || '?'}s ago.
            </div>
          )}
        </>
      )}
    </div>
  );
};
