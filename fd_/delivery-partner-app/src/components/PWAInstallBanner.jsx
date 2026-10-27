import React, { useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';

export const PWAInstallBanner = ({
  isStandalone,
  isInstallable,
  installDismissed,
  platform,
  onPromptInstall,
  onDismissInstall,
  appName = 'Fast Delivery Driver'
}) => {
  const { t } = useTranslation();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isStandalone || installDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await onPromptInstall();
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="bg-[#F7FAF7] text-[#163D2B] px-3 sm:px-4 py-2 border-b border-[#E1EBE3] relative z-30 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#163D2B] text-[#52B788] font-black italic flex items-center justify-center shrink-0 text-xs shadow-xs">
              FD
            </div>
            <div className="truncate">
              <span className="font-bold text-[#163D2B] mr-2 text-xs sm:text-sm">
                {t('pwa.install_title') || `Install ${appName}`}
              </span>
              <span className="text-[#525760] hidden md:inline text-xs">
                {t('pwa.install_desc') || 'Add to home screen for real-time dispatch alerts and route navigation.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#163D2B] hover:bg-[#1B4332] text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('pwa.install_btn') || 'Install'}</span>
            </button>
            <button
              type="button"
              onClick={() => onDismissInstall(3)}
              aria-label="Dismiss install banner"
              className="p-1 rounded-md text-[#525760] hover:text-[#163D2B] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E1EBE3]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#163D2B] text-[#52B788] font-black italic flex items-center justify-center text-sm shadow-xs">
                  FD
                </div>
                <h3 className="font-bold text-[#163D2B] text-base">
                  {t('pwa.install_title') || 'Install Courier Fleet App'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {t('pwa.install_desc') || 'Add Courier Fleet to your home screen for rapid route access and real-time dispatch alerts.'}
            </p>

            <div className="space-y-3 bg-[#F7FAF7] p-3.5 rounded-xl border border-[#E1EBE3] text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#163D2B] text-white flex items-center justify-center font-bold shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-[#163D2B]">
                    {platform === 'ios'
                      ? (t('pwa.install_ios_step1') || 'Tap Share in Safari')
                      : (t('pwa.install_desktop_guide') || 'Click the install icon in your address bar')}
                  </p>
                  {platform === 'ios' && (
                    <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                      <Share className="w-3.5 h-3.5 text-blue-500" />
                      <span>Look for the square icon with an up arrow</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#163D2B] text-white flex items-center justify-center font-bold shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-[#163D2B]">
                    {t('pwa.install_ios_step2') || 'Select "Add to Home Screen"'}
                  </p>
                  <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-600" />
                    <span>Scroll down the sheet and tap Add</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#163D2B] hover:bg-[#1B4332] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
