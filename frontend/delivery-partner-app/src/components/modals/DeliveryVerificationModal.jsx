import React, { useState, useRef, useEffect } from 'react';
import { 
  Key, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Loader2,
  Eye,
  EyeOff,
  Upload,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const DeliveryVerificationModal = ({ isOpen, onClose, onCompleteDelivery }) => {
  const { 
    activeTrip, 
    realActiveTask, 
    handleVerifyDeliveryOTP, 
    advanceTripStep, 
    showToast 
  } = useDelivery();
  
  const [activeMode, setActiveMode] = useState('otp'); // 'otp' | 'photo'
  const [digits, setDigits] = useState(['', '', '', '']);
  const [isMasked, setIsMasked] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Photo mode states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // 4 input refs for auto-advancing
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setDigits(['', '', '', '']);
      setErrorMsg(null);
      setIsSuccess(false);
      setSuccessMsg('');
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    } else {
      setTimeout(() => {
        if (inputRefs[0]?.current) {
          inputRefs[0].current.focus();
        }
      }, 150);
    }
  }, [isOpen]);

  // Cooldown timer tick
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  if (!isOpen) return null;

  const currentTaskId = realActiveTask?.id || activeTrip?.id || activeTrip?.order_id || 1;

  // Handle single digit input
  const handleDigitChange = (index, e) => {
    const val = e.target.value;
    if (!val) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Extract the latest typed numeric character
    const char = val.slice(-1);
    if (!/^\d$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setErrorMsg(null);

    // Auto-advance to next box if available
    if (index < 3 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Keyboard navigation & backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs[index - 1]?.current) {
        inputRefs[index - 1].current.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs[index - 1]?.current) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 3 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Paste 4-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numericOnly = pasteData.replace(/\D/g, '');
    if (numericOnly.length >= 4) {
      const newDigits = numericOnly.slice(0, 4).split('');
      setDigits(newDigits);
      setErrorMsg(null);
      if (inputRefs[3]?.current) {
        inputRefs[3].current.focus();
      }
    }
  };

  // Verify OTP submission
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length !== 4) {
      setErrorMsg('Please enter all 4 digits of the customer delivery code.');
      return;
    }

    if (cooldownSeconds > 0) {
      setErrorMsg(`Verification locked due to too many failed attempts. Try again in ${cooldownSeconds}s.`);
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);

    try {
      if (handleVerifyDeliveryOTP && realActiveTask?.id) {
        const res = await handleVerifyDeliveryOTP(realActiveTask.id, otpCode);
        setIsSuccess(true);
        setSuccessMsg(res.message || 'Delivery handover verified successfully!');
      } else {
        // Fallback demo/mock check
        const requiredOTP = activeTrip?.otp_required || '8492';
        if (otpCode === requiredOTP || otpCode === '8492' || otpCode === '1234') {
          setIsSuccess(true);
          setSuccessMsg('Delivery handover verified via customer OTP!');
        } else {
          throw new Error('Incorrect delivery OTP. Please request the 4-digit code from the customer.');
        }
      }

      setTimeout(() => {
        if (advanceTripStep) advanceTripStep();
        if (onCompleteDelivery) onCompleteDelivery();
        onClose();
      }, 1100);
    } catch (err) {
      const msg = err.data?.error || err.message || 'Incorrect delivery OTP.';
      setErrorMsg(msg);
      if (err.status === 429 || msg.toLowerCase().includes('lock')) {
        setCooldownSeconds(900); // 15 min cooldown
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Photo selection handler
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Selected photo exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Only JPG, JPEG, PNG, or WebP images are supported.');
      return;
    }

    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  // Submit Photo verification
  const handleSubmitPhoto = async () => {
    if (!photoFile) {
      setErrorMsg('Please capture or choose a delivery package photo first.');
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('verification_mode', 'PHOTO');

      if (handleVerifyDeliveryOTP && realActiveTask?.id) {
        const res = await handleVerifyDeliveryOTP(realActiveTask.id, formData);
        setIsSuccess(true);
        if (res.pending_review) {
          setSuccessMsg('Photo proof submitted for operations review. Order verification queued.');
        } else {
          setSuccessMsg(res.message || 'Delivery photo proof approved and verified!');
        }
      } else {
        setIsSuccess(true);
        setSuccessMsg('Doorstep delivery photo proof submitted successfully!');
      }

      setTimeout(() => {
        if (advanceTripStep) advanceTripStep();
        if (onCompleteDelivery) onCompleteDelivery();
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err.data?.error || err.message || 'Failed to submit delivery photo.';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 250,
      backgroundColor: 'rgba(15, 23, 42, 0.68)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '430px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          borderRadius: '26px',
          padding: '24px 20px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.14), 0 4px 12px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          color: '#0F172A',
          border: '1px solid #E2E8F0',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Cancel / Close button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Cancel"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.22) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <ShieldCheck size={28} />
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 6px',
            letterSpacing: '-0.3px'
          }}>
            Verify Delivery
          </h2>
          <p style={{ 
            fontSize: '0.84rem', 
            color: '#64748B', 
            margin: 0,
            lineHeight: 1.45
          }}>
            Enter the 4-digit customer code or use the approved photo verification option.
          </p>
        </div>

        {/* Segmented Mode Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          backgroundColor: '#F1F5F9',
          padding: '4px',
          borderRadius: '14px'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveMode('otp');
              setErrorMsg(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeMode === 'otp' ? '#FFFFFF' : 'transparent',
              color: activeMode === 'otp' ? '#0F172A' : '#64748B',
              boxShadow: activeMode === 'otp' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Key size={16} color={activeMode === 'otp' ? '#10B981' : '#64748B'} />
            <span>Customer OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('photo');
              setErrorMsg(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeMode === 'photo' ? '#FFFFFF' : 'transparent',
              color: activeMode === 'photo' ? '#0F172A' : '#64748B',
              boxShadow: activeMode === 'photo' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Camera size={16} color={activeMode === 'photo' ? '#10B981' : '#64748B'} />
            <span>Upload Food Photo</span>
          </button>
        </div>

        {/* Error Feedback Banner */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.15s ease'
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback Banner */}
        {isSuccess && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #6EE7B7',
            color: '#047857',
            borderRadius: '14px',
            padding: '14px 16px',
            fontSize: '0.86rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <CheckCircle2 size={20} color="#10B981" />
            <span>{successMsg || 'Handover Verified! Order completed.'}</span>
          </div>
        )}

        {/* MODE 1: 4 Connected OTP Input Boxes */}
        {activeMode === 'otp' && !isSuccess && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  4-Digit Customer Pin
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isMasked ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{isMasked ? 'Reveal' : 'Mask'}</span>
                </button>
              </div>

              {/* 4 Connected Input Boxes */}
              <div 
                onPaste={handlePaste}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type={isMasked ? 'password' : 'text'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digits[idx]}
                    onChange={(e) => handleDigitChange(idx, e)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    autoComplete="one-time-code"
                    disabled={isVerifying || cooldownSeconds > 0}
                    style={{
                      flex: '1 1 0',
                      minWidth: 0,
                      maxWidth: '64px',
                      height: '62px',
                      borderRadius: '16px',
                      backgroundColor: '#F8FAFC',
                      border: digits[idx] ? '2px solid #10B981' : '2px solid #E2E8F0',
                      textAlign: 'center',
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', monospace",
                      color: '#0F172A',
                      outline: 'none',
                      boxShadow: digits[idx] ? '0 0 0 3px rgba(16, 185, 129, 0.12)' : 'none',
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>

              {cooldownSeconds > 0 && (
                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.74rem', color: '#DC2626', fontWeight: 700 }}>
                  Cooldown in effect. Please wait {cooldownSeconds}s before retrying.
                </div>
              )}
            </div>

            {/* Primary Action Button: Verify OTP */}
            <button
              type="submit"
              disabled={isVerifying || digits.join('').length !== 4 || cooldownSeconds > 0}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontWeight: 800,
                fontSize: '0.96rem',
                cursor: (isVerifying || digits.join('').length !== 4 || cooldownSeconds > 0) ? 'not-allowed' : 'pointer',
                opacity: (isVerifying || digits.join('').length !== 4 || cooldownSeconds > 0) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Validating OTP Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: Food Delivery Photo Alternative */}
        {activeMode === 'photo' && !isSuccess && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Hidden native input with environment capture */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {!photoPreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: '190px',
                  borderRadius: '18px',
                  border: '2px dashed #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                    Capture or Choose Photo
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Frame food package at customer doorstep. Max 5MB (JPG, PNG, WebP).
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  backgroundColor: '#E2E8F0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#334155'
                }}>
                  Tap to Open Camera
                </div>
              </div>
            ) : (
              <div style={{
                position: 'relative',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                backgroundColor: '#0F172A'
              }}>
                <img 
                  src={photoPreview} 
                  alt="Delivery Proof Preview" 
                  style={{
                    width: '100%',
                    height: '210px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />

                {/* Photo Badge overlay */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <span>Photo Ready • {(photoFile.size / 1024).toFixed(0)} KB</span>
                </div>

                {/* Retake Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Retake</span>
                </button>
              </div>
            )}

            {/* Primary Action Button: Submit Photo */}
            <button
              type="button"
              onClick={handleSubmitPhoto}
              disabled={isVerifying || !photoFile}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontWeight: 800,
                fontSize: '0.96rem',
                cursor: (isVerifying || !photoFile) ? 'not-allowed' : 'pointer',
                opacity: (isVerifying || !photoFile) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Uploading & Verifying...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Submit Photo for Verification</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Modal Footer / Cancel Action */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 16px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
