import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X, Check, AlertCircle, Loader, Compass, Layers } from 'lucide-react';
import { loadGoogleMapsApi, isGoogleMapsLoaded, getGoogleMapsApiKey } from '../utils/googleMaps.js';

// Default Leaflet marker icons for fallback mode
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultLeafletIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

/**
 * Enhanced LocationPicker Component (Dual Engine)
 * Primary: Interactive Google Maps with draggable marker & Geocoder
 * Fallback: Keyless Leaflet + OpenStreetMap when API key is missing or offline
 */
export const LocationPicker = ({ initialLat, initialLng, onConfirm, onCancel }) => {
  const mapContainerRef = useRef(null);
  
  // Coordinates state
  const [pos, setPos] = useState({
    lat: Number(initialLat) || 12.9716,
    lng: Number(initialLng) || 77.5946
  });

  // Engine state: 'google' | 'leaflet' | 'loading'
  const [engine, setEngine] = useState('loading');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [revAddress, setRevAddress] = useState(null);
  const [revLoading, setRevLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Maps instances
  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);
  const googleGeocoderRef = useRef(null);

  // Leaflet instances
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);

  const debounceRef = useRef(null);
  const revDebounceRef = useRef(null);

  // 1. Geocoding helpers
  const reverseGeocodeGoogle = useCallback((lat, lng) => {
    if (!googleGeocoderRef.current && window.google?.maps) {
      googleGeocoderRef.current = new window.google.maps.Geocoder();
    }
    if (!googleGeocoderRef.current) return;

    setRevLoading(true);
    googleGeocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setRevLoading(false);
      if (status === 'OK' && results && results[0]) {
        const place = results[0];
        const addrComponents = place.address_components || [];
        
        let streetNumber = '';
        let route = '';
        let sublocality = '';
        let locality = '';
        let adminArea = '';
        let postalCode = '';

        addrComponents.forEach(c => {
          if (c.types.includes('street_number')) streetNumber = c.long_name;
          if (c.types.includes('route')) route = c.long_name;
          if (c.types.includes('sublocality') || c.types.includes('sublocality_level_1')) sublocality = c.long_name;
          if (c.types.includes('locality')) locality = c.long_name;
          if (c.types.includes('administrative_area_level_1')) adminArea = c.long_name;
          if (c.types.includes('postal_code')) postalCode = c.long_name;
        });

        const street = [streetNumber, route].filter(Boolean).join(' ') || place.formatted_address?.split(',')[0] || '';

        setRevAddress({
          house_number: streetNumber,
          road: route || street,
          suburb: sublocality,
          city: locality || 'Bengaluru',
          state: adminArea || 'Karnataka',
          postcode: postalCode,
          formatted: place.formatted_address
        });
        setError('');
      } else {
        setRevAddress(null);
      }
    });
  }, []);

  const reverseGeocodeLeaflet = useCallback((lat, lng) => {
    if (revDebounceRef.current) clearTimeout(revDebounceRef.current);
    revDebounceRef.current = setTimeout(async () => {
      setRevLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
        const data = await res.json();
        setRevAddress(data?.address || null);
        setError('');
      } catch {
        setRevAddress(null);
        setError('Could not reverse geocode address. You can confirm coordinates and enter street manually.');
      } finally {
        setRevLoading(false);
      }
    }, 450);
  }, []);

  // 2. Initialize Engine
  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsApi()
      .then((gMaps) => {
        if (cancelled || !mapContainerRef.current) return;
        setEngine('google');

        const center = { lat: pos.lat, lng: pos.lng };
        const map = new gMaps.Map(mapContainerRef.current, {
          center,
          zoom: 16,
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DCEBF8' }] }
          ]
        });

        const marker = new gMaps.Marker({
          position: center,
          map,
          draggable: true,
          animation: gMaps.Animation?.DROP,
          title: 'Selected Delivery Location'
        });

        marker.addListener('dragend', () => {
          const newPos = marker.getPosition();
          const lat = newPos.lat();
          const lng = newPos.lng();
          setPos({ lat, lng });
          reverseGeocodeGoogle(lat, lng);
        });

        map.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          setPos({ lat, lng });
          reverseGeocodeGoogle(lat, lng);
        });

        googleMapRef.current = map;
        googleMarkerRef.current = marker;
        googleGeocoderRef.current = new gMaps.Geocoder();
        reverseGeocodeGoogle(pos.lat, pos.lng);
      })
      .catch((_) => {
        // Fallback to Leaflet + OpenStreetMap
        if (cancelled || !mapContainerRef.current) return;
        setEngine('leaflet');

        const map = L.map(mapContainerRef.current).setView([pos.lat, pos.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([pos.lat, pos.lng], { icon: DefaultLeafletIcon, draggable: true }).addTo(map);

        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          setPos({ lat: ll.lat, lng: ll.lng });
          reverseGeocodeLeaflet(ll.lat, ll.lng);
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setPos({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocodeLeaflet(e.latlng.lat, e.latlng.lng);
        });

        leafletMapRef.current = map;
        leafletMarkerRef.current = marker;
        reverseGeocodeLeaflet(pos.lat, pos.lng);
      });

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
      googleMapRef.current = null;
      googleMarkerRef.current = null;
    };
  }, []);

  // 3. Search handling
  const runSearch = async (text) => {
    const q = (text || '').trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError('');

    if (engine === 'google' && googleGeocoderRef.current) {
      googleGeocoderRef.current.geocode({ address: q }, (gResults, status) => {
        setSearching(false);
        if (status === 'OK' && gResults && gResults.length > 0) {
          setResults(
            gResults.slice(0, 5).map((r, idx) => ({
              id: r.place_id || idx,
              display_name: r.formatted_address,
              lat: r.geometry.location.lat(),
              lon: r.geometry.location.lng(),
              source: 'google'
            }))
          );
        } else {
          setResults([]);
        }
      });
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setError('Place search unavailable. You can pan the map or enter coordinates directly.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onQueryChange = (v) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 500);
  };

  const pickResult = (r) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon || r.lng);
    setPos({ lat, lng });

    if (engine === 'google' && googleMapRef.current && googleMarkerRef.current) {
      googleMapRef.current.panTo({ lat, lng });
      googleMapRef.current.setZoom(16);
      googleMarkerRef.current.setPosition({ lat, lng });
      reverseGeocodeGoogle(lat, lng);
    } else if (engine === 'leaflet' && leafletMapRef.current && leafletMarkerRef.current) {
      leafletMapRef.current.setView([lat, lng], 16);
      leafletMarkerRef.current.setLatLng([lat, lng]);
      reverseGeocodeLeaflet(lat, lng);
    }

    setResults([]);
    setQuery(r.display_name || '');
  };

  // 4. Browser Geolocation
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords;
        setPos({ lat: latitude, lng: longitude });

        if (engine === 'google' && googleMapRef.current && googleMarkerRef.current) {
          googleMapRef.current.panTo({ lat: latitude, lng: longitude });
          googleMapRef.current.setZoom(16);
          googleMarkerRef.current.setPosition({ lat: latitude, lng: longitude });
          reverseGeocodeGoogle(latitude, longitude);
        } else if (engine === 'leaflet' && leafletMapRef.current && leafletMarkerRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 16);
          leafletMarkerRef.current.setLatLng([latitude, longitude]);
          reverseGeocodeLeaflet(latitude, longitude);
        }
        setLocating(false);
      },
      (geoErr) => {
        setLocating(false);
        if (geoErr?.code === 1) {
          setError('Location access permission was denied. Please allow location permissions in your browser or type the address.');
        } else if (geoErr?.code === 2) {
          setError('GPS location unavailable at this moment.');
        } else if (geoErr?.code === 3) {
          setError('Location request timed out. Please try again.');
        } else {
          setError('Could not retrieve current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const buildComponents = () => {
    const a = revAddress || {};
    const road = [a.house_number, a.road].filter(Boolean).join(' ');
    return {
      latitude: Number(pos.lat.toFixed(6)),
      longitude: Number(pos.lng.toFixed(6)),
      street: road || a.formatted?.split(',')[0] || '',
      area: a.suburb || a.neighbourhood || a.hamlet || '',
      city: a.city || a.town || a.village || a.county || 'Chennai',
      state: a.state || 'Tamil Nadu',
      pincode: a.postcode || '600001',
      confirmed: true
    };
  };

  const preview = buildComponents();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Search Bar & My Location CTA */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#7A808C' }} />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search address, landmark, or street…"
            style={{
              width: '100%',
              padding: '9px 12px 9px 32px',
              borderRadius: '10px',
              border: '1px solid var(--ws-border, #E2E8F0)',
              background: '#FFFFFF',
              color: '#163D2B',
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: '10px', top: '11px', color: '#163D2B' }}>
              <Loader size={14} className="animate-spin" />
            </span>
          )}
          {results.length > 0 && (
            <div style={{
              position: 'absolute',
              zIndex: 500,
              left: 0,
              right: 0,
              top: '40px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              maxHeight: '180px',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}>
              {results.map((r, i) => (
                <button
                  key={`${r.id || i}`}
                  type="button"
                  onClick={() => pickResult(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #F1F5F9',
                    fontSize: '0.78rem',
                    color: '#163D2B',
                    cursor: 'pointer'
                  }}
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          style={{
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(82,183,136,0.3)',
            background: 'rgba(82,183,136,0.12)',
            color: '#163D2B',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: locating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Navigation size={14} /> {locating ? 'Detecting GPS…' : 'Use Current Location'}
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#B91C1C',
          fontSize: '0.8rem'
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Map Viewport Container */}
      <div style={{ position: 'relative' }}>
        <div
          ref={mapContainerRef}
          style={{
            height: '280px',
            borderRadius: '14px',
            border: '1px solid var(--ws-border, #E2E8F0)',
            overflow: 'hidden',
            background: '#F8FAF8'
          }}
        />

        {/* Engine Badge Overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(22, 61, 43, 0.15)',
          borderRadius: '9999px',
          padding: '4px 10px',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#163D2B',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: engine === 'google' ? '#22C55E' : '#3B82F6'
          }} />
          <span>{engine === 'google' ? 'Google Maps' : 'OpenStreetMap'}</span>
        </div>
      </div>

      {/* Reverse Geocode Preview Footer */}
      <div style={{ fontSize: '0.74rem', color: '#65776B', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} style={{ color: '#52B788', flexShrink: 0 }} />
        <span>
          {revLoading ? 'Resolving street address…' : preview.street ? `${preview.street}${preview.area ? `, ${preview.area}` : ''} (${preview.latitude}, ${preview.longitude})` : `Pinned: ${preview.latitude}, ${preview.longitude}`}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid var(--ws-border, #CBD5E1)',
            background: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#65776B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <X size={15} /> Type Manually
        </button>
        <button
          type="button"
          onClick={() => onConfirm(buildComponents())}
          style={{
            flex: 2,
            padding: '10px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #163D2B 0%, #2D6A4F 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(22, 61, 43, 0.2)'
          }}
        >
          <Check size={15} /> Confirm Pin & Autofill
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
