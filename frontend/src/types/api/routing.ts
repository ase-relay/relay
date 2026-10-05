/**
 * TypeScript types untuk kontrak API `POST /api/routing/search`.
 *
 * SOURCE OF TRUTH: `routing_search_request.json` & `routing_search_response.json`
 * (kontrak tim backend, bersifat read-only). Jangan mengubah kontrak — kalau BE
 * berubah, sinkronkan file ini mengikuti kontrak terbaru.
 *
 * Catatan penamaan: prefix `Api*` dipakai untuk shape yang datang langsung dari BE,
 * supaya tidak tertukar dengan shape internal FE (lihat `src/lib/types/route.ts`).
 */

// ---------------------------------------------------------------------------
// REQUEST — mengikuti routing_search_request.json
// ---------------------------------------------------------------------------

/** Titik lokasi yang dikirim FE ke BE (origin/destination request). */
export interface RoutingSearchLocationPoint {
  name: string;
  lat: number;
  lng: number;
}

/** Kriteria pengurutan rekomendasi rute (enum BE). */
export type RoutingSortBy = 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'LEAST_TRANSFERS';

/**
 * Preferensi pencarian (semua opsional — BE punya default:
 * sortBy=RECOMMENDED, maxWalkingDistance=1500, allowedModa=[] / semua moda).
 */
export interface RoutingSearchPreferences {
  sortBy?: RoutingSortBy;
  /** Radius maksimal jalan kaki ke halte terdekat (meter). */
  maxWalkingDistance?: number;
  /** Filter moda transportasi berdasarkan ID moda BE. Kosong = semua moda. */
  allowedModa?: number[];
}

export interface RoutingSearchRequest {
  origin: RoutingSearchLocationPoint;
  destination: RoutingSearchLocationPoint;
  preferences?: RoutingSearchPreferences;
}

// ---------------------------------------------------------------------------
// RESPONSE — mengikuti routing_search_response.json
// ---------------------------------------------------------------------------

/**
 * Titik lokasi dalam response. `id` hanya ada untuk halte (objek `from`/`to`
 * pada leg WALK pertama/terakhir bisa berupa titik bebas tanpa `id`).
 */
export interface ApiLocationPoint {
  id?: number;
  name: string;
  lat: number;
  lng: number;
}

/** Moda transportasi pada leg TRANSIT. Contoh: `{ id: 1, nama: "Bus", tipe: "BRT", ikon: "bus-icon" }` */
export interface ApiModa {
  id: number;
  nama: string;
  tipe: string;
  ikon: string;
}

/** Rute/linas transportasi pada leg TRANSIT. Contoh: `{ id: 3, kode: "TMP-03", nama: "Kebon Kalapa - Telkom University" }` */
export interface ApiRute {
  id: number;
  kode: string;
  nama: string;
  /** Jam mulai operasi rute (format "HH:mm", WIB). */
  jamMulaiOperasi?: string | null;
  /** Jam selesai operasi rute (format "HH:mm", WIB). */
  jamSelesaiOperasi?: string | null;
  /** Interval waktu kedatangan (teks bebas, misal "15-20 menit"). */
  intervalWaktu?: string | null;
}

/** Halte yang dilewati leg TRANSIT, sudah terurut per `urutan`. */
export interface ApiPassedStop {
  id: number;
  namaHalte: string;
  urutan: number;
  /** Koordinat halte (dikirim BE; dipakai interpolasi jarak). */
  latitude?: number;
  longitude?: number;
  /** Perkiraan tiba di halte ini ("HH:MM"). */
  estimatedTime?: string;
  /** Jadwal keberangkatan dari halte ini untuk rute ini (format "HH:mm"). */
  jadwalKeberangkatan?: string[];
}

export interface ApiRouteSummary {
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalFare: number;
  transfersCount: number;
  departureHalte: string;
  arrivalHalte: string;
  /** Perkiraan jam berangkat rute ("HH:MM"). */
  departureTime?: string;
  /** Perkiraan jam tiba rute ("HH:MM"). */
  arrivalTime?: string;
}

/**
 * Satu potongan perjalanan dalam rute.
 *
 * Field opsional hanya muncul di leg tertentu:
 * - `moda`, `rute`, `passedStopsCount`, `passedStops` → hanya di leg `TRANSIT`.
 * - `from`/`to` → dipakai leg `WALK` (titik bebas/alamat), sedangkan leg
 *   `TRANSIT` memakai `fromHalte`/`toHalte`. Semua ditandai optional mengikuti
 *   contoh data kontrak.
 *
 * ❓ Follow-up ke tim BE: apakah `passedStops` selalu ada (minimal `[]`) di leg
 * TRANSIT, atau bisa hilang total? (lihat bagian "Perlu dikonfirmasi" di TODO).
 */
export interface ApiRouteLeg {
  step: number;
  legType: 'WALK' | 'TRANSIT';
  instruction: string;
  distanceMeters: number;
  durationMinutes: number;
  fare: number;
  from?: ApiLocationPoint;
  to?: ApiLocationPoint;
  fromHalte?: ApiLocationPoint;
  toHalte?: ApiLocationPoint;
  moda?: ApiModa;
  rute?: ApiRute;
  passedStopsCount?: number;
  passedStops?: ApiPassedStop[];
  geometry?: [number, number][]; // Array of [lat, lng] coordinates following actual road network for Leaflet <Polyline>
  steps?: string[]; // Turn-by-turn walking navigation steps from BE
  /** Perkiraan jam mulai leg ini ("HH:MM"). */
  departureTime?: string;
  /** Perkiraan jam selesai leg ini ("HH:MM"). */
  arrivalTime?: string;
}

export interface ApiRoute {
  id: string;
  /** `DIRECT` = tanpa transit, `TRANSIT` = ada pergantian kendaraan. Bukan tipe kendaraan! */
  type: 'DIRECT' | 'TRANSIT';
  tags?: string[];
  summary: ApiRouteSummary;
  legs: ApiRouteLeg[];
}

export interface RoutingSearchData {
  origin: ApiLocationPoint;
  destination: ApiLocationPoint;
  totalRoutesFound: number;
  routes: ApiRoute[];
}

export interface RoutingSearchResponse {
  status: string;
  message: string;
  data: RoutingSearchData;
}

// ---------------------------------------------------------------------------
// Endpoint aditif POST /api/routing/geometry
// (susulan geometri OSRM untuk leg yang masih garis lurus)
// ---------------------------------------------------------------------------

export interface RoutingGeometryPoint {
  lat: number;
  lng: number;
}

export interface RoutingGeometryLegInput {
  step?: number;
  legType: 'WALK' | 'TRANSIT';
  from: RoutingGeometryPoint;
  to: RoutingGeometryPoint;
  /** Titik antara (leg TRANSIT) agar geometri mengikuti jalur rute. */
  passedStops?: RoutingGeometryPoint[];
  instruction?: string;
}

export interface RoutingGeometryRequest {
  legs: RoutingGeometryLegInput[];
}

export interface RoutingGeometryLegResult {
  step: number;
  geometry: [number, number][];
  steps?: string[];
}

export interface RoutingGeometryResponse {
  status: string;
  message: string;
  data: { legs: RoutingGeometryLegResult[] };
}



