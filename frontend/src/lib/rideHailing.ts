/**
 * Deep link ke aplikasi ojek online (Gojek / Grab).
 *
 * Batasan jujur: tidak ada API publik resmi untuk membuka form order dengan
 * tujuan terisi — tombol ini membuka APLIKASI (skema `gojek://` / `grab://`),
 * bukan memesan langsung. Bila aplikasi tidak terinstal, fallback ke halaman
 * store (package Android & ID App Store iOS terverifikasi via Apple Search API).
 */

export type RideHailingId = 'gojek' | 'grab';
export type MobilePlatform = 'android' | 'ios' | 'desktop';

export interface RideHailingProvider {
  id: RideHailingId;
  name: string;
  /** Skema aplikasi (membuka app bila terinstal). */
  schemeUrl: string;
  /** Fallback bila aplikasi tidak ada. */
  playStoreUrl: string;
  appStoreUrl: string;
}

export const RIDE_HAILING_PROVIDERS: RideHailingProvider[] = [
  {
    id: 'gojek',
    name: 'Gojek',
    schemeUrl: 'gojek://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.gojek.app',
    appStoreUrl: 'https://apps.apple.com/id/app/gojek/id944875099',
  },
  {
    id: 'grab',
    name: 'Grab',
    schemeUrl: 'grab://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger',
    appStoreUrl: 'https://apps.apple.com/id/app/grab-food-delivery-taxi-ride/id647268330',
  },
];

/** Deteksi platform dari user-agent (parameter agar bisa ditest). */
export function detectMobilePlatform(userAgent: string): MobilePlatform {
  const ua = userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'desktop';
}

export function getProvider(id: RideHailingId): RideHailingProvider {
  const provider = RIDE_HAILING_PROVIDERS.find((item) => item.id === id);
  if (!provider) throw new Error(`Provider ojek tidak dikenal: ${id}`);
  return provider;
}

export function getStoreUrl(provider: RideHailingProvider, platform: MobilePlatform): string {
  return platform === 'ios' ? provider.appStoreUrl : provider.playStoreUrl;
}

const APP_OPEN_FALLBACK_MS = 1800;

/**
 * Buka aplikasi ojek. Mobile: coba skema aplikasi, fallback ke store bila
 * halaman masih terlihat (aplikasi tidak terinstal). Desktop: langsung buka
 * halaman store di tab baru (skema aplikasi tidak berguna di desktop).
 */
export function openRideHailingApp(id: RideHailingId, platform?: MobilePlatform): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const provider = getProvider(id);
  const current = platform ?? detectMobilePlatform(window.navigator.userAgent);
  const storeUrl = getStoreUrl(provider, current);

  if (current === 'desktop') {
    window.open(storeUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const start = Date.now();
  const goStore = () => {
    if (!document.hidden && Date.now() - start < APP_OPEN_FALLBACK_MS + 3000) {
      window.location.href = storeUrl;
    }
  };

  if (current === 'android') {
    // iframe tersembunyi: bila skema tak dikenal, halaman utama tidak rusak
    // (tidak seperti direct navigation yang bisa mendarat di halaman error).
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = provider.schemeUrl;
    document.body.appendChild(frame);
    window.setTimeout(() => {
      frame.remove();
      goStore();
    }, APP_OPEN_FALLBACK_MS);
  } else {
    // iOS: skema di iframe tidak berpindah aplikasi — pakai navigasi langsung.
    window.location.href = provider.schemeUrl;
    window.setTimeout(goStore, APP_OPEN_FALLBACK_MS);
  }
}
