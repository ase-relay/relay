import type { VehicleType } from '@/components/icons/vehicle/VehicleIcon';
import type { JourneySegment } from '@/components/route-detail/TripStepList';
import type { ApiRoute, ApiRouteLeg } from '@/types/api/routing';
import { formatCurrency, formatDuration } from '@/lib/utils';

/**
 * Mapper: shape response BE (`ApiRoute`) → shape komponen FE.
 * Mengikuti tabel mapping di TODO-integrasi-routing-search.md bagian 2.2.
 */

// ---------------------------------------------------------------------------
// Konversi moda.nama → slug VehicleType FE
// ---------------------------------------------------------------------------

/**
 * Normalisasi nama moda dari BE ("Bus", "Angkot", "Kereta", dst) ke slug
 * `VehicleType` FE. Case-insensitive, ada fallback default bila tidak dikenali.
 *
 * ❓ Follow-up ke tim BE (lihat TODO): apakah `moda.ikon` punya daftar nilai baku?
 * Kalau ya, mapping ini bisa diganti/diperkuat berdasarkan `moda.ikon` (mis.
 * "bus-icon", "angkot-icon") alih-alih `moda.nama`.
 */
export function mapModaNamaToVehicleType(nama: string | undefined): VehicleType {
  const normalized = (nama ?? '').trim().toLowerCase();

  if (normalized.includes('angkot')) return 'angkot';
  if (normalized.includes('bus') || normalized.includes('brt')) return 'bus';
  if (
    normalized.includes('kereta') ||
    normalized.includes('krl') ||
    normalized.includes('commuter') ||
    normalized.includes('lrt')
  ) {
    return 'train';
  }
  if (
    normalized.includes('ojek') ||
    normalized.includes('motor') ||
    normalized.includes('bike')
  ) {
    return 'motorcycle';
  }
  if (normalized.includes('jalan kaki') || normalized.includes('walk')) return 'walking';

  // Fallback default: mode transportasi paling umum di aplikasi.
  return 'bus';
}

// ---------------------------------------------------------------------------
// Mapper → RouteRecommendation (kartu list hasil pencarian)
// ---------------------------------------------------------------------------

/** Shape yang dikonsumsi kartu list di halaman Cari Rute (`cari-rute/page.tsx`). */
export interface RouteRecommendation {
  id: string;
  /** Tipe kendaraan untuk ikon — diambil dari moda leg TRANSIT pertama. */
  type: VehicleType;
  transportName: string;
  operator: string;
  badges: string[];
  price: number;
  priceLabel: string;
  duration: number;
  durationLabel: string;
  transits: number;
  walkingTime: number;
}

/** Total jarak/tempuh berjalan kaki (menit) dari semua leg WALK. */
function sumWalkingMinutes(legs: ApiRouteLeg[]): number {
  return legs
    .filter((leg) => leg.legType === 'WALK')
    .reduce((total, leg) => total + (leg.durationMinutes ?? 0), 0);
}

/**
 * `route.type` BE (`DIRECT`/`TRANSIT`) menandakan ada-tidaknya transit — beda
 * makna dengan `type` FE yang adalah tipe kendaraan. Ikon kendaraan diturunkan
 * dari `moda.nama` pada leg TRANSIT pertama (task 1.1 menyediakan sluginya).
 */
export function mapApiRouteToRouteResultCard(apiRoute: ApiRoute): RouteRecommendation {
  const { summary, legs } = apiRoute;

  const firstTransitLeg = legs.find((leg) => leg.legType === 'TRANSIT');
  const vehicleType = mapModaNamaToVehicleType(firstTransitLeg?.moda?.nama);

  // Nama moda untuk tampilan: nama asli dari BE, dengan fallback yang aman.
  const transportName = firstTransitLeg?.moda?.nama ?? 'Rute';

  // Operator ditampilkan dari nama rute/lintasan BE (mis. "Kebon Kalapa - Telkom University").
  const operator = firstTransitLeg?.rute?.nama ?? '';

  // Badge menampilkan kode rute yang dipakai (mis. "TMP-03", "AK-01").
  const badges = legs
    .filter((leg) => leg.legType === 'TRANSIT' && leg.rute?.kode)
    .map((leg) => leg.rute!.kode);

  return {
    id: apiRoute.id,
    type: vehicleType,
    transportName,
    operator,
    badges,
    price: summary.totalFare,
    priceLabel: formatCurrency(summary.totalFare),
    duration: summary.totalDurationMinutes,
    durationLabel: formatDuration(summary.totalDurationMinutes),
    transits: summary.transfersCount,
    walkingTime: sumWalkingMinutes(legs),
  };
}

// ---------------------------------------------------------------------------
// Mapper → JourneySegment[] (detail perjalanan / TripStepList)
// ---------------------------------------------------------------------------

/**
 * Jam keberangkatan/tiba belum disediakan kontrak BE (lihat open question di
 * TODO), jadi diisi placeholder tampilan.
 */
const UNKNOWN_TIME = '--:--';

export function mapApiRouteToJourneySegments(apiRoute: ApiRoute): JourneySegment[] {
  return apiRoute.legs.map((leg, index) => {
    const id = `${apiRoute.id}-leg-${leg.step ?? index + 1}`;

    if (leg.legType === 'WALK') {
      return {
        id,
        type: 'WALK' as const,
        startTime: UNKNOWN_TIME,
        endTime: UNKNOWN_TIME,
        duration: leg.durationMinutes,
        distance: leg.distanceMeters,
        steps: [leg.instruction],
      };
    }

    return {
      id,
      type: 'TRANSIT' as const,
      startTime: UNKNOWN_TIME,
      endTime: UNKNOWN_TIME,
      operator: leg.rute?.nama ?? leg.moda?.nama ?? '',
      routeCode: leg.rute?.kode ?? '',
      cost: leg.fare,
      duration: leg.durationMinutes,
      stopCount: leg.passedStopsCount ?? 0,
      stops: (leg.passedStops ?? [])
        .slice()
        .sort((first, second) => first.urutan - second.urutan)
        .map((stop) => ({ time: UNKNOWN_TIME, stopName: stop.namaHalte })),
    };
  });
}
