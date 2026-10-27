import React, { useEffect, useState } from 'react';
import {
  fetchKYCStatus,
  saveKYCDraft,
  submitKYC,
  uploadKYCDocument,
  deleteKYCDocument,
  downloadKYCDocument
} from '../services/api.js';

const FIELD_DEFS = [
  { key: 'fssai_number', label: 'FSSAI licence / registration number', required: true },
  { key: 'fssai_expiry', label: 'FSSAI expiry date (YYYY-MM-DD)', required: true },
  { key: 'gstin', label: 'GSTIN (if applicable)', required: false },
  { key: 'pan', label: 'PAN (if applicable)', required: false },
  { key: 'bank_holder', label: 'Bank account holder name', required: true },
  { key: 'bank_account', label: 'Bank account number', required: true },
  { key: 'bank_ifsc', label: 'IFSC code', required: true }
];

const STATUS_META = {
  NOT_STARTED: { label: 'NOT STARTED', color: '#65776B', bg: '#F1F5F1', border: '#E1EBE3' },
  INCOMPLETE: { label: 'INCOMPLETE', color: '#B7791F', bg: '#FFFBEB', border: '#FDE68A' },
  PENDING: { label: 'PENDING REVIEW', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  MORE_INFO_REQUIRED: { label: 'MORE INFO REQUIRED', color: '#B45309', bg: '#FFFBEB', border: '#F59E0B' },
  REJECTED: { label: 'REJECTED', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  APPROVED: { label: 'APPROVED', color: '#1B4332', bg: '#D8F3DC', border: '#B7E4C7' }
};

const card = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E1EBE3',
  borderRadius: '20px',
  padding: '22px',
  boxShadow: '0 2px 8px rgba(22, 61, 43, 0.05)'
};

const input = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid #E1EBE3',
  fontSize: '0.86rem',
  boxSizing: 'border-box'
};

