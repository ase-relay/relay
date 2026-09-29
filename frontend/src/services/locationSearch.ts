import { stops } from '@/lib/mock/stops';
import { distanceMeters } from '@/lib/utils';

// Service pencarian lokasi frontend.
// - Data halte/stasiun lokal dicari sinkron dari lib/mock/stops (tanpa jaringan).
// - Tempat umum dicari lewat provider geocoding (Photon) lewat interface LocationProvider
//   agar mudah diganti ke Nominatim/Google/endpoint backend tanpa menyentuh pemanggil.

export interface LocationSuggestion {
  id: string;
  name: string;
  district: string;
  /** Latitude lokasi — wajib untuk kontrak request BE (origin.lat / destination.lat) */
  lat: number;
  /** Longitude lokasi — wajib untuk kontrak request BE (origin.lng / destination.lng) */
  lng: number;
  /** Label kecil untuk tempat dari data lokal ("Halte" | "Stasiun"). */
  tag?: 'Halte' | 'Stasiun';
}

export interface LocationSearchOptions {
  /**
   * Sinyal pembatalan milik pemanggil. Request yang sudah berjalan tidak dibatalkan
   * (hasilnya tetap dipakai untuk cache), tetapi pemanggil tetap memeriksa sinyal
   * sebelum dan sesudah menunggu agar tidak memakai hasil basi.
   */
  signal?: AbortSignal;
  /** Jumlah hasil maksimal yang dikembalikan ke pemanggil. */
  limit?: number;
}

export interface LocationProvider {
  readonly name: string;
  search(query: string, options?: LocationSearchOptions): Promise<LocationSuggestion[]>;
}

export type LocationServiceErrorKind =
  | 'network'
  | 'timeout'
  | 'rate-limit'
  | 'unavailable'
  | 'not-found';

export class LocationServiceError extends Error {
  readonly kind: LocationServiceErrorKind;

  constructor(kind: LocationServiceErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'LocationServiceError';
    this.kind = kind;
  }
}

export const LOCATION_UNAVAILABLE_MESSAGE =
  'Layanan pencarian lokasi sedang tidak tersedia. Coba lagi sebentar.';
export const LOCATION_NOT_FOUND_MESSAGE = 'Lokasi tidak ditemukan. Coba kata kunci lain.';

export const MIN_QUERY_LENGTH = 2;

/** ID khusus opsi "Lokasi saya" (hasil GPS) — tidak boleh disimpan ke riwayat. */
export const CURRENT_LOCATION_ID = 'current-location';

export function locationErrorMessage(error: unknown): string {
  return error instanceof LocationServiceError && error.kind === 'not-found'
    ? LOCATION_NOT_FOUND_MESSAGE
    : LOCATION_UNAVAILABLE_MESSAGE;
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'AbortError'
  );
}

/** Batas wilayah pencarian Bandung–Cimahi (format Photon: minLng,minLat,maxLng,maxLat). */
export const BANDUNG_BBOX = { minLng: 107.45, minLat: -7.1, maxLng: 107.8, maxLat: -6.75 } as const;

/** Pusat bias pencarian (Alun-Alun Bandung) agar hasil terdekat muncul lebih dulu. */
export const BANDUNG_CENTER = { lat: -6.9175, lng: 107.6191 } as const;

const BBOX_PARAM = `${BANDUNG_BBOX.minLng},${BANDUNG_BBOX.minLat},${BANDUNG_BBOX.maxLng},${BANDUNG_BBOX.maxLat}`;

export function isWithinBandungBbox(lat: number, lng: number): boolean {
  return (
    lat >= BANDUNG_BBOX.minLat &&
    lat <= BANDUNG_BBOX.maxLat &&
    lng >= BANDUNG_BBOX.minLng &&
    lng <= BANDUNG_BBOX.maxLng
  );
}

function isSameLocation(a: LocationSuggestion, b: LocationSuggestion): boolean {
  return (
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() || distanceMeters(a, b) < 50
  );
}

/** Gabung dua daftar: buang duplikat by id, nama sama, atau jarak < 50 m. */
export function mergeLocationSuggestions(
  base: LocationSuggestion[],
  extra: LocationSuggestion[],
): LocationSuggestion[] {
  const merged = [...base];
  const seenIds = new Set(base.map((item) => item.id));
  for (const item of extra) {
    if (seenIds.has(item.id)) continue;
    if (merged.some((existing) => isSameLocation(existing, item))) continue;
    seenIds.add(item.id);
    merged.push(item);
  }
  return merged;
}

