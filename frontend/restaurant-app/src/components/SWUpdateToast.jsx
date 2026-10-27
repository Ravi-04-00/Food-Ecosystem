import React, { useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';

export const SWUpdateToast = ({
  swUpdateAvailable,
  onApplyUpdate
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!swUpdateAvailable || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-[#062817] text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3 animate-slideUp"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-300">
            {t('pwa.update_title') || 'App Update Available'}
          </h4>
          <p className="text-[11px] text-slate-300">
            {t('pwa.update_desc') || 'A new version of Fast Delivery Partner is ready.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button type="button"
          onClick={onApplyUpdate}
          className="px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-[#062817] text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{t('pwa.update_now') || 'Update'}</span>
        </button>
        <button type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
