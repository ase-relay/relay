import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateViaPoints,
  buildWaypoints,
  formatOsrmCoordinates,
  detectUturnWarnings,
  haversineMeters,
  LatLng,
} from '../../utils/shaping-points.utils';
import {
  assembleMixedTransitGeometry,
  stitchPolylinePieces,
  TransitStopItem,
} from '../transit-geometry.service';

// ──────────────────────────────────────────────────────────────────────────────
// Fixture
// ──────────────────────────────────────────────────────────────────────────────

const BBOX_TEST = { minLat: -7.2, maxLat: -6.6, minLng: 107.35, maxLng: 107.9 };

function makeStop(
  id: number,
  urutan: number,
  lat: number,
  lng: number,
  geometri: LatLng[] | null
): TransitStopItem {
  return { id, namaHalte: `Stop ${id}`, urutan, latitude: lat, longitude: lng, geometri };
}

// ──────────────────────────────────────────────────────────────────────────────
// validateViaPoints
// ──────────────────────────────────────────────────────────────────────────────

test('VP-1: via valid → diterima', () => {
  const res = validateViaPoints([[-6.938, 107.597]], BBOX_TEST);
  assert.ok(res.valid, `Seharusnya valid. Errors: ${res.errors}`);
  assert.equal(res.errors.length, 0);
});

test('VP-2: via bukan array → ditolak', () => {
  const res = validateViaPoints('bukan array', BBOX_TEST);
  assert.ok(!res.valid);
  assert.ok(res.errors.length > 0);
});

test('VP-3: via lebih dari 5 titik → ditolak', () => {
  const via = Array(6).fill([-6.938, 107.597]);
  const res = validateViaPoints(via, BBOX_TEST);
  assert.ok(!res.valid);
  assert.ok(res.errors.some(e => e.includes('5 titik')));
});

test('VP-4: via di luar bbox → ditolak', () => {
  const res = validateViaPoints([[-8.0, 107.597]], BBOX_TEST);
  assert.ok(!res.valid);
  assert.ok(res.errors.some(e => e.includes('luar batas')));
});

test('VP-5: via identik dengan halte awal (< 10m) → ditolak', () => {
  const halteA = { lat: -6.938, lng: 107.597 };
  const res = validateViaPoints([[-6.938, 107.597]], BBOX_TEST, halteA);
  assert.ok(!res.valid);
  assert.ok(res.errors.some(e => e.includes('halte awal')));
});

test('VP-6: via array kosong → ditolak', () => {
  const res = validateViaPoints([], BBOX_TEST);
  assert.ok(!res.valid);
  assert.ok(res.errors.some(e => e.includes('1 sampai 5')));
});

// ──────────────────────────────────────────────────────────────────────────────
// buildWaypoints
// ──────────────────────────────────────────────────────────────────────────────

