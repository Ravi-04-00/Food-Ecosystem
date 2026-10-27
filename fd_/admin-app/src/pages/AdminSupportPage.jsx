import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  AlertCircle, 
  ArrowRight, 
  User, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  X, 
  Paperclip, 
  Clock, 
  Send, 
  Lock, 
  Check, 
  AlertTriangle,
  UserCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  fetchAdminTickets, 
  fetchAdminTicketDetail, 
  replyAdminTicket, 
  assignAdminTicket, 
  escalateAdminTicket, 
  resolveAdminTicket, 
  closeAdminTicket,
  autoEscalateAdminTickets
} from '../services/api.js';
import { AdminCallQueue } from '../components/AdminCallQueue.jsx';
import { AgentQueuePanel } from '../components/AgentQueuePanel.jsx';

export const AdminSupportPage = () => {
  // State
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total_open: 0,
    customer_issues: 0,
    restaurant_issues: 0,
    delivery_issues: 0,
    escalated_count: 0,
    urgent_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action Modals & Inputs
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyFile, setReplyFile] = useState(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [isSubmittingEscalate, setIsSubmittingEscalate] = useState(false);

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  const [autoEscalateFeedback, setAutoEscalateFeedback] = useState(null);

  const fileInputRef = useRef(null);

  // Load Tickets & Real Metrics from PostgreSQL
  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await fetchAdminTickets(params);
      setTickets(res?.results || (Array.isArray(res) ? res : []));
      if (res?.stats) setStats(res.stats);
    } catch (err) {
      setError('Unable to load support queue. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const handleOpenTicket = async (ticketNumber) => {
    try {
      setLoadingDetail(true);
      setReplyError(null);
      const detail = await fetchAdminTicketDetail(ticketNumber);
      setSelectedTicket(detail);
    } catch (err) {
      setError('Failed to load ticket details.');
      setTimeout(() => setError(null), 4000);
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
      formData.append('is_internal_note', isInternalNote);
      if (replyFile) formData.append('file', replyFile);

      const updated = await replyAdminTicket(selectedTicket.ticket_number, formData);
      setSelectedTicket(updated);
      setReplyMessage('');
      setIsInternalNote(false);
      setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadTickets();
    } catch (err) {
      const msg = err?.message || err?.detail || 'Failed to post reply.';
      setReplyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalationReason.trim()) return;

    try {
      setIsSubmittingEscalate(true);
      const updated = await escalateAdminTicket(selectedTicket.ticket_number, escalationReason.trim());
      setSelectedTicket(updated);
      setEscalateModalOpen(false);
      setEscalationReason('');
      loadTickets();
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to escalate ticket.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsSubmittingEscalate(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) {
      setResolveError('A clear resolution summary is required before resolving.');
      return;
    }

    try {
      setIsSubmittingResolve(true);
      setResolveError(null);
      const updated = await resolveAdminTicket(selectedTicket.ticket_number, resolutionSummary.trim());
      setSelectedTicket(updated);
      setResolveModalOpen(false);
      setResolutionSummary('');
      loadTickets();
    } catch (err) {
      const msg = err?.resolution_summary || err?.detail || 'Failed to resolve ticket.';
      setResolveError(Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : JSON.stringify(msg)));
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    try {
      const updated = await closeAdminTicket(selectedTicket.ticket_number);
      setSelectedTicket(updated);
      loadTickets();
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to close ticket.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleAutoEscalateSweep = async () => {
    try {
      const res = await autoEscalateAdminTickets(24);
      setAutoEscalateFeedback(res.message);
      loadTickets();
      setTimeout(() => setAutoEscalateFeedback(null), 4000);
    } catch (err) {
      setError('SLA sweep failed: ' + (err?.message || 'Error'));
      setTimeout(() => setError(null), 4000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { bg: '#E0F2FE', color: '#0369A1', label: 'Open' };
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', color: '#B45309', label: 'In Progress' };
      case 'WAITING_CUSTOMER':
        return { bg: '#FCE7F3', color: '#BE185D', label: 'Waiting Customer' };
      case 'ESCALATED':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'Escalated' };
      case 'RESOLVED':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Resolved' };
      case 'CLOSED':
        return { bg: '#F3F4F6', color: '#4B5563', label: 'Closed' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', label: status };
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return { bg: '#FEE2E2', color: '#DC2626', label: 'Urgent' };
      case 'HIGH':
        return { bg: '#FFEDD5', color: '#EA580C', label: 'High' };
      default:
        return { bg: '#E0F2FE', color: '#0284C7', label: 'Normal' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Title & SLA Sweep Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#F45B32', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            OPERATIONS DESK
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#241A17', margin: '4px 0 2px 0' }}>
            Support Center & Dispute Mediation
          </h1>
          <div style={{ fontSize: '0.85rem', color: '#6E6259' }}>
            Cross-ecosystem dispute mediation, SLA tracking, verified gateway records, and staff coordination.
          </div>
        </div>

        <button
          onClick={handleAutoEscalateSweep}
          style={{
            background: '#241A17',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 3px 0 #000'
          }}
        >
          <TrendingUp size={15} color="#F45B32" />
          <span>Run 24h SLA Auto-Escalation Sweep</span>
        </button>
      </div>

      {autoEscalateFeedback && (
        <div style={{ padding: '12px 18px', background: '#DCFCE7', color: '#15803D', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{autoEscalateFeedback}</span>
        </div>
      )}

      <AdminCallQueue />

      <AgentQueuePanel />

      {/* 4 Real Support Stats Cards (Calculated directly from PostgreSQL) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Open Tickets */}
        <div style={{
          background: '#FFFFFF',
          border: '2.5px solid #241A17',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 4px 0 #241A17'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#6E6259', fontWeight: 800, textTransform: 'uppercase' }}>
            Active Open Queue
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F45B32', margin: '6px 0 2px 0' }}>
            {stats.total_open}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6E6259' }}>
            Awaiting agent action
          </div>
        </div>

        {/* Customer Issues */}
        <div style={{
          background: '#FFFFFF',
          border: '2.5px solid #241A17',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 4px 0 #241A17'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#6E6259', fontWeight: 800, textTransform: 'uppercase' }}>
            Customer Complaints
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#241A17', margin: '6px 0 2px 0' }}>
            {stats.customer_issues}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6E6259' }}>
            Missing food & damage disputes
          </div>
        </div>

        {/* Restaurant Issues */}
        <div style={{
          background: '#FFFFFF',
          border: '2.5px solid #241A17',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 4px 0 #241A17'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#6E6259', fontWeight: 800, textTransform: 'uppercase' }}>
            Kitchen Disputes
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#B45309', margin: '6px 0 2px 0' }}>
            {stats.restaurant_issues}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6E6259' }}>
            Merchant order-linked claims
          </div>
        </div>

        {/* Escalated / Urgent */}
        <div style={{
          background: '#FFFFFF',
          border: '2.5px solid #241A17',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 4px 0 #241A17'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#6E6259', fontWeight: 800, textTransform: 'uppercase' }}>
            Escalated Tickets
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', margin: '6px 0 2px 0' }}>
            {stats.escalated_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6E6259' }}>
            Requires senior mediation
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1.5px solid',
                borderColor: statusFilter === st ? '#F45B32' : '#D1C7BD',
                background: statusFilter === st ? 'rgba(244, 91, 50, 0.12)' : '#FFFFFF',
                color: statusFilter === st ? '#F45B32' : '#6E6259'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1.5px solid #D1C7BD',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: '#FFFFFF'
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search ticket, order, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '12px',
                border: '1.5px solid #D1C7BD',
                background: '#FFFFFF',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div style={{
        background: '#FFFFFF',
        border: '2.5px solid #241A17',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 0 #241A17'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#241A17' }}>
            OPERATIONS DISPUTE QUEUE ({tickets.length} TICKETS)
          </span>
          <button
            onClick={loadTickets}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6E6259', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6E6259' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
            <div>Loading operations queue...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6E6259' }}>
            No tickets matching current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#FAF8F5', borderBottom: '1.5px solid #E5E7EB', color: '#6E6259', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 18px' }}>Reference</th>
                  <th style={{ padding: '12px 18px' }}>Subject</th>
                  <th style={{ padding: '12px 18px' }}>Category</th>
                  <th style={{ padding: '12px 18px' }}>Customer</th>
                  <th style={{ padding: '12px 18px' }}>Order #</th>
                  <th style={{ padding: '12px 18px' }}>Priority</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px' }}>Age</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(tkt => {
                  const st = getStatusBadge(tkt.status);
                  const pr = getPriorityBadge(tkt.priority);
                  return (
                    <tr
                      key={tkt.id}
                      onClick={() => handleOpenTicket(tkt.ticket_number)}
                      style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FFF8F5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 900, color: '#241A17' }}>
                        #{tkt.ticket_number}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#241A17', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tkt.subject}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#6E6259' }}>
                        {tkt.category_display || tkt.category}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#241A17', fontWeight: 600 }}>
                        {tkt.creator_name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {tkt.order_number ? (
                          <span style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                            #{tkt.order_number}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ background: pr.bg, color: pr.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {pr.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#9CA3AF', fontSize: '0.78rem' }}>
                        {new Date(tkt.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(tkt.ticket_number);
                          }}
                          style={{
                            background: '#F45B32',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Support Operations Desk) */}
      {selectedTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '2.5px solid #241A17'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1.5px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAF8F5'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#F45B32', fontSize: '1rem' }}>
                    #{selectedTicket.ticket_number}
                  </span>
                  <span style={{ ...getStatusBadge(selectedTicket.status), fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                    {getStatusBadge(selectedTicket.status).label}
                  </span>
                  <span style={{ ...getPriorityBadge(selectedTicket.priority), fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                    {getPriorityBadge(selectedTicket.priority).label}
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#241A17' }}>
                  {selectedTicket.subject}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <>
                    <button
                      onClick={() => setEscalateModalOpen(true)}
                      style={{
                        background: '#FEE2E2',
                        color: '#B91C1C',
                        border: '1px solid #FECACA',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => setResolveModalOpen(true)}
                      style={{
                        background: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #BBF7D0',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Resolve
                    </button>
                  </>
                )}

                {selectedTicket.status === 'RESOLVED' && (
                  <button
                    onClick={handleCloseTicket}
                    style={{
                      background: '#241A17',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Close Ticket
                  </button>
                )}

                <button
                  onClick={() => setSelectedTicket(null)}
                  style={{ background: 'none', border: 'none', color: '#6E6259', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Linked Order & Gateway Transaction Details */}
              {selectedTicket.order_details ? (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>LINKED VERIFIED ORDER</div>
                    <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.95rem' }}>
                      Order #{selectedTicket.order_details.order_number} • {selectedTicket.order_details.restaurant_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                      Customer: <strong>{selectedTicket.order_details.customer_name}</strong> • Amount: ₹{selectedTicket.order_details.total_amount}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Gateway: <strong>{selectedTicket.order_details.payment_gateway || 'UPI / Card'}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 800 }}>
                      TXN: {selectedTicket.order_details.transaction_reference || 'VERIFIED-SETTLED'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>
                  No linked order attached to this ticket (general account or platform inquiry).
                </div>
              )}

              {/* Resolution Summary (If resolved) */}
              {selectedTicket.resolution_summary && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803D', marginBottom: '2px' }}>
                    VERIFIED RESOLUTION SUMMARY
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#166534', lineHeight: 1.5 }}>
                    {selectedTicket.resolution_summary}
                  </div>
                </div>
              )}

              {/* Message Thread with Internal Notes clearly tagged */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6E6259', textTransform: 'uppercase' }}>
                  THREAD TIMELINE & EVIDENCE
                </div>

                {selectedTicket.messages && selectedTicket.messages.map(msg => {
                  const isInternal = msg.is_internal_note;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isInternal ? '#FAF5FF' : '#F8FAFC',
                        border: isInternal ? '1.5px solid #E9D5FF' : '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#241A17' }}>
                            {msg.sender_name}
                          </span>
                          <span style={{ background: '#E2E8F0', padding: '1px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>
                            {msg.sender_role}
                          </span>
                          {isInternal && (
                            <span style={{ background: '#7C3AED', color: '#FFFFFF', padding: '1px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Lock size={10} />
                              INTERNAL SUPPORT NOTE (HIDDEN)
                            </span>
                          )}
                        </div>
                        <span style={{ color: '#94A3B8' }}>
                          {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', color: isInternal ? '#581C87' : '#1E293B', lineHeight: 1.5 }}>
                        {msg.message}
                      </div>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                color: '#0284C7',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              <Paperclip size={12} />
                              <span>{att.file_name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Audit Trail Log */}
              {selectedTicket.audit_logs && selectedTicket.audit_logs.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6E6259', marginBottom: '8px' }}>
                    AUDIT TRAIL ({selectedTicket.audit_logs.length} EVENTS)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedTicket.audit_logs.map(log => (
                      <div key={log.id} style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#241A17' }}>[{log.action}]</span>
                        <span>by {log.actor_name || 'System'}:</span>
                        <span>{log.notes}</span>
                        <span style={{ color: '#94A3B8', marginLeft: 'auto' }}>
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Reply / Internal Note Input Form */}
            {selectedTicket.status !== 'CLOSED' && (
              <form onSubmit={handleSendReply} style={{
                padding: '16px 24px',
                borderTop: '1.5px solid #E5E7EB',
                background: '#FAF8F5',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {replyError && (
                  <div style={{ fontSize: '0.8rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} />
                    <span>{replyError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, color: isInternalNote ? '#7C3AED' : '#6E6259' }}>
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      style={{ accentColor: '#7C3AED', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <Lock size={13} />
                    <span>Post as Internal Support Note (Hidden from Customer & Merchant)</span>
                  </label>
                </div>

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
                      background: replyFile ? '#E0F2FE' : '#FFFFFF',
                      border: '1.5px solid #D1C7BD',
                      padding: '10px',
                      borderRadius: '12px',
                      color: replyFile ? '#0284C7' : '#6E6259',
                      cursor: 'pointer'
                    }}
                    title="Attach Evidence"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={isInternalNote ? "Write private staff note..." : "Write customer/merchant-visible response..."}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: isInternalNote ? '1.5px solid #A855F7' : '1.5px solid #D1C7BD',
                      background: isInternalNote ? '#FAF5FF' : '#FFFFFF',
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
                      background: isSubmittingReply ? '#9CA3AF' : (isInternalNote ? '#7C3AED' : '#F45B32'),
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: isSubmittingReply ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingReply ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                    <span>{isInternalNote ? 'Save Note' : 'Send'}</span>
                  </button>
                </div>

                {replyFile && (
                  <div style={{ fontSize: '0.75rem', color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            )}

          </div>
        </div>
      )}

      {/* MODAL: ESCALATE TICKET */}
      {escalateModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900, color: '#B91C1C' }}>
              Escalate Dispute Ticket
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#6E6259' }}>
              Provide the reason for escalating to senior management/safety coordinator.
            </p>

            <form onSubmit={handleEscalate}>
              <textarea
                rows={3}
                placeholder="e.g. Severe delivery tampering allegation / customer disputing restaurant handover..."
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #D1C7BD',
                  fontSize: '0.85rem',
                  outline: 'none',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEscalateModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '10px', background: '#F3F4F6', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEscalate || !escalationReason.trim()}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: '#B91C1C',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE TICKET (Requires resolution summary) */}
      {resolveModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900, color: '#15803D' }}>
              Mark Ticket Resolved
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: '#6E6259', lineHeight: 1.5 }}>
              A mandatory resolution summary is required. Note: Dispute resolution records the support outcome; financial refunds must be executed through the verified gateway workflow.
            </p>

            {resolveError && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 700 }}>
                {resolveError}
              </div>
            )}

            <form onSubmit={handleResolve}>
              <textarea
                rows={4}
                placeholder="Summarize the resolution (e.g. Merchant verified missing item; ₹120 coupon compensation issued to customer wallet; packaging feedback logged)."
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #D1C7BD',
                  fontSize: '0.88rem',
                  outline: 'none',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '10px', background: '#F3F4F6', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolve || !resolutionSummary.trim()}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: '#15803D',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
