import React, { useState, useEffect, useRef } from 'react';
import { Store, Bike, MapPin, CheckCircle2, Phone, ShieldCheck, X, Navigation, Layers, Compass, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { loadGoogleMapsApi } from '../utils/googleMaps.js';
import { fetchAdminRestaurants, fetchAdminOrders } from '../services/api.js';

export const LiveControlMap = ({ height = '500px' }) => {
  const { activeOrders: contextOrders, restaurants: contextRestaurants } = useAdmin();

  // Selected Order for Inspector
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Entities state
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [activeOrdersList, setActiveOrdersList] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  // Google Maps State
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [googleMapLoaded, setGoogleMapLoaded] = useState(false);
  const [googleMapError, setGoogleMapError] = useState(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const trafficLayerRef = useRef(null);

  // Fetch real entity data if available
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [restRes, ordersRes] = await Promise.allSettled([
          fetchAdminRestaurants({ page_size: 20 }),
          fetchAdminOrders({ status: 'ACTIVE', page_size: 20 })
        ]);

        if (cancelled) return;

        if (restRes.status === 'fulfilled' && (restRes.value?.results || Array.isArray(restRes.value))) {
          const list = restRes.value.results || restRes.value;
          setRestaurantsList(list);
        } else if (contextRestaurants && contextRestaurants.length > 0) {
          setRestaurantsList(contextRestaurants);
        }

        if (ordersRes.status === 'fulfilled' && (ordersRes.value?.results || Array.isArray(ordersRes.value))) {
          const list = ordersRes.value.results || ordersRes.value;
          setActiveOrdersList(list);
          if (list.length > 0) {
            setSelectedOrder({
              id: list[0].id || list[0].order_number,
              customer: list[0].customer_name || 'Customer',
              restaurant: list[0].restaurant_name || 'Kitchen',
              rider: list[0].partner_name || 'Assigned Partner',
              payment: `₹${list[0].grand_total || '450'} — ${list[0].payment_status || 'Paid'}`,
              status: list[0].status || 'In Transit',
              eta: '15-20 min'
            });
          }
        } else if (contextOrders && contextOrders.length > 0) {
          setActiveOrdersList(contextOrders);
        }
      } catch (err) {
        console.warn('Admin map data loading notice:', err);
      } finally {
        if (!cancelled) setLoadingEntities(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [contextRestaurants, contextOrders]);

  // Load Google Maps API via Singleton
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsApi()
      .then(() => {
        if (!cancelled) {
          setGoogleMapLoaded(true);
          setGoogleMapError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.message === 'MISSING_API_KEY') {
            setGoogleMapError('No Google Maps API key provided. Using offline operational control map.');
          } else {
            setGoogleMapError('Failed to load Google Maps. Falling back to operational control map.');
          }
          setGoogleMapLoaded(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize and update Google Map Markers
  useEffect(() => {
    if (!googleMapLoaded || !window.google?.maps || !mapContainerRef.current) return;

    // Default center: Bengaluru
    const defaultCenter = { lat: 12.9716, lng: 77.5946 };

    if (!mapInstanceRef.current) {
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeId: 'roadmap',
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
          ]
        });
        mapInstanceRef.current = map;
      } catch (e) {
        console.warn('Map initialization error:', e);
        setGoogleMapError(e.message);
        return;
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m?.setMap?.(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // 1. Restaurant Markers
    restaurantsList.forEach((r, idx) => {
      const lat = Number(r.latitude) || (12.9716 + (idx % 3) * 0.015 - 0.01);
      const lng = Number(r.longitude) || (77.5946 + (idx % 2) * 0.015 - 0.008);
      const pos = { lat, lng };
      bounds.extend(pos);

      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: r.name || 'Restaurant',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        setSelectedOrder({
          id: `REST-${r.id || idx + 1}`,
          customer: 'Multiple Active Orders',
          restaurant: r.name || 'Partner Kitchen',
          rider: 'Assigned Courier Pool',
          payment: 'Automated Daily Payout',
          status: r.is_open ? 'Kitchen Open' : 'Closed',
          eta: '10-15 min dispatch'
        });
      });

      markersRef.current.push(marker);
    });

    // 2. Active Orders & Rider Markers
    activeOrdersList.forEach((o, idx) => {
      const riderLat = Number(o.rider_lat) || (12.9750 + (idx % 3) * 0.01 - 0.005);
      const riderLng = Number(o.rider_lng) || (77.5980 + (idx % 2) * 0.01 - 0.005);
      const riderPos = { lat: riderLat, lng: riderLng };
      bounds.extend(riderPos);

      const riderMarker = new window.google.maps.Marker({
        position: riderPos,
        map,
        title: `Rider for Order #${o.order_number || o.id}`,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          rotation: Number(o.rider_heading || 45),
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      riderMarker.addListener('click', () => {
        setSelectedOrder({
          id: o.order_number || o.id,
          customer: o.customer_name || 'Customer',
          restaurant: o.restaurant_name || 'Kitchen Hub',
          rider: o.partner_name || 'Express Courier',
          payment: `₹${o.grand_total || '520'} — ${o.payment_status || 'Paid'}`,
          status: o.status || 'Out for Delivery',
          eta: o.estimated_delivery_time || '14 min'
        });
      });

      markersRef.current.push(riderMarker);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 50);
    }
  }, [googleMapLoaded, restaurantsList, activeOrdersList]);

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

  // Static SVG fallback data
  const fallbackRestaurants = [
    { id: 1, name: 'Burger House', x: 25, y: 35 },
    { id: 2, name: 'Kinetic Biryani Vault', x: 65, y: 25 },
    { id: 3, name: 'Neo Tokyo Noodle', x: 75, y: 70 }
  ];

  const fallbackDeliveryPartners = [
    { id: 1, name: 'Arun', x: 38, y: 48, status: 'On the Way' },
    { id: 2, name: 'Kaelen Vance', x: 60, y: 40, status: 'At Kitchen' },
    { id: 3, name: 'Zoya Khan', x: 80, y: 60, status: 'Delivering' }
  ];

  const fallbackCustomerLocations = [
    { id: 1, name: 'Ravi (Order #WS10245)', x: 50, y: 62 },
    { id: 2, name: 'Aria Vance', x: 20, y: 80 },
    { id: 3, name: 'Priya Sharma', x: 85, y: 30 }
  ];

  return (
    <div style={{
      position: 'relative',
      height: height,
      width: '100%',
      backgroundColor: '#F5EFE6',
      overflow: 'hidden',
      borderRadius: '16px'
    }}>
      {/* 1. Google Maps Real Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          display: googleMapLoaded && !googleMapError ? 'block' : 'none'
        }}
      />

      {/* 2. Fallback SVG Map (When Google Maps key is missing or offline) */}
      {(!googleMapLoaded || googleMapError) && (
        <>
          <svg style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
            {/* City Blocks */}
            <rect x="5%" y="8%" width="28%" height="22%" rx="8" fill="#EAE2D5" />
            <rect x="40%" y="6%" width="25%" height="24%" rx="8" fill="#EAE2D5" />
            <rect x="70%" y="10%" width="25%" height="30%" rx="8" fill="#EAE2D5" />
            <rect x="8%" y="40%" width="25%" height="45%" rx="8" fill="#EAE2D5" />
            <rect x="40%" y="42%" width="24%" height="45%" rx="8" fill="#EAE2D5" />
            <rect x="70%" y="50%" width="25%" height="40%" rx="8" fill="#EAE2D5" />

            {/* Roads */}
            <path d="M 0 160 L 1200 160" stroke="#FFFFFF" strokeWidth="18" />
            <path d="M 0 160 L 1200 160" stroke="#DDD2C1" strokeWidth="20" />
            <path d="M 380 0 L 380 700" stroke="#FFFFFF" strokeWidth="18" />
            <path d="M 720 0 L 720 700" stroke="#FFFFFF" strokeWidth="18" />

            {/* Active Route Polyline */}
            <path
              d="M 250 180 Q 380 240 500 310"
              stroke="#4D9DE0"
              strokeWidth="6"
              strokeDasharray="8 6"
              fill="none"
            />
          </svg>

          {/* SVG Restaurant Pins */}
          {fallbackRestaurants.map(r => (
            <div
              key={r.id}
              style={{
                position: 'absolute',
                left: `${r.x}%`,
                top: `${r.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedOrder({
                id: 'WS10245',
                customer: 'Ravi',
                restaurant: r.name,
                rider: 'Arun',
                payment: '₹457 — Paid',
                status: 'On the Way',
                eta: '18 min'
              })}
            >
              <div style={{
                background: '#FFFFFF',
                border: '2px solid #241A17',
                borderRadius: '8px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                marginBottom: '3px'
              }}>
                🏪 {r.name}
              </div>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#F2C14E', border: '2px solid #241A17' }} />
            </div>
          ))}

          {/* SVG Courier Pins */}
          {fallbackDeliveryPartners.map(d => (
            <div
              key={d.id}
              style={{
                position: 'absolute',
                left: `${d.x}%`,
                top: `${d.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
              onClick={() => setSelectedOrder({
                id: 'WS10245',
                customer: 'Ravi',
                restaurant: 'Burger House',
                rider: d.name,
                payment: '₹457 — Paid',
                status: 'On the Way',
                eta: '18 min'
              })}
            >
              <div style={{
                background: '#4D9DE0',
                color: '#FFFFFF',
                border: '2px solid #241A17',
                borderRadius: '8px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 900,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                marginBottom: '3px'
              }}>
                🛵 {d.name}
              </div>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#F45B32', border: '2px solid #FFFFFF' }} />
            </div>
          ))}

          {/* SVG Customer Pins */}
          {fallbackCustomerLocations.map(c => (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedOrder({
                id: 'WS10245',
                customer: c.name,
                restaurant: 'Burger House',
                rider: 'Arun',
                payment: '₹457 — Paid',
                status: 'On the Way',
                eta: '18 min'
              })}
            >
              <div style={{
                background: '#241A17',
                color: '#FFFFFF',
                border: '2px solid #241A17',
                borderRadius: '8px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                marginBottom: '3px'
              }}>
                📍 {c.name}
              </div>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#5C9E4A', border: '2px solid #FFFFFF' }} />
            </div>
          ))}
        </>
      )}

      {/* Floating Selected Order Card Inspector */}
      {selectedOrder && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: '#FFFFFF',
          border: '2px solid #241A17',
          borderRadius: '18px',
          padding: '16px 18px',
          boxShadow: '0 8px 24px rgba(36, 26, 23, 0.15)',
          maxWidth: '340px',
          width: 'calc(100% - 40px)',
          zIndex: 30
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #EADBCE', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#241A17' }}>
              Order #{selectedOrder.id}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                background: '#EAF5E7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.72rem'
              }}>
                {selectedOrder.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px' }}
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: '#6E6259' }}>Customer: </span>
              <strong style={{ color: '#241A17' }}>{selectedOrder.customer}</strong>
            </div>

            <div>
              <span style={{ color: '#6E6259' }}>Restaurant: </span>
              <strong style={{ color: '#241A17' }}>{selectedOrder.restaurant}</strong>
            </div>

            <div>
              <span style={{ color: '#6E6259' }}>Delivery Partner: </span>
              <strong style={{ color: '#2563EB' }}>{selectedOrder.rider}</strong>
            </div>

            <div>
              <span style={{ color: '#6E6259' }}>Payment: </span>
              <strong style={{ color: '#15803D' }}>{selectedOrder.payment}</strong>
            </div>

            <div>
              <span style={{ color: '#6E6259' }}>ETA: </span>
              <strong style={{ color: '#EA580C' }}>{selectedOrder.eta}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls & Legend */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        zIndex: 20
      }}>
        {googleMapLoaded && !googleMapError && (
          <button
            type="button"
            onClick={toggleTraffic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: trafficEnabled ? '#15803D' : '#FFFFFF',
              color: trafficEnabled ? '#FFFFFF' : '#241A17',
              border: '2px solid #241A17',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <Layers size={13} />
            <span>{trafficEnabled ? 'Traffic: ON' : 'Traffic: OFF'}</span>
          </button>
        )}

        <div style={{
          background: '#FFFFFF',
          border: '2px solid #241A17',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          gap: '12px',
          fontSize: '0.72rem',
          fontWeight: 800,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          <span>🏪 Kitchens</span>
          <span>🛵 Couriers</span>
          <span>📍 Drops</span>
        </div>
      </div>
    </div>
  );
};
