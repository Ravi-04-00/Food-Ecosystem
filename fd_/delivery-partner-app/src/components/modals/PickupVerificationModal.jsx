import React, { useState, useRef, useEffect } from 'react';
import { 
  Key, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  PackageCheck, 
  Loader2,
  Upload,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { useDelivery } from '../../context/DeliveryContext.jsx';

export const PickupVerificationModal = ({ isOpen, onClose, onCompletePickup }) => {
  const { 
    activeTrip, 
    realActiveTask, 
    handleConfirmPickup, 
    advanceTripStep, 
    showToast 
  } = useDelivery();
  
  const [activeMode, setActiveMode] = useState('otp'); // 'otp' | 'photo'
  const [digits, setDigits] = useState(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // 4 input refs
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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

  if (!isOpen) return null;

  const orderNumber = activeTrip?.order_number || realActiveTask?.order_number || 'FD-1024';
  const restaurantName = activeTrip?.restaurant_name || realActiveTask?.restaurant_name || 'Restaurant';

  // Handle single digit input
  const handleDigitChange = (index, e) => {
    const val = e.target.value;
    if (!val) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const char = val.slice(-1);
    if (!/^\d$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setErrorMsg(null);

    if (index < 3 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1].current.focus();
    }
  };

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

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numericOnly = pasteData.replace(/\D/g, '');
    if (numericOnly.length >= 4) {
      setDigits(numericOnly.slice(0, 4).split(''));
      setErrorMsg(null);
      if (inputRefs[3]?.current) {
        inputRefs[3].current.focus();
      }
    }
  };

  // Submit pickup verification
  const handleVerifyPickup = async (e) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 4) {
      setErrorMsg('Please enter the 4-digit pickup code shown on the restaurant terminal.');
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);

    try {
      if (handleConfirmPickup && realActiveTask?.id) {
        const res = await handleConfirmPickup(realActiveTask.id, { pickup_otp: code });
        setIsSuccess(true);
        setSuccessMsg(res.message || 'Pickup verified! Package secured.');
      } else {
        setIsSuccess(true);
        setSuccessMsg('Store handover verified via 4-digit pickup code!');
      }

      setTimeout(() => {
        if (advanceTripStep) advanceTripStep();
        if (onCompletePickup) onCompletePickup();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err.data?.error || err.message || 'Incorrect pickup code.';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Photo selection handler
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Selected photo exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

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

  // Submit Photo handover
  const handleSubmitPhoto = async () => {
    if (!photoFile) {
      setErrorMsg('Please capture or choose a food package handover photo.');
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('verification_mode', 'PHOTO');

      if (handleConfirmPickup && realActiveTask?.id) {
        const res = await handleConfirmPickup(realActiveTask.id, formData);
        setIsSuccess(true);
        setSuccessMsg(res.message || 'Food package photo handover confirmed!');
      } else {
        setIsSuccess(true);
        setSuccessMsg('Package photo handover verified successfully!');
      }

      setTimeout(() => {
        if (advanceTripStep) advanceTripStep();
        if (onCompletePickup) onCompletePickup();
        onClose();
      }, 1100);
    } catch (err) {
      const msg = err.data?.error || err.message || 'Failed to confirm pickup photo.';
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
        {/* Cancel button */}
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
            justifyContent: 'center'
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
            <PackageCheck size={28} />
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 6px',
            letterSpacing: '-0.3px'
          }}>
            Verify Store Handover
          </h2>
          <p style={{ 
            fontSize: '0.84rem', 
            color: '#64748B', 
            margin: 0,
            lineHeight: 1.45
          }}>
            Ask <strong>{restaurantName}</strong> staff for the 4-digit pickup code or capture package photo proof.
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
              cursor: 'pointer'
            }}
          >
            <Key size={16} color={activeMode === 'otp' ? '#10B981' : '#64748B'} />
            <span>Pickup Code</span>
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
              cursor: 'pointer'
            }}
          >
            <Camera size={16} color={activeMode === 'photo' ? '#10B981' : '#64748B'} />
            <span>Package Photo</span>
          </button>
        </div>

        {/* Error Feedback */}
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
            gap: '8px'
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
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
            gap: '10px'
          }}>
            <CheckCircle2 size={20} color="#10B981" />
            <span>{successMsg || 'Pickup Verified! Heading to customer.'}</span>
          </div>
        )}

        {/* Mode 1: 4 Connected Input Boxes */}
        {activeMode === 'otp' && !isSuccess && (
          <form onSubmit={handleVerifyPickup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  4-Digit Store Handover Code
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                  Order #{orderNumber}
                </span>
              </div>

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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digits[idx]}
                    onChange={(e) => handleDigitChange(idx, e)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    autoComplete="off"
                    disabled={isVerifying}
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
            </div>

            <button
              type="submit"
              disabled={isVerifying || digits.join('').length !== 4}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontWeight: 800,
                fontSize: '0.96rem',
                cursor: (isVerifying || digits.join('').length !== 4) ? 'not-allowed' : 'pointer',
                opacity: (isVerifying || digits.join('').length !== 4) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Pickup Code...</span>
                </>
              ) : (
                <>
                  <span>Confirm Food Pickup</span>
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode 2: Package Photo Proof */}
        {activeMode === 'photo' && !isSuccess && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  textAlign: 'center'
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
                    Capture Package Photo
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Frame packed bags with order receipt visible at restaurant counter.
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
                  alt="Package Handover Proof" 
                  style={{
                    width: '100%',
                    height: '210px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />

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
                  <span>Package Captured • {(photoFile.size / 1024).toFixed(0)} KB</span>
                </div>

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
                gap: '8px'
              }}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Package Photo...</span>
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