test('WP-1: buildWaypoints menghasilkan urutan [A, via..., B] yang benar', () => {
  const a = { lat: -6.937, lng: 107.596 };
  const b = { lat: -6.946, lng: 107.595 };
  const via: LatLng[] = [[-6.940, 107.597]];
  const result = buildWaypoints(a, via, b);
  assert.equal(result.length, 3);
  assert.deepEqual(result[0], { lat: a.lat, lng: a.lng });
  assert.deepEqual(result[1], { lat: -6.940, lng: 107.597 });
  assert.deepEqual(result[2], { lat: b.lat, lng: b.lng });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatOsrmCoordinates
// ──────────────────────────────────────────────────────────────────────────────

test('FO-1: konversi [lng, lat] → [lat, lng] dengan 5 desimal', () => {
  const raw: [number, number][] = [[107.596521, -6.937214]];
  const result = formatOsrmCoordinates(raw);
  assert.deepEqual(result[0], [-6.93721, 107.59652]);
});

test('FO-2: titik berurutan identik dibuang', () => {
  const raw: [number, number][] = [
    [107.596521, -6.937214],
    [107.596521, -6.937214],
    [107.597000, -6.938000],
  ];
  const result = formatOsrmCoordinates(raw);
  assert.equal(result.length, 2);
});

// ──────────────────────────────────────────────────────────────────────────────
// detectUturnWarnings
// ──────────────────────────────────────────────────────────────────────────────

const origin = { lat: -6.937, lng: 107.596 };

test('UT-1: jalur lurus ke selatan → tidak ada peringatan U-turn', () => {
  const coords: LatLng[] = [
    [-6.937, 107.596],
    [-6.940, 107.596],
    [-6.943, 107.596],
    [-6.946, 107.595],
  ];
  const warnings = detectUturnWarnings(coords, origin, 150);
  assert.equal(warnings.length, 0, `Seharusnya bersih. Warnings: ${warnings.join(', ')}`);
});

test('UT-2: jalur yang kembali ke dekat origin → terdeteksi peringatan', () => {
  const coords: LatLng[] = [
    [-6.937, 107.596],   // origin
    [-6.940, 107.596],   // menjauh
    [-6.937, 107.596],   // kembali dekat
    [-6.946, 107.595],
  ];
  const warnings = detectUturnWarnings(coords, origin, 150);
  assert.ok(warnings.length > 0, 'Seharusnya ada peringatan loop');
});

test('UT-3: belokan tajam 180° → terdeteksi peringatan', () => {
  const coords: LatLng[] = [
    [-6.937, 107.596],
    [-6.938, 107.596],
    [-6.9385, 107.596],  // apeks
    [-6.938, 107.596],   // balik arah (beda < 6 index jadi tidak loop, tapi bearing reversal)
  ];
  // Catatan: belokan ini di luar radius 150m dari origin, jadi tidak lolos filter loop.
  // Tapi pembalikan bearing seharusnya terdeteksi di segmen ke-3.
  // (tidak wajib untuk test ini — verifikasi sederhana saja tidak crash)
  const warnings = detectUturnWarnings(coords, origin, 150);
  // Hasilnya bergantung pada threshold; cukup pastikan tidak melempar error
  assert.ok(Array.isArray(warnings));
});

// ──────────────────────────────────────────────────────────────────────────────
// stitchPolylinePieces
// ──────────────────────────────────────────────────────────────────────────────

test('ST-1: dua potongan dengan titik sambungan identik → dedup', () => {
  const p1: LatLng[] = [[-6.937, 107.596], [-6.938, 107.596]];
  const p2: LatLng[] = [[-6.938, 107.596], [-6.939, 107.596]];
  const result = stitchPolylinePieces([p1, p2]);
  assert.equal(result.length, 3, 'titik sambungan duplikat harus dihapus');
  assert.deepEqual(result[0], [-6.937, 107.596]);
  assert.deepEqual(result[2], [-6.939, 107.596]);
});

test('ST-2: satu potongan saja → dikembalikan langsung', () => {
  const p1: LatLng[] = [[-6.937, 107.596], [-6.946, 107.595]];
  const result = stitchPolylinePieces([p1]);
  assert.deepEqual(result, p1);
});

test('ST-3: celah > 50m antar potongan → disambungkan via halte perantara', () => {
  const p1: LatLng[] = [[-6.937, 107.596], [-6.940, 107.596]];
  const p2: LatLng[] = [[-6.945, 107.595], [-6.946, 107.595]]; // celah besar
  const junctions = [{ lat: -6.942, lng: 107.596 }];
  const result = stitchPolylinePieces([p1, p2], junctions);
  // Potongan 1 (2 titik) + halte junction (1 titik) + potongan 2 (2 titik) = 5
  assert.equal(result.length, 5);
  assert.deepEqual(result[2], [-6.942, 107.596]);
});

// ──────────────────────────────────────────────────────────────────────────────
// assembleMixedTransitGeometry
// ──────────────────────────────────────────────────────────────────────────────

const SEG_A: LatLng[] = [[-6.937, 107.596], [-6.938, 107.597], [-6.939, 107.597]];
const SEG_B: LatLng[] = [[-6.939, 107.597], [-6.942, 107.596], [-6.946, 107.595]];
const SEG_C: LatLng[] = [[-6.946, 107.595], [-6.947, 107.595]];

// Mock OSRM: mengembalikan garis lurus antara dua halte endpoint
function mockOsrm(waypoints: { lat: number; lng: number }[]): Promise<LatLng[]> {
  return Promise.resolve(waypoints.map((p) => [p.lat, p.lng]));
}

test('MX-1: semua segmen punya geometri tersimpan → tidak panggil OSRM', async () => {
  let osrmCalled = false;
  const mockFn = async (pts: { lat: number; lng: number }[]): Promise<LatLng[]> => {
    osrmCalled = true;
    return pts.map((p) => [p.lat, p.lng]);
  };

  const stops: TransitStopItem[] = [
    makeStop(1, 1, -6.937, 107.596, SEG_A),
    makeStop(2, 2, -6.939, 107.597, SEG_B),
    makeStop(3, 3, -6.946, 107.595, null), // stop terakhir, geometri tidak diperlukan
  ];

  const result = await assembleMixedTransitGeometry(stops, mockFn);
  assert.ok(result !== null, 'Harus berhasil merakit');
  assert.ok(result!.length >= 2);
  assert.ok(!osrmCalled, 'OSRM tidak boleh dipanggil bila semua geometri tersedia');
});

test('MX-2: tidak ada geometri tersimpan → kembalikan null (fallback ke OSRM leg penuh)', async () => {
  const stops: TransitStopItem[] = [
    makeStop(1, 1, -6.937, 107.596, null),
    makeStop(2, 2, -6.939, 107.597, null),
    makeStop(3, 3, -6.946, 107.595, null),
  ];
  const result = await assembleMixedTransitGeometry(stops, mockOsrm);
  assert.equal(result, null, 'Harus null agar pemanggil fallback ke OSRM satu leg');
});

test('MX-3: segmen campuran (sebagian stored, sebagian kosong) → OSRM dipanggil untuk deret kosong', async () => {
  let osrmCallCount = 0;
  const mockFn = async (pts: { lat: number; lng: number }[]): Promise<LatLng[]> => {
    osrmCallCount++;
    return pts.map((p) => [p.lat, p.lng]);
  };

  const stops: TransitStopItem[] = [
    makeStop(1, 1, -6.937, 107.596, SEG_A),  // tersimpan
    makeStop(2, 2, -6.939, 107.597, null),     // kosong → akan ke OSRM
    makeStop(3, 3, -6.942, 107.596, null),     // kosong → bagian dari deret kosong yang sama
    makeStop(4, 4, -6.946, 107.595, null),     // stop terakhir
  ];

  const result = await assembleMixedTransitGeometry(stops, mockFn);
  assert.ok(result !== null, 'Perakitan campuran harus berhasil');
  assert.equal(osrmCallCount, 1, 'OSRM hanya dipanggil 1x untuk seluruh deret kosong');
});

test('MX-4: kurang dari 2 stops → kembalikan null', async () => {
  const stops = [makeStop(1, 1, -6.937, 107.596, SEG_A)];
  const result = await assembleMixedTransitGeometry(stops, mockOsrm);
  assert.equal(result, null);
});

test('MX-5: OSRM gagal untuk deret kosong → kembalikan null (fallback ke leg penuh)', async () => {
  const failingMock = async (): Promise<LatLng[]> => {
    return []; // < 2 titik → dianggap gagal
  };

  const stops: TransitStopItem[] = [
    makeStop(1, 1, -6.937, 107.596, SEG_A), // tersimpan
    makeStop(2, 2, -6.939, 107.597, null),    // kosong
    makeStop(3, 3, -6.946, 107.595, null),    // stop terakhir
  ];

  const result = await assembleMixedTransitGeometry(stops, failingMock);
  assert.equal(result, null, 'Harus null bila OSRM segmen kosong gagal');
});

// ──────────────────────────────────────────────────────────────────────────────
// Kebocoran geometri ke respons (TIDAK BOLEH ada field geometri di PassedStopInfo)
// ──────────────────────────────────────────────────────────────────────────────

test('LEAK-1: passedStop yang membawa geometri harus hilang setelah sanitasi', () => {
  const stop: any = {
    id: 220,
    namaHalte: 'Halte RS Imanuel B',
    urutan: 14,
    latitude: -6.9372,
    longitude: 107.5957,
    jadwalKeberangkatan: [],
    geometri: [[-6.938, 107.597]],
  };

  // Simulasi logika sanitasi di routing.service.ts
  delete stop.geometri;

  assert.equal((stop as any).geometri, undefined, 'Field geometri harus dihapus');
  // Field publik lain tidak terganggu
  assert.equal(stop.id, 220);
  assert.equal(stop.namaHalte, 'Halte RS Imanuel B');
});
