import { ROUTING_CONFIG, RoutingBbox } from '../config/routing.config';

export type LatLng = [number, number];

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Menghitung jarak lingkaran besar antara dua koordinat dalam satuan meter (Haversine formula).
 */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);
  const h =
    sinDlat * sinDlat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDlng * sinDlng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Validasi array titik bantu via:
 * - 1 sampai 5 titik
 * - Nilai numerik berhingga [lat, lng]
 * - Berada di dalam validationBbox
 * - Tidak identik dengan koordinat halte awal atau tujuan (< 10 meter)
 */
export function validateViaPoints(
  via: unknown,
  bbox: RoutingBbox = ROUTING_CONFIG.validationBbox,
  halteA?: GeoPoint,
  halteB?: GeoPoint
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(via)) {
    return { valid: false, errors: ['Field "via" harus berupa array koordinat [[lat, lng], ...]'] };
  }

  if (via.length < 1 || via.length > 5) {
    errors.push(`Jumlah titik via harus antara 1 sampai 5 titik (diterima: ${via.length})`);
  }

  via.forEach((pt, idx) => {
    if (!Array.isArray(pt) || pt.length < 2) {
      errors.push(`Titik via #${idx + 1} bukan pasangan koordinat [lat, lng] yang valid`);
      return;
    }

    const lat = Number(pt[0]);
    const lng = Number(pt[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push(`Titik via #${idx + 1} memiliki koordinat non-numerik`);
      return;
    }

    if (lat < bbox.minLat || lat > bbox.maxLat || lng < bbox.minLng || lng > bbox.maxLng) {
      errors.push(
        `Titik via #${idx + 1} [${lat}, ${lng}] berada di luar batas wilayah (bbox: lat ${bbox.minLat}..${bbox.maxLat}, lng ${bbox.minLng}..${bbox.maxLng})`
      );
    }

    if (halteA && haversineMeters({ lat, lng }, halteA) < 10) {
      errors.push(`Titik via #${idx + 1} terlalu dekat atau identik dengan halte awal (< 10 m)`);
    }

    if (halteB && haversineMeters({ lat, lng }, halteB) < 10) {
      errors.push(`Titik via #${idx + 1} terlalu dekat atau identik dengan halte tujuan (< 10 m)`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Membuat daftar waypoint terurut dari halte A -> titik via -> halte B.
 */
export function buildWaypoints(
  halteA: GeoPoint,
  via: LatLng[],
  halteB: GeoPoint
): GeoPoint[] {
  return [
    { lat: halteA.lat, lng: halteA.lng },
    ...via.map(([lat, lng]) => ({ lat, lng })),
    { lat: halteB.lat, lng: halteB.lng },
  ];
}

/**
 * Memformat dan membersihkan koordinat respons OSRM:
 * - Mengubah [lng, lat] menjadi [lat, lng]
 * - Membulatkan koordinat ke 5 desimal
 * - Menghilangkan titik berurutan yang identik
 */
export function formatOsrmCoordinates(rawLngLatCoords: [number, number][]): LatLng[] {
  const result: LatLng[] = [];

  for (const [lng, lat] of rawLngLatCoords) {
    const cleanLat = Number(lat.toFixed(5));
    const cleanLng = Number(lng.toFixed(5));

    if (result.length > 0) {
      const prev = result[result.length - 1];
      if (prev[0] === cleanLat && prev[1] === cleanLng) {
        continue; // abaikan titik duplikat berurutan
      }
    }

    result.push([cleanLat, cleanLng]);
  }

  return result;
}

/**
 * Deteksi putar balik (U-turn) dan loop pada polyline:
 * - Deteksi loop: rute kembali ke titik yang sama (< 15 meter) setelah menjauh > 40 meter
 * - Deteksi U-turn: perubahan heading tajam (> 150°) antar segmen pendek berurutan
 */
export function detectUturnWarnings(
  coords: LatLng[],
  origin: GeoPoint,
  startUturnRadiusMeters = 150
): string[] {
  const warnings: string[] = [];
  if (coords.length < 3) return warnings;

  // 1. Deteksi loop / kembali ke titik dekat halte awal (radius <= 150 m)
  let movedAwayFromOrigin = false;
  for (let i = 0; i < coords.length; i++) {
    const dOrigin = haversineMeters({ lat: coords[i][0], lng: coords[i][1] }, origin);
    if (dOrigin > 50) {
      movedAwayFromOrigin = true;
    }
    if (movedAwayFromOrigin && dOrigin < 20) {
      warnings.push(
        `Jalur kembali ke dekat halte awal [${coords[i][0]}, ${coords[i][1]}] (jarak ${dOrigin.toFixed(1)} m dari origin)`
      );
      break;
    }
  }

  // 2. Deteksi pembalikan arah tajam (> 165 derajat) pada titik yang berurutan dekat
  for (let i = 1; i < coords.length - 1; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const next = coords[i + 1];

    const seg1Dist = haversineMeters({ lat: prev[0], lng: prev[1] }, { lat: curr[0], lng: curr[1] });
    const seg2Dist = haversineMeters({ lat: curr[0], lng: curr[1] }, { lat: next[0], lng: next[1] });

    if (seg1Dist >= 5 && seg2Dist >= 5) {
      const bearing1 =
        (Math.atan2(curr[1] - prev[1], curr[0] - prev[0]) * 180) / Math.PI;
      const bearing2 =
        (Math.atan2(next[1] - curr[1], next[0] - curr[0]) * 180) / Math.PI;

      let diff = Math.abs(bearing1 - bearing2);
      if (diff > 180) diff = 360 - diff;

      if (diff > 165) {
        const distFromOrigin = haversineMeters({ lat: curr[0], lng: curr[1] }, origin);
        const locDesc =
          distFromOrigin <= startUturnRadiusMeters
            ? `dalam radius ${startUturnRadiusMeters} m dari halte awal`
            : `${distFromOrigin.toFixed(0)} m dari halte awal`;
        warnings.push(
          `Pembalikan arah U-turn ${diff.toFixed(0)}° di index ${i} [${curr[0]}, ${curr[1]}] (${locDesc})`
        );
      }
    }
  }

  return warnings;
}

/**
 * Menghasilkan objek GeoJSON FeatureCollection untuk preview.
 */
export function generatePreviewGeoJson(
  routeCoords: LatLng[],
  halteA: { id: number; nama: string; lat: number; lng: number },
  halteB: { id: number; nama: string; lat: number; lng: number },
  viaPoints: LatLng[],
  metadata: Record<string, unknown> = {}
) {
  const lineStringCoords = routeCoords.map(([lat, lng]) => [lng, lat]);

  const features: any[] = [
    {
      type: 'Feature',
      properties: {
        name: `Jalur: ${halteA.nama} → ${halteB.nama}`,
        stroke: '#2563eb',
        'stroke-width': 4,
        'stroke-opacity': 0.85,
        ...metadata,
      },
      geometry: {
        type: 'LineString',
        coordinates: lineStringCoords,
      },
    },
    {
      type: 'Feature',
      properties: {
        name: `Halte A (${halteA.id}): ${halteA.nama}`,
        'marker-color': '#16a34a',
        'marker-symbol': 'bus',
        role: 'halte-awal',
      },
      geometry: {
        type: 'Point',
        coordinates: [halteA.lng, halteA.lat],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: `Halte B (${halteB.id}): ${halteB.nama}`,
        'marker-color': '#dc2626',
        'marker-symbol': 'bus',
        role: 'halte-tujuan',
      },
      geometry: {
        type: 'Point',
        coordinates: [halteB.lng, halteB.lat],
      },
    },
  ];

  viaPoints.forEach((v, idx) => {
    features.push({
      type: 'Feature',
      properties: {
        name: `Titik Via #${idx + 1}`,
        'marker-color': '#f59e0b',
        'marker-symbol': 'circle',
        role: 'via-point',
      },
      geometry: {
        type: 'Point',
        coordinates: [v[1], v[0]],
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
