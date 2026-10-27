import React, { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import {
  fetchAdminCalls,
  transitionAdminCall
} from '../services/api.js';

const NEXT = {
  REQUESTED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['CALLING', 'CANCELLED', 'REQUESTED'],
  CALLING: ['COMPLETED', 'FAILED', 'ASSIGNED'],
  FAILED: ['REQUESTED', 'ASSIGNED'],
  COMPLETED: [],
  CANCELLED: ['REQUESTED']
};

/** Admin callback queue: assign, progress, and record manual call outcomes. */
export const AdminCallQueue = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);
  const [outcome, setOutcome] = useState({});
  const [notes, setNotes] = useState({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await fetchAdminCalls(params);
      setCalls(res?.calls || []);
    } catch (err) {
      setError(err?.message || 'Failed to load call requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const act = async (id, next, extra = {}) => {
    setBusyId(id);
    try {
      await transitionAdminCall(id, { status: next, ...extra });
      await load();
    } catch (err) {
      setError(err?.message || 'Transition failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', border: '2.5px solid #241A17', borderRadius: '18px', padding: '20px', boxShadow: '0 4px 0 #241A17' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={18} /> Callback Requests
        </h3>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
          {['ALL', 'REQUESTED', 'ASSIGNED', 'CALLING', 'COMPLETED', 'CANCELLED', 'FAILED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading && <div style={{ color: '#6E6259' }}>Loading…</div>}
      {error && <div style={{ color: '#B91C1C', fontWeight: 700 }}>{error}</div>}
      {!loading && !error && calls.length === 0 && (
        <div style={{ color: '#6E6259' }}>No callback requests.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {calls.map(c => (
          <div key={c.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>{c.request_number}</strong> · {c.topic} · {c.priority} · <strong>{c.status}</strong>
                <div style={{ color: '#6E6259' }}>{c.requester_email} · {c.phone} · {c.subject}</div>
                {c.outcome ? <div>Outcome: {c.outcome}{c.outcome_notes ? ` — ${c.outcome_notes}` : ''}</div> : null}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(NEXT[c.status] || []).map(ns => (
                  <span key={ns} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                    {ns === 'COMPLETED' && (
                      <>
                        <select value={outcome[c.id] || 'RESOLVED'}
                          onChange={e => setOutcome(p => ({ ...p, [c.id]: e.target.value }))}
                          style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                          {['RESOLVED', 'REACHED', 'NO_ANSWER', 'CALLBACK_LATER', 'UNRESOLVABLE'].map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                        <input value={notes[c.id] || ''} placeholder="Outcome notes"
                          onChange={e => setNotes(p => ({ ...p, [c.id]: e.target.value }))}
                          style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', width: '130px' }} />
                      </>
                    )}
                    <button type="button" disabled={busyId === c.id}
                      onClick={() => act(c.id, ns, ns === 'COMPLETED'
                        ? { outcome: outcome[c.id] || 'RESOLVED', outcome_notes: notes[c.id] || '' } : {})}
                      style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#241A17', color: '#fff', fontWeight: 700, cursor: busyId === c.id ? 'wait' : 'pointer' }}>
                      {ns}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
