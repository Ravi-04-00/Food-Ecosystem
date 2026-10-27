import React, { useState } from 'react';
import { 
  Store, User, Mail, Phone, Lock, MapPin, Camera, 
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { registerRestaurant } from '../services/api.js';

export const RestaurantRegistrationPage = ({ onNavigateToLogin, onNavigateHome }) => {
  // Registration form fields
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Toggles & feedback
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, restaurant_logo: ['Logo size must not exceed 5MB.'] }));
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

    // 1. Restaurant Name: required, minimum reasonable length
    const restNameTrim = restaurantName.trim();
    if (!restNameTrim || restNameTrim.length < 2) {
      errors.restaurant_name = ['Restaurant / Kitchen name must be at least 2 characters.'];
    }

    // 2. Owner Name: required, minimum reasonable length, allow alphabets and spaces, reject invalid special characters
    const ownerTrim = ownerName.trim();
    if (!ownerTrim || ownerTrim.length < 2) {
      errors.owner_name = ['Owner / Legal proprietor full name must be at least 2 characters.'];
    } else if (!/^[a-zA-Z\s\.\-']{2,100}$/.test(ownerTrim)) {
      errors.owner_name = ['Only alphabets, spaces, dots, and hyphens are allowed. Special characters are rejected.'];
    }

    // 3. Email: required, valid email format, normalize email
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = ['Please provide a valid business email address (e.g. kitchen@domain.com).'];
    }

    // 4. Phone: required, realistic phone format, prevent repetitive digits & sequences
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = ['Valid contact telephone or mobile number is required (at least 10 digits).'];
    } else if (/^(\d)\1+$/.test(cleanPhone)) {
      errors.phone = ['Invalid phone number. Repetitive digits are not accepted.'];
    } else if (cleanPhone.endsWith('1234567890') || cleanPhone.endsWith('9876543210')) {
      errors.phone = ['Invalid phone number. Common dummy sequences are rejected.'];
    }

    // 5. Password: required, min 8 chars
    if (!password || password.length < 8) {
      errors.password = ['Password must be at least 8 characters with a mix of letters and numbers.'];
    }

    // 6. Confirm Password: required, must match password
    if (!confirmPassword) {
      errors.confirm_password = ['Please confirm your password.'];
    } else if (password !== confirmPassword) {
      errors.confirm_password = ['Passwords do not match.'];
    }

    // 7. Restaurant Address: required, minimum reasonable length
    const addrTrim = restaurantAddress.trim();
    if (!addrTrim || addrTrim.length < 5) {
      errors.restaurant_address = ['Kitchen operational address is required (at least 5 characters).'];
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('restaurant_name', restaurantName.trim());
      formData.append('owner_name', ownerName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);
      formData.append('restaurant_address', restaurantAddress.trim());
      formData.append('address', restaurantAddress.trim());
      formData.append('role', 'RESTAURANT');

      if (restaurantLogo) {
        formData.append('restaurant_logo', restaurantLogo);
      }

      const response = await registerRestaurant(formData);

      if (response && (response.success || response.id || response.user)) {
        setSuccessData(response);
      } else {
        setGeneralError(response?.message || 'Registration could not be completed. Please review highlighted fields.');
        if (response?.errors) {
          setFieldErrors(response.errors);
        }
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        if (err.errors) {
          setFieldErrors(err.errors);
        }
        setGeneralError(err.message || 'Restaurant registration encountered an error. Please try again.');
      } else {
        setGeneralError('Network error or server unavailable. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '780px',
      margin: '0 auto',
      padding: '24px 16px 60px 16px',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      {/* Top Breadcrumb & Return Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={onNavigateHome || onNavigateToLogin}
          style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--ws-text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Hub</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#16A34A',
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 800
        }}>
          <Sparkles size={14} />
          <span>PHASE 2 • KITCHEN ONBOARDING</span>
        </div>
      </div>

      {/* Main Luxury Registration Card */}
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '28px',
        border: '1px solid var(--ws-border)',
        boxShadow: '0 20px 60px rgba(10, 46, 27, 0.08)',
        padding: '36px 32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Decorative Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '14px' }}>
            <FDOrganicLogo size="lg" showWordmark={true} showTagline={false} appName="RESTAURANT" />
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'var(--ws-text-primary)',
            letterSpacing: '-0.5px',
            margin: '0 0 8px 0'
          }}>
            Restaurant & Kitchen Partner Registration
          </h1>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--ws-text-secondary)',
            margin: 0,
            maxWidth: '540px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5
          }}>
            Onboard your culinary kitchen to the Fast Delivery ecosystem. Accept orders, manage live menus, and track settlements in real-time.
          </p>
        </div>

        {/* SUCCESS VIEW */}
        {successData ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)'
            }}>
              <CheckCircle2 size={42} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
              Kitchen Partner Registered Successfully!
            </h2>

            <p style={{ fontSize: '0.92rem', color: 'var(--ws-text-secondary)', maxWidth: '480px', lineHeight: 1.6, margin: 0 }}>
              Welcome, <strong style={{ color: '#16A34A' }}>{restaurantName}</strong>! Your restaurant merchant account has been provisioned in PostgreSQL. You can now access your kitchen dashboard.
            </p>

            <div style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              padding: '16px 24px',
              width: '100%',
              maxWidth: '440px',
              textAlign: 'left',
              marginTop: '8px'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', marginBottom: '4px' }}>
                <strong>Proprietor:</strong> {ownerName}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', marginBottom: '4px' }}>
                <strong>Business Email:</strong> {email}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', marginBottom: '4px' }}>
                <strong>Contact Phone:</strong> {phone}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)' }}>
                <strong>Kitchen Address:</strong> {restaurantAddress}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={onNavigateHome || onNavigateToLogin}
                style={{
                  background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 28px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)'
                }}
              >
                <span>Launch Kitchen Hub</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {generalError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Profile Photo / Brand Logo Upload (Optional) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px',
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '18px'
            }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(34, 197, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #22C55E',
                flexShrink: 0
              }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={26} color="#16A34A" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '2px' }}>
                  Restaurant Brand Logo <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ws-text-muted)' }}>(Optional)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', marginBottom: '8px' }}>
                  Upload JPEG, PNG or WebP image under 5MB. Displayed on public customer menus.
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange}
                  style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)' }}
                />
                {fieldErrors.restaurant_logo && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.restaurant_logo[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Grid 1: Restaurant Name & Owner Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Restaurant Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. Royal Spice Bistro"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--ws-surface)',
                      border: fieldErrors.restaurant_name ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '12px 14px 12px 40px',
                      fontSize: '0.9rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Store size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
                {fieldErrors.restaurant_name && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.restaurant_name[0]}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Owner / Proprietor Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. Chef Kane Johnson"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--ws-surface)',
                      border: fieldErrors.owner_name ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '12px 14px 12px 40px',
                      fontSize: '0.9rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
                {fieldErrors.owner_name && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.owner_name[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Grid 2: Business Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Business Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="kitchen@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--ws-surface)',
                      border: fieldErrors.email ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '12px 14px 12px 40px',
                      fontSize: '0.9rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Mail size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
                {fieldErrors.email && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.email[0]}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Contact Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="+91 94440 12890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--ws-surface)',
                      border: fieldErrors.phone ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '12px 14px 12px 40px',
                      fontSize: '0.9rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Phone size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
                {fieldErrors.phone && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.phone[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Grid 3: Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Password (8+ chars) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--ws-surface)',
                      border: fieldErrors.password ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '12px 40px 12px 40px',
                      fontSize: '0.9rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
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
                      color: 'var(--ws-text-secondary)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.password[0]}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--ws-surface)',
                      border: fieldErrors.confirm_password ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '12px 40px 12px 40px',
                      fontSize: '0.9rem',
                      color: 'var(--ws-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ws-text-secondary)'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                    {fieldErrors.confirm_password[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Operational Address (Required) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Restaurant & Kitchen Operational Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={3}
                  placeholder="Street address, Commercial Unit #, Landmark, City, Postal Code"
                  value={restaurantAddress}
                  onChange={(e) => setRestaurantAddress(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--ws-surface)',
                    border: fieldErrors.restaurant_address ? '1.5px solid #EF4444' : '1.5px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '12px 14px 12px 40px',
                    fontSize: '0.9rem',
                    color: 'var(--ws-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
                <MapPin size={18} color="#16A34A" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>
              {fieldErrors.restaurant_address && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>
                  {fieldErrors.restaurant_address[0]}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? 'rgba(34, 197, 94, 0.5)' : 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 24px',
                fontWeight: 900,
                fontSize: '0.98rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 18px rgba(34, 197, 94, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Provisioning Restaurant Account in PostgreSQL...</span>
                </>
              ) : (
                <>
                  <span>Complete Restaurant Registration</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Security Notice & Login Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--ws-border)',
              fontSize: '0.82rem',
              color: 'var(--ws-text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#16A34A" />
                <span>PostgreSQL Encrypted • FD Merchant Escrow</span>
              </div>
              {onNavigateToLogin && (
                <div>
                  Already a registered kitchen partner?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#16A34A',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Merchant Login
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RestaurantRegistrationPage;
