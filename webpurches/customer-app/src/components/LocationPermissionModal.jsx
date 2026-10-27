import React, { useState } from 'react';
import { MapPin, Navigation, Search, CheckCircle2, X } from 'lucide-react';

export const LocationPermissionModal = ({ isOpen, onClose, onSelectAddress }) => {
  const [manualMode, setManualMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, label: 'Home', address: 'Plot 42, Anna Nagar West, Chennai, Tamil Nadu' },
    { id: 2, label: 'Office', address: 'Tidel Park, Rajiv Gandhi Salai, Taramani, Chennai' },
    { id: 3, label: 'Friend’s Pod', address: 'Indiranagar 100ft Road, Sector 4, Bangalore' }
  ]);

  if (!isOpen) return null;

  const handleAllowGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSelectAddress({
            label: 'Current Location',
            address: 'Anna Salai, Teynampet, Chennai 600018',
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          onClose();
        },
        () => {
          // Fallback if denied
          setManualMode(true);
        }
      );
    } else {
      setManualMode(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(36, 26, 23, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '3px solid #241A17',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 12px 36px rgba(36, 26, 23, 0.2)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Top Header */}
        <div style={{
          background: '#FFF8E8',
          borderBottom: '2px solid #EADBCE',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#F45B32',
              color: '#FFF',
              borderRadius: '10px',
              padding: '6px',
              display: 'flex',
              border: '1.5px solid #241A17'
            }}>
              <MapPin size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#241A17', margin: 0 }}>
              {manualMode ? 'Select Delivery Address' : 'Enable Location'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #241A17',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={18} color="#241A17" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {!manualMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={{ fontSize: '0.92rem', color: '#6E6259', lineHeight: 1.5, margin: 0 }}>
                Fast Delivery uses your location to ensure fresh, on-time delivery:
              </p>

              <div style={{
                background: '#FFF8E8',
                borderRadius: '14px',
                border: '1.5px solid #EADBCE',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {[
                  'Find nearby fresh food kitchens & restaurants',
                  'Calculate accurate delivery distance & fees',
                  'Show precise live delivery ETA',
                  'Provide real-time map route tracking'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#241A17' }}>
                    <CheckCircle2 size={16} color="#5C9E4A" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={handleAllowGPS}
                  style={{
                    background: '#F45B32',
                    color: '#FFFFFF',
                    border: '2px solid #241A17',
                    boxShadow: '0 3px 0 #241A17',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Navigation size={18} />
                  <span>Allow Location</span>
                </button>

                <button
                  onClick={() => setManualMode(true)}
                  style={{
                    background: '#FFFFFF',
                    color: '#241A17',
                    border: '2px solid #241A17',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Enter Address Manually
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFF8E8',
                border: '1.5px solid #241A17',
                borderRadius: '12px',
                padding: '10px 14px'
              }}>
                <Search size={18} color="#6E6259" />
                <input
                  type="text"
                  placeholder="Search street, area, or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.88rem',
                    color: '#241A17',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: '#6E6259', fontWeight: 700, textTransform: 'uppercase' }}>
                Saved Locations
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedAddresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      onSelectAddress(addr);
                      onClose();
                    }}
                    style={{
                      border: '1.5px solid #EADBCE',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F45B32'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#EADBCE'}
                  >
                    <div style={{ fontWeight: 800, color: '#241A17', fontSize: '0.9rem' }}>
                      📍 {addr.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6E6259', marginTop: '3px' }}>
                      {addr.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
