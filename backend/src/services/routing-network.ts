import { prisma } from '../config/db';
import { ROUTING_CONFIG } from '../config/routing.config';
import { GeoPoint, haversineMeters } from '../utils/geo';
import { parseGeometriJson } from './rail-geometry.service';

/**
 * Jaringan transport (halte, rute, tarif) yang dimuat sekali lalu di-cache
 * di memori (TTL konfigurasi) agar pencarian rute multi-kandidat tidak
 * membanjiri database.
 */

export type ModaCategory = 'BUS' | 'KERETA' | 'OJEK';
export type TarifTipe = 'FLAT' | 'PER_KM';

export interface NetworkModa {
  id: number;
  namaModa: string;
  tipeModa: string | null;
  ikon: string | null;
  rataRataKecepatanKmh: number | null;
  category: ModaCategory;
}

export interface NetworkStop {
  id: number;
  nama: string;
  lat: number;
  lng: number;
  isTransit: boolean;
}

export interface NetworkRuteStop {
  halteId: number;
  urutan: number;
  estimasiMenit: number | null;
  jarakMeter: number | null;
  jadwalKeberangkatan: string[];
  /** Geometri jalur dari halte ini ke halte berikutnya [[lat,lng],...]; null = belum tersedia. */
  geometri: [number, number][] | null;
  halte: NetworkStop;
}

export interface NetworkRute {
  id: number;
  nama: string;
  kode: string | null;
  jamMulaiOperasi: string | null;
  jamSelesaiOperasi: string | null;
  intervalWaktu: string | null;
  moda: NetworkModa;
  stops: NetworkRuteStop[];
  /** Peta halteId -> indeks pada `stops` (urutan menaik). */
  positions: Map<number, number>;
}

export interface NetworkTarif {
  modaId: number;
  tipeTarif: TarifTipe;
  nominalDasar: number;
  nominalPerKm: number | null;
  jarakMinimumKm: number | null;
  biayaLayanan: number;
  keterangan: string | null;
}

export interface RoutingNetwork {
  stops: NetworkStop[];
  rutes: NetworkRute[];
  ojekModa: NetworkModa | null;
  ojekTarif: NetworkTarif | null;
  /** Halte lain yang bisa dicapai jalan kaki untuk pindah kendaraan. */
  transferNeighbors: Map<number, NetworkStop[]>;
  /** Tarif per moda (satu moda satu tarif). */
  tarifByModa: Map<number, NetworkTarif>;
}

interface CachedNetworkData {
  modas: NetworkModa[];
  stops: NetworkStop[];
  rutes: NetworkRute[];
  tarifs: NetworkTarif[];
  loadedAt: number;
}

let cachedNetwork: CachedNetworkData | null = null;
let refreshPromise: Promise<CachedNetworkData> | null = null;

