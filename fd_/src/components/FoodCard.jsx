import React from 'react';
import { Star, Clock, Flame, Heart, Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';

export const FoodCard = ({ 
  dish, 
  onViewDetails, 
  className = '' 
}) => {
  const { addToCart, items, wishlist, toggleWishlist } = useCart();
  const { setSelectedDishForModal } = useFoodEcosystem();

  const isFavorited = wishlist.some((p) => p.id === dish.id);
  const cartItem = items.find((item) => item.product.id === dish.id);
  const isInCart = Boolean(cartItem);

  const handleAddClick = (e) => {
    e.stopPropagation();
    // If dish has add-ons or customizations, open detail modal
    if (dish.addOns && dish.addOns.length > 0) {
      setSelectedDishForModal(dish);
    } else {
      addToCart(dish, 1, []);
    }
  };

  return (
    <div 
      onClick={() => onViewDetails ? onViewDetails(dish) : setSelectedDishForModal(dish)}
      className={`food-card group cursor-pointer overflow-hidden flex flex-col justify-between p-4 bg-white transition-all duration-300 ${className}`}
    >
      {/* Top Media & Badges Container */}
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 bg-[#F4F1EA]">
        <img 
          src={dish.image} 
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Veg / Non-Veg Indicator Icon Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-[#EFE8DE] flex items-center justify-center">
          <div className={`w-3.5 h-3.5 rounded-[3px] border-2 flex items-center justify-center ${
            dish.isVeg ? 'border-[#20B26B]' : 'border-[#FF3B30]'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              dish.isVeg ? 'bg-[#20B26B]' : 'bg-[#FF3B30]'
            }`} />
          </div>
        </div>

        {/* Discount Badge */}
        {dish.discount && (
          <div className="absolute top-3 right-3 bg-[#FF3B30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
            {dish.discount}
          </div>
        )}

        {/* Wishlist Heart Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(dish);
          }}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
            isFavorited ? 'bg-[#FF3B30] text-white' : 'bg-white/90 text-[#6F7378] hover:text-[#FF3B30]'
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Prep Time Tag */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
          <Clock className="w-3 h-3 text-[#FFC857]" />
          <span>{dish.prepTime || 20}m prep</span>
        </div>
      </div>

      {/* Details Container */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Restaurant & Rating Row */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#6F7378] font-semibold truncate max-w-[170px]">
              {dish.restaurantName}
            </span>
            <div className="flex items-center space-x-1 bg-[#FFF9EB] text-[#B87A00] px-1.5 py-0.5 rounded-md font-bold text-[11px]">
              <Star className="w-3 h-3 fill-[#FFC857] text-[#FFC857]" />
              <span>{dish.rating || 4.8}</span>
              <span className="text-[#A08860] font-normal text-[10px]">({dish.reviewCount})</span>
            </div>
          </div>

          {/* Dish Title */}
          <h3 className="font-extrabold text-[#171717] text-base leading-snug group-hover:text-[#FF6B35] transition-colors line-clamp-1 mb-1">
            {dish.name}
          </h3>

          {/* Spice Meter & Short Description */}
          <div className="flex items-center space-x-2 mb-2 text-xs text-[#6F7378]">
            {dish.spiceLevel > 0 && (
              <span className="flex items-center text-[#FF3B30] font-semibold text-[11px]" title={`Spice Level: ${dish.spiceLevel}/3`}>
                <Flame className="w-3 h-3 mr-0.5 fill-current" />
                {'🌶️'.repeat(dish.spiceLevel)}
              </span>
            )}
            <span className="line-clamp-1 text-[11px] text-[#808488]">
              {dish.shortDescription}
            </span>
          </div>
        </div>

        {/* Pricing & Add Button Row */}
        <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-extrabold text-[#171717]">
                ₹{dish.price}
              </span>
              {dish.originalPrice && (
                <span className="text-xs text-[#9B9DA2] line-through font-medium">
                  ₹{dish.originalPrice}
                </span>
              )}
            </div>
            {dish.addOns && dish.addOns.length > 0 && (
              <span className="text-[10px] font-bold text-[#FF6B35]">
                Customizable
              </span>
            )}
          </div>

          <button
            onClick={handleAddClick}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm ${
              isInCart
                ? 'bg-[#EBF8F1] text-[#20B26B] border border-[#20B26B]'
                : 'bg-[#FF6B35] hover:bg-[#E85A27] text-white shadow-[#FF6B35]/25 hover:shadow-md'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ADDED ({cartItem.quantity})</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
