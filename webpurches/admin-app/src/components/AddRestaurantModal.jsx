import React, { useState } from 'react';
import { createAdminRestaurant } from '../services/api.js';

/** Admin manual restaurant creation (owner + restaurant, duplicates blocked server-side). */
export const AddRestaurantModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '', owner_name: '', email: '', phone: '',
    password: '', address: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await createAdminRestaurant(form);
      setForm({ name: '', owner_name: '', email: '', phone: '', password: '', address: '' });
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      setError(err?.message || 'Creation failed.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', extra = {}) => (
    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
      {label}
      <input type={type} value={form[key]} onChange={set(key)} {...extra}
        style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--ws-border)', boxSizing: 'border-box' }} />
    </label>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--ws-surface)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 4px 0' }}>Add Restaurant</h3>
        <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', marginBottom: '14px' }}>
          Creates the owner account + PENDING restaurant. Verify it afterwards from the queue.
        </div>
        {error && <div style={{ color: '#B91C1C', fontWeight: 700, marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {field('Restaurant name *', 'name')}
          {field('Owner name *', 'owner_name')}
          {field('Owner email *', 'email', 'email')}
          {field('Owner phone *', 'phone', 'tel')}
          {field('Initial password * (min 8 chars)', 'password', 'password')}
          {field('Outlet address', 'address')}
          <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1', marginTop: '6px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={saving} className="fd-btn fd-btn-primary">
              {saving ? 'Creating…' : 'Create Restaurant'}
            </button>
            <button type="button" onClick={onClose} className="fd-btn fd-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
