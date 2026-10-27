import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  PhoneCall, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Paperclip,
  Clock,
  Search,
  RefreshCw,
  X,
  ChevronRight,
  ShieldAlert,
  Upload,
  Check
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { 
  fetchDeliveryTickets, 
  fetchDeliveryTicketDetail, 
  replyDeliveryTicket 
} from '../services/api.js';

export const SupportPage = () => {
  const { showToast } = useDelivery();
  const [subTab, setSubTab] = useState('complaints'); // 'complaints' or 'hotline'

  // Complaints / Dispute Tickets State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState(null);
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

  // AI Assistant Chat State (Operations guidance)
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello Arun. I am your Operations Dispatch AI Assistant. I can resolve active delivery delays, payout inquiries, or route issues. How can I help you right now?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [faqExpanded, setFaqExpanded] = useState(null);

  // Load Real Delivery Tickets from Backend
  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      setTicketError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await fetchDeliveryTickets(params);
      setTickets(res?.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      setTicketError('Unable to load assigned delivery complaints.');
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, searchQuery]);

  const handleOpenTicket = async (ticketNumber) => {
    try {
      setLoadingDetail(true);
      setReplyError(null);
      const detail = await fetchDeliveryTicketDetail(ticketNumber);
      setSelectedTicket(detail);
    } catch (err) {
      setReplyError(err?.message || 'Failed to load complaint details.');
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

      const updated = await replyDeliveryTicket(selectedTicket.ticket_number, formData);
      setSelectedTicket(updated);
      setReplyMessage('');
      setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (showToast) showToast('Delivery explanation submitted successfully', 'success');
      loadTickets();
    } catch (err) {
      const msg = err?.message || err?.detail || 'Failed to submit delivery explanation.';
      setReplyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    setTimeout(() => {
      let reply = "I have classified your inquiry. If you are experiencing a wait time exceeding 10 minutes at the merchant, waiting compensation will automatically apply to your shift payout.";
      if (userText.toLowerCase().includes('otp') || userText.toLowerCase().includes('pin')) {
        reply = "If the customer is unable to locate their 4-digit PIN, you can switch to Doorstep Photo Proof on the verification screen to complete the handover.";
      } else if (userText.toLowerCase().includes('pay') || userText.toLowerCase().includes('money') || userText.toLowerCase().includes('wallet')) {
        reply = "Instant IMPS withdrawals settle in under 10 minutes to your verified bank account. Zero transaction fees apply for Tier 1 partners.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  const faqs = [
    { q: 'How does the 1.25x Peak Lunch multiplier calculate?', a: 'All deliveries accepted within the designated lunch window (11:30 AM – 03:30 PM) automatically have a 25% base fare multiplier applied upon successful completion.' },
    { q: 'What happens if a customer does not answer their phone?', a: 'Wait at the building entrance for 5 minutes and attempt at least 2 masked calls. If there is still no response, report "Customer Unreachable" to return the order or trigger contactless drop.' },
    { q: 'How do I submit insurance claims for vehicle repairs?', a: 'Navigate to Safety Center or Documents to access your commercial zero-dep policy number and initiate cashless repairs at partner garages.' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { bg: '#E0F2FE', color: '#0369A1', label: 'Open' };
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Under Investigation' };
      case 'WAITING_CUSTOMER':
        return { bg: '#FCE7F3', color: '#BE185D', label: 'Waiting Info' };
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

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF2EC', border: '1px solid #FFD4C2', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF5A1F' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#FF5A1F', letterSpacing: '0.5px' }}>
            OPERATIONS ASSISTANCE
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#191B1F',
          margin: 0
        }}>
          Courier Support & Dispatch Hotline
        </h1>
        <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
          Assigned delivery complaints mediation, factual responses, and 24/7 operations emergency contact.
        </div>
      </div>

      {/* 24/7 Human Hotline Quick Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #FFD4C2',
        borderRadius: '24px',
        padding: '22px 26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(255, 90, 31, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: '#FF5A1F',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 90, 31, 0.25)'
          }}>
            <PhoneCall size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF5A1F', letterSpacing: '0.5px' }}>
              EMERGENCY SOS & DISPATCH DESK
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#191B1F' }}>
              1800-419-RIDER (Toll-Free Priority Line)
            </div>
          </div>
        </div>

        <a
          href="tel:18004190000"
          style={{
            backgroundColor: '#FF5A1F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 22px',
            fontWeight: 800,
            fontSize: '0.85rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <PhoneCall size={16} />
          <span>Call Dispatch Now</span>
        </a>
      </div>

      {/* Sub Tabs: Complaints vs Operations Hotline & FAQs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          onClick={() => setSubTab('complaints')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: 'none',
            background: subTab === 'complaints' ? '#FF5A1F' : 'transparent',
            color: subTab === 'complaints' ? '#FFFFFF' : '#64748B'
          }}
        >
          <ShieldAlert size={17} />
          <span>Assigned Complaints & Disputes</span>
          {tickets.length > 0 && (
            <span style={{
              background: subTab === 'complaints' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
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
          onClick={() => setSubTab('hotline')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: 'none',
            background: subTab === 'hotline' ? '#FF5A1F' : 'transparent',
            color: subTab === 'hotline' ? '#FFFFFF' : '#64748B'
          }}
        >
          <Sparkles size={17} />
          <span>AI Dispatch Assistant & FAQs</span>
        </button>
      </div>

      {/* SUBTAB 1: ASSIGNED COMPLAINTS & DISPUTES */}
      {subTab === 'complaints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
                    borderColor: statusFilter === st ? '#FF5A1F' : '#E2E8F0',
                    background: statusFilter === st ? 'rgba(255, 90, 31, 0.12)' : '#FFFFFF',
                    color: statusFilter === st ? '#FF5A1F' : '#64748B'
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
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Loading / Error States */}
          {loadingTickets && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <div>Loading delivery complaints from dispatch database...</div>
            </div>
          )}

          {ticketError && (
            <div style={{ padding: '16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{ticketError}</span>
            </div>
          )}

          {!loadingTickets && !ticketError && tickets.length === 0 && (
            <div style={{
              background: '#FFFFFF',
              border: '1px dashed #CBD5E1',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#191B1F' }}>
                Clean Delivery Record
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
                No active complaints or order delivery disputes assigned to your profile.
              </p>
            </div>
          )}

          {/* Complaint Cards Grid */}
          {!loadingTickets && !ticketError && tickets.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
              {tickets.map((tkt) => {
                const st = getStatusBadge(tkt.status);
                return (
                  <div
                    key={tkt.id}
                    onClick={() => handleOpenTicket(tkt.ticket_number)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
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
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF5A1F'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#FF5A1F' }}>
                          #{tkt.ticket_number}
                        </span>
                        <span style={{ background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                          {st.label}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: 800, color: '#191B1F' }}>
                        {tkt.subject}
                      </h4>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          {tkt.category_display || tkt.category}
                        </span>
                        {tkt.order_number && (
                          <span style={{ fontSize: '0.75rem', background: '#FFF2EC', color: '#FF5A1F', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            Order #{tkt.order_number}
                          </span>
                        )}
                      </div>

                      {tkt.latest_message && (
                        <div style={{ marginTop: '12px', padding: '10px', background: '#F8FAFC', borderRadius: '10px', fontSize: '0.8rem', color: '#475569' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748B', marginBottom: '2px' }}>
                            {tkt.latest_message.sender_role}:
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tkt.latest_message.message}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px', fontSize: '0.75rem', color: '#94A3B8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {new Date(tkt.created_at).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF5A1F', fontWeight: 700 }}>
                        Review & Provide Facts
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

      {/* SUBTAB 2: AI DISPATCH ASSISTANT & FAQS */}
      {subTab === 'hotline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
          
          {/* Left: AI Dispatch Chat Box */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FFF2EC', color: '#FF5A1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B1F' }}>
                  AI Dispatch Coordinator
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
                  ● Active 24/7 On-Shift
                </span>
              </div>
            </div>

            <div style={{
              height: '280px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '16px'
            }}>
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: m.sender === 'user' ? '#FF5A1F' : '#FFFFFF',
                    color: m.sender === 'user' ? '#FFFFFF' : '#191B1F',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    fontSize: '0.84rem',
                    lineHeight: 1.4,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: m.sender === 'ai' ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ask about waiting payout, customer unreachable..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#FF5A1F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right: Operational FAQs */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B1F' }}>
                Standard Operating Procedures
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setFaqExpanded(faqExpanded === idx ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#F8FAFC',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      color: '#191B1F'
                    }}
                  >
                    <span>{faq.q}</span>
                    {faqExpanded === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {faqExpanded === idx && (
                    <div style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, background: '#FFFFFF' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* DETAIL MODAL (Delivery Complaint Review & Factual Response) */}
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
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#FF5A1F', fontSize: '0.95rem' }}>
                    #{selectedTicket.ticket_number}
                  </span>
                  <span style={{ ...getStatusBadge(selectedTicket.status), fontSize: '0.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px' }}>
                    {getStatusBadge(selectedTicket.status).label}
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#191B1F' }}>
                  {selectedTicket.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Linked Order Snapshot (PII Masked) */}
              {selectedTicket.order_details && (
                <div style={{
                  background: '#F1F5F9',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>ASSIGNED ORDER</div>
                    <div style={{ fontWeight: 900, color: '#191B1F', fontSize: '0.95rem' }}>
                      Order #{selectedTicket.order_details.order_number} • {selectedTicket.order_details.restaurant_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                      Customer: {selectedTicket.order_details.customer_name}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      Handover: {selectedTicket.order_details.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  DISPUTE CORRESPONDENCE
                </div>

                {selectedTicket.messages && selectedTicket.messages.map((msg) => {
                  const isRider = msg.sender_role === 'DELIVERY_PARTNER';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isRider ? 'flex-end' : 'flex-start',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94A3B8' }}>
                        <span style={{ fontWeight: 700, color: isRider ? '#FF5A1F' : '#0284C7' }}>
                          {isRider ? 'Courier Partner (You)' : msg.sender_role}
                        </span>
                        <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isRider ? '#FF5A1F' : '#F1F5F9',
                        color: isRider ? '#FFFFFF' : '#191B1F',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
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
                                  background: isRider ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                                  color: isRider ? '#FFFFFF' : '#0284C7',
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

            {/* Reply Form */}
            <form onSubmit={handleSendReply} style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
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
                    background: replyFile ? '#FFF2EC' : '#F1F5F9',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '12px',
                    color: replyFile ? '#FF5A1F' : '#64748B',
                    cursor: 'pointer'
                  }}
                  title="Upload Doorstep / Handover Proof"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder="State handover facts (e.g., handed to customer directly, contactless drop)..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
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
                    background: isSubmittingReply ? '#94A3B8' : '#FF5A1F',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: isSubmittingReply ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingReply ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>Submit</span>
                </button>
              </div>

              {replyFile && (
                <div style={{ fontSize: '0.75rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
