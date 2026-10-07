export type SortByPreference = 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'LEAST_TRANSFERS';

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface RoutingPreferences {
  sortBy?: SortByPreference;
  maxWalkingDistance?: number; // meter (default 1500m)
  allowedModa?: number[]; // array of moda IDs
}

export interface RoutingSearchRequestDTO {
  origin: LocationPoint;
  destination: LocationPoint;
  preferences?: RoutingPreferences;
  /** Opsional: jam keberangkatan "HH:MM" (WIB). Default = saat ini. */
  departureTime?: string;
}

export type LegType = 'WALK' | 'TRANSIT';

export interface PassedStopInfo {
  id: number;
  namaHalte: string;
  urutan: number;
  latitude: number;
  longitude: number;
  /** Perkiraan tiba di halte ini ("HH:MM", dihitung dari jam berangkat rute). */
  estimatedTime?: string;
  /** Jadwal keberangkatan dari halte ini (format "HH:mm"). */
  jadwalKeberangkatan?: string[];
}

export interface RouteLeg {
  step: number;
  legType: LegType;
  instruction: string;
  distanceMeters: number;
  durationMinutes: number;
  fare: number;
  from: {
    id?: number;
    name: string;
    lat: number;
    lng: number;
  };
  to: {
    id?: number;
    name: string;
    lat: number;
    lng: number;
  };
  moda?: {
    id: number;
    nama: string;
    tipe: string | null;
    ikon: string | null;
  };
  rute?: {
    id: number;
    kode: string | null;
    nama: string;
    jamMulaiOperasi?: string | null;
    jamSelesaiOperasi?: string | null;
    intervalWaktu?: string | null;
  };
  fromHalte?: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  toHalte?: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  passedStopsCount?: number;
  passedStops?: PassedStopInfo[];
  geometry?: [number, number][]; // Array of [lat, lng] coordinates following actual road network for Leaflet <Polyline>
  steps?: string[]; // Turn-by-turn walking steps navigation instructions
  /** Perkiraan jam mulai leg ini ("HH:MM" WIB, aditif). */
  departureTime?: string;
  /** Perkiraan jam selesai leg ini ("HH:MM" WIB, aditif). */
  arrivalTime?: string;
}

export interface RouteOptionSummary {
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalFare: number;
  transfersCount: number;
  departureHalte: string;
  arrivalHalte: string;
  /** Perkiraan jam berangkat rute ("HH:MM" WIB, aditif). */
  departureTime?: string;
  /** Perkiraan jam tiba rute ("HH:MM" WIB, aditif). */
  arrivalTime?: string;
}

export interface RouteOption {
  id: string;
  type: 'DIRECT' | 'TRANSIT';
  summary: RouteOptionSummary;
  legs: RouteLeg[];
}

/* ==========================================
 * Tipe ADITIF untuk rekomendasi multimodal
 * (BUS, KERETA, OJEK) — kontrak lama di atas
 * tetap dipertahankan apa adanya.
 * ========================================== */

/** Tipe moda per segmen perjalanan. */
export type SegmentType = 'WALK' | 'BUS' | 'KERETA' | 'OJEK';

/** Label tambahan pada kartu rute. */
export type RouteTag = 'tercepat' | 'termurah' | 'minim_transit' | 'direkomendasikan' | 'di_luar_jam_operasional';

/** Kategori kandidat untuk jaminan keberagaman hasil. */
export type RouteCategory = 'ojek_langsung' | 'bus' | 'kereta' | 'campuran';

export interface RouteSegment {
  type: SegmentType;
  from: { id?: number; name: string; lat: number; lng: number };
  to: { id?: number; name: string; lat: number; lng: number };
  distanceMeters: number;
  durationMinutes: number;
  cost: number;
  /** Diisi untuk segmen BUS/KERETA */
  namaRute?: string;
  kodeRute?: string;
  halteAwal?: string;
  halteAkhir?: string;
}

export interface RouteRecommendation extends RouteOption {
  totalCost: number;
  totalDurationMinutes: number;
  transfersCount: number;
  tags: RouteTag[];
  /** Ringkasan moda berurutan, unik (mis. ["WALK", "BUS"]) */
  modes: SegmentType[];
  segments: RouteSegment[];
  category: RouteCategory;
}

export interface RoutingMeta {
  notices: string[];
  processingMs: number;
}

export interface RoutingSearchResponseData {
  origin: LocationPoint;
  destination: LocationPoint;
  totalRoutesFound: number;
  routes: RouteRecommendation[];
  meta: RoutingMeta;
}

/* ==========================================
 * Endpoint aditif POST /api/routing/geometry
 * (susulan geometri OSRM untuk leg tertentu)
 * ========================================== */

export interface RoutingGeometryPoint {
  lat: number;
  lng: number;
}

export interface RoutingGeometryLegInput {
  /** Echoed kembali pada hasil; bila kosong memakai urutan (1-based). */
  step?: number;
  legType: LegType;
  from: RoutingGeometryPoint;
  to: RoutingGeometryPoint;
  /** Titik antara (untuk leg TRANSIT) agar geometri melewati jalur rute. */
  passedStops?: RoutingGeometryPoint[];
  instruction?: string;
}

export interface RoutingGeometryRequestDTO {
  legs: RoutingGeometryLegInput[];
}

export interface RoutingGeometryLegResult {
  step: number;
  geometry: [number, number][];
  steps?: string[];
}

export interface RoutingGeometryResponseData {
  legs: RoutingGeometryLegResult[];
}
