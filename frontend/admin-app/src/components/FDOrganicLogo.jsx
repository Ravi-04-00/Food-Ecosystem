import React from 'react';

/**
 * FDOrganicLogo — Official FD Foods Brand Logo System
 * Matches the exact reference design:
 * - 3D Sculpted 'FD' Monogram with dual organic green leaves in the center loop
 * - Color Palette: Deep Royal Green (#163D2B), Fresh Green (#52B788), Mint Green (#B7E4C7)
 * - Wordmark: "FD Foods" in bold Manrope font (#163D2B)
 * - Tagline: "Fresh Choices. Royal Experiences." (#65776B)
 */
export const FDOrganicLogo = ({
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero'
  layout = 'horizontal', // 'horizontal' | 'vertical' | 'symbol-only'
  showWordmark = true,
  showTagline = false,
  tagline = 'Fresh Choices. Royal Experiences.',
  appName = null,
  theme = 'light',
  className = '',
  onClick
}) => {
  const isDark = theme === 'dark';

  const sizeMap = {
    xs: { symbol: 24, text: '0.85rem', sub: '0.55rem', gap: '6px' },
    sm: { symbol: 32, text: '1.05rem', sub: '0.62rem', gap: '8px' },
    md: { symbol: 42, text: '1.35rem', sub: '0.70rem', gap: '10px' },
    lg: { symbol: 54, text: '1.65rem', sub: '0.80rem', gap: '12px' },
    xl: { symbol: 72, text: '2.10rem', sub: '0.90rem', gap: '14px' },
    '2xl': { symbol: 96, text: '2.60rem', sub: '1.00rem', gap: '16px' },
    hero: { symbol: 120, text: '3.20rem', sub: '1.15rem', gap: '20px' }
  };

  const current = sizeMap[size] || sizeMap.md;
  const isHorizontal = layout === 'horizontal';
  const isSymbolOnly = layout === 'symbol-only';

  const deepGreen = isDark ? '#FFFFFF' : '#163D2B';
  const freshGreen = '#52B788';
  const mintGreen = '#B7E4C7';
  const subTextColor = isDark ? '#B7E4C7' : '#65776B';

  const symbolSVG = (
    <svg 
      width={current.symbol} 
      height={current.symbol} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        filter: 'drop-shadow(0 4px 10px rgba(22, 61, 43, 0.16))',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="fd-symbol-mark"
    >
      <defs>
        {/* Deep Royal Green Gradient for FD Ribbon */}
        <linearGradient id="fdRibbonGrad" x1="12" y1="10" x2="88" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B4332" />
          <stop offset="50%" stopColor="#163D2B" />
          <stop offset="100%" stopColor="#0B2016" />
        </linearGradient>

        {/* 3D Highlight for Top Curves */}
        <linearGradient id="fdHighlightGrad" x1="15" y1="15" x2="65" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#52B788" />
          <stop offset="60%" stopColor="#2D6A4F" />
          <stop offset="100%" stopColor="#163D2B" />
        </linearGradient>

        {/* Dual Fresh Leaves Gradient */}
        <linearGradient id="fdLeafGrad1" x1="40" y1="30" x2="70" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#95D5B2" />
          <stop offset="45%" stopColor="#52B788" />
          <stop offset="100%" stopColor="#2D6A4F" />
        </linearGradient>
        <linearGradient id="fdLeafGrad2" x1="48" y1="42" x2="68" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B7E4C7" />
          <stop offset="50%" stopColor="#74C69D" />
          <stop offset="100%" stopColor="#40916C" />
        </linearGradient>

        {/* Soft dimensional shadow inside monogram */}
        <filter id="fdInnerGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
          <feFlood floodColor="#52B788" floodOpacity="0.4" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* Main Stylized 3D Monogram Ribbon (Forms F & outer D loop) */}
      <path
        d="M 22 18 
           C 22 14, 26 12, 32 12 
           L 58 12 
           C 78 12, 90 26, 90 50 
           C 90 74, 76 88, 54 88 
           L 30 88 
           C 25 88, 22 84, 22 80 
           L 22 18 Z"
        fill="url(#fdRibbonGrad)"
      />

      {/* 3D Top Bevel Highlight for Monogram */}
      <path
        d="M 22 18 
           C 22 14, 26 12, 32 12 
           L 56 12 
           C 72 12, 82 22, 85 38 
           C 79 26, 68 20, 52 20 
           L 30 20 
           L 30 52 
           L 22 52 Z"
        fill="url(#fdHighlightGrad)"
        opacity="0.85"
      />

      {/* Center Void / Cavity inside D */}
      <path
        d="M 38 28 
           L 54 28 
           C 68 28, 74 38, 74 50 
           C 74 64, 66 72, 52 72 
           L 38 72 Z"
        fill={isDark ? '#062817' : '#F7FBF7'}
      />

      {/* Middle Crossbar of F */}
      <path
        d="M 22 46 
           L 46 46 
           C 48 46, 50 48, 50 51 
           L 50 53 
           C 50 56, 48 58, 46 58 
           L 22 58 Z"
        fill="url(#fdRibbonGrad)"
      />

      {/* Primary Leaf Nestled in D cavity (curving upward) */}
      <path
        d="M 44 68 
           C 44 48, 52 34, 66 26 
           C 68 36, 66 52, 52 64 
           C 48 68, 44 68, 44 68 Z"
        fill="url(#fdLeafGrad1)"
        filter="drop-shadow(0 2px 4px rgba(22, 61, 43, 0.25))"
      />

      {/* Secondary Companion Leaf (soft curving right) */}
      <path
        d="M 48 64 
           C 54 52, 64 42, 75 38 
           C 76 46, 73 58, 62 66 
           C 56 70, 50 67, 48 64 Z"
        fill="url(#fdLeafGrad2)"
        opacity="0.95"
      />

      {/* Delicate Leaf Spine Vein */}
      <path
        d="M 46 66 
           Q 56 46, 66 28"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );

  if (isSymbolOnly) {
    return (
      <div 
        className={`inline-flex items-center justify-center select-none ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        role="img"
        aria-label="FD Foods Logo"
      >
        {symbolSVG}
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-center text-center'} select-none ${className}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        gap: current.gap,
        textDecoration: 'none'
      }}
      role="banner"
      aria-label="FD Foods"
    >
      {symbolSVG}

      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: isHorizontal ? 'left' : 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isHorizontal ? 'flex-start' : 'center' }}>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: current.text,
              letterSpacing: '-0.02em',
              color: deepGreen,
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              FD Foods
            </span>
            {appName && (
              <span style={{
                fontSize: '0.65rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: '#D8F3DC',
                color: '#163D2B',
                padding: '2px 7px',
                borderRadius: '6px'
              }}>
                {appName}
              </span>
            )}
          </div>

          {(showTagline || tagline) && (
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: current.sub,
              letterSpacing: '0.01em',
              color: subTextColor,
              marginTop: '3px'
            }}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FDOrganicLogo;
