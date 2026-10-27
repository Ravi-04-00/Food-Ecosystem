import React, { useState } from 'react';
import { 
  X, Store, Lock, Mail, Phone, ShieldCheck, CheckCircle2, 
  AlertCircle, Loader2, User, MapPin, Camera, Clock, Eye, EyeOff, Sparkles 
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { registerRestaurant, loginRestaurant } from '../services/api.js';

export const RestaurantAuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');

  React.useEffect(() => {
    setIsRegister(initialMode === 'register');
  }, [initialMode, isOpen]);

  // Sign In Form state
  const [loginEmail, setLoginEmail] = useState('shop@wsfood.io');
  const [loginPassword, setLoginPassword] = useState('wsfood123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');

  // Registration Form state
  const [ownerName, setOwnerName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('12423002000451');
  const [restaurantLogo, setRestaurantLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Status & Feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loginStatusMsg, setLoginStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your merchant email or phone.');
      setLoginLoading(false);
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      setLoginLoading(false);
      return;
    }

    try {
      const res = await loginRestaurant(loginEmail.trim(), loginPassword);
      if (res.access_token) {
        localStorage.setItem('fd_restaurant_token', res.access_token);
        localStorage.setItem('fd_access_token', res.access_token);
      }
      if (res.refresh_token) {
        localStorage.setItem('fd_restaurant_refresh', res.refresh_token);
        localStorage.setItem('fd_refresh_token', res.refresh_token);
      }
      if (res.basic_profile_information) {
        localStorage.setItem('fd_restaurant_user', JSON.stringify(res.basic_profile_information));
      }
      setLoginLoading(false);
      setLoginStatusMsg('Kitchen authenticated successfully! Launching Kitchen Hub...');
      setTimeout(() => {
        setLoginStatusMsg('');
        if (onAuthSuccess) onAuthSuccess(res);
        onClose();
      }, 700);
    } catch (err) {
      setLoginLoading(false);
      const msg = err?.error || err?.detail || err?.message || 'Authentication failed. Please verify credentials.';
      setLoginError(msg);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordMsg(`Password reset instructions sent to ${loginEmail || 'your email'}.`);
    setTimeout(() => setForgotPasswordMsg(''), 4500);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, restaurant_logo: ['Logo file size must not exceed 5MB.'] }));
        return;
      }
      setRestaurantLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.restaurant_logo;
        return copy;
      });
    }
  };

  const validateClientSide = () => {
    const errors = {};
    const ownerTrim = ownerName.trim();
    if (!ownerTrim || ownerTrim.length < 2) {
      errors.owner_name = ['Owner name must be at least 2 characters.'];
    } else if (!/^[a-zA-Z\s\.\-']{2,100}$/.test(ownerTrim)) {
      errors.owner_name = ['Only alphabets, spaces, dots, and hyphens are allowed. Special characters are rejected.'];
    }

    const restNameTrim = restaurantName.trim();
    if (!restNameTrim || restNameTrim.length < 2) {
      errors.restaurant_name = ['Restaurant name must be at least 2 characters.'];
    }

    const emailTrim = regEmail.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = ['Valid business email is required.'];
    }

    const cleanPhone = regPhone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = ['Valid contact phone number is required (10+ digits).'];
    } else if (/^(\d)\1+$/.test(cleanPhone)) {
      errors.phone = ['Invalid phone number. Repetitive digits are not accepted.'];
    } else if (cleanPhone.endsWith('1234567890') || cleanPhone.endsWith('9876543210')) {
      errors.phone = ['Invalid phone number. Common dummy sequences are rejected.'];
    }

    if (!regPassword || regPassword.length < 8) {
      errors.password = ['Password must be at least 8 characters.'];
    }

    if (!confirmPassword) {
      errors.confirm_password = ['Please confirm your password.'];
    } else if (regPassword !== confirmPassword) {
      errors.confirm_password = ['Passwords do not match.'];
    }

    if (!restaurantAddress.trim() || restaurantAddress.trim().length < 5) {
      errors.restaurant_address = ['Kitchen operational address is required (at least 5 characters).'];
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
      formData.append('owner_name', ownerName.trim());
      formData.append('restaurant_name', restaurantName.trim());
      formData.append('email', regEmail.trim().toLowerCase());
      formData.append('phone', regPhone.trim());
      formData.append('password', regPassword);
      formData.append('confirm_password', confirmPassword);
      formData.append('restaurant_address', restaurantAddress.trim());
      formData.append('address', restaurantAddress.trim());
      formData.append('fssai_license', fssaiLicense.trim());
      formData.append('role', 'RESTAURANT');

      if (restaurantLogo) {
        formData.append('restaurant_logo', restaurantLogo);
      }

      const response = await registerRestaurant(formData);

      if (response && (response.success || response.id || response.user)) {
        setSuccessMsg(response.message || 'Restaurant partner application submitted! Launching dashboard...');
        setTimeout(() => {
          setIsSubmitting(false);
          if (onAuthSuccess) onAuthSuccess();
          onClose();
        }, 1200);
      } else {
        setGeneralError(response?.message || 'Registration failed. Please check inputs.');
        if (response?.errors) setFieldErrors(response.errors);
        setIsSubmitting(false);
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        if (err.errors) setFieldErrors(err.errors);
        setGeneralError(err.message || 'Server error during restaurant registration.');
      } else {
        setGeneralError('Server error during restaurant registration.');
      }
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
        maxWidth: isRegister ? '580px' : '440px',
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
            color: '#0A2E1B'
          }}
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FDOrganicLogo size="md" showWordmark={true} showTagline={false} theme="light" appName="RESTAURANT" />

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
            marginTop: '12px'
          }}>
            <Sparkles size={12} />
            <span>KITCHEN HUB • PORT 3001</span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '10px 0 2px 0', color: '#0A2E1B' }}>
            {isRegister ? 'Register Restaurant' : 'Kitchen Sign In'}
          </h2>
          <div style={{ fontSize: '0.84rem', color: '#4B6B58' }}>
            {isRegister 
              ? 'Join the FD network to reach thousands of gourmet diners'
              : 'Sign in to manage live orders, KDS queue & kitchen dispatch'}
          </div>
        </div>

        {/* Alerts / Feedback */}
        {loginStatusMsg && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{loginStatusMsg}</span>
          </div>
        )}

        {loginError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{loginError}</span>
          </div>
        )}

        {forgotPasswordMsg && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{forgotPasswordMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{successMsg}</span>
          </div>
        )}

        {generalError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '10px 14px', fontSize: '0.82rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            Kitchen Login
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
            Register Partner
          </button>
        </div>

        {/* 1. SIGN IN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                Business Email or Phone
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="chef_kane@fastdelivery.io"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
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
                    boxSizing: 'border-box'
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
                  Kitchen Access Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: '#16A34A', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter kitchen security password"
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
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22C55E'}
                  onBlur={(e) => e.target.style.borderColor = '#DCFCE7'}
                />
                <Lock size={16} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#648270' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
              <input 
                type="checkbox" 
                id="restRememberMe"
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#22C55E', cursor: 'pointer' }}
              />
              <label htmlFor="restRememberMe" style={{ fontSize: '0.78rem', color: '#4B6B58', fontWeight: 600, cursor: 'pointer' }}>
                Keep kitchen terminal active
              </label>
            </div>

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
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)'
              }}
            >
              {loginLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Kitchen Credentials...</span>
                </>
              ) : (
                <span>Launch Restaurant Terminal</span>
              )}
            </button>
          </form>
        ) : (
          /* 2. REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Owner Full Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. Chef Kane"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    style={{ width: '100%', border: fieldErrors.owner_name ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '10px 10px 10px 34px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box' }}
                  />
                  <User size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
                {fieldErrors.owner_name && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.owner_name[0]}</div>}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Restaurant Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. FD Gourmet Kitchen"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    style={{ width: '100%', border: fieldErrors.restaurant_name ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '10px 10px 10px 34px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box' }}
                  />
                  <Store size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
                {fieldErrors.restaurant_name && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.restaurant_name[0]}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Business Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="kitchen@brand.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    style={{ width: '100%', border: fieldErrors.email ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '10px 10px 10px 34px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box' }}
                  />
                  <Mail size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
                {fieldErrors.email && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.email[0]}</div>}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="+91 94440 12890"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                    style={{ width: '100%', border: fieldErrors.phone ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '10px 10px 10px 34px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box' }}
                  />
                  <Phone size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
                {fieldErrors.phone && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.phone[0]}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Password (8+ chars) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    style={{ width: '100%', border: fieldErrors.password ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '10px 32px 10px 34px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box' }}
                  />
                  <Lock size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{ position: 'absolute', right: '8px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#648270' }}
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.password[0]}</div>}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                  Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ width: '100%', border: fieldErrors.confirm_password ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '10px 32px 10px 34px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box' }}
                  />
                  <Lock size={15} color="#16A34A" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '8px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#648270' }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.confirm_password[0]}</div>}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                Kitchen Address & FSSAI <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={2}
                  placeholder="Plot, Street, Area, City, Pin, FSSAI #..."
                  value={restaurantAddress}
                  onChange={(e) => setRestaurantAddress(e.target.value)}
                  required
                  style={{ width: '100%', border: fieldErrors.restaurant_address ? '1.5px solid #EF4444' : '1.5px solid #DCFCE7', borderRadius: '12px', padding: '8px 12px 8px 36px', fontSize: '0.85rem', outline: 'none', background: '#F9FDFB', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }}
                />
                <MapPin size={16} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              </div>
              {fieldErrors.restaurant_address && <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '3px', fontWeight: 700 }}>{fieldErrors.restaurant_address[0]}</div>}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>
                Restaurant Brand Logo (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #22C55E' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EBF8F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} color="#16A34A" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: '0.78rem', color: '#4B6B58' }} />
              </div>
            </div>

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
                  <span>Submitting Merchant KYC Application...</span>
                </>
              ) : (
                <span>Submit Restaurant Registration</span>
              )}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#648270', fontSize: '0.72rem', borderTop: '1px solid #EBF8F1', paddingTop: '12px' }}>
          <ShieldCheck size={14} color="#16A34A" />
          <span>FD Merchant Escrow Protection • PostgreSQL Powered</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantAuthModal;
