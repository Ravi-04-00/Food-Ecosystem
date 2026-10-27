import React, { useState } from 'react';
import { 
  MapPin, Plus, Trash2, Edit2, Check, X, 
  Home, Briefcase, Navigation, Star, Phone, AlertCircle, Loader 
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { LocationPicker } from './LocationPicker.jsx';

export const AddressManagerModal = ({ isOpen, onClose, onSelectAddress }) => {
  const { 
    addresses = [], 
    selectedAddress, 
    setSelectedAddress, 
    addAddress, 
    editAddress, 
    removeAddress, 
    chooseDefaultAddress,
    isLoadingAddresses
  } = useCustomer();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [saveHovered, setSaveHovered] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);

  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: '',
    street: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    phone: '',
    is_default: false,
    latitude: null,
    longitude: null
  });
  const [showLocator, setShowLocator] = useState(false);
  const [locatorNote, setLocatorNote] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setFormData({
      label: 'Home',
      full_name: '',
      street: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      phone: '',
      is_default: addresses.length === 0,
      latitude: null,
      longitude: null
    });
    setEditingAddressId(null);
    setErrorMsg('');
    setLocatorNote('');
    setShowLocator(false);
    setIsAddingNew(true);
  };

  const handleStartEdit = (addr) => {
    setFormData({
      label: addr.label || 'Home',
      full_name: addr.full_name || '',
      street: addr.street || '',
      city: addr.city || 'Chennai',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '',
      phone: addr.phone || '',
      is_default: !!addr.is_default,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null
    });
    setEditingAddressId(addr.id);
    setErrorMsg('');
    setLocatorNote('');
    setShowLocator(false);
    setIsAddingNew(true);
  };

  // Map-picked location fills the form only — nothing is saved until
  // the user presses Save Changes / Add Delivery Address below.
  const handleConfirmLocation = (loc) => {
    setFormData(p => {
      const bits = [];
      if (loc.street) bits.push(loc.street);
      if (loc.area && !(loc.street || '').includes(loc.area)) bits.push(loc.area);
      const street = bits.join(', ').slice(0, 255) || p.street;
      return {
        ...p,
        street,
        city: loc.city || p.city,
        state: loc.state || p.state,
        pincode: loc.pincode || p.pincode,
        latitude: Number.isFinite(loc.latitude) ? loc.latitude : p.latitude,
        longitude: Number.isFinite(loc.longitude) ? loc.longitude : p.longitude
      };
    });
    setLocatorNote(
      loc.latitude != null
        ? `Location pinned (${loc.latitude}, ${loc.longitude}). Review the fields, then press Save.`
        : 'Location noted. Review the fields, then press Save.'
    );
    setShowLocator(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.street.trim() || !formData.phone.trim()) {
      setErrorMsg('Please complete all required fields (Name, Street, and Phone).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      // Omit unset coordinates so backend defaults apply; send them only
      // when the map produced valid numbers.
      const payload = { ...formData };
      if (payload.latitude == null || !Number.isFinite(Number(payload.latitude))) delete payload.latitude;
      if (payload.longitude == null || !Number.isFinite(Number(payload.longitude))) delete payload.longitude;
      if (editingAddressId) {
        await editAddress(editingAddressId, payload);
      } else {
        await addAddress(payload);
      }
      setIsAddingNew(false);
      setEditingAddressId(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save address. Please check input details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (addr) => {
    if (!window.confirm(`Delete "${addr.label || 'this address'}"? This cannot be undone.`)) return;
    setDeletingId(addr.id);
    setErrorMsg('');
    try {
      await removeAddress(addr.id);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to delete address. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (addr) => {
    if (setSelectedAddress) setSelectedAddress(addr);
    if (onSelectAddress) onSelectAddress(addr);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: 'var(--ws-shadow-lg)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ws-surface-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#22C55E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--ws-text-primary)' }}>
                Saved Delivery Addresses
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Manage home, office, and preferred delivery dispatch locations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
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

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {errorMsg && (
            <div style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isAddingNew ? (
            /* Address List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-muted)' }}>
                  {addresses.length} SAVED ADDRESS{addresses.length === 1 ? '' : 'ES'}
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#15803D',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  borderRadius: '16px',
                  background: 'var(--ws-surface-subtle)',
                  border: '1.5px dashed var(--ws-border)'
                }}>
                  <MapPin size={32} color="var(--ws-text-muted)" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: '0 0 6px', color: 'var(--ws-text-primary)', fontWeight: 800 }}>No addresses saved yet</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                    Add your home or office address for fast, 1-tap checkout.
                  </p>
                  <button
                    onClick={handleStartAdd}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'var(--ws-primary)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Your First Address
                  </button>
                </div>
              ) : (
                addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  const isDefault = !!addr.is_default;
                  const LabelIcon = addr.label?.toLowerCase() === 'work' ? Briefcase : addr.label?.toLowerCase() === 'home' ? Home : Navigation;

                  return (
                    <div
                      key={addr.id}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1.5px solid',
                        borderColor: isSelected ? 'var(--ws-primary)' : 'var(--ws-border)',
                        background: isSelected ? 'rgba(34, 197, 94, 0.05)' : 'var(--ws-surface-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: 'var(--ws-surface)',
                            border: '1px solid var(--ws-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ws-text-primary)'
                          }}>
                            <LabelIcon size={14} />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>
                            {addr.label || 'Delivery Location'}
                          </span>
                          {isDefault && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #86EFAC'
                            }}>
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(addr)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ws-text-muted)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Edit Address"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(addr)}
                            disabled={deletingId === addr.id}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: deletingId === addr.id ? '#FCA5A5' : '#EF4444',
                              cursor: deletingId === addr.id ? 'wait' : 'pointer',
                              padding: '4px',
                              opacity: deletingId === addr.id ? 0.6 : 1
                            }}
                            title="Delete Address"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-primary)', lineHeight: 1.4 }}>
                        <strong>{addr.full_name}</strong> • {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} />
                        <span>{addr.phone}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--ws-border)', marginTop: '4px' }}>
                        {!isDefault ? (
                          <button
                            type="button"
                            onClick={() => chooseDefaultAddress(addr.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ws-text-muted)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            Set as Default
                          </button>
                        ) : <span />}

                        <button
                          type="button"
                          onClick={() => handleSelect(addr)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: isSelected ? '#15803D' : 'var(--ws-primary)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isSelected ? <Check size={14} /> : null}
                          <span>{isSelected ? 'Delivering Here' : 'Deliver Here'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ws-text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* Tag selector */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                  ADDRESS LABEL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, label: lbl }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: formData.label === lbl ? 'var(--ws-primary)' : 'var(--ws-border)',
                        background: formData.label === lbl ? 'rgba(34, 197, 94, 0.1)' : 'var(--ws-surface-subtle)',
                        color: formData.label === lbl ? '#15803D' : 'var(--ws-text-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLocator(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    background: 'rgba(34, 197, 94, 0.08)',
                    color: '#15803D',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <MapPin size={15} />
                  <span>{showLocator ? 'Hide Map — Type Manually' : 'Pick Location on Map (Optional)'}</span>
                </button>
                {locatorNote && (
                  <div style={{ fontSize: '0.76rem', color: '#15803D', marginTop: '6px' }}>{locatorNote}</div>
                )}
              </div>

              {showLocator && (
                <LocationPicker
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                  onConfirm={handleConfirmLocation}
                  onCancel={() => setShowLocator(false)}
                />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                    Receiver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="e.g., Priya Ramanathan"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g., 9876543210"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                    Flat / Building / Street Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.street}
                    onChange={(e) => setFormData(p => ({ ...p, street: e.target.value }))}
                    placeholder="Flat 402, Neon Tower, 3rd Cross, Indiranagar"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData(p => ({ ...p, pincode: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(p => ({ ...p, is_default: e.target.checked }))}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ws-text-primary)' }}>
                  Set as default delivery address
                </span>
              </label>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '12px',
                position: 'sticky',
                bottom: '-24px',
                background: 'var(--ws-surface)',
                padding: '12px 0 4px',
                borderTop: '1px solid var(--ws-border)',
                zIndex: 5
              }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid var(--ws-border)',
                    background: 'var(--ws-surface)',
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
                  disabled={isSubmitting}
                  onMouseEnter={() => setSaveHovered(true)}
                  onMouseLeave={() => setSaveHovered(false)}
                  onFocus={() => setSaveFocused(true)}
                  onBlur={() => setSaveFocused(false)}
                  style={{
                    flex: 2,
                    padding: '10px',
                    minHeight: '48px',
                    borderRadius: '12px',
                    border: '2px solid #047857',
                    background: isSubmitting ? '#6EE7B7' : (saveHovered ? '#047857' : '#059669'),
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    outline: saveFocused ? '3px solid rgba(5, 150, 105, 0.45)' : 'none',
                    outlineOffset: '2px',
                    opacity: isSubmitting ? 0.85 : 1
                  }}
                >
                  {isSubmitting ? 'Saving Address...' : editingAddressId ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
