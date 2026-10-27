import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS, INITIAL_COUPONS } from '../services/mockData.js';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Pre-populate with 1 fresh dish so cart is immediately demonstrable
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('fd_foods_cart') || localStorage.getItem('ws_food_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1,
        selectedAddOns: [
          { id: 'addon-extra-raita', name: 'Cooling Burani Garlic Raita', price: 30 }
        ],
        cartItemId: 'item-demo-1',
      }
    ];
  });

  const [wishlist, setWishlist] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [cookingInstructions, setCookingInstructions] = useState('');

  useEffect(() => {
    localStorage.setItem('fd_foods_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1, selectedAddOns = []) => {
    const cartItemId = `${product.id}-${selectedAddOns.map((a) => a.id).sort().join('-')}`;

    setItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedAddOns, cartItemId }];
    });
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((p) => p.id === productId);
  };

  const applyCouponCode = (code) => {
    const found = INITIAL_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) {
      return { success: false, message: 'Invalid coupon code. Try WELCOME50 or WSFEAST.' };
    }
    if (subtotal < found.minOrder) {
      return { success: false, message: `Minimum order value of ₹${found.minOrder} required for ${found.code}.` };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Financial Calculations
  const subtotal = items.reduce((sum, item) => {
    const addOnTotal = (item.selectedAddOns || []).reduce((aSum, a) => aSum + a.price, 0);
    return sum + (item.product.price + addOnTotal) * item.quantity;
  }, 0);

  // Delivery Fee Calculation (₹35 base, free above ₹399 or with FREEDEL coupon)
  let delivery = subtotal > 0 ? (subtotal >= 399 ? 0 : 35) : 0;
  if (appliedCoupon?.code === 'FREEDEL') {
    delivery = 0;
  }

  // Discount Calculation
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      discount = appliedCoupon.discountValue;
    } else if (appliedCoupon.discountType === 'percentage') {
      discount = Math.min(
        Math.round((subtotal * appliedCoupon.discountValue) / 100),
        appliedCoupon.maxDiscount || 150
      );
    }
  }

  const taxes = subtotal > 0 ? Math.round(subtotal * 0.05) : 0; // 5% GST
  const platformFee = subtotal > 0 ? 5 : 0;
  const grandTotal = Math.max(0, subtotal + delivery + taxes + platformFee - discount);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        delivery,
        taxes,
        platformFee,
        discount,
        grandTotal,
        total: grandTotal,
        count,
        wishlist,
        toggleWishlist,
        isInWishlist,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        cookingInstructions,
        setCookingInstructions,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
