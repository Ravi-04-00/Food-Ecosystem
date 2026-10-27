import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X, Check, AlertCircle, Loader } from 'lucide-react';

// Fix default marker icons for bundlers
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

/**
 * Keyless location picker (Leaflet + OpenStreetMap tiles, Nominatim search).
 * Search/reverse-geocode: https://nominatim.openstreetmap.org (usage policy:
 * single debounced requests + "© OpenStreetMap contributors" attribution).
 * Nothing is "confirmed" until the user presses Confirm Location; every
 * field stays manually editable in the parent form afterwards.
 */
export const LocationPicker = ({ initialLat, initialLng, onConfirm, onCancel }) => {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerObj = useRef(null);
  const [pos, setPos] = useState({
    lat: Number(initialLat) || 12.9716,
    lng: Number(initialLng) || 77.5946
  });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [revAddress, setRevAddress] = useState(null);
  const [revLoading, setRevLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const revDebounceRef = useRef(null);

  // Init map once
  useEffect(() => {
    if (mapObj.current || !mapRef.current) return;
    const map = L.map(mapRef.current).setView([pos.lat, pos.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const marker = L.marker([pos.lat, pos.lng], { icon: DefaultIcon, draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      setPos({ lat: ll.lat, lng: ll.lng });
      reverseGeocode(ll.lat, ll.lng);
    });
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setPos({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    mapObj.current = map;
    markerObj.current = marker;
    reverseGeocode(pos.lat, pos.lng);
    return () => {
      map.remove();
      mapObj.current = null;
      markerObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = (lat, lng) => {
    if (revDebounceRef.current) clearTimeout(revDebounceRef.current);
    revDebounceRef.current = setTimeout(async () => {
      setRevLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) throw new Error(`Geocoding failed (HTTP ${res.status})`);
        const data = await res.json();
        setRevAddress(data?.address || null);
        setError('');
      } catch {
        setRevAddress(null);
        setError('Could not resolve this point to an address (network error). You can still confirm coordinates and type the address manually.');
      } finally {
        setRevLoading(false);
      }
    }, 500);
  };

  const runSearch = async (text) => {
    const q = (text || '').trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`Search failed (HTTP ${res.status})`);
      setResults(await res.json());
    } catch {
      setError('Place search failed (network error). Try manual entry below.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onQueryChange = (v) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 600);
  };

  const pickResult = (r) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    setPos({ lat, lng });
    if (mapObj.current && markerObj.current) {
      mapObj.current.setView([lat, lng], 16);
      markerObj.current.setLatLng([lat, lng]);
    }
    setRevAddress(r.address || null);
    setResults([]);
    setQuery(r.display_name || '');
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser. Enter the address manually.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords;
        setPos({ lat: latitude, lng: longitude });
        if (mapObj.current && markerObj.current) {
          mapObj.current.setView([latitude, longitude], 16);
          markerObj.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      (geoErr) => {
        setLocating(false);
        if (geoErr?.code === 1) {
          setError('Location permission denied. Allow location access in the browser, or enter the address manually.');
        } else if (geoErr?.code === 2) {
          setError('GPS position unavailable right now. Try again or enter the address manually.');
        } else if (geoErr?.code === 3) {
          setError('Location request timed out. Try again or enter the address manually.');
        } else {
          setError('Could not get your location. Enter the address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const buildComponents = () => {
    const a = revAddress || {};
    const road = [a.house_number, a.road].filter(Boolean).join(' ');
    return {
      latitude: Number(pos.lat.toFixed(6)),
      longitude: Number(pos.lng.toFixed(6)),
      street: road || '',
      area: a.suburb || a.neighbourhood || a.hamlet || '',
      city: a.city || a.town || a.village || a.county || '',
      state: a.state || '',
      pincode: a.postcode || '',
      confirmed: true
    };
  };

  const preview = buildComponents();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#7A808C' }} />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search area, street, landmark…"
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '10px', border: '1px solid var(--ws-border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
          {searching && <span style={{ position: 'absolute', right: '10px', top: '11px' }}><Loader size={14} /></span>}
          {results.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 500, left: 0, right: 0, top: '40px', background: '#fff', border: '1px solid var(--ws-border)', borderRadius: '10px', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
              {results.map(r => (
                <button
                  key={`${r.place_id}`}
                  type="button"
                  onClick={() => pickResult(r)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: '0.78rem', cursor: 'pointer' }}
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
          style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#15803D', fontWeight: 700, fontSize: '0.8rem', cursor: locating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Navigation size={14} /> {locating ? 'Locating…' : 'Use My Current Location'}
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#B91C1C', fontSize: '0.8rem' }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> <span>{error}</span>
        </div>
      )}

      <div ref={mapRef} style={{ height: '260px', borderRadius: '14px', border: '1px solid var(--ws-border)', overflow: 'hidden', background: '#eef2ee' }} />
      <div style={{ fontSize: '0.72rem', color: '#7A808C' }}>
        Drag the marker or tap the map. Map © OpenStreetMap contributors.
        {revLoading ? ' Resolving address…' : preview.street ? ` ${preview.street}${preview.area ? `, ${preview.area}` : ''}` : ''}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--ws-border)', background: 'var(--ws-surface)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <X size={15} /> Manual Entry Instead
        </button>
        <button
          type="button"
          onClick={() => onConfirm(buildComponents())}
          style={{ flex: 2, padding: '10px', borderRadius: '12px', border: 'none', background: 'var(--ws-primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Check size={15} /> Confirm Location
        </button>
      </div>
    </div>
  );
};
