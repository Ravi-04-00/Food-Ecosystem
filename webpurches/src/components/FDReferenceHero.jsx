import React, { useState } from 'react';
import { Search, ChevronRight, Sparkles } from 'lucide-react';

/**
 * FDReferenceHero — Exact Reference Design Hero Banner
 * Matches the reference image:
 * - Light mint rounded container (#EAF7EE / #D8F3DC)
 * - Pill badge: "🌱 Fresh & Healthy  >"
 * - Headline: "Order Fresh." (Dark Green) / "Live Royal." (Fresh Green)
 * - Subtitle: "Delicious food, fresh ingredients and happiness delivered to your door."
 * - Pill Search Bar with dark green circular search button
 * - Quick tags: Pizza, Biryani, Burger, Healthy, South Indian
 * - Right: Big circular grilled chicken & avocado salad bowl with floating "Fresh Ingredients Always" badge
 */
export const FDReferenceHero = ({ 
  searchQuery = '', 
  onSearchChange, 
  onPerformSearch,
  onSelectTag 
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

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

  return (
    <div style={{
      background: 'linear-gradient(135deg, #EAF7EE 0%, #D8F3DC 100%)',
      borderRadius: '28px',
      border: '1px solid rgba(82, 183, 136, 0.25)',
      padding: '40px 44px',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
      alignItems: 'center',
      gap: '36px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(22, 61, 43, 0.05)'
    }} className="flex flex-col-reverse lg:grid">
      
      {/* Left Column: Headlines, Pill Tag, Search Bar, Quick Tags */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 2 }}>
        
        {/* Pill Badge: Fresh & Healthy > */}
        <div style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#FFFFFF',
          border: '1px solid #B7E4C7',
          borderRadius: '999px',
          padding: '5px 14px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#163D2B',
          boxShadow: '0 2px 6px rgba(22, 61, 43, 0.04)'
        }}>
          <span>🌱</span>
          <span>Fresh & Healthy</span>
          <ChevronRight size={13} color="#52B788" />
        </div>

        {/* Main Headline: Order Fresh. Live Royal. */}
        <h1 style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(2.2rem, 3.8vw, 3.4rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          margin: 0
        }}>
          <span style={{ color: '#163D2B', display: 'block' }}>Order Fresh.</span>
          <span style={{ color: '#52B788', display: 'block' }}>Live Royal.</span>
        </h1>

        {/* Short Supporting Description */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '1rem',
          lineHeight: 1.5,
          color: '#65776B',
          margin: '2px 0 6px 0',
          maxWidth: '460px'
        }}>
          Delicious food, fresh ingredients and happiness delivered to your door.
        </p>

        {/* Pill Search Bar with Round Dark Green Button */}
        <form 
          onSubmit={handleSubmit}
          style={{
            background: '#FFFFFF',
            borderRadius: '999px',
            border: '1.5px solid #E1EBE3',
            boxShadow: '0 6px 24px rgba(22, 61, 43, 0.08)',
            padding: '5px 6px 5px 20px',
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
            placeholder="Search for restaurants, dishes or cuisines..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.90rem',
              color: '#163D2B',
              fontWeight: 500
            }}
          />
          <button
            type="submit"
            title="Search"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#163D2B',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(22, 61, 43, 0.25)',
              transition: 'background-color 0.2s ease, transform 0.15s ease'
            }}
            className="hover:scale-105"
          >
            <Search size={17} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </form>

        {/* Quick Tag Pills: Pizza, Biryani, Burger, Healthy, South Indian */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '4px'
        }}>
          {quickTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E1EBE3',
                borderRadius: '999px',
                padding: '5px 14px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#163D2B',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(22, 61, 43, 0.04)',
                transition: 'all 0.2s ease'
              }}
              className="hover:bg-[#D8F3DC] hover:border-[#52B788]"
            >
              {tag}
            </button>
          ))}
        </div>

      </div>

      {/* Right Column: High-Res Salad Photography & Floating Fresh Badge */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '320px'
      }}>
        {/* Soft radial glow behind salad */}
        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82, 183, 136, 0.35) 0%, transparent 70%)',
          filter: 'blur(20px)'
        }} />

        {/* Main Food Photograph: Fresh Salad Bowl */}
        <div style={{
          position: 'relative',
          width: 'clamp(260px, 28vw, 360px)',
          height: 'clamp(260px, 28vw, 360px)',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(22, 61, 43, 0.22)',
          border: '4px solid #FFFFFF'
        }}>
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=85"
            alt="Fresh Salad Bowl"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Small Companion Dressing Dish */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10%',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #FFFFFF',
          boxShadow: '0 8px 20px rgba(22, 61, 43, 0.18)'
        }}>
          <img
            src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80"
            alt="Olive Oil Dressing"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Floating Top-Right Circular Badge: Fresh Ingredients Always */}
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '8%',
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
            Fresh Ingredients Always
          </span>
        </div>

      </div>

    </div>
  );
};

export default FDReferenceHero;
