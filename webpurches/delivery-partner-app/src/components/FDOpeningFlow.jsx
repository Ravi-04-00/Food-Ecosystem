import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Users, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText 
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { FDPartnerRegistrationModal } from './FDPartnerRegistrationModal.jsx';
import { FDCommonBrandIntro } from './FDCommonBrandIntro.jsx';
import { loginPartner } from '../services/api.js';

/**
 * FDOpeningFlow (Delivery Partner App)
 * 
 * Phase 1 Unified Brand Flow:
 * 1. Unified 3D Brand Intro (Three.js FD leaf emblem, light luxury, zero bike animations)
 * 2. Unified Light Luxury Partner Login Screen
 * 3. 11-Step KYC Registration Wizard Modal
 */
export const FDOpeningFlow = ({ onAuthenticated }) => {
  const [stage, setStage] = useState('intro'); // 'intro' | 'login'
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'phone'

  // Phone + OTP State
  const [mobileNumber, setMobileNumber] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['4', '8', '2', '1', '9', '5']);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Email / Password State
  const [identifier, setIdentifier] = useState('rider@wsfood.io');
  const [password, setPassword] = useState('wsfood123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    if (!isOtpSent || resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOtpSent, resendCountdown]);

  const handleRequestOtp = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
      setResendCountdown(30);
      setSuccessToast(`Verification code sent to +91 ${cleanPhone}`);
    }, 600);
  };

  const handleVerifyOtp = () => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      if (rememberSession) {
        localStorage.setItem('fd_delivery_partner_session', JSON.stringify({ phone: mobileNumber, loginAt: new Date().toISOString() }));
      }
      if (onAuthenticated) {
        onAuthenticated();
      }
    }, 500);
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or partner mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginPartner(identifier.trim(), password);
      if (res?.access_token) {
        localStorage.setItem('fd_delivery_token', res.access_token);
        localStorage.setItem('fd_access_token', res.access_token);
      }
      if (res?.refresh_token) {
        localStorage.setItem('fd_delivery_refresh', res.refresh_token);
        localStorage.setItem('fd_refresh_token', res.refresh_token);
      }
      const profile = res?.basic_profile_information || {
        id: res?.user_id,
        email: res?.email,
        role: res?.role
      };
      if (rememberSession) {
        localStorage.setItem('fd_delivery_partner_session', JSON.stringify({ user: identifier, profile, loginAt: new Date().toISOString() }));
      }
      setSuccessToast('Authenticated successfully! Launching Operations Hub...');
      setTimeout(() => {
        if (onAuthenticated) {
          onAuthenticated(res);
        }
      }, 500);
    } catch (err) {
      const msg = err?.error || err?.detail || err?.message || 'Invalid credentials. Please verify your email/phone and password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7FAF5] text-[#0A2E1B] overflow-hidden select-none font-sans">

      {/* ========================================================================= */}
      {/* 1. PHASE 1: COMMON BRAND INTRO SCREEN (2-4 Seconds - Three.js FD Leaf)     */}
      {/* ========================================================================= */}
      {stage === 'intro' && (
        <FDCommonBrandIntro 
          app="delivery" 
          onComplete={() => setStage('login')} 
        />
      )}

      {/* ========================================================================= */}
      {/* 2. LIGHT LUXURY PARTNER LOGIN SCREEN                                      */}
      {/* ========================================================================= */}
      {stage === 'login' && (
        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          
          {/* Subtle Ambient Botanical Glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
            <div className="absolute inset-0 bg-[radial-gradient(#22C55E_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.03]" />
          </div>

          {/* Centered Luxury Login Card */}
          <div className="relative z-10 w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(10,46,27,0.08)] space-y-6">
            
            {/* Brand Logo & Heading */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <FDOrganicLogo 
                  size="md" 
                  theme="light"
                  showWordmark={true} 
                  showTagline={false} 
                />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/60 mb-2">
                  <Sparkles size={12} className="text-[#22C55E]" />
                  Delivery Partner Command Hub
                </span>
                <h2 className="text-2xl font-extrabold text-[#0A2E1B] tracking-tight">
                  Welcome Back, Partner
                </h2>
                <p className="text-xs text-[#525760] mt-1">
                  Access live dispatch orders, earnings & shift operations
                </p>
              </div>

              {/* Login Method Tabs */}
              <div className="flex bg-[#F1F5E9] p-1 rounded-xl border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => { setLoginMethod('phone'); setErrorMessage(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginMethod === 'phone'
                      ? 'bg-white text-[#0A2E1B] shadow-sm'
                      : 'text-[#525760] hover:text-[#0A2E1B]'
                  }`}
                >
                  <Phone size={13} />
                  <span>Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('password'); setErrorMessage(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginMethod === 'password'
                      ? 'bg-white text-[#0A2E1B] shadow-sm'
                      : 'text-[#525760] hover:text-[#0A2E1B]'
                  }`}
                >
                  <KeyRound size={13} />
                  <span>Password</span>
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Toast */}
            {successToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <span>{successToast}</span>
              </div>
            )}

            {/* METHOD 1: PHONE + OTP */}
            {loginMethod === 'phone' && (
              <>
                {!isOtpSent ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-[#0A2E1B]">
                        Partner Registered Mobile <span className="text-red-500">*</span>
                      </label>
                      <div className="flex rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] focus-within:border-[#22C55E] focus-within:ring-2 focus-within:ring-[#22C55E]/20 transition-all overflow-hidden">
                        <div className="px-3.5 py-3 bg-[#EAEFE6] border-r border-[#CBD5E1] text-xs font-bold text-[#0A2E1B] flex items-center gap-1.5 select-none">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input 
                          type="tel" 
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210" 
                          maxLength={10}
                          className="flex-1 bg-transparent px-3.5 py-3 text-sm text-[#0A2E1B] placeholder-[#94A3B8] focus:outline-none font-mono"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        A one-time security code will be sent to confirm device dispatch.
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-[#525760]">
                        <input 
                          type="checkbox"
                          checked={rememberSession}
                          onChange={(e) => setRememberSession(e.target.checked)}
                          className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#22C55E] border-gray-300"
                        />
                        <span>Remember device</span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0A2E1B] to-[#15803D] hover:from-[#051B10] hover:to-[#0A2E1B] text-white shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: OTP Entry */
                  <div className="space-y-4">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#0A2E1B] font-bold">Enter 6-Digit Verification Code</span>
                        <button 
                          type="button"
                          onClick={() => { setIsOtpSent(false); setSuccessToast(''); }} 
                          className="text-[11px] text-[#15803D] font-bold hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Dispatched to partner phone <strong className="text-[#0A2E1B] font-mono">+91 {mobileNumber}</strong>
                      </p>

                      <div className="flex gap-2 justify-center py-2">
                        {otpDigits.map((digit, idx) => (
                          <input 
                            key={idx}
                            type="text" 
                            maxLength={1} 
                            value={digit}
                            onChange={(e) => {
                              const next = [...otpDigits];
                              next[idx] = e.target.value.slice(-1);
                              setOtpDigits(next);
                            }}
                            className="w-10 h-12 text-center text-lg font-bold bg-[#F8FAF6] border border-[#CBD5E1] rounded-xl text-[#0A2E1B] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <button 
                      type="button"
                      disabled={isLoading}
                      onClick={handleVerifyOtp}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0A2E1B] to-[#15803D] hover:from-[#051B10] hover:to-[#0A2E1B] text-white shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Verifying Token...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Enter Operations Hub</span>
                          <Check size={16} />
                        </>
                      )}
                    </button>

                    <div className="flex justify-between items-center text-[11px] text-[#64748B] pt-1">
                      <span>Didn't receive code?</span>
                      {resendCountdown > 0 ? (
                        <span className="text-[#94A3B8] font-mono">Resend in {resendCountdown}s</span>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => { setResendCountdown(30); setSuccessToast('New OTP dispatched.'); }} 
                          className="text-[#15803D] font-bold hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* METHOD 2: EMAIL / USERNAME & PASSWORD */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0A2E1B]">
                    Email Address or Partner Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="partner@fastdelivery.io or 9876543210"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-sm text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none"
                      required
                    />
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-[#0A2E1B]">
                      Partner Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] text-[#15803D] font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-sm text-[#0A2E1B] placeholder-[#94A3B8] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 focus:outline-none font-mono"
                      required
                    />
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-[#94A3B8]" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#94A3B8] hover:text-[#0A2E1B] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[#525760]">
                    <input 
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#22C55E] border-gray-300"
                    />
                    <span>Remember this session</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0A2E1B] to-[#15803D] hover:from-[#051B10] hover:to-[#0A2E1B] text-white shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as Partner</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Registration Navigation Link */}
            <div className="pt-2 text-center border-t border-[#F1F5E9]">
              <p className="text-xs text-[#525760]">
                New to Fast Delivery fleet?{' '}
                <button
                  type="button"
                  onClick={() => setRegModalOpen(true)}
                  className="font-bold text-[#15803D] hover:text-[#0A2E1B] underline underline-offset-2 ml-1"
                >
                  Register as Delivery Partner
                </button>
              </p>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 border-t border-[#F1F5E9]">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[#64748B]">
                <div className="p-2 rounded-xl bg-[#F8FAF6] border border-[#E2E8F0]">
                  <ShieldCheck size={14} className="mx-auto text-emerald-600 mb-1" />
                  <div className="font-semibold text-[#0A2E1B]">SSL Secured</div>
                </div>
                <div className="p-2 rounded-xl bg-[#F8FAF6] border border-[#E2E8F0]">
                  <Users size={14} className="mx-auto text-indigo-600 mb-1" />
                  <div className="font-semibold text-[#0A2E1B]">Verified Fleet</div>
                </div>
                <div className="p-2 rounded-xl bg-[#F8FAF6] border border-[#E2E8F0]">
                  <CheckCircle2 size={14} className="mx-auto text-amber-600 mb-1" />
                  <div className="font-semibold text-[#0A2E1B]">Daily Payouts</div>
                </div>
              </div>
            </div>

            {/* Security Audit Footer */}
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>FD FLEET ENGINE v2.4</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DISPATCH SECURE
              </span>
            </div>

          </div>
        </div>
      )}

      {/* 11-Step KYC Registration Wizard Modal */}
      <FDPartnerRegistrationModal 
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        onComplete={(_data) => {
          setRegModalOpen(false);
          if (onAuthenticated) onAuthenticated();
        }}
      />

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E2E8F0] shadow-2xl text-left space-y-4">
            <h3 className="text-base font-bold text-[#0A2E1B]">Partner Password Recovery</h3>
            <p className="text-xs text-[#525760] leading-relaxed">
              If you have registered with an email address or mobile phone, our fleet support desk will issue an instant verification SMS link.
            </p>
            <input 
              type="text" 
              placeholder="Enter your registered email or phone" 
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setForgotModalOpen(false);
                  setSuccessToast('Password recovery instructions dispatched via SMS/Email.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#15803D] text-white hover:bg-[#0A2E1B]"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FDOpeningFlow;
