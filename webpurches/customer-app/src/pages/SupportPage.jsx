import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  FileText, 
  Upload, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  X, 
  ChevronRight, 
  User, 
  Store, 
  Bike, 
  PhoneCall, 
  HelpCircle,
  Paperclip,
  Check,
  Send
} from 'lucide-react';
import { 
  fetchCustomerTickets,
  fetchCustomerTicketDetail,
  createCustomerTicket,
  replyCustomerTicket,
  confirmCustomerTicketResolution,
  fetchCustomerEligibleOrders,
  fetchCallRequests,
  createCallRequest,
  cancelCallRequest
} from '../services/api.js';
import { useCustomer } from '../context/CustomerContext.jsx';

const CATEGORIES = [
  { id: 'MISSING_ITEMS', label: 'Missing Items', labelTa: 'விடுபட்ட பொருட்கள்', icon: '📦' },
  { id: 'INCORRECT_ITEMS', label: 'Incorrect Food', labelTa: 'தவறான உணவு', icon: '🍲' },
  { id: 'DAMAGED_FOOD', label: 'Damaged / Spilled', labelTa: 'சேதமடைந்த உணவு', icon: '⚠️' },
  { id: 'DELIVERY_DELAY', label: 'Delivery Delay', labelTa: 'டெலிவரி தாமதம்', icon: '⏱️' },
  { id: 'CANCELLATION', label: 'Order Cancellation', labelTa: 'ஆர்டர் ரத்து', icon: '❌' },
  { id: 'PAYMENT_ISSUE', label: 'Payment Problem', labelTa: 'கட்டணப் பிரச்சனை', icon: '💳' },
  { id: 'ACCOUNT_ISSUE', label: 'Account & Profile', labelTa: 'கணக்கு விவகாரம்', icon: '👤' },
  { id: 'OTHER', label: 'Other Inquiries', labelTa: 'பிற உதவிகள்', icon: '💬' }
];

