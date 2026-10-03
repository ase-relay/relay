import { ROUTING_CONFIG, minutesFromKmh } from '../config/routing.config';
import { haversineMeters, nearestWithin, roadDistanceMeters } from '../utils/geo';
import { calculateFare, FareTarif } from './fare-calculator';
import {
  NetworkModa,
  NetworkRute,
  NetworkRuteStop,
  NetworkStop,
  NetworkTarif,
  RoutingNetwork,
} from './routing-network';
import { RouteCategory, RouteSegment, SegmentType } from '../types/routing.types';

/**
 * Generator kandidat rute multimodal (murni matematika, tanpa query DB
 * dan tanpa panggilan jaringan — geometri OSRM disusul oleh service).
 *
 * Kandidat yang dihasilkan:
 *  - OJEK_LANGSUNG: selalu ada bila ojek diizinkan & tarif terkonfigurasi.
 *  - Transit round 0 (langsung), round 1 (1 transfer), round 2 (2 transfer)
 *    dihitung atas urutan RuteStop (hormati arah rute), bukan graf penuh.
 *  - Akses ujung: jalan kaki (s/d maxWalkingDistance) atau ojek penghubung
 *    (first/last-mile; wajib bila tak ada halte terjangkau jalan kaki).
 */

export interface CandidateEndpoint {
  name: string;
  lat: number;
  lng: number;
}

export interface InternalSegment extends RouteSegment {
  /** Untuk segmen BUS/KERETA: daftar halte yang dilewati (untuk legs & geometry). */
  passedStops?: NetworkRuteStop[];
  ruteId?: number;
  moda?: NetworkModa;
  rute?: { id: number; nama: string; kode: string | null };
}

export interface RouteCandidate {
  id: string;
  category: RouteCategory;
  segments: InternalSegment[];
  totalCost: number;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  transfersCount: number;
  walkingDistanceMeters: number;
  rideRuteIds: number[];
  dedupeKey: string;
}

export interface CandidateSearchInput {
  origin: CandidateEndpoint;
  destination: CandidateEndpoint;
  maxWalkingDistanceMeters: number;
  network: RoutingNetwork;
}

export interface CandidateSearchResult {
  candidates: RouteCandidate[];
  notices: string[];
}

type AccessMode = 'WALK' | 'OJEK';

interface AccessOption {
  stop: NetworkStop;
  mode: AccessMode;
  distanceMeters: number; // haversine (dasar ambang batas)
}

class CapReachedError extends Error {
  constructor() {
    super('cap reached');
  }
}

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);

const pointKey = (pt: { id?: number; lat: number; lng: number }): string =>
  pt.id !== undefined ? `h${pt.id}` : `${pt.lat.toFixed(5)},${pt.lng.toFixed(5)}`;

function segmentKey(seg: InternalSegment): string {
  if (seg.type === 'WALK') return `w:${pointKey(seg.from)}>${pointKey(seg.to)}`;
  if (seg.type === 'OJEK') return `oj:${pointKey(seg.from)}>${pointKey(seg.to)}`;
  return `${seg.type}:${seg.ruteId}:${pointKey(seg.from)}>${pointKey(seg.to)}`;
}

function determineCategory(vehicleSegments: InternalSegment[]): RouteCategory {
  const rideTypes = new Set(
    vehicleSegments.filter((s) => s.type === 'BUS' || s.type === 'KERETA').map((s) => s.type)
  );
  if (rideTypes.size === 0) return 'ojek_langsung';
  if (rideTypes.size === 2) return 'campuran';
  return rideTypes.has('KERETA') ? 'kereta' : 'bus';
}

function assembleCandidate(segments: InternalSegment[]): RouteCandidate | null {
  const vehicleSegments = segments.filter((s) => s.type !== 'WALK');
  const transfersCount = vehicleSegments.length - 1;
  if (transfersCount < 0 || transfersCount > ROUTING_CONFIG.maxTransfers) return null;

  const walkSegments = segments.filter((s) => s.type === 'WALK');
  return {
    id: '',
    category: determineCategory(vehicleSegments),
    segments,
    totalCost: sum(segments.map((s) => s.cost)),
    totalDurationMinutes: sum(segments.map((s) => s.durationMinutes)),
    totalDistanceMeters: sum(segments.map((s) => s.distanceMeters)),
    transfersCount,
    walkingDistanceMeters: sum(walkSegments.map((s) => s.distanceMeters)),
    rideRuteIds: vehicleSegments.map((s) => s.ruteId).filter((id): id is number => id !== undefined),
    dedupeKey: segments.map(segmentKey).join('|'),
  };
}

