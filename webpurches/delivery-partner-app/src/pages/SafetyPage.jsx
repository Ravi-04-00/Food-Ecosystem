import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  Share2, 
  AlertTriangle, 
  HeartHandshake, 
  MapPin, 
  HelpCircle,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { SOSDispatchModal } from '../components/modals/SOSDispatchModal.jsx';

export const SafetyPage = () => {
  const { triggerSOS, showToast } = useDelivery();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [rideModeActive, setRideModeActive] = useState(true);

  const emergencyContacts = [
    { name: 'Priya Kumar (Spouse)', relationship: 'Primary ICE', phone: '+91 98450 11223' },
    { name: 'Kavitha R. (Family)', relationship: 'Secondary ICE', phone: '+91 94480 99441' }
  ];

  const handleShareTrip = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('https://track.wsfood.com/live/DP-84920-SEC');
      showToast('Encrypted live telemetry trip link copied to clipboard!', 'success');
    } else {
      showToast('Live link: https://track.wsfood.com/live/DP-84920-SEC', 'info');
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#DC2626', letterSpacing: '0.5px' }}>
            RIDER PROTECTION SUITE
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Safety Command Center
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          24/7 rapid security dispatch, crash response protocols, and telemetry sharing.
        </div>
      </div>

      {/* Emergency SOS Master Trigger */}
      <div style={{
        backgroundColor: '#FEF2F2',
        border: '1.5px solid #FECACA',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 4px 18px rgba(239, 68, 68, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
            flexShrink: 0
          }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.4rem',
              fontWeight: 900,
              color: '#991B1B',
              margin: '0 0 4px'
            }}>
              Immediate SOS Emergency Dispatch
            </h2>
            <div style={{ fontSize: '0.82rem', color: '#B91C1C' }}>
              One tap transmits live GPS coordinates to Emergency Services (112) & 24/7 Safety Command.
            </div>
          </div>
        </div>

        <button
          onClick={() => setSosModalOpen(true)}
          type="button"
          style={{
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '14px 28px',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
          }}
        >
          TRIGGER EMERGENCY SOS
        </button>
      </div>

      {/* Road Safety & Minimal Distraction Ride Mode Toggle */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#FFF2EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF5A1F'
          }}>
            <Volume2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#191B1F' }}>
              Minimal-Distraction Ride Mode
            </div>
            <div style={{ fontSize: '0.78rem', color: '#525760' }}>
              Suppresses non-critical screen popups while vehicle speed &gt; 15 km/h. Audio voice cues enabled.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setRideModeActive(!rideModeActive);
            showToast(rideModeActive ? 'Ride Mode disabled.' : 'Ride Mode active. Distractions suppressed while moving.', 'info');
          }}
          type="button"
          className={rideModeActive ? "btn-primary-fresh" : "btn-secondary-fresh"}
          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
        >
          {rideModeActive ? '✓ MODE ACTIVE' : 'ENABLE RIDE MODE'}
        </button>
      </div>

      {/* Grid: Emergency ICE Contacts & Trip Sharing */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '20px'
      }}>
        {/* ICE Contacts */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#191B1F',
              margin: 0
            }}>
              Emergency ICE Contacts
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#FF5A1F', fontWeight: 800 }}>
              Auto-Alerted on SOS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {emergencyContacts.map((contact, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #EDE8DE',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#191B1F' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#7A808C' }}>
                    {contact.relationship} • {contact.phone}
                  </div>
                </div>

                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EDE8DE',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    color: '#191B1F',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PhoneCall size={13} />
                  <span>Call</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Live Trip Sharing */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
        }}>
          <div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#191B1F',
              margin: '0 0 6px'
            }}>
              Real-Time Trip Sharing
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#525760', margin: 0, lineHeight: 1.5 }}>
              Share an encrypted, live-updating URL with your family so they can track your location, active corridor, and shift progress in real-time.
            </p>
          </div>

          <button
            onClick={handleShareTrip}
            type="button"
            className="btn-secondary-fresh"
            style={{ width: '100%', padding: '12px', fontSize: '0.86rem' }}
          >
            <Share2 size={16} />
            <span>SHARE LIVE TRACKING LINK</span>
          </button>
        </div>
      </div>

      {/* SOS Modal */}
      <SOSDispatchModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </div>
  );
};
