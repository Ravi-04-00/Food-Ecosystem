import React from 'react';
import { Bike, Sparkles, ShieldCheck, Headphones } from 'lucide-react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

/**
 * FDTrustAndPromoSection — Exact Reference Design Feature Badges & Promo Card
 * Matches the reference image:
 * - 4 Badges: Fast Delivery, Fresh Ingredients, Secure Payment, 24/7 Support
 * - Promo Card: Salad photography with "Fresh Food / Happy People / FD Foods"
 */
export const FDTrustAndPromoSection = ({ onExploreClick }) => {
  const trustFeatures = [
    { id: 1, icon: Bike, title: 'Fast Delivery', subtitle: 'Average 25 mins' },
    { id: 2, icon: Sparkles, title: 'Fresh Ingredients', subtitle: '100% Farm Sourced' },
    { id: 3, icon: ShieldCheck, title: 'Secure Payment', subtitle: 'UPI, Card & COD' },
    { id: 4, icon: Headphones, title: '24/7 Support', subtitle: 'Always Available' }
  ];

  return (
    <section style={{ margin: '32px 0 16px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 4 Feature Badges in a Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {trustFeatures.map(f => {
          const Icon = f.icon;
          return (
            <div
              key={f.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E1EBE3',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 8px rgba(22, 61, 43, 0.03)'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#D8F3DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={20} color="#163D2B" />
              </div>

              <div>
                <h4 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: '#163D2B',
                  margin: 0
                }}>
                  {f.title}
                </h4>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.75rem',
                  color: '#65776B',
                  margin: '2px 0 0 0'
                }}>
                  {f.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Promo Showcase Card matching Reference */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #163D2B 0%, #1B4332 100%)',
        color: '#FFFFFF',
        padding: '36px 40px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 12px 36px rgba(22, 61, 43, 0.16)'
      }} className="flex flex-col md:grid">
        
        {/* Left Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(82, 183, 136, 0.2)',
            border: '1px solid rgba(82, 183, 136, 0.4)',
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#B7E4C7',
            width: 'fit-content'
          }}>
            <span>🌱</span>
            <span>ROYAL FOOD ECOSYSTEM</span>
          </div>

          <h2 style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            <span style={{ color: '#FFFFFF', display: 'block' }}>Fresh Food</span>
            <span style={{ color: '#B7E4C7', display: 'block' }}>Happy People</span>
            <span style={{ color: '#52B788', display: 'block' }}>FD Foods</span>
          </h2>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.92rem',
            color: '#D8F3DC',
            margin: 0,
            maxWidth: '440px',
            lineHeight: 1.5
          }}>
            Handcrafted recipes prepared by partner kitchens using fresh organic produce, delivered straight to your dining table.
          </p>

          <div style={{ marginTop: '6px' }}>
            <button
              onClick={onExploreClick}
              style={{
                background: '#52B788',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(82, 183, 136, 0.35)',
                transition: 'all 0.2s ease'
              }}
              className="hover:scale-105"
            >
              Order Now →
            </button>
          </div>
        </div>

        {/* Right Imagery */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: 'clamp(200px, 22vw, 280px)',
            height: 'clamp(200px, 22vw, 280px)',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"
              alt="Fresh Food Happy People"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

      </div>

    </section>
  );
};

export default FDTrustAndPromoSection;
