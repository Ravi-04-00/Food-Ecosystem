import React, { useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  MapPin, 
  Sparkles, 
  Star, 
  Plus, 
  Check, 
  Flame, 
  Clock 
} from 'lucide-react';

/**
 * FDReferenceHero — Unified Responsive Food Hero Banner
 * Requirements:
 * - Responsive with heading, search, delivery location, and clear CTA
 * - Shows ONLY 2–3 featured food items in the hero/featured section (using real data, never invented)
 * - Add-to-cart actions, clear images, real prices, and loading skeletons
 * - Fully responsive across mobile, tablet, and desktop
 */
export const FDReferenceHero = ({ 
  searchQuery = '', 
  onSearchChange, 
  onPerformSearch,
  onSelectTag,
  onOpenLocationModal,
  currentLocation = 'Chennai Central',
  featuredFoods = [],
  onSelectFood,
  onAddToCart,
  isLoading = false
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [addedIds, setAddedIds] = useState({});

  const quickTags = ['Pizza', 'Biryani', 'Burger', 'Healthy', 'South Indian'];

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onPerformSearch) {
      onPerformSearch(localSearch);
    }
  };

  const handleTagClick = (tag) => {
    setLocalSearch(tag);
    if (onSelectTag) {
      onSelectTag(tag);
    } else if (onPerformSearch) {
      onPerformSearch(tag);
    }
  };

  const handleAdd = (e, food) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(food);
      setAddedIds(prev => ({ ...prev, [food.id]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [food.id]: false }));
      }, 2000);
    } else if (onSelectFood) {
      onSelectFood(food);
    }
  };

  // Restrict featured items in the hero to exactly 2–3 items
  const displayFeatured = (featuredFoods || []).slice(0, 3);

  return (
    <section 
      style={{
        background: 'linear-gradient(135deg, #EAF7EE 0%, #D8F3DC 100%)',
        borderRadius: '28px',
        border: '1px solid rgba(82, 183, 136, 0.25)',
        padding: '32px 36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(22, 61, 43, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}
      aria-label="FD Foods Hero Showcase"
    >
      {/* Top Meta Row: Badge & Location Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#FFFFFF',
          border: '1px solid #B7E4C7',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#163D2B',
          boxShadow: '0 2px 6px rgba(22, 61, 43, 0.04)'
        }}>
          <span>🌱</span>
          <span>Fresh & Healthy Quality</span>
          <ChevronRight size={13} color="#52B788" />
        </div>

        {/* Location Selector Button */}
        <button
          type="button"
          onClick={() => onOpenLocationModal && onOpenLocationModal()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #B7E4C7',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '0.80rem',
            fontWeight: 700,
            color: '#163D2B',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(22, 61, 43, 0.04)',
            transition: 'all 0.15s ease'
          }}
          className="hover:border-[#52B788] hover:bg-[#F7FBF7]"
          title="Change delivery address"
          aria-label={`Delivering to ${currentLocation}. Click to change address.`}
        >
          <MapPin size={15} color="#52B788" />
          <span>Delivering to: <strong style={{ color: '#163D2B' }}>{currentLocation}</strong></span>
          <span style={{ color: '#52B788', fontSize: '0.72rem' }}>▾</span>
        </button>
      </div>

      {/* Main Grid: Headline, Search, Quick Tags & Visual Hero */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        alignItems: 'center',
        gap: '28px'
      }}>
        {/* Left Column: Headlines, Search Bar & Quick Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 2 }}>
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.1rem, 3.6vw, 3.2rem)',
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            margin: 0
          }}>
            <span style={{ color: '#163D2B', display: 'block' }}>Order Fresh.</span>
            <span style={{ color: '#52B788', display: 'block' }}>Live Royal.</span>
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.96rem',
            lineHeight: 1.5,
            color: '#65776B',
            margin: '2px 0 6px 0',
            maxWidth: '480px'
          }}>
            Delicious gourmet cuisine, farm-fresh ingredients and royal experiences delivered to your doorstep.
          </p>

          {/* Pill Search Form with Round CTA */}
          <form 
            onSubmit={handleSubmit}
            style={{
              background: '#FFFFFF',
              borderRadius: '999px',
              border: '1.5px solid #E1EBE3',
              boxShadow: '0 6px 24px rgba(22, 61, 43, 0.08)',
              padding: '6px 8px 6px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '520px',
              width: '100%'
            }}
          >
            <Search size={18} color="#65776B" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              placeholder="Search dishes, kitchens, cuisines..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.90rem',
                color: '#163D2B',
                fontWeight: 600,
                minWidth: 0
              }}
              aria-label="Search dishes and kitchens"
            />
            <button
              type="submit"
              title="Search"
              aria-label="Find Food"
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                background: '#163D2B',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.84rem',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(22, 61, 43, 0.25)',
                transition: 'all 0.15s ease'
              }}
              className="hover:bg-[#1B4332] active:scale-95"
            >
              <span>Find Food</span>
              <Search size={15} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          </form>

          {/* Quick Tag Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '2px'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#65776B' }}>Popular:</span>
            {quickTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E1EBE3',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#163D2B',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(22, 61, 43, 0.04)',
                  transition: 'all 0.15s ease'
                }}
                className="hover:bg-[#D8F3DC] hover:border-[#52B788]"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Hero Visual Graphic */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px'
        }}>
          {/* Soft glow */}
          <div style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(82, 183, 136, 0.35) 0%, transparent 70%)',
            filter: 'blur(20px)'
          }} />

          {/* Main Hero Photograph */}
          <div style={{
            position: 'relative',
            width: 'clamp(220px, 24vw, 320px)',
            height: 'clamp(220px, 24vw, 320px)',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(22, 61, 43, 0.20)',
            border: '4px solid #FFFFFF'
          }}>
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=85"
              alt="Fresh Gourmet Cuisine"
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          {/* Floating Fresh Quality Badge */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '4%',
            background: '#FFFFFF',
            border: '1.5px solid #B7E4C7',
            borderRadius: '50%',
            width: '74px',
            height: '74px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '6px',
            boxShadow: '0 8px 20px rgba(22, 61, 43, 0.12)',
            zIndex: 3
          }}>
            <span style={{ fontSize: '0.90rem', lineHeight: 1 }}>🌱</span>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.58rem',
              fontWeight: 800,
              color: '#163D2B',
              lineHeight: 1.1,
              marginTop: '2px'
            }}>
              100% Fresh Guaranteed
            </span>
          </div>
        </div>
      </div>

      {/* FEATURED SPECIALTIES SECTION: Strictly 2–3 items */}
      <div style={{
        borderTop: '1px solid rgba(82, 183, 136, 0.25)',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#163D2B" />
            <h3 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.96rem',
              fontWeight: 800,
              color: '#163D2B',
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              Featured Today — Chef's Daily Selection
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#52B788' }}>
            Curated 3 Handpicked Specialties
          </span>
        </div>

        {/* 2–3 Featured Items Responsive Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
          gap: '14px'
        }}>
          {isLoading ? (
            /* Loading Skeletons */
            [1, 2, 3].map(n => (
              <div 
                key={n}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E1EBE3',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#D8F3DC' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '70%', height: '14px', background: '#E1EBE3', borderRadius: '4px' }} />
                  <div style={{ width: '40%', height: '12px', background: '#E1EBE3', borderRadius: '4px' }} />
                </div>
              </div>
            ))
          ) : displayFeatured.length > 0 ? (
            displayFeatured.map(food => {
              const isAdded = !!addedIds[food.id];
              const price = typeof food.price === 'number' ? food.price : parseFloat(food.price || 0);
              const rating = typeof food.rating === 'number' ? food.rating : parseFloat(food.rating || 0);

              return (
                <div
                  key={food.id}
                  onClick={() => onSelectFood && onSelectFood(food)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1px solid #E1EBE3',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(22, 61, 43, 0.04)',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                    position: 'relative'
                  }}
                  className="hover:border-[#52B788] hover:-translate-y-0.5"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSelectFood && onSelectFood(food); }}
                  aria-label={`${food.name}, ₹${price.toFixed(2)}`}
                >
                  {/* Dish Thumbnail */}
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#F7FBF7',
                    flexShrink: 0
                  }}>
                    <img 
                      src={food.image || food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                      alt={food.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Dish Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: food.is_veg !== false ? '#10B981' : '#EF4444',
                          flexShrink: 0
                        }}
                        title={food.is_veg !== false ? 'Vegetarian' : 'Non-Vegetarian'}
                      />
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: '#163D2B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {food.name}
                      </h4>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ fontWeight: 900, color: '#163D2B' }}>
                        ₹{price.toFixed(0)}
                      </span>
                      {rating > 0 && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: 700,
                          color: '#D97706'
                        }}>
                          <Star size={11} fill="#F59E0B" color="#F59E0B" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    onClick={(e) => handleAdd(e, food)}
                    style={{
                      background: isAdded ? '#10B981' : '#F7FBF7',
                      color: isAdded ? '#FFFFFF' : '#163D2B',
                      border: `1.5px solid ${isAdded ? '#10B981' : '#B7E4C7'}`,
                      borderRadius: '12px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    className="hover:scale-105 active:scale-95"
                    aria-label={`Add ${food.name} to cart`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} strokeWidth={3} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} strokeWidth={2.5} />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#65776B', padding: '8px 0' }}>
              Specialties loading from restaurant kitchen...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FDReferenceHero;
