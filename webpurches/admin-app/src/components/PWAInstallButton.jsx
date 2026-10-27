import React from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';

export const PWAInstallButton = ({
  isStandalone,
  onPromptInstall,
  className = ''
}) => {
  const { t } = useTranslation();

  if (isStandalone) {
    return null;
  }

  return (
    <button
      onClick={onPromptInstall}
      title={t('pwa.install_title') || 'Install App'}
      style={{
        background: 'rgba(34, 197, 94, 0.12)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '12px',
        padding: '7px 11px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        cursor: 'pointer',
        color: '#4ADE80',
        fontWeight: 700,
        fontSize: '0.8rem',
        transition: 'all 0.2s ease'
      }}
      className={`hover:bg-emerald-600 hover:text-white transition-all ${className}`}
    >
      <Download size={15} />
      <span className="hidden xl:inline">{t('pwa.install_app') || 'Install'}</span>
    </button>
  );
};
