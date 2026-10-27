import React, { useEffect, useState, useCallback } from 'react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';

/**
 * FDCommonBrandIntro — Premium 3D Animated Intro Screen
 * 
 * Animation Sequence:
 * 1. Clean, premium background using the FD green/mint palette (#F7FBF7, #D8F3DC, #B7E4C7)
 * 2. Reveals the FD emblem with a smooth fade-in and subtle scale-up
 * 3. Animates the logo with a tasteful 3D rotation and tilt in perspective space
 * 4. Adds soft lighting, subtle depth shadow, and restrained mint-colored glow
 * 5. Introduces the "FD Foods" wordmark with smooth opacity and upward movement
 * 6. Finishes with a short, elegant transition into the target application
 * 
 * Accessibility & Usability:
 * - Respects prefers-reduced-motion: bypasses immediately
 * - Skip button and Escape key support for instant bypass
 * - Smooth hardware-accelerated CSS 3D transforms (perspective, translateZ, rotateX, rotateY)
 */
export const FDCommonBrandIntro = ({
  app = 'restaurant', // 'customer' | 'restaurant' | 'delivery' | 'delivery_partner' | 'admin'
  duration = 2.0,
  onComplete,
  className = ''
}) => {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  const appMeta = {
    customer: {
      badge: 'Customer Portal',
      subtitle: 'Fresh Choices. Royal Experiences.',
      statusText: 'Connecting to Fresh Kitchens...'
    },
    restaurant: {
      badge: 'Restaurant Hub',
      subtitle: 'Kitchen Operations & Menu Management',
      statusText: 'Synchronizing Orders & Menus...'
    },
    delivery: {
      badge: 'Delivery Partner',
      subtitle: 'Smart Fleet & Dispatch Operations',
      statusText: 'Connecting to Fleet Dispatch...'
    },
    delivery_partner: {
      badge: 'Delivery Partner',
      subtitle: 'Smart Fleet & Dispatch Operations',
      statusText: 'Connecting to Fleet Dispatch...'
    },
    admin: {
      badge: 'Mission Control',
      subtitle: 'Platform Telemetry & Enterprise Governance',
      statusText: 'Loading System Telemetry...'
    }
  }[app] || {
    badge: 'Restaurant Hub',
    subtitle: 'Kitchen Operations & Menu Management',
    statusText: 'Synchronizing Orders & Menus...'
  };

  const handleFinish = useCallback(() => {
    setExiting(true);
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 280);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  useEffect(() => {
    // Reduced motion check
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    // Escape or Enter key listener to skip intro
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const intervalTime = 30;
    const totalSteps = (duration * 1000) / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const currentPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(currentPct);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        handleFinish();
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, handleFinish, onComplete]);

  return (
    <div 
      className={`fd-brand-intro fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none ${className}`}
      style={{
        backgroundColor: '#F7FBF7',
        backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(216, 243, 220, 0.65) 0%, rgba(183, 228, 199, 0.28) 45%, #F7FBF7 80%)',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
      role="dialog"
      aria-label="FD Foods Welcome Intro"
    >
      {/* Soft Ambient Radial Background Rings */}
      <div 
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 560px)',
          height: 'min(90vw, 560px)',
          borderRadius: '50%',
          border: '1.5px solid rgba(82, 183, 136, 0.18)',
          pointerEvents: 'none',
          animation: 'fdAmbientRing 4s ease-in-out infinite'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(70vw, 420px)',
          height: 'min(70vw, 420px)',
          borderRadius: '50%',
          border: '1px solid rgba(183, 228, 199, 0.35)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Header Bar with Brand Tag & Skip Action */}
      <div className="w-full max-w-5xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#52B788',
              boxShadow: '0 0 10px #52B788'
            }}
          />
          <span 
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#163D2B',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            FD Foods Ecosystem
          </span>
        </div>

        <button
          onClick={handleFinish}
          type="button"
          style={{
            background: 'rgba(22, 61, 43, 0.06)',
            border: '1px solid rgba(22, 61, 43, 0.16)',
            color: '#163D2B',
            borderRadius: '9999px',
            padding: '7px 18px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          className="hover:bg-emerald-100 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Skip intro animation"
        >
          <span>Skip</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 500 }}>[Esc]</span>
        </button>
      </div>

      {/* Center 3D Stage */}
      <div 
        className="flex flex-col items-center justify-center text-center px-4 -mt-6 z-10"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%'
        }}
      >
        {/* 3D Emblem Container with Rotation, Tilt, Mint Glow & Light Reflection */}
        <div 
          className="fd-intro-3d-stage"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '140px',
            height: '140px',
            borderRadius: '36px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(216, 243, 220, 0.6) 100%)',
            border: '1.5px solid rgba(82, 183, 136, 0.35)',
            boxShadow: '0 20px 40px -10px rgba(22, 61, 43, 0.15), 0 0 50px rgba(82, 183, 136, 0.28), inset 0 2px 6px rgba(255, 255, 255, 0.9)',
            animation: 'fdCinematic3DRotation 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            transformStyle: 'preserve-3d',
            willChange: 'transform'
          }}
        >
          {/* Gleaming Specular Light Sheen */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '36px',
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.75) 48%, rgba(183, 228, 199, 0.5) 52%, transparent 65%)',
                animation: 'fdGlossSweep 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}
            />
          </div>

          {/* Original Vector FD Foods Emblem */}
          <div 
            style={{ 
              transform: 'translateZ(26px)',
              filter: 'drop-shadow(0 8px 16px rgba(22, 61, 43, 0.22))'
            }}
          >
            <FDOrganicLogo 
              size="hero" 
              layout="symbol-only"
              showWordmark={false} 
            />
          </div>
        </div>

        {/* Wordmark & Typography Reveal: Staged upward glide & opacity */}
        <div 
          className="fd-intro-wordmark-reveal flex flex-col items-center mt-6"
          style={{
            animation: 'fdWordmarkReveal 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <div className="flex items-center gap-3 justify-center">
            <h1 
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                fontWeight: 800,
                color: '#163D2B',
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1
              }}
            >
              FD Foods
            </h1>
            <span 
              style={{
                fontSize: '0.72rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                backgroundColor: '#D8F3DC',
                color: '#163D2B',
                border: '1px solid rgba(82, 183, 136, 0.35)',
                padding: '3px 10px',
                borderRadius: '8px'
              }}
            >
              {appMeta.badge}
            </span>
          </div>

          <p 
            className="mt-2 text-xs sm:text-sm font-semibold tracking-wide"
            style={{ 
              color: '#65776B',
              fontFamily: "'Inter', sans-serif",
              maxWidth: '380px'
            }}
          >
            {appMeta.subtitle}
          </p>

          {/* Luxury Leaf Divider */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <div style={{ height: '1px', width: '36px', backgroundColor: '#B7E4C7' }} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#52B788">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
            </svg>
            <div style={{ height: '1px', width: '36px', backgroundColor: '#B7E4C7' }} />
          </div>
        </div>
      </div>

      {/* Bottom Progress & Initialization Telemetry */}
      <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center gap-2.5 z-10">
        <div 
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#E1EBE3',
            borderRadius: '9999px',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <div 
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #52B788 0%, #1B4332 100%)',
              borderRadius: '9999px',
              transition: 'width 0.05s linear'
            }}
          />
        </div>
        <div className="flex items-center justify-between w-full px-1">
          <span 
            style={{ 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              letterSpacing: '0.06em',
              color: '#65776B',
              textTransform: 'uppercase',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {appMeta.statusText}
          </span>
          <span 
            style={{ 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              color: '#163D2B',
              fontFamily: "'Manrope', sans-serif"
            }}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes fdCinematic3DRotation {
          0% {
            opacity: 0;
            transform: perspective(1200px) rotateX(18deg) rotateY(-24deg) translateZ(50px) scale(0.85);
          }
          35% {
            opacity: 1;
            transform: perspective(1200px) rotateX(-8deg) rotateY(16deg) translateZ(35px) scale(1.04);
          }
          65% {
            transform: perspective(1200px) rotateX(4deg) rotateY(-8deg) translateZ(15px) scale(1.0);
          }
          85%, 100% {
            opacity: 1;
            transform: perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1.0);
          }
        }

        @keyframes fdGlossSweep {
          0% {
            transform: rotate(25deg) translateY(-140%);
          }
          40% {
            transform: rotate(25deg) translateY(-20%);
          }
          80%, 100% {
            transform: rotate(25deg) translateY(140%);
          }
        }

        @keyframes fdWordmarkReveal {
          0%, 30% {
            opacity: 0;
            transform: translateY(18px);
          }
          65% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fdAmbientRing {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.04);
            opacity: 0.9;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fd-intro-3d-stage,
          .fd-intro-wordmark-reveal {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FDCommonBrandIntro;