function rideFare(tarif: FareTarif | null, distanceMeters: number): number {
  return calculateFare(tarif, distanceMeters);
}

function buildRideSegment(
  rute: NetworkRute,
  fromIdx: number,
  toIdx: number,
  network: RoutingNetwork
): InternalSegment {
  const slice = rute.stops.slice(fromIdx, toIdx + 1);
  const category = rute.moda.category;

  const rawSpeed = rute.moda.rataRataKecepatanKmh;
  const defaultSpeed =
    category === 'KERETA'
      ? ROUTING_CONFIG.keretaSpeedKmh
      : category === 'OJEK'
        ? ROUTING_CONFIG.ojekSpeedKmh
        : ROUTING_CONFIG.busSpeedKmh;
  // Guard J1-X: pakai kecepatan DB hanya bila berhingga dan > 0; selain itu default kategori.
  // Mencegah Infinity dari minutesFromKmh bila moda berkecepatan 0/negatif/NaN.
  const speedKmh =
    typeof rawSpeed === 'number' && Number.isFinite(rawSpeed) && rawSpeed > 0
      ? rawSpeed
      : defaultSpeed;
  const waitMinutes =
    category === 'KERETA'
      ? ROUTING_CONFIG.keretaWaitMinutes
      : category === 'OJEK'
        ? ROUTING_CONFIG.ojekPickupWaitMinutes
        : ROUTING_CONFIG.busWaitMinutes;

  let distanceMeters = 0;
  let travelMinutes = 0;
  for (let i = 0; i < slice.length - 1; i++) {
    const current = slice[i];
    const next = slice[i + 1];
    const hopDistance =
      current.jarakMeter && current.jarakMeter > 0
        ? current.jarakMeter
        : haversineMeters(current.halte, next.halte);
    const hopMinutes =
      current.estimasiMenit && current.estimasiMenit > 0
        ? current.estimasiMenit
        : minutesFromKmh(hopDistance, speedKmh, 2);
    distanceMeters += hopDistance;
    travelMinutes += hopMinutes;
  }

  const tarif = network.tarifByModa.get(rute.moda.id) ?? null;
  const first = slice[0].halte;
  const last = slice[slice.length - 1].halte;

  const segmentType: SegmentType =
    category === 'KERETA' ? 'KERETA' : category === 'OJEK' ? 'OJEK' : 'BUS';

  return {
    type: segmentType,
    from: { id: first.id, name: first.nama, lat: first.lat, lng: first.lng },
    to: { id: last.id, name: last.nama, lat: last.lat, lng: last.lng },
    distanceMeters,
    durationMinutes: Math.max(2, travelMinutes) + waitMinutes,
    cost: rideFare(tarif, distanceMeters),
    namaRute: rute.nama,
    kodeRute: rute.kode ?? undefined,
    halteAwal: first.nama,
    halteAkhir: last.nama,
    passedStops: slice,
    ruteId: rute.id,
    moda: rute.moda,
    rute: { id: rute.id, nama: rute.nama, kode: rute.kode },
  };
}

function buildOjekDirectSegment(
  origin: CandidateEndpoint,
  destination: CandidateEndpoint,
  moda: NetworkModa,
  tarif: NetworkTarif
): InternalSegment {
  const distanceMeters = roadDistanceMeters(origin, destination);
  const speedKmh = moda.rataRataKecepatanKmh ?? ROUTING_CONFIG.ojekSpeedKmh;
  return {
    type: 'OJEK',
    from: { name: origin.name, lat: origin.lat, lng: origin.lng },
    to: { name: destination.name, lat: destination.lat, lng: destination.lng },
    distanceMeters,
    durationMinutes:
      minutesFromKmh(distanceMeters, speedKmh) + ROUTING_CONFIG.ojekPickupWaitMinutes,
    cost: calculateFare(tarif, distanceMeters),
    moda,
  };
}

