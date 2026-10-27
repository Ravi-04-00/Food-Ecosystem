import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Upload, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Paperclip,
  Check,
  Send,
  Building2,
  FileText
} from 'lucide-react';
import { 
  fetchRestaurantTickets, 
  fetchRestaurantTicketDetail, 
  replyRestaurantTicket 
} from '../services/api.js';

export const RestaurantDisputesPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const fileInputRef = useRef(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await fetchRestaurantTickets(params);
      setTickets(res?.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError('Unable to load restaurant disputes. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, searchQuery]);

  const handleOpenTicket = async (ticketNumber) => {
    try {
      setLoadingDetail(true);
      setReplyError(null);
      const detail = await fetchRestaurantTicketDetail(ticketNumber);
      setSelectedTicket(detail);
    } catch (err) {
      alert('Failed to load dispute details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() && !replyFile) return;

    try {
      setIsSubmittingReply(true);
      setReplyError(null);

      const formData = new FormData();
      if (replyMessage.trim()) formData.append('message', replyMessage.trim());
      if (replyFile) formData.append('file', replyFile);

      const updated = await replyRestaurantTicket(selectedTicket.ticket_number, formData);
      setSelectedTicket(updated);
      setReplyMessage('');
      setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadTickets();
    } catch (err) {
      const msg = err?.message || err?.detail || err?.file || 'Failed to submit kitchen response.';
      setReplyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', label: 'Open' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', label: 'Under Review' };
      case 'WAITING_CUSTOMER':
        return { bg: 'rgba(244, 114, 182, 0.15)', color: '#F472B6', label: 'Awaiting Customer' };
      case 'ESCALATED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', label: 'Escalated' };
      case 'RESOLVED':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', label: 'Resolved' };
      case 'CLOSED':
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', label: 'Closed' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', label: status };
    }
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Title & Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '24px',
        padding: '28px 32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, color: '#F87171', marginBottom: '10px' }}>
            <ShieldAlert size={14} />
            ORDER DISPUTE MEDIATION
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Customer Complaints & Kitchen Disputes
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94A3B8', maxWidth: '640px', lineHeight: 1.5 }}>
            Review order-linked customer claims (missing items, food quality, or packaging defects). Submit kitchen facts and packaging proof directly to operations.
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '16px 20px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>ACTIVE DISPUTES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ADE80' }}>
            {tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length}
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: statusFilter === st ? '#4ADE80' : 'rgba(255, 255, 255, 0.15)',
                background: statusFilter === st ? 'rgba(74, 222, 128, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                color: statusFilter === st ? '#4ADE80' : 'var(--ws-text-secondary, #94A3B8)'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search ticket #, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(15, 23, 42, 0.6)',
              fontSize: '0.85rem',
              color: '#FFFFFF',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading disputes...</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ADE80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <CheckCircle2 size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF' }}>
            Zero Complaints Found
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0 }}>
            No customer complaints or disputes linked to your restaurant orders.
          </p>
        </div>
      )}

      {/* Disputes Cards Grid */}
      {!loading && !error && tickets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
          {tickets.map((tkt) => {
            const st = getStatusBadge(tkt.status);
            return (
              <div
                key={tkt.id}
                onClick={() => handleOpenTicket(tkt.ticket_number)}
                style={{
                  background: 'var(--ws-surface, #1E293B)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4ADE80'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#38BDF8' }}>
                      #{tkt.ticket_number}
                    </span>
                    <span style={{ background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                      {st.label}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {tkt.subject}
                  </h4>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      {tkt.category_display || tkt.category}
                    </span>
                    {tkt.order_number && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        Order #{tkt.order_number}
                      </span>
                    )}
                  </div>

                  {tkt.latest_message && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', fontSize: '0.8rem', color: '#94A3B8' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#CBD5E1', marginBottom: '2px' }}>
                        {tkt.latest_message.sender_role}:
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tkt.latest_message.message}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '0.75rem', color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {new Date(tkt.created_at).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ADE80', fontWeight: 700 }}>
                    Respond & View Details
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            color: '#FFFFFF'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1E293B'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#38BDF8', fontSize: '0.95rem' }}>
                    #{selectedTicket.ticket_number}
                  </span>
                  <span style={{ ...getStatusBadge(selectedTicket.status), fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                    {getStatusBadge(selectedTicket.status).label}
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 800 }}>
                  {selectedTicket.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Order Info Card (Customer PII Masked) */}
              {selectedTicket.order_details && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8' }}>ORDER REFERENCE</div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                      Order #{selectedTicket.order_details.order_number} • ₹{selectedTicket.order_details.total_amount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      Customer: {selectedTicket.order_details.customer_name}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(74, 222, 128, 0.15)', color: '#4ADE80', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      Payment: {selectedTicket.order_details.payment_status}
                    </span>
                  </div>
                </div>
              )}

              {/* Resolution Summary (If resolved) */}
              {selectedTicket.resolution_summary && (
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '14px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4ADE80', marginBottom: '4px' }}>
                    RESOLUTION OUTCOME
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#D1FAE5' }}>
                    {selectedTicket.resolution_summary}
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  DISPUTE CORRESPONDENCE
                </div>

                {selectedTicket.messages && selectedTicket.messages.map((msg) => {
                  const isRestaurant = msg.sender_role === 'RESTAURANT';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isRestaurant ? 'flex-end' : 'flex-start',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94A3B8' }}>
                        <span style={{ fontWeight: 700, color: isRestaurant ? '#4ADE80' : '#38BDF8' }}>
                          {isRestaurant ? 'Kitchen (You)' : msg.sender_role}
                        </span>
                        <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isRestaurant ? '#059669' : '#1E293B',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        {msg.message}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {msg.attachments.map(att => (
                              <a
                                key={att.id}
                                href={att.download_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(0,0,0,0.2)',
                                  color: '#38BDF8',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  textDecoration: 'none'
                                }}
                              >
                                <Paperclip size={13} />
                                <span>{att.file_name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#1E293B',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {replyError && (
                <div style={{ fontSize: '0.8rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} />
                  <span>{replyError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setReplyFile(e.target.files[0] || null)}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    background: replyFile ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '12px',
                    color: replyFile ? '#4ADE80' : '#94A3B8',
                    cursor: 'pointer'
                  }}
                  title="Upload Packaging / Station Photo"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder="Provide factual kitchen explanation or verification..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />

                <button
                  type="submit"
                  disabled={isSubmittingReply || (!replyMessage.trim() && !replyFile)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: isSubmittingReply ? '#64748B' : '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: isSubmittingReply ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingReply ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>Respond</span>
                </button>
              </div>

              {replyFile && (
                <div style={{ fontSize: '0.75rem', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} />
                  <span>Attached: {replyFile.name} ({(replyFile.size / 1024).toFixed(0)} KB)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
