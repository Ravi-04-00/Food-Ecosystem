import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';

export const ConnectivityBanner = ({
  isOnline,
  isBackendReachable,
  isCheckingHealth,
  showOnlineRestored,
  onRetry,
  role = 'restaurant'
}) => {
  const { t } = useTranslation();

  if (showOnlineRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative z-40 w-full bg-[#16A34A] text-white px-4 py-2 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 shadow-md animate-fadeIn"
      >
        <Wifi className="w-4 h-4" />
        <span>{t('pwa.online_restored') || 'Kitchen Hub connected!'}</span>
      </div>
    );
  }

  if (isOnline && isBackendReachable) {
    return null;
  }

  const isServerDown = isOnline && !isBackendReachable;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative z-40 w-full bg-[#062817] text-white border-b border-amber-500/40 px-3 md:px-6 py-2.5 shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs md:text-sm">
        <div className="flex items-center gap-2 text-left">
          {isServerDown ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div>
            <span className="font-bold text-amber-300 mr-2">
              {isServerDown
                ? 'Backend Reconnecting'
                : (t('pwa.offline_badge') || 'Kitchen Offline')}
            </span>
            <span className="text-slate-300">
              {t('pwa.offline_banner_desc') || 'Real-time order receipts, kitchen status toggles, and settlements require an active connection.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button"
            onClick={onRetry}
            disabled={isCheckingHealth}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>
              {isCheckingHealth
                ? (t('pwa.checking_connection') || 'Checking...')
                : (t('pwa.retry_connection') || 'Reconnect Hub')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