function buildWalkSegment(
  from: { id?: number; name: string; lat: number; lng: number },
  to: { id?: number; name: string; lat: number; lng: number }
): InternalSegment {
  const distanceMeters = roadDistanceMeters(from, to);
  return {
    type: 'WALK',
    from,
    to,
    distanceMeters,
    durationMinutes: minutesFromKmh(distanceMeters, ROUTING_CONFIG.walkingSpeedKmh),
    cost: 0,
  };
}

function buildAccessOptions(
  point: CandidateEndpoint,
  network: RoutingNetwork,
  maxWalkingDistanceMeters: number,
  ojekAvailable: boolean
): { options: AccessOption[]; hasWalk: boolean } {
  const nearest = nearestWithin(
    network.stops,
    point,
    { radiusMeters: ROUTING_CONFIG.searchRadiusMeters, limit: ROUTING_CONFIG.nearestStopsPerEnd },
    (stop) => ({ lat: stop.lat, lng: stop.lng })
  );

  const options: AccessOption[] = [];
  let hasWalk = false;

  for (const { item: stop, distanceMeters } of nearest) {
    if (distanceMeters <= maxWalkingDistanceMeters) {
      options.push({ stop, mode: 'WALK', distanceMeters });
      hasWalk = true;
    } else if (
      ojekAvailable &&
      distanceMeters >= ROUTING_CONFIG.connectorOjekVariantMinMeters &&
      distanceMeters <= ROUTING_CONFIG.connectorOjekMaxKm * 1000
    ) {
      options.push({ stop, mode: 'OJEK', distanceMeters });
    }
  }

  return { options, hasWalk };
}

