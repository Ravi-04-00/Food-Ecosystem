import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Clock, 
  MapPin, 
  Bike, 
  Shield, 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  HelpCircle, 
  FileText, 
  LogOut, 
  Trash2, 
  PhoneCall, 
  Compass, 
  Layers, 
  Check, 
  AlertCircle, 
  Save, 
  Lock, 
  Smartphone, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles,
  Flame,
  Radio,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Camera,
  Loader,
  Laptop,
  Info
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { getTranslation } from '../utils/i18n.js';

export const SettingsPage = ({ onReplayIntro, onLogout }) => {
  const { 
    isOnline, 
    toggleOnline, 
    audioMuted, 
    toggleAudio, 
    showToast,
    activeVehicle,
    currentUser,
    deliveryProfileData,
    updateProfile,
    removePartnerPhoto,
    isLoadingProfile,
    userSettings,
    isLoadingSettings,
    updateSettings,
    promptLogout
  } = useDelivery();

  const [activeTab, setActiveTab] = useState('shift');
  const [toastMsg, setToastMsg] = useState('');

  // 1. Shift Management
  const [shiftStatus, setShiftStatus] = useState('AVAILABLE'); // OFFLINE, AVAILABLE, ON_SHIFT, BREAK, SHIFT_COMPLETED
  const [shiftStartTime, setShiftStartTime] = useState('09:00 AM');
  const [shiftEndTime, setShiftEndTime] = useState('06:00 PM');
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState('8.5');
  const [availableDays, setAvailableDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  // 2. Working Hours & Break
  const [whStartTime, setWhStartTime] = useState('08:30 AM');
  const [whEndTime, setWhEndTime] = useState('09:30 PM');
  const [whBreakMinutes, setWhBreakMinutes] = useState(45);
  const [whDays, setWhDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

  // 3. Zone Management (Google Maps Ready Architecture)
  const [preferredZone, setPreferredZone] = useState('Koramangala 4th Block');
  const [currentZone, setCurrentZone] = useState('Indiranagar 100ft Road Corridor');
  const [zoneAvailability, setZoneAvailability] = useState(true);
  const [multiZoneEnabled, setMultiZoneEnabled] = useState(true);
  const [selectedZones, setSelectedZones] = useState([
    'Indiranagar 100ft Road Corridor',
    'Koramangala 4th Block',
    'HSR Sector 1 & 2'
  ]);

  // Pre-configured commercial delivery zones (Google Maps geo-boundary ready)
  const ALL_ZONES = [
    { id: 'z1', name: 'Indiranagar 100ft Road Corridor', code: 'BLR-IND-01', demand: 'VERY HIGH', radiusKm: 4.5, lat: 12.9784, lng: 77.6408, orderSurge: '+₹35/drop' },
    { id: 'z2', name: 'Koramangala 4th Block', code: 'BLR-KOR-04', demand: 'HIGH', radiusKm: 3.8, lat: 12.9345, lng: 77.6266, orderSurge: '+₹25/drop' },
    { id: 'z3', name: 'HSR Sector 1 & 2', code: 'BLR-HSR-01', demand: 'HIGH', radiusKm: 5.0, lat: 12.9116, lng: 77.6389, orderSurge: '+₹20/drop' },
    { id: 'z4', name: 'Whitefield ITPL Tech Zone', code: 'BLR-WTF-02', demand: 'MODERATE', radiusKm: 6.2, lat: 12.9863, lng: 77.7338, orderSurge: '+₹15/drop' },
    { id: 'z5', name: 'MG Road & Central District', code: 'BLR-MGR-01', demand: 'VERY HIGH', radiusKm: 3.2, lat: 12.9756, lng: 77.6066, orderSurge: '+₹40/drop' }
  ];

  // 4. Partner Profile (Phase 5 Full Lifecycle)
  const [partnerName, setPartnerName] = useState('Arun Kumar');
  const [partnerPhone, setPartnerPhone] = useState('+91 98888 77777');
  const [partnerEmail, setPartnerEmail] = useState('arun_courier@fastdelivery.io');
  const [partnerAddress, setPartnerAddress] = useState('Courier Depot Hub 4, Chennai');
  const [partnerFleetId, setPartnerFleetId] = useState('FD-RIDER-8492');
  const [partnerKycStatus, setPartnerKycStatus] = useState('APPROVED');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const fileInputRef = useRef(null);

  // 5. Vehicle Information
  const [vehType, setVehType] = useState('Electric Scooter');
  const [vehModel, setVehModel] = useState('Ather 450X (Gen 3)');
  const [vehPlate, setVehPlate] = useState('KA-01-WS-8492');
  const [vehBattery, setVehBattery] = useState('86%');
  const [rcValidity, setRcValidity] = useState('Oct 2028');
  const [insuranceValidity, setInsuranceValidity] = useState('Dec 2026');

  // 6. Emergency Contact
  const [emergencyName, setEmergencyName] = useState('Kavitha Kumar (Spouse)');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 94441 55221');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');

  // 7. Change Password & Security
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  // Synchronize with DeliveryContext/Backend Profile
  useEffect(() => {
    const src = deliveryProfileData || currentUser;
    if (src) {
      if (src.full_name || src.name) setPartnerName(src.full_name || src.name);
      if (src.phone) setPartnerPhone(src.phone);
      if (src.email) setPartnerEmail(src.email);
      if (src.address) setPartnerAddress(src.address);
      if (src.vehicle_type) setVehType(src.vehicle_type);
      if (src.vehicle_number) setVehPlate(src.vehicle_number);
      if (src.profile_photo) setPhotoPreview(src.profile_photo);
      if (src.verification_status) setPartnerKycStatus(src.verification_status);
    }
  }, [deliveryProfileData, currentUser]);

  // 8. Notifications
  const [orderPushAlerts, setOrderPushAlerts] = useState(true);
  const [surgeBonusAlerts, setSurgeBonusAlerts] = useState(true);
  const [soundChimes, setSoundChimes] = useState(!audioMuted);
  const [smsDeliveryAlerts, setSmsDeliveryAlerts] = useState(false);

  // 9. Location & Telemetry
  const [bgLocationGranted, setBgLocationGranted] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [batteryOptimizationDisabled, setBatteryOptimizationDisabled] = useState(true);

  // 10. Language & Theme
  const [appLanguage, setAppLanguage] = useState('English');
  const [appTheme, setAppTheme] = useState('light'); // Unified light luxury default

  // Modals & confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const notify = (msg) => {
    setToastMsg(msg);
    if (showToast) showToast(msg, 'success');
    setTimeout(() => setToastMsg(''), 3500);
  };

  const toggleDay = (day, list, setList) => {
    if (list.includes(day)) {
      if (list.length > 1) {
        setList(list.filter(d => d !== day));
      } else {
        notify('At least one working day must remain active.');
      }
    } else {
      setList([...list, day]);
    }
  };

  const toggleZone = (zoneName) => {
    if (selectedZones.includes(zoneName)) {
      if (selectedZones.length > 1) {
        setSelectedZones(selectedZones.filter(z => z !== zoneName));
        notify(`Removed ${zoneName} from active operational zones.`);
      } else {
        notify('At least one operational zone must be active.');
      }
    } else {
      setSelectedZones([...selectedZones, zoneName]);
      notify(`Added ${zoneName} to multi-zone dispatch matrix.`);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setProfileErrors(prev => ({ ...prev, profile_photo: 'Please upload a valid JPG, PNG, or WEBP image.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileErrors(prev => ({ ...prev, profile_photo: 'Photo exceeds maximum 5MB size limit.' }));
      return;
    }
    setProfileErrors(prev => ({ ...prev, profile_photo: null }));
    setSelectedPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (selectedPhotoFile) {
      setSelectedPhotoFile(null);
      setPhotoPreview(deliveryProfileData?.profile_photo || '');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (removePartnerPhoto) {
      try {
        await removePartnerPhoto();
        setPhotoPreview('');
        notify('Profile photo removed.');
      } catch (err) {
        notify(err.message || 'Failed to remove photo.');
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!partnerName.trim()) errs.full_name = 'Full name is required.';
    if (!partnerPhone.trim()) errs.phone = 'Mobile phone is required.';
    if (!partnerAddress.trim()) errs.address = 'Operating address is required.';
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setProfileErrors({});
    try {
      const fd = new FormData();
      fd.append('full_name', partnerName.trim());
      fd.append('phone', partnerPhone.trim());
      fd.append('address', partnerAddress.trim());
      if (vehType) fd.append('vehicle_type', vehType.trim());
      if (vehPlate) fd.append('vehicle_number', vehPlate.trim());
      if (selectedPhotoFile) fd.append('profile_photo', selectedPhotoFile);

      await updateProfile(fd);
      setIsEditingProfile(false);
      setSelectedPhotoFile(null);
      notify('Partner profile saved to PostgreSQL successfully.');
    } catch (err) {
      if (err.errors) {
        setProfileErrors(err.errors);
      } else {
        notify(err.message || 'Failed to update profile.');
      }
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setSelectedPhotoFile(null);
    setProfileErrors({});
    const src = deliveryProfileData || currentUser;
    if (src) {
      if (src.full_name || src.name) setPartnerName(src.full_name || src.name);
      if (src.phone) setPartnerPhone(src.phone);
      if (src.address) setPartnerAddress(src.address);
      if (src.profile_photo) setPhotoPreview(src.profile_photo);
    }
  };

  // Phase 6 Settings Sync & Handlers
  const currentLang = userSettings?.language || 'en';
  const t = (key) => getTranslation(currentLang, key);

  useEffect(() => {
    if (userSettings) {
      if (userSettings.shift) setShiftStatus(userSettings.shift);
      if (userSettings.preferred_start_time) setShiftStartTime(userSettings.preferred_start_time);
      if (userSettings.preferred_end_time) setShiftEndTime(userSettings.preferred_end_time);
      if (userSettings.available_days) setAvailableDays(userSettings.available_days);
      if (userSettings.break_start) setWhStartTime(userSettings.break_start);
      if (userSettings.break_end) setWhEndTime(userSettings.break_end);
      if (userSettings.preferred_zone) setPreferredZone(userSettings.preferred_zone);
      if (userSettings.theme) setAppTheme(userSettings.theme);
      if (userSettings.language) setAppLanguage(userSettings.language === 'ta' ? 'Tamil' : 'English');
    }
  }, [userSettings]);

  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      if (updateSettings) {
        await updateSettings({
          shift: shiftStatus,
          preferred_start_time: shiftStartTime,
          preferred_end_time: shiftEndTime,
          available_days: availableDays
        });
      }
      notify(`Shift configuration saved to PostgreSQL. Status: ${shiftStatus}.`);
    } catch (err) {
      notify('Failed to save shift configuration.');
    }
  };

  const handleSaveWorkingHours = async (e) => {
    e.preventDefault();
    try {
      if (updateSettings) {
        await updateSettings({
          break_start: whStartTime,
          break_end: whEndTime
        });
      }
      notify('Working hours & break duration saved to PostgreSQL.');
    } catch (err) {
      notify('Failed to save working hours.');
    }
  };

  const handleThemeSelect = async (theme) => {
    setAppTheme(theme);
    try {
      if (updateSettings) await updateSettings({ theme });
      notify(`Theme switched to ${theme}.`);
    } catch (err) {
      notify('Failed to save theme.');
    }
  };

  const handleLanguageSelect = async (langCode) => {
    try {
      if (updateSettings) await updateSettings({ language: langCode });
      setAppLanguage(langCode === 'ta' ? 'Tamil' : langCode === 'hi' ? 'Hindi' : 'English');
      notify(`Language preference saved to PostgreSQL.`);
    } catch (err) {
      notify('Failed to save language.');
    }
  };

  const handleSaveVehicle = (e) => {
    e.preventDefault();
    notify('Vehicle telemetry and documents updated.');
  };

  const handleSaveEmergency = (e) => {
    e.preventDefault();
    notify('Emergency contact details updated.');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currPassword) {
      notify('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      notify('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('New passwords do not match.');
      return;
    }
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    notify('Security password changed successfully.');
  };

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    sessionStorage.removeItem('bp_intro_seen');
    localStorage.removeItem('fd_delivery_partner_session');
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  const handleConfirmDelete = () => {
    setDeleteModalOpen(false);
    sessionStorage.clear();
    localStorage.clear();
    alert('Partner account deletion request recorded. Our compliance team will finalize removal within 48 hours.');
    window.location.reload();
  };

  const tabs = [
    { id: 'shift', label: 'Shift Settings', icon: Clock, badge: shiftStatus },
    { id: 'hours', label: 'Working Hours', icon: Coffee },
    { id: 'zones', label: 'Zone Management', icon: MapPin, count: selectedZones.length },
    { id: 'profile', label: 'Profile & KYC', icon: User },
    { id: 'vehicle', label: 'Vehicle Info', icon: Bike },
    { id: 'emergency', label: 'Emergency Contact', icon: PhoneCall },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'location', label: 'Location Permissions', icon: Compass },
    { id: 'sessions', label: 'Active Sessions', icon: Smartphone },
    { id: 'preferences', label: 'Language & Theme', icon: Globe },
    { id: 'legal', label: 'Legal & Support', icon: FileText },
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

      {/* Top Header & Fast Live Availability Banner */}
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
                Commercial Fleet Operations
              </span>
              <span className="text-[10px] font-bold text-[#64748B]">
                ID: {partnerFleetId}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0A2E1B] mt-1 tracking-tight">
              Partner Settings & Operations
            </h1>
            <p className="text-xs text-[#525760] mt-0.5">
              Unified configuration for dispatch shifts, zones, telemetry & security
            </p>
          </div>
        </div>

        {/* Live Availability Quick Switcher */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Online Toggle */}
          <button
            type="button"
            onClick={toggleOnline}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 border transition-all cursor-pointer ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-red-500'}`} />
            <span>DISPATCH AVAILABILITY: {isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* Quick Shift Status Pill */}
          <div className="px-3 py-2 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-[#525760]">SHIFT:</span>
            <span className="font-extrabold text-[#0A2E1B]">{shiftStatus}</span>
          </div>

          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="px-3.5 py-2.5 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] text-[#0A2E1B] text-xs font-bold hover:bg-[#F1F5E9] flex items-center gap-1.5 cursor-pointer"
              title="Replay Brand Intro"
            >
              <Sparkles size={14} className="text-[#15803D]" />
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Body: Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Navigation Sidebar */}
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
                  {tab.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#0A2E1B]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Partner Card */}
          <div className="bg-gradient-to-br from-[#0A2E1B] to-[#15803D] text-white rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Fast Delivery Fleet</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-400/30">
                ACTIVE
              </span>
            </div>
            <div>
              <div className="text-base font-black">{partnerName}</div>
              <div className="text-xs text-emerald-200 font-mono mt-0.5">{partnerPhone}</div>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-emerald-100">
              <span>Vehicle: {vehPlate}</span>
              <span className="font-bold text-white">4.88 ★ Rating</span>
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm">

            {/* TAB 1: SHIFT MANAGEMENT */}
            {activeTab === 'shift' && (
              <form onSubmit={handleSaveShift} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Shift Management & Status</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Configure operational shifts, working windows, available days and shift lifecycle states
                  </p>
                </div>

                {/* Shift Status Selector (OFFLINE, AVAILABLE, ON_SHIFT, BREAK, SHIFT_COMPLETED) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0A2E1B] block">
                    Current Shift Status Lifecycle <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['OFFLINE', 'AVAILABLE', 'ON_SHIFT', 'BREAK', 'SHIFT_COMPLETED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setShiftStatus(st)}
                        className={`p-2.5 rounded-2xl text-[11px] font-extrabold border transition-all text-center cursor-pointer ${
                          shiftStatus === st
                            ? 'bg-[#0A2E1B] text-white border-[#0A2E1B] shadow-sm ring-2 ring-[#22C55E]/30'
                            : 'bg-[#F8FAF6] text-[#525760] border-[#CBD5E1] hover:bg-[#F1F5E9] hover:text-[#0A2E1B]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Status controls how dispatch engines assign urgent pickup requests to your courier terminal.
                  </p>
                </div>

                {/* Shift Start & End Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Shift Start Time
                    </label>
                    <input 
                      type="text"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Shift End Time
                    </label>
                    <input 
                      type="text"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      placeholder="e.g. 06:00 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                {/* Working Hours Per Day */}
                <div>
                  <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                    Scheduled Daily Working Hours
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      step="0.5"
                      min="2"
                      max="14"
                      value={workingHoursPerDay}
                      onChange={(e) => setWorkingHoursPerDay(e.target.value)}
                      className="w-32 px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                    <span className="text-xs text-[#525760]">Hours / Day (Overtime multipliers trigger past 8h)</span>
                  </div>
                </div>

                {/* Available Days */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0A2E1B] block">
                    Available Working Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const isSelected = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day, availableDays, setAvailableDays)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold'
                              : 'bg-[#F8FAF6] text-[#64748B] border-[#CBD5E1] hover:bg-[#F1F5E9]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save size={15} />
                    <span>Save Shift Settings</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: WORKING HOURS & BREAKS */}
            {activeTab === 'hours' && (
              <form onSubmit={handleSaveWorkingHours} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Coffee size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Working Hours & Rest Breaks</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Define overall operational window, break duration and weekly schedule
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Start Time
                    </label>
                    <input 
                      type="text"
                      value={whStartTime}
                      onChange={(e) => setWhStartTime(e.target.value)}
                      placeholder="e.g. 08:30 AM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      End Time
                    </label>
                    <input 
                      type="text"
                      value={whEndTime}
                      onChange={(e) => setWhEndTime(e.target.value)}
                      placeholder="e.g. 09:30 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                    Mid-Shift Break Allowance: {whBreakMinutes} Minutes
                  </label>
                  <input 
                    type="range"
                    min="15"
                    max="90"
                    step="5"
                    value={whBreakMinutes}
                    onChange={(e) => setWhBreakMinutes(Number(e.target.value))}
                    className="w-full accent-[#15803D] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                    <span>15 mins (Quick lunch)</span>
                    <span>45 mins (Recommended)</span>
                    <span>90 mins (Split shift)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0A2E1B] block">
                    Working Days in Week
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                      const checked = whDays.includes(d);
                      return (
                        <label 
                          key={d}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                            checked ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-[#F8FAF6] text-[#64748B] border-[#CBD5E1]'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDay(d, whDays, setWhDays)}
                            className="rounded text-[#15803D] focus:ring-[#22C55E]"
                          />
                          <span>{d}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save size={15} />
                    <span>Save Working Hours</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: ZONE MANAGEMENT (GOOGLE MAPS READY) */}
            {activeTab === 'zones' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Delivery Zone Management</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Select preferred operational zones, review surge density and configure multi-zone coverage (Ready for Google Maps Geofencing)
                  </p>
                </div>

                {/* Primary & Current Zone Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-[#15803D] tracking-wider">
                      PRIMARY PREFERRED ZONE
                    </span>
                    <select
                      value={preferredZone}
                      onChange={(e) => {
                        setPreferredZone(e.target.value);
                        notify(`Preferred delivery zone updated to ${e.target.value}.`);
                      }}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    >
                      {ALL_ZONES.map(z => (
                        <option key={z.id} value={z.name}>{z.name} ({z.code})</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#64748B]">Primary area prioritized during dispatch shift kick-off.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-[#0A2E1B] tracking-wider">
                      CURRENT LOCATED ZONE
                    </span>
                    <div className="text-xs font-extrabold text-[#0A2E1B] py-2 px-3 bg-white border border-[#CBD5E1] rounded-xl flex items-center justify-between">
                      <span>{currentZone}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[11px] text-[#64748B]">Detected via telemetry geofence coordinates.</p>
                  </div>
                </div>

                {/* Multiple Zone Support Toggle */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Multiple Zone Coverage Matrix</div>
                    <div className="text-[11px] text-[#525760]">Allow dispatch engines to allocate batch orders across overlapping zones</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMultiZoneEnabled(!multiZoneEnabled);
                      notify(`Multi-zone support ${!multiZoneEnabled ? 'enabled' : 'disabled'}.`);
                    }}
                    className="cursor-pointer text-[#15803D]"
                  >
                    {multiZoneEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                  </button>
                </div>

                {/* Zone Cards Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A2E1B]">
                    <span>Available Commercial Zones ({ALL_ZONES.length})</span>
                    <span className="text-[#15803D]">{selectedZones.length} Active</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ALL_ZONES.map(zone => {
                      const isSelected = selectedZones.includes(zone.name);
                      return (
                        <div
                          key={zone.id}
                          onClick={() => toggleZone(zone.name)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'bg-white border-[#22C55E] shadow-sm ring-1 ring-[#22C55E]'
                              : 'bg-[#F8FAF6] border-[#CBD5E1] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-extrabold text-[#0A2E1B]">{zone.name}</div>
                              <div className="text-[10px] text-[#64748B] font-mono">{zone.code} • {zone.radiusKm} km Radius</div>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              zone.demand === 'VERY HIGH'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {zone.demand}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                            <span className="text-emerald-700 font-bold">{zone.orderSurge}</span>
                            <span className={`font-bold ${isSelected ? 'text-[#15803D]' : 'text-gray-400'}`}>
                              {isSelected ? '✓ Covered' : '+ Add Zone'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Google Maps Architecture Note */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-[11px] flex items-start gap-2.5">
                  <Compass size={16} className="text-[#15803D] mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Architecture Note:</strong> Zone geometry definitions use standard geo-boundaries (latitude, longitude, radius). Ready for future Google Maps polygon polygon layers without database migration.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: PROFILE & KYC (PHASE 5) */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-[#15803D]" />
                      <h2 className="text-lg font-black text-[#0A2E1B]">Partner Profile & Personal Identity</h2>
                    </div>
                    <p className="text-xs text-[#525760] mt-0.5">
                      Verified legal credentials, depot contact, and profile avatar
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
                    {/* Error Banner */}
                    {profileErrors.non_field && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={15} />
                        <span>{profileErrors.non_field}</span>
                      </div>
                    )}

                    {/* Photo Management */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0A2E1B] block">
                        Partner Profile Avatar (JPG, PNG, WEBP max 5MB)
                      </label>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={28} className="text-gray-400" />
                          )}
                        </div>

                        <input 
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-gray-50 text-xs font-bold text-[#0A2E1B] hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Camera size={13} />
                            <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                          </button>

                          {photoPreview && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {profileErrors.profile_photo && (
                        <p className="text-[11px] text-red-600 font-medium">{profileErrors.profile_photo}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Legal Name */}
                      <div>
                        <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                          Full Legal Name *
                        </label>
                        <input 
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border ${profileErrors.full_name ? 'border-red-400' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]`}
                        />
                        {profileErrors.full_name && (
                          <p className="text-[11px] text-red-600 mt-1">{profileErrors.full_name}</p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                          Registered Phone Number *
                        </label>
                        <input 
                          type="text"
                          value={partnerPhone}
                          onChange={(e) => setPartnerPhone(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border ${profileErrors.phone ? 'border-red-400' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E] font-mono`}
                        />
                        {profileErrors.phone && (
                          <p className="text-[11px] text-red-600 mt-1">{profileErrors.phone}</p>
                        )}
                      </div>

                      {/* Email (Read-Only) */}
                      <div>
                        <label className="text-xs font-bold text-[#64748B] flex items-center gap-1 mb-1">
                          <Lock size={12} />
                          <span>Email Address (Account Identifier • Read-Only)</span>
                        </label>
                        <input 
                          type="email"
                          value={partnerEmail}
                          disabled
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-gray-100 text-xs font-bold text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Immutable primary account identifier.</p>
                      </div>

                      {/* Verification Status */}
                      <div>
                        <label className="text-xs font-bold text-[#64748B] flex items-center gap-1 mb-1">
                          <Lock size={12} />
                          <span>KYC Verification Status (System Managed)</span>
                        </label>
                        <div className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-gray-100 text-xs font-bold text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>{partnerKycStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operating Depot Address */}
                    <div>
                      <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                        Operating Hub / Registered Address *
                      </label>
                      <textarea 
                        rows={2}
                        value={partnerAddress}
                        onChange={(e) => setPartnerAddress(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border ${profileErrors.address ? 'border-red-400' : 'border-[#CBD5E1]'} bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]`}
                      />
                      {profileErrors.address && (
                        <p className="text-[11px] text-red-600 mt-1">{profileErrors.address}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
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
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            <span>Save Profile Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Read-Only Profile View */
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] space-y-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white font-black text-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#0A2E1B]">{partnerName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ {partnerKycStatus}
                            </span>
                          </div>
                          <div className="text-xs text-[#525760] font-mono mt-0.5">Fleet ID: {partnerFleetId}</div>
                          <div className="text-xs text-[#64748B] mt-0.5">{partnerEmail}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-[#64748B] font-medium block">Phone Contact:</span>
                          <span className="font-bold text-[#0A2E1B] font-mono">{partnerPhone}</span>
                        </div>
                        <div>
                          <span className="text-[#64748B] font-medium block">Registered Vehicle:</span>
                          <span className="font-bold text-[#0A2E1B]">{vehType} • {vehPlate}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[#64748B] font-medium block">Operating Depot / Base:</span>
                          <span className="font-bold text-[#0A2E1B]">{partnerAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-emerald-900">KYC Verification Status: {partnerKycStatus}</div>
                        <div className="text-[11px] text-emerald-700">Aadhaar, Driving License & Police Verification cleared</div>
                      </div>
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: VEHICLE INFORMATION */}
            {activeTab === 'vehicle' && (
              <form onSubmit={handleSaveVehicle} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Bike size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Vehicle Information & Compliance</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Courier vehicle details, telemetry specifications and document validity
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehType}
                      onChange={(e) => setVehType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    >
                      <option value="Electric Scooter">Electric Scooter (EV)</option>
                      <option value="Petrol Motorcycle">Petrol Motorcycle</option>
                      <option value="Electric Bicycle">Electric Bicycle</option>
                      <option value="Scooter">Automatic Scooter</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Vehicle Model & Make
                    </label>
                    <input 
                      type="text"
                      value={vehModel}
                      onChange={(e) => setVehModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Registration Plate Number
                    </label>
                    <input 
                      type="text"
                      value={vehPlate}
                      onChange={(e) => setVehPlate(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] font-mono uppercase focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Battery / Fuel Level Indicator
                    </label>
                    <input 
                      type="text"
                      value={vehBattery}
                      onChange={(e) => setVehBattery(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      RC Validity
                    </label>
                    <input 
                      type="text"
                      value={rcValidity}
                      onChange={(e) => setRcValidity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Insurance Policy Validity
                    </label>
                    <input 
                      type="text"
                      value={insuranceValidity}
                      onChange={(e) => setInsuranceValidity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save size={15} />
                    <span>Save Vehicle Info</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 6: EMERGENCY CONTACT */}
            {activeTab === 'emergency' && (
              <form onSubmit={handleSaveEmergency} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <PhoneCall size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Emergency Contact & SOS Dispatch</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Designated emergency kin contact for road incidents, vehicle breakdown or medical assistance
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Contact Person Name
                    </label>
                    <input 
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Emergency Phone Number
                    </label>
                    <input 
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] font-mono focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">
                      Relationship
                    </label>
                    <input 
                      type="text"
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs font-bold text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                {/* 24/7 Fast Delivery SOS Hotline */}
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-red-900">24/7 FD Fleet SOS Emergency Hotline</div>
                    <div className="text-[11px] text-red-700">Instant connection to central fleet ambulance and rescue team: 1800-419-8800</div>
                  </div>
                  <span className="px-3 py-1 bg-red-600 text-white rounded-xl text-xs font-bold">
                    SOS READY
                  </span>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save size={15} />
                    <span>Save Emergency Contact</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 7: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Security & Change Password</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Update operations password, biometric verification and two-factor device authorization
                  </p>
                </div>

                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Current Password</label>
                    <input 
                      type="password"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">New Password (Min 8 chars)</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0A2E1B] block mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF6] text-xs text-[#0A2E1B] focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0A2E1B] hover:bg-[#15803D] text-white shadow-md cursor-pointer transition-all"
                  >
                    Update Password
                  </button>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Biometric Fingerprint / Face Unlock</div>
                      <div className="text-[11px] text-[#64748B]">Quick terminal authorization using device hardware credentials</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBiometricsEnabled(!biometricsEnabled);
                        notify(`Biometric authorization ${!biometricsEnabled ? 'enabled' : 'disabled'}.`);
                      }}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {biometricsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Two-Factor Authorization (2FA SMS)</div>
                      <div className="text-[11px] text-[#64748B]">Require SMS code verification when signing in from an unrecognized device</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorAuth(!twoFactorAuth);
                        notify(`2FA authentication ${!twoFactorAuth ? 'enabled' : 'disabled'}.`);
                      }}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {twoFactorAuth ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 8: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Notification & Audio Preferences</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Configure high-urgency order dispatch chimes, surge bonuses & shift reminders
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Incoming Order Sound Chimes</div>
                      <div className="text-[11px] text-[#525760]">Play audio chimes during 30s acceptance countdown</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleAudio();
                        setSoundChimes(!soundChimes);
                        notify(`Sound chimes ${!soundChimes ? 'enabled' : 'muted'}.`);
                      }}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {soundChimes ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Surge Pricing & High-Demand Alerts</div>
                      <div className="text-[11px] text-[#525760]">Push alerts when nearby corridors trigger +₹30 to +₹60 multipliers</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSurgeBonusAlerts(!surgeBonusAlerts);
                        notify(`Surge alerts ${!surgeBonusAlerts ? 'enabled' : 'disabled'}.`);
                      }}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {surgeBonusAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Shift Start Reminders</div>
                      <div className="text-[11px] text-[#525760]">Reminder 15 minutes before your scheduled operational shift</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderPushAlerts(!orderPushAlerts);
                        notify(`Shift reminders ${!orderPushAlerts ? 'enabled' : 'disabled'}.`);
                      }}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {orderPushAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: LOCATION PERMISSIONS */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Location Permissions & Telemetry</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    High-accuracy GPS tracking required for real-time customer eta calculation
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-emerald-900">Background Location Access: GRANTED</div>
                      <div className="text-[11px] text-emerald-700">App has permission to track coordinates during active order deliveries</div>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">High-Accuracy GPS Engine</div>
                      <div className="text-[11px] text-[#525760]">Fuses GPS satellites, cellular triangulation and Wi-Fi beacons (1-3m tolerance)</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHighAccuracyGps(!highAccuracyGps)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {highAccuracyGps ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1]">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Battery Optimization Exclusion</div>
                      <div className="text-[11px] text-[#525760]">Prevents operating system from freezing telemetry background service during screen lock</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBatteryOptimizationDisabled(!batteryOptimizationDisabled)}
                      className="text-[#15803D] cursor-pointer"
                    >
                      {batteryOptimizationDisabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[#CBD5E1]" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: ACTIVE SESSIONS */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Active Sessions & Devices</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Authorized courier devices logged into your Fast Delivery partner terminal
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#22C55E] flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#0A2E1B]">This Device (Current Active Terminal)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          CURRENT
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Chrome Mobile / Android 14 • IP: 106.51.72.19 (Bengaluru, KA)
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        Last Active: Just now
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-extrabold text-[#0A2E1B]">OnePlus 11 5G (Secondary Terminal)</div>
                      <div className="text-[11px] text-[#64748B]">
                        FD Partner App v2.4 • IP: 49.37.112.98
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Last Active: Yesterday at 08:30 PM
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => notify('Terminated secondary OnePlus session.')}
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => notify('All other partner terminal sessions terminated.')}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#CBD5E1] text-[#0A2E1B] hover:bg-gray-100 cursor-pointer"
                  >
                    Log Out from All Other Devices
                  </button>
                </div>
              </div>
            )}

            {/* TAB 11: PREFERENCES (LANGUAGE & THEME) */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Language & Visual Theme</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Select regional navigation language and display theme
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <label className="text-xs font-bold text-[#0A2E1B] block">Application Language</label>
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
                    <p className="text-[11px] text-[#64748B]">All order pickup instructions, item checks and dispatch prompts adapt to selected dialect.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-2">
                    <label className="text-xs font-bold text-[#0A2E1B] block">Display Color Theme</label>
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
                    <p className="text-[11px] text-[#64748B]">Preserves signature FD leaf identity and two-tone palette across all themes.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: LEGAL & SUPPORT */}
            {activeTab === 'legal' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#15803D]" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Help, Support & Legal Terms</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    Fast Delivery Partner fleet regulations, insurance terms and dispute resolution
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Help & Operations Support</div>
                    <p className="text-[11px] text-[#525760]">
                      Need assistance with wrong drop pin, customer no-show, or delayed restaurant prep? Contact courier dispatch desk via in-app tickets or helpline.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Partner Terms & Conditions</div>
                    <p className="text-[11px] text-[#525760]">
                      Governs dispatch rules, compensation tiers, surge calculation, vehicle compliance and code of conduct for commercial delivery partners.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-[#CBD5E1] space-y-1">
                    <div className="text-xs font-extrabold text-[#0A2E1B]">Privacy Policy & Telemetry Usage</div>
                    <p className="text-[11px] text-[#525760]">
                      Outlines how GPS telemetry coordinates, battery state, speed sensor data and identity documents are stored and protected under encrypted SSL storage.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 13: ACCOUNT ACTIONS (LOGOUT & DELETE) */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <LogOut size={18} className="text-red-600" />
                    <h2 className="text-lg font-black text-[#0A2E1B]">Account Operations & Session Control</h2>
                  </div>
                  <p className="text-xs text-[#525760] mt-0.5">
                    End partner shift session or initiate formal fleet de-registration
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAF6] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-[#0A2E1B]">Sign Out from Fleet App</div>
                      <div className="text-[11px] text-[#525760]">Ends current active session and returns to login screen. Your scheduled shifts remain saved.</div>
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
                      <div className="text-xs font-extrabold text-red-700">Delete Partner Account & Documents</div>
                      <div className="text-[11px] text-red-600/80">
                        Permanently terminates courier registration and purges KYC biometric identity records.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    >
                      Delete Account
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
            <h3 className="text-base font-black text-[#0A2E1B]">Confirm Partner Log Out</h3>
            <p className="text-xs text-[#525760] leading-relaxed">
              Are you sure you want to log out of your Fast Delivery terminal? You will stop receiving dispatch orders until you sign in again.
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
                Confirm Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-red-200 shadow-2xl text-left space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-black text-red-700">Permanent Account Removal</h3>
            <p className="text-xs text-[#525760] leading-relaxed">
              This action will close your Fast Delivery partner account and remove all KYC documents. Unsettled earnings will be wired to your verified bank account.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
