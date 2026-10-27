import React, { useState } from 'react';
import { 
  Star, Clock, Flame, ArrowLeft, Plus, Minus, 
  Check, X, Sparkles, Heart, Share2, ShieldCheck, 
  Info, AlertCircle, CheckCircle2, UtensilsCrossed, Tag
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { FoodImageLightbox } from './FoodImageLightbox.jsx';

const Interactive3DFoodViewer = React.lazy(() =>
  import('./Interactive3DFoodViewer.jsx').then(m => ({ default: m.Interactive3DFoodViewer }))
);

export const FoodDetailsModal = ({ food, onClose }) => {
  const { wishlist, toggleWishlist, addToCart } = useCustomer();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const hasVariants = Array.isArray(food?.variants) && food.variants.length > 0;
  const realVariants = hasVariants ? food.variants : [];
  const [selectedVariantId, setSelectedVariantId] = useState(() => (hasVariants ? food.variants[0].id : null));
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [viewMode, setViewMode] = useState('PHOTO'); // 'PHOTO' | '3D'
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedSpice, setSelectedSpice] = useState(food?.spice_level || 1);
  const [isAdding, setIsAdding] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [cartError, setCartError] = useState(null);

  if (!food) return null;

  const isWishlisted = wishlist?.some(item => item.id === food.id);
  const isRestaurantOpen = food.restaurant_is_open !== false && food.is_restaurant_open !== false;
  const isItemAvailable = food.is_available !== false && food.is_currently_available !== false;
  const isAvailable = isItemAvailable && isRestaurantOpen;

  const availableAddons = Array.isArray(food.addons) && food.addons.length > 0 ? food.addons : [];

  const selectedVariant = hasVariants
    ? (realVariants.find(v => v.id === selectedVariantId) || realVariants[0])
    : null;
  const portionPriceModifier = Number(selectedVariant?.price_modifier || 0);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const unitPrice = Number(food.price || 0) + portionPriceModifier + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon) => {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddToCart = async () => {
    if (!isAvailable || isAdding) return;
    setIsAdding(true);
    setCartError(null);
    try {
      let validVariantId = null;
      let variantPayload = null;

      if (hasVariants) {
        if (!selectedVariant || !selectedVariant.id) {
          setCartError('Please select a valid portion / variant before adding to cart.');
          setIsAdding(false);
          return;
        }
        validVariantId = selectedVariant.id;
        variantPayload = {
          id: selectedVariant.id,
          name: selectedVariant.name,
          price_modifier: Number(selectedVariant.price_modifier || 0)
        };
      }

      const validAddonIds = selectedAddons
        .filter(a => typeof a.id === 'number' && a.id > 0)
        .map(a => a.id);

      const options = {
        variant_id: validVariantId,
        variant: variantPayload,
        addon_ids: validAddonIds,
        selected_addons: selectedAddons,
        special_instructions: specialInstructions
      };
      const res = await addToCart(food, quantity, options);
      if (res && res.conflict) {
        onClose();
        return;
      }
      setSuccessToast(`✓ Added ${quantity}x ${food.name} to cart!`);
      setTimeout(() => {
        setSuccessToast('');
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setCartError(err.message || 'Restaurant is currently closed or food item is unavailable.');
    } finally {
      setIsAdding(false);
    }
  };

  const ingredientsList = Array.isArray(food.ingredients) && food.ingredients.length > 0
    ? food.ingredients
    : ['Artisan Produce', 'Fresh Herbs', 'Cold-pressed Spices', 'Virgin Oil'];

  const allergensList = Array.isArray(food.allergens) && food.allergens.length > 0
    ? food.allergens
    : ['Dairy', 'Gluten'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
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
        {/* Top Control Bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--ws-border)',
          background: 'var(--ws-surface-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Close
          </button>

          {/* Toggle between Photo & 3D Viewer if applicable */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '3px'
            }}>
              <button
                onClick={() => setViewMode('PHOTO')}
                style={{
                  background: viewMode === 'PHOTO' ? 'var(--ws-primary)' : 'transparent',
                  color: viewMode === 'PHOTO' ? '#FFFFFF' : 'var(--ws-text-muted)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Photo
              </button>
              <button
                onClick={() => setViewMode('3D')}
                style={{
                  background: viewMode === '3D' ? 'var(--ws-primary)' : 'transparent',
                  color: viewMode === '3D' ? '#FFFFFF' : 'var(--ws-text-muted)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} /> 3D View
              </button>
            </div>

            <button
              onClick={() => toggleWishlist && toggleWishlist(food)}
              style={{
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isWishlisted ? '#16A34A' : 'var(--ws-text-muted)'
              }}
            >
              <Heart size={16} fill={isWishlisted ? '#16A34A' : 'none'} />
            </button>
          </div>
        </div>

        {/* Media Banner Section */}
        <div style={{
          position: 'relative',
          height: '240px',
          width: '100%',
          backgroundColor: 'var(--ws-surface-subtle)',
          overflow: 'hidden'
        }}>
          {viewMode === '3D' ? (
            <div style={{ height: '100%', width: '100%' }}>
              <React.Suspense fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>
                  Loading 3D Dish View...
                </div>
              }>
                <Interactive3DFoodViewer
                  dishType={food.category === 'Burger' || food.name?.toLowerCase().includes('burger') ? 'burger' : 'pizza'}
                  hasCheese={true}
                  hasSauce={true}
                />
              </React.Suspense>
            </div>
          ) : (
            <img
              src={food.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'}
              alt={food.name}
              onClick={() => setPreviewOpen(true)}
              onError={(e) => {
                if (!e.currentTarget.dataset.fbk) {
                  e.currentTarget.dataset.fbk = '1';
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'zoom-in',
                filter: isAvailable ? 'none' : 'grayscale(45%)'
              }}
            />
          )}
          {previewOpen && (
            <FoodImageLightbox
              src={food.image}
              alt={food.name}
              onClose={() => setPreviewOpen(false)}
            />
          )}

          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />

          {/* Floating Availability Badge */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              background: isAvailable ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              {isAvailable ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{isAvailable ? 'AVAILABLE IN KITCHEN' : 'CURRENTLY UNAVAILABLE'}</span>
            </div>

            {food.category_name && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                backdropFilter: 'blur(6px)'
              }}>
                {food.category_name}
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Availability Alert if unavailable */}
          {!isAvailable && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#DC2626',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} />
              <div>
                <strong>Notice:</strong> This food item is currently unavailable at {food.restaurant_name || 'this kitchen'}. Please inspect other items on the menu.
              </div>
            </div>
          )}

          {/* Title, Restaurant & Price */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                  {food.restaurant_name || 'Artisan Kitchen Network'}
                </div>
                <h1 style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: 'var(--ws-text-primary)',
                  margin: 0,
                  lineHeight: 1.25
                }}>
                  {food.name}
                </h1>
              </div>

              {/* Price & Discount */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                  ₹{Number(food.price || 0).toFixed(0)}
                </div>
                {food.original_price && Number(food.original_price) > Number(food.price) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', textDecoration: 'line-through' }}>
                    ₹{Number(food.original_price).toFixed(0)}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Meta Row: Veg/Non-Veg, Rating, Prep Time, Spice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--ws-border)'
            }}>
              {/* Dietary indicator */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: food.is_veg ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: food.is_veg ? '#10B981' : '#EF4444',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: food.is_veg ? '#10B981' : '#EF4444'
                }} />
                <span>{food.is_veg ? '100% Vegetarian' : 'Non-Vegetarian'}</span>
              </div>

              {/* Rating */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#D97706',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                <span>{food.rating || 4.8} ({food.review_count || 120}+ reviews)</span>
              </div>

              {/* Prep Time */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--ws-surface-subtle)',
                color: 'var(--ws-text-secondary)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <Clock size={12} />
                <span>{food.prep_time_minutes || 20} mins prep</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Description
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {food.full_description || food.short_description || food.description || 'Artisan preparation using fresh ingredients and chef secret recipe.'}
            </p>
          </div>

          {/* Ingredients & Allergens Information */}
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            border: '1px solid var(--ws-border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.4px' }}>
                Key Ingredients
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ingredientsList.map((ing, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--ws-surface)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '8px',
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--ws-text-primary)'
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> Allergen Information
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allergensList.map((allergen, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '8px',
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#D97706'
                    }}
                  >
                    Contains {allergen}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portions / Variants and Addons Customization */}
          {(hasVariants || availableAddons.length > 0) && (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Real Portion Size & Variants */}
              {hasVariants && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                      Portion Size & Variants
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700, background: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      Choice Required
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(realVariants.length, 3)}, 1fr)`, gap: '10px' }}>
                    {realVariants.map(opt => {
                      const isSelected = selectedVariant?.id === opt.id;
                      const modifier = Number(opt.price_modifier || 0);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedVariantId(opt.id)}
                          style={{
                            background: isSelected ? 'rgba(34, 197, 94, 0.1)' : 'var(--ws-surface)',
                            border: isSelected ? '2px solid #22C55E' : '1px solid var(--ws-border)',
                            borderRadius: '12px',
                            padding: '10px 8px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(34, 197, 94, 0.15)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#16A34A' : 'var(--ws-text-primary)' }}>
                            {opt.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                            {modifier > 0 ? `+₹${modifier}` : 'Standard'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real Add-ons */}
              {availableAddons.length > 0 && (
                <div style={{ marginTop: hasVariants ? '8px' : '0' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '8px' }}>
                    Optional Add-ons
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableAddons.map(addon => {
                      const isSelected = !!selectedAddons.find(a => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--ws-primary)' : 'var(--ws-border)',
                            background: isSelected ? 'rgba(22, 163, 74, 0.05)' : 'var(--ws-surface-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ws-text-primary)' }}>
                            {addon.name}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16A34A' }}>
                            +₹{addon.price}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Special Instructions Stub */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', marginBottom: '6px' }}>
                Special Instructions
              </div>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Less spicy, no onions, extra dressing..."
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  color: 'var(--ws-text-primary)',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

          {/* Alert / Closed Warning Banner */}
          {cartError && (
            <div style={{
              margin: '8px 0',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid #EF4444',
              color: '#EF4444',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{cartError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setCartError(null)}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {!isRestaurantOpen && (
            <div style={{
              margin: '8px 0',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1.5px solid #EAB308',
              color: '#CA8A04',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span>{food.closure_reason || `${food.restaurant_name || 'Restaurant'} is currently closed and not accepting new orders.`}</span>
            </div>
          )}

          {/* Sticky Bottom Bar: Quantity & Phase 7 Inspection Action (STRICT: NO CART BUTTON) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            borderTop: '1px solid var(--ws-border)',
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            {/* Quantity Counter Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              background: 'var(--ws-surface-subtle)'
            }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', color: 'var(--ws-text-primary)' }}
              >
                <Minus size={15} />
              </button>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ws-text-primary)', minWidth: '24px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', color: 'var(--ws-text-primary)' }}
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Phase 9: Real Add to Cart with live subtotal calculation */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable || isAdding}
              style={{
                flex: 1,
                minHeight: '48px',
                background: !isAvailable 
                  ? 'var(--ws-surface-subtle)' 
                  : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: !isAvailable ? 'var(--ws-text-muted)' : '#FFFFFF',
                border: !isAvailable ? '1px solid var(--ws-border)' : 'none',
                borderRadius: '14px',
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: isAvailable && !isAdding ? 'pointer' : 'not-allowed',
                boxShadow: isAvailable ? '0 4px 14px rgba(22, 163, 74, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{successToast || (isAdding ? 'Adding to Cart...' : !isRestaurantOpen ? 'Restaurant Closed' : isAvailable ? 'Add to Cart' : 'Item Unavailable')}</span>
              <span>₹{totalPrice.toFixed(0)}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
