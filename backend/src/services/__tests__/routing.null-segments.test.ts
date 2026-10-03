import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRouteCandidates } from '../route-candidates';
import {
  buildPositions,
  NetworkModa,
  NetworkStop,
  NetworkTarif,
  RoutingNetwork,
} from '../routing-network';
import { ROUTING_CONFIG, minutesFromKmh } from '../../config/routing.config';
import { haversineMeters } from '../../utils/geo';

const HALTE_A: NetworkStop = { id: 101, nama: 'Halte A', lat: -6.916, lng: 107.6024, isTransit: true };
const HALTE_B: NetworkStop = { id: 102, nama: 'Halte B', lat: -6.9174, lng: 107.6038, isTransit: false };

function makeModa(speed: number | null, id = 1): NetworkModa {
  return {
    id,
    namaModa: 'Bus Test',
    tipeModa: 'BRT',
    ikon: 'bus',
    rataRataKecepatanKmh: speed,
    category: 'BUS',
  };
}

const busTarif: NetworkTarif = {
  modaId: 1,
  ruteId: 201,
  tipeTarif: 'FLAT',
  nominalDasar: 4900,
  nominalPerKm: 0,
  jarakMinimumKm: null,
  keterangan: 'test',
};

function makeNetwork(
  moda: NetworkModa,
  stops: Array<{ halte: NetworkStop; estimasiMenit: number | null; jarakMeter: number | null }>
): RoutingNetwork {
  const ruteStops = stops.map((s, index) => ({
    halteId: s.halte.id,
    urutan: index + 1,
    estimasiMenit: s.estimasiMenit,
    jarakMeter: s.jarakMeter,
    halte: s.halte,
  }));
  return {
    stops: [HALTE_A, HALTE_B],
    rutes: [
      {
        id: 201,
        nama: 'Bus A-B',
        kode: 'B1',
        moda,
        stops: ruteStops,
        positions: buildPositions(ruteStops),
      },
    ],
    ojekModa: null,
    ojekTarif: null,
    transferNeighbors: new Map(),
    tarifByRute: new Map([[201, busTarif]]),
    tarifByModaDefault: new Map(),
  };
}

const ORIGIN = { name: 'Asal dekat A', lat: -6.9161, lng: 107.6025 };
const DEST = { name: 'Tujuan dekat B', lat: -6.9175, lng: 107.6039 };

function findBus(network: RoutingNetwork) {
  const { candidates } = buildRouteCandidates({
    origin: ORIGIN,
    destination: DEST,
    maxWalkingDistanceMeters: 1500,
    network,
  });
  const bus = candidates.find((c) => c.segments.some((s) => s.type === 'BUS'));
  assert.ok(bus, 'harus ada kandidat BUS');
  return bus.segments.find((s) => s.type === 'BUS');
}

test('J1-X: moda berkecepatan 0 memakai default kategori, menit berhingga > 0', () => {
  const seg = findBus(makeNetwork(makeModa(0), [
    { halte: HALTE_A, estimasiMenit: null, jarakMeter: null },
    { halte: HALTE_B, estimasiMenit: null, jarakMeter: null },
  ]));
  assert.ok(seg);
  assert.ok(Number.isFinite(seg.durationMinutes), `durasi harus berhingga, dapat ${seg.durationMinutes}`);
  assert.ok(seg.durationMinutes > 0, `durasi harus > 0, dapat ${seg.durationMinutes}`);
  assert.ok(Number.isFinite(seg.distanceMeters) && seg.distanceMeters > 0);
});

test('J1-X: moda berkecepatan -5 memakai default kategori, menit berhingga > 0', () => {
  const seg = findBus(makeNetwork(makeModa(-5), [
    { halte: HALTE_A, estimasiMenit: null, jarakMeter: null },
    { halte: HALTE_B, estimasiMenit: null, jarakMeter: null },
  ]));
  assert.ok(seg);
  assert.ok(Number.isFinite(seg.durationMinutes), `durasi harus berhingga, dapat ${seg.durationMinutes}`);
  assert.ok(seg.durationMinutes > 0, `durasi harus > 0, dapat ${seg.durationMinutes}`);
});

test('J3-j: null/null fallback = haversine + minutesFromKmh default bus', () => {
  const seg = findBus(makeNetwork(makeModa(20), [
    { halte: HALTE_A, estimasiMenit: null, jarakMeter: null },
    { halte: HALTE_B, estimasiMenit: null, jarakMeter: null },
  ]));
  assert.ok(seg);
  const expectedDist = haversineMeters(HALTE_A, HALTE_B);
  const expectedTravel = minutesFromKmh(expectedDist, ROUTING_CONFIG.busSpeedKmh, 2);
  const expectedDuration = Math.max(2, expectedTravel) + ROUTING_CONFIG.busWaitMinutes;
  assert.equal(seg.distanceMeters, expectedDist);
  assert.equal(seg.durationMinutes, expectedDuration);
});

test('J3-j: menit terisi + jarak kosong (independen): jarak haversine, durasi manual', () => {
  const seg = findBus(makeNetwork(makeModa(20), [
    { halte: HALTE_A, estimasiMenit: 7, jarakMeter: null },
    { halte: HALTE_B, estimasiMenit: null, jarakMeter: null },
  ]));
  assert.ok(seg);
  const expectedDist = haversineMeters(HALTE_A, HALTE_B);
  const expectedDuration = Math.max(2, 7) + ROUTING_CONFIG.busWaitMinutes;
  assert.equal(seg.distanceMeters, expectedDist);
  assert.equal(seg.durationMinutes, expectedDuration);
});

test('J3-j: jarak terisi + menit kosong (independen): jarak manual, durasi dari kecepatan', () => {
  const seg = findBus(makeNetwork(makeModa(20), [
    { halte: HALTE_A, estimasiMenit: null, jarakMeter: 1234 },
    { halte: HALTE_B, estimasiMenit: null, jarakMeter: null },
  ]));
  assert.ok(seg);
  const expectedTravel = minutesFromKmh(1234, ROUTING_CONFIG.busSpeedKmh, 2);
  const expectedDuration = Math.max(2, expectedTravel) + ROUTING_CONFIG.busWaitMinutes;
  assert.equal(seg.distanceMeters, 1234);
  assert.equal(seg.durationMinutes, expectedDuration);
});
