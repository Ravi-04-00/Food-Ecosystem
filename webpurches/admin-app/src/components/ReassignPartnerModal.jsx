import React, { useEffect, useState } from 'react';
import {
  fetchAdminEligiblePartners,
  reassignAdminDispatch,
  fetchAdminOrderDetail
} from '../services/api.js';

/** Admin reassignment modal: eligible partners, reason, handover, confirm. */
export const ReassignPartnerModal = ({ order, assignment, onClose, onDone }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [handover, setHandover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminEligiblePartners()
      .then(data => setPartners(Array.isArray(data) ? data : (data?.partners || [])))
      .catch(err => setError(err?.message || 'Failed to load partners'))
      .finally(() => setLoading(false));
  }, []);

  const pickedUp = assignment?.status === 'PICKED_UP';

  if (!assignment) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: '#10141B', borderRadius: '16px', padding: '22px', maxWidth: '440px', color: '#E8EBEF' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Reassign Delivery Partner</h3>
          <div style={{ fontSize: '0.85rem', color: '#8B929D' }}>
            This order has no active delivery assignment. Use the Dispatch page to assign a partner first.
          </div>
          <button type="button" onClick={onClose}
            style={{ marginTop: '14px', padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#E8EBEF', fontWeight: 700, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!partnerId) {
      setError('Select an eligible delivery partner.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('A reassignment reason (min 3 chars) is required.');
      return;
    }
    if (pickedUp && !handover) {
      setError('Food is picked up: confirm safe handover first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reassignAdminDispatch(assignment.id, Number(partnerId), reason.trim(), handover);
      const fresh = await fetchAdminOrderDetail(order.id);
      if (onDone) onDone(fresh);
      onClose();
    } catch (err) {
      setError(err?.message || 'Reassignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#10141B', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '22px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', color: '#E8EBEF' }}>
        <h3 style={{ margin: '0 0 4px 0' }}>Reassign Delivery Partner</h3>
        <div style={{ fontSize: '0.8rem', color: '#8B929D', marginBottom: '14px' }}>
          Order {order?.order_number} · Current: {order?.rider || 'Unassigned'} · Assignment: {assignment?.status || 'none'}
        </div>
        {error && <div style={{ color: '#FF4F64', fontWeight: 700, marginBottom: '10px' }}>{error}</div>}
        {loading && <div>Loading eligible partners…</div>}
        {!loading && partners.length === 0 && (
          <div style={{ color: '#8B929D' }}>No eligible partners available right now.</div>
        )}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
            Eligible partner *
            <select value={partnerId} onChange={e => setPartnerId(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', boxSizing: 'border-box' }}>
              <option value="">Select…</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.username} · {p.vehicle_type} · {p.is_online ? 'online' : 'offline'} · {p.active_orders_count} active
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
            Reason * (min 3 chars)
            <input value={reason} onChange={e => setReason(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', boxSizing: 'border-box' }} />
          </label>
          <label style={{ fontSize: '0.8rem' }}>
            Notes (optional)
            <input value={notes} onChange={e => setNotes(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', boxSizing: 'border-box' }} />
          </label>
          {pickedUp && (
            <label style={{ fontSize: '0.82rem', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#FFD23F' }}>
              <input type="checkbox" checked={handover} onChange={e => setHandover(e.target.checked)} style={{ marginTop: '3px' }} />
              <span>Safe handover confirmed: the new partner takes responsibility for picked-up food.</span>
            </label>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="submit" disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#24D9FF', color: '#08090D', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' }}>
              {submitting ? 'Reassigning…' : 'Confirm Reassign'}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#E8EBEF', fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