export const SupportPage = ({ initialOrderNumber = null, onBackToOrders }) => {
  const { currentUser, language = 'en' } = useCustomer();
  const isTamil = language === 'ta';

  // State
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'new'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  // New Ticket Form State
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [newCategory, setNewCategory] = useState('MISSING_ITEMS');
  const [newPriority, setNewPriority] = useState('NORMAL');
  const [newOrderNumber, setNewOrderNumber] = useState(initialOrderNumber || '');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEvidenceFile, setNewEvidenceFile] = useState(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newTicketError, setNewTicketError] = useState(null);
  const [newTicketSuccess, setNewTicketSuccess] = useState(null);

  // Callback requests (real backend workflow, no telephony provider)
  const [calls, setCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState(null);
  const [callTopic, setCallTopic] = useState('ORDER_HELP');
  const [callPhone, setCallPhone] = useState('');
  const [callSubject, setCallSubject] = useState('');
  const [callOrderNumber, setCallOrderNumber] = useState('');
  const [isRequestingCall, setIsRequestingCall] = useState(false);
  const [callMsg, setCallMsg] = useState(null);

  const loadCalls = async () => {
    setCallsLoading(true);
    setCallsError(null);
    try {
      setCalls(await fetchCallRequests());
    } catch (err) {
      setCallsError(err?.message || 'Failed to load callback requests');
    } finally {
      setCallsLoading(false);
    }
  };

  const handleRequestCall = async (e) => {
    e.preventDefault();
    setIsRequestingCall(true);
    setCallMsg(null);
    try {
      const created = await createCallRequest({
        topic: callTopic, phone: callPhone.trim(), subject: callSubject.trim(),
        order_number: callOrderNumber.trim() || undefined
      });
      setCallPhone('');
      setCallSubject('');
      setCallOrderNumber('');
      setCallMsg({ type: 'success', text: `Callback requested (${created.request_number}). An agent will call you back.` });
      await loadCalls();
    } catch (err) {
      setCallMsg({ type: 'error', text: err?.message || 'Failed to request callback' });
    } finally {
      setIsRequestingCall(false);
    }
  };

  const handleCancelCall = async (id) => {
    try {
      await cancelCallRequest(id);
      await loadCalls();
    } catch (err) {
      setCallMsg({ type: 'error', text: err?.message || 'Failed to cancel request' });
    }
  };

  const fileInputRef = useRef(null);
  const newFileInputRef = useRef(null);

  // Load Tickets
  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await fetchCustomerTickets(params);
      setTickets(res?.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(isTamil ? 'டிக்கெட்டுகளை ஏற்றுவதில் பிழை.' : 'Unable to load support tickets. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, searchQuery]);

  // Load eligible orders for dispute
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await fetchCustomerEligibleOrders();
        setEligibleOrders(orders || []);
      } catch (err) {
        console.error('Failed to load eligible orders', err);
      }
    };
    loadOrders();
  }, []);

  // Set initial order if provided from Orders Page
  useEffect(() => {
    if (initialOrderNumber) {
      setNewOrderNumber(initialOrderNumber);
      setActiveTab('new');
    }
  }, [initialOrderNumber]);

  // Open Ticket Detail
  const handleOpenTicket = async (ticketNumber) => {
    try {
      setLoadingDetail(true);
      setReplyError(null);
      const detail = await fetchCustomerTicketDetail(ticketNumber);
      setSelectedTicket(detail);
    } catch (err) {
      setReplyError(isTamil ? 'டிக்கெட் விவரங்களை ஏற்றுவதில் தோல்வி.' : 'Failed to load ticket details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() && !replyFile) return;

    try {
      setIsSubmittingReply(true);
      setReplyError(null);

      const formData = new FormData();
      if (replyMessage.trim()) formData.append('message', replyMessage.trim());
      if (replyFile) formData.append('file', replyFile);

      const updated = await replyCustomerTicket(selectedTicket.ticket_number, formData);
      setSelectedTicket(updated);
      setReplyMessage('');
      setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadTickets(); // Refresh list count/status
    } catch (err) {
      const msg = err?.message || err?.detail || err?.file || (isTamil ? 'பதில் அனுப்புவதில் தோல்வி.' : 'Failed to send reply.');
      setReplyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Confirm Resolution or Reopen
  const handleResolutionAction = async (action, notes = '') => {
    try {
      setIsSubmittingReply(true);
      const updated = await confirmCustomerTicketResolution(selectedTicket.ticket_number, action, notes);
      setSelectedTicket(updated);
      loadTickets();
    } catch (err) {
      setReplyError(err?.detail || err?.message || (isTamil ? 'செயல்பாடு தோல்வியடைந்தது.' : 'Action failed.'));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Submit New Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      setNewTicketError(isTamil ? 'பொருள் தலைப்பு தேவை.' : 'Subject line is required.');
      return;
    }
    if (!newDescription.trim() && !newEvidenceFile) {
      setNewTicketError(isTamil ? 'விளக்கம் அல்லது புகைப்பட ஆதாரம் தேவை.' : 'Please provide an issue description or evidence attachment.');
      return;
    }

    try {
      setIsSubmittingNew(true);
      setNewTicketError(null);
      setNewTicketSuccess(null);

      const formData = new FormData();
      formData.append('category', newCategory);
      formData.append('priority', newPriority);
      formData.append('subject', newSubject.trim());
      if (newDescription.trim()) formData.append('description', newDescription.trim());
      if (newOrderNumber) formData.append('order_number', newOrderNumber);
      if (newEvidenceFile) formData.append('evidence_file', newEvidenceFile);
      formData.append('idempotency_key', `tkt-${Date.now()}-${Math.random().toString(36).substring(7)}`);

      const res = await createCustomerTicket(formData);
      setNewTicketSuccess(isTamil ? `டிக்கெட் #${res.ticket_number} வெற்றிகரமாக உருவாக்கப்பட்டது!` : `Ticket #${res.ticket_number} created successfully! Our team is reviewing it.`);
      
      // Reset form
      setNewSubject('');
      setNewDescription('');
      setNewEvidenceFile(null);
      if (newFileInputRef.current) newFileInputRef.current.value = '';

      // Reload list and switch to tickets tab after 1.5s
      setTimeout(() => {
        loadTickets();
        setActiveTab('tickets');
        setNewTicketSuccess(null);
      }, 1500);

    } catch (err) {
      const msg = err?.order_number || err?.detail || err?.evidence_file || err?.message || (isTamil ? 'டிக்கெட் உருவாக்குவதில் பிழை.' : 'Failed to create support ticket.');
      setNewTicketError(Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : JSON.stringify(msg)));
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Helper status color badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { bg: '#E0F2FE', color: '#0369A1', label: isTamil ? 'திறந்துள்ளது' : 'Open' };
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', color: '#B45309', label: isTamil ? 'செயல்பாட்டில்' : 'In Progress' };
      case 'WAITING_CUSTOMER':
        return { bg: '#FCE7F3', color: '#BE185D', label: isTamil ? 'உங்கள் பதில் தேவை' : 'Awaiting Reply' };
      case 'ESCALATED':
        return { bg: '#FEE2E2', color: '#B91C1C', label: isTamil ? 'தீவிரப்படுத்தப்பட்டது' : 'Escalated' };
      case 'RESOLVED':
        return { bg: '#DCFCE7', color: '#15803D', label: isTamil ? 'தீர்க்கப்பட்டது' : 'Resolved' };
      case 'CLOSED':
        return { bg: '#F3F4F6', color: '#4B5563', label: isTamil ? 'மூடப்பட்டது' : 'Closed' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', label: status };
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return { bg: '#FEE2E2', color: '#DC2626', label: isTamil ? 'அவசரம்' : 'Urgent' };
      case 'HIGH':
        return { bg: '#FFEDD5', color: '#EA580C', label: isTamil ? 'முக்கியம்' : 'High' };
      default:
        return { bg: '#E0F2FE', color: '#0284C7', label: isTamil ? 'சாதாரணம்' : 'Normal' };
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Top Banner / Title */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '24px',
        padding: '28px 32px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', marginBottom: '10px' }}>
            <ShieldCheck size={14} />
            {isTamil ? 'உறுதிப்படுத்தப்பட்ட வாடிக்கையாளர் பாதுகாப்பு' : 'Verified Dispute Resolution & Customer Care'}
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            {isTamil ? 'வாடிக்கையாளர் ஆதரவு மையம்' : 'Customer Support & Dispute Mediation'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.5 }}>
            {isTamil 
              ? 'உங்கள் உணவு அல்லது டெலிவரி தொடர்பான பிரச்சனைகளை பாதுகாப்பாக தீர்க்கவும். உத்தரவாதமான தீர்வு மற்றும் கண்காணிப்பு.'
              : 'Transparent, accountable resolution for order delays, missing items, damaged food, and refund inquiries.'}
          </p>
        </div>

        {/* 24/7 Operations Hotline */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <PhoneCall size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
              {isTamil ? '24/7 நேரடி உதவி' : '24/7 DISPATCH HOTLINE'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF' }}>
              1800-419-FOOD
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: My Tickets vs Raise New Ticket */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ws-border, #E2E8F0)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'tickets' ? '#22C55E' : 'transparent',
              color: activeTab === 'tickets' ? '#FFFFFF' : 'var(--ws-text-secondary, #64748B)',
              transition: 'all 0.2s'
            }}
          >
            <MessageSquare size={17} />
            {isTamil ? 'எனது டிக்கெட்டுகள்' : 'My Support Tickets'}
            {tickets.length > 0 && (
              <span style={{
                background: activeTab === 'tickets' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {tickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'new' ? '#22C55E' : 'transparent',
              color: activeTab === 'new' ? '#FFFFFF' : 'var(--ws-text-secondary, #64748B)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={17} />
            {isTamil ? 'புதிய பிரச்சனை பதிவு' : 'Raise New Ticket / Dispute'}
          </button>

          <button
            onClick={() => { setActiveTab('calls'); loadCalls(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'calls' ? '#22C55E' : 'transparent',
              color: activeTab === 'calls' ? '#FFFFFF' : 'var(--ws-text-secondary, #64748B)',
              transition: 'all 0.2s'
            }}
          >
            <PhoneCall size={17} />
            Request Callback
          </button>
        </div>

        {onBackToOrders && (
          <button
            onClick={onBackToOrders}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#22C55E',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isTamil ? 'ஆர்டர்களுக்கு திரும்பு' : 'Back to Orders'}
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* TAB 1: MY TICKETS LIST */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filters & Search */}
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
                    borderColor: statusFilter === st ? '#22C55E' : 'var(--ws-border, #CBD5E1)',
                    background: statusFilter === st ? 'rgba(34, 197, 94, 0.12)' : 'var(--ws-surface, #FFFFFF)',
                    color: statusFilter === st ? '#15803D' : 'var(--ws-text-secondary, #64748B)'
                  }}
                >
                  {st === 'ALL' && (isTamil ? 'அனைத்தும்' : 'All')}
                  {st === 'OPEN' && (isTamil ? 'திறந்துள்ளது' : 'Open')}
                  {st === 'IN_PROGRESS' && (isTamil ? 'செயல்பாட்டில்' : 'In Progress')}
                  {st === 'WAITING_CUSTOMER' && (isTamil ? 'பதில் தேவை' : 'Awaiting Reply')}
                  {st === 'RESOLVED' && (isTamil ? 'தீர்க்கப்பட்டது' : 'Resolved')}
                  {st === 'CLOSED' && (isTamil ? 'மூடப்பட்டது' : 'Closed')}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                placeholder={isTamil ? 'டிக்கெட் / ஆர்டர் எண் தேடு...' : 'Search ticket or order #...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border, #CBD5E1)',
                  background: 'var(--ws-surface, #FFFFFF)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  color: 'var(--ws-text, #0F172A)'
                }}
              />
            </div>
          </div>

          {/* Loading / Error States */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <div>{isTamil ? 'டிக்கெட்டுகள் ஏற்றப்படுகின்றன...' : 'Loading your tickets...'}</div>
            </div>
          )}

          {error && (
            <div style={{ padding: '16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && tickets.length === 0 && (
            <div style={{
              background: 'var(--ws-surface, #FFFFFF)',
              border: '1px dashed var(--ws-border, #CBD5E1)',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Headphones size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ws-text, #0F172A)' }}>
                {isTamil ? 'டிக்கெட்டுகள் எதுவும் இல்லை' : 'No Support Tickets Found'}
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
                {isTamil ? 'உங்களுக்கு ஏதேனும் உதவி தேவைப்பட்டால் புதிய டிக்கெட்டை பதிவு செய்யுங்கள்.' : 'Have an issue with an order or your account? Create a dispute ticket now.'}
              </p>
              <button
                onClick={() => setActiveTab('new')}
                style={{
                  background: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {isTamil ? 'புதிய டிக்கெட் உருவாக்கு' : 'Create a Support Ticket'}
              </button>
            </div>
          )}

          {/* Ticket Cards Grid */}
          {!loading && !error && tickets.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
              {tickets.map((tkt) => {
                const stBadge = getStatusBadge(tkt.status);
                const prBadge = getPriorityBadge(tkt.priority);
                const catInfo = CATEGORIES.find(c => c.id === tkt.category) || { icon: '💬', label: tkt.category_display || tkt.category };

                return (
                  <div
                    key={tkt.id}
                    onClick={() => handleOpenTicket(tkt.ticket_number)}
                    style={{
                      background: 'var(--ws-surface, #FFFFFF)',
                      border: '1px solid var(--ws-border, #E2E8F0)',
                      borderRadius: '18px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22C55E'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ws-border, #E2E8F0)'}
                  >
                    <div>
                      {/* Top Row: Ticket Number & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>
                          #{tkt.ticket_number}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ background: prBadge.bg, color: prBadge.color, fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                            {prBadge.label}
                          </span>
                          <span style={{ background: stBadge.bg, color: stBadge.color, fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                            {stBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* Subject */}
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--ws-text, #0F172A)' }}>
                        {tkt.subject}
                      </h4>

                      {/* Category & Order Badge */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{catInfo.icon}</span>
                          <span>{isTamil && catInfo.labelTa ? catInfo.labelTa : catInfo.label}</span>
                        </span>

                        {tkt.order_number && (
                          <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                            Order #{tkt.order_number}
                          </span>
                        )}
                      </div>

                      {/* Latest Message Preview */}
                      {tkt.latest_message && (
                        <div style={{ marginTop: '12px', padding: '10px', background: '#F8FAFC', borderRadius: '10px', fontSize: '0.8rem', color: '#475569' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748B', marginBottom: '2px' }}>
                            {tkt.latest_message.sender_name} ({tkt.latest_message.sender_role}):
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tkt.latest_message.message}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px', fontSize: '0.75rem', color: '#94A3B8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {new Date(tkt.created_at).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22C55E', fontWeight: 700 }}>
                        {isTamil ? 'உரையாடலை பார்க்க' : 'View Thread'}
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RAISE NEW TICKET / DISPUTE FORM */}
      {activeTab === 'new' && (
        <div style={{
          background: 'var(--ws-surface, #FFFFFF)',
          border: '1px solid var(--ws-border, #E2E8F0)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px 0', color: 'var(--ws-text, #0F172A)' }}>
            {isTamil ? 'புதிய பிரச்சனை டிக்கெட் உருவாக்கு' : 'Raise a Support Request or Order Dispute'}
          </h2>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.88rem', color: '#64748B' }}>
            {isTamil 
              ? 'உங்கள் உணவு அல்லது கட்டணம் தொடர்பான விபரங்களை சமர்ப்பிக்கவும். எங்கள் குழு உடனடியாக கவனிக்கும்.' 
              : 'Our operations team reviews all disputes with verified merchants and riders. Provide accurate details below.'}
          </p>

          {newTicketSuccess && (
            <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#15803D', borderRadius: '14px', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} />
              <span>{newTicketSuccess}</span>
            </div>
          )}

          {newTicketError && (
            <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '14px', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              <span>{newTicketError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* 1. Category Grid Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
                {isTamil ? '1. பிரச்சனை வகை தேர்வு செய்யவும்' : '1. Select Issue Category'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {CATEGORIES.map((cat) => {
                  const isSel = newCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid',
                        borderColor: isSel ? '#22C55E' : 'var(--ws-border, #E2E8F0)',
                        background: isSel ? 'rgba(34, 197, 94, 0.08)' : 'var(--ws-surface, #FFFFFF)',
                        color: isSel ? '#15803D' : 'var(--ws-text, #334155)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: isSel ? 800 : 600,
                        fontSize: '0.85rem',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                      <span>{isTamil && cat.labelTa ? cat.labelTa : cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Link Eligible Order (Optional/Recommended) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                {isTamil ? '2. தொடர்புடைய ஆர்டர் (இருந்தால்)' : '2. Link Related Order (Optional)'}
              </label>
              <select
                value={newOrderNumber}
                onChange={(e) => setNewOrderNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border, #CBD5E1)',
                  background: 'var(--ws-surface, #FFFFFF)',
                  fontSize: '0.9rem',
                  color: 'var(--ws-text, #0F172A)',
                  outline: 'none'
                }}
              >
                <option value="">{isTamil ? '-- குறிப்பிட்ட ஆர்டர் இல்லை / கணக்கு சம்பந்தமானது --' : '-- No Specific Order / General Account Inquiry --'}</option>
                {eligibleOrders.map((ord) => (
                  <option key={ord.id} value={ord.order_number}>
                    Order #{ord.order_number} • {ord.restaurant_name} • ₹{ord.total_amount} ({ord.status})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Priority Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                {isTamil ? '3. முன்னுரிமை நிலை' : '3. Priority Level'}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { id: 'NORMAL', label: isTamil ? 'சாதாரணம்' : 'Normal', desc: 'Standard response' },
                  { id: 'HIGH', label: isTamil ? 'முக்கியம்' : 'High', desc: 'Active delivery delay' },
                  { id: 'URGENT', label: isTamil ? 'அவசரம்' : 'Urgent', desc: 'Safety/severe issue' }
                ].map((p) => {
                  const isSel = newPriority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPriority(p.id)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid',
                        borderColor: isSel ? '#22C55E' : 'var(--ws-border, #E2E8F0)',
                        background: isSel ? 'rgba(34, 197, 94, 0.08)' : 'var(--ws-surface, #FFFFFF)',
                        color: isSel ? '#15803D' : '#64748B',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Subject Line */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                {isTamil ? '4. பொருள் தலைப்பு' : '4. Subject Line'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder={isTamil ? 'எ.கா: பிரியாணியில் ரசம் மற்றும் அப்பளம் விடுபட்டுள்ளது' : 'e.g. Missing extra beverage and cutlery from Burger House'}
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border, #CBD5E1)',
                  background: 'var(--ws-surface, #FFFFFF)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: 'var(--ws-text, #0F172A)'
                }}
              />
            </div>

            {/* 5. Detailed Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                {isTamil ? '5. பிரச்சனையின் விரிவான விளக்கம்' : '5. Factual Description'}
              </label>
              <textarea
                rows={4}
                placeholder={isTamil ? 'நடந்ததை தெளிவாக விவரிக்கவும்...' : 'Please describe what happened, what items were affected, or details of delay...'}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border, #CBD5E1)',
                  background: 'var(--ws-surface, #FFFFFF)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: 'var(--ws-text, #0F172A)',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 6. Evidence File Attachment */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                {isTamil ? '6. புகைப்பட ஆதாரம் (விரும்பினால்)' : '6. Photo / Document Evidence (Optional)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <input
                  type="file"
                  ref={newFileInputRef}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setNewEvidenceFile(e.target.files[0] || null)}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => newFileInputRef.current && newFileInputRef.current.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1px solid var(--ws-border, #CBD5E1)',
                    background: '#F8FAFC',
                    color: '#334155',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={16} />
                  {isTamil ? 'கோப்பு தேர்வு செய்' : 'Choose File (Max 5MB)'}
                </button>
                {newEvidenceFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#15803D', fontWeight: 600 }}>
                    <Check size={16} />
                    <span>{newEvidenceFile.name} ({(newEvidenceFile.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewEvidenceFile(null);
                        if (newFileInputRef.current) newFileInputRef.current.value = '';
                      }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
                Supported formats: JPG, PNG, WEBP, PDF (Max 5MB). Executable files are strictly blocked.
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: '1px solid var(--ws-border, #CBD5E1)',
                  background: 'transparent',
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer'
                }}
              >
                {isTamil ? 'ரத்து செய்' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmittingNew}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: isSubmittingNew ? '#94A3B8' : '#22C55E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: isSubmittingNew ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
                }}
              >
                {isSubmittingNew && <RefreshCw size={16} className="animate-spin" />}
                {isTamil ? 'டிக்கெட்டை சமர்ப்பிக்கவும்' : 'Submit Support Ticket'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: TICKET CONVERSATION THREAD & RESOLUTION */}
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
            background: 'var(--ws-surface, #FFFFFF)',
            borderRadius: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--ws-border, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', color: '#0F172A' }}>
                    #{selectedTicket.ticket_number}
                  </span>
                  <span style={{ ...getStatusBadge(selectedTicket.status), fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                    {getStatusBadge(selectedTicket.status).label}
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedTicket.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Linked Order Card (if any) */}
              {selectedTicket.order_details && (
                <div style={{
                  background: '#F1F5F9',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                      {isTamil ? 'இணைக்கப்பட்ட ஆர்டர்' : 'LINKED DISPUTE ORDER'}
                    </div>
                    <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.95rem' }}>
                      Order #{selectedTicket.order_details.order_number} • {selectedTicket.order_details.restaurant_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Verified Paid: ₹{selectedTicket.order_details.total_amount}
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      {selectedTicket.order_details.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Resolved Box (if RESOLVED) */}
              {selectedTicket.status === 'RESOLVED' && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '16px',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
                    <CheckCircle2 size={18} />
                    <span>{isTamil ? 'டிக்கெட் தீர்க்கப்பட்டது' : 'Ticket Marked Resolved by Operations'}</span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#166534', lineHeight: 1.5 }}>
                    {selectedTicket.resolution_summary}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleResolutionAction('confirm_resolve')}
                      disabled={isSubmittingReply}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isTamil ? 'தீர்வை ஏற்று மூடு' : 'Confirm & Close Ticket'}
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt(isTamil ? 'மறுதிறப்பு காரணத்தை குறிப்பிடவும்:' : 'Reason for reopening:');
                        if (note) handleResolutionAction('reopen', note);
                      }}
                      disabled={isSubmittingReply}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'transparent',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isTamil ? 'மீண்டும் திறக்கவும்' : 'Reopen Ticket'}
                    </button>
                  </div>
                </div>
              )}

              {/* Message Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isTamil ? 'உரையாடல் வரலாறு' : 'Conversation Timeline'}
                </div>

                {selectedTicket.messages && selectedTicket.messages.map((msg) => {
                  const isMe = msg.sender_role === 'CUSTOMER';
                  const isAgent = msg.sender_role === 'SUPPORT_AGENT' || msg.sender_role === 'ADMIN';
                  const isRest = msg.sender_role === 'RESTAURANT';
                  const isRider = msg.sender_role === 'DELIVERY_PARTNER';

                  let roleBadge = { bg: '#E2E8F0', color: '#475569', label: msg.sender_role };
                  if (isMe) roleBadge = { bg: '#DCFCE7', color: '#15803D', label: isTamil ? 'நீங்கள்' : 'You' };
                  else if (isAgent) roleBadge = { bg: '#E0F2FE', color: '#0369A1', label: isTamil ? 'ஆதரவு பிரதிநிதி' : 'Support Agent' };
                  else if (isRest) roleBadge = { bg: '#FEF3C7', color: '#B45309', label: isTamil ? 'உணவகம்' : 'Restaurant Partner' };
                  else if (isRider) roleBadge = { bg: '#FFEDD5', color: '#C2410C', label: isTamil ? 'டெலிவரி ரைடர்' : 'Delivery Partner' };

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94A3B8' }}>
                        <span style={{ background: roleBadge.bg, color: roleBadge.color, padding: '1px 8px', borderRadius: '999px', fontWeight: 700 }}>
                          {roleBadge.label}
                        </span>
                        <span>{msg.sender_name}</span>
                        <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isMe ? '#22C55E' : '#F1F5F9',
                        color: isMe ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        borderBottomRightRadius: isMe ? '4px' : '16px',
                        borderBottomLeftRadius: isMe ? '16px' : '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        {msg.message}

                        {/* Attachments */}
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
                                  background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                                  color: isMe ? '#FFFFFF' : '#0284C7',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  textDecoration: 'none'
                                }}
                              >
                                <Paperclip size={13} />
                                <span>{att.file_name} ({(att.file_size / 1024).toFixed(0)} KB)</span>
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

            {/* Modal Reply Form (If Not Closed) */}
            {selectedTicket.status !== 'CLOSED' && (
              <form onSubmit={handleSendReply} style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--ws-border, #E2E8F0)',
                background: '#FFFFFF',
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
                      background: replyFile ? '#DCFCE7' : '#F1F5F9',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '12px',
                      color: replyFile ? '#15803D' : '#64748B',
                      cursor: 'pointer'
                    }}
                    title="Attach Evidence Photo/PDF"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={isTamil ? 'பதில் எழுதவும்...' : 'Type your reply message...'}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--ws-border, #CBD5E1)',
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
                      background: isSubmittingReply ? '#94A3B8' : '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isSubmittingReply ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingReply ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                    {isTamil ? 'அனுப்பு' : 'Send'}
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

            {selectedTicket.status === 'CLOSED' && (
              <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                {isTamil ? 'இந்த ஆதரவு டிக்கெட் தீர்க்கப்பட்டு மூடப்பட்டது.' : 'This support ticket has been resolved and closed.'}
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 3: CALLBACK REQUESTS (real workflow, no telephony provider) */}
      {activeTab === 'calls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--ws-surface, #FFFFFF)',
            border: '1px solid var(--ws-border, #E2E8F0)',
            borderRadius: '24px',
            padding: '28px'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 6px 0' }}>
              Request a Callback
            </h2>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.86rem', color: '#64748B' }}>
              No internet calling here — a support agent calls you back on your number and records the outcome.
            </p>
            {callMsg && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontWeight: 700, fontSize: '0.85rem',
                background: callMsg.type === 'error' ? '#FEE2E2' : '#DCFCE7',
                color: callMsg.type === 'error' ? '#B91C1C' : '#15803D'
              }}>
                {callMsg.text}
              </div>
            )}
            <form onSubmit={handleRequestCall} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Topic
                <select value={callTopic} onChange={e => setCallTopic(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--ws-border, #CBD5E1)' }}>
                  <option value="ORDER_HELP">Order help</option>
                  <option value="PAYMENT_HELP">Payment help</option>
                  <option value="ACCOUNT_HELP">Account help</option>
                  <option value="PARTNER_HELP">Partner/restaurant help</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Callback number *
                <input value={callPhone} onChange={e => setCallPhone(e.target.value)} placeholder="10-15 digit mobile"
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--ws-border, #CBD5E1)', boxSizing: 'border-box' }} />
              </label>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Order number (optional)
                <input value={callOrderNumber} onChange={e => setCallOrderNumber(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--ws-border, #CBD5E1)', boxSizing: 'border-box' }} />
              </label>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Subject
                <input value={callSubject} onChange={e => setCallSubject(e.target.value)} placeholder="Brief reason"
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--ws-border, #CBD5E1)', boxSizing: 'border-box' }} />
              </label>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" disabled={isRequestingCall}
                  style={{ padding: '10px 22px', borderRadius: '12px', border: 'none', background: '#22C55E', color: '#fff', fontWeight: 800, cursor: isRequestingCall ? 'wait' : 'pointer' }}>
                  {isRequestingCall ? 'Requesting…' : 'Request Callback'}
                </button>
              </div>
            </form>
          </div>

          <div style={{
            background: 'var(--ws-surface, #FFFFFF)',
            border: '1px solid var(--ws-border, #E2E8F0)',
            borderRadius: '24px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 12px 0' }}>My Callback Requests</h3>
            {callsLoading && <div style={{ color: '#64748B' }}>Loading…</div>}
            {callsError && <div style={{ color: '#B91C1C', fontWeight: 700 }}>{callsError}</div>}
            {!callsLoading && !callsError && calls.length === 0 && (
              <div style={{ color: '#64748B' }}>No callback requests yet.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {calls.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 16px', borderRadius: '14px', background: 'var(--ws-surface-subtle, #F8FAFC)', border: '1px solid var(--ws-border, #E2E8F0)' }}>
                  <div style={{ fontSize: '0.84rem' }}>
                    <strong>{c.request_number}</strong> · {c.topic} · {c.status}
                    {c.outcome ? ` · ${c.outcome}` : ''}
                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</div>
                  </div>
                  {!['COMPLETED', 'CANCELLED'].includes(c.status) && (
                    <button type="button" onClick={() => handleCancelCall(c.id)}
                      style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontWeight: 700, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
