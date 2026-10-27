import React, { useState } from 'react';
import { 
  Power, 
  MapPin, 
  Store, 
  ArrowRight, 
  Clock, 
  Package, 
  Navigation, 
  Bell, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  FileText, 
  X, 
  Check, 
  AlertCircle,
  Truck,
  ShieldCheck,
  XCircle,
  ChevronRight,
  Key
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { PickupVerificationModal } from '../components/modals/PickupVerificationModal.jsx';
import { DeliveryVerificationModal } from '../components/modals/DeliveryVerificationModal.jsx';
import { AcceptedOrderMap } from '../components/AcceptedOrderMap.jsx';

export const DashboardPage = () => {
  const { 
    isOnline, 
    handleToggleOnline,
    availableJobs,
    realActiveTask,
    completedDeliveries,
    cancelledTasks,
    dashboardSummary,
    isLoadingJobs,
    isActionPending,
    deliveryError,
    refreshDashboardData,
    handleAcceptJob,
    handleReachedRestaurant,
    handleConfirmPickup,
    handleVerifyDeliveryOTP,
    handleReportIssue,
    currentUser,
    notifications
  } = useDelivery();

  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'jobs' | 'active' | 'pickup' | 'completed' | 'cancelled'
  const [selectedJob, setSelectedJob] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState('CUSTOMER_UNAVAILABLE');
  const [issueReason, setIssueReason] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [cancelTaskChecked, setCancelTaskChecked] = useState(false);
  const [confirmAcceptJobId, setConfirmAcceptJobId] = useState(null);

  // Phase 13 OTP & Verification Modals State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState(null);

  const sections = [
    { id: 'overview', label: 'Delivery Overview' },
    { id: 'jobs', label: 'Available Delivery Jobs', count: dashboardSummary.available_jobs },
    { id: 'active', label: 'My Active Delivery', count: dashboardSummary.active_task },
    { id: 'pickup', label: 'Pickup Tasks', count: dashboardSummary.picked_up },
    { id: 'completed', label: 'Completed Deliveries', count: dashboardSummary.completed_today },
    { id: 'cancelled', label: 'Cancelled or Failed Tasks', count: cancelledTasks.length }
  ];

  const onConfirmAccept = async (jobId) => {
    try {
      await handleAcceptJob(jobId);
      setConfirmAcceptJobId(null);
      setSelectedJob(null);
      setActiveSection('active');
    } catch {
      // Error handled in context toast
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const clean = String(otpInput).trim();
    if (!clean) {
      setOtpError('Please enter the 6-digit delivery OTP.');
      return;
    }
    if (!realActiveTask) return;
    setOtpError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await handleVerifyDeliveryOTP(realActiveTask.id, clean);
      setOtpSuccessMessage(res.message || 'Delivery successfully verified and marked as delivered!');
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpInput('');
        setOtpSuccessMessage(null);
        setActiveSection('completed');
      }, 1500);
    } catch (err) {
      const msg = err.data?.error || err.message || 'Incorrect OTP. Ask customer for the 6-digit code shown in their order.';
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmitIssue = async (e) => {
    e.preventDefault();
    const text = issueNotes.trim() || issueReason.trim();
    if (!text) return;
    if (!realActiveTask) return;
    try {
      await handleReportIssue(realActiveTask.id, {
        category: issueCategory,
        description: text,
        notes: issueNotes,
        cancel_task: cancelTaskChecked
      });
      setShowIssueModal(false);
      setIssueReason('');
      setIssueNotes('');
      setCancelTaskChecked(false);
      if (cancelTaskChecked) {
        setActiveSection('overview');
      }
    } catch {
      // Error handled in context
    }
  };

  const partnerDisplayName = currentUser?.name || currentUser?.full_name || currentUser?.username || 'Delivery Partner';

  return (
    <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px', boxSizing: 'border-box' }}>
      
      {/* 1. TOP HEADER: Partner Info & Online Dispatch Switch (Desktop/Tablet) */}
      <div className="hidden md:flex" style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1EBE3',
        borderRadius: '20px',
        padding: '16px 22px',
        boxShadow: '0 2px 8px rgba(22, 61, 43, 0.04)'
      }}>
        {/* Partner Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: '#163D2B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.2rem',
            boxShadow: '0 4px 12px rgba(22, 61, 43, 0.25)',
            position: 'relative'
          }}>
            <span>FD</span>
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10B981' : '#EF4444',
              border: '1.5px solid #FFFFFF'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', color: '#7A808C', fontWeight: 600 }}>Operational Dispatch</span>
              <span style={{
                fontSize: '0.68rem',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '1px 8px',
                borderRadius: '999px',
                fontWeight: 800
              }}>
                APPROVED PARTNER
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.35rem',
              fontWeight: 900,
              color: '#191B1F',
              margin: '2px 0 0'
            }}>
              {partnerDisplayName}
            </h1>
          </div>
        </div>

        {/* Action Controls: Refresh & Online/Offline Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => refreshDashboardData()}
            disabled={isLoadingJobs}
            type="button"
            title="Refresh Real Backend Data"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#F8F6F2',
              border: '1px solid #EDE8DE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#525760',
              cursor: isLoadingJobs ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={17} className={isLoadingJobs ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleToggleOnline}
            type="button"
            title={isOnline ? 'Tap to Go Offline' : 'Tap to Go Online'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2',
              border: `1.5px solid ${isOnline ? '#A7F3D0' : '#FECACA'}`,
              color: isOnline ? '#059669' : '#DC2626',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              minHeight: '40px',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10B981' : '#DC2626'
            }} />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Compact Dispatch Controls Strip */}
      <div className="flex md:hidden" style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E1EBE3',
        borderRadius: '16px',
        padding: '10px 14px',
        boxShadow: '0 2px 6px rgba(22, 61, 43, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? '#10B981' : '#DC2626'
          }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#191B1F' }}>
            {isOnline ? 'Shift Active' : 'Shift Offline'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => refreshDashboardData()}
            disabled={isLoadingJobs}
            type="button"
            title="Refresh jobs"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#F8FAF6',
              border: '1px solid #E1EBE3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#525760',
              cursor: isLoadingJobs ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={isLoadingJobs ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleToggleOnline}
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2',
              border: `1.5px solid ${isOnline ? '#A7F3D0' : '#FECACA'}`,
              color: isOnline ? '#059669' : '#DC2626',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </button>
        </div>
      </div>

      {/* Offline Alert State */}
      {!isOnline && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '16px',
          padding: '14px 20px',
          color: '#B45309',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>You are currently OFFLINE.</strong> Go online to receive available pickup offers and accept dispatches.
          </div>
        </div>
      )}

      {/* Error Banner */}
      {deliveryError && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '16px',
          padding: '14px 20px',
          color: '#DC2626',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>{deliveryError}</div>
        </div>
      )}

      {/* 2. FOUR SUMMARY METRICS CARDS (Pure Real PostgreSQL Data) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
        gap: '12px'
      }}>
        {/* Available Jobs */}
        <div 
          onClick={() => setActiveSection('jobs')}
          style={{
            backgroundColor: activeSection === 'jobs' ? '#FFFBEB' : '#FFFFFF',
            border: `1.5px solid ${activeSection === 'jobs' ? '#F59E0B' : '#EDE8DE'}`,
            borderRadius: '18px',
            padding: '16px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Available Jobs
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
            {dashboardSummary.available_jobs}
          </div>
        </div>

        {/* Active Task */}
        <div 
          onClick={() => setActiveSection('active')}
          style={{
            backgroundColor: activeSection === 'active' ? '#FEF2F2' : '#FFFFFF',
            border: `1.5px solid ${activeSection === 'active' ? '#DC2626' : '#EDE8DE'}`,
            borderRadius: '18px',
            padding: '16px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Task
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
            {dashboardSummary.active_task}
          </div>
        </div>

        {/* Picked Up */}
        <div 
          onClick={() => setActiveSection('pickup')}
          style={{
            backgroundColor: activeSection === 'pickup' ? '#EFF6FF' : '#FFFFFF',
            border: `1.5px solid ${activeSection === 'pickup' ? '#2563EB' : '#EDE8DE'}`,
            borderRadius: '18px',
            padding: '16px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Picked Up
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2563EB', marginTop: '4px' }}>
            {dashboardSummary.picked_up}
          </div>
        </div>

        {/* Completed Today */}
        <div 
          onClick={() => setActiveSection('completed')}
          style={{
            backgroundColor: activeSection === 'completed' ? '#ECFDF5' : '#FFFFFF',
            border: `1.5px solid ${activeSection === 'completed' ? '#10B981' : '#EDE8DE'}`,
            borderRadius: '18px',
            padding: '16px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#7A808C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Completed Today
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
            {dashboardSummary.completed_today}
          </div>
        </div>
      </div>

      {/* 3. SECTION NAVIGATION PILLS */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {sections.map(sec => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              type="button"
              style={{
                padding: '9px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isActive ? '#191B1F' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#525760',
                border: `1px solid ${isActive ? '#191B1F' : '#EDE8DE'}`,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{sec.label}</span>
              {sec.count !== undefined && sec.count > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? '#DC2626' : '#F1EFEA',
                  color: isActive ? '#FFFFFF' : '#191B1F',
                  fontWeight: 900
                }}>
                  {sec.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. DYNAMIC SECTION CONTENT */}

      {/* SECTION 1: DELIVERY OVERVIEW */}
      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Active Task Banner if present */}
          {realActiveTask ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #DC2626',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 4px 18px rgba(220, 38, 38, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 900
                }}>
                  TASK IN PROGRESS · {realActiveTask.task_status}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#191B1F' }}>
                  #{realActiveTask.order_number}
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: '#191B1F' }}>
                  {realActiveTask.restaurant_name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#525760' }}>
                  📍 Pickup: {realActiveTask.restaurant_address}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#525760' }}>
                  🎯 Drop: {realActiveTask.customer_address}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {realActiveTask.task_status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleReachedRestaurant(realActiveTask.id)}
                    disabled={isActionPending}
                    type="button"
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <MapPin size={16} />
                    <span>Reached Restaurant</span>
                  </button>
                )}

                {realActiveTask.task_status === 'REACHED_RESTAURANT' && (
                  <button
                    onClick={() => setShowPickupModal(true)}
                    disabled={isActionPending}
                    type="button"
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <Key size={16} />
                    <span>Verify Pickup</span>
                  </button>
                )}

                {realActiveTask.task_status === 'PICKED_UP' && (
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    disabled={isActionPending}
                    type="button"
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Verify Delivery (OTP)</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveSection('active')}
                  type="button"
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#191B1F',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Details & Map</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px dashed #EDE8DE',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: '#191B1F' }}>
                No Active Delivery
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#7A808C' }}>
                Accept an eligible order from the Available Jobs pool to start a delivery run.
              </p>
              <button
                onClick={() => setActiveSection('jobs')}
                type="button"
                style={{
                  padding: '9px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#191B1F',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Browse Available Jobs ({dashboardSummary.available_jobs})
              </button>
            </div>
          )}

          {/* Quick List of Available Jobs */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EDE8DE',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#191B1F' }}>
                Eligible Jobs Ready for Pickup ({availableJobs.length})
              </h3>
              <button
                onClick={() => setActiveSection('jobs')}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                View All →
              </button>
            </div>

            {availableJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#7A808C', fontSize: '0.85rem' }}>
                No jobs ready for pickup currently. Fresh orders will display once kitchen preparation completes.
              </div>
            ) : (
              availableJobs.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: '#FBF9F5',
                    border: '1px solid #EDE8DE',
                    borderRadius: '16px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#191B1F' }}>
                      {job.restaurant_name} · #{job.order_number}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#525760', marginTop: '2px' }}>
                      📍 Drop: {job.delivery_area} · {job.items_count} items
                    </div>
                    {job.delivery_fee && (
                      <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                        Delivery Fee: ₹{parseFloat(job.delivery_fee).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setConfirmAcceptJobId(job.id);
                    }}
                    disabled={!isOnline || isActionPending}
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: isOnline ? '#10B981' : '#EDE8DE',
                      color: isOnline ? '#FFFFFF' : '#7A808C',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: isOnline ? 'pointer' : 'not-allowed',
                      flexShrink: 0
                    }}
                  >
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: AVAILABLE DELIVERY JOBS */}
      {activeSection === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#191B1F' }}>
              Available Delivery Jobs ({availableJobs.length})
            </h2>
            <button
              onClick={() => refreshDashboardData()}
              disabled={isLoadingJobs}
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#F8F6F2',
                border: '1px solid #EDE8DE',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={isLoadingJobs ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {availableJobs.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <Package size={40} color="#7A808C" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#191B1F' }}>
                No Available Jobs at this Moment
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A808C', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Orders automatically enter this queue when restaurant partners mark them as READY FOR PICKUP.
              </p>
            </div>
          ) : (
            availableJobs.map(job => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EDE8DE',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#059669',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      READY FOR PICKUP
                    </span>
                    <h3 style={{ margin: '6px 0 2px', fontSize: '1.2rem', fontWeight: 900, color: '#191B1F' }}>
                      {job.restaurant_name}
                    </h3>
                    <div style={{ fontSize: '0.84rem', color: '#525760' }}>
                      📍 Pickup: {job.restaurant_address}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#7A808C', fontWeight: 700 }}>
                      Order Ref
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#191B1F' }}>
                      #{job.order_number}
                    </div>
                  </div>
                </div>

                {/* Masked Locality Details */}
                <div style={{
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #EDE8DE',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                      Drop Locality
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
                      {job.delivery_area}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                      Items
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B1F' }}>
                      {job.items_count} items
                    </div>
                  </div>

                  {job.delivery_fee && (
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                        Delivery Fee
                      </span>
                      <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#059669' }}>
                        ₹{parseFloat(job.delivery_fee).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Summary (without private customer data) */}
                {job.items_summary && job.items_summary.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#525760' }}>
                    <strong>Ordered Food:</strong> {job.items_summary.join(', ')}
                  </div>
                )}

                {/* Action button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setConfirmAcceptJobId(job.id);
                    }}
                    disabled={!isOnline || isActionPending}
                    type="button"
                    style={{
                      padding: '10px 22px',
                      borderRadius: '12px',
                      backgroundColor: isOnline ? '#10B981' : '#EDE8DE',
                      color: isOnline ? '#FFFFFF' : '#7A808C',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: isOnline ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Check size={16} />
                    <span>{isOnline ? 'Accept Job Offer' : 'Go Online to Accept'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 3: MY ACTIVE DELIVERY (Full Details Unlocked for Assigned Partner) */}
      {activeSection === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#191B1F' }}>
            My Active Delivery Task
          </h2>

          {!realActiveTask ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <Truck size={40} color="#7A808C" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#191B1F' }}>
                No Active Delivery in Progress
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: '#7A808C' }}>
                You do not currently have an active task. Accept a job from the Available Jobs list to proceed.
              </p>
              <button
                onClick={() => setActiveSection('jobs')}
                type="button"
                style={{
                  padding: '9px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#191B1F',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Browse Available Jobs
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 18px rgba(25, 27, 31, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              
              {/* Header Status & Order Number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 900
                }}>
                  STATUS: {realActiveTask.task_status}
                </span>

                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#191B1F' }}>
                  Order #{realActiveTask.order_number}
                </span>
              </div>

              {/* 1. Pickup Information */}
              <div style={{
                backgroundColor: '#FBF9F5',
                border: '1px solid #EDE8DE',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 900, textTransform: 'uppercase' }}>
                  PICKUP INFORMATION (KITCHEN)
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#191B1F' }}>
                  {realActiveTask.restaurant_name}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#525760' }}>
                  📍 {realActiveTask.restaurant_address}
                </div>
                {realActiveTask.restaurant_phone && (
                  <div style={{ fontSize: '0.84rem', color: '#191B1F', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="#DC2626" />
                    <span>Restaurant Phone: {realActiveTask.restaurant_phone}</span>
                  </div>
                )}
              </div>

              {/* 2. Customer Delivery Details (Unlocked) */}
              <div style={{
                backgroundColor: '#FBF9F5',
                border: '1px solid #EDE8DE',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 900, textTransform: 'uppercase' }}>
                  DELIVERY DESTINATION (CUSTOMER)
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#191B1F' }}>
                  {realActiveTask.customer_name}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#525760' }}>
                  📍 {realActiveTask.customer_address}
                </div>
                {realActiveTask.customer_phone && (
                  <div style={{ fontSize: '0.84rem', color: '#191B1F', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="#059669" />
                    <span>Customer Phone: {realActiveTask.customer_phone}</span>
                  </div>
                )}
                {realActiveTask.cooking_instructions && (
                  <div style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#B45309',
                    marginTop: '4px'
                  }}>
                    <strong>Delivery Notes:</strong> {realActiveTask.cooking_instructions}
                  </div>
                )}
              </div>

              {/* Integrated route map (real tracking coords, below accepted order) */}
              <AcceptedOrderMap
                orderId={realActiveTask.order_id}
                orderNumber={realActiveTask.order_number}
              />

              {/* 3. Items and Financial Breakdown */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EDE8DE',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                  ORDER ITEMS ({realActiveTask.items_count})
                </div>
                {realActiveTask.items?.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px dashed #EDE8DE' }}>
                    <span>{it.quantity}x {it.name}</span>
                    <span style={{ fontWeight: 700 }}>₹{it.item_total?.toFixed(2)}</span>
                  </div>
                ))}

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 900, color: '#191B1F' }}>
                  <span>Delivery Fee:</span>
                  <span style={{ color: '#059669' }}>₹{parseFloat(realActiveTask.delivery_fee || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* 4. Action Workflow Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {realActiveTask.task_status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleReachedRestaurant(realActiveTask.id)}
                    disabled={isActionPending}
                    type="button"
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <MapPin size={18} />
                    <span>Mark Reached Restaurant</span>
                  </button>
                )}

                {(realActiveTask.task_status === 'REACHED_RESTAURANT' || realActiveTask.task_status === 'ACCEPTED') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => setShowPickupModal(true)}
                      disabled={isActionPending}
                      type="button"
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.94rem',
                        cursor: isActionPending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                      }}
                    >
                      <Key size={18} />
                      <span>Verify Handover (4-Digit Pickup PIN / Photo Proof)</span>
                    </button>

                    <button
                      onClick={() => handleConfirmPickup(realActiveTask.id)}
                      disabled={isActionPending}
                      type="button"
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: '#F1EFEA',
                        color: '#525760',
                        border: '1px solid #EDE8DE',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: isActionPending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Quick Confirm Pickup (Simulated / Fallback)
                    </button>
                  </div>
                )}

                {realActiveTask.task_status === 'PICKED_UP' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      backgroundColor: '#ECFDF5',
                      border: '1.5px solid #10B981',
                      borderRadius: '14px',
                      padding: '14px',
                      textAlign: 'center',
                      color: '#059669',
                      fontWeight: 800,
                      fontSize: '0.92rem'
                    }}>
                      ✓ Food Picked Up! In Transit to Customer Handover.
                    </div>

                    <button
                      onClick={() => {
                        setShowDeliveryModal(true);
                      }}
                      disabled={isActionPending}
                      type="button"
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.96rem',
                        cursor: isActionPending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <ShieldCheck size={20} />
                      <span>Verify Delivery Handover (4-Digit OTP / Photo Proof)</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowIssueModal(true)}
                  disabled={isActionPending}
                  type="button"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Report Issue / Cancel Task
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PICKUP TASKS */}
      {activeSection === 'pickup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#191B1F' }}>
            Pickup Tasks
          </h2>

          {!realActiveTask ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '36px 20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A808C' }}>
                No pending pickups. When you accept an order, it will appear here ready for restaurant arrival and confirmation.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#191B1F' }}>
                  {realActiveTask.restaurant_name}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  color: realActiveTask.task_status === 'PICKED_UP' ? '#059669' : '#2563EB',
                  backgroundColor: realActiveTask.task_status === 'PICKED_UP' ? '#ECFDF5' : '#EFF6FF',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {realActiveTask.task_status}
                </span>
              </div>

              <div style={{ fontSize: '0.84rem', color: '#525760' }}>
                📍 {realActiveTask.restaurant_address}
              </div>

              <div style={{ fontSize: '0.82rem', color: '#191B1F', fontWeight: 700 }}>
                Items: {realActiveTask.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {realActiveTask.task_status !== 'PICKED_UP' ? (
                  <button
                    onClick={() => setShowPickupModal(true)}
                    disabled={isActionPending}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '10px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 850,
                      fontSize: '0.84rem',
                      cursor: isActionPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Key size={16} />
                    <span>Verify Food Pickup (PIN / Photo)</span>
                  </button>
                ) : (
                  <div style={{ color: '#059669', fontWeight: 800, fontSize: '0.84rem' }}>
                    ✓ Pickup completed for this task
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: COMPLETED DELIVERIES */}
      {activeSection === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#191B1F' }}>
            Completed Deliveries ({completedDeliveries.length})
          </h2>

          {completedDeliveries.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '36px 20px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={36} color="#7A808C" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A808C' }}>
                No completed deliveries recorded yet today. Completed dispatches will appear here.
              </p>
            </div>
          ) : (
            completedDeliveries.map(del => (
              <div
                key={del.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EDE8DE',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#191B1F' }}>
                    {del.restaurant_name} · #{del.order_number}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#525760', marginTop: '2px' }}>
                    📍 {del.customer_address}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A808C', marginTop: '2px' }}>
                    Delivered at {del.delivered_at ? new Date(del.delivered_at).toLocaleTimeString() : 'Today'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, display: 'inline-block' }}>
                    DELIVERED
                  </div>
                  {del.delivery_fee && (
                    <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                      +₹{parseFloat(del.delivery_fee).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 6: CANCELLED OR FAILED TASKS */}
      {activeSection === 'cancelled' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#191B1F' }}>
            Cancelled or Failed Tasks ({cancelledTasks.length})
          </h2>

          {cancelledTasks.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '36px 20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A808C' }}>
                Zero cancelled tasks. Great job on maintaining smooth dispatches!
              </p>
            </div>
          ) : (
            cancelledTasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FECACA',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#191B1F' }}>
                    Order #{task.order_number} · {task.restaurant_name}
                  </span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    {task.task_status}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#DC2626' }}>
                  <strong>Reason:</strong> {task.cancellation_reason || 'Issue reported'}
                </div>
                {task.issue_notes && (
                  <div style={{ fontSize: '0.8rem', color: '#7A808C' }}>
                    Notes: {task.issue_notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* CONFIRM ACCEPT MODAL */}
      {confirmAcceptJobId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#191B1F' }}>
              Confirm Job Acceptance
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#525760' }}>
              Are you sure you want to accept this delivery dispatch? You will be assigned to pick up food from the kitchen and deliver it to the customer.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setConfirmAcceptJobId(null)}
                disabled={isActionPending}
                type="button"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#F1EFEA',
                  color: '#525760',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => onConfirmAccept(confirmAcceptJobId)}
                disabled={isActionPending}
                type="button"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isActionPending ? 'not-allowed' : 'pointer'
                }}
              >
                {isActionPending ? 'Accepting...' : 'Yes, Accept Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL (Phase 13 Categorized Reporting) */}
      {showIssueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <form 
            onSubmit={onSubmitIssue}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '26px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#191B1F' }}>
                  Report Delivery Issue
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowIssueModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A808C' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#525760' }}>
              Select the appropriate issue category to log with central dispatch. Issues are securely stored in the operations audit ledger.
            </p>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#191B1F', display: 'block', marginBottom: '6px' }}>
                Issue Category *
              </label>
              <select
                value={issueCategory}
                onChange={e => setIssueCategory(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EDE8DE',
                  fontSize: '0.85rem',
                  backgroundColor: '#FBF9F5',
                  color: '#191B1F',
                  fontWeight: 600
                }}
              >
                <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable at Delivery Address</option>
                <option value="UNABLE_TO_CONTACT">Unable to Contact Customer (Phone Unreachable)</option>
                <option value="INCORRECT_ADDRESS">Incorrect or Incomplete Address</option>
                <option value="DELAYED_HANDOVER">Customer Requested Delayed Handover</option>
                <option value="OTHER">Other Delivery Issue</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#191B1F', display: 'block', marginBottom: '6px' }}>
                Description & Operational Context *
              </label>
              <textarea
                value={issueNotes}
                onChange={e => setIssueNotes(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Arrived at gate, customer not answering intercom after 3 attempts..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EDE8DE',
                  fontSize: '0.85rem',
                  resize: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#191B1F'
                }}
              />
            </div>

            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <input
                type="checkbox"
                id="cancelTaskCheckbox"
                checked={cancelTaskChecked}
                onChange={e => setCancelTaskChecked(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <label htmlFor="cancelTaskCheckbox" style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 600, cursor: 'pointer' }}>
                <strong>Vehicle Breakdown / Critical Emergency:</strong> Cancel and unassign this task from my active queue so another partner can assist.
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                disabled={isActionPending}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#F1EFEA',
                  color: '#525760',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!issueNotes.trim() || isActionPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  backgroundColor: cancelTaskChecked ? '#DC2626' : '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: (!issueNotes.trim() || isActionPending) ? 'not-allowed' : 'pointer'
                }}
              >
                {isActionPending ? 'Submitting...' : (cancelTaskChecked ? 'Submit & Cancel Task' : 'Submit Issue Report')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PHASE 13: OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                if (!isVerifyingOtp) {
                  setShowOtpModal(false);
                  setOtpError(null);
                  setOtpInput('');
                }
              }}
              type="button"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: '#7A808C',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <ShieldCheck size={28} />
              </div>

              <h2 style={{
                margin: '0 0 4px',
                fontSize: '1.3rem',
                fontWeight: 900,
                color: '#191B1F',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                Verify Customer Delivery OTP
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#525760' }}>
                Ask <strong>{realActiveTask?.customer_name || 'the customer'}</strong> for the 4-digit verification code shown on their order tracking screen.
              </p>
            </div>

            {/* Error Notification */}
            {otpError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{otpError}</span>
              </div>
            )}

            {/* Success Notification */}
            {otpSuccessMessage && (
              <div style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '0.86rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={20} />
                <span>{otpSuccessMessage}</span>
              </div>
            )}

            {/* OTP Entry Form */}
            <form onSubmit={onSubmitOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#7A808C',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  display: 'block',
                  textAlign: 'center',
                  marginBottom: '8px'
                }}>
                  Enter 4-Digit Delivery Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={otpInput}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtpInput(val);
                    if (otpError) setOtpError(null);
                  }}
                  placeholder="••••"
                  autoFocus
                  disabled={isVerifyingOtp || !!otpSuccessMessage}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: '#F8F6F2',
                    border: '2px solid #EDE8DE',
                    fontSize: '1.9rem',
                    fontWeight: 900,
                    letterSpacing: '10px',
                    color: '#191B1F',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: '#7A808C', textAlign: 'center', lineHeight: 1.4 }}>
                🔒 High-security handover. 5 failed attempts will trigger a security cooldown period.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpError(null);
                    setOtpInput('');
                  }}
                  disabled={isVerifyingOtp}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#F1EFEA',
                    color: '#525760',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length < 4 || !!otpSuccessMessage}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: (otpInput.length >= 4 && !isVerifyingOtp) ? '#10B981' : '#EDE8DE',
                    color: (otpInput.length >= 4 && !isVerifyingOtp) ? '#FFFFFF' : '#7A808C',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: (otpInput.length >= 4 && !isVerifyingOtp) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>{isVerifyingOtp ? 'Verifying...' : 'Complete Delivery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgraded Verification Modals */}
      <PickupVerificationModal
        isOpen={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        onCompletePickup={() => {
          setShowPickupModal(false);
          refreshDashboardData();
        }}
      />

      <DeliveryVerificationModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onCompleteDelivery={() => {
          setShowDeliveryModal(false);
          setActiveSection('completed');
          refreshDashboardData();
        }}
      />

    </div>
  );
};
