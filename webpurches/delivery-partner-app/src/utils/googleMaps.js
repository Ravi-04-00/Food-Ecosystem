/**
 * Shared Google Maps JavaScript API Loader Singleton
 * Prevents multiple script injections and guarantees safe asynchronous loading
 * with configurable fallback when API key is missing or network is offline.
 */

let googleMapsPromise = null;

export const getGoogleMapsApiKey = () => {
  return import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
};

export const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && !!(window.google && window.google.maps);
};

export const loadGoogleMapsApi = (explicitKey = '') => {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = explicitKey || getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('MISSING_API_KEY'));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const scriptId = 'google-maps-api-script';
  const existingScript = document.getElementById(scriptId);

  googleMapsPromise = new Promise((resolve, reject) => {
    if (existingScript) {
      if (isGoogleMapsLoaded()) {
        resolve(window.google.maps);
        return;
      }
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (err) => {
        googleMapsPromise = null;
        reject(err);
      });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (isGoogleMapsLoaded()) {
        resolve(window.google.maps);
      } else {
        googleMapsPromise = null;
        reject(new Error('Google Maps script loaded but window.google.maps is undefined.'));
      }
    };

    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(new Error('Failed to load Google Maps script. Check network connection or API restrictions.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
