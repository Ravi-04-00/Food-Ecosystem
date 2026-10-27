import React, { useState } from 'react';
import { 
  Mail, Lock, Phone, User, MapPin, Camera, 
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { registerCustomer } from '../services/api.js';

export const CustomerRegistrationPage = ({ onNavigateToLogin, onNavigateHome }) => {
  const { login } = useCustomer();

  // Registration form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Toggles & feedback
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successData, setSuccessData] = useState(null);

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
      errors.email = ['Please provide a valid email address (e.g. yourname@domain.com).'];
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

      const res = await registerCustomer(formData);

      if (res && (res.success || res.id || res.user)) {
        setSuccessData(res);
        if (login) {
          login(email.trim().toLowerCase(), password);
        }
      } else {
        setGeneralError(res?.message || 'Registration failed. Please check inputs.');
        if (res?.errors) setFieldErrors(res.errors);
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        if (err.errors) setFieldErrors(err.errors);
        setGeneralError(err.message || err.error || 'Server validation error.');
      } else {
        setGeneralError('Network error connecting to backend service.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF5] text-[#0A2E1B] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(10,46,27,0.08)] space-y-6">

        {/* Back Link & Brand Logo */}
        <div className="flex items-center justify-between">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#525760] hover:text-[#0A2E1B] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Explore</span>
            </button>
          )}
          <div className="mx-auto">
            <FDOrganicLogo size="md" theme="light" showWordmark={true} showTagline={false} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles size={12} className="text-[#22C55E]" />
            New Customer Account
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2E1B] tracking-tight">
            Create Your FD Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#525760]">
            Experience luxury food ordering, real-time dispatch & curated chef specials
          </p>
        </div>

        {/* Success Confirmation State */}
        {successData ? (
          <div className="py-6 space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs uppercase mb-2">
                Status: APPROVED & ACTIVE
              </span>
              <h2 className="text-xl font-bold text-[#0A2E1B]">Welcome to Fast Delivery!</h2>
              <p className="text-xs text-[#525760] max-w-md mx-auto mt-2 leading-relaxed">
                Thank you, <strong className="text-[#0A2E1B]">{fullName}</strong>. Your customer account has been created and you are now authenticated.
              </p>
            </div>

            <div className="bg-[#F8FAF6] border border-[#CBD5E1] rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#525760]">Registered Email:</span>
                <span className="text-[#0A2E1B] font-mono font-bold">{email}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#525760]">Phone Number:</span>
                <span className="text-[#0A2E1B] font-mono font-bold">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525760]">Default Address:</span>
                <span className="text-[#0A2E1B] truncate max-w-[200px] font-bold">{address}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateHome || onNavigateToLogin}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0A2E1B] to-[#15803D] text-white shadow-lg shadow-emerald-900/15 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Exploring Dishes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* General Error Alert */}
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sundaram"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.full_name ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none`}
                />
                <User size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
              </div>
              {fieldErrors.full_name && (
                <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.full_name[0]}</p>
              )}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="customer@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none`}
                  />
                  <Mail size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none font-mono`}
                  />
                  <Phone size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                </div>
                {fieldErrors.phone && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.phone[0]}</p>
                )}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                  Password (8+ chars) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full pl-9 pr-9 py-2.5 rounded-xl border ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none`}
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0A2E1B] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full pl-9 pr-9 py-2.5 rounded-xl border ${fieldErrors.confirm_password ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none`}
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0A2E1B] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.confirm_password[0]}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                Primary Delivery Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Flat/House No, Street, Landmark, City, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${fieldErrors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none resize-none font-sans`}
                />
                <MapPin size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
              </div>
              {fieldErrors.address && (
                <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.address[0]}</p>
              )}
            </div>

            {/* Profile Photo (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
                Profile Photo (Optional, Max 5MB)
              </label>
              <div className="flex items-center gap-3">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#22C55E]"
                    />
                    <button
                      type="button"
                      onClick={() => { setProfilePhoto(null); setPhotoPreview(null); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#F8FAF6] border border-dashed border-[#CBD5E1] flex items-center justify-center text-[#94A3B8]">
                    <Camera size={18} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoChange}
                  className="text-[11px] text-[#525760]"
                />
              </div>
              {fieldErrors.profile_photo && (
                <p className="text-red-500 text-[11px] mt-1 font-semibold">{fieldErrors.profile_photo[0]}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0A2E1B] to-[#15803D] hover:from-[#051B10] hover:to-[#0A2E1B] text-white shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registering Customer Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start Ordering</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Link to Login */}
            <div className="text-center pt-2 border-t border-[#F1F5E9]">
              <p className="text-xs text-[#525760]">
                Already have an FD account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-[#15803D] hover:text-[#0A2E1B] underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Sign In instead
                </button>
              </p>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default CustomerRegistrationPage;
