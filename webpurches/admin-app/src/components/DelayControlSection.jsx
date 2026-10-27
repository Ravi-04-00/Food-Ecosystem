import React, { useState } from 'react';
import { recordOrderDelay, fetchAdminOrderDetail } from '../services/api.js';

const REASONS = ['TRAFFIC', 'RESTAURANT_PREP', 'PARTNER_UNAVAILABLE', 'VEHICLE_ISSUE', 'WEATHER', 'CUSTOMER_ISSUE', 'OTHER'];

/** Admin delay control: record delay + ETA change (status untouched). */
export const DelayControlSection = ({ order, onUpdated }) => {
  const [delayType, setDelayType] = useState('KITCHEN');
  const [reason, setReason] = useState('RESTAURANT_PREP');
  const [notes, setNotes] = useState('');
  const [eta, setEta] = useState(order?.eta_minutes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (['DELIVERED', 'CANCELLED'].includes(order?.status)) return null;

  const submit = async (e) => {
    e.preventDefault();
    const etaNum = Number(eta);
    if (!Number.isInteger(etaNum) || etaNum < 0 || etaNum > 480) {
      setError('ETA must be a whole number between 0 and 480.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await recordOrderDelay(order.id, {
        delay_type: delayType, reason, notes: notes.trim(), new_eta_minutes: etaNum
      });
      const fresh = await fetchAdminOrderDetail(order.id);
      if (onUpdated) onUpdated(fresh);
      setNotes('');
    } catch (err) {
      setError(err?.message || 'Failed to record delay.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'rgba(255, 210, 63, 0.05)', border: '1px solid rgba(255, 210, 63, 0.25)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontSize: '0.72rem', color: '#FFD23F', fontWeight: 800, letterSpacing: '1px' }}>
        ORDER DELAY CONTROL · ETA {order?.eta_minutes ?? '?'}m
      </div>
      {error && <div style={{ color: '#FF4F64', fontWeight: 700, marginTop: '8px' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '10px' }}>
        <label style={{ fontSize: '0.76rem', color: '#E8EBEF' }}>Type
          <select value={delayType} onChange={e => setDelayType(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px', borderRadius: '8px' }}>
            <option value="KITCHEN">Restaurant prep</option>
            <option value="PARTNER">Delivery partner</option>
          </select>
        </label>
        <label style={{ fontSize: '0.76rem', color: '#E8EBEF' }}>Reason
          <select value={reason} onChange={e => setReason(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px', borderRadius: '8px' }}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '0.76rem', color: '#E8EBEF' }}>New ETA (min)
          <input type="number" min="0" max="480" value={eta} onChange={e => setEta(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px', borderRadius: '8px', boxSizing: 'border-box' }} />
        </label>
        <label style={{ fontSize: '0.76rem', color: '#E8EBEF' }}>Notes
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
            style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px', borderRadius: '8px', boxSizing: 'border-box' }} />
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#FFD23F', color: '#08090D', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Saving…' : 'Record Delay'}
          </button>
        </div>
      </form>
      {Array.isArray(order?.delay_history) && order.delay_history.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {order.delay_history.map(d => (
            <div key={d.id} style={{ fontSize: '0.76rem', color: '#E8EBEF' }}>
              {d.created_at ? new Date(d.created_at).toLocaleString() : ''} · {d.delay_type}/{d.reason} · ETA {d.previous_eta}→{d.new_eta}m · by {d.recorded_by}
              {d.notes ? ` · ${d.notes}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
