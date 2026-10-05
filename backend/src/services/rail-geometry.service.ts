export type LatLng = [number, number];

export interface RuteStopWithGeometri {
  urutan: number;
  halte: { id: number; lat: number; lng: number; nama: string };
  geometri: LatLng[] | null;
}

/**
 * Rakit geometri jalur rel dari daftar `passedStops` yang sudah memiliki
 * field `geometri` (pre-computed dari Overpass API).
 *
 * @param stopsWithGeometri - Array stop berurutan dari halte naik s/d halte turun.
 *   Sudah dalam urutan yang benar (naik urutan).
 *   Elemen terakhir tidak perlu punya geometri (tidak ada "next stop").
 * @returns Array [lat, lng][] gabungan seluruh segmen, atau null bila ada segmen
 *   tanpa geometri (fallback ke OSRM oleh pemanggil).
 */
export function assembleRailGeometry(stopsWithGeometri: RuteStopWithGeometri[]): LatLng[] | null {
  if (stopsWithGeometri.length < 2) return null;

  const result: LatLng[] = [];

  for (let i = 0; i < stopsWithGeometri.length - 1; i++) {
    const current = stopsWithGeometri[i];
    const segGeom = current.geometri;

    if (!segGeom || segGeom.length === 0) {
      // Segmen tanpa geometri → fallback
      return null;
    }

    if (result.length === 0) {
      // Segmen pertama: tambahkan semua titik
      result.push(...segGeom);
    } else {
      // Segmen berikutnya: buang titik pertama (duplikat dari titik terakhir segmen sebelumnya)
      result.push(...segGeom.slice(1));
    }
  }

  return result.length >= 2 ? result : null;
}

/**
 * Parse nilai JSON dari kolom `geometri` Prisma (tipe `Json?`) menjadi LatLng[].
 * Return null bila nil atau format tidak valid.
 */
export function parseGeometriJson(raw: unknown): LatLng[] | null {
  if (raw === null || raw === undefined) return null;
  if (!Array.isArray(raw)) return null;

  const result: LatLng[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 2) return null;
    if (typeof item[0] !== 'number' || typeof item[1] !== 'number') return null;
    const lat = Number(item[0]);
    const lng = Number(item[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    result.push([lat, lng]);
  }

  return result.length >= 2 ? result : null;
}
