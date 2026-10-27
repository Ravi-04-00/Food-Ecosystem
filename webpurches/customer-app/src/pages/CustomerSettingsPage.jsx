import React, { useState, useRef } from 'react';
import { 
  User, Lock, Bell, Globe, Moon, Sun, Shield, 
  MapPin, Smartphone, HelpCircle, FileText, 
  LogOut, Trash2, Utensils, Check, Plus, AlertCircle, Save,
  Edit3, Camera, Loader, Laptop, Info, ChevronRight, Sparkles
} from 'lucide-react';
import { FDOrganicLogo } from '../components/FDOrganicLogo.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { getTranslation } from '../utils/i18n.js';

export const CustomerSettingsPage = ({ onOpenAuth }) => {
  const { 
    currentUser, 
    userProfile, 
    isLoadingProfile, 
    updateProfile, 
    removeProfilePhoto, 
    login, 
    promptLogout,
    userSettings,
    isLoadingSettings,
    updateSettings
  } = useCustomer();

  const [activeSection, setActiveSection] = useState('profile');
  const [toastMsg, setToastMsg] = useState('');

  // Active language & translation helper
  const currentLang = userSettings?.language || 'en';
  const t = (key) => getTranslation(currentLang, key);

  // Phase 5 Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  const effectiveProfile = {
    full_name: userProfile?.full_name || currentUser?.full_name || currentUser?.name || currentUser?.username || 'Customer',
    email: userProfile?.email || currentUser?.email || 'customer@wsfood.io',
    phone: userProfile?.phone || currentUser?.phone || '+91 98765 00001',
    address: userProfile?.address || currentUser?.address || 'Chennai, Tamil Nadu',
    profile_photo: userProfile?.profile_photo || currentUser?.profile_photo || currentUser?.avatar || '',
    verification_status: userProfile?.verification_status || 'VERIFIED'
  };

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Customer-specific state (preserved)
  const [foodPreferences, setFoodPreferences] = useState({
    vegOnly: false,
    halalOnly: false,
    glutenFree: false,
    nutFree: true,
    spiceLevel: 'Medium'
  });

  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, label: 'Home', address: 'Plot 42, 2nd Avenue, Anna Nagar, Chennai 600040', isDefault: true },
    { id: 2, label: 'Work', address: 'Ascendas IT Park, Taramani, Chennai 600113', isDefault: false }
  ]);
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome 124 on Windows 11', ip: '127.0.0.1 (Localhost)', current: true, time: 'Active Now' },
    { id: 2, device: 'Safari Mobile on iPhone 15 Pro', ip: '157.48.21.90', current: false, time: '2 hours ago' }
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

  // Profile Edit Handlers
  const handleStartEdit = () => {
    setProfileFormData({
      full_name: effectiveProfile.full_name,
      phone: effectiveProfile.phone,
      address: effectiveProfile.address
    });
    setSelectedPhotoFile(null);
    setPhotoPreview(effectiveProfile.profile_photo);
    setProfileErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setSelectedPhotoFile(null);
    setPhotoPreview('');
    setProfileErrors({});
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
      setPhotoPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (removeProfilePhoto) {
      setIsSavingProfile(true);
      try {
        await removeProfilePhoto();
        setPhotoPreview('');
        showToast('Profile photo removed.');
      } catch (err) {
        setProfileErrors({ non_field: err.message || 'Failed to remove photo.' });
      } finally {
        setIsSavingProfile(false);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileFormData.full_name?.trim()) errs.full_name = 'Full name is required.';
    if (!profileFormData.phone?.trim()) errs.phone = 'Mobile number is required.';
    if (!profileFormData.address?.trim()) errs.address = 'Delivery address is required.';
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setIsSavingProfile(true);
    setProfileErrors({});
    try {
      const fd = new FormData();
      fd.append('full_name', profileFormData.full_name.trim());
      fd.append('phone', profileFormData.phone.trim());
      fd.append('address', profileFormData.address.trim());
      if (selectedPhotoFile) {
        fd.append('profile_photo', selectedPhotoFile);
      }
      await updateProfile(fd);
      setIsEditingProfile(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      if (err.errors) {
        setProfileErrors(err.errors);
      } else {
        setProfileErrors({ non_field: err.message || 'Failed to update profile.' });
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
    showToast('Password successfully updated.');
  };

  const handleAddAddress = () => {
    if (!newAddressText.trim()) return;
    setSavedAddresses(prev => [
      ...prev,
      { id: Date.now(), label: newAddressLabel, address: newAddressText.trim(), isDefault: false }
    ]);
    setNewAddressText('');
    setShowAddAddress(false);
    showToast('New address saved to your account.');
  };

  const handleRevokeSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast('Session revoked.');
  };

  const handleLogout = () => {
    if (promptLogout) {
      promptLogout();
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your FD customer account? This cannot be undone.')) {
      showToast('Account scheduled for permanent erasure.');
      setTimeout(() => {
        if (onOpenAuth) onOpenAuth();
      }, 1000);
    }
  };

  // Navigation Items matching Phase 6 Sections
  const navItems = [
    { id: 'profile', label: t('account'), icon: User },
    { id: 'appearance', label: t('appearance'), icon: Moon },
    { id: 'language', label: t('language'), icon: Globe },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'privacy', label: t('privacy'), icon: Shield },
    { id: 'security', label: t('security'), icon: Lock },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'food_prefs', label: 'Food Preferences', icon: Utensils },
    { id: 'about', label: t('about'), icon: Info }
  ];

  const currentTheme = userSettings?.theme || 'light';

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Page Header */}
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
              <span>FD FOOD ECOSYSTEM • PHASE 6</span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0A2E1B', margin: '2px 0 0' }}>
              {t('settings')}
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#648270', margin: '2px 0 0' }}>
              {t('settings_subtitle')}
            </p>
          </div>
        </div>

        {/* Global Toast */}
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
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
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
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
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
              <span>Delete Account</span>
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

          {/* 1. Profile / Account (Phase 5) */}
          {activeSection === 'profile' && (
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
                /* READ-ONLY VIEW MODE (DEFAULT) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                        Customer Profile & Identity
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                        Review your verified account identity, contact details, and registered address.
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

                  {/* Profile Avatar Card */}
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
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #16A34A 0%, #0A2E1B 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '3px solid #FFFFFF',
                      boxShadow: '0 4px 14px rgba(10, 46, 27, 0.12)'
                    }}>
                      {effectiveProfile.profile_photo ? (
                        <img 
                          src={effectiveProfile.profile_photo} 
                          alt="Profile" 
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <User size={36} color="#FFFFFF" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0A2E1B' }}>
                          {effectiveProfile.full_name}
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
                        {effectiveProfile.email}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                        CUSTOMER ACCOUNT • VERIFIED
                      </div>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Full Legal Name</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.full_name}</div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Registered Email (Immutable)</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.email}</div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Mobile Contact</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.phone}</div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '14px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.74rem', color: '#648270', fontWeight: 700, textTransform: 'uppercase' }}>Delivery Address</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2E1B', marginTop: '4px' }}>{effectiveProfile.address}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* EDITING MODE */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                        Edit Customer Profile
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                        Update your identity details. Email address is permanently anchored to your JWT.
                      </p>
                    </div>
                  </div>

                  {/* Photo Edit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', borderRadius: '16px', background: '#F9FDFB', border: '1px solid #DCFCE7' }}>
                    <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #16A34A' }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={32} color="#64748B" />
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
                          <span>Upload Photo</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoSelect}
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                        />
                        {(photoPreview || effectiveProfile.profile_photo) && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
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
                      {profileErrors.profile_photo && (
                        <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>
                          {profileErrors.profile_photo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Full Legal Name <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={profileFormData.full_name}
                        onChange={(e) => setProfileFormData(p => ({ ...p, full_name: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: `1.5px solid ${profileErrors.full_name ? '#EF4444' : '#DCFCE7'}`,
                          background: '#F9FDFB',
                          color: '#0A2E1B',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#648270', display: 'block', marginBottom: '6px' }}>
                        Email Address (Read-Only)
                      </label>
                      <input
                        type="email"
                        value={effectiveProfile.email}
                        disabled
                        readOnly
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          background: '#F1F5F9',
                          color: '#64748B',
                          outline: 'none',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Mobile Contact Number <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData(p => ({ ...p, phone: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: `1.5px solid ${profileErrors.phone ? '#EF4444' : '#DCFCE7'}`,
                          background: '#F9FDFB',
                          color: '#0A2E1B',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '6px' }}>
                        Delivery Address <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={profileFormData.address}
                        onChange={(e) => setProfileFormData(p => ({ ...p, address: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: `1.5px solid ${profileErrors.address ? '#EF4444' : '#DCFCE7'}`,
                          background: '#F9FDFB',
                          color: '#0A2E1B',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #DCFCE7' }}>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1px solid #DCFCE7',
                        background: 'transparent',
                        color: '#325340',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: isSavingProfile ? 'not-allowed' : 'pointer'
                      }}
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

                      {/* Visual Palette Preview */}
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
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.previewText }}>FD Luxury</span>
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

              <div style={{
                background: '#F9FDFB',
                border: '1px solid #DCFCE7',
                borderRadius: '14px',
                padding: '14px 18px',
                fontSize: '0.82rem',
                color: '#325340'
              }}>
                <strong>Branding Note:</strong> The signature FD leaf identity and luxury palette adapt seamlessly across both Light and OLED Dark surface profiles while preserving visual contrast.
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
                  { code: 'en', name: 'English', native: 'English (International)', desc: 'Global platform language with standard culinary nomenclature.' },
                  { code: 'ta', name: 'Tamil', native: 'தமிழ் (Tamil)', desc: 'தமிழ் மொழி இடைமுகம் மற்றும் உள்ளூர் உணவு பரிந்துரைகள்.' },
                  { code: 'hi', name: 'Hindi', native: 'हिन्दी (Hindi)', desc: 'प्लेटफ़ॉर्म इंटरफ़ेस और क्षेत्रीय व्यंजन विकल्प।' }
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

              <div style={{
                background: '#F9FDFB',
                border: '1px solid #DCFCE7',
                borderRadius: '14px',
                padding: '14px 18px',
                fontSize: '0.82rem',
                color: '#325340'
              }}>
                <strong>Persistence:</strong> Language preferences are saved directly to PostgreSQL (`wsfood_db`) and maintained across all authenticated sessions.
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
                  {t('notification_desc')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  {
                    key: 'push_notifications',
                    title: t('push_notifications'),
                    desc: t('push_desc'),
                    enabled: userSettings?.push_notifications ?? true
                  },
                  {
                    key: 'email_notifications',
                    title: t('email_notifications'),
                    desc: t('email_desc'),
                    enabled: userSettings?.email_notifications ?? true
                  },
                  {
                    key: 'sms_notifications',
                    title: t('sms_notifications'),
                    desc: t('sms_desc'),
                    enabled: userSettings?.sms_notifications ?? true
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
                      onChange={(e) => handleToggleNotification(item.key, e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#16A34A'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{
                background: '#F4FBF7',
                border: '1px solid #DCFCE7',
                borderRadius: '14px',
                padding: '14px 18px',
                fontSize: '0.82rem',
                color: '#325340'
              }}>
                <strong>Preference Guarantee:</strong> We store your notification preferences safely in PostgreSQL without broadcasting spam. Critical security alerts are exempt.
              </div>
            </div>
          )}

          {/* 5. Privacy Section (Phase 6) */}
          {activeSection === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: '0 0 4px' }}>
                  {t('privacy_prefs')}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>
                  Manage personalization settings and preferred delivery depot permissions.
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
                      {t('personalization')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#648270', marginTop: '3px' }}>
                      {t('personalization_desc')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings?.personalization ?? true}
                    onChange={(e) => handleTogglePrivacy('personalization', e.target.checked)}
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
              </div>

              <div style={{
                background: '#F4FBF7',
                border: '1px solid #DCFCE7',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                gap: '12px'
              }}>
                <Shield size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#325340', lineHeight: 1.5 }}>
                  <strong>Zero Background Tracking Guarantee:</strong> Food Delivery (FD) respects your confidentiality. Location permission preferences are stored only to index regional restaurant menus. Real-time background GPS tracking is strictly deactivated.
                </div>
              </div>
            </div>
          )}

          {/* 6. Security Section (Phase 6 & Phase 4) */}
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

              {/* JWT Session Status Card */}
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
                      Authenticated user: {effectiveProfile.email} (Role: CUSTOMER)
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
                  {t('active_sessions')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '14px 18px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0A2E1B' }}>{s.device}</span>
                          {s.current && <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: '6px' }}>THIS DEVICE</span>}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#648270', marginTop: '2px' }}>IP: {s.ip} • Last accessed {s.time}</div>
                      </div>
                      {!s.current && (
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Change Password Form (Preserved UI) */}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #EBF8F1', paddingTop: '18px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0A2E1B', margin: 0 }}>
                  Update Password
                </h3>
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
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2E1B', display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
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
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* 7. Saved Addresses (Preserved) */}
          {activeSection === 'addresses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: 0 }}>Saved Delivery Addresses</h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.12)', color: '#16A34A', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  <Plus size={15} />
                  <span>Add Address</span>
                </button>
              </div>

              {showAddAddress && (
                <div style={{ background: '#F4FBF7', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Home', 'Work', 'Other'].map(lbl => (
                      <button
                        key={lbl}
                        onClick={() => setNewAddressLabel(lbl)}
                        style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${newAddressLabel === lbl ? '#22C55E' : '#DCFCE7'}`, background: newAddressLabel === lbl ? 'rgba(34, 197, 94, 0.15)' : '#FFFFFF', color: newAddressLabel === lbl ? '#16A34A' : '#325340', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Enter complete building, street, landmark, Chennai 6000..."
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #DCFCE7', background: '#FFFFFF', color: '#0A2E1B', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => setShowAddAddress(false)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #DCFCE7', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleAddAddress} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#16A34A', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>Save Address</button>
                  </div>
                </div>
              )}

              {savedAddresses.map(addr => (
                <div key={addr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: addr.isDefault ? 'rgba(34, 197, 94, 0.15)' : '#EBF8F1', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0A2E1B' }}>{addr.label}</span>
                        {addr.isDefault && <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: '6px' }}>DEFAULT</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#648270', marginTop: '2px' }}>{addr.address}</div>
                    </div>
                  </div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => { setSavedAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id }))); showToast('Default address updated.'); }}
                      style={{ background: 'none', border: 'none', color: '#16A34A', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Make Default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 8. Food Preferences (Preserved) */}
          {activeSection === 'food_prefs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2E1B', margin: 0 }}>Gourmet Dietary & Food Preferences</h2>
              <p style={{ fontSize: '0.82rem', color: '#648270', margin: 0 }}>Preferences prioritize relevant menus, cloud kitchens, and allergy warnings.</p>

              {[
                { key: 'vegOnly', label: 'Pure Vegetarian Mode', desc: 'Filter out non-veg items across all menus by default' },
                { key: 'halalOnly', label: '100% Halal Certified Food', desc: 'Display only verified halal meat kitchens' },
                { key: 'glutenFree', label: 'Gluten-Free Priority', desc: 'Flag dishes with zero wheat or gluten ingredients' },
                { key: 'nutFree', label: 'Severe Nut Allergy Alert', desc: 'Alert kitchens to enforce zero peanut/tree-nut cross-contact' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '14px 18px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0A2E1B' }}>{item.label}</div>
                    <div style={{ fontSize: '0.76rem', color: '#648270', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={foodPreferences[item.key]}
                    onChange={(e) => {
                      setFoodPreferences(prev => ({ ...prev, [item.key]: e.target.checked }));
                      showToast(`${item.label} updated.`);
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#22C55E' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 9. About Section (Phase 6) */}
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
                      LUXURY FOOD DISCOVERY ECOSYSTEM
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

              {/* Policy & Terms Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.94rem' }}>
                    <FileText size={18} />
                    <span>{t('terms_of_service')}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#648270', lineHeight: 1.5, marginTop: '8px' }}>
                    Orders placed on the FD ecosystem comply with standard Food Safety and Standards Authority regulations. All transaction records are cryptographically verified.
                  </p>
                </div>

                <div style={{ background: '#F9FDFB', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.94rem' }}>
                    <Shield size={18} />
                    <span>{t('privacy_policy')}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#648270', lineHeight: 1.5, marginTop: '8px' }}>
                    Customer credentials, telephone numbers, and delivery points are strictly stored with row-level security in PostgreSQL (`wsfood_db`) without external sharing.
                  </p>
                </div>
              </div>

              {/* Customer Concierge Desk */}
              <div style={{ background: '#F4FBF7', border: '1px solid #DCFCE7', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontWeight: 800, color: '#0A2E1B', fontSize: '0.95rem' }}>
                  {t('customer_support')}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#648270', marginTop: '4px' }}>
                  Dedicated 24/7 concierge assistance for live orders and platform inquiries.
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => showToast('Connecting to 24/7 customer care concierge desk...')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Start Concierge Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Helpline: 1800-419-3322 (Toll Free)')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid #DCFCE7',
                      background: '#FFFFFF',
                      color: '#16A34A',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Call VIP Helpline
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

export default CustomerSettingsPage;