async function fetchAndCache(): Promise<CachedNetworkData> {
  const [modas, stops, rutes, tarifs] = await Promise.all([
    prisma.modaTransportasi.findMany({ where: { isActive: true } }),
    prisma.halte.findMany({
      where: { isActive: true },
      select: {
        id: true,
        namaHalte: true,
        latitude: true,
        longitude: true,
        isTransit: true,
      },
    }),
    prisma.rute.findMany({
      where: { isActive: true },
      include: {
        moda: true,
        stops: { orderBy: { urutan: 'asc' }, include: { halte: true } },
      },
    }),
    prisma.tarif.findMany(),
  ]);

  const networkModas: NetworkModa[] = modas.map((m) => ({
    id: m.id,
    namaModa: m.namaModa,
    tipeModa: m.tipeModa,
    ikon: m.ikon,
    rataRataKecepatanKmh: m.rataRataKecepatanKmh,
    category: categorizeModa(m.namaModa, m.tipeModa),
  }));
  const modaById = new Map(networkModas.map((m) => [m.id, m]));
  const activeModaIds = new Set(networkModas.map((m) => m.id));

  const networkStops: NetworkStop[] = stops.map((h) => ({
    id: h.id,
    nama: h.namaHalte,
    lat: h.latitude,
    lng: h.longitude,
    isTransit: h.isTransit,
  }));

  const networkRutes: NetworkRute[] = [];
  for (const r of rutes) {
    const moda = modaById.get(r.modaId);
    if (!moda) continue;
    // Halte nonaktif dilewati (tidak masuk graph), tetapi rute tetap ada.
    // estimasiMenit/jarakMeter bersifat PER SEGMEN antar halte (edge dari halte
    // ini ke halte berikutnya; halte terakhir 0/0 — lihat pemakaian di
    // route-candidates.ts buildRideSegment). Karena itu edge baru antar halte
    // tetangga = PENJUMLAHAN edge-edge yang dilewati agar waktu & jarak tetap
    // benar. Bila salah satu edge tidak diketahui (null/0), pakai null supaya
    // fallback haversine/kecepatan yang dipakai.
    const stopsOrdered: NetworkRuteStop[] = [];
    for (const s of r.stops) {
      if (s.halte.isActive !== false) {
        stopsOrdered.push({
          halteId: s.halteId,
          urutan: s.urutan,
          estimasiMenit: s.estimasiMenit,
          jarakMeter: s.jarakMeter,
          jadwalKeberangkatan: s.jadwalKeberangkatan ?? [],
          // Parse geometri dari JSON DB; null bila kosong atau format tidak valid.
          geometri: parseGeometriJson(s.geometri),
          halte: {
            id: s.halte.id,
            nama: s.halte.namaHalte,
            lat: s.halte.latitude,
            lng: s.halte.longitude,
            isTransit: s.halte.isTransit,
          },
        });
      } else if (stopsOrdered.length > 0) {
        const prev = stopsOrdered[stopsOrdered.length - 1];
        prev.jarakMeter = sumEdges(prev.jarakMeter, s.jarakMeter);
        prev.estimasiMenit = sumEdges(prev.estimasiMenit, s.estimasiMenit);
        // Gabungkan jadwal halte nonaktif? Tidak, jadwal terikat di halte aktif.
        // Geometri halte nonaktif dibuang: segmen terputus tidak bisa digabungkan.
        prev.geometri = null;
      }
      // Halte nonaktif di awal rute (belum ada tetangga aktif): tidak ada
      // edge yang perlu diakumulasi.
    }
    if (stopsOrdered.length < 2) continue;
    networkRutes.push({
      id: r.id,
      nama: r.namaRute,
      kode: r.kodeRute,
      jamMulaiOperasi: r.jamMulaiOperasi,
      jamSelesaiOperasi: r.jamSelesaiOperasi,
      intervalWaktu: r.intervalWaktu,
      moda,
      stops: stopsOrdered,
      positions: buildPositions(stopsOrdered),
    });
  }

  const networkTarifs: NetworkTarif[] = tarifs
    .filter((t) => activeModaIds.has(t.modaId))
    .map((t) => ({
      modaId: t.modaId,
      tipeTarif: t.tipeTarif,
      nominalDasar: t.nominalDasar,
      nominalPerKm: t.nominalPerKm,
      jarakMinimumKm: t.jarakMinimumKm,
      biayaLayanan: t.biayaLayanan,
      keterangan: t.keterangan,
    }));

  cachedNetwork = {
    modas: networkModas,
    stops: networkStops,
    rutes: networkRutes,
    tarifs: networkTarifs,
    loadedAt: Date.now(),
  };
  return cachedNetwork;
}

