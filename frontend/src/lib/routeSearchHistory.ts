import { CURRENT_LOCATION_ID } from '@/services/locationSearch';
import { distanceMeters } from '@/lib/utils';

// Riwayat pencarian lokasi halaman Beranda, disimpan di localStorage.
// Key menyertakan id user (bila ada) agar akun berbeda di browser yang sama
// tidak saling tercampur. Semua akses dibungkus try/catch + guard `window`
// karena halaman Next.js juga dirender di server (SSR).

export interface RouteSearchHistoryItem {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  timestamp: number;
}

type LocationInput = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
};

const BASE_STORAGE_KEY = 'otewe:route-search-history:v1';
const MAX_ITEMS = 8;
const DUPLICATE_DISTANCE_METERS = 50;

export function routeSearchHistoryStorageKey(userId?: number | null): string {
  return typeof userId === 'number' ? `${BASE_STORAGE_KEY}:${userId}` : BASE_STORAGE_KEY;
}

function isValidItem(value: unknown): value is RouteSearchHistoryItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<RouteSearchHistoryItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    typeof item.district === 'string' &&
    typeof item.lat === 'number' &&
    Number.isFinite(item.lat) &&
    typeof item.lng === 'number' &&
    Number.isFinite(item.lng) &&
    typeof item.timestamp === 'number'
  );
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isDuplicate(a: LocationInput, b: LocationInput): boolean {
  return (
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() ||
    distanceMeters(a, b) < DUPLICATE_DISTANCE_METERS
  );
}

export function readRouteSearchHistory(userId?: number | null): RouteSearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(routeSearchHistoryStorageKey(userId));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidItem).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeRouteSearchHistory(
  items: RouteSearchHistoryItem[],
  userId?: number | null,
): RouteSearchHistoryItem[] {
  try {
    window.localStorage.setItem(
      routeSearchHistoryStorageKey(userId),
      JSON.stringify(items.slice(0, MAX_ITEMS)),
    );
  } catch {
    // Storage bisa gagal (private mode / kuota penuh) — daftar tetap dipakai di memori.
  }
  return items.slice(0, MAX_ITEMS);
}

/** Tambah lokasi hasil pencarian; item terbaru di atas, duplikat dibuang, maksimal 8. */
export function addRouteSearchHistoryItems(
  locations: LocationInput[],
  userId?: number | null,
): RouteSearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  let items = readRouteSearchHistory(userId);
  const timestamp = Date.now();
  const newEntries = locations
    .filter(
      (location) =>
        location.id !== CURRENT_LOCATION_ID &&
        location.name.trim().length > 0 &&
        Number.isFinite(location.lat) &&
        Number.isFinite(location.lng),
    )
    .map((location) => ({
      id: createId(),
      name: location.name.trim(),
      district: location.district.trim(),
      lat: location.lat,
      lng: location.lng,
      timestamp,
    }));

  // Dibalik agar lokasi pertama (asal) berada paling atas setelah semua unshift.
  for (const entry of [...newEntries].reverse()) {
    items = [entry, ...items.filter((existing) => !isDuplicate(existing, entry))];
  }

  return writeRouteSearchHistory(items, userId);
}

export function removeRouteSearchHistoryItem(
  id: string,
  userId?: number | null,
): RouteSearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  const items = readRouteSearchHistory(userId).filter((item) => item.id !== id);
  return writeRouteSearchHistory(items, userId);
}

export function clearRouteSearchHistory(userId?: number | null): RouteSearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    window.localStorage.removeItem(routeSearchHistoryStorageKey(userId));
  } catch {
    // Abaikan bila storage tidak dapat diakses.
  }
  return [];
}