export function buildRouteCandidates(input: CandidateSearchInput): CandidateSearchResult {
  const { origin, destination, maxWalkingDistanceMeters, network } = input;
  const notices: string[] = [];
  const candidates: RouteCandidate[] = [];
  let capReached = false;

  const ojekModa = network.ojekModa;
  const ojekTarif = network.ojekTarif;
  const ojekAvailable = ojekModa !== null && ojekTarif !== null;
  if (ojekModa !== null && ojekTarif === null) {
    notices.push('Tarif ojek belum dikonfigurasi sehingga rekomendasi ojek tidak tersedia.');
  }

  const accessOrigin = buildAccessOptions(origin, network, maxWalkingDistanceMeters, ojekAvailable);
  const accessDest = buildAccessOptions(destination, network, maxWalkingDistanceMeters, ojekAvailable);
  const transitFeasible = accessOrigin.options.length > 0 && accessDest.options.length > 0;

  if (transitFeasible && (!accessOrigin.hasWalk || !accessDest.hasWalk)) {
    notices.push('Tidak ada halte dalam jangkauan jalan kaki; rute memakai ojek.');
  }

  const seenKeys = new Set<string>();
  const tryPush = (segments: InternalSegment[]): void => {
    const candidate = assembleCandidate(segments);
    if (!candidate) return;
    if (seenKeys.has(candidate.dedupeKey)) return;
    if (candidates.length >= ROUTING_CONFIG.maxCandidatesGenerated) {
      capReached = true;
      throw new CapReachedError();
    }
    seenKeys.add(candidate.dedupeKey);
    candidates.push(candidate);
  };

  // Akses ujung (jalan kaki / ojek penghubung) dibangun sekali per opsi.
  const accessSegCache = new Map<string, InternalSegment>();
  const accessSegment = (
    side: 'origin' | 'dest',
    option: AccessOption
  ): InternalSegment => {
    const cacheKey = `${side}:${option.stop.id}:${option.mode}`;
    const cached = accessSegCache.get(cacheKey);
    if (cached) return cached;

    const stopPoint = {
      id: option.stop.id,
      name: option.stop.nama,
      lat: option.stop.lat,
      lng: option.stop.lng,
    };
    const endpoint = side === 'origin' ? origin : destination;
    const from = side === 'origin' ? { name: endpoint.name, lat: endpoint.lat, lng: endpoint.lng } : stopPoint;
    const to = side === 'origin' ? stopPoint : { name: endpoint.name, lat: endpoint.lat, lng: endpoint.lng };

    let segment: InternalSegment;
    if (option.mode === 'WALK') {
      segment = buildWalkSegment(from, to);
    } else {
      const distanceMeters = roadDistanceMeters(from, to);
      const speedKmh = ojekModa?.rataRataKecepatanKmh ?? ROUTING_CONFIG.ojekSpeedKmh;
      segment = {
        type: 'OJEK',
        from,
        to,
        distanceMeters,
        durationMinutes:
          minutesFromKmh(distanceMeters, speedKmh) + ROUTING_CONFIG.ojekPickupWaitMinutes,
        cost: ojekTarif ? calculateFare(ojekTarif, distanceMeters) : 0,
        moda: ojekModa ?? undefined,
      };
    }
    accessSegCache.set(cacheKey, segment);
    return segment;
  };

  const needsAccess = (option: AccessOption): boolean =>
    !(option.mode === 'WALK' && option.distanceMeters === 0);

  // --- OJEK LANGSUNG: selalu ada bila ojek diizinkan ---
  if (ojekAvailable && ojekModa && ojekTarif) {
    tryPush([buildOjekDirectSegment(origin, destination, ojekModa, ojekTarif)]);
  }

  const rutesByStop = new Map<number, NetworkRute[]>();
  for (const rute of network.rutes) {
    for (const stop of rute.stops) {
      const list = rutesByStop.get(stop.halteId);
      if (list) list.push(rute);
      else rutesByStop.set(stop.halteId, [rute]);
    }
  }

  const transferTargets = (
    stop: NetworkRuteStop
  ): Array<{ stop: NetworkStop; walkSegment: InternalSegment | null }> => {
    const result: Array<{ stop: NetworkStop; walkSegment: InternalSegment | null }> = [
      { stop: stop.halte, walkSegment: null },
    ];
    for (const neighbor of network.transferNeighbors.get(stop.halteId) ?? []) {
      const distance = haversineMeters(stop.halte, neighbor);
      if (distance === 0) continue;
      result.push({
        stop: neighbor,
        walkSegment: buildWalkSegment(
          { id: stop.halte.id, name: stop.halte.nama, lat: stop.halte.lat, lng: stop.halte.lng },
          { id: neighbor.id, name: neighbor.nama, lat: neighbor.lat, lng: neighbor.lng }
        ),
      });
    }
    return result;
  };

  if (transitFeasible && network.rutes.length > 0) {
    try {
      // ============ ROUND 0: tanpa transfer ============
      for (const rute of network.rutes) {
        for (const accO of accessOrigin.options) {
          const fromIdx = rute.positions.get(accO.stop.id);
          if (fromIdx === undefined) continue;
          for (const accD of accessDest.options) {
            const toIdx = rute.positions.get(accD.stop.id);
            if (toIdx === undefined || toIdx <= fromIdx) continue;

            const segments: InternalSegment[] = [];
            if (needsAccess(accO)) segments.push(accessSegment('origin', accO));
            segments.push(buildRideSegment(rute, fromIdx, toIdx, network));
            if (needsAccess(accD)) segments.push(accessSegment('dest', accD));
            tryPush(segments);
          }
        }
      }

      // ============ ROUND 1: satu transfer (maks 1 walk antarhalte) ============
      for (const rute1 of network.rutes) {
        for (const accO of accessOrigin.options) {
          const boardIdx = rute1.positions.get(accO.stop.id);
          if (boardIdx === undefined) continue;

          for (let exitIdx = boardIdx + 1; exitIdx < rute1.stops.length; exitIdx++) {
            const exitStop = rute1.stops[exitIdx];

            for (const transfer of transferTargets(exitStop)) {
              const rute2List = rutesByStop.get(transfer.stop.id) ?? [];
              for (const rute2 of rute2List) {
                if (rute2.id === rute1.id) continue;
                const boardIdx2 = rute2.positions.get(transfer.stop.id);
                if (boardIdx2 === undefined) continue;

                for (const accD of accessDest.options) {
                  const exitIdx2 = rute2.positions.get(accD.stop.id);
                  if (exitIdx2 === undefined || exitIdx2 <= boardIdx2) continue;

                  const segments: InternalSegment[] = [];
                  if (needsAccess(accO)) segments.push(accessSegment('origin', accO));
                  segments.push(buildRideSegment(rute1, boardIdx, exitIdx, network));
                  if (transfer.walkSegment) segments.push(transfer.walkSegment);
                  segments.push(buildRideSegment(rute2, boardIdx2, exitIdx2, network));
                  if (needsAccess(accD)) segments.push(accessSegment('dest', accD));
                  tryPush(segments);
                }
              }
            }
          }
        }
      }

      // ============ ROUND 2: dua transfer (maks 2 walk antarhalte) ============
      for (const rute1 of network.rutes) {
        for (const accO of accessOrigin.options) {
          const boardIdx = rute1.positions.get(accO.stop.id);
          if (boardIdx === undefined) continue;

          for (let exitIdx = boardIdx + 1; exitIdx < rute1.stops.length; exitIdx++) {
            const exitStop1 = rute1.stops[exitIdx];

            for (const transfer1 of transferTargets(exitStop1)) {
              const rute2List = rutesByStop.get(transfer1.stop.id) ?? [];
              for (const rute2 of rute2List) {
                if (rute2.id === rute1.id) continue;
                const boardIdx2 = rute2.positions.get(transfer1.stop.id);
                if (boardIdx2 === undefined) continue;

                for (let exitIdx2 = boardIdx2 + 1; exitIdx2 < rute2.stops.length; exitIdx2++) {
                  const exitStop2 = rute2.stops[exitIdx2];

                  for (const transfer2 of transferTargets(exitStop2)) {
                    const rute3List = rutesByStop.get(transfer2.stop.id) ?? [];
                    for (const rute3 of rute3List) {
                      if (rute3.id === rute1.id || rute3.id === rute2.id) continue;
                      const boardIdx3 = rute3.positions.get(transfer2.stop.id);
                      if (boardIdx3 === undefined) continue;

                      for (const accD of accessDest.options) {
                        const exitIdx3 = rute3.positions.get(accD.stop.id);
                        if (exitIdx3 === undefined || exitIdx3 <= boardIdx3) continue;

                        const segments: InternalSegment[] = [];
                        if (needsAccess(accO)) segments.push(accessSegment('origin', accO));
                        segments.push(buildRideSegment(rute1, boardIdx, exitIdx, network));
                        if (transfer1.walkSegment) segments.push(transfer1.walkSegment);
                        segments.push(buildRideSegment(rute2, boardIdx2, exitIdx2, network));
                        if (transfer2.walkSegment) segments.push(transfer2.walkSegment);
                        segments.push(buildRideSegment(rute3, boardIdx3, exitIdx3, network));
                        if (needsAccess(accD)) segments.push(accessSegment('dest', accD));
                        tryPush(segments);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (!(err instanceof CapReachedError)) throw err;
    }
  }

  // --- Notifikasi akhir ---
  const transitCandidates = candidates.filter((c) => c.category !== 'ojek_langsung');
  if (!transitFeasible && network.stops.length > 0) {
    notices.push(
      ojekAvailable
        ? 'Titik asal/tujuan tidak berada dalam jangkauan halte (jalan kaki/ojek); hanya rute ojek langsung yang dapat direkomendasikan.'
        : 'Titik asal/tujuan tidak berada dalam jangkauan halte dan ojek tidak diizinkan; tidak ada rute yang dapat direkomendasikan.'
    );
  } else if (network.stops.length === 0) {
    notices.push('Belum ada data halte/rute di sistem; tidak ada rute yang dapat direkomendasikan.');
  } else if (transitCandidates.length === 0) {
    notices.push(
      ojekAvailable
        ? 'Tidak ditemukan rute bus/kereta yang menghubungkan kedua titik; hanya rute ojek langsung yang direkomendasikan.'
        : 'Tidak ditemukan rute bus/kereta yang menghubungkan kedua titik.'
    );
  }
  if (capReached) {
    notices.push('Batas kandidat pencarian tercapai; sebagian kombinasi dilewati.');
  }

  // ID unik deterministik per respons (urutan generasi stabil).
  candidates.forEach((candidate, index) => {
    candidate.id = `route-${index + 1}`;
  });

  return { candidates, notices };
}
