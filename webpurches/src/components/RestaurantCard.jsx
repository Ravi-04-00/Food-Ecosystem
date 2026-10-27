import React from 'react';
import { Star, Clock, MapPin, ShieldCheck, Flame } from 'lucide-react';

export const RestaurantCard = ({ restaurant, onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`food-card group cursor-pointer overflow-hidden p-4 bg-white transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      {/* Hero Banner & Badges */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-3 bg-[#F4F1EA]">
        <img 
          src={restaurant.heroImage} 
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Rating Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md flex items-center space-x-1 text-xs font-black text-[#171717]">
          <Star className="w-3.5 h-3.5 fill-[#FFC857] text-[#FFC857]" />
          <span>{restaurant.rating}</span>
          <span className="text-[#8C8F94] font-normal text-[10px]">({restaurant.reviewCount})</span>
        </div>

        {/* ETA & Distance Badge */}
        <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[10px] font-semibold flex items-center space-x-1.5">
          <Clock className="w-3 h-3 text-[#FF6B35]" />
          <span>{restaurant.deliveryTime}</span>
          <span>•</span>
          <span>{restaurant.distance}</span>
        </div>

        {/* Open Status Tag */}
        <div className="absolute top-3 left-3 bg-[#20B26B] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          Open Now
        </div>
      </div>

      {/* Info Container */}
      <div>
        <div className="flex items-center space-x-1.5 mb-1">
          <h3 className="font-extrabold text-base text-[#171717] group-hover:text-[#FF6B35] transition-colors truncate">
            {restaurant.name}
          </h3>
          {restaurant.verified && (
            <ShieldCheck className="w-4 h-4 text-[#52B788] flex-shrink-0" title="Verified FD Foods Partner" />
          )}
        </div>

        {/* Cuisines */}
        <p className="text-xs text-[#6F7378] font-medium truncate mb-2">
          {restaurant.cuisines.join(' • ')}
        </p>

        {/* Price for two */}
        <div className="text-xs font-bold text-[#8C8F94] mb-3">
          {restaurant.priceForTwo}
        </div>

        {/* Offer Banner */}
        {restaurant.offers && restaurant.offers.length > 0 && (
          <div className="pt-2 border-t border-[#F2ECE1] flex items-center space-x-1.5 text-[11px] font-bold text-[#FF6B35]">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="truncate">{restaurant.offers[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;