/** Cari halte/stasiun dari data lokal (sinkron, tanpa jaringan). */
export function searchLocalStops(query: string, limit = 5): LocationSuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_QUERY_LENGTH) return [];

  return stops
    .filter(
      (stop) =>
        stop.name.toLowerCase().includes(normalized) ||
        stop.district.toLowerCase().includes(normalized),
    )
    .slice(0, limit)
    .map((stop) => ({
      id: stop.id,
      name: stop.name,
      district: stop.district,
      lat: stop.latitude,
      lng: stop.longitude,
      tag: stop.name.toLowerCase().startsWith('stasiun') ? 'Stasiun' : 'Halte',
    }));
}

// ---------------------------------------------------------------------------
// Provider Photon (https://photon.komoot.io) — dokumentasi resmi komoot/photon:
//   GET /api/?q=...&bbox=minLon,minLat,maxLon,maxLat&lat=..&lon=..&limit=..
//   Respons GeoJSON FeatureCollection, koordinat [lng, lat].
// Fair-use: debounce di hook, cache in-memory per query, dan timeout per request.
// ---------------------------------------------------------------------------

const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';
// Latensi Photon dari jaringan lokal terukur 1,7–3,9 dtk per request; timeout 4 dtk
// memicu galat "tidak tersedia" palsu, jadi beri ruang lebih (tetap dibatasi).
const PHOTON_TIMEOUT_MS = 8_000;
// Selalu minta sebanyak ini ke Photon, lalu potong sesuai limit pemanggil —
// agar cache/pending cukup disimpan per teks query tanpa peduli limit.
const PHOTON_FETCH_LIMIT = 8;
const PHOTON_CACHE_TTL_MS = 5 * 60_000;
const PHOTON_CACHE_MAX_ENTRIES = 60;

