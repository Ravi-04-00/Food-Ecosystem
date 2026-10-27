import React from 'react';
import { Tag, Flame, Clock, Percent, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { FoodCard } from '../components/FoodCard.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const Deals = ({ onViewProductDetails, setActivePage }) => {
  const { dishes, coupons } = useFoodEcosystem();
  const { applyCouponCode } = useCart();

  const discountedDishes = dishes.filter((d) => d.discount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-[#EFE8DE] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF3B30] font-bold block mb-1">
            LIMITED TIME OFFERS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717]">
            Deals & Restaurant <span className="text-[#FF6B35]">Coupons</span>
          </h1>
          <p className="text-xs text-[#6F7378] mt-1">
            Save up to ₹150 on artisan dishes and enjoy free express delivery.
          </p>
        </div>

        <span className="text-xs font-bold text-[#20B26B] bg-[#EBF8F1] px-3 py-1.5 rounded-xl border border-[#20B26B]/30">
          ✓ Verified Active Discounts
        </span>
      </div>

      {/* Coupons Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coupons.map((c) => (
          <div key={c.code} className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-black text-[#FF6B35] bg-[#FFF2EB] px-2.5 py-1 rounded-lg border border-[#FF6B35]/20">
                {c.code}
              </span>
              <span className="text-[10px] font-bold text-[#20B26B] bg-[#EBF8F1] px-2 py-0.5 rounded-md">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-[#3A3D42] font-semibold">
              {c.description}
            </p>

            <button
              onClick={() => {
                applyCouponCode(c.code);
                alert(`Coupon ${c.code} copied and applied to cart!`);
              }}
              className="w-full py-2 rounded-xl bg-[#FFF8EE] hover:bg-[#FF6B35] hover:text-white text-[#171717] font-bold text-xs border border-[#EFE8DE] transition-all"
            >
              Apply to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Discounted Dishes Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-[#171717]">
          Dishes with Instant Savings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {discountedDishes.map((dish) => (
            <FoodCard 
              key={dish.id} 
              dish={dish} 
              onViewDetails={onViewProductDetails} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Deals;
