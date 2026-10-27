import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, Loader } from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';

export const CategoryModal = ({ isOpen, onClose, initialCategory = null, onSaved }) => {
  const { addCategory, editCategory } = useShop();

  const isEditMode = Boolean(initialCategory && initialCategory.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exampleCategories = [
    'Starters',
    'Main Course',
    'Biryani',
    'Rice',
    'Breads',
    'Desserts',
    'Drinks'
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name || '');
        setDescription(initialCategory.description || '');
        setDisplayOrder(String(initialCategory.display_order ?? 0));
        setIsActive(initialCategory.is_active !== false);
      } else {
        setName('');
        setDescription('');
        setDisplayOrder('0');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Category name cannot be empty.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        display_order: parseInt(displayOrder) || 0,
        is_active: isActive
      };

      if (isEditMode) {
        await editCategory(initialCategory.id, payload);
      } else {
        await addCategory(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Save category error:', err);
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ non_field: err.message || 'Failed to save category.' });
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
        maxWidth: '520px',
        overflowY: 'auto',
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
              MENU CATEGORIES • PHASE 8
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
              {isEditMode ? 'Edit Category' : 'Create Menu Category'}
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

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Quick Examples Pills (when creating) */}
          {!isEditMode && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '8px' }}>
                Quick Example Categories (Click to select):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {exampleCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setName(cat)}
                    style={{
                      background: name === cat ? 'rgba(16, 185, 129, 0.2)' : 'var(--ws-surface-subtle)',
                      border: '1px solid',
                      borderColor: name === cat ? '#10B981' : 'var(--ws-border)',
                      color: name === cat ? '#10B981' : 'var(--ws-text-primary)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starters, Main Course, Biryani"
              required
              style={{
                width: '100%',
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

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this section in your menu..."
              style={{
                width: '100%',
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

          {/* Display Order & Active Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: isActive ? '#10B981' : '#EF4444',
                  background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: isActive ? '#10B981' : '#EF4444',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {isActive ? 'ENABLED (ACTIVE)' : 'DISABLED (HIDDEN)'}
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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
              <span>{isEditMode ? 'Save Changes' : '+ Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
