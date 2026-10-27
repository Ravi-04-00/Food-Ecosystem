import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { FoodCard } from '../components/FoodCard.jsx';
import { useCart } from '../context/CartContext.jsx';

export const Wishlist = ({ onViewProductDetails, onNavigateShop }) => {
  const { wishlist } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-[#EFE8DE] flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717]">
            Saved Favorite <span className="text-[#FF6B35]">Dishes</span>
          </h1>
          <p className="text-xs text-[#6F7378] mt-1">
            Your personal bookmarks of dishes you love to order
          </p>
        </div>
        <span className="text-xs font-bold text-[#FF6B35] bg-[#FFF2EB] px-3 py-1.5 rounded-xl border border-[#FF6B35]/20">
          {wishlist.length} Saved
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-[#EFE8DE] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center text-3xl mx-auto">
            ❤️
          </div>
          <h3 className="text-xl font-black text-[#171717]">No Saved Dishes Yet</h3>
          <p className="text-xs text-[#6F7378] max-w-sm mx-auto">
            Click the heart icon on any food item to save it for quick re-ordering anytime.
          </p>
          <button
            onClick={onNavigateShop}
            className="px-6 py-3 rounded-2xl bg-[#FF6B35] text-white text-xs font-black shadow-md shadow-[#FF6B35]/25 hover:bg-[#E85A27] transition-all"
          >
            DISCOVER DISHES
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((dish) => (
            <FoodCard 
              key={dish.id} 
              dish={dish} 
              onViewDetails={onViewProductDetails} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
