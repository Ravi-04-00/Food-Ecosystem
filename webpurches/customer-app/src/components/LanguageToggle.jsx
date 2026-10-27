import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation, applyLanguage } from '../utils/i18n.js';
import { updateUserSettings } from '../services/api.js';

export const LanguageToggle = ({ className = '', style = {}, showLabel = true }) => {
  const { currentLang, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
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

    // Sync to backend user settings if logged in
    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('fd_customer_token') || localStorage.getItem('fd_access_token'))
      : null;

    if (token) {
      try {
        await updateUserSettings({ language: newLang });
      } catch {
        // Quiet fail - local preference already persisted
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
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '12px',
          height: '40px',
          padding: showLabel ? '0 12px' : '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          cursor: 'pointer',
          color: 'var(--ws-text-primary)',
          boxShadow: 'var(--ws-shadow-sm)',
          transition: 'all 0.2s ease',
          fontSize: '0.82rem',
          fontWeight: 700,
          flexShrink: 0,
          ...style
        }}
      >
        <Globe size={17} color={currentLang !== 'en' ? "#22C55E" : "#16A34A"} />
        {showLabel && (
          <span style={{ letterSpacing: '0.2px' }}>
            {getLangBadge()}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          zIndex: 100,
          minWidth: '150px',
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '12px',
          boxShadow: 'var(--ws-shadow-card)',
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* English Option */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: currentLang === 'en' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              color: currentLang === 'en' ? '#16A34A' : 'var(--ws-text-primary)',
              fontWeight: currentLang === 'en' ? 800 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <span>English</span>
            {currentLang === 'en' && <Check size={14} color="#16A34A" strokeWidth={3} />}
          </button>

          {/* Tamil Option */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('ta')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: currentLang === 'ta' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              color: currentLang === 'ta' ? '#16A34A' : 'var(--ws-text-primary)',
              fontWeight: currentLang === 'ta' ? 800 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <span>தமிழ் (Tamil)</span>
            {currentLang === 'ta' && <Check size={14} color="#16A34A" strokeWidth={3} />}
          </button>

          {/* Hindi Option */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('hi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: currentLang === 'hi' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
              color: currentLang === 'hi' ? '#16A34A' : 'var(--ws-text-primary)',
              fontWeight: currentLang === 'hi' ? 800 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
          >
            <span>हिन्दी (Hindi)</span>
            {currentLang === 'hi' && <Check size={14} color="#16A34A" strokeWidth={3} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;
