import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assembleRailGeometry,
  parseGeometriJson,
  RuteStopWithGeometri,
} from '../rail-geometry.service';

/**
 * Unit test untuk RailGeometryService:
 * - assembleRailGeometry: gabungkan segmen, dedup, reverse, fallback null
 * - parseGeometriJson: validasi format JSON dari Prisma
 */

// ──────────────────────────────────────────────────────────────────────────────
// Fixture helper
// ──────────────────────────────────────────────────────────────────────────────

function makeStop(
  id: number,
  urutan: number,
  lat: number,
  lng: number,
  geometri: [number, number][] | null
): RuteStopWithGeometri {
  return {
    urutan,
    halte: { id, lat, lng, nama: `Stop ${id}` },
    geometri,
  };
}

// Koordinat stasiun fiksi (sekitar Bandung)
const S1: [number, number][] = [
  [-6.886, 107.536],
  [-6.887, 107.550],
  [-6.888, 107.560],
  [-6.916, 107.602],
];

const S2: [number, number][] = [
  [-6.916, 107.602],
  [-6.917, 107.620],
  [-6.924, 107.646],
];

// ──────────────────────────────────────────────────────────────────────────────
// assembleRailGeometry
// ──────────────────────────────────────────────────────────────────────────────

test('RG-1: dua segmen digabung tanpa titik duplikat di sambungan', () => {
  const stops = [
    makeStop(10, 1, -6.886, 107.536, S1),  // geometri ke stop 2
    makeStop(11, 2, -6.916, 107.602, S2),  // geometri ke stop 3
    makeStop(12, 3, -6.924, 107.646, null), // stop terakhir, geometri tidak diperlukan
  ];

  const result = assembleRailGeometry(stops);
  assert.ok(result !== null, 'hasil harus non-null');

  // S1 punya 4 titik, S2 punya 3 titik; sambungan menghasilkan 4+3-1=6 titik
  assert.equal(result!.length, 6, 'jumlah titik = S1(4) + S2(3) - duplikat(1) = 6');

  // Titik pertama = awal S1
  assert.deepEqual(result![0], S1[0]);
  // Titik terakhir = akhir S2
  assert.deepEqual(result![result!.length - 1], S2[S2.length - 1]);

  // Tidak ada titik duplikat berurutan
  for (let i = 0; i < result!.length - 1; i++) {
    assert.ok(
      !(result![i][0] === result![i + 1][0] && result![i][1] === result![i + 1][1]),
      `duplikat berurutan di indeks ${i}`
    );
  }
});

test('RG-2: satu segmen null → kembalikan null (fallback)', () => {
  const stops = [
    makeStop(10, 1, -6.886, 107.536, S1),   // ok
    makeStop(11, 2, -6.916, 107.602, null),  // null! → fallback
    makeStop(12, 3, -6.924, 107.646, null),
  ];

  const result = assembleRailGeometry(stops);
  assert.equal(result, null, 'harus null karena ada segmen tanpa geometri');
});

test('RG-3: semua segmen null → kembalikan null', () => {
  const stops = [
    makeStop(10, 1, -6.886, 107.536, null),
    makeStop(11, 2, -6.916, 107.602, null),
  ];

  const result = assembleRailGeometry(stops);
  assert.equal(result, null);
});

test('RG-4: hanya 1 stop → kembalikan null (butuh minimal 2)', () => {
  const stops = [makeStop(10, 1, -6.886, 107.536, S1)];
  const result = assembleRailGeometry(stops);
  assert.equal(result, null);
});

test('RG-5: stops kosong → kembalikan null', () => {
  const result = assembleRailGeometry([]);
  assert.equal(result, null);
});

test('RG-6: satu segmen (2 stop) → geometri langsung dikembalikan', () => {
  const stops = [
    makeStop(10, 1, -6.886, 107.536, S1),
    makeStop(11, 2, -6.916, 107.602, null), // stop terakhir, geometri tidak diperlukan
  ];

  const result = assembleRailGeometry(stops);
  assert.ok(result !== null);
  assert.deepEqual(result, S1, 'hasil = geometri segmen satu-satunya');
});

