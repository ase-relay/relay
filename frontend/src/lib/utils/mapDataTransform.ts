import { transportModes } from '../mock/transportModes';
import { MapViewerMarker, MapViewerPolyline, MapViewerStop } from '@/components/map/MapViewer';
import type { ApiRoute, ApiRouteLeg } from '@/types/api/routing';
import { mapModaNamaToVehicleType } from '@/lib/mappers/routeMapper';

// ---------------------------------------------------------------------------
// Transform data peta — berbasis kontrak BE `ApiRoute` (Task 2.3 & 3.3)
// ---------------------------------------------------------------------------

/** Warna garis titik-titik untuk leg WALK (selaras warna moda walking di transportModes). */
const WALK_COLOR = '#64748B';

/** Warna fallback bila kode rute tidak dikenali dan moda juga tidak punya warna. */
const FALLBACK_ROUTE_COLOR = '#004BDC';

/**
 * Warna kode rute — SALINAN dari `globals.css` (`--color-route-*`, baris 54-66).
 * Leaflet menulis warna ke atribut SVG sehingga tidak bisa memakai `var(--color-route-k3)`;
 * kalau warna di globals.css berubah, ubah juga tabel ini.
 */
const ROUTE_CODE_COLORS: Record<string, string> = {
  FD1: '#23B473',
  FD2: '#BD0100',
  K1: '#00A54F',
  K2: '#EB1C24',
  K3: '#562B63',
  K4: '#2E3192',
  K5: '#EA028A',
  K6: '#EF4C24',
  CL: '#2A3B90', // Commuter Line
};

/**
 * Cari warna dari kode rute BE (mis. "MJT K3", "K3", "MJT-K3", "FD 1", "CL").
 * Kode dinormalisasi (huruf besar, tanpa spasi/strip) lalu dicocokkan ke tabel warna.
 * Return null bila tidak dikenali (mis. "TMP-03") -> pemanggil memakai fallback warna moda.
 */
export function getRouteCodeColorHex(kode: string | undefined): string | null {
  if (!kode) return null;
  const normalized = kode.toUpperCase().replace(/[\s_-]+/g, '');

  const mjt = normalized.match(/^(?:MJT)?(FD[12]|K[1-6])$/);
  if (mjt) return ROUTE_CODE_COLORS[mjt[1]] ?? null;

  if (/^(?:CL|COMMUTERLINE|KRL)$/.test(normalized)) return ROUTE_CODE_COLORS.CL;

  return null;
}

/**
 * Warna leg: WALK = abu-abu; TRANSIT = warna kode rute (mis. MJT K3 -> ungu),
 * fallback ke colorHex moda FE bila kode rute tidak punya warna khusus.
 */
function getLegColorHex(leg: ApiRouteLeg): string {
  if (leg.legType === 'WALK') return WALK_COLOR;

  const byRouteCode = getRouteCodeColorHex(leg.rute?.kode);
  if (byRouteCode) return byRouteCode;

  const vehicleType = mapModaNamaToVehicleType(leg.moda?.nama);
  return transportModes.find((mode) => mode.id === vehicleType)?.colorHex ?? FALLBACK_ROUTE_COLOR;
}

export interface MapMarkerOptions {
  /**
   * true bila titik awal pencarian adalah "Lokasi saya" (GPS perangkat) ->
   * marker awal berupa bulat biru. false/undefined -> bulat abu-abu (lokasi awal biasa).
   */
  originIsCurrentLocation?: boolean;
}

/**
 * Transform `ApiRoute` (response BE) ke `MapViewerMarker[]`.
 *
 * Koordinat diambil **langsung** dari `leg.from`/`leg.to`/`leg.fromHalte`/
 * `leg.toHalte` — response BE sudah membawa lat/lng lengkap.
 *
 * Klasifikasi marker: titik awal leg pertama = origin (atau current-location),
 * titik akhir leg terakhir = destination, titik akhir leg lain = transit
 * (halte naik/turun/pindah). Marker transit memakai warna rute leg TRANSIT di dekatnya.
 */
