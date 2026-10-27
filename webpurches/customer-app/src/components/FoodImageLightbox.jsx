import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export const FOOD_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';

/**
 * Centered image-preview lightbox. No navigation: closes in place via
 * close button, outside click, or Escape. Scroll position is preserved
 * (body scroll is locked while open and restored on close).
 */
export const FoodImageLightbox = ({ src, alt, onClose }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!src && !failed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `${alt} — image preview` : 'Food image preview'}
      onClick={() => onClose && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        backgroundColor: 'rgba(8, 9, 13, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '720px', width: '100%' }}
      >
        <button
          type="button"
          autoFocus
          onClick={() => onClose && onClose()}
          aria-label="Close image preview"
          style={{
            position: 'absolute',
            top: '-44px',
            right: 0,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>
        {failed ? (
          <div style={{
            width: '100%',
            minHeight: '280px',
            borderRadius: '16px',
            background: '#141A23',
            color: '#8B929D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            padding: '24px',
            textAlign: 'center'
          }}>
            Image unavailable right now. Please try again later.
          </div>
        ) : (
          <img
            src={src || FOOD_IMAGE_FALLBACK}
            alt={alt || 'Food image preview'}
            onError={() => setFailed(true)}
            style={{
              width: '100%',
              maxHeight: '76vh',
              objectFit: 'contain',
              borderRadius: '16px',
              background: '#141A23',
              display: 'block'
            }}
          />
        )}
      </div>
    </div>
  );
};