test('RG-7: tiga segmen berurutan digabung dengan benar', () => {
  const seg3: [number, number][] = [
    [-6.924, 107.646],
    [-6.930, 107.660],
  ];

  const stops = [
    makeStop(10, 1, -6.886, 107.536, S1),
    makeStop(11, 2, -6.916, 107.602, S2),
    makeStop(12, 3, -6.924, 107.646, seg3),
    makeStop(13, 4, -6.930, 107.660, null),
  ];

  const result = assembleRailGeometry(stops);
  assert.ok(result !== null);
  // S1(4) + S2(3) - 1 + seg3(2) - 1 = 7 titik
  assert.equal(result!.length, 7);
  assert.deepEqual(result![0], S1[0], 'titik awal = awal S1');
  assert.deepEqual(result![result!.length - 1], seg3[seg3.length - 1], 'titik akhir = akhir seg3');
});

test('RG-8: geometri segmen dengan < 2 titik dianggap tidak valid → null', () => {
  const stops = [
    makeStop(10, 1, -6.886, 107.536, [[-6.916, 107.602]]), // hanya 1 titik
    makeStop(11, 2, -6.916, 107.602, null),
  ];

  // assembleRailGeometry menerima geometri walau 1 titik (tidak memvalidasi panjang segmen).
  // Test ini memastikan bahwa hasil tidak crash; validasi panjang ada di parseGeometriJson.
  // Dengan segmen hanya 1 titik, hasil akhir bisa < 2 → null.
  const result = assembleRailGeometry(stops);
  // Hasil: 1 titik saja → null karena length < 2
  assert.equal(result, null, 'hasil < 2 titik dikembalikan null');
});

// ──────────────────────────────────────────────────────────────────────────────
// parseGeometriJson
// ──────────────────────────────────────────────────────────────────────────────

test('PG-1: null → null', () => {
  assert.equal(parseGeometriJson(null), null);
  assert.equal(parseGeometriJson(undefined), null);
});

test('PG-2: array valid → LatLng[]', () => {
  const raw = [[-6.886, 107.536], [-6.916, 107.602]];
  const result = parseGeometriJson(raw);
  assert.ok(result !== null);
  assert.deepEqual(result, [[-6.886, 107.536], [-6.916, 107.602]]);
});

test('PG-3: array dengan 1 elemen (< 2) → null', () => {
  assert.equal(parseGeometriJson([[-6.886, 107.536]]), null);
});

test('PG-4: bukan array → null', () => {
  assert.equal(parseGeometriJson('invalid'), null);
  assert.equal(parseGeometriJson(123), null);
  assert.equal(parseGeometriJson({}), null);
});

test('PG-5: elemen bukan array → null', () => {
  assert.equal(parseGeometriJson([{ lat: -6.886, lng: 107.536 }]), null);
  assert.equal(parseGeometriJson([[null, 107.536], [-6.9, 107.6]]), null);
});

test('PG-6: koordinat NaN → null', () => {
  assert.equal(parseGeometriJson([['abc', 107.536], [-6.9, 107.6]]), null);
});

test('PG-7: array kosong → null', () => {
  assert.equal(parseGeometriJson([]), null);
});

test('PG-8: data dari Prisma JSON (nested) → LatLng[]', () => {
  // Prisma mengembalikan JSON sebagai objek JS biasa
  const prismaJson = JSON.parse(JSON.stringify([[-6.886, 107.536], [-6.916, 107.602], [-6.924, 107.646]]));
  const result = parseGeometriJson(prismaJson);
  assert.ok(result !== null);
  assert.equal(result!.length, 3);
  assert.deepEqual(result![0], [-6.886, 107.536]);
});
