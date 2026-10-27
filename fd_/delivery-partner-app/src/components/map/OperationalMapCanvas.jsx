import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Store, 
  CornerUpRight, 
  Plus, 
  Minus, 
  Gauge, 
  Clock,
  Bike,
  Building,
  Layers,
  Compass
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';
import { loadGoogleMapsApi } from '../../utils/googleMaps.js';

export const OperationalMapCanvas = ({ 
  targetStage = 'restaurant', // 'restaurant' | 'customer'
  height = '50vh',
  partnerCoords = null,
  restaurantCoords = null,
  customerCoords = null,
  apiKey = ''
}) => {
  const { currentSpeedKmh, currentHeadingDeg, activeTrip, gpsStatus } = useDelivery();

  const [courierPos, setCourierPos] = useState({ x: 36, y: 58 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTraffic, setShowTraffic] = useState(true);

  // Google Maps state
  const googleMapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const directionsRendererRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const [googleMapLoaded, setGoogleMapLoaded] = useState(false);
  const [googleMapError, setGoogleMapError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const resolvedApiKey = apiKey || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const restaurantName = restaurantCoords?.name || activeTrip?.restaurant_name || 'Urban Bowl';
  const customerName = customerCoords?.name || activeTrip?.customer_name || 'Ravi Kumar';
  const isHeadingToCustomer = targetStage === 'customer';

  // Resolved coordinates
  const restLat = Number(restaurantCoords?.latitude || activeTrip?.restaurant_lat || 12.9785);
  const restLng = Number(restaurantCoords?.longitude || activeTrip?.restaurant_lng || 77.6015);
  const custLat = Number(customerCoords?.latitude || activeTrip?.customer_lat || 12.9716);
  const custLng = Number(customerCoords?.longitude || activeTrip?.customer_lng || 77.5946);
  const partnerLat = Number(partnerCoords?.latitude || gpsStatus?.latitude || activeTrip?.rider_lat || 12.9750);
  const partnerLng = Number(partnerCoords?.longitude || gpsStatus?.longitude || activeTrip?.rider_lng || 77.5980);
  const partnerHeading = Number(partnerCoords?.heading || gpsStatus?.heading || currentHeadingDeg || 0);

  // 1. Google Maps Script Loader via shared singleton
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsApi(resolvedApiKey)
      .then(() => {
        if (!cancelled) {
          setGoogleMapLoaded(true);
          setGoogleMapError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          if (err?.message === 'MISSING_API_KEY') {
            setGoogleMapError('No Google Maps API key provided. Using offline-ready operational vector map.');
          } else {
            setGoogleMapError('Failed to load Google Maps script. Falling back to operational vector canvas.');
          }
          setGoogleMapLoaded(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedApiKey]);

  // 2. Initialize Google Map Instance
  useEffect(() => {
    if (!googleMapLoaded || !window.google?.maps || !googleMapRef.current) return;

    try {
      const map = new window.google.maps.Map(googleMapRef.current, {
        center: { lat: partnerLat, lng: partnerLng },
        zoom: 14,
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

      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#DC2626',
          strokeWeight: 5,
          strokeOpacity: 0.9
        }
      });
      directionsRendererRef.current = directionsRenderer;
    } catch (err) {
      console.warn('Google Maps initialization failed:', err);
      setGoogleMapError(err.message);
    }

    return () => {
      Object.values(markersRef.current).forEach(m => m?.setMap?.(null));
      markersRef.current = {};
    };
  }, [googleMapLoaded]);

  // 3. Update Google Map Markers and Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    const bounds = new window.google.maps.LatLngBounds();

    // Courier Marker
    const partnerPos = { lat: partnerLat, lng: partnerLng };
    bounds.extend(partnerPos);

    if (!markersRef.current.partner) {
      markersRef.current.partner = new window.google.maps.Marker({
        position: partnerPos,
        map,
        title: 'You (Delivery Partner)',
        zIndex: 100,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          rotation: partnerHeading,
          fillColor: '#DC2626',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });
    } else {
      markersRef.current.partner.setPosition(partnerPos);
      const icon = markersRef.current.partner.getIcon();
      if (icon && typeof icon === 'object') {
        icon.rotation = partnerHeading;
        markersRef.current.partner.setIcon(icon);
      }
    }

    // Restaurant Marker
    const restPos = { lat: restLat, lng: restLng };
    bounds.extend(restPos);

    if (!markersRef.current.restaurant) {
      markersRef.current.restaurant = new window.google.maps.Marker({
        position: restPos,
        map,
        title: restaurantName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });
    } else {
      markersRef.current.restaurant.setPosition(restPos);
    }

    // Customer Marker
    const custPos = { lat: custLat, lng: custLng };
    bounds.extend(custPos);

    if (!markersRef.current.customer) {
      markersRef.current.customer = new window.google.maps.Marker({
        position: custPos,
        map,
        title: customerName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });
    } else {
      markersRef.current.customer.setPosition(custPos);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 50);
    }

    // Calculate directions from partner to current target
    const targetPos = isHeadingToCustomer ? custPos : restPos;
    if (directionsRendererRef.current && window.google?.maps?.DirectionsService) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: partnerPos,
          destination: targetPos,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            if (leg) {
              setRouteInfo({
                distanceText: leg.distance?.text,
                durationText: leg.duration?.text
              });
            }
          }
        }
      );
    }
  }, [partnerLat, partnerLng, partnerHeading, restLat, restLng, custLat, custLng, isHeadingToCustomer, googleMapLoaded]);

  // Fallback realistic vector coordinates movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCourierPos(prev => {
        const nextX = prev.x < 74 ? prev.x + 0.6 : 36;
        const nextY = prev.y > 28 ? prev.y - 0.45 : 58;
        return { x: nextX, y: nextY };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const recenterPartner = () => {
    if (mapInstanceRef.current && window.google?.maps) {
      mapInstanceRef.current.panTo({ lat: partnerLat, lng: partnerLng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const toggleGoogleTraffic = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new window.google.maps.TrafficLayer();
    }
    if (showTraffic) {
      trafficLayerRef.current.setMap(null);
      setShowTraffic(false);
    } else {
      trafficLayerRef.current.setMap(map);
      setShowTraffic(true);
    }
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        backgroundColor: '#F5F2EB',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid #EDE8DE',
        boxShadow: '0 4px 20px rgba(25, 27, 31, 0.05)',
        userSelect: 'none'
      }}
      role="region"
      aria-label="Real-world Delivery Navigation Map"
    >
      {/* 1. Google Maps Real Canvas */}
      <div
        ref={googleMapRef}
        style={{
          width: '100%',
          height: '100%',
          display: googleMapLoaded && !googleMapError ? 'block' : 'none'
        }}
      />

      {/* 2. Top Turn-by-Turn Instruction Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 20,
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '16px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 14px rgba(25, 27, 31, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CornerUpRight size={20} strokeWidth={2.5} />
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', letterSpacing: '0.5px' }}>
              RECOMMENDED DISPATCH CORRIDOR
            </span>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
              {isHeadingToCustomer 
                ? `Route to Customer: ${customerName}`
                : `Route to Merchant: ${restaurantName}`}
            </div>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '0.95rem', fontWeight: 800, color: '#191B1F' }}>
            {routeInfo?.distanceText || (isHeadingToCustomer ? '850 m' : '1.4 km')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
            {routeInfo?.durationText || (isHeadingToCustomer ? '~3 min' : '~6 min')}
          </span>
        </div>
      </div>

      {/* 3. Fallback SVG Vector Map Canvas (When Google Maps key is missing or offline) */}
      {(!googleMapLoaded || googleMapError) && (
        <>
          <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          >
            <defs>
              <pattern id="city-blocks" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#F8F6F0" stroke="#EDE8DE" strokeWidth="0.3" />
              </pattern>
            </defs>

            <rect width="100" height="100" fill="url(#city-blocks)" />
            <path d="M 2 8 L 22 4 L 18 28 L 4 24 Z" fill="#E8F4EC" stroke="#D3E8D9" strokeWidth="0.4" />
            <path d="M 70 65 L 94 62 L 96 90 L 74 94 Z" fill="#E8F4EC" stroke="#D3E8D9" strokeWidth="0.4" />
            <path d="M 52 0 Q 56 30 48 60 T 54 100" fill="none" stroke="#DCEBF7" strokeWidth="3" />

            <path d="M 0 38 L 100 38" stroke="#FFFFFF" strokeWidth="4.5" />
            <path d="M 0 74 L 100 74" stroke="#FFFFFF" strokeWidth="3.5" />
            <path d="M 28 0 L 28 100" stroke="#FFFFFF" strokeWidth="4" />
            <path d="M 76 0 L 76 100" stroke="#FFFFFF" strokeWidth="4.5" />
            <path d="M 10 100 L 90 0" stroke="#FFFFFF" strokeWidth="3.5" />
            <path d="M 0 20 L 100 90" stroke="#FFFFFF" strokeWidth="2.5" />

            <path d="M 0 38 L 100 38" stroke="#DDD6C9" strokeWidth="0.6" fill="none" />
            <path d="M 28 0 L 28 100" stroke="#DDD6C9" strokeWidth="0.6" fill="none" />
            <path d="M 76 0 L 76 100" stroke="#DDD6C9" strokeWidth="0.6" fill="none" />

            {showTraffic && (
              <>
                <path d="M 28 50 L 28 74" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                <path d="M 38 38 L 70 38" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                <path d="M 76 38 L 76 65" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              </>
            )}

            <path 
              d="M 22 66 L 28 66 L 28 38 L 64 38 L 76 38 L 76 31"
              stroke="#DC2626"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 2"
              fill="none"
              opacity="0.9"
            />
          </svg>

          {/* Fallback Restaurant Pin */}
          <div style={{
            position: 'absolute',
            top: '66%',
            left: '22%',
            transform: 'translate(-50%, -100%)',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#D97706',
              boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)',
              whiteSpace: 'nowrap',
              marginBottom: '4px'
            }}>
              {restaurantName} (PICKUP)
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 12px rgba(245, 158, 11, 0.45)',
              border: '2.5px solid #FFFFFF'
            }}>
              <Store size={16} />
            </div>
          </div>

          {/* Fallback Customer Pin */}
          <div style={{
            position: 'absolute',
            top: '31%',
            left: '76%',
            transform: 'translate(-50%, -100%)',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #A7F3D0',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#059669',
              boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)',
              whiteSpace: 'nowrap',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Building size={12} color="#059669" />
              <span>{customerName} (Drop-off)</span>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 12px rgba(5, 150, 105, 0.45)',
              border: '2.5px solid #FFFFFF'
            }}>
              <MapPin size={17} />
            </div>
          </div>

          {/* Fallback Partner Pin */}
          <div style={{
            position: 'absolute',
            top: `${courierPos.y}%`,
            left: `${courierPos.x}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'top 2s linear, left 2s linear',
            pointerEvents: 'none'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: '3px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
              position: 'relative'
            }}>
              <Bike size={20} strokeWidth={2.5} />
            </div>
            <span style={{
              marginTop: '4px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#DC2626',
              fontFamily: "'Space Grotesk', monospace",
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>
              YOU • {currentSpeedKmh} KM/H
            </span>
          </div>
        </>
      )}

      {/* 4. Controls: Recenter, Traffic, Zoom */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {googleMapLoaded && (
          <button
            onClick={recenterPartner}
            type="button"
            title="Recenter On GPS"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)'
            }}
          >
            <Navigation size={18} />
          </button>
        )}

        <button
          onClick={() => {
            if (googleMapLoaded) toggleGoogleTraffic();
            else setShowTraffic(!showTraffic);
          }}
          type="button"
          title="Toggle Traffic Layer"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: showTraffic ? '#FFFBEB' : '#FFFFFF',
            border: `1px solid ${showTraffic ? '#FDE68A' : '#EDE8DE'}`,
            color: showTraffic ? '#D97706' : '#7A808C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 800,
            boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)'
          }}
        >
          🚦
        </button>

        <button
          onClick={() => {
            if (mapInstanceRef.current && window.google?.maps) {
              mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
            }
          }}
          type="button"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #EDE8DE',
            color: '#191B1F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)'
          }}
        >
          <Plus size={18} />
        </button>

        <button
          onClick={() => {
            if (mapInstanceRef.current && window.google?.maps) {
              mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
            }
          }}
          type="button"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #EDE8DE',
            color: '#191B1F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)'
          }}
        >
          <Minus size={18} />
        </button>
      </div>

      {/* 5. Speedometer Pill */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 20,
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '14px',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.06)'
      }}>
        <Gauge size={16} color="#DC2626" />
        <span style={{
          fontFamily: "'Space Grotesk', monospace",
          fontSize: '0.84rem',
          fontWeight: 800,
          color: '#191B1F'
        }}>
          {gpsStatus?.speed || currentSpeedKmh} <span style={{ fontSize: '0.7rem', color: '#7A808C' }}>KM/H</span>
        </span>
      </div>
    </div>
  );
};
