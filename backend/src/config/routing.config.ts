/**
 * Konstanta mesin rekomendasi rute multimodal (BUS, KERETA, OJEK).
 *
 * SEMUA nilai kecepatan, waktu tunggu, jarak, dan bobot skoring di bawah adalah
 * ESTIMASI untuk keperluan tampilan dan disesuaikan kebutuhan (SRS).
 * Nilai akhir boleh diubah sesuai data/timing aktual tanpa menyentuh logika.
 */

export interface RoutingBbox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface RoutingScoreWeights {
  cost: number;
  duration: number;
  transfers: number;
  walking: number;
}

export interface RoutingConfig {
  /* --- ESTIMASI kecepatan rata-rata (km/jam) --- */
  walkingSpeedKmh: number;
  ojekSpeedKmh: number;
  busSpeedKmh: number;
  keretaSpeedKmh: number;

  /* --- ESTIMASI waktu tunggu (menit) --- */
  ojekPickupWaitMinutes: number;
  busWaitMinutes: number;
  keretaWaitMinutes: number;

  /* --- Jarak --- */
  roadDistanceFactor: number;
  transferWalkMaxMeters: number;
  connectorOjekMaxKm: number;
  connectorOjekVariantMinMeters: number;

  /* --- Pencarian --- */
  nearestStopsPerEnd: number;
  maxTransfers: number;
  maxCandidatesGenerated: number;
  maxResults: number;
  searchRadiusMeters: number;

  /* --- Validasi request --- */
  allowedWalkingDistanceMeters: number[];
  defaultWalkingDistanceMeters: number;
  validationBbox: RoutingBbox;

  /* --- Skoring "direkomendasikan" (total bobot = 1) --- */
  scoreWeights: RoutingScoreWeights;

  /* --- Tarif --- */
  fareRoundUpStep: number;
  defaultTransitFare: number;

  /* --- Performa --- */
  networkCacheTtlMs: number;
  geometryBudgetMs: number;
  geometryCacheTtlMs: number;
  geometryCacheMaxEntries: number;
}

export const ROUTING_CONFIG: RoutingConfig = {
  walkingSpeedKmh: 5,
  ojekSpeedKmh: 22,
  busSpeedKmh: 20,
  keretaSpeedKmh: 35,

  ojekPickupWaitMinutes: 4,
  busWaitMinutes: 8,
  keretaWaitMinutes: 10,

  roadDistanceFactor: 1.3,
  transferWalkMaxMeters: 500,
  connectorOjekMaxKm: 10,
  connectorOjekVariantMinMeters: 500,

  nearestStopsPerEnd: 4,
  maxTransfers: 2,
  maxCandidatesGenerated: 300,
  maxResults: 8,
  searchRadiusMeters: 10_000,

  allowedWalkingDistanceMeters: [500, 1000, 1500, 2000, 3000],
  defaultWalkingDistanceMeters: 1500,
  // Bandung + Cimahi + sekitarnya (margin longgar untuk titik ujung yang sah)
  validationBbox: { minLat: -7.2, maxLat: -6.6, minLng: 107.35, maxLng: 107.9 },

  scoreWeights: { cost: 0.35, duration: 0.35, transfers: 0.15, walking: 0.15 },

  fareRoundUpStep: 500,
  defaultTransitFare: 5000,

  networkCacheTtlMs: 60_000,
  // Budget susulan geometri OSRM per rute (paralel per leg; miss pertama
  // boleh lebih lama karena hasilnya di-cache untuk pencarian berikutnya).
  geometryBudgetMs: 2_000,
  geometryCacheTtlMs: 900_000, // 15 menit
  geometryCacheMaxEntries: 500,
};

/**
 * Konversi jarak (meter) ke durasi menit berdasarkan kecepatan km/jam.
 * Hasil dibulatkan dan minimal `min` menit.
 */
export function minutesFromKmh(distanceMeters: number, speedKmh: number, min = 1): number {
  const metersPerMinute = (speedKmh * 1000) / 60;
  return Math.max(min, Math.round(distanceMeters / metersPerMinute));
}