export const RestaurantKYCPage = () => {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({});
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [uploadingType, setUploadingType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState('');

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchKYCStatus();
      setKyc(data);
      setForm(data?.data || {});
      setConsent(!!data?.consent_given);
    } catch (err) {
      setLoadError(err?.error || 'Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const editable = kyc && !['PENDING', 'APPROVED'].includes(kyc.status);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      setKyc(await saveKYCDraft(form, consent));
      setMsg({ type: 'success', text: 'Draft saved. You can resume anytime.' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.error || 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      const out = await submitKYC(consent);
      setKyc(out);
      setMsg({ type: 'success', text: 'Submitted for review. Outlet stays inactive until approval.' });
    } catch (err) {
      const details = err?.missing_docs?.length
        ? ` Missing: ${err.missing_docs.join(', ')}`
        : err?.missing_fields?.length ? ` Missing: ${err.missing_fields.join(', ')}` : '';
      setMsg({ type: 'error', text: (err?.error || 'Submit failed') + details });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = async (docType, file) => {
    if (!file) return;
    setUploadingType(docType);
    try {
      await uploadKYCDocument(docType, file);
      await reload();
    } catch (err) {
      setMsg({ type: 'error', text: err?.error || 'Upload failed' });
    } finally {
      setUploadingType(null);
    }
  };

  const badge = STATUS_META[kyc?.status] || STATUS_META.NOT_STARTED;
  const allDocs = [...Object.entries(kyc?.required_docs || {}).map(([t, l]) => ({ type: t, label: l, required: true })),
    ...Object.entries(kyc?.optional_docs || {}).map(([t, l]) => ({ type: t, label: l, required: false }))];
  const byType = {};
  (kyc?.documents || []).forEach(d => { (byType[d.doc_type] = byType[d.doc_type] || []).push(d); });

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '72px' }}>
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#163D2B', margin: 0 }}>Complete Restaurant KYC</h1>
        <div style={{ fontSize: '0.84rem', color: '#65776B' }}>
          Outlet stays inactive until verification is approved. Tax documents apply only where relevant.
        </div>
      </div>

      {loading && <div style={card}><div style={{ color: '#65776B' }}>Loading KYC status…</div></div>}
      {!loading && loadError && (
        <div style={card}>
          <div style={{ color: '#DC2626', fontWeight: 700 }}>{loadError}</div>
          <button type="button" onClick={reload} style={{ marginTop: '10px' }}>Retry</button>
        </div>
      )}

      {!loading && !loadError && kyc && (
        <>
          <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <strong style={{ color: '#163D2B' }}>KYC Status</strong>
            <span style={{ backgroundColor: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, padding: '6px 14px', borderRadius: '999px', fontWeight: 800, fontSize: '0.78rem' }}>
              {badge.label}
            </span>
          </div>

          {['REJECTED', 'MORE_INFO_REQUIRED'].includes(kyc.status) && (
            <div style={{ ...card, borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}>
              <div style={{ color: '#991B1B' }}><strong>{kyc.status === 'MORE_INFO_REQUIRED' ? 'More information needed:' : 'Rejected reason:'}</strong> {kyc.rejection_reason || 'Not provided'}</div>
              <div style={{ fontSize: '0.8rem', color: '#7A808C' }}>Correct the items and resubmit. Previous uploads are preserved.</div>
            </div>
          )}

          {msg && (
            <div style={{ ...card, borderColor: msg.type === 'error' ? '#FECACA' : '#B7E4C7', backgroundColor: msg.type === 'error' ? '#FEF2F2' : '#D8F3DC' }}>
              <div style={{ fontSize: '0.86rem' }}>{msg.text}</div>
            </div>
          )}

          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: '#163D2B', fontSize: '1.05rem', fontWeight: 800 }}>Step 1 — Licences & Settlement Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
              {FIELD_DEFS.map(f => (
                <label key={f.key} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#40544A', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>{f.label}{f.required ? ' *' : ''}</span>
                  <input style={input} value={form[f.key] || ''} disabled={!editable}
                    placeholder={f.label}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </label>
              ))}
            </div>
            <label style={{ display: 'flex', gap: '10px', marginTop: '14px', fontSize: '0.82rem', color: '#40544A', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={consent} disabled={!editable} onChange={e => setConsent(e.target.checked)} style={{ marginTop: '2px', accentColor: '#163D2B' }} />
              <span>I declare the outlet details are true and consent to verification for restaurant onboarding.</span>
            </label>
            {editable && (
              <button type="button" onClick={handleSave} disabled={saving} style={{ marginTop: '14px', padding: '10px 20px', borderRadius: '12px', background: '#FFFFFF', border: '1.5px solid #CBD5E1', color: '#163D2B', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Save Draft & Resume Later'}
              </button>
            )}
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 4px', color: '#163D2B', fontSize: '1.05rem', fontWeight: 800 }}>Step 2 — Documents</h3>
            <div style={{ fontSize: '0.78rem', color: '#65776B', marginBottom: '12px' }}>
              Images (max 5 MB) or PDF (max 10 MB). Private — visible only to you and reviewers.
            </div>
            {(kyc.documents || []).length === 0 && (
              <div style={{ fontSize: '0.84rem', color: '#65776B', marginBottom: '10px' }}>No documents uploaded yet.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allDocs.map(d => (
                <div key={d.type} style={{ border: '1px solid #E1EBE3', borderRadius: '14px', padding: '12px 16px', backgroundColor: '#F8FAF6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#163D2B' }}>{d.label}{d.required ? ' *' : ''}</strong>
                    {editable && (
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#163D2B', backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        {uploadingType === d.type ? 'Uploading…' : 'Upload File'}
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} disabled={uploadingType === d.type}
                          onChange={e => { handleFile(d.type, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                  {(byType[d.type] || []).map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: '0.8rem', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E1EBE3' }}>
                      <span style={{ wordBreak: 'break-all' }}>{u.original_name} · <span style={{ color: '#16A34A', fontWeight: 700 }}>{u.status}</span>{u.rejection_note ? ` — ${u.rejection_note}` : ''}</span>
                      <span style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={async () => {
                          const blob = await downloadKYCDocument(u.id).catch(() => null);
                          if (blob) { const url = URL.createObjectURL(blob); setPreviewUrl(url); setPreviewName(u.original_name); }
                        }} style={{ padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAF6', cursor: 'pointer' }}>View</button>
                        {editable && <button type="button" onClick={async () => {
                          await deleteKYCDocument(u.id).catch(() => null); reload();
                        }} style={{ padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Remove</button>}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {editable && (
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', color: '#163D2B', fontSize: '1.05rem', fontWeight: 800 }}>Step 3 — Submit for Review</h3>
              {kyc.missing_docs?.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#B7791F', marginBottom: '8px', fontWeight: 600 }}>
                  Still missing: {kyc.missing_docs.join(', ')}
                </div>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #163D2B 0%, #1B4332 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting…' : kyc.status === 'MORE_INFO_REQUIRED' ? 'Add Info & Resubmit' : kyc.status === 'REJECTED' ? 'Correct & Resubmit' : 'Submit KYC for Review'}
              </button>
            </div>
          )}

          {kyc.status === 'APPROVED' && (
            <div style={{ ...card, borderColor: '#B7E4C7', backgroundColor: '#D8F3DC' }}>
              <strong style={{ color: '#1B4332' }}>KYC approved — outlet can go live.</strong>
            </div>
          )}
        </>
      )}

      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(22,61,43,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.95rem', color: '#163D2B', wordBreak: 'break-all' }}>{previewName}</strong>
              <button type="button" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>Close</button>
            </div>
            <div style={{ width: '100%', minHeight: '260px', maxHeight: '65vh', overflow: 'hidden', borderRadius: '12px', border: '1px solid #E1EBE3', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAF6' }}>
              {previewName.toLowerCase().endsWith('.pdf') ? (
                <iframe title="kyc-preview" src={previewUrl} style={{ width: '100%', height: '420px', border: 'none' }} />
              ) : (
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
