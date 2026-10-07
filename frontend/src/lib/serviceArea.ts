import serviceAreaFeature from '@/data/serviceArea.json';

/**
 * Wilayah layanan Otewe (Bandung metropolitan + buffer 3 km).
 *
 * Poligon ini BUKAN kotak persegi: union batas administratif Kota Bandung,
 * Kota Cimahi, Kab. Bandung, Kab. Bandung Barat, dan 5 kecamatan Sumedang
 * (Jatinangor, Cimanggung, Tanjungsari, Sukasari, Pamulihan), lalu di-buffer
 * 3 km ke luar — setara "radius 3 km dari halte/stasiun terluar".
 * Sumber batas: geoBoundaries gbHumanitarian (OSM). Regenerasi: skrip
 * build-service-area di direktori temp (lihat riwayat PR), lalu verifikasi
 * 218 halte aktif di dalamnya sebelum mengganti file JSON ini.
 *
 * Dipakai untuk: validasi titik (pengganti cek bbox), garis batas abu-abu
 * di peta, dan batas geser/zoom peta.
 */

type LngLat = [number, number];
type LatLng = [number, number];

interface ServiceAreaGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: LngLat[][] | LngLat[][][];
}

const geometry = serviceAreaFeature.geometry as ServiceAreaGeometry;

function polygons(): LngLat[][][] {
  return geometry.type === 'Polygon' ? [geometry.coordinates as LngLat[][]] : (geometry.coordinates as LngLat[][][]);
}

/** Titik tepat di segmen garis (dengan toleransi kecil) dianggap di dalam. */
function isOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): boolean {
  const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  if (Math.abs(cross) > 1e-9) return false;
  const dot = (px - ax) * (px - bx) + (py - ay) * (py - by);
  return dot <= 1e-9;
}

/** Ray-casting even-odd untuk satu ring (lubang diperlakukan sebagai luar). */
function isInRing(lng: number, lat: number, ring: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (isOnSegment(lng, lat, xi, yi, xj, yj)) return true;
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Apakah titik berada dalam wilayah layanan? Titik di garis batas dihitung
 * di dalam (longgar ke pengguna).
 */
export function isWithinServiceArea(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  for (const polygon of polygons()) {
    if (polygon.length === 0) continue;
    // Ring pertama = batas luar; ring berikutnya = lubang.
    if (!isInRing(lng, lat, polygon[0])) continue;
    let inHole = false;
    for (let h = 1; h < polygon.length; h++) {
      if (isInRing(lng, lat, polygon[h])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

/** Kotak pembatas poligon: [minLng, minLat, maxLng, maxLat] (format Photon/bbox). */
export function getServiceAreaBbox(): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const polygon of polygons()) {
    for (const ring of polygon) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  return [minLng, minLat, maxLng, maxLat];
}

/** Ring luar poligon dalam format Leaflet [lat, lng][] untuk garis batas. */
export function getServiceAreaOutline(): LatLng[][] {
  return polygons().map((polygon) =>
    polygon[0].map(([lng, lat]) => [lat, lng] as LatLng),
  );
}
