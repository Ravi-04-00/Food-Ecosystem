import React, { useState } from 'react';
import { Star, Clock, Heart, Sparkles } from 'lucide-react';

/**
 * FDRestaurantCard — Exact Reference Design Restaurant Card
 * Matches the reference image cards:
 * - Rounded card container (#FFFFFF surface, #E1EBE3 border)
 * - Hero food image with 16:10 aspect ratio and rounded top
 * - Overlay Rating Pill: ⭐ rating  delivery-time
 * - Top-right Heart favorite icon
 * - Restaurant Name: Deep Royal Green (#163D2B, bold Manrope)
 * - Subtitle / Cuisines: #65776B (Inter)
 * - Footer: "₹... for two" and "🌿 Free Delivery" mint badge
 */
export const FDRestaurantCard = ({ 
  restaurant, 
  onClick, 
  onSelectFood,
  isFavorite = false,
  onToggleFavorite,
  className = '' 
}) => {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isHovered, setIsHovered] = useState(false);

  if (!restaurant) return null;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setFavorite(!favorite);
    if (onToggleFavorite) onToggleFavorite(restaurant);
  };

  const name = restaurant.name || 'Gourmet Kitchen';
  const rating = restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.5';
  const deliveryTime = restaurant.delivery_time_text || restaurant.deliveryTime || '25-30 min';
  const cuisines = Array.isArray(restaurant.cuisines) 
    ? restaurant.cuisines.slice(0, 2).join(' • ') 
    : (restaurant.cuisine || 'Healthy • Fresh');
  const priceForTwo = restaurant.price_for_two_text || restaurant.priceForTwo || `₹${restaurant.cost_for_two || 120} for two`;
  const image = restaurant.hero_image || restaurant.heroImage || restaurant.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid',
        borderColor: isHovered ? '#52B788' : '#E1EBE3',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 12px 30px rgba(22, 61, 43, 0.10)' : '0 2px 10px rgba(22, 61, 43, 0.04)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}
      className={className}
    >
      {/* Hero Food Image Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        background: '#D8F3DC'
      }}>
        <img
          src={image}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.5s ease'
          }}
          loading="lazy"
        />

        {/* Top-Right Heart Icon */}
        <button
          onClick={handleFavoriteClick}
          title="Save to favorites"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            transition: 'transform 0.2s ease'
          }}
        >
          <Heart 
            size={16} 
            color={favorite ? '#EF4444' : '#163D2B'} 
            fill={favorite ? '#EF4444' : 'none'} 
          />
        </button>

        {/* Bottom-Left Rating Pill matching Reference: ⭐ 4.5  25-30 min */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          borderRadius: '10px',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#163D2B'
        }}>
          <Star size={13} fill="#F4B400" color="#F4B400" />
          <span>{rating}</span>
          <span style={{ color: '#E1EBE3' }}>|</span>
          <span style={{ color: '#65776B', fontWeight: 600 }}>{deliveryTime}</span>
        </div>
      </div>

      {/* Card Body Details */}
      <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <h3 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '1.05rem',
          fontWeight: 800,
          color: '#163D2B',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {name}
        </h3>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.80rem',
          color: '#65776B',
          margin: '2px 0 10px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {cuisines}
        </p>

        {/* Card Footer: Price & Free Delivery Pill */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem'
        }}>
          <span style={{ fontWeight: 700, color: '#163D2B', fontFamily: "'Inter', sans-serif" }}>
            {priceForTwo}
          </span>

          <span style={{
            background: '#D8F3DC',
            color: '#163D2B',
            borderRadius: '8px',
            padding: '3px 8px',
            fontSize: '0.70rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid rgba(82, 183, 136, 0.3)'
          }}>
            <span>🌿</span>
            <span>Free Delivery</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FDRestaurantCard;
