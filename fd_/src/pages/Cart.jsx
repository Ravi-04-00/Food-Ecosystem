import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  Check, 
  ShieldCheck, 
  Clock, 
  FileText,
  Percent,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';

export const Cart = ({ onProceedToCheckout, onContinueShopping }) => {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal, 
    delivery, 
    taxes, 
    platformFee, 
    discount, 
    grandTotal, 
    appliedCoupon, 
    applyCouponCode, 
    removeCoupon,
    cookingInstructions,
    setCookingInstructions
  } = useCart();

  const { coupons } = useFoodEcosystem();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState(null);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center text-4xl mx-auto">
          🍽️
        </div>
        <h2 className="text-2xl font-black text-[#171717]">Your Cart is Empty</h2>
        <p className="text-xs text-[#6F7378] max-w-sm mx-auto">
          Explore top artisan biryanis, pizzas, and desserts to add delicious food to your order.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-3 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-extrabold text-xs shadow-lg shadow-[#FF6B35]/25"
        >
          Explore Food Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#171717]">
          Your Food Cart
        </h1>
        <p className="text-xs text-[#6F7378]">
          Review items, add special cooking requests, and apply promo codes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Food Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
              <span className="font-extrabold text-sm text-[#171717]">
                Ordered Dishes ({items.length})
              </span>
              <button
                onClick={clearCart}
                className="text-xs text-[#FF3B30] hover:underline font-bold"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-[#F2ECE1] space-y-4">
              {items.map((item) => {
                const addOnTotal = (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0);
                const itemPrice = item.product.price + addOnTotal;

                return (
                  <div key={item.cartItemId} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                    {/* Food Image & Details */}
                    <div className="flex items-start space-x-3.5">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-16 h-16 rounded-2xl object-cover bg-[#F4F1EA] flex-shrink-0"
                      />
                      <div>
                        {/* Veg / Non-veg dot */}
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-3.5 h-3.5 rounded-[3px] border-2 flex items-center justify-center ${
                            item.product.isVeg ? 'border-[#20B26B]' : 'border-[#FF3B30]'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              item.product.isVeg ? 'bg-[#20B26B]' : 'bg-[#FF3B30]'
                            }`} />
                          </div>
                          <span className="text-[10px] font-bold text-[#6F7378]">
                            {item.product.restaurantName}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-[#171717] leading-snug">
                          {item.product.name}
                        </h4>

                        {/* Selected Add-ons */}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <div className="text-[11px] text-[#FF6B35] font-semibold mt-1 space-y-0.5">
                            {item.selectedAddOns.map((a) => (
                              <div key={a.id}>+ {a.name} (₹{a.price})</div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs font-black text-[#171717] mt-1.5">
                          ₹{itemPrice} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2 bg-[#FFF8EE] p-1 rounded-xl border border-[#EFE8DE]">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white text-[#171717] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-[#171717] w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white text-[#171717] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-black text-[#FF6B35]">
                        ₹{itemPrice * item.quantity}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-[11px] text-[#9B9DA2] hover:text-[#FF3B30] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cooking Instructions Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-sm">
            <label className="block text-xs font-extrabold text-[#171717] mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#FF6B35]" />
              Special Cooking Instructions
            </label>
            <input 
              type="text"
              value={cookingInstructions}
              onChange={(e) => setCookingInstructions(e.target.value)}
              placeholder="e.g. Extra mint chutney, keep cutlery, make it mild spicy..."
              className="w-full text-xs p-3 rounded-2xl bg-[#FFF8EE] border border-[#EFE8DE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Right Column: Bill Details, Coupons & Checkout */}
        <div className="lg:col-span-5 space-y-4">
          {/* Coupon Code Input & Available Coupons */}
          <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-sm space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#6F7378] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#FF6B35]" />
              Apply Restaurant Coupon
            </h4>

            {appliedCoupon ? (
              <div className="p-3 rounded-2xl bg-[#EBF8F1] border border-[#20B26B]/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-[#20B26B]" />
                  <div>
                    <span className="font-mono text-xs font-black text-[#20B26B]">{appliedCoupon.code}</span>
                    <p className="text-[11px] text-[#6F7378]">{appliedCoupon.description}</p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-[#FF3B30] font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon (e.g. WELCOME50)"
                    className="flex-1 text-xs font-mono font-bold uppercase p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] focus:outline-none focus:border-[#FF6B35]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#171717] hover:bg-[#FF6B35] text-white font-extrabold text-xs transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-[#FF3B30] font-semibold">{couponError}</p>
                )}
              </form>
            )}

            {/* Quick Coupon Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {coupons.slice(0, 3).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => applyCouponCode(c.code)}
                  className="text-[10px] font-mono font-bold bg-[#FFF2EB] text-[#FF6B35] px-2 py-1 rounded-lg border border-[#FF6B35]/20 hover:bg-[#FF6B35] hover:text-white transition-all"
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Grand Total Breakdown Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
            <h4 className="font-black text-sm text-[#171717] pb-3 border-b border-[#F2ECE1]">
              Bill Summary
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#4A4D52]">
                <span>Item Total</span>
                <span className="font-bold text-[#171717]">₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-[#20B26B] font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between text-[#4A4D52]">
                <span>Delivery Fee (Express 20-min)</span>
                {delivery === 0 ? (
                  <span className="font-bold text-[#20B26B]">FREE</span>
                ) : (
                  <span className="font-bold text-[#171717]">₹{delivery}</span>
                )}
              </div>

              <div className="flex justify-between text-[#4A4D52]">
                <span>Restaurant GST & Taxes (5%)</span>
                <span className="font-bold text-[#171717]">₹{taxes}</span>
              </div>

              <div className="flex justify-between text-[#4A4D52]">
                <span>Platform Delivery Fee</span>
                <span className="font-bold text-[#171717]">₹{platformFee}</span>
              </div>

              <div className="pt-3 border-t border-[#F2ECE1] flex justify-between items-baseline text-sm font-extrabold text-[#171717]">
                <span>To Pay</span>
                <span className="text-xl text-[#FF6B35]">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-sm shadow-xl shadow-[#FF6B35]/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
            >
              <span>PROCEED TO CHECKOUT (₹{grandTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
