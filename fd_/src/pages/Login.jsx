import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { WSLogo } from '../components/WSLogo.jsx';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login = ({ onNavigateToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('client@wshop.io');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err) {
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 max-w-md mx-auto px-4 sm:px-6 animate-fadeIn text-[#F5F5F5]">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl space-y-6 bg-[#151519]">
        
        <div className="text-center space-y-2">
          <WSLogo size="md" showTagline={true} className="justify-center" />
          <h2 className="font-serif text-2xl font-bold text-[#F5F5F5] pt-3">
            WSHOP Sign In
          </h2>
          <span className="text-xs text-[#A7A7AE] font-mono block">
            JWT AUTHENTICATION · REST API
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:outline-none focus:border-[#D6A85F]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
              SECURITY CREDENTIAL
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:outline-none focus:border-[#D6A85F]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full physical-btn py-3.5 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold shadow-xl hover:bg-[#F0C982] flex items-center justify-center space-x-2 transition-all"
          >
            <span>{loading ? 'AUTHENTICATING JWT...' : 'SIGN IN TO WSHOP'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#050505]" />
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-[#A7A7AE]">
          <span>New to WSHOP? </span>
          <button
            onClick={onNavigateToRegister}
            className="text-[#D6A85F] font-bold hover:underline"
          >
            Create an Account
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-[10px] text-[#A7A7AE] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D6A85F]" />
          <span>Django REST API & PostgreSQL Secured</span>
        </div>

      </div>
    </div>
  );
};
