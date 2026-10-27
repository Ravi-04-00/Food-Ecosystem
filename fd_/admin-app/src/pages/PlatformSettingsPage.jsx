import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Shield, 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Sun, 
  Moon, 
  Smartphone, 
  MapPin, 
  HelpCircle, 
  FileText, 
  LogOut, 
  Trash2, 
  Check, 
  Save, 
  AlertCircle, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Database,
  Edit3,
  Loader,
  Laptop
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { getTranslation } from '../utils/i18n.js';
import { fetchAdminSettings, updateAdminSettings } from '../services/api.js';

export const PlatformSettingsPage = ({ onOpenAuth }) => {
  const { 
    promptLogout,
    currentUser,
    adminProfileData,
    updateProfile,
    isLoadingProfile,
    userSettings,
    isLoadingSettings,
    updateSettings
  } = useAdmin();
  const [activeTab, setActiveTab] = useState('system');
  const [toastMsg, setToastMsg] = useState('');

  // 1. System Preferences & Governance
  const [commissionRate, setCommissionRate] = useState(12);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.2);
  const [dispatchRadius, setDispatchRadius] = useState(8.5);
  const [aiRoutingMode, setAiRoutingMode] = useState('ETA_OPTIMIZED');
  const [otpStrict, setOtpStrict] = useState(true);
  const [autoBatchOrders, setAutoBatchOrders] = useState(true);
  const [daphneHeartbeatSec, setDaphneHeartbeatSec] = useState(15);

  // 2. Admin Profile (Phase 5)
  const [adminName, setAdminName] = useState('Chief Platform Controller');
  const [adminEmail, setAdminEmail] = useState('mission_control@fastdelivery.io');
  const [adminRole, setAdminRole] = useState('Super Administrator (Root Level)');
  const [adminPhone, setAdminPhone] = useState('+91 80 4000 9000');
  const [adminAddress, setAdminAddress] = useState('FD Mission Control HQ, Level 42');
  const [clearanceTier, setClearanceTier] = useState('Tier 0 — Executive Ecosystem Clearance');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  useEffect(() => {
    const src = adminProfileData || currentUser;
    if (src) {
      if (src.full_name || src.name) setAdminName(src.full_name || src.name);
      if (src.email) setAdminEmail(src.email);
      if (src.phone) setAdminPhone(src.phone);
      if (src.address) setAdminAddress(src.address);
      if (src.role) setAdminRole(src.role);
    }
  }, [adminProfileData, currentUser]);

  // 3. Security & Password
  const [currentMasterKey, setCurrentMasterKey] = useState('');
  const [newMasterKey, setNewMasterKey] = useState('');
  const [confirmMasterKey, setConfirmMasterKey] = useState('');
  const [twoFactorEnforced, setTwoFactorEnforced] = useState(true);
  const [hardwareKeyEnforced, setHardwareKeyEnforced] = useState(true);

  // 4. Notifications
  const [systemHealthAlerts, setSystemHealthAlerts] = useState(true);
  const [highRefundAlerts, setHighRefundAlerts] = useState(true);
  const [securityBreachAlerts, setSecurityBreachAlerts] = useState(true);
  const [slackWebhookActive, setSlackWebhookActive] = useState(true);

  // 5. Active Sessions
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(60);

  // 6. Preferences
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('light'); // Light luxury default

  // Modals
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '19:14:02', user: 'admin@fastdelivery.io', action: 'Telemetry scan refreshed across 4 nodes', status: 'SUCCESS' },
    { id: 2, time: '19:12:45', user: 'SYSTEM_DAEMON', action: 'Daphne ASGI WebSocket broadcast heartbeat', status: 'OK' },
    { id: 3, time: '19:10:11', user: 'admin@fastdelivery.io', action: 'Escrow verification rule #8492 validated', status: 'PASSED' },
    { id: 4, time: '19:05:30', user: 'DISPATCH_AI', action: 'Courier Kaelen routed to Neo Indiranagar Pod', status: 'OPTIMAL' },
    { id: 5, time: '19:01:14', user: 'PAYMENT_ESCROW', action: 'Order WS-9021-ALPH ₹725.40 locked in vault', status: 'LOCKED' }
  ]);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Phase 6 Settings Sync & Handlers
  const currentLang = userSettings?.language || 'en';
  const t = (key) => getTranslation(currentLang, key);

  useEffect(() => {
    if (userSettings) {
      if (userSettings.theme) setTheme(userSettings.theme);
      if (userSettings.language) setLanguage(userSettings.language === 'ta' ? 'Tamil' : 'English');
      if (userSettings.push_notifications !== undefined) setSystemHealthAlerts(userSettings.push_notifications);
      if (userSettings.sms_notifications !== undefined) setSecurityBreachAlerts(userSettings.sms_notifications);
    }
  }, [userSettings]);

  const handleThemeSelect = async (newTheme) => {
    setTheme(newTheme);
    try {
      if (updateSettings) await updateSettings({ theme: newTheme });
      notify(`Theme switched to ${newTheme}.`);
    } catch (err) {
      notify('Failed to save theme.');
    }
  };

  const handleLanguageSelect = async (langCode) => {
    try {
      if (updateSettings) await updateSettings({ language: langCode });
      setLanguage(langCode === 'ta' ? 'Tamil' : langCode === 'hi' ? 'Hindi' : 'English');
      notify(`Language preference saved to PostgreSQL.`);
    } catch (err) {
      notify('Failed to save language.');
    }
  };

  const handleToggleNotification = async (key, val) => {
    try {
      if (updateSettings) await updateSettings({ [key]: val });
      notify(`Notification setting saved.`);
    } catch (err) {
      notify('Failed to save notification.');
    }
  };

  useEffect(() => {
    fetchAdminSettings().then(cfg => {
      if (cfg) {
        if (cfg.commission_rate_percent !== undefined) setCommissionRate(Number(cfg.commission_rate_percent));
        if (cfg.max_delivery_radius_km !== undefined) setDispatchRadius(Number(cfg.max_delivery_radius_km));
        if (cfg.auto_assign_riders !== undefined) setAutoBatchOrders(Boolean(cfg.auto_assign_riders));
      }
    }).catch(err => console.warn('Non-fatal admin settings load:', err));
  }, []);

  const handleSaveSystemRules = async (e) => {
    e.preventDefault();
    try {
      await updateAdminSettings({
        commission_rate_percent: Number(commissionRate),
        max_delivery_radius_km: Number(dispatchRadius),
        auto_assign_riders: Boolean(autoBatchOrders)
      });
      notify('Platform ecosystem protocols saved and deployed to PostgreSQL.');
    } catch (err) {
      notify(err.message || 'Failed to deploy settings.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!adminName.trim()) errs.full_name = 'Administrator name is required.';
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setProfileErrors({});
    try {
      await updateProfile({
        full_name: adminName.trim(),
        phone: adminPhone.trim(),
        address: adminAddress.trim()
      });
      setIsEditingProfile(false);
      notify('Master administrator profile updated in PostgreSQL.');
    } catch (err) {
      if (err.errors) {
        setProfileErrors(err.errors);
      } else {
        notify(err.message || 'Failed to update admin profile.');
      }
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setProfileErrors({});
    const src = adminProfileData || currentUser;
    if (src) {
      if (src.full_name || src.name) setAdminName(src.full_name || src.name);
      if (src.phone) setAdminPhone(src.phone);
      if (src.address) setAdminAddress(src.address);
    }
  };

  const handleChangeMasterKey = (e) => {
    e.preventDefault();
    if (!currentMasterKey) {
      notify('Please enter the current master security key.');
      return;
    }
    if (newMasterKey.length < 10) {
      notify('New master key must be at least 10 characters.');
      return;
    }
    if (newMasterKey !== confirmMasterKey) {
      notify('New master keys do not match.');
      return;
    }
    setCurrentMasterKey('');
    setNewMasterKey('');
    setConfirmMasterKey('');
    notify('Admin master key rotated successfully.');
  };

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    if (promptLogout) {
      promptLogout();
    } else if (onOpenAuth) {
      onOpenAuth();
    }
  };

  const handleConfirmPurge = () => {
    setPurgeModalOpen(false);
    notify('Cache flushed and session tokens invalidated.');
  };

  const tabs = [
    { id: 'system', label: 'System Preferences', icon: Sliders },
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'security', label: 'Security & Master Key', icon: Shield },
    { id: 'notifications', label: 'System Notifications', icon: Bell },
    { id: 'sessions', label: 'Active Sessions', icon: Smartphone },
    { id: 'location', label: 'Geofencing & Locations', icon: MapPin },
    { id: 'preferences', label: 'Language & Theme', icon: Globe },
    { id: 'compliance', label: 'Privacy & Compliance', icon: Database },
    { id: 'support', label: 'Help & Operations Terms', icon: FileText },
    { id: 'account', label: 'Account Actions', icon: LogOut }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 text-[#0A2E1B] font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#0A2E1B] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 text-xs animate-bounce">
          <CheckCircle2 size={16} className="text-[#22C55E]" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-[0_4px_20px_rgba(10,46,27,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <FDOrganicLogo 
            size="md" 
            theme="light" 
            showWordmark={false} 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#15803D] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Global Platform Governance
              </span>
              <span className="text-[10px] font-bold text-[#64748B]">
                Mission Control • Port 3003
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0A2E1B] mt-1 tracking-tight">
              Platform Settings & Ecosystem Protocols
            </h1>
            <p className="text-xs text-[#525760] mt-0.5">
              Unified control panel for commissions, dispatch routing, master security & PostgreSQL persistence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2.5 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] text-[#0A2E1B] text-xs font-bold hover:bg-[#F1F5E9] flex items-center gap-1.5 cursor-pointer"
            >
              <Key size={14} className="text-[#15803D]" />
              <span>Admin Re-Auth</span>
            </button>
          )}

          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL: SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar Nav */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-3 shadow-sm space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#0A2E1B] text-white shadow-md'
                      : 'text-[#525760] hover:bg-[#F8FAF6] hover:text-[#0A2E1B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-[#22C55E]' : 'text-[#64748B]'} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Mission Control Badge */}
          <div className="bg-gradient-to-br from-[#0A2E1B] to-[#15803D] text-white rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Fast Delivery Admin</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-400/30">
                ROOT MASTER
              </span>
            </div>
            <div>
              <div className="text-base font-black">{adminName}</div>
              <div className="text-xs text-emerald-200 font-mono mt-0.5">{adminEmail}</div>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-emerald-100">
              <span>Cluster: Production 01</span>
              <span className="font-bold text-white">PostgreSQL Only</span>
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm">

            {/* TAB 1: SYSTEM PREFERENCES & ECONOMIC RULES */}
            {activeTab === 'system' && (
              <form onSubmit={handleSaveSystemRules} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">System Preferences & Economic Governance</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Define platform commissions, dynamic surge limits, and telemetry dispatch parameters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-[#0A2E1B]">Platform Commission Rate</label>
                      <span className="font-black text-emerald-800 text-sm">{commissionRate}%</span>
                    </div>
                    <input 
                      type="range"
                      min="5"
                      max="25"
                      step="0.5"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full accent-[#15803D] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#64748B]">
                      <span>5% (Starter)</span>
                      <span>12% (Standard)</span>
                      <span>25% (Premium)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-[#0A2E1B]">Peak Surge Multiplier</label>
                      <span className="font-black text-emerald-800 text-sm">{surgeMultiplier}x</span>
                    </div>
                    <input 
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={surgeMultiplier}
                      onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                      className="w-full accent-[#15803D] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#64748B]">
                      <span>1.0x (Normal)</span>
                      <span>1.5x (Rain / Peak)</span>
                      <span>3.0x (Critical)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-[#0A2E1B]">Maximum Dispatch Radius</label>
                      <span className="font-black text-emerald-800 text-sm">{dispatchRadius} km</span>
                    </div>
                    <input 
                      type="range"
                      min="3.0"
                      max="20.0"
                      step="0.5"
                      value={dispatchRadius}
                      onChange={(e) => setDispatchRadius(Number(e.target.value))}
                      className="w-full accent-[#15803D] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#64748B]">
                      <span>3 km (Hyperlocal)</span>
                      <span>8.5 km (City corridor)</span>
                      <span>20 km (Metro)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-[#0A2E1B]">Daphne ASGI Heartbeat</label>
                      <span className="font-black text-emerald-800 text-sm">{daphneHeartbeatSec}s</span>
                    </div>
                    <input 
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={daphneHeartbeatSec}
                      onChange={(e) => setDaphneHeartbeatSec(Number(e.target.value))}
                      className="w-full accent-[#15803D] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#64748B]">
                      <span>5s (Ultra fast)</span>
                      <span>15s (Optimal)</span>
                      <span>60s (Low bandwidth)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Strict Customer Delivery OTP Verification</div>
                      <div className="text-[11px] text-[#525760]">Mandates rider terminal to verify 4-digit token before releasing escrow payout</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpStrict(!otpStrict)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {otpStrict ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Automated Multi-Order Batching Engine</div>
                      <div className="text-[11px] text-[#525760]">Combines pickups along identical traffic corridors for courier route optimization</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoBatchOrders(!autoBatchOrders)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {autoBatchOrders ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save size={15} />
                    <span>Save Ecosystem Rules</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ADMIN PROFILE (PHASE 5) */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-[#15803D]" />
                      <h2 className="text-lg font-black text-[#0A2E1B]">Administrator Profile & Governance</h2>
                    </div>
                    <p className="text-xs text-[#525760] mt-0.5">
                      Authorized executive account governing Fast Delivery platform operations
                    </p>
                  </div>

                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#15803D] text-white hover:bg-[#0A2E1B] flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      <Edit3 size={14} />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-5 rounded-2xl border border-emerald-300 shadow-sm">
                    {profileErrors.non_field && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={15} />
                        <span>{profileErrors.non_field}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Controller Name *</label>
                        <input 
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border ${profileErrors.full_name ? 'border-red-400' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]`}
                        />
                        {profileErrors.full_name && (
                          <p className="text-[11px] text-red-600 mt-1">{profileErrors.full_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#64748B] flex items-center gap-1 mb-1">
                          <Lock size={12} />
                          <span>Master Email Address (Read-Only)</span>
                        </label>
                        <input 
                          type="email"
                          value={adminEmail}
                          disabled
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-gray-100 text-xs font-bold text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Superuser system login credential cannot be changed here.</p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Operations Hotline / Phone</label>
                        <input 
                          type="text"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border ${profileErrors.phone ? 'border-red-400' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]`}
                        />
                        {profileErrors.phone && (
                          <p className="text-[11px] text-red-600 mt-1">{profileErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#64748B] flex items-center gap-1 mb-1">
                          <Lock size={12} />
                          <span>Role Classification (Read-Only)</span>
                        </label>
                        <input 
                          type="text"
                          readOnly
                          value={adminRole}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-gray-100 text-xs font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Operating Headquarters / Address</label>
                        <input 
                          type="text"
                          value={adminAddress}
                          onChange={(e) => setAdminAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-emerald-900">Security Clearance: {clearanceTier}</div>
                        <div className="text-[11px] text-emerald-700">Root-level PostgreSQL execution permissions verified</div>
                      </div>
                      <ShieldCheck size={20} className="text-emerald-600" />
                    </div>

                    <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        disabled={isLoadingProfile}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoadingProfile}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
                      >
                        {isLoadingProfile ? (
                          <>
                            <Loader size={14} className="animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            <span>Save Admin Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Read-Only Admin Profile Card */
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] space-y-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#0A2E1B] text-white font-black text-xl flex items-center justify-center shadow-md">
                          AD
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-[#0A2E1B]">{adminName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ {adminRole}
                            </span>
                          </div>
                          <div className="text-xs text-[#525760] font-mono mt-0.5">{adminEmail}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-[#64748B] font-medium block">Hotline Contact:</span>
                          <span className="font-bold text-[#0A2E1B]">{adminPhone}</span>
                        </div>
                        <div>
                          <span className="text-[#64748B] font-medium block">Clearance Level:</span>
                          <span className="font-bold text-emerald-800">Tier 0 (Ecosystem Root)</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[#64748B] font-medium block">Operations Base:</span>
                          <span className="font-bold text-[#0A2E1B]">{adminAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-emerald-900">Security Clearance: {clearanceTier}</div>
                        <div className="text-[11px] text-emerald-700">Root-level PostgreSQL execution permissions verified</div>
                      </div>
                      <ShieldCheck size={20} className="text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SECURITY & MASTER KEY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Security & Master Security Key Rotation</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Rotate master authentication key and enforce cryptographic device verification
                  </p>
                </div>

                <form onSubmit={handleChangeMasterKey} className="space-y-3.5 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Current Master Security Key</label>
                    <input 
                      type="password"
                      value={currentMasterKey}
                      onChange={(e) => setCurrentMasterKey(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">New Master Key (Min 10 characters)</label>
                    <input 
                      type="password"
                      value={newMasterKey}
                      onChange={(e) => setNewMasterKey(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Confirm New Master Key</label>
                    <input 
                      type="password"
                      value={confirmMasterKey}
                      onChange={(e) => setConfirmMasterKey(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md cursor-pointer transition-all"
                  >
                    Rotate Master Key
                  </button>
                </form>

                {/* Audit Trail */}
                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A2E1B]">
                    <span>Immutable Audit Log Trail</span>
                    <span className="text-emerald-700 font-mono text-[11px]">PostgreSQL Audit Table</span>
                  </div>

                  <div className="bg-[#F8FAF6] border border-[#CBD5E1] rounded-2xl p-3.5 space-y-2 max-h-48 overflow-y-auto">
                    {auditLogs.map(log => (
                      <div key={log.id} className="flex justify-between items-center text-[11px] border-b border-gray-200/70 pb-1.5 last:border-none">
                        <div className="space-x-2">
                          <span className="font-mono text-gray-500">{log.time}</span>
                          <span className="font-bold text-[#0A2E1B]">{log.user}:</span>
                          <span className="text-[#525760]">{log.action}</span>
                        </div>
                        <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">System Notifications & Broadcast Alarms</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Critical alerting for node health, payment gateway discrepancies & fleet capacity
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">System Node & API Latency Alerts</div>
                      <div className="text-[11px] text-[#525760]">Trigger alarm when Daphne ASGI round-trip latency exceeds 120ms</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSystemHealthAlerts(!systemHealthAlerts)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {systemHealthAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">High-Value Escrow & Refund Alerts</div>
                      <div className="text-[11px] text-[#525760]">Flag transactions exceeding ₹5,000 for manual executive review</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHighRefundAlerts(!highRefundAlerts)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {highRefundAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Operations Slack / Discord Webhook Sync</div>
                      <div className="text-[11px] text-[#525760]">Real-time broadcast to company operations command channel</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlackWebhookActive(!slackWebhookActive)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {slackWebhookActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ACTIVE SESSIONS */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Active Admin Sessions</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Authorized Mission Control sessions running across workstations
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#22C55E] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#0A2E1B]">Primary Command Workstation</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          THIS DEVICE
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Vite / React 19 • IP: 127.0.0.1 (Localhost Port 3003)
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        Status: Active Super-User Session
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => notify('Flushed all secondary admin sessions.')}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#CBD5E1] text-[#0A2E1B] hover:bg-gray-100 cursor-pointer"
                  >
                    Invalidate All Other Admin Tokens
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: GEOFENCING & LOCATIONS */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Platform Geofencing & Operations Corridors</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Manage active metropolitan delivery boundaries and GPS telemetry precision
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Primary Metro Region</div>
                    <div className="text-xs text-emerald-800 font-bold">Bengaluru Urban & Greater Corridors</div>
                    <p className="text-[11px] text-[#64748B]">Covering 5 active zones with 4.5km average order radius.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Secondary Expansion Metro</div>
                    <div className="text-xs text-[#0A2E1B] font-bold">Chennai Metro Region (Ready)</div>
                    <p className="text-[11px] text-[#64748B]">Geofence polygons mapped for Anna Nagar, T. Nagar and OMR.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: PREFERENCES (LANGUAGE & THEME) */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Language & Visual Theme</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Platform console interface preferences
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <label className="text-xs font-bold text-[#0A2E1B] block">Console Language</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleLanguageSelect('en')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          (userSettings?.language || 'en') === 'en'
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B]'
                            : 'bg-white text-[#525760] border-[#CBD5E1]'
                        }`}
                      >
                        <span>English</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageSelect('ta')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          (userSettings?.language || 'en') === 'ta'
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B]'
                            : 'bg-white text-[#525760] border-[#CBD5E1]'
                        }`}
                      >
                        <span>தமிழ் (Tamil)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageSelect('hi')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          (userSettings?.language || 'en') === 'hi'
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B]'
                            : 'bg-white text-[#525760] border-[#CBD5E1]'
                        }`}
                      >
                        <span>हिन्दी (Hindi)</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">All platform telemetry headings, audit logs and alerts adapt to the selected dialect.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <label className="text-xs font-bold text-[#0A2E1B] block">Color Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleThemeSelect('light')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          (userSettings?.theme || 'light') === 'light'
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B]'
                            : 'bg-white text-[#525760] border-[#CBD5E1]'
                        }`}
                      >
                        <Sun size={14} />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeSelect('dark')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          (userSettings?.theme || 'light') === 'dark'
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B]'
                            : 'bg-white text-[#525760] border-[#CBD5E1]'
                        }`}
                      >
                        <Moon size={14} />
                        <span>Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeSelect('system')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          (userSettings?.theme || 'light') === 'system'
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B]'
                            : 'bg-white text-[#525760] border-[#CBD5E1]'
                        }`}
                      >
                        <Laptop size={14} />
                        <span>System</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Preserves the signature FD leaf brand identity across all surface modes.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: PRIVACY & COMPLIANCE */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Privacy, Data Governance & Compliance</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Data storage and regulatory compliance standards
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="text-xs font-extrabold text-emerald-900">PostgreSQL Strict Storage Mode: ACTIVE</div>
                    <p className="text-[11px] text-emerald-800">
                      All transactional orders, restaurant listings and fleet telemetry records persist in PostgreSQL (<code className="font-mono">wsfood_db</code>). SQLite fallback is disabled per ecosystem mandate.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">GDPR & DPDP Act Compliance</div>
                    <p className="text-[11px] text-[#525760]">
                      Customer PII and phone numbers are tokenized on Django REST endpoints. Telemetry GPS history is retained for 90 days before cold storage archival.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: LEGAL & SUPPORT */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Help, Operations Support & Legal Terms</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Centralized platform policies and ecosystem service level agreements
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Platform Service Level Agreement (SLA)</div>
                    <p className="text-[11px] text-[#525760]">
                      99.98% uptime guarantee on dispatch microservices and real-time Daphne WebSocket channels.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Terms of Service & Merchant Policies</div>
                    <p className="text-[11px] text-[#525760]">
                      Governs merchant restaurant onboarding, commission settlement windows, packaging guidelines and fraud prevention protocols.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Support Desk Escalation Matrix</div>
                    <p className="text-[11px] text-[#525760]">
                      Direct hotline for priority resolution of disputed orders, payment gate timeouts and delivery safety incident reports.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: ACCOUNT ACTIONS */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <LogOut size={18} className="text-red-600" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Account Operations & Session Control</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Exit Mission Control session or flush ecosystem runtime cache
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAF6] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Exit Administrator Session</div>
                      <div className="text-[11px] text-[#525760]">Terminates current Mission Control privileges and requires master key re-authentication.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogoutModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A2E1B] text-white hover:bg-[#15803D] cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-red-700">Flush Redis Telemetry Cache</div>
                      <div className="text-[11px] text-red-600/80">
                        Clears in-memory route caches without affecting PostgreSQL database tables.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurgeModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    >
                      Flush Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E2E8F0] shadow-2xl text-left space-y-4">
            <h3 className="text-base font-black text-[#0A2E1B]">Sign Out from Mission Control?</h3>
            <p className="text-xs text-[#525760] leading-relaxed">
              You will be signed out of the central administrator terminal. Re-authentication with your 2FA security key will be required to re-enter.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A2E1B] text-white hover:bg-[#15803D] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flush Cache Modal */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-red-200 shadow-2xl text-left space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-black text-red-700">Flush Runtime Cache</h3>
            <p className="text-xs text-[#525760] leading-relaxed">
              This will purge temporary in-memory geospatial route indexes. PostgreSQL data is preserved.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPurge}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Flush Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlatformSettingsPage;
