import React, { useState, useRef } from 'react';
import { 
  X, Store, Clock, CreditCard, 
  Users, ShieldCheck, Check, Award, LogOut, FileText,
  Edit3, Save, Camera, Trash2, AlertCircle, Loader, Lock
} from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';

export const RestaurantProfileModal = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    restaurantProfileData, 
    isLoadingProfile, 
    updateProfile, 
    removeRestaurantLogo, 
    promptLogout 
  } = useShop();
  const [activeTab, setActiveTab] = useState('profile'); // profile, hours, kyc, bank, staff, security
  const [statusMsg, setStatusMsg] = useState('');
  
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
    restaurant_name: restaurantProfileData?.restaurant_name || currentUser?.restaurant_name || 'FD Authentic Biryani & Grill',
    owner_name: restaurantProfileData?.owner_name || currentUser?.owner_name || currentUser?.name || 'Chef Kane',
    email: restaurantProfileData?.email || currentUser?.email || 'chef_kane@fastdelivery.io',
    phone: restaurantProfileData?.phone || currentUser?.phone || '+91 94440 12890',
    restaurant_address: restaurantProfileData?.restaurant_address || restaurantProfileData?.address || currentUser?.address || '14/2 3rd Main Road, Anna Nagar East, Chennai 600102',
    restaurant_logo: restaurantProfileData?.restaurant_logo || '',
    verification_status: restaurantProfileData?.verification_status || 'APPROVED'
  };

  const [openTime, setOpenTime] = useState('11:00 AM');
  const [closeTime, setCloseTime] = useState('11:30 PM');
  const fssai = '12423002000451';
  const bankAcc = '•••• •••• •••• 9012';
  const ifsc = 'HDFC0001824';

  if (!isOpen) return null;

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

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
      setProfileErrors(prev => ({ ...prev, restaurant_logo: 'Logo file exceeds maximum 5MB size limit.' }));
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
        showStatus('Restaurant logo removed.');
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
    if (!profileFormData.restaurant_name?.trim()) errs.restaurant_name = 'Restaurant name is required.';
    if (!profileFormData.owner_name?.trim()) errs.owner_name = 'Owner name is required.';
    if (!profileFormData.phone?.trim()) errs.phone = 'Contact phone is required.';
    if (!profileFormData.restaurant_address?.trim()) errs.restaurant_address = 'Restaurant address is required.';
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
      showStatus('Restaurant profile updated successfully!');
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(6, 40, 23, 0.75)',
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
        boxShadow: '0 24px 60px rgba(6, 40, 23, 0.35)',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#22C55E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {effectiveProfile.restaurant_logo ? (
                <img 
                  src={effectiveProfile.restaurant_logo} 
                  alt={effectiveProfile.restaurant_name} 
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <Store size={22} />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                {effectiveProfile.restaurant_name}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#4ADE80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Owner: {effectiveProfile.owner_name}</span>
                <span>•</span>
                <span>Status: {effectiveProfile.verification_status}</span>
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

        {/* Status Toast */}
        {statusMsg && (
          <div style={{
            backgroundColor: '#064E3B',
            color: '#6EE7B7',
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

        {/* Body Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Tabs */}
          <div style={{
            width: '220px',
            borderRight: '1px solid var(--ws-border)',
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: 'var(--ws-surface-subtle)'
          }}>
            {[
              { id: 'profile', label: 'Kitchen Profile', icon: Store },
              { id: 'hours', label: 'Business Hours', icon: Clock },
              { id: 'kyc', label: 'FSSAI & KYC', icon: FileText },
              { id: 'bank', label: 'Payout & Bank', icon: CreditCard },
              { id: 'staff', label: 'Staff Roles', icon: Users },
              { id: 'security', label: 'Security & Log', icon: ShieldCheck }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isActive ? '#22C55E' : 'transparent',
                    backgroundColor: isActive ? 'rgba(34, 197, 94, 0.16)' : 'transparent',
                    color: isActive ? '#4ADE80' : 'var(--ws-text-secondary)',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--ws-border)' }}>
              <button
                onClick={() => {
                  onClose();
                  if (promptLogout) promptLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#EF4444',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <LogOut size={16} />
                <span>Logout Kitchen</span>
              </button>
            </div>
          </div>

          {/* Right Tab Content */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {/* 1. Restaurant Profile (Phase 5: Real-Life Profile Management) */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {statusMsg && (
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
                    <span>{statusMsg}</span>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--ws-text-primary)' }}>
                          Restaurant Profile & Ownership
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                          Verified restaurant partner identity and kitchen operational details.
                        </p>
                      </div>

                      <button
                        type="button"
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
                          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
                        }}
                      >
                        <Edit3 size={15} />
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    {/* Logo & Info Card */}
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
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)'
                      }}>
                        {effectiveProfile.restaurant_logo ? (
                          <img 
                            src={effectiveProfile.restaurant_logo} 
                            alt={effectiveProfile.restaurant_name} 
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <Store size={32} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                            {effectiveProfile.restaurant_name}
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
                            {effectiveProfile.verification_status}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                          Owner / Executive: <strong>{effectiveProfile.owner_name}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Restaurant Name</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.restaurant_name}
                        </div>
                      </div>

                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Owner / Manager Name</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.owner_name}
                        </div>
                      </div>

                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Business Email</span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                            <Lock size={10} /> Read-only
                          </span>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.email}
                        </div>
                      </div>

                      <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Kitchen Phone</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.phone}
                        </div>
                      </div>

                      <div style={{ gridColumn: 'span 2', background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Kitchen Dispatch Address</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ws-text-primary)', marginTop: '4px' }}>
                          {effectiveProfile.restaurant_address}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE */
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--ws-text-primary)' }}>
                          Edit Restaurant Details
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                          Update display brand name, manager name, contact phone, and dispatch address. Email is read-only.
                        </p>
                      </div>
                    </div>

                    {/* Logo Upload Section */}
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
                        borderRadius: '16px',
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
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <Store size={32} />
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/png,image/jpeg,image/webp" 
                            onChange={handleLogoSelect} 
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
                            <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                          </button>

                          {(logoPreview || effectiveProfile.restaurant_logo) && (
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
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
                        {profileErrors.restaurant_logo && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>
                            {profileErrors.restaurant_logo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Restaurant Name <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormData.restaurant_name}
                          onChange={(e) => setProfileFormData(p => ({ ...p, restaurant_name: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${profileErrors.restaurant_name ? '#EF4444' : 'var(--ws-border)'}`,
                            background: 'var(--ws-surface)',
                            color: 'var(--ws-text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                        {profileErrors.restaurant_name && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                            {Array.isArray(profileErrors.restaurant_name) ? profileErrors.restaurant_name[0] : profileErrors.restaurant_name}
                          </span>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Owner / Manager Name <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormData.owner_name}
                          onChange={(e) => setProfileFormData(p => ({ ...p, owner_name: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${profileErrors.owner_name ? '#EF4444' : 'var(--ws-border)'}`,
                            background: 'var(--ws-surface)',
                            color: 'var(--ws-text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                        />
                        {profileErrors.owner_name && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                            {Array.isArray(profileErrors.owner_name) ? profileErrors.owner_name[0] : profileErrors.owner_name}
                          </span>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-muted)' }}>
                            Business Email (Read-Only)
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
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Kitchen Helpline Phone <span style={{ color: '#DC2626' }}>*</span>
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

                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                          Dispatch Kitchen Address <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={profileFormData.restaurant_address}
                          onChange={(e) => setProfileFormData(p => ({ ...p, restaurant_address: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${profileErrors.restaurant_address ? '#EF4444' : 'var(--ws-border)'}`,
                            background: 'var(--ws-surface)',
                            color: 'var(--ws-text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            resize: 'none'
                          }}
                        />
                        {profileErrors.restaurant_address && (
                          <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                            {Array.isArray(profileErrors.restaurant_address) ? profileErrors.restaurant_address[0] : profileErrors.restaurant_address}
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

            {activeTab === 'hours' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                  Operating Hours & Dispatch Schedule
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>Opening Time</label>
                    <input
                      type="text"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--ws-border)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>Closing Time</label>
                    <input
                      type="text"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--ws-border)', background: 'var(--ws-surface)', color: 'var(--ws-text-primary)', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ background: 'var(--ws-surface-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--ws-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Automatic Peak-Hour Surcharge Buffer</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>Dynamically extend prep time by +8 mins during Friday/Sunday lunch rush</div>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#22C55E' }} />
                </div>
              </div>
            )}

            {activeTab === 'kyc' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                  FSSAI Food Safety Compliance & KYC
                </h3>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Award size={28} color="#4ADE80" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#4ADE80', fontSize: '0.92rem' }}>FSSAI Central License Verified</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)' }}>Certificate No: {fssai} • Valid through Dec 2028</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                  Bank Account & Daily Settlements
                </h3>
                <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>HDFC Current Account</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4ADE80', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>PRIMARY SETTLEMENT</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>Account Number: {bankAcc} • IFSC: {ifsc}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 600 }}>T+1 Automatic Payout Active • Zero settlement fees</div>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                  Kitchen Staff & Access Control
                </h3>
                {[
                  { name: 'Chef Kane', role: 'Head Chef / Kitchen Lead', permissions: 'Full Menu, Accept/Reject, KDS' },
                  { name: 'Priya Sundar', role: 'Line Cook & Expediter', permissions: 'KDS Prep & Ready Handover' },
                  { name: 'Vimal Raj', role: 'Billing & Packaging Staff', permissions: 'Orders Queue & Dispatch' }
                ].map((s, idx) => (
                  <div key={idx} style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>{s.role} • {s.permissions}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4ADE80' }}>ACTIVE</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                  Security & Access Audit
                </h3>
                <div style={{ background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Session Token: ACTIVE (TLS 1.3 Encryption)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>Logged in via Port 3001 Dispatch Portal</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
