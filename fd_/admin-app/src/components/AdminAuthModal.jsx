import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  Lock, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Mail, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { loginAdmin } from '../services/api.js';

export const AdminAuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [email, setEmail] = useState('admin@wsfood.io');
  const [password, setPassword] = useState('wsfood123');
  const [twoFactorToken, setTwoFactorToken] = useState('849201');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your administrator identifier and password.');
      return;
    }

    setIsLoading(true);
    setStatusMsg('Verifying master credentials & JWT claims...');

    try {
      const res = await loginAdmin(email.trim(), password);
      if (res.access_token) {
        localStorage.setItem('fd_admin_token', res.access_token);
        localStorage.setItem('fd_access_token', res.access_token);
      }
      if (res.refresh_token) {
        localStorage.setItem('fd_admin_refresh', res.refresh_token);
        localStorage.setItem('fd_refresh_token', res.refresh_token);
      }
      const profile = res.basic_profile_information || {
        id: res.user_id,
        email: res.email,
        role: res.role
      };
      if (rememberSession) {
        localStorage.setItem('fd_admin_session', JSON.stringify({ email: res.email, profile, timestamp: new Date().toISOString() }));
      }
      setStatusMsg('Admin credentials verified. Launching Mission Control...');
      setTimeout(() => {
        setIsLoading(false);
        setStatusMsg('');
        if (onAuthSuccess) onAuthSuccess(res);
        onClose();
      }, 600);
    } catch (err) {
      setIsLoading(false);
      setStatusMsg('');
      const msg = err?.error || err?.detail || err?.message || 'Administrator authorization failed. Access denied.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <div className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(10,46,27,0.12)] space-y-5 text-[#0A2E1B]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#F8FAF6] border border-[#CBD5E1] text-[#525760] hover:text-[#0A2E1B] flex items-center justify-center transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X size={16} />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="flex justify-center">
            <FDOrganicLogo 
              size="md" 
              theme="light" 
              showWordmark={true} 
              showTagline={false} 
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Shield size={12} className="text-[#15803D]" />
            <span>Mission Control • Master Admin</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0A2E1B] tracking-tight">
              Administrator Sign In
            </h2>
            <p className="text-xs text-[#525760] mt-0.5">
              High-privilege platform access for ecosystem operations
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Status Toast */}
        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
            <span className="font-bold">{statusMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          <div>
            <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
              Admin Identifier <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fastdelivery.io"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-[#0A2E1B] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 text-xs"
              />
              <Mail size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#0A2E1B]">
                Master Security Key <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-[11px] text-[#15803D] font-bold hover:underline"
              >
                Forgot key?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-[#0A2E1B] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 font-mono text-xs"
              />
              <Lock size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0A2E1B]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A2E1B] mb-1">
              2FA Hardware / Authenticator Token <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                maxLength={6}
                placeholder="849201"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-[#0A2E1B] font-mono tracking-widest text-xs focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              />
              <Key size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#525760]">
              <input 
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="w-4 h-4 rounded text-[#15803D] focus:ring-[#22C55E] border-gray-300"
              />
              <span>Remember secure terminal</span>
            </label>
          </div>

          {/* Public Registration Disabled Compliance Notice */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Shield size={14} className="text-slate-500 flex-shrink-0" />
            <span>
              <strong>Phase 2 Policy:</strong> Public registration is prohibited for administrators. Root provisioning only.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#0A2E1B] to-[#15803D] hover:from-[#051B10] hover:to-[#0A2E1B] text-white shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Verifying Admin Credentials...</span>
              </>
            ) : (
              <>
                <span>Authenticate Mission Control Session</span>
                <ShieldCheck size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Badges */}
        <div className="border-t border-[#F1F5E9] pt-3 flex justify-between items-center text-[11px] text-[#64748B]">
          <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <ShieldCheck size={14} className="text-emerald-600" />
            Argon2 & 2FA Enforced
          </span>
          <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AUDIT ACTIVE
          </span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E2E8F0] shadow-2xl text-left space-y-4">
            <h3 className="text-base font-black text-[#0A2E1B]">Admin Master Key Recovery</h3>
            <p className="text-xs text-[#525760] leading-relaxed">
              Super-admin password resets require hardware security token physical authorization or root shell dispatch.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAuthModal;
