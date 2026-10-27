import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Upload,
  Eye,
  X,
  FileCheck2,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import {
  fetchKYCStatus,
  saveKYCDraft,
  submitKYC,
  uploadKYCDocument,
  deleteKYCDocument,
  downloadKYCDocument
} from '../services/api.js';

const FIELD_DEFS = [
  { key: 'bank_holder', label: 'Bank account holder name', required: true },
  { key: 'bank_account', label: 'Bank account number', required: true },
  { key: 'bank_ifsc', label: 'IFSC code', required: true },
  { key: 'emergency_name', label: 'Emergency contact name', required: true },
  { key: 'emergency_phone', label: 'Emergency contact phone', required: true }
];

const STATUS_META = {
  NOT_STARTED: { label: 'NOT STARTED', color: '#65776B', bg: '#F1F5F1', border: '#E1EBE3' },
  INCOMPLETE: { label: 'INCOMPLETE', color: '#B7791F', bg: '#FFFBEB', border: '#FDE68A' },
  PENDING: { label: 'PENDING REVIEW', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  MORE_INFO_REQUIRED: { label: 'MORE INFO REQUIRED', color: '#B45309', bg: '#FFFBEB', border: '#F59E0B' },
  REJECTED: { label: 'REJECTED', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  APPROVED: { label: 'APPROVED', color: '#163D2B', bg: '#D8F3DC', border: '#B7E4C7' }
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E1EBE3',
  borderRadius: '20px',
  padding: '20px',
  boxShadow: '0 4px 16px rgba(22, 61, 43, 0.04)',
  boxSizing: 'border-box',
  width: '100%'
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '12px',
  border: '1.5px solid #CBD5E1',
  fontSize: '0.88rem',
  color: '#0A2E1B',
  backgroundColor: '#F8FAF6',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s'
};

export const DocumentsPage = () => {
  const { showToast } = useDelivery();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({});
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
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

  const handleSaveDraft = async () => {
    setSaving(true);
    setActionMsg(null);
    try {
      const out = await saveKYCDraft(form, consent);
      setKyc(out);
      setActionMsg({ type: 'success', text: 'Draft saved. You can resume anytime.' });
    } catch (err) {
      setActionMsg({ type: 'error', text: err?.error || 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionMsg(null);
    try {
      const out = await submitKYC(consent);
      setKyc(out);
      setActionMsg({ type: 'success', text: 'Submitted for review. Application is now pending.' });
      showToast('KYC submitted for review.', 'success');
    } catch (err) {
      const details = err?.missing_docs?.length
        ? ` Missing: ${err.missing_docs.join(', ')}`
        : err?.missing_fields?.length
          ? ` Missing: ${err.missing_fields.join(', ')}`
          : '';
      setActionMsg({ type: 'error', text: (err?.error || 'Submit failed') + details });
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
      showToast('Document uploaded.', 'success');
    } catch (err) {
      showToast(err?.error || 'Upload failed', 'danger');
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId) => {
    try {
      await deleteKYCDocument(docId);
      await reload();
    } catch (err) {
      showToast(err?.error || 'Remove failed', 'danger');
    }
  };

  const handlePreview = async (doc) => {
    try {
      const blob = await downloadKYCDocument(doc.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewName(doc.original_name || doc.doc_type);
    } catch {
      showToast('Preview not permitted', 'danger');
    }
  };

  const badge = STATUS_META[kyc?.status] || STATUS_META.NOT_STARTED;
  const allDocs = [...(Object.entries(kyc?.required_docs || {}).map(([t, l]) => ({ type: t, label: l, required: true }))),
    ...(Object.entries(kyc?.optional_docs || {}).map(([t, l]) => ({ type: t, label: l, required: false })))];
  const uploadedByType = {};
  (kyc?.documents || []).forEach(d => { (uploadedByType[d.doc_type] = uploadedByType[d.doc_type] || []).push(d); });

  return (
    <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px', boxSizing: 'border-box' }}>

      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(27, 67, 50, 0.08)', border: '1px solid rgba(27, 67, 50, 0.16)', padding: '5px 12px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#1B4332' }} />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1B4332', letterSpacing: '0.5px' }}>
            FLEET COMPLIANCE & CREDENTIALS
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)', fontWeight: 900, color: '#0A2E1B', margin: 0, letterSpacing: '-0.4px' }}>
          Complete Delivery Partner KYC
        </h1>
        <div style={{ fontSize: '0.85rem', color: '#525760', marginTop: '4px', lineHeight: 1.5 }}>
          Save your progress and resume anytime. Applications are reviewed promptly by fleet dispatch operations.
        </div>
      </div>

      {loading && (
        <div style={cardStyle}><div style={{ fontSize: '0.88rem', color: '#64748B', padding: '12px 0' }}>Loading KYC status…</div></div>
      )}

      {!loading && loadError && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontSize: '0.88rem', fontWeight: 700 }}>
            <AlertCircle size={16} /> {loadError}
          </div>
          <button type="button" onClick={reload} className="btn-secondary-fresh" style={{ marginTop: '12px', padding: '10px 18px', cursor: 'pointer' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !loadError && kyc && (
        <>
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={26} color={badge.color} />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0A2E1B' }}>Onboarding Status</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Verified with fleet administration</div>
              </div>
            </div>
            <span style={{ backgroundColor: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, padding: '6px 14px', borderRadius: '999px', fontWeight: 800, fontSize: '0.78rem' }}>
              {badge.label}
            </span>
          </div>

          {['REJECTED', 'MORE_INFO_REQUIRED'].includes(kyc.status) && (
            <div style={{ ...cardStyle, borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}>
              <div style={{ fontSize: '0.86rem', color: '#991B1B' }}>
                <strong>{kyc.status === 'MORE_INFO_REQUIRED' ? 'More information needed:' : 'Rejected reason:'}</strong> {kyc.rejection_reason || 'Not provided'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7A808C', marginTop: '4px' }}>
                Correct the items below and resubmit. Your previous uploads are preserved.
              </div>
            </div>
          )}

          {actionMsg && (
            <div style={{ ...cardStyle, borderColor: actionMsg.type === 'error' ? '#FECACA' : '#A7F3D0', backgroundColor: actionMsg.type === 'error' ? '#FEF2F2' : '#ECFDF5' }}>
              <div style={{ fontSize: '0.86rem', color: actionMsg.type === 'error' ? '#991B1B' : '#065F46', fontWeight: 600 }}>{actionMsg.text}</div>
            </div>
          )}

          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0A2E1B', margin: '0 0 14px' }}>Step 1 — Payout & Emergency Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
              {FIELD_DEFS.map(f => (
                <label key={f.key} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A2E1B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>{f.label}{f.required ? ' *' : ''}</span>
                  <input
                    style={inputStyle}
                    value={form[f.key] || ''}
                    disabled={!editable}
                    placeholder={f.label}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>

            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '16px', padding: '12px 14px', backgroundColor: '#F8FAF6', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, cursor: editable ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={consent} disabled={!editable} onChange={e => setConsent(e.target.checked)} style={{ marginTop: '2px', accentColor: '#1B4332' }} />
              <span>I declare the details submitted are authentic and consent to document verification for commercial delivery fleet onboarding.</span>
            </label>

            {editable && (
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button type="button" onClick={handleSaveDraft} disabled={saving} style={{ padding: '11px 22px', borderRadius: '12px', background: '#FFFFFF', border: '1.5px solid #CBD5E1', color: '#0A2E1B', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {saving ? 'Saving…' : 'Save Draft & Resume Later'}
                </button>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0A2E1B', margin: '0 0 4px' }}>Step 2 — Identity & License Documents</h3>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '14px' }}>
              Government ID, Driving License, and Vehicle RC. Images (JPG, PNG, WEBP max 5 MB) or PDF (max 10 MB). Visible only to verified compliance officers.
            </div>
            {(kyc.documents || []).length === 0 && (
              <div style={{ fontSize: '0.84rem', color: '#94A3B8', marginBottom: '12px', fontStyle: 'italic' }}>No documents uploaded yet.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allDocs.map(d => (
                <div key={d.type} style={{ backgroundColor: '#F8FAF6', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px 18px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0A2E1B' }}>{d.label}{d.required ? ' *' : ''}</span>
                    {editable && (
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1B4332', backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={14} /> {uploadingType === d.type ? 'Uploading…' : 'Upload File'}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          disabled={uploadingType === d.type}
                          onChange={e => { handleFile(d.type, e.target.files?.[0]); e.target.value = ''; }}
                        />
                      </label>
                    )}
                  </div>
                  {(uploadedByType[d.type] || []).map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap', gap: '8px', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <span style={{ wordBreak: 'break-all', fontWeight: 600 }}>{u.original_name} · <span style={{ color: '#16A34A', fontWeight: 700 }}>{u.status}</span>{u.rejection_note ? ` — ${u.rejection_note}` : ''}</span>
                      <span style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => handlePreview(u)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAF6', color: '#0A2E1B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={13} /> View
                        </button>
                        {editable && (
                          <button type="button" onClick={() => handleDelete(u.id)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {editable && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0A2E1B', margin: '0 0 8px' }}>Step 3 — Submit for Verification</h3>
              {kyc.missing_docs?.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#D97706', marginBottom: '10px', fontWeight: 600 }}>
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
                  borderRadius: '14px',
                  padding: '13px 28px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 61, 43, 0.25)',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting…' : kyc.status === 'MORE_INFO_REQUIRED' ? 'Add Info & Resubmit' : kyc.status === 'REJECTED' ? 'Correct & Resubmit' : 'Submit KYC for Fleet Review'}
              </button>
            </div>
          )}

          {kyc.status === 'APPROVED' && (
            <div style={{ ...cardStyle, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#065F46', fontWeight: 800, fontSize: '0.95rem' }}>
                <FileCheck2 size={20} /> KYC verification approved — you are activated for commercial fleet deliveries.
              </div>
            </div>
          )}
        </>
      )}

      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 220, backgroundColor: 'rgba(10, 46, 27, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0A2E1B', wordBreak: 'break-all' }}>{previewName}</strong>
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ width: '100%', minHeight: '260px', maxHeight: '65vh', overflow: 'hidden', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAF6' }}>
              {previewName.toLowerCase().endsWith('.pdf') ? (
                <iframe title="doc-preview" src={previewUrl} style={{ width: '100%', height: '440px', border: 'none' }} />
              ) : (
                <img src={previewUrl} alt="Document Preview" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
