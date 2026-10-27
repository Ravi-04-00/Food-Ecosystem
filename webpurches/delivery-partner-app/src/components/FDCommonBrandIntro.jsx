import React, { useEffect, useState, useCallback, useRef } from 'react';

/**
 * FDCommonBrandIntro — Pure Logo-Only Premium Opening Experience
 * 
 * Strict Phase 2 Specifications:
 * - Shows ONLY the iconic FD Foods leaf-inspired logo mark.
 * - ZERO words, ZERO taglines, ZERO buttons, ZERO loading messages.
 * - Warm royal-white / cosmic-latte background (#FFFFFF -> #FAF7F2 -> #F3EAE0)
 *   with subtle deep-burgundy depth tones (#4A1222) and restrained milk-green highlights (#52B788, #B7E4C7).
 * - Smooth reveal, elegant light sweep sheen, gentle scale motion with cubic-bezier easing.
 * - Runtime duration: ~2.0 seconds, dissolves seamlessly into the app.
 * - Respects prefers-reduced-motion (instant bypass).
 * - Session awareness: skips repeated blocking for returning users.
 * - Universal across Customer, Restaurant, Delivery Partner, and Admin apps.
 */
export const FDCommonBrandIntro = ({
  app = 'delivery',
  duration = 2.0,
  onComplete,
  className = ''
}) => {
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setExiting(true);
    try {
      sessionStorage.setItem('fd_intro_seen', 'true');
    } catch (_) {}
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 280);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    // 1. Accessibility: Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (onComplete) onComplete();
        return;
      }
    }

    // 2. Keyboard & Touch bypass (silent, no visible buttons)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 3. Timed animation progression (~1.9s before smooth exit transition)
    const timer = setTimeout(() => {
      handleFinish();
    }, Math.max(1500, Math.min(2500, duration * 1000 - 280)));

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [duration, handleFinish, onComplete]);

  return (
    <aside
      aria-label="FD Foods Intro"
      role="status"
      onClick={handleFinish}
      className={`fixed inset-0 z-[9999] flex items-center justify-center select-none cursor-pointer ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FAF7F2 50%, #F3EAE0 100%)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: exiting ? 'none' : 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Subtle deep-burgundy and warm milk-green ambient depth auras */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 'min(90vw, 420px)',
          height: 'min(90vw, 420px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74, 18, 34, 0.06) 0%, rgba(82, 183, 136, 0.12) 45%, transparent 70%)',
          animation: 'fdAmbientBreathe 2.4s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }}
      />

      {/* Decorative Outer Burgundy Accent Ring */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 'min(75vw, 240px)',
          height: 'min(75vw, 240px)',
          borderRadius: '50%',
          border: '1px solid rgba(92, 29, 46, 0.12)',
          boxShadow: '0 0 35px rgba(82, 183, 136, 0.14)',
          animation: 'fdRingPulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'none'
        }}
      />

      {/* Centered Logo Stage with 3D Depth & Light Sheen */}
      <div
        className="fd-logo-stage"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'clamp(120px, 28vw, 156px)',
          height: 'clamp(120px, 28vw, 156px)',
          borderRadius: 'clamp(32px, 7vw, 42px)',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #FAF6F0 60%, #E8F5E9 100%)',
          border: '1.5px solid rgba(82, 183, 136, 0.32)',
          boxShadow: '0 20px 48px -12px rgba(74, 18, 34, 0.14), 0 0 45px rgba(82, 183, 136, 0.22), inset 0 2px 4px rgba(255, 255, 255, 0.95)',
          animation: 'fdLogoReveal 2.0s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          willChange: 'transform, opacity'
        }}
      >
        {/* Gleaming Specular Light Sheen */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
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
              background: 'linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.85) 48%, rgba(183, 228, 199, 0.45) 53%, transparent 64%)',
              animation: 'fdSheenSweep 2.0s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
            }}
          />
        </div>

        {/* Pure Vector FD Foods Leaf Monogram (Zero Words / Text) */}
        <svg
          width="74%"
          height="74%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'relative',
            zIndex: 2,
            filter: 'drop-shadow(0 6px 14px rgba(74, 18, 34, 0.18))'
          }}
        >
          <defs>
            {/* Deep Royal Green Gradient with Burgundy Undertone */}
            <linearGradient id="fdIntroMonogramGrad" x1="12" y1="10" x2="88" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1B4332" />
              <stop offset="50%" stopColor="#163D2B" />
              <stop offset="100%" stopColor="#0B2016" />
            </linearGradient>

            {/* Top Curvature 3D Highlight */}
            <linearGradient id="fdIntroHighlightGrad" x1="15" y1="15" x2="65" y2="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#52B788" />
              <stop offset="60%" stopColor="#2D6A4F" />
              <stop offset="100%" stopColor="#163D2B" />
            </linearGradient>

            {/* Dual Fresh Leaves Gradients */}
            <linearGradient id="fdIntroLeafGrad1" x1="40" y1="30" x2="70" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#95D5B2" />
              <stop offset="45%" stopColor="#52B788" />
              <stop offset="100%" stopColor="#2D6A4F" />
            </linearGradient>

            <linearGradient id="fdIntroLeafGrad2" x1="48" y1="42" x2="68" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#B7E4C7" />
              <stop offset="50%" stopColor="#74C69D" />
              <stop offset="100%" stopColor="#40916C" />
            </linearGradient>
          </defs>

          {/* Main Stylized 3D Monogram Ribbon (Forms F & Outer D Loop) */}
          <path
            d="M 22 18 
               C 22 14, 26 12, 32 12 
               L 58 12 
               C 78 12, 90 26, 90 50 
               C 90 74, 76 88, 54 88 
               L 32 88 
               C 26 88, 22 84, 22 78 
               Z"
            fill="url(#fdIntroMonogramGrad)"
          />

          {/* Top Crossbar Highlight for 3D Sculpted Bevel */}
          <path
            d="M 24 16 
               C 24 13, 27 13, 32 13 
               L 58 13 
               C 74 13, 85 24, 86 44 
               C 78 26, 64 19, 48 19 
               L 24 19 
               Z"
            fill="url(#fdIntroHighlightGrad)"
            opacity="0.95"
          />

          {/* Inner Counter Hole */}
          <path
            d="M 38 32 
               L 52 32 
               C 64 32, 72 40, 72 50 
               C 72 60, 64 68, 52 68 
               L 38 68 
               Z"
            fill="#FAF6F0"
          />

          {/* Leaf 1: Ascending Fresh Green Leaf */}
          <path
            d="M 40 64 
               C 40 64, 42 42, 58 36 
               C 68 32, 70 38, 68 44 
               C 64 54, 52 62, 40 64 
               Z"
            fill="url(#fdIntroLeafGrad1)"
          />

          {/* Leaf 2: Overlapping Mint Sprout Leaf */}
          <path
            d="M 44 60 
               C 44 60, 48 46, 62 44 
               C 69 43, 71 47, 68 51 
               C 63 58, 54 61, 44 60 
               Z"
            fill="url(#fdIntroLeafGrad2)"
            opacity="0.9"
          />

          {/* Central Leaf Vein Accent */}
          <path
            d="M 43 62 C 49 52, 56 46, 64 41"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </div>

      <style>{`
        @keyframes fdLogoReveal {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          30% {
            opacity: 1;
            transform: scale(1.02);
          }
          70% {
            transform: scale(1.0);
          }
          100% {
            opacity: 1;
            transform: scale(1.0);
          }
        }

        @keyframes fdSheenSweep {
          0% {
            transform: rotate(25deg) translateY(-140%);
          }
          30% {
            transform: rotate(25deg) translateY(-40%);
          }
          75%, 100% {
            transform: rotate(25deg) translateY(140%);
          }
        }

        @keyframes fdAmbientBreathe {
          0% {
            transform: scale(0.96);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.06);
            opacity: 1;
          }
        }

        @keyframes fdRingPulse {
          0% {
            transform: scale(0.88);
            opacity: 0;
          }
          40% {
            opacity: 0.9;
          }
          100% {
            transform: scale(1.04);
            opacity: 0.5;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fd-logo-stage,
          [style*="animation"] {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </aside>
  );
};

export default FDCommonBrandIntro;
