import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Layers, 
  Plus, 
  Minus, 
  Bike, 
  Store, 
  Home, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Search
} from 'lucide-react';

export const GoogleMapMock = ({
  height = '420px',
  mode = 'tracking', // 'tracking' | 'picker' | 'admin' | 'rider_nav'
  restaurant = { name: 'WS Dum Biryani House', lat: 12.9716, lng: 77.5946 },
  customer = { address: '12th Main, Indiranagar', lat: 12.9785, lng: 77.6405 },
  rider = { name: 'Rahul Kumar', status: 'On the way', speed: '32 km/h' },
  status = 'on_the_way',
  onLocationSelect = null,
  className = ''
}) => {
  const [zoom, setZoom] = useState(14);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite' | 'traffic'
  const [riderProgress, setRiderProgress] = useState(mode === 'tracking' ? 0.65 : 0.2);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(customer.address);

  // Smooth live rider motion along the route
  useEffect(() => {
    if (status !== 'on_the_way' && mode !== 'rider_nav' && mode !== 'tracking') return;
    const interval = setInterval(() => {
      setRiderProgress((prev) => {
        if (prev >= 0.95) return 0.2; // loop for demo
        return prev + 0.015;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [status, mode]);

  // Interpolated Rider Position along a Bezier path
  // SVG coordinates: Restaurant at (140, 320), Customer at (580, 110)
  const p0 = { x: 140, y: 320 }; // Restaurant
  const p1 = { x: 320, y: 380 }; // Waypoint 1 (traffic junction)
  const p2 = { x: 420, y: 180 }; // Waypoint 2
  const p3 = { x: 580, y: 110 }; // Customer Home

  // Cubic Bezier position
  const t = Math.min(Math.max(riderProgress, 0), 1);
  const riderX =
    Math.pow(1 - t, 3) * p0.x +
    3 * Math.pow(1 - t, 2) * t * p1.x +
    3 * (1 - t) * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x;
  const riderY =
    Math.pow(1 - t, 3) * p0.y +
    3 * Math.pow(1 - t, 2) * t * p1.y +
    3 * (1 - t) * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y;

  const handleUseCurrentLocation = () => {
    setSelectedAddress('Flat 302, Palm Springs, Indiranagar, Bengaluru - 560038');
    if (onLocationSelect) {
      onLocationSelect({
        address: 'Flat 302, Palm Springs, Indiranagar, Bengaluru - 560038',
        lat: 12.9754,
        lng: 77.6322,
        city: 'Bengaluru',
        pincode: '560038'
      });
    }
  };

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden border border-[#EFE8DE] shadow-xl select-none ${className}`}
      style={{ height }}
    >
      {/* SVG Canvas Map Simulation */}
      <svg 
        viewBox="0 0 700 450" 
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{
          background: mapType === 'satellite' ? '#1D2A1F' : '#F6F5F0',
        }}
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="70%" stopColor="#20B26B" />
            <stop offset="100%" stopColor="#20B26B" />
          </linearGradient>
          <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Map Background Blocks / Parks / Water */}
        {mapType !== 'satellite' ? (
          <g opacity="0.85">
            {/* Cubbon Green Park */}
            <path d="M 40 40 Q 180 30 220 120 Q 200 240 80 220 Z" fill="#E2F1E5" />
            <text x="110" y="120" fill="#20B26B" fontSize="11" fontWeight="700" letterSpacing="1">INDIRANAGAR PARK</text>

            {/* Lake / Water Body */}
            <path d="M 460 300 Q 580 270 640 360 Q 560 440 440 400 Z" fill="#D6EAF8" />
            <text x="500" y="360" fill="#2980B9" fontSize="10" fontWeight="700">ULSOOR LAKE BASIN</text>

            {/* Urban Block Grids */}
            <rect x="250" y="60" width="130" height="90" rx="8" fill="#ECE9DF" />
            <rect x="250" y="170" width="120" height="80" rx="8" fill="#ECE9DF" />
            <rect x="390" y="240" width="90" height="90" rx="8" fill="#ECE9DF" />
            <rect x="70" y="260" width="100" height="80" rx="8" fill="#ECE9DF" />
            <rect x="420" y="50" width="120" height="90" rx="8" fill="#ECE9DF" />

            {/* Secondary Gray Roads */}
            <path d="M 0 160 L 700 160" stroke="#DFDBD0" strokeWidth="12" />
            <path d="M 0 280 L 700 280" stroke="#DFDBD0" strokeWidth="12" />
            <path d="M 230 0 L 230 450" stroke="#DFDBD0" strokeWidth="12" />
            <path d="M 400 0 L 400 450" stroke="#DFDBD0" strokeWidth="14" />
            <path d="M 560 0 L 560 450" stroke="#DFDBD0" strokeWidth="10" />

            {/* Main Highways (Yellow/Orange roads) */}
            <path d="M 0 100 Q 300 130 700 80" stroke="#FDE8C7" strokeWidth="16" />
            <path d="M 120 450 Q 350 250 650 30" stroke="#FDE8C7" strokeWidth="16" />
          </g>
        ) : (
          <g opacity="0.6">
            <rect x="0" y="0" width="700" height="450" fill="#1B261D" />
            <path d="M 0 160 L 700 160" stroke="#4A554A" strokeWidth="8" />
            <path d="M 230 0 L 230 450" stroke="#4A554A" strokeWidth="8" />
            <path d="M 400 0 L 400 450" stroke="#5C665C" strokeWidth="10" />
          </g>
        )}

        {/* Live Traffic Overlay */}
        {mapType === 'traffic' && (
          <g opacity="0.9">
            <path d="M 0 160 L 230 160" stroke="#20B26B" strokeWidth="4" />
            <path d="M 230 160 L 400 160" stroke="#FFC857" strokeWidth="4" />
            <path d="M 400 160 L 700 160" stroke="#20B26B" strokeWidth="4" />
            <path d="M 400 0 L 400 200" stroke="#FF3B30" strokeWidth="4" strokeDasharray="6,4" />
          </g>
        )}

        {/* Route Path (Cubic Bezier Delivery Route) */}
        <path
          d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
          stroke="url(#routeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#shadowFilter)"
        />

        {/* Animated Dash Wave along Route */}
        <path
          d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeDasharray="8 8"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* 1. RESTAURANT PIN (Start) */}
        <g transform={`translate(${p0.x}, ${p0.y})`} filter="url(#shadowFilter)">
          <circle cx="0" cy="0" r="16" fill="#FF6B35" />
          <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
          <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FF6B35">🍽️</text>
          {/* Label Card */}
          <rect x="-65" y="-42" width="130" height="26" rx="6" fill="#171717" opacity="0.9" />
          <text x="0" y="-25" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="700">
            {restaurant.name.length > 18 ? restaurant.name.slice(0, 16) + '...' : restaurant.name}
          </text>
        </g>

        {/* 2. CUSTOMER PIN (Destination) */}
        <g transform={`translate(${p3.x}, ${p3.y})`} filter="url(#shadowFilter)">
          {/* Pulse wave ring */}
          <circle cx="0" cy="0" r="24" fill="#20B26B" opacity="0.25">
            <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="15" fill="#20B26B" />
          <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
          <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#20B26B">🏠</text>
          {/* Label Card */}
          <rect x="-60" y="-40" width="120" height="24" rx="6" fill="#FFFFFF" stroke="#EFE8DE" strokeWidth="1" />
          <text x="0" y="-24" textAnchor="middle" fill="#171717" fontSize="9" fontWeight="700">
            Delivery Location
          </text>
        </g>

        {/* 3. MOVING RIDER MARKER (Current GPS) */}
        {(mode === 'tracking' || mode === 'rider_nav' || mode === 'admin') && (
          <g transform={`translate(${riderX}, ${riderY})`} filter="url(#shadowFilter)">
            {/* Radar wave */}
            <circle cx="0" cy="0" r="22" fill="#FF6B35" opacity="0.25">
              <animate attributeName="r" values="14;26;14" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Scooter Badge */}
            <circle cx="0" cy="0" r="15" fill="#FF6B35" stroke="#FFFFFF" strokeWidth="2.5" />
            <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#FFFFFF">🛵</text>
            
            {/* Rider Info Pill */}
            <rect x="-55" y="20" width="110" height="22" rx="11" fill="#FFFFFF" stroke="#FF6B35" strokeWidth="1.5" />
            <text x="0" y="34" textAnchor="middle" fill="#FF6B35" fontSize="8.5" fontWeight="bold">
              {rider.name} • {Math.round((1 - t) * 18 + 4)}m ETA
            </text>
          </g>
        )}
      </svg>

      {/* Top Floating Header & Location Search / Live ETA Pill */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
        {mode === 'picker' ? (
          <div className="flex-1 max-w-md bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-[#EFE8DE] flex items-center gap-3 pointer-events-auto">
            <Search className="w-4 h-4 text-[#FF6B35]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apartment, road or landmark..."
              className="w-full text-xs font-semibold text-[#171717] bg-transparent outline-none"
            />
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-[#EFE8DE] flex items-center space-x-3 pointer-events-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-[#20B26B] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F7378]">Live Google Maps</span>
              <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                {Math.round((1 - t) * 18 + 4)} mins away • 2.4 km
              </span>
            </div>
          </div>
        )}

        {/* Map Type Switches */}
        <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-[#EFE8DE] pointer-events-auto">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all ${
              mapType === 'roadmap' ? 'bg-[#FF6B35] text-white' : 'text-[#6F7378] hover:text-[#171717]'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all ${
              mapType === 'satellite' ? 'bg-[#FF6B35] text-white' : 'text-[#6F7378] hover:text-[#171717]'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapType('traffic')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all ${
              mapType === 'traffic' ? 'bg-[#FF6B35] text-white' : 'text-[#6F7378] hover:text-[#171717]'
            }`}
          >
            Traffic
          </button>
        </div>
      </div>

      {/* Bottom Floating Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => setZoom((z) => Math.min(z + 1, 18))}
          className="w-9 h-9 bg-white text-[#171717] hover:bg-[#FFF8EE] hover:text-[#FF6B35] rounded-xl shadow-md border border-[#EFE8DE] flex items-center justify-center transition-all"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 1, 10))}
          className="w-9 h-9 bg-white text-[#171717] hover:bg-[#FFF8EE] hover:text-[#FF6B35] rounded-xl shadow-md border border-[#EFE8DE] flex items-center justify-center transition-all"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleUseCurrentLocation}
          className="w-9 h-9 bg-white text-[#20B26B] hover:bg-[#EBF8F1] rounded-xl shadow-md border border-[#EFE8DE] flex items-center justify-center transition-all"
          title="Locate Current GPS"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Pin Info (for Address Picker mode) */}
      {mode === 'picker' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-[#EFE8DE] max-w-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
            <div className="text-xs font-semibold text-[#171717] truncate">
              {selectedAddress}
            </div>
          </div>
        </div>
      )}

      {/* Google Attribution Watermark */}
      <div className="absolute bottom-1 left-2 pointer-events-none opacity-60 flex items-center space-x-1">
        <span className="text-[10px] font-bold text-gray-500">Google</span>
        <span className="text-[8px] text-gray-400">Map data ©2026</span>
      </div>
    </div>
  );
};

export default GoogleMapMock;
