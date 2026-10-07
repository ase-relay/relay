import { LatLng, haversineMeters } from '../utils/shaping-points.utils';
import { GeometryService } from './geometry.service';

export interface TransitStopItem {
  id: number;
  namaHalte: string;
  urutan: number;
  latitude: number;
  longitude: number;
  geometri?: LatLng[] | null;
}

/**
 * Menyambung beberapa potongan polyline (potongan tersimpan dari DB dan/atau potongan OSRM),
 * menghilangkan titik duplikat pada titik sambungan, dan memeriksa kontinuitas (> 50m).
 */
export function stitchPolylinePieces(
  pieces: LatLng[][],
  junctionHaltes: { lat: number; lng: number }[] = []
): LatLng[] {
  if (pieces.length === 0) return [];
  if (pieces.length === 1) return [...pieces[0]];

  const result: LatLng[] = [];

  for (let pIdx = 0; pIdx < pieces.length; pIdx++) {
    const piece = pieces[pIdx];
    if (!piece || piece.length === 0) continue;

    if (result.length === 0) {
      result.push(...piece);
      continue;
    }

    const lastPt = result[result.length - 1];
    const firstPt = piece[0];

    const dist = haversineMeters(
      { lat: lastPt[0], lng: lastPt[1] },
      { lat: firstPt[0], lng: firstPt[1] }
    );

    if (dist < 1.0) {
      // Titik sambungan identik (< 1 meter) -> buang titik pertama agar tidak duplikat
      result.push(...piece.slice(1));
    } else if (dist <= 50.0) {
      // Titik sambungan sangat dekat (< 50 meter) -> sambungkan langsung
      result.push(...piece);
    } else {
      // Ada celah > 50 meter -> sambungkan melalui koordinat halte perantara jika tersedia
      const junctionHalte = junctionHaltes[pIdx - 1];
      if (junctionHalte) {
        result.push([junctionHalte.lat, junctionHalte.lng]);
      }
      result.push(...piece);
    }
  }

  return result;
}

/**
 * Merakit geometri untuk leg transit non-kereta (Bus/BRT) dengan metode "Perakitan Campuran":
 * - Segmen n -> n+1 yang memiliki geometri tersimpan (RuteStop.geometri) dipakai langsung.
 * - Deret segmen berurutan yang geometrinya kosong dipanggil ke OSRM SATU kali dengan waypoint halte pada deret tersebut.
 * - Seluruh potongan disambung secara berurutan.
 * - Bila perakitan campuran gagal atau menghasilkan < 2 titik, kembalikan null agar pemanggil fallback ke OSRM satu leg penuh.
 */
export async function assembleMixedTransitGeometry(
  stops: TransitStopItem[],
  fetchOsrmGeometry: (
    waypoints: { lat: number; lng: number }[]
  ) => Promise<LatLng[]> = (pts) => GeometryService.getRouteGeometry(pts, 'driving')
): Promise<LatLng[] | null> {
  if (!stops || stops.length < 2) return null;

  // Struktur potongan rute berurutan
  type RoutePiece =
    | { type: 'stored'; coords: LatLng[]; fromStopIdx: number; toStopIdx: number }
    | { type: 'osrm_run'; stops: TransitStopItem[]; fromStopIdx: number; toStopIdx: number };

  const piecesPlan: RoutePiece[] = [];
  let currentEmptyRun: TransitStopItem[] = [];
  let currentEmptyStartIdx = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const currentStop = stops[i];
    const nextStop = stops[i + 1];
    const storedGeom = currentStop.geometri;

    if (storedGeom && storedGeom.length >= 2) {
      // Bila sebelumnya ada deret segmen kosong, tutup dan simpan ke plan
      if (currentEmptyRun.length > 0) {
        // Deret kosong harus menyertakan halte tujuan segmen kosong terakhir
        currentEmptyRun.push(currentStop);
        piecesPlan.push({
          type: 'osrm_run',
          stops: currentEmptyRun,
          fromStopIdx: currentEmptyStartIdx,
          toStopIdx: i,
        });
        currentEmptyRun = [];
      }

      // Tambahkan segmen tersimpan
      piecesPlan.push({
        type: 'stored',
        coords: storedGeom,
        fromStopIdx: i,
        toStopIdx: i + 1,
      });
    } else {
      // Segmen tanpa geometri tersimpan
      if (currentEmptyRun.length === 0) {
        currentEmptyStartIdx = i;
        currentEmptyRun.push(currentStop);
      } else {
        currentEmptyRun.push(currentStop);
      }
    }
  }

  // Jika di akhir masih ada deret kosong
  if (currentEmptyRun.length > 0) {
    currentEmptyRun.push(stops[stops.length - 1]);
    piecesPlan.push({
      type: 'osrm_run',
      stops: currentEmptyRun,
      fromStopIdx: currentEmptyStartIdx,
      toStopIdx: stops.length - 1,
    });
  }

  // Jika seluruh rute kosong (tidak ada satupun geometri tersimpan),
  // kembalikan null agar pemanggil langsung memanggil OSRM biasa 1x.
  const hasAnyStored = piecesPlan.some((p) => p.type === 'stored');
  if (!hasAnyStored) {
    return null;
  }

  // Ambil geometri untuk masing-masing potongan
  const fetchedPieces: LatLng[][] = [];
  const junctionHaltes: { lat: number; lng: number }[] = [];

  for (let pIdx = 0; pIdx < piecesPlan.length; pIdx++) {
    const plan = piecesPlan[pIdx];

    if (plan.type === 'stored') {
      fetchedPieces.push(plan.coords);
    } else {
      // Panggil OSRM 1x untuk deret halte kosong
      const waypoints = plan.stops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
      const osrmResult = await fetchOsrmGeometry(waypoints);

      if (!osrmResult || osrmResult.length < 2) {
        // Fallback bila panggilan OSRM untuk deret ini gagal
        return null;
      }
      fetchedPieces.push(osrmResult);
    }

    if (pIdx > 0) {
      const junctionStop = stops[plan.fromStopIdx];
      junctionHaltes.push({ lat: junctionStop.latitude, lng: junctionStop.longitude });
    }
  }

  const stitched = stitchPolylinePieces(fetchedPieces, junctionHaltes);
  return stitched.length >= 2 ? stitched : null;
}
