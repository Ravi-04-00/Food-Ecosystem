import React, { useState, useRef } from 'react';
import { 
  X, User, MapPin, CreditCard, Wallet, Clock, 
  Settings, HelpCircle, Shield, LogOut, Check, Plus,
  Edit3, Save, Camera, Trash2, AlertCircle, Loader, Lock
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';

export const CustomerProfileModal = ({ 
  isOpen, 
  onClose, 
  onOpenAuth, 
  onNavigateTab 
}) => {
  const { 
    currentUser, 
    userProfile, 
    isLoadingProfile, 
    updateProfile, 
    removeProfilePhoto, 
    orders, 
    promptLogout 
  } = useCustomer();
  const [activeSection, setActiveSection] = useState('profile'); // profile, orders, wallet, addresses, payments, settings, help, security
  
  // Phase 5 Profile Edit Mode State
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
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const [walletBalance, setWalletBalance] = useState(1250.00);
  const [addAmount, setAddAmount] = useState('500');
  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, label: 'Home', address: 'Plot 42, 2nd Avenue, Anna Nagar, Chennai 600040', isDefault: true },
    { id: 2, label: 'Work', address: 'Ascendas IT Park, Taramani, Chennai 600113', isDefault: false }
  ]);
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrLabel, setNewAddrLabel] = useState('Other');
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const effectiveProfile = {
    full_name: userProfile?.full_name || currentUser?.full_name || currentUser?.name || currentUser?.username || 'Customer',
    email: userProfile?.email || currentUser?.email || 'customer@wsfood.io',
    phone: userProfile?.phone || currentUser?.phone || '+91 98765 00001',
    address: userProfile?.address || currentUser?.address || 'Chennai, Tamil Nadu',
    profile_photo: userProfile?.profile_photo || currentUser?.profile_photo || currentUser?.avatar || '',
    verification_status: userProfile?.verification_status || 'VERIFIED'
  };

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
        setProfileSuccessMsg('Profile photo removed.');
        setTimeout(() => setProfileSuccessMsg(''), 3000);
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
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
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

  if (!isOpen) return null;

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleAddMoney = () => {
    const val = parseFloat(addAmount);
    if (!isNaN(val) && val > 0) {
      setWalletBalance(prev => prev + val);
      showStatus(`₹${val} added successfully to your Fast Delivery Wallet!`);
    }
  };

  const handleAddAddress = () => {
    if (!newAddrText.trim()) return;
    const newAddr = {
      id: Date.now(),
      label: newAddrLabel,
      address: newAddrText.trim(),
      isDefault: false
    };
    setSavedAddresses(prev => [...prev, newAddr]);
    setNewAddrText('');
    setShowAddAddr(false);
    showStatus('New delivery address saved!');
  };

  const handleDeleteAddress = (id) => {
    setSavedAddresses(prev => prev.filter(a => a.id !== id));
    showStatus('Address removed.');
  };

  const handleSetDefaultAddress = (id) => {
    setSavedAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    showStatus('Default address updated.');
  };

  const handleLogout = () => {
    onClose();
    if (promptLogout) {
      promptLogout();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(6, 40, 23, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: '0 24px 60px rgba(6, 40, 23, 0.25)',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}>
              {effectiveProfile.profile_photo ? (
                <img 
                  src={effectiveProfile.profile_photo} 
                  alt={effectiveProfile.full_name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                (effectiveProfile.full_name?.[0] || 'C').toUpperCase()
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                {effectiveProfile.full_name}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{effectiveProfile.phone}</span>
                <span>•</span>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>
                  {effectiveProfile.verification_status || 'Customer'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--ws-border)',
              background: 'var(--ws-surface)',
              color: 'var(--ws-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMsg && (
          <div style={{
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Body Layout: Sidebar Navigation + Content Area */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Navigation Tabs */}
          <div style={{
            width: '230px',
            borderRight: '1px solid var(--ws-border)',
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: 'var(--ws-surface-subtle)'
          }}>
            {[
              { id: 'profile', label: 'My Account', icon: User },
              { id: 'orders', label: 'Order History', icon: Clock, count: orders?.length || 2 },
              { id: 'wallet', label: 'FD Wallet', icon: Wallet, badge: `₹${walletBalance}` },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'payments', label: 'Payment Modes', icon: CreditCard },
              { id: 'settings', label: 'Preferences', icon: Settings },
              { id: 'help', label: 'Help & Support', icon: HelpCircle },
              { id: 'security', label: 'Security & 2FA', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isActive ? '#22C55E' : 'transparent',
                    backgroundColor: isActive ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                    color: isActive ? '#16A34A' : 'var(--ws-text-secondary)',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#16A34A',
                      background: 'rgba(34, 197, 94, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: 'var(--ws-text-muted)'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--ws-border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  color: '#EF4444',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Right Section Content */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {/* 1. Account Details (Phase 5: Real-Life Profile Management) */}
            {activeSection === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profileSuccessMsg && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Check size={16} />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 4px' }}>
                          Personal Profile
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                          View your verified account identity, contact information, and primary address.
                        </p>
                      </div>
                      <button
                        onClick={handleStartEdit}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Edit3 size={15} />
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    {/* Profile Summary Card with Avatar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      padding: '18px',
                      borderRadius: '16px',
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)'
                    }}>
                      <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 6px 16px rgba(34, 197, 94, 0.25)'
                      }}>
                        {effectiveProfile.profile_photo ? (
                          <img 
                            src={effectiveProfile.profile_photo} 
                            alt={effectiveProfile.full_name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          (effectiveProfile.full_name?.[0] || 'C').toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                            {effectiveProfile.full_name}
                          </h4>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC'
                          }}>
                            {effectiveProfile.verification_status || 'VERIFIED'}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                          Customer Account • Fast Delivery Ecosystem
                        </p>
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Full Legal Name</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.full_name}
                        </div>
                      </div>

                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                            <Lock size={10} /> Read-only
                          </span>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.email}
                        </div>
                      </div>

                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Primary Mobile</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.phone}
                        </div>
                      </div>

                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Primary Delivery Address</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.address}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(74, 222, 128, 0.08) 100%)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.95rem' }}>Fast Delivery Green Club Active</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', marginTop: '2px' }}>Enjoy free doorstep delivery on all orders across your registered address.</div>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#22C55E', color: '#FFF', padding: '4px 10px', borderRadius: '999px' }}>VIP</span>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE */
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 4px' }}>
                          Edit Profile Details
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                          Update your name, contact phone, and delivery address. Email is permanently locked.
                        </p>
                      </div>
                    </div>

                    {/* Photo Management Section */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)'
                    }}>
                      <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
                      }}>
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          (profileFormData.full_name?.[0] || 'C').toUpperCase()
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/png,image/jpeg,image/webp" 
                            onChange={handlePhotoSelect} 
                            style={{ display: 'none' }} 
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: '10px',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              background: 'rgba(34, 197, 94, 0.1)',
                              color: '#15803D',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Camera size={14} />
                            <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                          </button>

                          {(photoPreview || effectiveProfile.profile_photo) && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              disabled={isSavingProfile}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#DC2626',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                          Supports JPG, PNG, WEBP (Max 5MB)
                        </span>
                        {profileErrors.profile_photo && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>
                            {profileErrors.profile_photo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {/* Full Name */}
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Full Name <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormData.full_name}
                          onChange={(e) => setProfileFormData(p => ({ ...p, full_name: e.target.value }))}
                          required
                          placeholder="Your legal name"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${profileErrors.full_name ? '#EF4444' : 'var(--ws-border)'}`,
                            background: 'var(--ws-surface)',
                            color: 'var(--ws-text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                        {profileErrors.full_name && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                            {Array.isArray(profileErrors.full_name) ? profileErrors.full_name[0] : profileErrors.full_name}
                          </span>
                        )}
                      </div>

                      {/* Email (Read-Only) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-muted)' }}>
                            Email Address (Read-Only)
                          </label>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                            <Lock size={10} /> Immutable
                          </span>
                        </div>
                        <input
                          type="email"
                          value={effectiveProfile.email}
                          disabled
                          readOnly
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: '1.5px solid var(--ws-border)',
                            background: 'var(--ws-surface-subtle)',
                            color: 'var(--ws-text-muted)',
                            fontSize: '0.88rem',
                            cursor: 'not-allowed'
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)', display: 'block', marginTop: '4px' }}>
                          Identity address cannot be changed.
                        </span>
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Mobile Number <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="tel"
                          value={profileFormData.phone}
                          onChange={(e) => setProfileFormData(p => ({ ...p, phone: e.target.value }))}
                          required
                          placeholder="+91 98765 43210"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${profileErrors.phone ? '#EF4444' : 'var(--ws-border)'}`,
                            background: 'var(--ws-surface)',
                            color: 'var(--ws-text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                        {profileErrors.phone && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                            {Array.isArray(profileErrors.phone) ? profileErrors.phone[0] : profileErrors.phone}
                          </span>
                        )}
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Delivery Address <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormData.address}
                          onChange={(e) => setProfileFormData(p => ({ ...p, address: e.target.value }))}
                          required
                          placeholder="Plot number, Street, Area, City"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${profileErrors.address ? '#EF4444' : 'var(--ws-border)'}`,
                            background: 'var(--ws-surface)',
                            color: 'var(--ws-text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                        {profileErrors.address && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                            {Array.isArray(profileErrors.address) ? profileErrors.address[0] : profileErrors.address}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Cancel & Save Changes */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--ws-border)'
                    }}>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSavingProfile}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '12px',
                          border: '1px solid var(--ws-border)',
                          background: 'transparent',
                          color: 'var(--ws-text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
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
                          cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
                          opacity: isSavingProfile ? 0.75 : 1
                        }}
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 2. Order History */}
            {activeSection === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Recent Orders ({orders?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab('orders');
                      }}
                      style={{
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: '#16A34A',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '10px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      View All Orders →
                    </button>
                  </div>
                </div>

                {(orders && orders.length > 0 ? orders.slice(0, 5) : [
                  { id: 'FD-9021', order_number: 'FD-9021', restaurant_name: 'Cyber Smash Burgers', items: [{ food_name: 'Quantum Double Glaze Burger', quantity: 1 }], total: '457.00', status: 'PLACED', created_at: new Date().toISOString() }
                ]).map(order => {
                  const itemsSummary = Array.isArray(order.items) 
                    ? order.items.map(i => `${i.food_name || i.food_name_snapshot || 'Dish'} × ${i.quantity}`).join(', ')
                    : (order.items || 'Meal');

                  return (
                    <div key={order.id} style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ws-text-primary)' }}>
                            {order.restaurant_name || 'Kitchen Partner'}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                            {order.order_number || order.id} • {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: order.status === 'DELIVERED' ? 'rgba(34, 197, 94, 0.15)' : order.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: order.status === 'DELIVERED' ? '#16A34A' : order.status === 'CANCELLED' ? '#DC2626' : '#D97706'
                        }}>
                          {order.status || 'PLACED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)' }}>{itemsSummary}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--ws-border)' }}>
                        <span style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.92rem' }}>
                          Total: ₹{Number(order.total || order.grand_total || 0).toFixed(0)}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            if (onNavigateTab) onNavigateTab('orders');
                          }}
                          style={{
                            background: '#22C55E',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View Order
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. FD Wallet */}
            {activeSection === 'wallet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '24px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #062817 0%, #0B331F 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 12px 30px rgba(6, 40, 23, 0.35)',
                  border: '1px solid rgba(74, 222, 128, 0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#A7F3D0', fontWeight: 600 }}>FAST DELIVERY CASH BALANCE</div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ADE80', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>ACTIVE</span>
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>
                    ₹{walletBalance.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6EE7B7', marginTop: '6px' }}>
                    Instant zero-fee checkout on all 4 apps. 5% cashback on orders &gt; ₹300.
                  </div>
                </div>

                <div style={{ background: 'var(--ws-surface-subtle)', padding: '18px', borderRadius: '16px', border: '1px solid var(--ws-border)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>Top-Up Wallet Instantly</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {['200', '500', '1000', '2000'].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAddAmount(amt)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '10px',
                          border: `1px solid ${addAmount === amt ? '#22C55E' : 'var(--ws-border)'}`,
                          background: addAmount === amt ? 'rgba(34, 197, 94, 0.15)' : 'var(--ws-surface)',
                          color: addAmount === amt ? '#16A34A' : 'var(--ws-text-primary)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAddMoney}
                    style={{
                      width: '100%',
                      marginTop: '14px',
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    Add ₹{addAmount} via UPI / Card
                  </button>
                </div>
              </div>
            )}

            {/* 4. Saved Addresses */}
            {activeSection === 'addresses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Saved Delivery Addresses ({savedAddresses.length})
                  </h3>
                  <button
                    onClick={() => setShowAddAddr(!showAddAddr)}
                    style={{
                      background: '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Address</span>
                  </button>
                </div>

                {showAddAddr && (
                  <div style={{ background: 'var(--ws-surface-subtle)', padding: '16px', borderRadius: '16px', border: '1px solid var(--ws-border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Add New Location</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      {['Home', 'Work', 'Friends', 'Other'].map(lbl => (
                        <button
                          key={lbl}
                          onClick={() => setNewAddrLabel(lbl)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${newAddrLabel === lbl ? '#22C55E' : 'var(--ws-border)'}`,
                            background: newAddrLabel === lbl ? 'rgba(34, 197, 94, 0.15)' : 'var(--ws-surface)',
                            color: newAddrLabel === lbl ? '#16A34A' : 'var(--ws-text-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter complete building, street, landmark, pincode..."
                      value={newAddrText}
                      onChange={(e) => setNewAddrText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--ws-border)',
                        background: 'var(--ws-surface)',
                        color: 'var(--ws-text-primary)',
                        fontSize: '0.85rem',
                        marginBottom: '10px',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => setShowAddAddr(false)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--ws-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAddress}
                        style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#22C55E', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {savedAddresses.map(addr => (
                  <div key={addr.id} style={{
                    background: 'var(--ws-surface-subtle)',
                    border: `1px solid ${addr.isDefault ? '#22C55E' : 'var(--ws-border)'}`,
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: addr.isDefault ? 'rgba(34, 197, 94, 0.15)' : 'var(--ws-surface)',
                        color: addr.isDefault ? '#16A34A' : 'var(--ws-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>{addr.label}</span>
                          {addr.isDefault && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: '6px' }}>DEFAULT</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', marginTop: '4px' }}>{addr.address}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          style={{ fontSize: '0.75rem', color: '#22C55E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        style={{ fontSize: '0.75rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Payment Methods */}
            {activeSection === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Payment Methods
                </h3>
                <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#22C55E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Fast Delivery Balance</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>₹{walletBalance.toFixed(2)} available</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16A34A', background: 'rgba(34, 197, 94, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>LINKED</span>
                  </div>
                </div>

                <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ws-border)' }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>HDFC Platinum Visa Debit</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>•••• •••• •••• 4092 (Expires 08/29)</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16A34A', background: 'rgba(34, 197, 94, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>DEFAULT CARD</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Settings & Preferences */}
            {activeSection === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    App Preferences & Notifications
                  </h3>
                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) onNavigateTab('settings');
                    }}
                    style={{
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#16A34A',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Open Full Settings ⚙️
                  </button>
                </div>
                {[
                  { title: 'Push Notifications', desc: 'Real-time order stage changes and delivery partner arrival', def: true },
                  { title: 'WhatsApp Live Updates', desc: 'Receive invoice and live GPS route link on WhatsApp', def: true },
                  { title: 'Veg-Only Filter Default', desc: 'Prioritize pure vegetarian restaurants and cloud kitchens', def: false },
                  { title: 'Contactless Delivery', desc: 'Rider leaves food at doorstep and rings bell with zero contact', def: true }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={item.def} 
                      onChange={() => showStatus(`${item.title} updated!`)}
                      style={{ width: '18px', height: '18px', accentColor: '#22C55E', cursor: 'pointer' }} 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 7. Help Center */}
            {activeSection === 'help' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Fast Delivery Customer Support
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                  24x7 instant assistance for active deliveries, missing items, refunds, or payment queries.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={() => showStatus('Live chat connected with Support Agent Anand!')}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.92rem' }}>💬 Live Chat Support</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>Average response time: &lt; 45 seconds</div>
                  </button>
                  <button
                    onClick={() => showStatus('Calling Toll-Free Support: 1800-419-3322')}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '14px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.92rem' }}>📞 Call Helpline</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>Toll Free: 1800-419-3322</div>
                  </button>
                </div>
              </div>
            )}

            {/* 8. Security & 2FA */}
            {activeSection === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Security & Authentication Controls
                </h3>
                <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>Require SMS OTP confirmation upon new browser sign-in</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16A34A', background: 'rgba(34, 197, 94, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>ACTIVE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
