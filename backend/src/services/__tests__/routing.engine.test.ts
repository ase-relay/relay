import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRouteCandidates, RouteCandidate } from '../route-candidates';
import { pruneAndRank } from '../route-scoring';
import {
  buildPositions,
  buildTransferNeighbors,
  NetworkModa,
  NetworkRute,
  NetworkRuteStop,
  NetworkStop,
  NetworkTarif,
  RoutingNetwork,
} from '../routing-network';

/* ==========================================
 * Fixture jaringan murni (tanpa database)
 * ========================================== */

const A: NetworkStop = { id: 1, nama: 'Halte A', lat: -6.916, lng: 107.6024, isTransit: true };
const B: NetworkStop = { id: 2, nama: 'Halte B', lat: -6.9174, lng: 107.6038, isTransit: false };
const C: NetworkStop = { id: 3, nama: 'Halte C', lat: -6.9215, lng: 107.6076, isTransit: true };
const D: NetworkStop = { id: 4, nama: 'Halte D', lat: -6.9082, lng: 107.6094, isTransit: false };
const E: NetworkStop = { id: 5, nama: 'Halte E', lat: -6.8938, lng: 107.6056, isTransit: false };
const F: NetworkStop = { id: 6, nama: 'Halte F', lat: -6.8852, lng: 107.6137, isTransit: true };
const X: NetworkStop = { id: 7, nama: 'Stasiun X', lat: -6.8858, lng: 107.5362, isTransit: true };

const busModa: NetworkModa = {
  id: 1,
  namaModa: 'Bus Test',
  tipeModa: 'BRT',
  ikon: 'bus',
  rataRataKecepatanKmh: 20,
  category: 'BUS',
};
const keretaModa: NetworkModa = {
  id: 2,
  namaModa: 'Kereta Test',
  tipeModa: 'COMMUTER_TRAIN',
  ikon: 'train',
  rataRataKecepatanKmh: 35,
  category: 'KERETA',
};
const ojekModa: NetworkModa = {
  id: 3,
  namaModa: 'Ojek Test',
  tipeModa: 'RIDE_HAILING',
  ikon: 'motorcycle',
  rataRataKecepatanKmh: 22,
  category: 'OJEK',
};

const busTarif: NetworkTarif = {
  modaId: 1,
  tipeTarif: 'FLAT',
  nominalDasar: 4900,
  nominalPerKm: 0,
  jarakMinimumKm: null,
  biayaLayanan: 0,
  keterangan: 'test',
};
const keretaTarif: NetworkTarif = {
  modaId: 2,
  tipeTarif: 'FLAT',
  nominalDasar: 5000,
  nominalPerKm: 0,
  jarakMinimumKm: null,
  biayaLayanan: 0,
  keterangan: 'test',
};
const ojekTarif: NetworkTarif = {
  modaId: 3,
  tipeTarif: 'PER_KM',
  nominalDasar: 10000,
  nominalPerKm: 2500,
  jarakMinimumKm: 2,
  biayaLayanan: 0,
  keterangan: 'test',
};

function makeRute(
  id: number,
  nama: string,
  kode: string,
  moda: NetworkModa,
  stops: NetworkStop[]
): NetworkRute {
  const ruteStops: NetworkRuteStop[] = stops.map((stop, index) => ({
    halteId: stop.id,
    urutan: index + 1,
    estimasiMenit: null,
    jarakMeter: null,
    halte: stop,
  }));
  return { id, nama, kode, moda, stops: ruteStops, positions: buildPositions(ruteStops) };
}

const STOPS: NetworkStop[] = [A, B, C, D, E, F, X];
const RUTE_BUS = makeRute(11, 'Bus A - F', 'B1', busModa, [A, B, C, D, E, F]);
const RUTE_KERETA = makeRute(12, 'Kereta X - D', 'K1', keretaModa, [X, C, D]);
const RUTE_BUS2 = makeRute(13, 'Bus C - F', 'B2', busModa, [C, D, E, F]);

function makeNetwork(): RoutingNetwork {
  return {
    stops: STOPS,
    rutes: [RUTE_BUS, RUTE_KERETA, RUTE_BUS2],
    ojekModa,
    ojekTarif,
    transferNeighbors: buildTransferNeighbors(STOPS),
    tarifByModa: new Map([
      [1, busTarif],
      [2, keretaTarif],
      [3, ojekTarif],
    ]),
  };
}

