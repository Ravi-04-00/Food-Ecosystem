import React, { useState } from 'react';
import { 
  X, CheckCircle, Shield, Smartphone, User, FileText, 
  Camera, CheckCheck, ChevronRight, ChevronLeft, Sparkles, 
  Lock, Mail, Bike, AlertCircle, Loader2, Clock, MapPin, Eye, EyeOff 
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { registerDeliveryPartner } from '../services/api.js';

const ALLOWED_VEHICLES = ['Bike', 'Scooter', 'Electric Bike', 'Car', 'Bicycle', 'Other'];

export const FDPartnerRegistrationModal = ({ isOpen, onClose, onComplete }) => {
  // Required fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');

  // Optional fields
  const [vehicleType, setVehicleType] = useState('Bike');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Toggles & feedback
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  if (!isOpen) return null;

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

    // 1. Full name: required, min reasonable length, letters & spaces, reject invalid special chars
    const nameTrim = fullName.trim();
    if (!nameTrim || nameTrim.length < 2) {
      errors.full_name = ['Full legal name must be at least 2 characters.'];
    } else if (!/^[a-zA-Z\s\.\-']{2,100}$/.test(nameTrim)) {
      errors.full_name = ['Only alphabets, spaces, dots, and hyphens are allowed. Special characters are rejected.'];
    }

    // 2. Email: required, valid email format, normalize email
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = ['Valid email address is required (e.g. rider@fastdelivery.io).'];
    }

    // 3. Phone: required, realistic phone format, prevent repetitive digits & sequences
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = ['Valid phone number is required (10+ digits).'];
    } else if (/^(\d)\1+$/.test(cleanPhone)) {
      errors.phone = ['Invalid phone number. Repetitive digits are rejected.'];
    } else if (cleanPhone.endsWith('1234567890') || cleanPhone.endsWith('9876543210')) {
      errors.phone = ['Invalid phone number. Common dummy sequences are rejected.'];
    }

    // 4. Password: required, min 8 chars
    if (!password || password.length < 8) {
      errors.password = ['Password must be at least 8 characters.'];
    }

    // 5. Confirm password: required, must match
    if (!confirmPassword) {
      errors.confirm_password = ['Please confirm your password.'];
    } else if (password !== confirmPassword) {
      errors.confirm_password = ['Passwords do not match.'];
    }

    // 6. Address: required, minimum reasonable length
    const addrTrim = address.trim();
    if (!addrTrim || addrTrim.length < 5) {
      errors.address = ['Residential or operational address is required (at least 5 characters).'];
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
      formData.append('role', 'DELIVERY_PARTNER');

      // Optional fields
      if (vehicleType) {
        formData.append('vehicle_type', vehicleType);
      }
      if (vehicleModel.trim()) {
        formData.append('vehicle_model', vehicleModel.trim());
      }
      if (vehicleNumber.trim()) {
        formData.append('vehicle_number', vehicleNumber.trim().toUpperCase());
      }
      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }

      const res = await registerDeliveryPartner(formData);
      setSubmittedData(res);
      if (onComplete) {
        onComplete(res);
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        if (err.errors) {
          setFieldErrors(err.errors);
        } else if (err.error) {
          setGeneralError(err.error);
        } else if (err.message) {
          setGeneralError(err.message);
        } else {
          setFieldErrors(err);
        }
      } else {
        setGeneralError('Network error connecting to operations backend. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setAddress('');
    setVehicleType('Bike');
    setVehicleModel('');
    setVehicleNumber('');
    setProfilePhoto(null);
    setPhotoPreview(null);
    setFieldErrors({});
    setGeneralError('');
    setSubmittedData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none font-sans">
      <div className="relative w-full max-w-xl bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F7FAF5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FDOrganicLogo 
              size="sm" 
              theme="light" 
              showWordmark={false} 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#0A2E1B]">Become an FD Delivery Partner</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Phase 2 Verified
                </span>
              </div>
              <p className="text-[11px] text-[#525760]">Fast Delivery Commercial Fleet Onboarding</p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#CBD5E1] text-[#525760] hover:text-[#0A2E1B] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-[#0A2E1B]">

          {/* Pending Verification Success Confirmation Screen */}
          {submittedData ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center">
                <CheckCircle size={32} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs uppercase mb-2">
                  Status: PENDING FLEET VERIFICATION
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#0A2E1B]">Partner Application Registered!</h3>
                <p className="text-xs text-[#525760] max-w-md mx-auto mt-2 leading-relaxed">
                  Thank you, <strong className="text-[#0A2E1B]">{submittedData.user?.full_name || fullName}</strong>. Your partner profile has been registered in the operations queue and provisioned in PostgreSQL.
                </p>
              </div>

              <div className="bg-[#F8FAF6] border border-[#CBD5E1] rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
                <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#525760]">Partner ID / Email:</span>
                  <span className="text-[#0A2E1B] font-mono font-bold">{submittedData.user?.email || email}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#525760]">Phone Contact:</span>
                  <span className="text-[#0A2E1B] font-mono font-bold">{submittedData.user?.phone || phone}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#525760]">Operating Address:</span>
                  <span className="text-[#0A2E1B] font-medium truncate max-w-[200px]">{address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525760]">Fleet Operations Status:</span>
                  <span className="text-amber-700 font-bold">In Verification Queue</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0A2E1B] to-[#15803D] text-white shadow-lg shadow-emerald-900/15 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Return to Partner Login
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* General Error Alert */}
              {generalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-[#0A2E1B] font-bold block mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. Suresh Sundaram"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={`w-full bg-[#F8FAF6] border ${fieldErrors.full_name ? 'border-red-500' : 'border-[#CBD5E1]'} rounded-xl pl-9 pr-3 py-2 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20`}
                  />
                  <User size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                </div>
                {fieldErrors.full_name && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.full_name[0]}</p>
                )}
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#0A2E1B] font-bold block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="rider@fastdelivery.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full bg-[#F8FAF6] border ${fieldErrors.email ? 'border-red-500' : 'border-[#CBD5E1]'} rounded-xl pl-9 pr-3 py-2 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20`}
                    />
                    <Mail size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.email[0]}</p>
                  )}
                </div>

                <div>
                  <label className="text-[#0A2E1B] font-bold block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="+91 98888 77777"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className={`w-full bg-[#F8FAF6] border ${fieldErrors.phone ? 'border-red-500' : 'border-[#CBD5E1]'} rounded-xl pl-9 pr-3 py-2 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 font-mono`}
                    />
                    <Smartphone size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.phone[0]}</p>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password Grid with Eye Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#0A2E1B] font-bold block mb-1">
                    Password (8+ chars) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full bg-[#F8FAF6] border ${fieldErrors.password ? 'border-red-500' : 'border-[#CBD5E1]'} rounded-xl pl-9 pr-9 py-2 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20`}
                    />
                    <Lock size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0A2E1B] cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.password[0]}</p>
                  )}
                </div>

                <div>
                  <label className="text-[#0A2E1B] font-bold block mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full bg-[#F8FAF6] border ${fieldErrors.confirm_password ? 'border-red-500' : 'border-[#CBD5E1]'} rounded-xl pl-9 pr-9 py-2 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20`}
                    />
                    <Lock size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0A2E1B] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.confirm_password && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.confirm_password[0]}</p>
                  )}
                </div>
              </div>

              {/* Address (Required in Phase 2) */}
              <div>
                <label className="text-[#0A2E1B] font-bold block mb-1">
                  Operating / Residential Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Street address, Area, City, Pin code"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className={`w-full bg-[#F8FAF6] border ${fieldErrors.address ? 'border-red-500' : 'border-[#CBD5E1]'} rounded-xl pl-9 pr-3 py-2 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 resize-none font-sans`}
                  />
                  <MapPin size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                </div>
                {fieldErrors.address && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.address[0]}</p>
                )}
              </div>

              {/* Vehicle Details (Optional in Phase 2) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAF5] border border-[#CBD5E1] space-y-3">
                <div className="flex items-center justify-between text-[#0A2E1B] font-bold text-xs pb-1 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Bike size={15} className="text-[#15803D]" />
                    <span>Vehicle Details</span>
                  </div>
                  <span className="text-[10px] text-[#525760] font-normal">(Optional during initial onboarding)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[#525760] text-[11px] font-bold block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    >
                      {ALLOWED_VEHICLES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#525760] text-[11px] font-bold block mb-1">
                      Vehicle Model (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ather 450X"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-[#525760] text-[11px] font-bold block mb-1">
                      Vehicle Plate # (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="KA-05-EM-9988"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-[#0A2E1B] placeholder-[#94A3B8] uppercase font-mono focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Photo (Optional) */}
              <div>
                <label className="text-[#0A2E1B] font-bold block mb-1">
                  Partner Profile Photo (Optional, Max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  {photoPreview ? (
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Profile Preview" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#22C55E]" 
                      />
                      <button
                        type="button"
                        onClick={() => { setProfilePhoto(null); setPhotoPreview(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#F8FAF6] border border-dashed border-[#CBD5E1] flex items-center justify-center">
                      <Camera size={16} className="text-[#94A3B8]" />
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
                  <p className="text-red-500 text-[11px] mt-1">{fieldErrors.profile_photo[0]}</p>
                )}
              </div>

              {/* Mandatory Verification Note */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 text-[11px]">
                <Clock size={15} className="flex-shrink-0 text-amber-600" />
                <span>
                  Admin verification is strictly required upon registration before receiving delivery requests.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] bg-gradient-to-r from-[#0A2E1B] to-[#15803D] hover:from-[#051B10] hover:to-[#0A2E1B] shadow-emerald-900/15 disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Application to PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Partner Application</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default FDPartnerRegistrationModal;
