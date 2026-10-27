/**
 * Fast Delivery Delivery Partner PWA Utilities & Service Worker Registration
 */

export const registerServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.localhost');

  if (window.location.protocol !== 'https:' && !isLocalhost) {
    console.warn('[PWA] Service Worker registration skipped: insecure origin');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent('fd_sw_update_available', { detail: { registration, waitingWorker: registration.waiting } })
          );
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(
                new CustomEvent('fd_sw_update_available', {
                  detail: { registration, waitingWorker: newWorker }
                })
              );
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
};

const getDefaultHealthUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_HEALTH_URL) {
    return import.meta.env.VITE_HEALTH_URL;
  }
  if (typeof window !== 'undefined') {
    const isStandardPort = window.location.port === '' || window.location.port === '80' || window.location.port === '443';
    if (isStandardPort) {
      return '/api/health/';
    }
  }
  return 'http://localhost:8000/api/health/';
};

export const checkBackendHealth = async (healthUrl) => {
  const targetUrl = healthUrl || getDefaultHealthUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
};
