import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const InventoryManagerPage = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Saffron Basmati Rice (Daawat Gold)', category: 'Grains & Rice', stock: 45, unit: 'kg', threshold: 15, status: 'IN_STOCK' },
    { id: 2, name: 'Wagyu Beef Minced (Prime A5)', category: 'Proteins', stock: 8, unit: 'kg', threshold: 10, status: 'LOW_STOCK' },
    { id: 3, name: 'Charcoal Activated Brioche Buns', category: 'Bakery', stock: 120, unit: 'pcs', threshold: 40, status: 'IN_STOCK' },
    { id: 4, name: 'Aged Cheddar Slices (Block)', category: 'Dairy', stock: 25, unit: 'kg', threshold: 10, status: 'IN_STOCK' },
    { id: 5, name: 'Fresh Truffle Oil (Italian Export)', category: 'Oils & Sauces', stock: 2, unit: 'ltr', threshold: 3, status: 'LOW_STOCK' },
    { id: 6, name: 'Biryani Special Clay Pots (1kg)', category: 'Packaging', stock: 0, unit: 'pcs', threshold: 50, status: 'OUT_OF_STOCK' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const toggleStock = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'OUT_OF_STOCK' ? 'IN_STOCK' : 'OUT_OF_STOCK';
        setStatusMsg(`${item.name} marked as ${nextStatus}!`);
        setTimeout(() => setStatusMsg(''), 2500);
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const filteredItems = items.filter(it => 
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    it.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            Kitchen Raw Inventory & Stock Management
          </h1>
          <div style={{ fontSize: '0.82rem', color: '#A7F3D0', marginTop: '2px' }}>
            Live tracking of raw ingredients, low-stock threshold triggers, and packaging supplies
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#6EE7B7" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search ingredient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                border: '1px solid rgba(74, 222, 128, 0.2)',
                background: 'var(--ws-surface)',
                color: '#FFFFFF',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: '#064E3B', color: '#6EE7B7', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
          {statusMsg}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--ws-surface-subtle)', borderBottom: '1px solid var(--ws-border)', color: '#A7F3D0' }}>
              <th style={{ padding: '14px 20px', fontWeight: 800 }}>Ingredient / Item</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Category</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Current Stock</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Alert Threshold</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 20px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--ws-border)', color: '#FFFFFF' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700 }}>{item.name}</td>
                <td style={{ padding: '14px 16px', color: '#A7F3D0' }}>{item.category}</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: '0.95rem' }}>
                  {item.stock} {item.unit}
                </td>
                <td style={{ padding: '14px 16px', color: '#6EE7B7' }}>
                  {item.threshold} {item.unit}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: item.status === 'IN_STOCK' ? 'rgba(34, 197, 94, 0.15)' : item.status === 'LOW_STOCK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: item.status === 'IN_STOCK' ? '#4ADE80' : item.status === 'LOW_STOCK' ? '#FBBF24' : '#F87171'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => toggleStock(item.id)}
                    style={{
                      background: item.status === 'OUT_OF_STOCK' ? '#22C55E' : 'rgba(239, 68, 68, 0.2)',
                      color: item.status === 'OUT_OF_STOCK' ? '#FFFFFF' : '#F87171',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {item.status === 'OUT_OF_STOCK' ? 'Mark In Stock' : 'Mark Out of Stock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