export function transformApiRouteToMapMarkers(
  route: ApiRoute,
  options: MapMarkerOptions = {},
): MapViewerMarker[] {
  const markers: MapViewerMarker[] = [];
  const legs = route.legs;

  if (legs.length === 0) return markers;

  const pushMarker = (
    id: string,
    position: [number, number],
    label: string,
    type: MapViewerMarker['type'],
    colorHex?: string,
  ) => {
    // Hindari marker duplikat di titik yang persis sama (mis. akhir leg A = awal leg B).
    const isDuplicate = markers.some(
      (marker) =>
        marker.type === type &&
        marker.position[0] === position[0] &&
        marker.position[1] === position[1],
    );
    if (!isDuplicate) markers.push({ id, position, label, type, colorHex });
  };

  // Titik awal leg pertama = origin / "Lokasi saya".
  const firstLeg = legs[0];
  const originPoint = firstLeg.from ?? firstLeg.fromHalte ?? firstLeg.to ?? firstLeg.toHalte;
  if (originPoint) {
    pushMarker(
      'origin',
      [originPoint.lat, originPoint.lng],
      originPoint.name,
      options.originIsCurrentLocation ? 'current-location' : 'origin',
    );
  }

  legs.forEach((leg, index) => {
    const isLast = index === legs.length - 1;

    if (isLast) {
      // Titik akhir leg terakhir = destination.
      const destinationPoint = leg.to ?? leg.toHalte ?? leg.from ?? leg.fromHalte;
      if (destinationPoint) {
        pushMarker(
          'destination',
          [destinationPoint.lat, destinationPoint.lng],
          destinationPoint.name,
          'destination',
        );
      }
      return;
    }

    // Titik akhir leg yang bukan terakhir = halte naik / turun / pindah.
    const transitPoint = leg.to ?? leg.toHalte;
    if (transitPoint) {
      // Warna: leg TRANSIT berikutnya (halte naik) bila ada, jika tidak leg ini (halte turun).
      const nextLeg = legs[index + 1];
      const colorSource =
        nextLeg?.legType === 'TRANSIT' ? nextLeg : leg.legType === 'TRANSIT' ? leg : undefined;

      pushMarker(
        `transit-${leg.step ?? index + 1}`,
        [transitPoint.lat, transitPoint.lng],
        transitPoint.name,
        'transit',
        colorSource ? getLegColorHex(colorSource) : undefined,
      );
    }
  });

  return markers;
}

/** Dua titik dianggap sama bila selisihnya < ~11 meter. */
function isSameSpot(a: [number, number], b: { lat: number; lng: number } | undefined): boolean {
  return !!b && Math.abs(a[0] - b.lat) < 1e-4 && Math.abs(a[1] - b.lng) < 1e-4;
}

/**
 * Transform `ApiRoute` ke `MapViewerStop[]` — titik perhentian halte yang dilewati
 * (`leg.passedStops`) pada leg TRANSIT. Halte naik/turun tidak diikutkan karena sudah
 * tampil sebagai marker transit yang lebih besar.
 */
export function transformApiRouteToMapStops(route: ApiRoute): MapViewerStop[] {
  const stops: MapViewerStop[] = [];

  route.legs.forEach((leg, legIndex) => {
    if (leg.legType !== 'TRANSIT' || !leg.passedStops) return;

    const colorHex = getLegColorHex(leg);
    const boarding = leg.fromHalte ?? leg.from;
    const alighting = leg.toHalte ?? leg.to;

    leg.passedStops
      .slice()
      .sort((first, second) => first.urutan - second.urutan)
      .forEach((stop) => {
        if (typeof stop.latitude !== 'number' || typeof stop.longitude !== 'number') return;

        const position: [number, number] = [stop.latitude, stop.longitude];
        if (isSameSpot(position, boarding) || isSameSpot(position, alighting)) return;

        stops.push({
          id: `stop-${leg.step ?? legIndex + 1}-${stop.id}`,
          position,
          label: stop.namaHalte,
          colorHex,
        });
      });
  });

  return stops;
}

/**
 * Transform `ApiRoute` (response BE) ke `MapViewerPolyline[]` — satu polyline
 * per leg. Jika backend menyuplai array `leg.geometry` (hasil OSRM jalan raya),
 * polyline mengikuti lekukan jalan. Jika tidak, fallback ke garis lurus antar titik.
 * Leg WALK ditandai `dashed` -> digambar titik-titik; leg TRANSIT garis solid warna rute.
 */
export function transformApiRouteToMapPolylines(route: ApiRoute): MapViewerPolyline[] {
  const polylines: MapViewerPolyline[] = [];

  route.legs.forEach((leg, index) => {
    const id = `polyline-${leg.step ?? index + 1}`;
    const colorHex = getLegColorHex(leg);
    const dashed = leg.legType === 'WALK';

    // 1. Jika ada geometry dari backend (OSRM road coordinates), gunakan langsung.
    if (leg.geometry && leg.geometry.length > 0) {
      polylines.push({ id, positions: leg.geometry, colorHex, dashed });
      return;
    }

    // 2. Fallback garis lurus jika geometry kosong.
    const startPoint = leg.from ?? leg.fromHalte;
    const endPoint = leg.to ?? leg.toHalte;

    if (!startPoint || !endPoint) return;

    polylines.push({
      id,
      positions: [
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng],
      ],
      colorHex,
      dashed,
    });
  });

  return polylines;
}