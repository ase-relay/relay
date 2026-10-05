import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFare, roundUpToStep, sanitizeBiayaLayanan } from '../fare-calculator';
import { buildRouteCandidates } from '../route-candidates';
import {
  buildPositions,
  buildTransferNeighbors,
  NetworkModa,
  NetworkStop,
  NetworkTarif,
  RoutingNetwork,
} from '../routing-network';

test('7a. Tarif ojek: jarak <= jarakMinimum tetap tarif minimum', () => {
  const tarif = {
    tipeTarif: 'PER_KM' as const,
    nominalDasar: 10000,
    nominalPerKm: 2500,
    jarakMinimumKm: 2,
    biayaLayanan: 0,
  };
  assert.equal(calculateFare(tarif, 1500), 10000);
  assert.equal(calculateFare(tarif, 2000), 10000); // tepat di batas
});

test('7b. Tarif ojek: di atas jarakMinimum memakai nominalDasar + selisih x perKm', () => {
  const tarif = {
    tipeTarif: 'PER_KM' as const,
    nominalDasar: 10000,
    nominalPerKm: 2500,
    jarakMinimumKm: 2,
    biayaLayanan: 0,
  };
  assert.equal(calculateFare(tarif, 5000), 17500); // 10000 + 3 x 2500
  assert.equal(calculateFare(tarif, 3100), 13000); // 12750 -> dibulatkan ke atas Rp 500
});

test('7c. Pembulatan tarif ojek selalu ke atas ke kelipatan Rp 500', () => {
  assert.equal(roundUpToStep(12301, 500), 12500);
  assert.equal(roundUpToStep(17000, 500), 17000);
  const tarif = {
    tipeTarif: 'PER_KM' as const,
    nominalDasar: 10100,
    nominalPerKm: 0,
    jarakMinimumKm: 1,
    biayaLayanan: 0,
  };
  assert.equal(calculateFare(tarif, 500), 10500);
});

test('7d. Tarif transit: FLAT dan PER_KM, dan fallback', () => {
  // FLAT
  assert.equal(
    calculateFare({ tipeTarif: 'FLAT', nominalDasar: 4900, nominalPerKm: 0, jarakMinimumKm: null, biayaLayanan: 0 }, 5000),
    4900
  );

  // PER_KM (rumus tunggal, sama untuk semua moda): 5000 + 2 x 2000
  assert.equal(
    calculateFare(
      { tipeTarif: 'PER_KM', nominalDasar: 5000, nominalPerKm: 2000, jarakMinimumKm: null, biayaLayanan: 0 },
      2000
    ),
    9000
  );

  // Tanpa baris tarif -> fallback konfigurasi
  assert.equal(calculateFare(null, 1000), 5000);
});

test('T1-B(a). PER_KM: biayaLayanan ditambahkan SETELAH pembulatan', () => {
  const tarif = {
    tipeTarif: 'PER_KM' as const,
    nominalDasar: 10000,
    nominalPerKm: 2500,
    jarakMinimumKm: 2,
    biayaLayanan: 1000,
  };
  // 3100 m -> 10000 + 1.1 x 2500 = 12750 -> dibulatkan 13000 -> + 1000 = 14000
  assert.equal(calculateFare(tarif, 3100), 14000);
});

test('T1-B(b). FLAT mengabaikan nominalPerKm, jarakMinimumKm, dan biayaLayanan', () => {
  assert.equal(
    calculateFare(
      { tipeTarif: 'FLAT', nominalDasar: 4900, nominalPerKm: 9999, jarakMinimumKm: 99, biayaLayanan: 5000 },
      10000
    ),
    4900
  );
});

test('T1-B(c). PER_KM moda non-ojek (bus) memakai rumus yang sama', () => {
  const tarif = {
    tipeTarif: 'PER_KM' as const,
    nominalDasar: 5000,
    nominalPerKm: 1000,
    jarakMinimumKm: 2,
    biayaLayanan: 500,
  };
  // 5000 m -> 5000 + 3 x 1000 = 8000 (pas kelipatan 500) -> + 500 = 8500
  assert.equal(calculateFare(tarif, 5000), 8500);
});

test('T1-B(sanitasi). biayaLayanan bukan angka berhingga atau negatif -> 0', () => {
  assert.equal(sanitizeBiayaLayanan(1000), 1000);
  assert.equal(sanitizeBiayaLayanan(0), 0);
  assert.equal(sanitizeBiayaLayanan(-5), 0);
  assert.equal(sanitizeBiayaLayanan(NaN), 0);
  assert.equal(sanitizeBiayaLayanan(Infinity), 0);
  assert.equal(sanitizeBiayaLayanan('1000'), 0);
  assert.equal(sanitizeBiayaLayanan(null), 0);
  assert.equal(sanitizeBiayaLayanan(undefined), 0);
});

/* ---- Engine: biayaLayanan per leg ojek ---- */

const STOP_A: NetworkStop = { id: 1, nama: 'Halte A', lat: -6.9, lng: 107.6, isTransit: false };
const STOP_B: NetworkStop = { id: 2, nama: 'Halte B', lat: -6.91, lng: 107.61, isTransit: false };