const ORIGIN_NEAR_A = { name: 'Asal dekat A', lat: -6.9185, lng: 107.6005 }; // ~350 m
const DEST_NEAR_F = { name: 'Tujuan dekat F', lat: -6.887, lng: 107.612 }; // ~275 m
const ORIGIN_FAR = { name: 'Asal jauh', lat: -7.05, lng: 107.75 }; // >10 km dari halte mana pun
const ORIGIN_OUT_OF_WALK = { name: 'Asal 1,7 km', lat: -6.93, lng: 107.595 }; // ~1,7 km
const ORIGIN_NEAR_X = { name: 'Asal dekat X', lat: -6.8885, lng: 107.537 }; // ~310 m

function search(
  origin: { name: string; lat: number; lng: number },
  destination: { name: string; lat: number; lng: number },
  options: { maxWalkingDistance?: number; network?: RoutingNetwork } = {}
) {
  return buildRouteCandidates({
    origin,
    destination,
    maxWalkingDistanceMeters: options.maxWalkingDistance ?? 1500,
    network: options.network ?? makeNetwork(),
  });
}

/* ==========================================
 * Skenario wajib
 * ========================================== */

test('1. OJEK_LANGSUNG selalu tersedia meski tidak ada halte terjangkau', () => {
  const { candidates, notices } = search(ORIGIN_FAR, DEST_NEAR_F);

  assert.equal(candidates.length, 1, 'hanya rute ojek langsung yang mungkin');
  const route = candidates[0];
  assert.equal(route.category, 'ojek_langsung');
  assert.equal(route.transfersCount, 0);
  assert.equal(route.segments.length, 1);
  assert.equal(route.segments[0].type, 'OJEK');
  assert.ok(route.totalCost >= 10000, 'tarif ojek memakai tarif minimum');
  assert.ok(notices.length > 0, 'ada notice penjelasan');
});

test('2. Rute direct bus dengan akses jalan kaki <800 m dihasilkan', () => {
  const { candidates } = search(ORIGIN_NEAR_A, DEST_NEAR_F);

  const directBus = candidates.find(
    (c) => c.category === 'bus' && c.transfersCount === 0 && c.segments[1]?.type === 'BUS'
  );
  assert.ok(directBus, 'ada kandidat bus direct');
  assert.equal(directBus.segments[0].type, 'WALK');
  assert.ok(
    directBus.walkingDistanceMeters <= 800 + 300,
    'akses jalan kaki ringan (orig ~350 m + dest ~275 m, faktor jalan)'
  );
  assert.ok(directBus.segments[1].passedStops!.length >= 2, 'segmen BUS membawa daftar halte');
  assert.ok(directBus.totalCost > 0, 'ada tarif');
});

test('3. Halte terlalu jauh -> segmen wajib memakai ojek penghubung', () => {
  const { candidates, notices } = search(ORIGIN_OUT_OF_WALK, DEST_NEAR_F, {
    maxWalkingDistance: 800,
  });

  const viaOjek = candidates.filter(
    (c) => c.category !== 'ojek_langsung' && c.segments[0]?.type === 'OJEK'
  );
  assert.ok(viaOjek.length > 0, 'akses pertama memakai ojek karena tak ada halte <800 m');
  assert.ok(
    notices.includes('Tidak ada halte dalam jangkauan jalan kaki; rute memakai ojek.'),
    `notice wajib ada, dapat: ${JSON.stringify(notices)}`
  );
  const busRoute = viaOjek.find((c) => c.segments.some((s) => s.type === 'BUS'));
  assert.ok(busRoute, 'tetap ada naik bus setelah ojek penghubung');
  assert.ok(busRoute.transfersCount >= 1, 'ojek -> bus = minimal 1 perpindahan kendaraan');
});

test('4. Transit rute berbeda (round 1 & round 2) dihasilkan dari urutan RuteStop', () => {
  const { candidates } = search(ORIGIN_NEAR_X, DEST_NEAR_F);

  // Round 1: kereta X->C lalu lanjut bus
  const round1 = candidates.find((c) => c.transfersCount === 1 && c.segments.some((s) => s.type === 'KERETA'));
  assert.ok(round1, 'ada kandidat dengan 1 transfer yang memakai kereta');

  // Round 2: kereta -> bus2 -> bus1 (3 kendaraan = 2 transfer)
  const round2 = candidates.find((c) => c.transfersCount === 2);
  assert.ok(round2, 'ada kandidat dengan 2 transfer');
  assert.ok(round2.segments.filter((s) => s.type !== 'WALK').length <= 3, 'maks 3 kendaraan');

  // Arah rute dihormati: naik di indeks lebih kecil, turun lebih besar
  for (const candidate of candidates) {
    for (const segment of candidate.segments) {
      if (segment.type === 'BUS' || segment.type === 'KERETA') {
        assert.ok(segment.passedStops && segment.passedStops.length >= 2);
        const urutan = segment.passedStops.map((s) => s.urutan);
        assert.deepEqual(
          urutan,
          [...urutan].sort((a, b) => a - b),
          'urutan stop menaik (searah rute)'
        );
      }
    }
  }
});

