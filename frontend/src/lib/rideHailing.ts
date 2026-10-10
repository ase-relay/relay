/**
 * Deep link ke aplikasi ojek online (Gojek / Grab).
 *
 * Batasan jujur: tidak ada API publik resmi untuk membuka form order dengan
 * tujuan terisi — tombol ini membuka APLIKASI, bukan memesan langsung.
 *
 * Bila aplikasi tidak terinstal, fallback ke halaman store (package Android &
 * ID App Store iOS terverifikasi via Apple Search API).
 */

export type RideHailingId = 'gojek' | 'grab';
export type MobilePlatform = 'android' | 'ios' | 'desktop';

export interface RideHailingProvider {
  id: RideHailingId;
  name: string;
  /** URL pembuka aplikasi di mobile (skema aplikasi atau universal link). */
  appUrl: string;
  androidAppUrl?: string;
  /** Fallback bila aplikasi tidak ada. */
  playStoreUrl: string;
  appStoreUrl: string;
}

const GRAB_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger';

export const RIDE_HAILING_PROVIDERS: RideHailingProvider[] = [
  {
    id: 'gojek',
    name: 'Gojek',
    appUrl: 'gojek://goride',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.gojek.app',
    appStoreUrl: 'https://apps.apple.com/id/app/gojek/id944875099',
  },
  {
    id: 'grab',
    name: 'Grab',
    appUrl: 'https://applink.grab.com/open',
    androidAppUrl:
      'intent://open?service=bike#Intent;scheme=grab;package=com.grabtaxi.passenger;' +
      `S.browser_fallback_url=${encodeURIComponent(GRAB_PLAY_STORE)};end`,
    playStoreUrl: GRAB_PLAY_STORE,
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

/**
 * Teks tujuan yang disalin ke clipboard: "Nama, Alamat lengkap" (atau salah
 * satu bila yang lain kosong). Destinasi dipilih karena field inilah yang
 * selalu diisi manual di aplikasi ojek (titik jemput biasanya terdeteksi).
 */
export function buildDropoffText(name: string, address: string): string {
  const parts = [name.trim(), address.trim()].filter((part) => part !== '');
  return parts.join(', ');
}

/**
 * Salin teks ke clipboard. True bila berhasil. Aman di SSR / browser tanpa
 * Clipboard API (false) — pemanggil tetap membuka aplikasi seperti biasa.
 */
export async function copyTripText(text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText || text.trim() === '') {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const APP_OPEN_FALLBACK_MS = 1800;

/**
 * Buka aplikasi ojek. Mobile: coba skema aplikasi, fallback ke store bila
 * aplikasi tidak terinstal. Fallback DIBATALKAN seketika halaman disembunyikan
 * (bukti aplikasi sudah terbuka) — mencegah redirect nyasar ke store setelah
 * user kembali ke web. Desktop: langsung buka halaman store di tab baru
 * (skema aplikasi tidak berguna di desktop).
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

  let settled = false;
  const cancelFallback = () => {
    settled = true;
    document.removeEventListener('visibilitychange', onHidden);
    window.removeEventListener('pagehide', onHidden);
  };
  const onHidden = () => cancelFallback();
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('pagehide', onHidden);

  const fallbackToStore = () => {
    if (!settled && !document.hidden) window.location.href = storeUrl;
    cancelFallback();
  };

  // Android + URL intent eksplisit: serahkan sepenuhnya ke Chrome (fallback
  // native, tanpa timer). Kasus lain: skema kustom via iframe tersembunyi,
  // universal link https via navigasi top-level — keduanya dengan timer fallback.
  const openUrl = current === 'android' && provider.androidAppUrl ? provider.androidAppUrl : provider.appUrl;
  const useNativeFallback = openUrl.startsWith('intent://');
  if (useNativeFallback) {
    window.location.href = openUrl;
    cancelFallback();
    return;
  }

  const useHiddenIframe = current === 'android' && !openUrl.startsWith('https://');
  if (useHiddenIframe) {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = openUrl;
    document.body.appendChild(frame);
    window.setTimeout(() => {
      frame.remove();
      fallbackToStore();
    }, APP_OPEN_FALLBACK_MS);
  } else {
    window.location.href = openUrl;
    window.setTimeout(fallbackToStore, APP_OPEN_FALLBACK_MS);
  }
}
