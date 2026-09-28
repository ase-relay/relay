'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    // Get API base URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const encodedApiUrl = encodeURIComponent(apiUrl);

    // Register service worker with API origin in query string
    navigator.serviceWorker
      .register(`/sw.js?api=${encodedApiUrl}`, {
        scope: '/',
      })
      .then((registration) => {
        console.log('[SW] Service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error);
      });

    // Listen for cache cleared message
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_CLEARED') {
        console.log('[SW] Cache cleared successfully');
        // Optionally reload page to fetch fresh data
        // window.location.reload();
      }
    });
  }, []);

  return null;
}
