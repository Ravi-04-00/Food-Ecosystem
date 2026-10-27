import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../utils/pwa.js';

export const usePWA = (options = {}) => {
  const { healthCheckUrl } = options;

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showOnlineRestored, setShowOnlineRestored] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    const dismissedUntil = localStorage.getItem('fd_restaurant_install_dismissed_until');
    return dismissedUntil ? Number(dismissedUntil) > Date.now() : false;
  });

  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });

  const platform = (() => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  })();

  const verifyConnectivity = useCallback(async () => {
    setIsCheckingHealth(true);
    if (!navigator.onLine) {
      setIsOnline(false);
      setIsBackendReachable(false);
      setIsCheckingHealth(false);
      return false;
    }
    const reachable = await checkBackendHealth(healthCheckUrl);
    setIsOnline(true);
    setIsBackendReachable(reachable);
    setIsCheckingHealth(false);
    return reachable;
  }, [healthCheckUrl]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const reachable = await verifyConnectivity();
      if (reachable) {
        setShowOnlineRestored(true);
        setTimeout(() => setShowOnlineRestored(false), 3500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsBackendReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      verifyConnectivity();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [verifyConnectivity]);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleSWUpdate = (e) => {
      setSwUpdateAvailable(true);
      if (e.detail?.waitingWorker) {
        setWaitingWorker(e.detail.waitingWorker);
      }
    };

    window.addEventListener('fd_sw_update_available', handleSWUpdate);
    return () => {
      window.removeEventListener('fd_sw_update_available', handleSWUpdate);
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsStandalone(e.matches);
    try {
      mql.addEventListener('change', handleChange);
    } catch {
      mql.addListener(handleChange);
    }
    return () => {
      try {
        mql.removeEventListener('change', handleChange);
      } catch {
        mql.removeListener(handleChange);
      }
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  };

  const dismissInstall = (days = 3) => {
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem('fd_restaurant_install_dismissed_until', String(expiry));
    setInstallDismissed(true);
  };

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return {
    isOnline,
    isBackendReachable,
    isFullyConnected: isOnline && isBackendReachable,
    isCheckingHealth,
    showOnlineRestored,
    verifyConnectivity,
    isStandalone,
    isInstalled,
    isInstallable: !!deferredPrompt && !isStandalone,
    installDismissed,
    platform,
    promptInstall,
    dismissInstall,
    swUpdateAvailable,
    applyUpdate
  };
};
