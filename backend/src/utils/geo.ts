import { ROUTING_CONFIG } from '../config/routing.config';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Bbox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const EARTH_RADIUS_M = 6371000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Jarak lingkaran-terpendek antar dua titik (meter, dibulatkan). */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** Jarak tempuh perkiraan di jalan = haversine x faktor jalan (konfigurasi). */
export function roadDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  return Math.round(haversineMeters(a, b) * ROUTING_CONFIG.roadDistanceFactor);
}

/** Bounding box kasar (meter -> derajat) yang memuat radius tertentu di sekitar titik. */
export function bboxAround(point: GeoPoint, radiusMeters: number): Bbox {
  const latDelta = radiusMeters / 111_320;
  const cosLat = Math.max(0.01, Math.cos(toRad(point.lat)));
  const lngDelta = radiusMeters / (111_320 * cosLat);
  return {
    minLat: point.lat - latDelta,
    maxLat: point.lat + latDelta,
    minLng: point.lng - lngDelta,
    maxLng: point.lng + lngDelta,
  };
}

export function inBbox(point: GeoPoint, bbox: Bbox): boolean {
  return (
    point.lat >= bbox.minLat &&
    point.lat <= bbox.maxLat &&
    point.lng >= bbox.minLng &&
    point.lng <= bbox.maxLng
  );
}

export interface DistanceToPoint<T> {
  item: T;
  distanceMeters: number;
}

/**
 * Prefilter bounding box lalu hitung haversine.
 * Hasil terurut menaik dan dibatasi `limit` item terdekat.
 */
export function nearestWithin<T>(
  items: readonly T[],
  origin: GeoPoint,
  options: { radiusMeters: number; limit?: number },
  getPoint: (item: T) => GeoPoint
): Array<DistanceToPoint<T>> {
  const bbox = bboxAround(origin, options.radiusMeters);
  const result: Array<DistanceToPoint<T>> = [];

  for (const item of items) {
    const point = getPoint(item);
    if (!inBbox(point, bbox)) continue;
    const distanceMeters = haversineMeters(origin, point);
    if (distanceMeters <= options.radiusMeters) {
      result.push({ item, distanceMeters });
    }
  }

  result.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return typeof options.limit === 'number' ? result.slice(0, options.limit) : result;
}
