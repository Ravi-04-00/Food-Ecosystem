import React, { useState } from 'react';
import { 
  Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, 
  ArrowLeft, ShieldCheck, MapPin, Store, Clock, AlertCircle, Check 
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';

export const CartPage = ({ onProceedCheckout, onContinueShopping, onOpenAddressModal }) => {
  const { 
    cart = [], 
    cartRestaurant,
    updateQuantity, 
    removeFromCart, 
    cartSubtotal = 0, 
    cartTotal = 0,
    cartCount = 0,
    clearCart,
    selectedAddress,
    cartDeliveryFee = 30,
    cartPackagingFee = 15,
    cartGrandTotal = 0
  } = useCustomer();

  const [couponCode, setCouponCode] = useState('FDFOODS50');
  const [appliedDiscount, setAppliedDiscount] = useState(50);
  const [couponStatus, setCouponStatus] = useState({ applied: true, text: 'Coupon FDFOODS50 applied! ₹50 deducted.' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const safeCart = Array.isArray(cart) ? cart : [];
  const subtotal = Number(cartSubtotal || cartTotal || 0);
  const deliveryFee = safeCart.length > 0 ? (cartDeliveryFee || 20) : 0;
  const packagingFee = safeCart.length > 0 ? (cartPackagingFee || 0) : 0;
  const effectiveGrandTotal = Math.max(0, subtotal + deliveryFee + packagingFee - (subtotal > 0 ? appliedDiscount : 0));
  const isRestaurantClosed = Boolean(cartRestaurant && (
    cartRestaurant.is_open === false || 
    cartRestaurant.status === 'CLOSED' || 
    cartRestaurant.is_currently_open === false
  ));

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'FDFOODS50' || code === 'FDFOODS40' || code === 'ROYAL50' || code === 'FRESH50') {
      setAppliedDiscount(50);
      setCouponStatus({ applied: true, text: `✓ Promo code ${code} applied (-₹50)` });
    } else if (code === 'WELCOME') {
      setAppliedDiscount(30);
      setCouponStatus({ applied: true, text: '✓ Promo code WELCOME applied (-₹30)' });
    } else {
      setCouponStatus({ applied: false, text: 'Invalid promo code. Try FDFOODS50' });
    }
  };

  const handleConfirmClear = async () => {
    await clearCart();
    setShowClearConfirm(false);
  };

  if (safeCart.length === 0) {
    return (
      <div style={{
        maxWidth: '520px',
        margin: '60px auto',
        textAlign: 'center',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '48px 24px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '20px',
          background: 'rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          color: '#22C55E'
        }}>
          <ShoppingBag size={36} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px 0' }}>
          Your Cart is Empty
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ws-text-secondary)', marginBottom: '24px' }}>
          Looks like you haven't added any dishes yet. Discover delicious kitchens and artisan dishes!
        </p>
        <button
          onClick={onContinueShopping}
          style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Explore Dishes Now</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const currentRestName = cartRestaurant?.name || safeCart[0]?.restaurant_name || 'Partner Kitchen';

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={onContinueShopping}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ws-text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '6px'
            }}
          >
            <ArrowLeft size={14} /> Back to food discovery
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
              Your Cart
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>
              ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </span>
          </div>
        </div>

        <div>
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#EF4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={13} />
              <span>Clear Cart</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={handleConfirmClear}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Header Pill */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '16px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Store size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>ORDERING FROM</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
              {currentRestName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ws-text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
          <Clock size={13} />
          <span>Prep & Delivery: 20-30 min</span>
        </div>
      </div>

      {/* Grid: Cart Items & Receipt Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>
        
        {/* Left Column: Items List */}
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--ws-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 4px 0' }}>
            Cart Dishes ({safeCart.length})
          </h3>

          {safeCart.map(item => {
            const itemName = item.food_name || item.name;
            const itemPrice = Number(item.unit_price ?? item.food_price ?? item.price ?? 0);
            const itemSubtotal = Number(item.subtotal ?? (itemPrice * item.quantity));
            const isVeg = item.is_veg !== false;
            const itemImg = item.food_image || item.image;

            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}
              >
                {/* Image */}
                {itemImg ? (
                  <img
                    src={itemImg}
                    alt={itemName}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '1px solid var(--ws-border)',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'var(--ws-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ws-text-muted)',
                    border: '1px solid var(--ws-border)',
                    flexShrink: 0
                  }}>
                    <ShoppingBag size={22} />
                  </div>
                )}

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: `1.5px solid ${isVeg ? '#10B981' : '#EF4444'}`,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isVeg ? '#10B981' : '#EF4444' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.95rem' }}>
                      {itemName}
                    </span>
                  </div>

                  {/* Portion / Variant */}
                  {(item.variant_details?.name || item.portion) && (
                    <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                      Portion: {item.variant_details?.name || item.portion}
                    </div>
                  )}

                  {/* Add-ons */}
                  {Array.isArray(item.selected_addons) && item.selected_addons.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                      Add-ons: {item.selected_addons.map(a => `${a.name} (+₹${a.price})`).join(', ')}
                    </div>
                  )}

                  {/* Special Instructions */}
                  {item.special_instructions && (
                    <div style={{ fontSize: '0.72rem', color: '#D97706', fontStyle: 'italic', marginTop: '3px' }}>
                      Note: "{item.special_instructions}"
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', marginTop: '6px' }}>
                    ₹{itemPrice.toFixed(0)} each
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--ws-border)',
                    borderRadius: '10px',
                    background: 'var(--ws-surface)'
                  }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1, true)}
                      style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: 'var(--ws-text-primary)' }}
                      title="Decrease"
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--ws-text-primary)', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1, true)}
                      style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: 'var(--ws-text-primary)' }}
                      title="Increase"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 900, color: 'var(--ws-text-primary)', fontSize: '0.98rem' }}>
                      ₹{itemSubtotal.toFixed(0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ws-text-muted)',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Delivery Address & Receipt Bill Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Delivery Address Card */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '18px 20px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#22C55E" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                  Delivery Address
                </h4>
              </div>
              <button
                type="button"
                onClick={onOpenAddressModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#15803D',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {selectedAddress ? 'Change' : '+ Add Address'}
              </button>
            </div>

            {selectedAddress ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--ws-text-primary)' }}>{selectedAddress.label || 'Home'}</strong>: {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}
                {selectedAddress.phone && <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>Phone: {selectedAddress.phone}</div>}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
                No delivery address selected. Please select a saved address before checkout.
              </div>
            )}
          </div>

          {/* Receipt Bill Breakdown */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Bill Summary
            </h3>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--ws-border)',
                borderRadius: '12px',
                padding: '8px 14px',
                background: 'var(--ws-surface-subtle)'
              }}>
                <Tag size={16} color="#22C55E" />
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: 'var(--ws-text-primary)',
                    width: '100%'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: 'var(--ws-surface)',
                  color: 'var(--ws-text-primary)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
            </form>

            {couponStatus && (
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: couponStatus.applied ? '#10B981' : '#EF4444'
              }}>
                {couponStatus.text}
              </div>
            )}

            {/* Pricing Lines */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderTop: '1px dashed var(--ws-border)',
              borderBottom: '1px dashed var(--ws-border)',
              padding: '16px 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-secondary)', fontSize: '0.9rem' }}>
                <span>Item Subtotal ({cartCount} items)</span>
                <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>₹{subtotal.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-secondary)', fontSize: '0.9rem' }}>
                <span>Delivery Partner Fee</span>
                <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>₹{deliveryFee.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ws-text-secondary)', fontSize: '0.9rem' }}>
                <span>Restaurant Packaging Charges</span>
                <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>₹{packagingFee.toFixed(0)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span>Coupon Discount</span>
                  <span>-₹{appliedDiscount.toFixed(0)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                Total to Pay
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#22C55E' }}>
                ₹{effectiveGrandTotal.toFixed(0)}
              </span>
            </div>

            {/* Restaurant Closed Warning */}
            {isRestaurantClosed && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1.5px solid #EAB308',
                borderRadius: '12px',
                padding: '12px 14px',
                color: '#CA8A04',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px'
              }}>
                <Clock size={18} style={{ flexShrink: 0 }} />
                <span>{cartRestaurant?.closure_reason || `${cartRestaurant?.name || 'Restaurant'} is currently closed and not accepting new orders.`}</span>
              </div>
            )}

            {/* Continue CTA */}
            <button
              onClick={() => onProceedCheckout(effectiveGrandTotal)}
              disabled={isRestaurantClosed}
              style={{
                background: isRestaurantClosed
                  ? 'var(--ws-surface-subtle)'
                  : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                color: isRestaurantClosed ? 'var(--ws-text-muted)' : '#FFFFFF',
                border: isRestaurantClosed ? '1px solid var(--ws-border)' : 'none',
                borderRadius: '14px',
                padding: '14px 20px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: isRestaurantClosed ? 'not-allowed' : 'pointer',
                boxShadow: isRestaurantClosed ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{isRestaurantClosed ? 'Restaurant Currently Closed' : 'Proceed to Checkout'}</span>
              {!isRestaurantClosed && <ArrowRight size={18} />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
