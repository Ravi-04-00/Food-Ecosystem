import React, { useState } from 'react';
import { Star, Clock, Eye, Heart, Sparkles, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';

export const FoodCardRetro = ({ food, onSelectFood, hideRestaurantName = false }) => {
  const { wishlist, toggleWishlist, addRecentlyViewedFood } = useCustomer();
  const [isHovered, setIsHovered] = useState(false);

  if (!food) return null;

  const isWishlisted = wishlist?.some(item => item.id === food.id);
  const isAvailable = food.is_available !== false;

  const handleCardClick = () => {
    if (addRecentlyViewedFood) {
      addRecentlyViewedFood(food);
    }
    if (onSelectFood) {
      onSelectFood(food);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (toggleWishlist) toggleWishlist(food);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--ws-surface)',
        borderRadius: '18px',
        border: '1px solid',
        borderColor: isHovered ? 'var(--ws-primary)' : 'var(--ws-border)',
        boxShadow: isHovered ? 'var(--ws-shadow-lg)' : 'var(--ws-shadow-sm)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: isAvailable ? 1 : 0.85,
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Food Image Container */}
      <div style={{
        position: 'relative',
        height: 'clamp(95px, 22vw, 155px)',
        width: '100%',
        backgroundColor: 'var(--ws-surface-subtle)',
        overflow: 'hidden'
      }}>
        <img
          src={food.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'}
          alt={food.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            filter: isAvailable ? 'none' : 'grayscale(40%)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease'
          }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />

        {/* Subtle Bottom Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        {/* Top Badges Row: Dietary Indicator + Availability */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 4
        }}>
          {/* Dietary Veg / Non-Veg Indicator */}
          <div style={{
            width: '18px',
            height: '18px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            border: `1.5px solid ${food.is_veg ? '#52B788' : '#EF4444'}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            flexShrink: 0
          }}>
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: food.is_veg ? '#52B788' : '#EF4444'
            }} />
          </div>

          {/* Availability Status Badge (Shown if unavailable) */}
          {!isAvailable && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.92)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.62rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <XCircle size={10} />
              <span>OUT</span>
            </div>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          type="button"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            color: isWishlisted ? '#52B788' : '#65776B',
            transition: 'all 0.15s ease',
            zIndex: 5
          }}
          title={isWishlisted ? 'Remove from saved' : 'Save dish'}
        >
          <Heart size={14} fill={isWishlisted ? '#52B788' : 'none'} color={isWishlisted ? '#52B788' : '#65776B'} />
        </button>

        {/* Bottom Details Over Image */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '4px'
        }}>
          {food.category_name && (
            <span style={{
              background: 'rgba(22, 61, 43, 0.75)',
              backdropFilter: 'blur(6px)',
              color: '#F8FAFC',
              borderRadius: '5px',
              padding: '2px 6px',
              fontSize: '0.64rem',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '65%'
            }}>
              {food.category_name}
            </span>
          )}

          {/* Prep Time */}
          <div style={{
            background: 'rgba(22, 61, 43, 0.75)',
            backdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            borderRadius: '5px',
            padding: '2px 6px',
            fontSize: '0.64rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            marginLeft: 'auto',
            flexShrink: 0
          }}>
            <Clock size={10} />
            <span>{food.prep_time_minutes || 20}m</span>
          </div>
        </div>
      </div>

      {/* Food Details Body */}
      <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '5px' }}>
        <div>
          {/* Top Line: Restaurant Name & Rating */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px', gap: '4px' }}>
            {!hideRestaurantName && (
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--ws-text-muted)',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '68%'
              }}>
                {food.restaurant_name || 'Kitchen'}
              </span>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#D97706',
              padding: '1px 5px',
              borderRadius: '5px',
              fontSize: '0.66rem',
              fontWeight: 700,
              marginLeft: hideRestaurantName ? 'auto' : undefined,
              flexShrink: 0
            }}>
              <Star size={9} fill="#F59E0B" color="#F59E0B" />
              <span>{food.rating || 4.8}</span>
            </div>
          </div>

          {/* Dish Name */}
          <h3 style={{
            fontSize: 'clamp(0.78rem, 1.8vw, 0.88rem)',
            fontWeight: 800,
            color: 'var(--ws-text-primary)',
            margin: '0 0 2px 0',
            lineHeight: 1.25,
            minHeight: '2.4em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {food.name}
          </h3>
        </div>

        {/* Bottom Strip: Price & Add Action */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '5px',
          borderTop: '1px solid var(--ws-border)',
          gap: '4px'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', overflow: 'hidden' }}>
              <span style={{ fontSize: 'clamp(0.85rem, 2vw, 0.98rem)', fontWeight: 900, color: '#163D2B', whiteSpace: 'nowrap' }}>
                ₹{Number(food.price || 199).toFixed(0)}
              </span>
              {food.original_price && Number(food.original_price) > Number(food.price) && (
                <span style={{ fontSize: '0.64rem', color: 'var(--ws-text-muted)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                  ₹{Number(food.original_price).toFixed(0)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleCardClick}
            type="button"
            disabled={!isAvailable}
            style={{
              background: !isAvailable
                ? 'var(--ws-surface-subtle)'
                : 'linear-gradient(135deg, #52B788 0%, #1B4332 100%)',
              color: !isAvailable ? 'var(--ws-text-muted)' : '#FFFFFF',
              border: !isAvailable ? '1px solid var(--ws-border)' : 'none',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '0.70rem',
              fontWeight: 800,
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: isAvailable ? '0 2px 8px rgba(82, 183, 136, 0.28)' : 'none',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
          >
            <Plus size={12} />
            <span>{isAvailable ? 'Add' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
