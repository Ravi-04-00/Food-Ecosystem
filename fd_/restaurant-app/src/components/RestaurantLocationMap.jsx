import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Check } from 'lucide-react';
import { loadGoogleMapsApi } from '../utils/googleMaps.js';

export const RestaurantLocationMap = ({
  latitude = 12.9716,
  longitude = 77.5946,
  isEditable = false,
  onLocationChange,
  restaurantName = 'Restaurant',
  address = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({ lat: Number(latitude) || 12.9716, lng: Number(longitude) || 77.5946 });
  const [locatingUser, setLocatingUser] = useState(false);

  // Sync external coords
  useEffect(() => {
    const lat = Number(latitude) || 12.9716;
    const lng = Number(longitude) || 77.5946;
    setCurrentCoords({ lat, lng });

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
    }
  }, [latitude, longitude]);

  // Load Google Maps API
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsApi()
      .then(() => {
        if (!cancelled) {
          setMapLoaded(true);
          setMapError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.message === 'MISSING_API_KEY') {
            setMapError('No Google Maps API key provided. Using offline coordinate viewer.');
          } else {
            setMapError('Failed to load Google Maps. Using offline coordinate viewer.');
          }
          setMapLoaded(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google?.maps) return;

    try {
      const initialPos = {
        lat: Number(currentCoords.lat) || 12.9716,
        lng: Number(currentCoords.lng) || 77.5946
      };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 15,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: isEditable ? 'greedy' : 'cooperative',
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
        ]
      });

      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: initialPos,
        map,
        title: restaurantName,
        draggable: isEditable,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#16A34A',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      markerRef.current = marker;

      // Draggable event
      if (isEditable) {
        marker.addListener('dragend', (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          handlePositionUpdate(newLat, newLng);
        });

        // Click to move marker
        map.addListener('click', (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          marker.setPosition({ lat: newLat, lng: newLng });
          handlePositionUpdate(newLat, newLng);
        });
      }
    } catch (e) {
      console.warn('Map initialization error:', e);
      setMapError(e.message);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, isEditable, restaurantName]);

  const handlePositionUpdate = (lat, lng) => {
    setCurrentCoords({ lat, lng });

    // Reverse geocode if available
    let reverseAddress = '';
    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]?.formatted_address) {
          reverseAddress = results[0].formatted_address;
        }
        if (onLocationChange) {
          onLocationChange({ lat, lng, address: reverseAddress });
        }
      });
    } else if (onLocationChange) {
      onLocationChange({ lat, lng, address: '' });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(16);
        }
        handlePositionUpdate(lat, lng);
      },
      (err) => {
        setLocatingUser(false);
        setMapError(`Failed to detect location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid var(--ws-border, #EDE8DE)',
      backgroundColor: '#FBF9F5',
      padding: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} />
          <span>Kitchen Dispatch Coordinates</span>
        </div>

        {isEditable && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locatingUser}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              color: '#374151',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Navigation size={12} className={locatingUser ? 'animate-spin' : ''} />
            <span>{locatingUser ? 'Detecting…' : 'Detect My Location'}</span>
          </button>
        )}
      </div>

      {/* Map or Offline Fallback Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '220px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        backgroundColor: '#F3F4F6'
      }}>
        {/* Real Google Maps */}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            display: mapLoaded && !mapError ? 'block' : 'none'
          }}
        />

        {/* Fallback Vector Display */}
        {(!mapLoaded || mapError) && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            textAlign: 'center',
            backgroundColor: '#FAF8F5'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px'
            }}>
              <Compass size={22} />
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1F2937' }}>
              {restaurantName}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px', maxWidth: '300px', overflowWrap: 'anywhere' }}>
              {address || 'Saved Dispatch Location'}
            </div>
            <div style={{
              marginTop: '8px',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: '#EDE9E2',
              color: '#374151'
            }}>
              {Number(currentCoords.lat).toFixed(6)}, {Number(currentCoords.lng).toFixed(6)}
            </div>
            {isEditable && (
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '6px' }}>
                Offline mode active. Coordinates can also be set via standard lat/long inputs.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lat/Long display and manual adjustments when editable */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280' }}>
        <span>
          Latitude: <strong style={{ color: '#1F2937' }}>{Number(currentCoords.lat).toFixed(6)}</strong>
        </span>
        <span>
          Longitude: <strong style={{ color: '#1F2937' }}>{Number(currentCoords.lng).toFixed(6)}</strong>
        </span>
      </div>

      {isEditable && (
        <span style={{ fontSize: '0.68rem', color: '#059669', fontStyle: 'italic' }}>
          💡 Tip: Click anywhere on the map or drag the green marker to set exact kitchen dispatch coordinates.
        </span>
      )}
    </div>
  );
};
