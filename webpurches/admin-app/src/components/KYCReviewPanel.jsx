import React, { useEffect, useState } from 'react';
import {
  fetchKYCDetail,
  approveKYC,
  rejectKYC,
  requestKYCInfo,
  downloadKYCDocumentAdmin
} from '../services/api.js';

/**
 * Admin KYC review panel: secure doc list + preview, approve/reject with
 * mandatory reason, audit handled server-side. Used by Fleet + Restaurant
 * manager detail modals. Documents are fetched as authenticated blobs —
 * never exposed via public URLs.
 */
export const KYCReviewPanel = ({ userId, onChanged }) => {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState('');

  const reload = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setKyc(await fetchKYCDetail(userId));
    } catch (err) {
      setError(err?.error || 'No KYC application found for this user.');
      setKyc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [userId]);

  const openDoc = async (doc) => {
    try {
      const blob = await downloadKYCDocumentAdmin(doc.id);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewName(doc.original_name || doc.doc_type);
    } catch {
      setError('Document preview not permitted.');
    }
  };

  const doApprove = async () => {
    setBusy(true);
    try {
      const out = await approveKYC(userId);
      setKyc(out);
      if (onChanged) onChanged(out);
    } catch (err) {
      setError(err?.error || 'Approval failed.');
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (reason.trim().length < 3) {
      setError('A rejection reason (min 3 characters) is required.');
      return;
    }
    setBusy(true);
    try {
      const out = await rejectKYC(userId, reason.trim());
      setKyc(out);
      setReason('');
      if (onChanged) onChanged(out);
    } catch (err) {
      setError(err?.error || 'Rejection failed.');
    } finally {
      setBusy(false);
    }
  };

  const doRequestInfo = async () => {
    if (reason.trim().length < 3) {
      setError('A note describing the missing info (min 3 characters) is required.');
      return;
    }
    setBusy(true);
    try {
      const out = await requestKYCInfo(userId, reason.trim());
      setKyc(out);
      setReason('');
      if (onChanged) onChanged(out);
    } catch (err) {
      setError(err?.error || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>Loading KYC…</div>;
  if (error && !kyc) return (
    <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
      KYC: {error} <button type="button" onClick={reload} style={{ marginLeft: '8px' }}>Retry</button>
    </div>
  );
  if (!kyc) return null;

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--ws-border)', paddingTop: '14px' }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 8px 0' }}>
        KYC Review — {kyc.kind} · {kyc.status}
      </h4>
      {kyc.status === 'REJECTED' && kyc.rejection_reason && (
        <div style={{ fontSize: '0.8rem', color: '#EF4444', marginBottom: '8px' }}>
          Rejected: {kyc.rejection_reason}
        </div>
      )}
      {kyc.data && Object.keys(kyc.data).length > 0 && (
        <div style={{ fontSize: '0.8rem', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {Object.entries(kyc.data).map(([k, v]) => (
            <div key={k}><strong>{k}:</strong> {String(v)}</div>
          ))}
        </div>
      )}
      {(!kyc.documents || kyc.documents.length === 0) && (
        <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>No documents uploaded.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        {(kyc.documents || []).map(d => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span>{d.doc_type} · {d.original_name} · {d.status}</span>
            <button type="button" onClick={() => openDoc(d)} style={{ fontSize: '0.76rem', cursor: 'pointer' }}>
              Preview
            </button>
          </div>
        ))}
      </div>
      {kyc.status !== 'APPROVED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason / missing-info note (required to reject or request info)"
            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--ws-border)', fontSize: '0.8rem' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={doApprove} disabled={busy} className="fd-btn fd-btn-primary" style={{ padding: '8px 16px', minHeight: '40px' }}>
              Approve KYC
            </button>
            <button type="button" onClick={doReject} disabled={busy} className="fd-btn fd-btn-danger" style={{ padding: '8px 16px', minHeight: '40px' }}>
              Reject KYC
            </button>
            <button type="button" onClick={doRequestInfo} disabled={busy} className="fd-btn fd-btn-secondary" style={{ padding: '8px 16px', minHeight: '40px' }}>
              Request Info
            </button>
          </div>
        </div>
      )}
      {error && kyc && <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '6px' }}>{error}</div>}
      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', width: '100%', maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>{previewName}</strong>
              <button type="button" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>Close</button>
            </div>
            <iframe title="kyc-doc" src={previewUrl} style={{ width: '100%', height: '420px', border: '1px solid #ccc', borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </div>
  );
};
