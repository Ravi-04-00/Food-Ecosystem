import React, { useState } from 'react';
import { Star, ShieldCheck, Heart, ShoppingBag, Eye, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

export const ProductCard = ({
  product,
  onViewDetails,
  onBuyNow,
}) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Subtle 3D mouse parallax tilt
  const handleMouseMove = (e) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    setTilt({ x: y, y: x });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const isFavorited = isInWishlist(product.id);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? -6 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      className="group relative rounded-3xl bg-[#151519] border border-white/10 hover:border-[#D6A85F]/50 shadow-lg hover:shadow-2xl overflow-hidden flex flex-col justify-between"
    >
      {/* Primary Gold Accent Top Line on Hover */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#D6A85F] transition-opacity duration-300 z-20 pointer-events-none"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Top Media Container */}
      <div className="relative h-64 sm:h-72 overflow-hidden bg-[#0B0B0D] border-b border-white/5">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          <span className="px-3 py-1 rounded-full bg-[#050505]/90 text-[#D6A85F] text-[10px] font-mono tracking-widest uppercase border border-[#D6A85F]/40 shadow-xs">
            WS FEATURED
          </span>
          {product.discount && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#D6A85F] text-[#050505] text-[10px] font-mono font-bold tracking-wider shadow-xs">
              {product.discount}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-4 right-4 p-2.5 rounded-full border transition-all z-10 backdrop-blur-md ${
            isFavorited
              ? 'bg-[#050505] text-[#D6A85F] border-[#D6A85F]'
              : 'bg-[#1C1C21]/80 hover:bg-[#1C1C21] text-[#A7A7AE] hover:text-[#F5F5F5] border-white/10'
          }`}
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-[#D6A85F]' : ''}`} />
        </button>

        {/* Quick View Button overlay */}
        <button
          type="button"
          onClick={() => onViewDetails(product)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10"
        >
          <span className="px-4 py-2 rounded-full bg-[#1C1C21]/95 text-[#F5F5F5] text-xs font-sans uppercase tracking-luxury font-bold shadow-lg flex items-center space-x-1.5 border border-white/15">
            <Eye className="w-3.5 h-3.5 text-[#D6A85F]" />
            <span>VIEW PRODUCT</span>
          </span>
        </button>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Seller */}
          <div className="flex items-center justify-between text-xs text-[#A7A7AE] font-sans mb-1">
            <span className="font-semibold text-[#D6A85F] uppercase tracking-wider text-[11px]">
              {product.brand || product.seller}
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-mono text-[#A7A7AE]">{product.seller}</span>
              {product.sellerVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-[#D6A85F]" title="Verified Seller" />
              )}
            </div>
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-serif text-lg font-bold text-[#F5F5F5] hover:text-[#D6A85F] cursor-pointer line-clamp-1 transition-colors"
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1.5 mt-2">
            <div className="flex text-[#D6A85F]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-[#D6A85F]" />
              ))}
            </div>
            <span className="text-xs font-bold text-[#F5F5F5]">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-[#A7A7AE]">({product.reviewCount})</span>
          </div>

          {/* Delivery & Stock status */}
          <div className="mt-3 flex items-center justify-between text-[11px] font-sans">
            <div className="flex items-center space-x-1 text-[#A7A7AE]">
              <Truck className="w-3.5 h-3.5 text-[#D6A85F]" />
              <span>Free Delivery</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#1C1C21] border border-white/10 text-[10px] font-mono font-semibold text-[#F5F5F5]">
              {product.availability || (product.stock > 0 ? 'In Stock' : 'Out of Stock')}
            </span>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] block">
                PRICE
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-2xl font-bold text-[#F5F5F5]">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-[#A7A7AE] line-through font-sans">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.discount && (
                  <span className="text-[11px] font-mono font-bold text-[#D6A85F]">
                    {product.discount}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#A7A7AE] uppercase tracking-wider">
              TAX INCL.
            </span>
          </div>

          {/* Buttons: View Product, Add to Cart, Wishlist */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="flex-1 py-2.5 rounded-full bg-[#1C1C21] border border-white/10 hover:border-[#D6A85F] text-[#F5F5F5] text-xs font-sans uppercase tracking-wider font-semibold transition-colors flex items-center justify-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5 text-[#D6A85F]" />
              <span>VIEW</span>
            </button>

            <button
              type="button"
              onClick={() => addToCart(product, 1)}
              className="flex-1 physical-btn py-2.5 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-1 hover:bg-[#F0C982] shadow-md"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#050505]" />
              <span>ADD TO CART</span>
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`p-2.5 rounded-full border transition-colors flex items-center justify-center ${
                isFavorited
                  ? 'bg-[#050505] text-[#D6A85F] border-[#D6A85F]'
                  : 'bg-[#1C1C21] border-white/10 text-[#A7A7AE] hover:text-[#D6A85F] hover:border-[#D6A85F]'
              }`}
              title="Save to Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-[#D6A85F]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
