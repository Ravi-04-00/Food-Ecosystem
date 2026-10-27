import React, { useState } from 'react';
import { Store, Bike, MapPin, CheckCircle2, Phone, ShieldCheck, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

export const LiveControlMap = ({ height = '500px' }) => {
  const { activeOrders, setInspectedOrder } = useAdmin();

  // Selected Order for Inspector
  const [selectedOrder, setSelectedOrder] = useState({
    id: 'WS10245',
    customer: 'Ravi',
    restaurant: 'Burger House',
    rider: 'Arun',
    payment: '₹457 — Paid',
    status: 'On the Way',
    eta: '18 min'
  });

  const restaurants = [
    { id: 1, name: 'Burger House', x: 25, y: 35, cuisine: 'Burgers' },
    { id: 2, name: 'Kinetic Biryani Vault', x: 65, y: 25, cuisine: 'Biryani' },
    { id: 3, name: 'Neo Tokyo Noodle', x: 75, y: 70, cuisine: 'Noodles' }
  ];

  const deliveryPartners = [
    { id: 1, name: 'Arun', x: 38, y: 48, status: 'On the Way' },
    { id: 2, name: 'Kaelen Vance', x: 60, y: 40, status: 'At Kitchen' },
    { id: 3, name: 'Zoya Khan', x: 80, y: 60, status: 'Delivering' }
  ];

  const customerLocations = [
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
      {/* SVG Map Base (Clean Street Layout) */}
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

        {/* Active Route Polyline connecting Burger House -> Arun -> Ravi */}
        <path
          d="M 250 180 Q 380 240 500 310"
          stroke="#4D9DE0"
          strokeWidth="6"
          strokeDasharray="8 6"
          fill="none"
        />
      </svg>

      {/* 1. Restaurants Pins */}
      {restaurants.map(r => (
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

      {/* 2. Delivery Partner Pins */}
      {deliveryPartners.map(d => (
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

      {/* 3. Customer Delivery Locations */}
      {customerLocations.map(c => (
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
            customer: 'Ravi',
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

      {/* Floating Selected Order Card Inspector */}
      {selectedOrder && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: '#FFFFFF',
          border: '3px solid #241A17',
          borderRadius: '18px',
          padding: '18px 20px',
          boxShadow: '0 8px 20px rgba(36, 26, 23, 0.2)',
          maxWidth: '340px',
          width: '100%',
          zIndex: 30
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #EADBCE', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontWeight: 900, fontSize: '1rem', color: '#241A17' }}>
              Order #{selectedOrder.id}
            </span>
            <span style={{
              background: '#EAF5E7',
              color: '#5C9E4A',
              border: '1px solid #5C9E4A',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.72rem'
            }}>
              {selectedOrder.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
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
              <strong style={{ color: '#4D9DE0' }}>{selectedOrder.rider}</strong>
            </div>

            <div>
              <span style={{ color: '#6E6259' }}>Payment: </span>
              <strong style={{ color: '#5C9E4A' }}>{selectedOrder.payment}</strong>
            </div>

            <div>
              <span style={{ color: '#6E6259' }}>ETA: </span>
              <strong style={{ color: '#F45B32' }}>{selectedOrder.eta}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: '#FFFFFF',
        border: '2px solid #241A17',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        gap: '12px',
        fontSize: '0.75rem',
        fontWeight: 800,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}>
        <span>🏪 Restaurants</span>
        <span>🛵 Couriers</span>
        <span>📍 Customers</span>
      </div>

    </div>
  );
};