test('5. allowedModa mengecualikan moda -> tidak ada segmen KERETA', () => {
  const network = makeNetwork();
  const filtered: RoutingNetwork = {
    ...network,
    rutes: network.rutes.filter((r) => r.moda.category !== 'KERETA'),
  };
  const { candidates } = search(ORIGIN_NEAR_A, DEST_NEAR_F, { network: filtered });

  assert.ok(candidates.length > 0, 'tetap ada kandidat tanpa kereta');
  for (const candidate of candidates) {
    for (const segment of candidate.segments) {
      assert.notEqual(segment.type, 'KERETA', 'segmen kereta tidak boleh muncul');
    }
  }
});

test('6. sortBy: FASTEST/CHEAPEST/LEAST_TRANSFERS/RECOMMENDED menentukan urutan', () => {
  const { candidates } = search(ORIGIN_NEAR_A, DEST_NEAR_F);
  assert.ok(candidates.length >= 2, 'punya beberapa kandidat untuk diurutkan');

  const fastest = pruneAndRank(candidates, 'FASTEST');
  assert.ok(fastest.length > 0);
  assert.equal(
    fastest[0].totalDurationMinutes,
    Math.min(...fastest.map((r) => r.totalDurationMinutes)),
    'FASTEST diawali durasi terkecil'
  );

  const cheapest = pruneAndRank(candidates, 'CHEAPEST');
  assert.equal(
    cheapest[0].totalCost,
    Math.min(...cheapest.map((r) => r.totalCost)),
    'CHEAPEST diawali biaya terkecil'
  );

  const least = pruneAndRank(candidates, 'LEAST_TRANSFERS');
  assert.equal(
    least[0].transfersCount,
    Math.min(...least.map((r) => r.transfersCount)),
    'LEAST_TRANSFERS diawali jumlah transfer terkecil'
  );

  const recommended = pruneAndRank(candidates, 'RECOMMENDED');
  assert.ok(recommended[0].tags.includes('direkomendasikan'), 'hasil teratas ditandai direkomendasikan');
  for (let i = 1; i < recommended.length; i++) {
    assert.ok(
      recommended[i - 1].score <= recommended[i].score,
      'RECOMMENDED terurut menaik berdasarkan skor'
    );
  }
});

test('8. Diversity: minimal satu kandidat per kategori sebelum dipotong maks 8', () => {
  const make = (
    id: string,
    category: RouteCandidate['category'],
    totalCost: number,
    totalDurationMinutes: number,
    transfersCount: number,
    walkingDistanceMeters: number
  ): RouteCandidate => ({
    id,
    category,
    segments: [],
    totalCost,
    totalDurationMinutes,
    totalDistanceMeters: 1000,
    transfersCount,
    walkingDistanceMeters,
    rideRuteIds: [],
    dedupeKey: `k-${id}`,
  });

  const pool: RouteCandidate[] = [];
  // 12 kandidat bus saling bertrade-off (biaya naik, durasi turun)
  for (let i = 0; i < 12; i++) {
    pool.push(make(`b${i}`, 'bus', 4900 + i * 50, 35 - i, 0, 500 + i * 10));
  }
  // 3 kandidat kereta (jalan kaki paling sedikit -> tidak didominasi bus)
  for (let i = 0; i < 3; i++) {
    pool.push(make(`k${i}`, 'kereta', 8000 + i * 100, 40 - i, 1, 400 + i * 10));
  }
  // Ojek langsung + campuran
  pool.push(make('oj', 'ojek_langsung', 30000, 30, 0, 0));
  pool.push(make('cp', 'campuran', 9900, 42, 1, 300));
  // Kandidat yang harus didominasi (kalah di semua metrik)
  pool.push(make('loser', 'bus', 99999, 999, 2, 9999));

  const ranked = pruneAndRank(pool, 'RECOMMENDED');

  assert.ok(ranked.length <= 8, 'dipotong ke maks 8 hasil');
  assert.ok(!ranked.some((r) => r.id === 'loser'), 'kandidat didominasi dibuang');

  const categories = new Set(ranked.map((r) => r.category));
  for (const category of ['bus', 'kereta', 'ojek_langsung', 'campuran']) {
    assert.ok(
      categories.has(category as RouteCandidate['category']),
      `kategori ${category} tetap terwakili sebelum dipotong`
    );
  }
  assert.ok(ranked.every((r) => r.tags.length > 0 || ranked.length > 4), 'tag minimal terisi');
});
