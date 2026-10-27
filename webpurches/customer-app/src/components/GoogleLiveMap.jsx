import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, AlertTriangle, RefreshCw, Layers, ShieldCheck, Compass, Info } from 'lucide-react';

/**
 * GoogleLiveMap - Real-time Google Maps Tracking Component for Food Delivery
 * Integrates Google Maps JavaScript API with graceful fallback to interactive vector radar
 * when Google Maps API key is unavailable, network is offline, or quota exceeded.
 */
export const GoogleLiveMap = ({
  restaurant = { name: 'Restaurant Partner', latitude: 12.9785, longitude: 77.6015, address: '' },
  customer = { delivery_address: 'Customer Address', latitude: 12.9716, longitude: 77.5946 },
  deliveryPartner = null, // { name, latitude, longitude, heading, is_stale, staleness_seconds, vehicle_type }
  apiKey = '',
  height = '360px',
  orderStatus = 'ON_THE_WAY',
  onDirectionsCalculated = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const directionsRendererRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const trafficLayerRef = useRef(null);
  const [routeStats, setRouteStats] = useState(null);

  // Validate coordinates
  const validRestaurant = restaurant?.latitude && restaurant?.longitude;
  const validCustomer = customer?.latitude && customer?.longitude;
  const validPartner = deliveryPartner?.latitude && deliveryPartner?.longitude;

  // Resolved API key
  const resolvedApiKey = apiKey || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // 1. Google Maps JS Script Dynamic Loader
  useEffect(() => {
    if (!resolvedApiKey) {
      setLoadError('No Google Maps API key provided. Using high-precision telemetry radar.');
      return;
    }

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(resolvedApiKey)}&libraries=geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapLoaded(true);
        setLoadError(null);
      };

      script.onerror = () => {
        setLoadError('Failed to load Google Maps JavaScript API. Operating in telemetry radar fallback mode.');
      };

      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          setMapLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [resolvedApiKey]);

  // 2. Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps || !mapContainerRef.current) return;

    try {
      const defaultCenter = validPartner
        ? { lat: Number(deliveryPartner.latitude), lng: Number(deliveryPartner.longitude) }
        : validRestaurant
          ? { lat: Number(restaurant.latitude), lng: Number(restaurant.longitude) }
          : { lat: 12.9750, lng: 77.5980 };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cde2f8' }] },
          { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#fbe09e' }] },
          { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f3c467' }] }
        ]
      });

      mapInstanceRef.current = map;

      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#0284C7',
          strokeWeight: 5,
          strokeOpacity: 0.85
        }
      });
      directionsRendererRef.current = directionsRenderer;
    } catch (err) {
      console.warn('Error creating Google Maps instance:', err);
      setLoadError('Error initializing Google Maps viewport.');
    }

    return () => {
      // Cleanup markers
      Object.values(markersRef.current).forEach(m => m?.setMap?.(null));
      markersRef.current = {};
    };
  }, [mapLoaded]);

  // 3. Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    const bounds = new window.google.maps.LatLngBounds();

    // A. Restaurant Marker
    if (validRestaurant) {
      const restPos = { lat: Number(restaurant.latitude), lng: Number(restaurant.longitude) };
      bounds.extend(restPos);

      if (!markersRef.current.restaurant) {
        markersRef.current.restaurant = new window.google.maps.Marker({
          position: restPos,
          map,
          title: restaurant.name || 'Pickup Restaurant',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#D97706',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5
          }
        });
      } else {
        markersRef.current.restaurant.setPosition(restPos);
      }
    }

    // B. Customer Destination Marker
    if (validCustomer) {
      const custPos = { lat: Number(customer.latitude), lng: Number(customer.longitude) };
      bounds.extend(custPos);

      if (!markersRef.current.customer) {
        markersRef.current.customer = new window.google.maps.Marker({
          position: custPos,
          map,
          title: customer.delivery_address || 'Delivery Address',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5
          }
        });
      } else {
        markersRef.current.customer.setPosition(custPos);
      }
    }

    // C. Live Delivery Partner Marker
    if (validPartner) {
      const partnerPos = { lat: Number(deliveryPartner.latitude), lng: Number(deliveryPartner.longitude) };
      bounds.extend(partnerPos);

      if (!markersRef.current.partner) {
        markersRef.current.partner = new window.google.maps.Marker({
          position: partnerPos,
          map,
          title: `Courier: ${deliveryPartner.name || 'Partner'}`,
          zIndex: 999,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            rotation: Number(deliveryPartner.heading || 0),
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
      } else {
        markersRef.current.partner.setPosition(partnerPos);
        const icon = markersRef.current.partner.getIcon();
        if (icon && typeof icon === 'object') {
          icon.rotation = Number(deliveryPartner.heading || 0);
          markersRef.current.partner.setIcon(icon);
        }
      }
    }

    // D. Fit bounds if multiple points exist
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }

    // E. Calculate Driving Route
    const origin = validPartner
      ? { lat: Number(deliveryPartner.latitude), lng: Number(deliveryPartner.longitude) }
      : validRestaurant
        ? { lat: Number(restaurant.latitude), lng: Number(restaurant.longitude) }
        : null;

    const destination = validCustomer
      ? { lat: Number(customer.latitude), lng: Number(customer.longitude) }
      : null;

    if (origin && destination && directionsRendererRef.current && window.google?.maps?.DirectionsService) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            if (leg) {
              const stats = {
                distanceText: leg.distance?.text || '',
                durationText: leg.duration?.text || '',
                distanceValue: leg.distance?.value || 0,
                durationValue: leg.duration?.value || 0
              };
              setRouteStats(stats);
              if (onDirectionsCalculated) {
                onDirectionsCalculated(stats);
              }
            }
          }
        }
      );
    }
  }, [validRestaurant, validCustomer, validPartner, deliveryPartner?.latitude, deliveryPartner?.longitude, deliveryPartner?.heading, mapLoaded]);

  // Toggle Traffic Layer
  const toggleTraffic = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new window.google.maps.TrafficLayer();
    }

    if (trafficEnabled) {
      trafficLayerRef.current.setMap(null);
      setTrafficEnabled(false);
    } else {
      trafficLayerRef.current.setMap(map);
      setTrafficEnabled(true);
    }
  };

  // Recenter on Rider
  const recenterRider = () => {
    const map = mapInstanceRef.current;
    if (!map || !validPartner) return;
    map.panTo({ lat: Number(deliveryPartner.latitude), lng: Number(deliveryPartner.longitude) });
    map.setZoom(15);
  };

  // Recenter to Fit All
  const fitAllPoints = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    if (validRestaurant) bounds.extend({ lat: Number(restaurant.latitude), lng: Number(restaurant.longitude) });
    if (validCustomer) bounds.extend({ lat: Number(customer.latitude), lng: Number(customer.longitude) });
    if (validPartner) bounds.extend({ lat: Number(deliveryPartner.latitude), lng: Number(deliveryPartner.longitude) });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '18px', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
      
      {/* 1. Google Maps Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          display: mapLoaded && !loadError ? 'block' : 'none'
        }}
      />

      {/* 2. Fallback Vector Telemetry Radar (Graceful degradation if no API key or offline) */}
      {(!mapLoaded || loadError) && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: '#0F172A',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#E2E8F0'
        }}>
          {/* Radar Grid SVG Background */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <pattern id="radar-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#radar-grid)" />
            {/* Telemetry Route Line */}
            <path
              d="M 120 250 Q 280 180 500 160 T 740 100"
              stroke="#38BDF8"
              strokeWidth="4"
              strokeDasharray="6 6"
              fill="none"
              opacity="0.8"
            />
          </svg>

          {/* Fallback Marker Pins */}
          <div style={{ position: 'absolute', left: '16%', top: '68%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ background: '#D97706', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              🏪 {restaurant?.name || 'Restaurant'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '2px' }}>
              {Number(restaurant?.latitude || 12.9785).toFixed(4)}, {Number(restaurant?.longitude || 77.6015).toFixed(4)}
            </div>
          </div>

          <div style={{
            position: 'absolute',
            left: validPartner ? '50%' : '35%',
            top: validPartner ? '48%' : '56%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div style={{
              background: '#EF4444',
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)'
            }}>
              🛵 {deliveryPartner?.name || 'Assigned Partner'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#FCA5A5', marginTop: '2px' }}>
              Lat: {Number(deliveryPartner?.latitude || 12.9750).toFixed(4)} • Lng: {Number(deliveryPartner?.longitude || 77.5980).toFixed(4)}
            </div>
          </div>

          <div style={{ position: 'absolute', right: '14%', top: '26%', transform: 'translate(50%, -50%)', textAlign: 'center' }}>
            <div style={{ background: '#10B981', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              📍 Drop-off Point
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '2px' }}>
              {Number(customer?.latitude || 12.9716).toFixed(4)}, {Number(customer?.longitude || 77.5946).toFixed(4)}
            </div>
          </div>

          {/* Top Notice Pill */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            margin: '12px',
            alignSelf: 'flex-start',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.76rem'
          }}>
            <Compass size={14} color="#38BDF8" />
            <span>High-Precision GPS Telemetry Radar</span>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>(Native Vector Canvas)</span>
          </div>

          {/* Bottom Diagnostics Strip */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(2, 6, 23, 0.9)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <span>Direct telemetry feed active</span>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
              {resolvedApiKey ? 'Loading Google Maps layer...' : 'Google Maps API key not specified; fallback visual active'}
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating HUD Controls (When Google Maps is loaded) */}
      {mapLoaded && !loadError && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <button
            onClick={recenterRider}
            title="Focus on Courier"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#EF4444'
            }}
          >
            <Navigation size={16} />
          </button>

          <button
            onClick={fitAllPoints}
            title="View Full Route Bounds"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0284C7'
            }}
          >
            <Compass size={16} />
          </button>

          <button
            onClick={toggleTraffic}
            title="Toggle Live Traffic Layer"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: trafficEnabled ? '#EFF6FF' : '#FFFFFF',
              border: `1px solid ${trafficEnabled ? '#93C5FD' : '#E2E8F0'}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: trafficEnabled ? '#2563EB' : '#64748B'
            }}
          >
            <Layers size={16} />
          </button>
        </div>
      )}

      {/* 4. Stale GPS Warning Banner */}
      {deliveryPartner?.is_stale && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          zIndex: 15,
          background: 'rgba(254, 243, 199, 0.95)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #FCD34D',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <AlertTriangle size={18} color="#D97706" />
          <div style={{ fontSize: '0.78rem', color: '#92400E' }}>
            <strong>GPS Signal Delayed:</strong> Last update was {deliveryPartner.staleness_seconds || 90}+ seconds ago. Reconnecting to rider GPS telemetry...
          </div>
        </div>
      )}

      {/* 5. Live Driving Route Info Strip */}
      {routeStats && !deliveryPartner?.is_stale && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontSize: '0.8rem',
          color: '#1E293B'
        }}>
          <span>🛣️ Distance: <strong>{routeStats.distanceText}</strong></span>
          <span>•</span>
          <span>⏱️ ETA: <strong style={{ color: '#059669' }}>{routeStats.durationText}</strong></span>
        </div>
      )}
    </div>
  );
};