function startRefresh(): Promise<CachedNetworkData> {
  if (!refreshPromise) {
    refreshPromise = fetchAndCache()
      .catch((err) => {
        // Pertahankan data lama bila refresh gagal
        console.error('[routing-network] refresh jaringan gagal, memakai data cache lama:', err);
        if (!cachedNetwork) throw err;
        return cachedNetwork;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Muat jaringan dengan pola stale-while-revalidate:
 * - pertama kali: tunggu hasil query;
 * - setelah TTL kedaluwarsa: sajikan data lama dulu, segarkan di latar
 *   belakang (TTL tetap konfigurasi, tetapi request tidak pernah menunggu).
 */
async function loadNetworkData(): Promise<CachedNetworkData> {
  if (!cachedNetwork) {
    return startRefresh();
  }
  if (Date.now() - cachedNetwork.loadedAt >= ROUTING_CONFIG.networkCacheTtlMs) {
    void startRefresh();
  }
  return cachedNetwork;
}

/** Kategori moda berdasar tipe/nama (tipe tak dikenal -> BUS). */
export function categorizeModa(namaModa: string, tipeModa: string | null): ModaCategory {
  const tipe = (tipeModa ?? '').toUpperCase();
  const nama = namaModa.toLowerCase();
  if (tipe === 'RIDE_HAILING' || tipe === 'OJEK_ONLINE' || /ojek|ojol|gojek|grab|ride/.test(nama)) return 'OJEK';
  if (tipe === 'COMMUTER_TRAIN' || tipe === 'KERETA' || /kereta|krl|commuter|train/.test(nama)) return 'KERETA';
  return 'BUS';
}

/** Jumlahkan dua edge per-segmen; null bila salah satu tidak diketahui (fallback haversine). */
export function sumEdges(base: number | null, add: number | null): number | null {
  if (base === null || base <= 0 || add === null || add <= 0) return null;
  return base + add;
}

/** Peta halteId -> indeks urutan rute. */
export function buildPositions(stops: NetworkRuteStop[]): Map<number, number> {
  const positions = new Map<number, number>();
  stops.forEach((stop, index) => positions.set(stop.halteId, index));
  return positions;
}

/** Praprefilter halte yang bisa ditransfer jalan kaki (<= batas konfigurasi). */
export function buildTransferNeighbors(
  stops: readonly NetworkStop[],
  maxMeters = ROUTING_CONFIG.transferWalkMaxMeters
): Map<number, NetworkStop[]> {
  const neighbors = new Map<number, NetworkStop[]>();
  for (const a of stops) {
    const list: NetworkStop[] = [];
    for (const b of stops) {
      if (a.id === b.id) continue;
      if (haversineMeters(a, b) <= maxMeters) list.push(b);
    }
    neighbors.set(a.id, list);
  }
  return neighbors;
}

/** Nonaktifkan cache (dipakai test / setelah admin mengubah data). */
export function invalidateRoutingNetworkCache(): void {
  cachedNetwork = null;
}

/**
 * Muat jaringan (cache TTL) dan saring sesuai `allowedModa`
 * (kosong/tanpa filter = semua moda).
 */
export async function getRoutingNetwork(allowedModa?: number[]): Promise<RoutingNetwork> {
  const data = await loadNetworkData();
  const allowed =
    allowedModa && allowedModa.length > 0 ? new Set(allowedModa) : null;

  const modas = allowed ? data.modas.filter((m) => allowed.has(m.id)) : data.modas;
  const rutes = allowed ? data.rutes.filter((r) => allowed.has(r.moda.id)) : data.rutes;

  const ojekModa = modas.find((m) => m.category === 'OJEK') ?? null;
  const ojekTarif = ojekModa
    ? data.tarifs.find((t) => t.modaId === ojekModa.id) ?? null
    : null;

  const tarifByModa = new Map<number, NetworkTarif>();
  const tarifScope = allowed ? data.tarifs.filter((t) => allowed.has(t.modaId)) : data.tarifs;
  for (const t of tarifScope) {
    if (!tarifByModa.has(t.modaId)) {
      tarifByModa.set(t.modaId, t);
    }
  }

  return {
    stops: data.stops,
    rutes,
    ojekModa,
    ojekTarif,
    transferNeighbors: buildTransferNeighbors(data.stops),
    tarifByModa,
  };
}
