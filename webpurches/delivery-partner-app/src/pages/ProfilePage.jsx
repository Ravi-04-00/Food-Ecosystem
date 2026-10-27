import React, { useState, useRef } from 'react';
import { 
  UserCircle, 
  Star, 
  ShieldCheck, 
  Award, 
  Bike, 
  Calendar, 
  TrendingUp, 
  CheckCircle2,
  FileCheck2,
  QrCode,
  Edit3,
  Save,
  Camera,
  Trash2,
  AlertCircle,
  Loader,
  Lock,
  Check
} from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext.jsx';

export const ProfilePage = ({ onGoToSettings }) => {
  const { 
    currentUser, 
    deliveryProfileData, 
    isLoadingProfile, 
    updateProfile, 
    removePartnerPhoto, 
    earnings, 
    activeVehicle 
  } = useDelivery();

  const effectiveProfile = {
    full_name: deliveryProfileData?.full_name || currentUser?.full_name || currentUser?.name || 'Rider Partner',
    email: deliveryProfileData?.email || currentUser?.email || 'courier@wsfood.io',
    phone: deliveryProfileData?.phone || currentUser?.phone || '+91 99887 71122',
    address: deliveryProfileData?.address || currentUser?.address || 'Courier Hub 4, Guindy, Chennai',
    vehicle_type: deliveryProfileData?.vehicle_type || activeVehicle?.type || 'Electric Scooter',
    vehicle_number: deliveryProfileData?.vehicle_number || activeVehicle?.plate_number || 'KA-01-FD-7788',
    profile_photo: deliveryProfileData?.profile_photo || '',
    verification_status: deliveryProfileData?.verification_status || 'APPROVED'
  };

  // Phase 5 Edit Mode State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    vehicle_type: '',
    vehicle_number: ''
  });
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const fileInputRef = useRef(null);

  const stats = [
    { label: 'LIFETIME DELIVERIES', value: '1,840' },
    { label: 'CUSTOMER RATING', value: '4.88 ★' },
    { label: 'COMPLETION RATE', value: '99.2%' },
    { label: 'TOTAL EARNINGS', value: `₹${(earnings.monthly * 2.8).toLocaleString()}` }
  ];

  const handleStartEdit = () => {
    setProfileFormData({
      full_name: effectiveProfile.full_name,
      phone: effectiveProfile.phone,
      address: effectiveProfile.address,
      vehicle_type: effectiveProfile.vehicle_type,
      vehicle_number: effectiveProfile.vehicle_number
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
    if (removePartnerPhoto) {
      setIsSavingProfile(true);
      try {
        await removePartnerPhoto();
        setPhotoPreview('');
        setSuccessToast('Profile photo removed.');
        setTimeout(() => setSuccessToast(''), 3000);
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
    if (!profileFormData.address?.trim()) errs.address = 'Depot address is required.';
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
      if (profileFormData.vehicle_type) {
        fd.append('vehicle_type', profileFormData.vehicle_type.trim());
      }
      if (profileFormData.vehicle_number) {
        fd.append('vehicle_number', profileFormData.vehicle_number.trim());
      }
      if (selectedPhotoFile) {
        fd.append('profile_photo', selectedPhotoFile);
      }
      await updateProfile(fd);
      setIsEditingProfile(false);
      setSuccessToast('Partner profile updated successfully!');
      setTimeout(() => setSuccessToast(''), 3000);
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

  const initials = (effectiveProfile.full_name || 'DP')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      
      {/* Success Notification */}
      {successToast && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #10B981',
          color: '#065F46',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
        }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF2EC', border: '1px solid #FFD4C2', padding: '4px 10px', borderRadius: '999px', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF5A1F' }} />
            <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', monospace", fontWeight: 800, color: '#FF5A1F', letterSpacing: '0.5px' }}>
              COURIER CREDENTIALS • PHASE 5
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#191B1F',
            margin: 0
          }}>
            Partner Profile & Verified Identity
          </h1>
          <div style={{ fontSize: '0.84rem', color: '#7A808C', marginTop: '2px' }}>
            Manage your personal courier details, operational telemetry, and account credentials.
          </div>
        </div>

        {!isEditingProfile && (
          <button
            onClick={handleStartEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#FF5A1F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 90, 31, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Hero Partner ID Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #FFD4C2',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 4px 18px rgba(255, 90, 31, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: '#FF5A1F'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Avatar with Playful Geometric Border */}
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            backgroundColor: '#FF5A1F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.9rem',
            fontWeight: 900,
            color: '#FFFFFF',
            boxShadow: '0 6px 16px rgba(255, 90, 31, 0.3)',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {effectiveProfile.profile_photo ? (
              <img
                src={effectiveProfile.profile_photo}
                alt={effectiveProfile.full_name}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: effectiveProfile.verification_status === 'APPROVED' ? '#ECFDF5' : '#FEF3C7',
                color: effectiveProfile.verification_status === 'APPROVED' ? '#059669' : '#D97706',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                border: effectiveProfile.verification_status === 'APPROVED' ? '1px solid #A7F3D0' : '1px solid #FDE68A'
              }}>
                ✓ {effectiveProfile.verification_status}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#FF5A1F', fontWeight: 800, fontFamily: "'Space Grotesk', monospace" }}>
                TIER 1 MASTER COURIER
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#191B1F',
              margin: '8px 0 2px'
            }}>
              {effectiveProfile.full_name}
            </h2>

            <div style={{ fontSize: '0.82rem', color: '#525760', fontFamily: "'Space Grotesk', monospace" }}>
              Email: <strong style={{ color: '#191B1F' }}>{effectiveProfile.email}</strong> • Phone: <strong style={{ color: '#191B1F' }}>{effectiveProfile.phone}</strong>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#7A808C', marginTop: '2px' }}>
              Vehicle: <strong>{effectiveProfile.vehicle_type}</strong> ({effectiveProfile.vehicle_number || 'N/A'})
            </div>
          </div>
        </div>

        {/* Digital QR Badge */}
        <div style={{
          backgroundColor: '#FBF9F5',
          border: '1px solid #EDE8DE',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#191B1F',
            boxShadow: '0 2px 6px rgba(25, 27, 31, 0.05)'
          }}>
            <QrCode size={52} />
          </div>
          <span style={{ fontSize: '0.68rem', color: '#7A808C', fontWeight: 700, fontFamily: "'Space Grotesk', monospace" }}>
            MERCHANT PASS
          </span>
        </div>
      </div>

      {/* Edit Form or Read-Only Summary */}
      {isEditingProfile ? (
        <form
          onSubmit={handleSaveProfile}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #FF5A1F',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(255, 90, 31, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="#FF5A1F" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#191B1F' }}>
                Edit Partner Profile Information
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Fields marked with * are required
            </span>
          </div>

          {profileErrors.non_field && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{profileErrors.non_field}</span>
            </div>
          )}

          {/* Profile Photo Upload Row */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
              Partner Profile Photo (JPG, PNG, WEBP max 5MB)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                backgroundColor: '#F3F4F6',
                border: '2px dashed #D1D5DB',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserCircle size={40} color="#9CA3AF" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  <Camera size={14} />
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSavingProfile}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#DC2626'
                    }}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>
            {profileErrors.profile_photo && (
              <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '4px' }}>
                {profileErrors.profile_photo}
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={profileFormData.full_name}
                onChange={e => setProfileFormData(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Courier full legal name"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: profileErrors.full_name ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {profileErrors.full_name && (
                <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '4px' }}>
                  {profileErrors.full_name}
                </div>
              )}
            </div>

            {/* Email (Read-only / Immutable) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>
                <Lock size={12} />
                Email Address (Account Identifier • Read-Only)
              </label>
              <input
                type="text"
                value={effectiveProfile.email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  backgroundColor: '#F9FAFB',
                  color: '#6B7280',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '4px' }}>
                Primary login credential cannot be changed.
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                value={profileFormData.phone}
                onChange={e => setProfileFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: profileErrors.phone ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {profileErrors.phone && (
                <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '4px' }}>
                  {profileErrors.phone}
                </div>
              )}
            </div>

            {/* Vehicle Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                Vehicle Type
              </label>
              <input
                type="text"
                value={profileFormData.vehicle_type}
                onChange={e => setProfileFormData(p => ({ ...p, vehicle_type: e.target.value }))}
                placeholder="e.g. Electric Scooter, Motorcycle, Bicycle"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: profileErrors.vehicle_type ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {profileErrors.vehicle_type && (
                <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '4px' }}>
                  {profileErrors.vehicle_type}
                </div>
              )}
            </div>

            {/* Vehicle Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                Vehicle Plate Number
              </label>
              <input
                type="text"
                value={profileFormData.vehicle_number}
                onChange={e => setProfileFormData(p => ({ ...p, vehicle_number: e.target.value }))}
                placeholder="e.g. TN-09-AB-1234"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: profileErrors.vehicle_number ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {profileErrors.vehicle_number && (
                <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '4px' }}>
                  {profileErrors.vehicle_number}
                </div>
              )}
            </div>

            {/* Verification Status (Read-Only) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>
                <Lock size={12} />
                Verification Status (Read-Only)
              </label>
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: effectiveProfile.verification_status === 'APPROVED' ? '#059669' : '#D97706'
              }}>
                {effectiveProfile.verification_status} (System Verified)
              </div>
            </div>
          </div>

          {/* Operating Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              Courier Operating Hub / Residential Address *
            </label>
            <textarea
              rows={2}
              value={profileFormData.address}
              onChange={e => setProfileFormData(p => ({ ...p, address: e.target.value }))}
              placeholder="Full operational base or residential address"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: profileErrors.address ? '1.5px solid #EF4444' : '1px solid #D1D5DB',
                borderRadius: '10px',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            {profileErrors.address && (
              <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '4px' }}>
                {profileErrors.address}
              </div>
            )}
          </div>

          {/* Edit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSavingProfile}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSavingProfile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: '#FF5A1F',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                opacity: isSavingProfile ? 0.8 : 1,
                boxShadow: '0 4px 12px rgba(255, 90, 31, 0.25)'
              }}
            >
              {isSavingProfile ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Read-Only Profile Overview Card */
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EDE8DE',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 2px 6px rgba(25, 27, 31, 0.03)'
        }}>
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#191B1F',
            marginBottom: '16px',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Courier Contact & Operational Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                Full Name
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#191B1F', marginTop: '2px' }}>
                {effectiveProfile.full_name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                Email (Account Identifier)
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#191B1F', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {effectiveProfile.email}
                <Lock size={12} color="#9CA3AF" />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                Mobile Number
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#191B1F', marginTop: '2px' }}>
                {effectiveProfile.phone}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                Vehicle Details
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#191B1F', marginTop: '2px' }}>
                {effectiveProfile.vehicle_type} • {effectiveProfile.vehicle_number || 'No plate assigned'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 700, textTransform: 'uppercase' }}>
                Base Depot / Registered Address
              </div>
              <div style={{ fontSize: '0.92rem', color: '#374151', marginTop: '2px' }}>
                {effectiveProfile.address}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Lifetime Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {stats.map((s, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDE8DE',
              borderRadius: '20px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(25, 27, 31, 0.02)'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#7A808C', fontWeight: 800, letterSpacing: '0.5px' }}>
              {s.label}
            </span>
            <div style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '2rem',
              fontWeight: 900,
              color: '#191B1F'
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Achievements & Recognition */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDE8DE',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(25, 27, 31, 0.03)'
      }}>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.2rem',
          fontWeight: 800,
          color: '#191B1F',
          margin: 0
        }}>
          Career Badges & Honor Roll
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
          {[
            { title: 'Monsoon Hero', desc: 'Completed 50+ wet-weather deliveries with 100% safety record' },
            { title: 'Five-Star Century', desc: 'Over 100 consecutive 5-star customer reviews received' },
            { title: 'Zero Cancellation Master', desc: 'Zero courier cancellations over past 90 days' }
          ].map((b, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#FBF9F5',
                border: '1px solid #EDE8DE',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#FFF2EC',
                color: '#FF5A1F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#191B1F' }}>
                  {b.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#7A808C' }}>
                  {b.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
