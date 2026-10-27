import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Clock, 
  Flame, 
  Check, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  Info,
  Plus,
  Minus
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';

export const FoodDetailsModal = ({ onBuyNow = null }) => {
  const { selectedDishForModal, setSelectedDishForModal } = useFoodEcosystem();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [userInstructions, setUserInstructions] = useState('');

  if (!selectedDishForModal) return null;
  const dish = selectedDishForModal;

  const handleToggleAddOn = (addon) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const addOnCost = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const currentTotal = (dish.price + addOnCost) * quantity;

  const handleAddToCart = () => {
    addToCart(dish, quantity, selectedAddOns);
    setSelectedDishForModal(null);
  };

  const handleDirectBuy = () => {
    addToCart(dish, quantity, selectedAddOns);
    setSelectedDishForModal(null);
    if (onBuyNow) {
      onBuyNow();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EFE8DE] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedDishForModal(null)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md text-[#171717] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image & Tags */}
        <div className="relative aspect-[16/9] w-full bg-[#F4F1EA]">
          <img 
            src={dish.image} 
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Bottom Overlay Title & Badges */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                {/* Veg/Non-Veg icon */}
                <div className="bg-white p-1 rounded-[4px] shadow-sm">
                  <div className={`w-3 h-3 rounded-[2px] border-2 flex items-center justify-center ${
                    dish.isVeg ? 'border-[#20B26B]' : 'border-[#FF3B30]'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      dish.isVeg ? 'bg-[#20B26B]' : 'bg-[#FF3B30]'
                    }`} />
                  </div>
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-white/90">
                  {dish.restaurantName}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                {dish.name}
              </h2>
            </div>

            <div className="bg-white/95 text-[#171717] px-3 py-1 rounded-xl font-black text-sm flex items-center space-x-1 shadow-lg">
              <Star className="w-4 h-4 fill-[#FFC857] text-[#FFC857]" />
              <span>{dish.rating || 4.8}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="bg-[#FFF2EB] text-[#FF6B35] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Prep: {dish.prepTime || 20} mins
            </span>
            <span className="bg-[#EBF8F1] text-[#20B26B] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Express Delivery: {dish.deliveryEstimate || '25-30 min'}
            </span>
            {dish.spiceLevel > 0 && (
              <span className="bg-[#FFF0EFEB] text-[#FF3B30] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-current" />
                Spice: {'🌶️'.repeat(dish.spiceLevel)}
              </span>
            )}
            <span className="bg-[#F4F1EA] text-[#6F7378] px-3 py-1.5 rounded-xl font-bold">
              {dish.isVeg ? '100% Pure Vegetarian' : 'Non-Vegetarian'}
            </span>
          </div>

          {/* Detailed Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F7378] mb-1.5">Description</h4>
            <p className="text-sm text-[#4A4D52] leading-relaxed">
              {dish.fullDescription || dish.shortDescription}
            </p>
          </div>

          {/* Ingredients & Allergens */}
          {dish.ingredients && (
            <div className="bg-[#FFF8EE] rounded-2xl p-4 border border-[#F2ECE1]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Fresh Ingredients & Allergens
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {dish.ingredients.map((ing, i) => (
                  <span key={i} className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-lg border border-[#EFE8DE] text-[#171717]">
                    {ing}
                  </span>
                ))}
              </div>
              {dish.allergens && (
                <div className="text-[11px] text-[#8C7654]">
                  <span className="font-bold">Allergens:</span> {dish.allergens.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Add-ons & Customization Section */}
          {dish.addOns && dish.addOns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-[#171717]">
                  Customize Your Dish
                </h4>
                <span className="text-xs text-[#6F7378] font-semibold">Select Add-ons</span>
              </div>

              <div className="space-y-2">
                {dish.addOns.map((addon) => {
                  const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                  return (
                    <label 
                      key={addon.id}
                      onClick={() => handleToggleAddOn(addon)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-[#FF6B35] bg-[#FFF2EB]/60' 
                          : 'border-[#EFE8DE] hover:border-[#FF6B35]/40 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'border-[#D1C9BE] bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-[#171717]">{addon.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#FF6B35]">+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chef Special Cooking Instructions Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F7378] mb-1.5">
              Special Cooking Instructions (Optional)
            </label>
            <input 
              type="text"
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="e.g. Less spicy, extra lime, ring doorbell..."
              className="w-full text-xs p-3 rounded-xl border border-[#EFE8DE] bg-[#FBF9F5] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-5 bg-[#FFF8EE] border-t border-[#F2ECE1] flex items-center justify-between gap-4 mt-auto">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-[#EFE8DE] shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-[#F4F1EA] text-[#171717] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center transition-colors font-bold"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-extrabold text-[#171717] w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-[#F4F1EA] text-[#171717] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center transition-colors font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 flex-1 max-w-sm justify-end">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-white text-[#FF6B35] border-2 border-[#FF6B35] hover:bg-[#FFF2EB] transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ADD TO CART (₹{currentTotal})</span>
            </button>

            <button
              onClick={handleDirectBuy}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#FF6B35] hover:bg-[#E85A27] text-white shadow-lg shadow-[#FF6B35]/30 transition-all flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>BUY NOW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailsModal;