const busModa: NetworkModa = {
  id: 1,
  namaModa: 'Bus Test',
  tipeModa: 'BRT',
  ikon: 'bus',
  rataRataKecepatanKmh: 20,
  category: 'BUS',
};
const ojekModa: NetworkModa = {
  id: 4,
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

function ojekTarifDenganLayanan(layanan: number): NetworkTarif {
  return {
    modaId: 4,
    tipeTarif: 'PER_KM',
    nominalDasar: 10000,
    nominalPerKm: 2500,
    jarakMinimumKm: 2,
    biayaLayanan: layanan,
    keterangan: 'test',
  };
}

function makeNetwork(layananOjek: number): RoutingNetwork {
  const ruteStops = [STOP_A, STOP_B].map((stop, index) => ({
    halteId: stop.id,
    urutan: index + 1,
    estimasiMenit: null as number | null,
    jarakMeter: null as number | null,
    jadwalKeberangkatan: [] as string[],
    geometri: null as [number, number][] | null,
    halte: stop,
  }));
  const ojekTarif = ojekTarifDenganLayanan(layananOjek);
  return {
    stops: [STOP_A, STOP_B],
    rutes: [
      {
        id: 101,
        nama: 'Bus A-B',
        kode: 'B1',
        jamMulaiOperasi: null,
        jamSelesaiOperasi: null,
        intervalWaktu: null,
        moda: busModa,
        stops: ruteStops,
        positions: buildPositions(ruteStops),
      },
    ],
    ojekModa,
    ojekTarif,
    transferNeighbors: buildTransferNeighbors([STOP_A, STOP_B]),
    tarifByModa: new Map([
      [1, busTarif],
      [4, ojekTarif],
    ]),
  };
}

const ORIGIN_FAR = { name: 'Asal jauh', lat: -6.92, lng: 107.58 };
const DEST_FAR = { name: 'Tujuan jauh', lat: -6.93, lng: 107.63 };
const ORIGIN_NEAR_A = { name: 'Asal dekat A', lat: -6.9005, lng: 107.6005 };
const DEST_NEAR_B = { name: 'Tujuan dekat B', lat: -6.9105, lng: 107.6105 };

function cariBusDenganOjek(
  network: RoutingNetwork,
  origin: { name: string; lat: number; lng: number },
  destination: { name: string; lat: number; lng: number }
) {
  const { candidates } = buildRouteCandidates({
    origin,
    destination,
    maxWalkingDistanceMeters: 500,
    network,
  });
  const bus = candidates.find(
    (c) => c.segments.some((s) => s.type === 'BUS') && c.segments.some((s) => s.type === 'OJEK')
  );
  assert.ok(bus, 'harus ada kandidat bus dengan akses ojek');
  return bus;
}

test('T1-B(d). Dua leg ojek -> biayaLayanan dihitung DUA kali', () => {
  const tanpa = cariBusDenganOjek(makeNetwork(0), ORIGIN_FAR, DEST_FAR);
  const dengan = cariBusDenganOjek(makeNetwork(1000), ORIGIN_FAR, DEST_FAR);
  assert.equal(tanpa.dedupeKey, dengan.dedupeKey);
  const ojekTanpa = tanpa.segments.filter((s) => s.type === 'OJEK');
  const ojekDengan = dengan.segments.filter((s) => s.type === 'OJEK');
  assert.equal(ojekTanpa.length, 2);
  assert.equal(ojekDengan.length, 2);
  for (let i = 0; i < 2; i++) {
    assert.equal(ojekDengan[i].cost - ojekTanpa[i].cost, 1000);
  }
  assert.equal(dengan.totalCost - tanpa.totalCost, 2000);
});

test('T1-B(d). Satu leg ojek -> biayaLayanan dihitung SEKALI', () => {
  const tanpa = cariBusDenganOjek(makeNetwork(0), ORIGIN_NEAR_A, DEST_FAR);
  const dengan = cariBusDenganOjek(makeNetwork(1000), ORIGIN_NEAR_A, DEST_FAR);
  const ojekTanpa = tanpa.segments.filter((s) => s.type === 'OJEK');
  const ojekDengan = dengan.segments.filter((s) => s.type === 'OJEK');
  assert.equal(ojekTanpa.length, 1);
  assert.equal(ojekDengan.length, 1);
  assert.equal(dengan.totalCost - tanpa.totalCost, 1000);
});

test('T1-B(e). Moda tanpa tarif -> fallback default; ojek tanpa tarif -> tanpa segmen OJEK', () => {
  const ruteStops = [STOP_A, STOP_B].map((stop, index) => ({
    halteId: stop.id,
    urutan: index + 1,
    estimasiMenit: null as number | null,
    jarakMeter: null as number | null,
    jadwalKeberangkatan: [] as string[],
    geometri: null as [number, number][] | null,
    halte: stop,
  }));
  const network: RoutingNetwork = {
    stops: [STOP_A, STOP_B],
    rutes: [
      {
        id: 101,
        nama: 'Bus A-B',
        kode: 'B1',
        jamMulaiOperasi: null,
        jamSelesaiOperasi: null,
        intervalWaktu: null,
        moda: busModa,
        stops: ruteStops,
        positions: buildPositions(ruteStops),
      },
    ],
    ojekModa,
    ojekTarif: null,
    transferNeighbors: buildTransferNeighbors([STOP_A, STOP_B]),
    tarifByModa: new Map(),
  };
  const { candidates, notices } = buildRouteCandidates({
    origin: ORIGIN_NEAR_A,
    destination: DEST_NEAR_B,
    maxWalkingDistanceMeters: 1500,
    network,
  });
  const bus = candidates.find((c) => c.segments.some((s) => s.type === 'BUS'));
  assert.ok(bus, 'rute bus tetap ada dengan tarif fallback');
  assert.equal(
    bus.segments.find((s) => s.type === 'BUS')?.cost,
    5000,
    'bus tanpa tarif memakai default 5000'
  );
  assert.ok(
    candidates.every((c) => c.segments.every((s) => s.type !== 'OJEK')),
    'tanpa tarif ojek tidak ada segmen OJEK sama sekali'
  );
  assert.ok(notices.some((n) => n.includes('ojek')), 'ada notice ojek tidak tersedia');
});