interface PhotonProperties {
  osm_type?: string;
  osm_id?: number;
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface PhotonFeature {
  properties?: PhotonProperties;
  geometry?: { coordinates?: unknown } | null;
}

interface PhotonFeatureCollection {
  features?: PhotonFeature[];
}

const photonCache = new Map<string, { timestamp: number; results: LocationSuggestion[] }>();
/** Request aktif per teks query — pemanggil berikutnya menumpuk pada promise yang sama. */
const photonPending = new Map<string, Promise<LocationSuggestion[]>>();

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildName(properties: PhotonProperties): string {
  const street = [properties.street, properties.housenumber].filter(nonEmpty).join(' ');
  const candidate = [properties.name, street, properties.city, properties.district].find(nonEmpty);
  return candidate ? truncateText(candidate.trim(), 70) : '';
}

function buildDistrict(properties: PhotonProperties): string {
  const parts = [properties.district, properties.city, properties.state].filter(nonEmpty);
  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.length > 0 ? truncateText(uniqueParts.join(', '), 90) : '';
}

function mapPhotonFeatures(collection: PhotonFeatureCollection): LocationSuggestion[] {
  const items: LocationSuggestion[] = [];
  const seenIds = new Set<string>();

  for (const feature of collection.features ?? []) {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const [lng, lat] = coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') continue;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    // Buang hasil di luar bbox Bandung–Cimahi (double-check setelah server filter).
    if (!isWithinBandungBbox(lat, lng)) continue;

    const properties = feature.properties ?? {};
    const name = buildName(properties);
    if (!name) continue;

    const id =
      nonEmpty(properties.osm_type) && typeof properties.osm_id === 'number'
        ? `photon:${properties.osm_type}${properties.osm_id}`
        : `photon:${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    items.push({ id, name, district: buildDistrict(properties), lat, lng });
  }

  return items;
}

/**
 * Request Photon sungguhan dengan controller dan timeout sendiri (tidak terikat
 * signal pemanggil, agar satu pemanggil yang batal tidak mematikan pemanggil lain).
 * Hasil sukses langsung dimasukkan ke cache.
 */
async function fetchPhotonResults(key: string, query: string): Promise<LocationSuggestion[]> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PHOTON_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      q: query,
      bbox: BBOX_PARAM,
      lat: String(BANDUNG_CENTER.lat),
      lon: String(BANDUNG_CENTER.lng),
      limit: String(PHOTON_FETCH_LIMIT),
    });
    const response = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new LocationServiceError(
        response.status === 429 ? 'rate-limit' : 'unavailable',
        `Photon merespons HTTP ${response.status}`,
      );
    }
    const collection = (await response.json()) as PhotonFeatureCollection;
    const results = mapPhotonFeatures(collection);

    photonCache.set(key, { timestamp: Date.now(), results });
    if (photonCache.size > PHOTON_CACHE_MAX_ENTRIES) {
      const oldestKey = photonCache.keys().next().value;
      if (oldestKey !== undefined) photonCache.delete(oldestKey);
    }
    return results;
  } catch (error) {
    if (error instanceof LocationServiceError) throw error;
    if (isAbortError(error)) {
      // Timeout memakai AbortController yang sama — tidak ada signal pemanggil di sini.
      if (timedOut) {
        throw new LocationServiceError('timeout', 'Permintaan geocoder melebihi batas waktu');
      }
      throw error;
    }
    throw new LocationServiceError(
      'network',
      error instanceof Error ? error.message : 'Gagal menghubungi layanan geocoder',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchPhoton(
  query: string,
  options: LocationSearchOptions = {},
): Promise<LocationSuggestion[]> {
  const normalized = query.trim();
  const limit = options.limit ?? PHOTON_FETCH_LIMIT;
  const key = normalized.toLowerCase();

  const cached = photonCache.get(key);
  if (cached && Date.now() - cached.timestamp < PHOTON_CACHE_TTL_MS) {
    return cached.results.slice(0, limit);
  }

  const externalSignal = options.signal;
  if (externalSignal?.aborted) throw new DOMException('Permintaan dibatalkan', 'AbortError');

  let pending = photonPending.get(key);
  if (!pending) {
    pending = fetchPhotonResults(key, normalized);
    photonPending.set(key, pending);
    void pending.catch(() => undefined).finally(() => photonPending.delete(key));
  }

  const results = await pending;
  if (externalSignal?.aborted) throw new DOMException('Permintaan dibatalkan', 'AbortError');
  return results.slice(0, limit);
}

export const photonProvider: LocationProvider = {
  name: 'photon',
  search: searchPhoton,
};

let activeProvider: LocationProvider = photonProvider;

/** Ganti provider geocoding (Nominatim/Google/endpoint BE) tanpa mengubah pemanggil. */
export function setLocationProvider(provider: LocationProvider): void {
  activeProvider = provider;
}

/** Gabungan halte/stasiun lokal + hasil geocoder; error provider dilempar ke pemanggil. */
export async function searchLocation(
  query: string,
  options: LocationSearchOptions = {},
): Promise<LocationSuggestion[]> {
  const normalized = query.trim();
  const localResults = searchLocalStops(normalized, options.limit ?? 5);
  if (normalized.length < MIN_QUERY_LENGTH) return localResults;

  const remoteResults = await activeProvider.search(normalized, options);
  return mergeLocationSuggestions(localResults, remoteResults);
}

/**
 * Fallback submit: teks bebas yang belum dipilih user → lokasi terbaik.
 * Melempar LocationServiceError('not-found') bila tidak ada kecocokan,
 * atau error terklasifikasi bila layanan geocoder gagal.
 */
export async function resolveTypedLocation(
  text: string,
  options: LocationSearchOptions = {},
): Promise<LocationSuggestion> {
  const query = text.trim();
  if (query.length < MIN_QUERY_LENGTH) {
    throw new LocationServiceError('not-found', LOCATION_NOT_FOUND_MESSAGE);
  }

  // Kecocokan persis dengan nama halte/stasiun lokal menang lebih dulu (tanpa jaringan).
  const exactLocalMatch = searchLocalStops(query, 1).find(
    (item) => item.name.toLowerCase() === query.toLowerCase(),
  );
  if (exactLocalMatch) return exactLocalMatch;

  const remoteResults = await activeProvider.search(query, {
    ...options,
    limit: options.limit ?? 5,
  });
  if (remoteResults.length > 0) return remoteResults[0];

  const [localMatch] = searchLocalStops(query, 1);
  if (localMatch) return localMatch;

  throw new LocationServiceError('not-found', LOCATION_NOT_FOUND_MESSAGE);
}
