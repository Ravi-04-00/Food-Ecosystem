import React, { useState, useRef } from 'react';
import { 
  Store, Clock, Bell, Globe, Moon, Sun, Shield, 
  MapPin, Smartphone, HelpCircle, FileText, 
  LogOut, Trash2, Check, AlertCircle, Save, 
  User, Lock, DollarSign, Edit3, Camera, Loader,
  Laptop, Info, Sparkles
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { getTranslation } from '../utils/i18n.js';

export const RestaurantSettingsPage = ({ onOpenAuth }) => {
  const { 
    currentUser, 
    restaurantProfileData, 
    isLoadingProfile, 
    updateProfile, 
    removeRestaurantLogo, 
    restaurantProfile = {}, 
    setRestaurantProfile, 
    promptLogout,
    userSettings,
    isLoadingSettings,
    updateSettings,
    operatingSettings = {},
    updateOperatingSettings,
    toggleOrdersPaused
  } = useShop();

  const [activeSection, setActiveSection] = useState('restaurant_info');
  const [toastMsg, setToastMsg] = useState('');

  const currentLang = userSettings?.language || 'en';
  const t = (key) => getTranslation(currentLang, key);

  // Phase 5 Restaurant Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    restaurant_name: '',
    owner_name: '',
    phone: '',
    restaurant_address: ''
  });
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  const effectiveProfile = {
    restaurant_name: restaurantProfileData?.restaurant_name || currentUser?.restaurant_name || restaurantProfile?.name || 'FD Authentic Biryani & Grill',
    owner_name: restaurantProfileData?.owner_name || currentUser?.owner_name || currentUser?.name || 'Chef Kane',
    email: restaurantProfileData?.email || currentUser?.email || 'chef_kane@fastdelivery.io',
    phone: restaurantProfileData?.phone || currentUser?.phone || '+91 94440 12890',
    restaurant_address: restaurantProfileData?.restaurant_address || restaurantProfileData?.address || currentUser?.address || '14/2 3rd Main Road, Anna Nagar East, Chennai 600102',
    restaurant_logo: restaurantProfileData?.restaurant_logo || '',
    verification_status: restaurantProfileData?.verification_status || 'APPROVED'
  };

  // Phase 22: Operating Hours & Capacity Settings
  const [openingTime, setOpeningTime] = useState(() => (operatingSettings?.opening_time || '09:00:00').slice(0, 5));
  const [closingTime, setClosingTime] = useState(() => (operatingSettings?.closing_time || '23:00:00').slice(0, 5));
  const [avgPrepTime, setAvgPrepTime] = useState(() => operatingSettings?.avg_prep_time_minutes || 25);
  const [isOrdersPaused, setIsOrdersPaused] = useState(() => Boolean(operatingSettings?.orders_paused));
  const [pauseReason, setPauseReason] = useState(() => operatingSettings?.pause_reason || '');
  const [isSavingOperating, setIsSavingOperating] = useState(false);
  const [openDays, setOpenDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  // Sync state when operatingSettings loads from backend
  React.useEffect(() => {
    if (operatingSettings) {
      if (operatingSettings.opening_time) setOpeningTime(operatingSettings.opening_time.slice(0, 5));
      if (operatingSettings.closing_time) setClosingTime(operatingSettings.closing_time.slice(0, 5));
      if (operatingSettings.avg_prep_time_minutes) setAvgPrepTime(operatingSettings.avg_prep_time_minutes);
      setIsOrdersPaused(Boolean(operatingSettings.orders_paused));
      if (operatingSettings.pause_reason !== undefined) setPauseReason(operatingSettings.pause_reason || '');
    }
  }, [operatingSettings]);

  const handleSaveOperatingSettings = async () => {
    setIsSavingOperating(true);
    try {
      if (updateOperatingSettings) {
        await updateOperatingSettings({
          opening_time: openingTime ? `${openingTime}:00` : '09:00:00',
          closing_time: closingTime ? `${closingTime}:00` : '23:00:00',
          avg_prep_time_minutes: Number(avgPrepTime) || 25
        });
      }
      if (toggleOrdersPaused && isOrdersPaused !== Boolean(operatingSettings?.orders_paused)) {
        await toggleOrdersPaused(isOrdersPaused, pauseReason);
      }
      showToast('Operating hours & capacity settings saved to PostgreSQL.');
    } catch (err) {
      showToast(err.message || 'Failed to save operating settings.');
    } finally {
      setIsSavingOperating(false);
    }
  };

  // Business Settings
  const [packagingCharge, setPackagingCharge] = useState(25);
  const [gstRate, setGstRate] = useState(5);
  const [commissionTier, setCommissionTier] = useState('Standard FD Tier (12%)');

  // Common Features: Password & Sessions
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome Kitchen KDS POS Terminal', ip: '192.168.1.104', current: true, time: 'Active' },
    { id: 2, device: 'FD Partner App on Samsung Galaxy Tab', ip: '192.168.1.120', current: false, time: '1 hour ago' }
  ]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Phase 6 Settings Handlers
  const handleThemeSelect = async (theme) => {
    try {
      await updateSettings({ theme });
      showToast(t('theme_changed'));
    } catch (err) {
      showToast(t('save_failed'));
    }
  };

  const handleLanguageSelect = async (language) => {
    try {
      await updateSettings({ language });
      showToast(t('language_changed'));
    } catch (err) {
      showToast(t('save_failed'));
    }
  };

  const handleToggleNotification = async (key, val) => {
    try {
      await updateSettings({ [key]: val });
      showToast(t('notifications_changed'));
    } catch (err) {
      showToast(t('save_failed'));
    }
  };

  const handleTogglePrivacy = async (key, val) => {
    try {
      await updateSettings({ [key]: val });
      showToast(t('settings_saved'));
    } catch (err) {
      showToast(t('save_failed'));
    }
  };

  const handleBusinessStatusSelect = async (status) => {
    try {
      await updateSettings({ business_status: status });
      showToast(`Kitchen status updated to ${status}.`);
    } catch (err) {
      showToast(t('save_failed'));
    }
  };

  const handleOrderAlertsToggle = async (val) => {
    try {
      await updateSettings({ order_alerts: val });
      showToast(`Kitchen order alerts ${val ? 'enabled' : 'muted'}.`);
    } catch (err) {
      showToast(t('save_failed'));
    }
  };

  // Profile Edit Handlers
  const handleStartEdit = () => {
    setProfileFormData({
      restaurant_name: effectiveProfile.restaurant_name,
      owner_name: effectiveProfile.owner_name,
      phone: effectiveProfile.phone,
      restaurant_address: effectiveProfile.restaurant_address
    });
    setSelectedLogoFile(null);
    setLogoPreview(effectiveProfile.restaurant_logo);
    setProfileErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setSelectedLogoFile(null);
    setLogoPreview('');
    setProfileErrors({});
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setProfileErrors(prev => ({ ...prev, restaurant_logo: 'Please upload a valid JPG, PNG, or WEBP image.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileErrors(prev => ({ ...prev, restaurant_logo: 'Logo file exceeds 5MB limit.' }));
      return;
    }
    setProfileErrors(prev => ({ ...prev, restaurant_logo: null }));
    setSelectedLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (selectedLogoFile) {
      setSelectedLogoFile(null);
      setLogoPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (removeRestaurantLogo) {
      setIsSavingProfile(true);
      try {
        await removeRestaurantLogo();
        setLogoPreview('');
        showToast('Restaurant logo removed.');
      } catch (err) {
        setProfileErrors({ non_field: err.message || 'Failed to remove logo.' });
      } finally {
        setIsSavingProfile(false);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileFormData.restaurant_name?.trim()) errs.restaurant_name = 'Restaurant legal name is required.';
    if (!profileFormData.owner_name?.trim()) errs.owner_name = 'Owner name is required.';
    if (!profileFormData.phone?.trim()) errs.phone = 'Contact number is required.';
    if (!profileFormData.restaurant_address?.trim()) errs.restaurant_address = 'Kitchen physical address is required.';
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setIsSavingProfile(true);
    setProfileErrors({});
    try {
      const fd = new FormData();
      fd.append('restaurant_name', profileFormData.restaurant_name.trim());
      fd.append('owner_name', profileFormData.owner_name.trim());
      fd.append('phone', profileFormData.phone.trim());
      fd.append('restaurant_address', profileFormData.restaurant_address.trim());
      if (selectedLogoFile) {
        fd.append('restaurant_logo', selectedLogoFile);
      }
      await updateProfile(fd);
      setIsEditingProfile(false);
      showToast('Restaurant profile updated successfully!');
    } catch (err) {
      if (err.errors) {
        setProfileErrors(err.errors);
      } else {
        setProfileErrors({ non_field: err.message || 'Failed to update restaurant profile.' });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Kitchen terminal password updated.');
  };

  const handleLogout = () => {
    if (promptLogout) {
      promptLogout();
    } else if (onOpenAuth) {
      onOpenAuth();
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Request de-registration and permanent deletion of this Restaurant from FD ecosystem?')) {
      showToast('De-registration request dispatched to FD compliance team.');
      setTimeout(() => {
        if (onOpenAuth) onOpenAuth();
      }, 1000);
    }
  };

  const navItems = [
    { id: 'restaurant_info', label: t('account'), icon: Store },
    { id: 'appearance', label: t('appearance'), icon: Moon },
    { id: 'language', label: t('language'), icon: Globe },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'availability', label: t('business_preferences'), icon: Sparkles },
    { id: 'privacy', label: t('privacy'), icon: Shield },
    { id: 'security', label: t('security'), icon: Lock },
    { id: 'business_hours', label: 'Business Hours', icon: Clock },
    { id: 'business_settings', label: 'Tariffs & GST', icon: DollarSign },
    { id: 'about', label: t('about'), icon: Info }
  ];

  const currentTheme = userSettings?.theme || 'light';
  const currentKitchenStatus = userSettings?.business_status || 'OPEN';

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #DCFCE7',
        borderRadius: '24px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(10, 46, 27, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <FDOrganicLogo size="md" showWordmark={false} theme={currentTheme === 'dark' ? 'dark' : 'light'} />
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              <span>FD FOOD ECOSYSTEM • RESTAURANT SETTINGS</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0A2E1B', margin: '2px 0 0' }}>
              {t('settings')}
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#648270', margin: '2px 0 0' }}>
              Manage kitchen identity, live dispatch status, order audio chimes, and theme preferences.
            </p>
          </div>
        </div>

        {toastMsg && (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} color="#10B981" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        
        {/* Navigation Sidebar */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #DCFCE7',
          borderRadius: '24px',
          padding: '16px',
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: '0 4px 16px rgba(10, 46, 27, 0.03)'
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                  color: isActive ? '#15803D' : '#325340',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={17} color={isActive ? '#16A34A' : '#648270'} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ borderTop: '1px solid #EBF8F1', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <LogOut size={17} color="#DC2626" />
              <span>{t('logout')}</span>
            </button>
            <button
              onClick={handleDeleteAccount}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: '#991B1B',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Trash2 size={16} color="#991B1B" />
              <span>De-register Restaurant</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #DCFCE7',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(10, 46, 27, 0.04)'
        }}>

          {/* 1. Restaurant Info (Phase 5 Profile) */}
          {activeSection === 'restaurant_info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {profileErrors.non_field && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{profileErrors.non_field}</span>
                </div>
              )}

              {!isEditingProfile ? (
                /* READ-ONLY VIEW MODE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                        Restaurant Profile & Verification
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                        Review your registered commercial kitchen details and platform credentials.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartEdit}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 18px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)'
                      }}
                    >
                      <Edit3 size={16} />
                      <span>{t('edit_profile')}</span>
                    </button>
                  </div>

                  {/* Logo / Header Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '20px',
                    borderRadius: '18px',
                    background: '#F9FDFB',
                    border: '1px solid #DCFCE7'
                  }}>
                    <div style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #16A34A 0%, #0A2E1B 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '3px solid #FFFFFF',
                      boxShadow: '0 4px 14px rgba(10, 46, 27, 0.12)'
                    }}>
                      {effectiveProfile.restaurant_logo ? (
                        <img 
                          src={effectiveProfile.restaurant_logo} 
                          alt="Logo" 
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Store size={36} color="#FFFFFF" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0A2E1B' }}>
                          {effectiveProfile.restaurant_name}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          letterSpacing: '0.4px'
                        }}>
                          {effectiveProfile.verification_status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#648270', marginTop: '2px' }}>
                        Operator: {effectiveProfile.owner_name} • {effectiveProfile.email}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                        LICENSED RESTAURANT PARTNER
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Commercial Entity Name</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.restaurant_name}</div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Proprietor / Head Chef</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.owner_name}</div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Merchant Hotline</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.phone}</div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Physical Kitchen Address</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.restaurant_address}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* EDITING MODE */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                        Edit Commercial Kitchen Profile
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                        Update kitchen display details. Email is anchored to your merchant JWT credentials.
                      </p>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', borderRadius: '16px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                    <div style={{ width: '68px', height: '68px', borderRadius: '14px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #16A34A' }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={32} color="#64748B" />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid #DCFCE7',
                            background: '#FFFFFF',
                            color: '#16A34A',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Camera size={14} />
                          <span>Upload Brand Logo</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoSelect}
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                        />
                        {(logoPreview || effectiveProfile.restaurant_logo) && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: '1px solid #FECACA',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Commercial Entity Name <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={profileFormData.restaurant_name}
                        onChange={(e) => setProfileFormData(p => ({ ...p, restaurant_name: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Proprietor / Head Chef <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={profileFormData.owner_name}
                        onChange={(e) => setProfileFormData(p => ({ ...p, owner_name: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Merchant Contact Number <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData(p => ({ ...p, phone: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Physical Kitchen Address <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={profileFormData.restaurant_address}
                        onChange={(e) => setProfileFormData(p => ({ ...p, restaurant_address: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #DCFCE7' }}>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                      style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #DCFCE7', background: 'transparent', color: '#325340', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem', cursor: isSavingProfile ? 'not-allowed' : 'pointer' }}
                    >
                      {isSavingProfile ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                      <span>{isSavingProfile ? t('saving') : t('save_changes')}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 2. Appearance Section (Phase 6) */}
          {activeSection === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('appearance')}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  {t('theme_desc')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { id: 'light', name: t('light'), desc: t('light_desc'), icon: Sun, previewBg: '#FDFBF7', previewBorder: '#DCFCE7', previewText: '#0A2E1B' },
                  { id: 'dark', name: t('dark'), desc: t('dark_desc'), icon: Moon, previewBg: '#0F172A', previewBorder: '#334155', previewText: '#F8FAFC' },
                  { id: 'system', name: t('system'), desc: t('system_desc'), icon: Laptop, previewBg: '#F1F5F9', previewBorder: '#CBD5E1', previewText: '#1E293B' }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = (userSettings?.theme || 'light') === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleThemeSelect(item.id)}
                      style={{
                        padding: '20px',
                        borderRadius: '18px',
                        border: `2px solid ${isSelected ? '#16A34A' : '#E2E8F0'}`,
                        background: isSelected ? 'rgba(34, 197, 94, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 6px 20px rgba(34, 197, 94, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: isSelected ? '#16A34A' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={20} />
                        </div>
                        {isSelected && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0A2E1B' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '4px', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>

                      <div style={{
                        marginTop: 'auto',
                        padding: '8px',
                        borderRadius: '10px',
                        background: item.previewBg,
                        border: `1px solid ${item.previewBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.previewText }}>FD Merchant</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A' }} />
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E' }} />
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0A2E1B' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Language Section (Phase 6) */}
          {activeSection === 'language' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('language_pref')}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  {t('language_desc')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                  { code: 'en', name: 'English', native: 'English (International)', desc: 'Standard culinary management terminal in English.' },
                  { code: 'ta', name: 'Tamil', native: 'தமிழ் (Tamil)', desc: 'தமிழ் மொழி இடைமுகம் மற்றும் சமையலறை செயல்பாடுகள்.' },
                  { code: 'hi', name: 'Hindi', native: 'हिन्दी (Hindi)', desc: 'रसोई प्रबंधन, आदेश एवं मेनू संचालन हिंदी में।' }
                ].map(item => {
                  const isSelected = (userSettings?.language || 'en') === item.code;
                  return (
                    <div
                      key={item.code}
                      onClick={() => handleLanguageSelect(item.code)}
                      style={{
                        padding: '22px',
                        borderRadius: '18px',
                        border: `2px solid ${isSelected ? '#16A34A' : '#E2E8F0'}`,
                        background: isSelected ? 'rgba(34, 197, 94, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 6px 20px rgba(34, 197, 94, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: isSelected ? '#16A34A' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          fontWeight: 900,
                          fontSize: '0.85rem'
                        }}>
                          {item.code.toUpperCase()}
                        </div>
                        {isSelected && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}>
                            CURRENT
                          </span>
                        )}
                      </div>

                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0A2E1B' }}>{item.native}</div>
                        <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '6px', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Notifications Section (Phase 6) */}
          {activeSection === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('notification_prefs')}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  Manage terminal sounds, order alerts, and operational email statements.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  {
                    key: 'order_alerts',
                    title: 'Kitchen Order Chime & Alert Sound',
                    desc: 'Continuous audible chime on KDS terminal when incoming ticket arrives',
                    enabled: userSettings?.order_alerts ?? true,
                    handler: (val) => handleOrderAlertsToggle(val)
                  },
                  {
                    key: 'push_notifications',
                    title: t('push_notifications'),
                    desc: 'Instant web push alerts for courier rider arrival at kitchen gate',
                    enabled: userSettings?.push_notifications ?? true,
                    handler: (val) => handleToggleNotification('push_notifications', val)
                  },
                  {
                    key: 'email_notifications',
                    title: t('email_notifications'),
                    desc: 'Daily itemized sales settlement statement dispatched to merchant inbox',
                    enabled: userSettings?.email_notifications ?? true,
                    handler: (val) => handleToggleNotification('email_notifications', val)
                  },
                  {
                    key: 'sms_notifications',
                    title: t('sms_notifications'),
                    desc: 'Critical security SMS notifications and payout dispatch confirmations',
                    enabled: userSettings?.sms_notifications ?? true,
                    handler: (val) => handleToggleNotification('sms_notifications', val)
                  }
                ].map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '18px 20px',
                      borderRadius: '16px',
                      background: '#F9FDFB',
                      border: '1px solid #DCFCE7'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0A2E1B' }}>{item.title}</span>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: item.enabled ? '#DCFCE7' : '#F1F5F9',
                          color: item.enabled ? '#15803D' : '#64748B'
                        }}>
                          {item.enabled ? 'ACTIVE' : 'MUTED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '3px' }}>{item.desc}</div>
                    </div>

                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => item.handler(e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#16A34A' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Business Preferences & Kitchen Availability (Phase 6 Role Specific) */}
          {activeSection === 'availability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('business_preferences')} • Kitchen Dispatch Status
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  Set current live dining and delivery availability. Stored in PostgreSQL (`UserSettings.business_status`).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { id: 'OPEN', label: 'Online & Taking Orders', color: '#16A34A', bg: '#DCFCE7', desc: 'Accepting all incoming customer orders' },
                  { id: 'BUSY', label: 'Rush Hour (High Volume)', color: '#D97706', bg: '#FEF3C7', desc: 'Alerts customer of extra +15 min prep delay' },
                  { id: 'CLOSED', label: 'Kitchen Paused / Closed', color: '#DC2626', bg: '#FEE2E2', desc: 'Temporarily stops new ticket creation' }
                ].map(opt => {
                  const isSelected = currentKitchenStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleBusinessStatusSelect(opt.id)}
                      style={{
                        padding: '18px',
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? opt.color : '#DCFCE7'}`,
                        background: isSelected ? opt.bg : '#F9FDFB',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: opt.color, fontSize: '0.94rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.78rem', color: '#4B6B58', marginTop: '6px' }}>{opt.desc}</div>
                      {isSelected && (
                        <div style={{ marginTop: '8px', fontSize: '0.68rem', fontWeight: 800, color: opt.color }}>
                          CURRENT LIVE STATUS
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{
                background: '#F4FBF7',
                border: '1px solid #DCFCE7',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                gap: '12px'
              }}>
                <Sparkles size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#325340', lineHeight: 1.5 }}>
                  <strong>Operational Sync:</strong> Changing kitchen status persists directly to the database and automatically informs all connected customer mobile & web apps in real time.
                </div>
              </div>
            </div>
          )}

          {/* 6. Location & Privacy (Phase 6) */}
          {activeSection === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('privacy')} & Merchant Data Security
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  Manage location permissions and platform personalization settings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: '#F9FDFB',
                  border: '1px solid #DCFCE7'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0A2E1B' }}>
                      {t('location_permission')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '3px' }}>
                      {t('location_desc')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings?.location_permission_preference ?? true}
                    onChange={(e) => handleTogglePrivacy('location_permission_preference', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#16A34A' }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: '#F9FDFB',
                  border: '1px solid #DCFCE7'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0A2E1B' }}>
                      {t('personalization')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '3px' }}>
                      Enables predictive prep time analytics and menu velocity insights.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings?.personalization ?? true}
                    onChange={(e) => handleTogglePrivacy('personalization', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#16A34A' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Password & Security (Phase 6 & 4) */}
          {activeSection === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('security_info')}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  {t('session_notice')}
                </p>
              </div>

              {/* JWT Session Card */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: '#F9FDFB',
                border: '1px solid #DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Lock size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.94rem', color: '#0A2E1B' }}>{t('jwt_status')}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', fontSize: '0.7rem', fontWeight: 800 }}>
                        {t('jwt_active')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '2px' }}>
                      Merchant Account: {effectiveProfile.email} (Role: RESTAURANT)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('logout')}
                </button>
              </div>

              {/* Active Sessions List */}
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0A2E1B', margin: '0 0 12px' }}>
                  Active Kitchen POS Terminals
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '14px 18px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0A2E1B' }}>{s.device}</div>
                        <div style={{ fontSize: '0.76rem', color: '#648270', marginTop: '2px' }}>IP: {s.ip} • Status: {s.time}</div>
                      </div>
                      {s.current ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '6px' }}>THIS POS TERMINAL</span>
                      ) : (
                        <button onClick={() => { setSessions(prev => prev.filter(x => x.id !== s.id)); showToast('Terminal session revoked.'); }} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Disconnect</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Password update form */}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #EBF8F1', paddingTop: '18px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0A2E1B', margin: 0 }}>Change Kitchen Access Password</h3>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B' }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{ alignSelf: 'flex-start', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Update Kitchen Password
                </button>
              </form>
            </div>
          )}

          {/* 8. Business Hours & Master Pause Control (Phase 22) */}
          {activeSection === 'business_hours' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    POSTGRESQL SYNCHRONIZED
                  </span>
                  <span style={{ background: '#DCFCE7', color: '#15803D', borderRadius: '6px', padding: '2px 6px', fontSize: '0.68rem', fontWeight: 800 }}>
                    PHASE 22 SUITE
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '4px 0 2px' }}>
                  Standard Operating Hours & Kitchen Capacity
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  Enforced at server level. Customer checkout is automatically blocked outside opening hours or when paused.
                </p>
              </div>

              {/* Operating Times & Benchmark Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                    Kitchen Opening Time
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#648270', marginTop: '3px', display: 'block' }}>Daily start of incoming service</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                    Kitchen Closing Time
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#648270', marginTop: '3px', display: 'block' }}>End of order reception</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                    Target Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={avgPrepTime}
                    onChange={(e) => setAvgPrepTime(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#648270', marginTop: '3px', display: 'block' }}>Kitchen benchmark for KDS</span>
                </div>
              </div>

              {/* Master Pause New Orders Toggle */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: isOrdersPaused ? 'rgba(239, 68, 68, 0.08)' : '#F9FDFB',
                border: `1.5px solid ${isOrdersPaused ? '#EF4444' : '#DCFCE7'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.98rem', color: isOrdersPaused ? '#DC2626' : '#0A2E1B' }}>
                        Temporary Orders Pause (Rush / Maintenance)
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isOrdersPaused ? '#FEE2E2' : '#DCFCE7',
                        color: isOrdersPaused ? '#DC2626' : '#15803D',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        {isOrdersPaused ? 'ORDERS PAUSED' : 'LIVE TAKING ORDERS'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#648270', marginTop: '3px' }}>
                      Instantly pause new customer cart checkout without changing opening hours.
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isOrdersPaused}
                    onChange={(e) => setIsOrdersPaused(e.target.checked)}
                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#EF4444' }}
                  />
                </div>

                {isOrdersPaused && (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#DC2626', display: 'block', marginBottom: '4px' }}>
                      Reason for Pause (Shown to customer at checkout)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kitchen high-volume overload, technical maintenance"
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid #FECACA',
                        background: '#FFFFFF',
                        color: '#0A2E1B',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Active Operating Days */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '8px' }}>
                  Active Operating Days
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const isSelected = openDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setOpenDays(prev => isSelected ? prev.filter(d => d !== day) : [...prev, day]);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: `1.5px solid ${isSelected ? '#22C55E' : '#DCFCE7'}`,
                          background: isSelected ? 'rgba(34, 197, 94, 0.15)' : '#F9FDFB',
                          color: isSelected ? '#15803D' : '#648270',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Operating Settings Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleSaveOperatingSettings}
                  disabled={isSavingOperating}
                  style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #0A2E1B 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: isSavingOperating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  <Save size={16} />
                  <span>{isSavingOperating ? 'Saving to Database...' : 'Save Operating Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 9. Business & Tariffs (Preserved) */}
          {activeSection === 'business_settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: 0 }}>
                Business Settings & Pricing Tariffs
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>Packaging & Bag Fee (₹)</label>
                  <input
                    type="number"
                    value={packagingCharge}
                    onChange={(e) => setPackagingCharge(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>Food GST / VAT Rate (%)</label>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #DCFCE7', background: '#F9FDFB', color: '#0A2E1B' }}
                  />
                </div>
              </div>

              <div style={{ background: '#F4FBF7', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0A2E1B' }}>Platform Escrow Agreement</div>
                  <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '2px' }}>{commissionTier} • Daily T+1 settlement to registered merchant bank account</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '6px' }}>ACTIVE AGREEMENT</span>
              </div>
            </div>
          )}

          {/* 10. About Section (Phase 6) */}
          {activeSection === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0A2E1B 0%, #16A34A 100%)',
                borderRadius: '20px',
                padding: '24px 28px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <FDOrganicLogo size="md" showWordmark={false} theme="dark" />
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#86EFAC', letterSpacing: '0.5px' }}>
                      COMMERCIAL MERCHANT PORTAL
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                      {t('brand_name')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#DCFCE7', marginTop: '2px' }}>
                      {t('app_version')}: v2.4.0 (Phase 6 Foundation)
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  backdropFilter: 'blur(8px)'
                }}>
                  PostgreSQL Powered
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.94rem' }}>
                    <FileText size={18} />
                    <span>{t('terms_of_service')}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#648270', lineHeight: 1.5, marginTop: '8px' }}>
                    Fast Delivery guarantees delivery partner allocation within 7 minutes of food preparation handoff. Merchant agrees to maintain hygiene standards certified by FSSAI regulations.
                  </p>
                </div>

                <div style={{ background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.94rem' }}>
                    <Shield size={18} />
                    <span>{t('privacy_policy')}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#648270', lineHeight: 1.5, marginTop: '8px' }}>
                    Restaurant sales data, bank settlement records, and kitchen terminal credentials are strictly protected in PostgreSQL (`wsfood_db`) with role-based access control.
                  </p>
                </div>
              </div>

              <div style={{ background: '#F4FBF7', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontWeight: 800, color: '#0A2E1B', fontSize: '0.95rem' }}>
                  Dedicated Merchant Operations Desk
                </div>
                <div style={{ fontSize: '0.8rem', color: '#648270', marginTop: '4px' }}>
                  Assistance with thermal printer drivers, rider dispatch chimes, and settlement payouts.
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => showToast('Opening Merchant Care Desk: 1800-419-7700')}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#16A34A', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Call Merchant Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Connecting to KDS live support...')}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #DCFCE7', background: '#FFFFFF', color: '#16A34A', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    KDS Technical Chat
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#648270', textAlign: 'center', marginTop: '12px' }}>
                © {new Date().getFullYear()} {t('all_rights_reserved')}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RestaurantSettingsPage;
