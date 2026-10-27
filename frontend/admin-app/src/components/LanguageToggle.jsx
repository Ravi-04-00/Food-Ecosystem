import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';
import { updateUserSettings } from '../services/api.js';

export const LanguageToggle = ({ className = '', style = {}, showLabel = true }) => {
  const { currentLang, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = async (newLang) => {
    setLanguage(newLang);
    setIsOpen(false);

    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('fd_admin_token') || localStorage.getItem('fd_access_token'))
      : null;

    if (token) {
      try {
        await updateUserSettings({ language: newLang });
      } catch {
        // Quiet fail
      }
    }
  };

  const getLangBadge = () => {
    if (currentLang === 'ta') return 'தமிழ்';
    if (currentLang === 'hi') return 'हिन्दी';
    return 'EN';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="Switch Language / மொழியை மாற்றுக / भाषा बदलें"
        aria-label="Select Language"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--ws-border)',
          borderRadius: '8px',
          height: '34px',
          padding: showLabel ? '0 10px' : '0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          color: 'var(--ws-text-primary)',
          boxShadow: 'var(--ws-shadow-sm)',
          transition: 'all 0.2s ease',
          fontSize: '0.78rem',
          fontWeight: 700,
          flexShrink: 0,
          ...style
        }}
      >
        <Globe size={15} color={currentLang !== 'en' ? "#4ADE80" : "#22C55E"} />
        {showLabel && (
          <span style={{ letterSpacing: '0.2px' }}>
            {getLangBadge()}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          zIndex: 100,
          minWidth: '150px',
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '8px',
          boxShadow: 'var(--ws-shadow-card)',
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.15s ease'
        }}>
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: currentLang === 'en' ? 'rgba(34, 197, 94, 0.14)' : 'transparent',
              color: currentLang === 'en' ? '#22C55E' : 'var(--ws-text-primary)',
              fontWeight: currentLang === 'en' ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <span>English</span>
            {currentLang === 'en' && <Check size={13} color="#22C55E" strokeWidth={3} />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectLanguage('ta')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: currentLang === 'ta' ? 'rgba(34, 197, 94, 0.14)' : 'transparent',
              color: currentLang === 'ta' ? '#22C55E' : 'var(--ws-text-primary)',
              fontWeight: currentLang === 'ta' ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <span>தமிழ் (Tamil)</span>
            {currentLang === 'ta' && <Check size={13} color="#22C55E" strokeWidth={3} />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectLanguage('hi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: currentLang === 'hi' ? 'rgba(34, 197, 94, 0.14)' : 'transparent',
              color: currentLang === 'hi' ? '#22C55E' : 'var(--ws-text-primary)',
              fontWeight: currentLang === 'hi' ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <span>हिन्दी (Hindi)</span>
            {currentLang === 'hi' && <Check size={13} color="#22C55E" strokeWidth={3} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;
