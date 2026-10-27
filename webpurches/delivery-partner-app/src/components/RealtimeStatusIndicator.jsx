import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRealtime } from '../hooks/useRealtime.js';
import { ConnectionState } from '../utils/realtime.js';

export const RealtimeStatusIndicator = ({ appRole = 'DELIVERY', compact = false }) => {
  const { connectionState, isConnected, isReconnecting, isFailed, retryCount, reconnect } = useRealtime(appRole);
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusConfig = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return {
          dotClass: 'bg-emerald-500 animate-pulse',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          borderColor: 'border-emerald-500/30',
          labelEn: 'Fleet Grid Connected',
          labelTa: 'டெலிவரி நேரடி இணைப்பு',
          icon: CheckCircle2
        };
      case ConnectionState.RECONNECTING:
        return {
          dotClass: 'bg-amber-500 animate-ping',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-500/30',
          labelEn: `Reconnecting Dispatch (${retryCount}/10)`,
          labelTa: `மீண்டும் இணைக்கிறது (${retryCount}/10)`,
          icon: RefreshCw
        };
      case ConnectionState.CONNECTING:
        return {
          dotClass: 'bg-blue-500 animate-pulse',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-500/30',
          labelEn: 'Connecting to Fleet Grid...',
          labelTa: 'இணைக்கப்படுகிறது...',
          icon: RefreshCw
        };
      case ConnectionState.FAILED:
        return {
          dotClass: 'bg-red-500',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-500/30',
          labelEn: 'Realtime Paused (Polling Active)',
          labelTa: 'நேரடி இணைப்பு நிறுத்தப்பட்டது',
          icon: AlertCircle
        };
      case ConnectionState.UNAUTHORIZED:
        return {
          dotClass: 'bg-rose-500',
          textColor: 'text-rose-700 dark:text-rose-300',
          borderColor: 'border-rose-500/30',
          labelEn: 'Courier Auth Required',
          labelTa: 'உள்நுழைவு தேவை',
          icon: AlertCircle
        };
      case ConnectionState.DISCONNECTED:
      default:
        return {
          dotClass: 'bg-slate-400',
          textColor: 'text-slate-600 dark:text-slate-400',
          borderColor: 'border-slate-400/30',
          labelEn: 'Offline / GPS Fallback',
          labelTa: 'இணையமில்லை / ஆஃப்லைன்',
          icon: WifiOff
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div 
        className="relative inline-flex items-center cursor-pointer group"
        onClick={() => !isConnected && reconnect()}
        title={`${config.labelEn} / ${config.labelTa}`}
        role="status"
        aria-live="polite"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
      </div>
    );
  }

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setShowTooltip(prev => !prev)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm ${config.borderColor} ${config.textColor}`}
        aria-label={`Realtime status: ${config.labelEn}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
        <span className="font-semibold tracking-wide hidden sm:inline">
          {isConnected ? 'FLEET LIVE' : isReconnecting ? 'SYNCING' : 'OFFLINE'}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-1.5 w-60 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-slate-800 dark:text-slate-200">
          <div className="flex items-start gap-2 mb-2">
            <Icon className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold text-xs leading-tight">{config.labelEn}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-tamil mt-0.5">{config.labelTa}</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5">
            {isConnected ? (
              <span>Instant order dispatches, live route navigation, and telemetry sync active via Daphne.</span>
            ) : (
              <span>Realtime events delayed. REST polling is keeping your shift and offers up-to-date.</span>
            )}
          </div>
          {!isConnected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                reconnect();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconnect Now / மீண்டும் இணை</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
