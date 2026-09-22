import type { LocationSuggestion } from '@/services/mock/locationSearch';
import type { RoutingSearchData } from '@/types/api/routing';

// Task 1.3: membawa data lokasi lengkap (name + lat + lng) dari halaman Beranda ke halaman Cari Rute.
// sessionStorage dipilih (Opsi B) supaya struktur objek tidak dipecah ke query string dan tahan refresh
// dalam tab yang sama. Nama lokasi tetap dijalankan lewat query string (?origin=<nama>&destination=<nama>)
// sebagai fallback tampilan bila storage tidak tersedia.

const STORAGE_KEY = 'otewe.route-search.locations';

export interface RouteSearchLocations {
  origin: LocationSuggestion;
  destination: LocationSuggestion;
}

export function saveRouteSearchLocations(
  origin: LocationSuggestion,
  destination: LocationSuggestion,
): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ origin, destination } satisfies RouteSearchLocations),
    );
  } catch {
    // Storage bisa gagal (mis. private mode / kuota penuh) —
    // navigasi tetap lanjut, halaman tujuan memakai fallback nama dari query string.
  }
}

export function readRouteSearchLocations(): RouteSearchLocations | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RouteSearchLocations>;
    const isValid = (location: LocationSuggestion | undefined): location is LocationSuggestion =>
      !!location &&
      typeof location.name === 'string' &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number';

    if (!isValid(parsed?.origin) || !isValid(parsed?.destination)) return null;

    return { origin: parsed.origin, destination: parsed.destination };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Task 3.3: menyimpan hasil pencarian rute (response BE) ke sessionStorage agar
// halaman detail (/cari-rute/[routeId]) bisa membaca rute berdasarkan ID route param.
// Kontrak BE belum menyediakan endpoint detail-by-ID, jadi data dibawa dari hasil
// pencarian (pola sama dengan Task 1.3).
// ---------------------------------------------------------------------------

const RESULTS_STORAGE_KEY = 'otewe.route-search.results';

export function saveRouteSearchResults(data: RoutingSearchData): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage bisa gagal (private mode / kuota penuh) — halaman detail akan
    // menampilkan state "rute tidak ditemukan" bila datanya tidak tersedia.
  }
}

export function readRouteSearchResults(): RoutingSearchData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(RESULTS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RoutingSearchData> | null;
    const routes = parsed?.routes;
    if (!Array.isArray(routes)) return null;

    // Validasi minim: setiap rute minimal punya `id` (string) & `legs` (array).
    // Sisanya dipercaya mengikuti kontrak BE karena tidak pernah diubah manual.
    const isValid = routes.every(
      (route) => typeof route?.id === 'string' && Array.isArray(route?.legs),
    );
    if (!isValid) return null;

    return parsed as RoutingSearchData;
  } catch {
    return null;
  }
}
