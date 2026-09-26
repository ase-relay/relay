import { transportModes } from '../mock/transportModes';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';
import type { ApiRoute, ApiRouteLeg } from '@/types/api/routing';
import { mapModaNamaToVehicleType } from '@/lib/mappers/routeMapper';

// ---------------------------------------------------------------------------
// Transform data peta — berbasis kontrak BE `ApiRoute` (Task 2.3 & 3.3)
// ---------------------------------------------------------------------------

/** Warna polyline untuk leg WALK (selaras warna moda walking di transportModes). */
const WALK_COLOR = '#64748B';

/** Warna polyline leg TRANSIT mengikuti colorHex moda FE (dari moda.nama BE). */
function getLegColorHex(leg: ApiRouteLeg): string {
  if (leg.legType === 'WALK') return WALK_COLOR;

  const vehicleType = mapModaNamaToVehicleType(leg.moda?.nama);
  return transportModes.find((mode) => mode.id === vehicleType)?.colorHex ?? '#004BDC';
}

/**
 * Transform `ApiRoute` (response BE) ke `MapViewerMarker[]`.
 *
 * Koordinat diambil **langsung** dari `leg.from`/`leg.to`/`leg.fromHalte`/
 * `leg.toHalte` — tidak ada lagi lookup manual ke data stops mock terpisah,
 * karena response BE sudah membawa lat/lng lengkap.
 *
 * Klasifikasi marker: titik awal leg pertama = origin, titik akhir leg terakhir
 * = destination, titik keberangkatan leg berikutnya = transit point.
 */
export function transformApiRouteToMapMarkers(route: ApiRoute): MapViewerMarker[] {
  const markers: MapViewerMarker[] = [];
  const legs = route.legs;

  if (legs.length === 0) return markers;

  const pushMarker = (
    id: string,
    position: [number, number],
    label: string,
    type: MapViewerMarker['type'],
  ) => {
    // Hindari marker duplikat di titik yang persis sama (mis. akhir leg A = awal leg B).
    const isDuplicate = markers.some(
      (marker) =>
        marker.type === type &&
        marker.position[0] === position[0] &&
        marker.position[1] === position[1],
    );
    if (!isDuplicate) markers.push({ id, position, label, type });
  };

  // Titik awal leg pertama = origin (koordinat dari leg.from, fallback summary tidak punya koordinat).
  const firstLeg = legs[0];
  const originPoint = firstLeg.from ?? firstLeg.fromHalte ?? firstLeg.to ?? firstLeg.toHalte;
  if (originPoint) {
    pushMarker('origin', [originPoint.lat, originPoint.lng], originPoint.name, 'origin');
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

    // Leg bukan terakhir: titik keberangkatannya adalah transit point
    // (akhir leg sebelumnya sudah otomatis jadi transit point di iterasi berikutnya).
    const transitPoint = leg.to ?? leg.toHalte;
    if (transitPoint) {
      pushMarker(`transit-${leg.step ?? index + 1}`, [transitPoint.lat, transitPoint.lng], transitPoint.name, 'transit');
    }
  });

  return markers;
}

/**
 * Transform `ApiRoute` (response BE) ke `MapViewerPolyline[]` — satu polyline
 * per leg. Jika backend menyuplai array `leg.geometry` (hasil OSRM jalan raya),
 * polyline akan digambar presisi mengikuti lekukan jalan raya. Jika tidak,
 * fallback ke garis lurus antar titik halte/koordinat.
 */
export function transformApiRouteToMapPolylines(route: ApiRoute): MapViewerPolyline[] {
  const polylines: MapViewerPolyline[] = [];

  route.legs.forEach((leg, index) => {
    // 1. Jika ada geometry dari backend (OSRM road coordinates), gunakan langsung!
    if (leg.geometry && leg.geometry.length > 0) {
      polylines.push({
        id: `polyline-${leg.step ?? index + 1}`,
        positions: leg.geometry,
        colorHex: getLegColorHex(leg),
      });
      return;
    }

    // 2. Fallback garis lurus jika geometry kosong
    const startPoint = leg.from ?? leg.fromHalte;
    const endPoint = leg.to ?? leg.toHalte;

    if (!startPoint || !endPoint) return;

    polylines.push({
      id: `polyline-${leg.step ?? index + 1}`,
      positions: [
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng],
      ],
      colorHex: getLegColorHex(leg),
    });
  });

  return polylines;
}
