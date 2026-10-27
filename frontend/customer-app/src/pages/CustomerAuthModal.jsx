import React, { useState } from 'react';
import { 
  X, Mail, Lock, Phone, User, MapPin, Camera, 
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Sparkles, ShieldCheck 
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { registerCustomer } from '../services/api.js';

export const CustomerAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login } = useCustomer();
  const [isRegister, setIsRegister] = useState(() => initialMode === 'register');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  React.useEffect(() => {
    if (initialMode === 'register') setIsRegister(true);
    else if (initialMode === 'login') setIsRegister(false);
  }, [initialMode, isOpen]);

  // Login form state
  const [identifier, setIdentifier] = useState('customer@wsfood.io');
  const [loginPassword, setLoginPassword] = useState('wsfood123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Status & Feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!identifier.trim()) {
      setLoginError('Please enter your email or phone number.');
      setLoginLoading(false);
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      setLoginLoading(false);
      return;
    }

    try {
      if (login) {
        await login(identifier.trim(), loginPassword);
      }
      setSuccessMsg('Signed in successfully! Welcome back.');
      setTimeout(() => {
        setLoginLoading(false);
        onClose();
      }, 600);
    } catch (err) {
      const msg = err?.error || err?.detail || err?.message || 'Authentication failed. Please verify credentials.';
      setLoginError(msg);
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (login) login('google.user@wsfood.io', 'google-oauth');
    onClose();
  };

  const handleForgotPassword = () => {
    setForgotPasswordMsg(`Password reset link dispatched to ${identifier || 'your email'}. Check inbox.`);
    setTimeout(() => setForgotPasswordMsg(''), 4500);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, profile_photo: ['Photo size must not exceed 5MB.'] }));
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.profile_photo;
        return copy;
      });
    }
  };

  const validateClientSide = () => {
    const errors = {};
    const nameTrim = fullName.trim();
    if (!nameTrim || nameTrim.length < 2) {
      errors.full_name = ['Full legal name must be at least 2 characters.'];
    } else if (!/^[a-zA-Z\s\.\-']{2,100}$/.test(nameTrim)) {
      errors.full_name = ['Only alphabets, spaces, dots, and hyphens are allowed. Special characters are rejected.'];
    }

    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = ['Please provide a valid email address (e.g. name@domain.com).'];
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || digitsOnly.length < 10 || digitsOnly.length > 15) {
      errors.phone = ['Phone number must contain between 10 and 15 digits.'];
    } else if (/^(\d)\1{9,}$/.test(digitsOnly) || ['1234567890', '0123456789', '9876543210', '0000000000'].includes(digitsOnly)) {
      errors.phone = ['Please provide a valid, realistic phone number. Obvious dummy sequences are rejected.'];
    }

    if (!password || password.length < 8) {
      errors.password = ['Password must be at least 8 characters long.'];
    } else if (!/[A-Za-z]/.test(password) || !/[0-9!@#$%^&*()_+=\-\[\]{}|\\:;"'<>,.?/~`]/.test(password)) {
      errors.password = ['Password must contain at least one letter and at least one number or special character.'];
    }

    if (password !== confirmPassword) {
      errors.confirm_password = ['Passwords do not match.'];
    }

    const addrTrim = address.trim();
    if (!addrTrim || addrTrim.length < 5) {
      errors.address = ['Delivery address is required and must be at least 5 characters long.'];
    }

    return errors;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMsg('');

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);
      formData.append('address', address.trim());
      formData.append('role', 'CUSTOMER');

      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }

      const response = await registerCustomer(formData);

      if (response && (response.success || response.id || response.user)) {
        setSuccessMsg('Account created successfully! Auto-logging into your FD profile...');
        setTimeout(() => {
          if (login) login(email, password);
          setIsSubmitting(false);
          onClose();
        }, 1200);
      } else {
        setGeneralError(response?.message || 'Registration failed. Please check inputs.');
        if (response?.errors) setFieldErrors(response.errors);
        setIsSubmitting(false);
      }
    } catch (err) {
      setGeneralError(err.message || 'Server network error during registration.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 46, 27, 0.65)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#0A2E1B',
        borderRadius: '28px',
        border: '1px solid #DCFCE7',
        boxShadow: '0 24px 70px rgba(10, 46, 27, 0.22)',
        width: '100%',
        maxWidth: isRegister ? '560px' : '440px',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '32px 28px',
        transition: 'max-width 0.3s ease'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#F4FBF7',
            border: '1px solid #DCFCE7',
            borderRadius: '12px',
            cursor: 'pointer',
            padding: '7px',
            display: 'flex',
            color: '#0A2E1B',
            transition: 'all 0.15s ease'
          }}
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FDOrganicLogo size="md" showWordmark={true} showTagline={false} theme="light" />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#16A34A',
            marginTop: '12px',
            letterSpacing: '0.5px'
          }}>
            <Sparkles size={12} />
            <span>CUSTOMER APP • PORT 3000</span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '10px 0 2px 0', color: '#0A2E1B' }}>
            {isRegister ? 'Join Fast Delivery' : 'Welcome Back'}
          </h2>
          <div style={{ fontSize: '0.84rem', color: '#4B6B58' }}>
            {isRegister 
              ? 'Create your customer account for gourmet orders & rewards'
              : 'Sign in to access your orders, wallet & live GPS tracking'}
          </div>
        </div>

        {/* Global Feedback Toasts */}
        {loginError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{loginError}</span>
          </div>
        )}

        {forgotPasswordMsg && (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{forgotPasswordMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{successMsg}</span>
          </div>
        )}

        {generalError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#F4FBF7',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid #DCFCE7'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setFieldErrors({}); }}
            style={{
              padding: '9px',
              borderRadius: '10px',
              border: 'none',
              background: !isRegister ? '#FFFFFF' : 'transparent',
              color: !isRegister ? '#0A2E1B' : '#648270',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: !isRegister ? '0 2px 8px rgba(10, 46, 27, 0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setLoginError(''); }}
            style={{
              padding: '9px',
              borderRadius: '10px',
              border: 'none',
              background: isRegister ? '#FFFFFF' : 'transparent',
              color: isRegister ? '#0A2E1B' : '#648270',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: isRegister ? '0 2px 8px rgba(10, 46, 27, 0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* 1. SIGN IN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                Email or Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="customer@wsfood.io or +91..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    border: '1.5px solid #DCFCE7',
                    borderRadius: '12px',
                    padding: '11px 12px 11px 38px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    background: '#F9FDFB',
                    color: '#0A2E1B',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22C55E'}
                  onBlur={(e) => e.target.style.borderColor = '#DCFCE7'}
                />
                <Mail size={16} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#16A34A',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    border: '1.5px solid #DCFCE7',
                    borderRadius: '12px',
                    padding: '11px 40px 11px 38px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    background: '#F9FDFB',
                    color: '#0A2E1B',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22C55E'}
                  onBlur={(e) => e.target.style.borderColor = '#DCFCE7'}
                />
                <Lock size={16} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#648270'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Session Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
              <input 
                type="checkbox" 
                id="customerRememberMe"
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#22C55E', cursor: 'pointer' }}
              />
              <label htmlFor="customerRememberMe" style={{ fontSize: '0.78rem', color: '#4B6B58', fontWeight: 600, cursor: 'pointer' }}>
                Remember session on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontWeight: 900,
                fontSize: '0.94rem',
                cursor: loginLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loginLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to FD Customer Portal</span>
              )}
            </button>

            {/* Social Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                background: '#FFFFFF',
                color: '#0A2E1B',
                border: '1px solid #DCFCE7',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
              }}
            >
              <span>Continue with Google Demo Account</span>
            </button>
          </form>
        ) : (
          /* 2. REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    border: fieldErrors.full_name ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7',
                    borderRadius: '12px',
                    padding: '10px 10px 10px 36px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#F9FDFB',
                    boxSizing: 'border-box'
                  }}
                />
                <User size={15} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
              {fieldErrors.full_name && (
                <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>
                  {fieldErrors.full_name[0]}
                </div>
              )}
            </div>

            {/* Email & Phone Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Email Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      border: fieldErrors.email ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7',
                      borderRadius: '12px',
                      padding: '10px 10px 10px 34px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#F9FDFB',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Mail size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
                {fieldErrors.email && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>
                    {fieldErrors.email[0]}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="+91 98888 77777"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      border: fieldErrors.phone ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7',
                      borderRadius: '12px',
                      padding: '10px 10px 10px 34px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#F9FDFB',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Phone size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
                {fieldErrors.phone && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>
                    {fieldErrors.phone[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Password (8+ chars) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      border: fieldErrors.password ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7',
                      borderRadius: '12px',
                      padding: '10px 32px 10px 34px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#F9FDFB',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '11px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#648270'
                    }}
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>
                    {fieldErrors.password[0]}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      border: fieldErrors.confirm_password ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7',
                      borderRadius: '12px',
                      padding: '10px 32px 10px 34px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#F9FDFB',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '11px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#648270'
                    }}
                  >
                    {showRegConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>
                    {fieldErrors.confirm_password[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                Delivery Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={2}
                  placeholder="Apartment, Street, Landmark, City, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    border: fieldErrors.address ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7',
                    borderRadius: '12px',
                    padding: '8px 12px 8px 36px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#F9FDFB',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
                <MapPin size={16} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              </div>
              {fieldErrors.address && (
                <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>
                  {fieldErrors.address[0]}
                </div>
              )}
            </div>

            {/* Profile Photo (Optional) */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                Profile Photo (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #22C55E' }}
                  />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EBF8F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} color="#16A34A" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ fontSize: '0.78rem', color: '#4B6B58' }}
                />
              </div>
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontWeight: 900,
                fontSize: '0.94rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                marginTop: '6px'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating Customer Account...</span>
                </>
              ) : (
                <span>Complete Customer Registration</span>
              )}
            </button>
          </form>
        )}

        {/* Security Assurance Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#648270',
          fontSize: '0.72rem',
          borderTop: '1px solid #EBF8F1',
          paddingTop: '12px'
        }}>
          <ShieldCheck size={14} color="#16A34A" />
          <span>FD Secured 256-bit Encryption • PostgreSQL Protected</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuthModal;
