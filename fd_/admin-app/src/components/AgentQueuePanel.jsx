import React, { useEffect, useState } from 'react';
import {
  fetchAgentQueue,
  claimAgentTicket,
  replyAgentTicket,
  fetchAgentCalls
} from '../services/api.js';

/** Support-agent workbench: queue, claim, reply, call list. No admin APIs used. */
export const AgentQueuePanel = () => {
  const [queue, setQueue] = useState({ assigned_to_me: [], unassigned_pool: [] });
  const [calls, setCalls] = useState({ assigned_to_me: [], unassigned_pool: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [q, c] = await Promise.all([fetchAgentQueue(), fetchAgentCalls()]);
      setQueue(q);
      setCalls(c);
    } catch (err) {
      setError(err?.message || 'Agent queue unavailable (agents only).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doClaim = async (num) => {
    setBusy(num);
    try {
      await claimAgentTicket(num);
      await load();
    } catch (err) {
      setError(err?.message || 'Claim failed');
    } finally {
      setBusy(null);
    }
  };

  const doReply = async (num) => {
    const msg = (replyText[num] || '').trim();
    if (!msg) return;
    setBusy(num);
    try {
      await replyAgentTicket(num, msg);
      setReplyText(p => ({ ...p, [num]: '' }));
      await load();
    } catch (err) {
      setError(err?.message || 'Reply failed');
    } finally {
      setBusy(null);
    }
  };

  const row = (t, mine) => (
    <div key={t.ticket_number} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', fontSize: '0.82rem', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <strong>{t.ticket_number}</strong> · {t.subject} · {t.status} · {t.priority}
        </div>
        {!mine && (
          <button type="button" disabled={busy === t.ticket_number} onClick={() => doClaim(t.ticket_number)}
            style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#241A17', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Claim
          </button>
        )}
      </div>
      {mine && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input value={replyText[t.ticket_number] || ''} placeholder="Reply to customer…"
            onChange={e => setReplyText(p => ({ ...p, [t.ticket_number]: e.target.value }))}
            style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
          <button type="button" disabled={busy === t.ticket_number} onClick={() => doReply(t.ticket_number)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#15803D', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Send
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: '#FFFFFF', border: '2.5px solid #241A17', borderRadius: '18px', padding: '20px', boxShadow: '0 4px 0 #241A17' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 900 }}>Agent Workbench</h3>
      <div style={{ fontSize: '0.78rem', color: '#6E6259', marginBottom: '12px' }}>
        Queue access only — no admin powers. Claim from the pool, then reply.
      </div>
      {loading && <div style={{ color: '#6E6259' }}>Loading…</div>}
      {error && <div style={{ color: '#B91C1C', fontWeight: 700 }}>{error} <button type="button" onClick={load}>Retry</button></div>}
      {!loading && !error && (
        <>
          <h4>Assigned to me ({(queue.assigned_to_me || []).length})</h4>
          {(queue.assigned_to_me || []).map(t => row(t, true))}
          <h4>Unassigned pool ({(queue.unassigned_pool || []).length})</h4>
          {(queue.unassigned_pool || []).map(t => row(t, false))}
          <h4>Callback queue ({((calls.assigned_to_me || []).length + (calls.unassigned_pool || []).length)})</h4>
          {[...(calls.assigned_to_me || []), ...(calls.unassigned_pool || [])].map(c => (
            <div key={c.id} style={{ fontSize: '0.82rem', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <strong>{c.request_number}</strong> · {c.topic} · {c.status} · {c.phone}
            </div>
          ))}
        </>
      )}
    </div>
  );
};
