import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, AlertCircle, ChefHat, Trash2, Camera, Loader } from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';

export const FoodCreationModal = ({ isOpen, onClose, initialFood = null, onSaved }) => {
  const { addFoodItem, editFoodItem, menuCategories, loadCategories, addCategory, loadFoods } = useShop();

  const isEditMode = Boolean(initialFood && initialFood.id);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [dietaryType, setDietaryType] = useState('VEG'); // VEG, NON_VEG, OTHER
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const fileInputRef = useRef(null);

  // Inline category creation (uses the existing authorized POST
  // /menu/categories/ scoped to the owner's restaurant).
  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (trimmed.length < 2) {
      setErrors(prev => ({ ...prev, category: 'Category name needs at least 2 characters.' }));
      return;
    }
    setIsCreatingCategory(true);
    try {
      const created = await addCategory({ name: trimmed });
      if (created?.id) setCategory(String(created.id));
      setNewCategoryName('');
      setShowNewCategory(false);
      setErrors(prev => {
        const next = { ...prev };
        delete next.category;
        return next;
      });
    } catch (err) {
      setErrors(prev => ({ ...prev, category: err?.message || 'Failed to create category.' }));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Populate or reset form whenever modal opens or initialFood changes
  useEffect(() => {
    if (isOpen) {
      if (initialFood) {
        setName(initialFood.name || '');
        setCategory(initialFood.category || initialFood.menu_category || initialFood.category_id || (menuCategories[0]?.id || ''));
        setPrice(initialFood.price ? String(initialFood.price) : '');
        setDescription(initialFood.description || initialFood.full_description || initialFood.short_description || '');
        setDietaryType(initialFood.dietary_type || (initialFood.is_veg === false ? 'NON_VEG' : 'VEG'));
        setDisplayOrder(String(initialFood.display_order ?? 0));
        setIsAvailable(initialFood.is_available !== false);
        setImagePreview(initialFood.image || '');
        setImageFile(null);
        setRemoveExistingImage(false);
      } else {
        setName('');
        setCategory(menuCategories.length > 0 ? String(menuCategories[0].id) : '');
        setPrice('');
        setDescription('');
        setDietaryType('VEG');
        setDisplayOrder('0');
        setIsAvailable(true);
        setImagePreview('');
        setImageFile(null);
        setRemoveExistingImage(false);
      }
      setErrors({});
    }
  }, [isOpen, initialFood, menuCategories]);

  // Ensure categories are loaded
  useEffect(() => {
    if (isOpen && menuCategories.length === 0 && loadCategories) {
      loadCategories();
    }
  }, [isOpen, menuCategories.length, loadCategories]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file (PNG, JPG, WEBP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size cannot exceed 5MB.' }));
      return;
    }

    setErrors(prev => ({ ...prev, image: null }));
    setImageFile(file);
    setRemoveExistingImage(false);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Food name cannot be empty.';
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Price must be greater than zero.';
    }
    if (!category) {
      // Backend requires a category on create (400 "Menu category is
      // required." otherwise). When the menu has no categories yet, point
      // to the inline creator instead of submitting a doomed request.
      newErrors.category = menuCategories.length === 0
        ? 'Create a menu category first using "+ New Category" above, then select it.'
        : 'Please select a valid menu category.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('price', parseFloat(price).toFixed(2));
      if (category) fd.append('category', category);
      fd.append('description', description.trim());
      fd.append('dietary_type', dietaryType);
      fd.append('is_veg', dietaryType === 'VEG');
      fd.append('display_order', parseInt(displayOrder) || 0);
      fd.append('is_available', isAvailable);

      if (imageFile) {
        fd.append('food_image', imageFile);
      } else if (removeExistingImage) {
        fd.append('remove_image', 'true');
      }

      if (isEditMode) {
        await editFoodItem(initialFood.id, fd);
      } else {
        await addFoodItem(fd);
      }

      // Reconcile with server state (image URL, ordering, normalized fields).
      try {
        if (loadFoods) await loadFoods();
      } catch {
        // Optimistic context state already updated; ignore refresh failure.
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Save food item error:', err);
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ non_field: err.message || 'Failed to save food item. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: 'var(--ws-shadow-lg)',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ws-border)',
          background: 'var(--ws-surface-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              FOOD MANAGEMENT • PHASE 8
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
              {isEditMode ? 'Edit Food Item' : 'Add New Food Item'}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              color: 'var(--ws-text-secondary)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Error Banner */}
        {errors.non_field && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#EF4444',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errors.non_field}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Dish Name */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
              Dish Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Chicken Dum Biryani, Smash Truffle Burger"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: errors.name ? '#EF4444' : 'var(--ws-border)',
                background: 'var(--ws-surface-subtle)',
                color: 'var(--ws-text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {errors.name && (
              <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
              </span>
            )}
          </div>

          {/* Category & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span>Menu Category *</span>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(v => !v)}
                  style={{ background: 'none', border: 'none', color: 'var(--ws-primary)', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {showNewCategory ? 'Cancel' : '+ New Category'}
                </button>
              </label>
              {showNewCategory && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Biryani"
                    maxLength={120}
                    style={{
                      flex: 1,
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--ws-primary)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: isCreatingCategory ? 'wait' : 'pointer'
                    }}
                  >
                    {isCreatingCategory ? 'Adding…' : 'Add'}
                  </button>
                </div>
              )}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: errors.category ? '#EF4444' : 'var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                {menuCategories.length === 0 ? (
                  <option value="">No categories defined yet</option>
                ) : (
                  menuCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {!cat.is_active ? '(Disabled)' : ''}
                    </option>
                  ))
                )}
              </select>
              {errors.category && (
                <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                  {Array.isArray(errors.category) ? errors.category[0] : errors.category}
                </span>
              )}
              {menuCategories.length === 0 && !showNewCategory && (
                <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '4px', display: 'block' }}>
                  Your menu has no categories yet. Tap “+ New Category” to create one for your restaurant.
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="249.00"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: errors.price ? '#EF4444' : 'var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {errors.price && (
                <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                  {Array.isArray(errors.price) ? errors.price[0] : errors.price}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh farm ingredients, authentic spice blend, and served with house dips..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--ws-border)',
                background: 'var(--ws-surface-subtle)',
                color: 'var(--ws-text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Dietary Type & Display Order */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Dietary Type
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['VEG', 'NON_VEG', 'OTHER'].map(type => {
                  const isSelected = dietaryType === type;
                  const label = type === 'VEG' ? '● Veg' : type === 'NON_VEG' ? '▲ Non-Veg' : 'Other';
                  const activeBg = type === 'VEG' ? 'rgba(16, 185, 129, 0.15)' : type === 'NON_VEG' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)';
                  const activeColor = type === 'VEG' ? '#10B981' : type === 'NON_VEG' ? '#EF4444' : '#A855F7';
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDietaryType(type)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: isSelected ? activeColor : 'var(--ws-border)',
                        background: isSelected ? activeBg : 'var(--ws-surface-subtle)',
                        color: isSelected ? activeColor : 'var(--ws-text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Food Image Upload / Replace / Remove */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
              Dish Image
            </label>
            
            {imagePreview ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid var(--ws-border)',
                background: 'var(--ws-surface-subtle)'
              }}>
                <img
                  src={imagePreview}
                  alt="Dish preview"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '10px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                    {imageFile ? imageFile.name : 'Current Food Image'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Uploaded'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'var(--ws-surface)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--ws-text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#EF4444',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--ws-border)',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--ws-surface-subtle)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <Camera size={26} color="#10B981" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                  Click to upload dish photo
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                  Supports PNG, JPG, or WEBP up to 5MB
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {errors.image && (
              <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                {errors.image}
              </span>
            )}
          </div>

          {/* Availability Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--ws-surface-subtle)',
            borderRadius: '14px',
            border: '1px solid var(--ws-border)'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                Item Availability
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                {isAvailable ? 'Customers can order this dish online' : 'Marked as out of stock / offline'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              style={{
                background: isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isAvailable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: isAvailable ? '#10B981' : '#EF4444',
                borderRadius: '10px',
                padding: '6px 14px',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {isAvailable ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>

          {/* Submit CTA */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '12px',
            position: 'sticky',
            bottom: '-24px',
            background: 'var(--ws-surface)',
            paddingBottom: '4px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid var(--ws-border)',
                background: 'var(--ws-surface)',
                color: 'var(--ws-text-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting && <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              <span>{isEditMode ? 'Save Changes' : '+ Publish to Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
