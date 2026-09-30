import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GeometryService } from '../geometry.service';

/**
 * Uji lapis ketahanan GeometryService: cache, retry, dan fallback yang
 * tidak di-cache. fetch global di-stub — tidak ada panggilan jaringan.
 */

interface OsrmLikePayload {
  code: string;
  routes: Array<{
    geometry: { coordinates: [number, number][] };
    legs: Array<{ steps: Array<Record<string, unknown>> }>;
  }>;
}

const SUCCESS_PAYLOAD: OsrmLikePayload = {
  code: 'Ok',
  routes: [
    {
      geometry: {
        // [lng, lat] sesuai format OSRM
        coordinates: [
          [107.6, -6.9],
          [107.65, -6.85],
          [107.7, -6.8],
        ],
      },
      legs: [{ steps: [] }],
    },
  ],
};

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

/** Pasang stub fetch; mengembalikan fungsi untuk membaca jumlah panggilan. */
function stubFetch(handler: (url: string, attempt: number) => Response): () => number {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls += 1;
    return handler(String(input), calls);
  }) as typeof fetch;
  (globalThis as { __restoreFetch?: () => void }).__restoreFetch = () => {
    globalThis.fetch = original;
  };
  return () => calls;
}

function restoreFetch(): void {
  const restore = (globalThis as { __restoreFetch?: () => void }).__restoreFetch;
  if (restore) restore();
}

test('geometry sukses → di-cache, panggilan kedua tidak fetch ulang', async (t) => {
  t.after(restoreFetch);
  const getCalls = stubFetch(() => jsonResponse(SUCCESS_PAYLOAD));

  // Titik berbeda dari payload OSRM agar fallback garis lurus mudah dibedakan
  const waypoints = [
    { lat: -6.9175, lng: 107.6191 },
    { lat: -6.9215, lng: 107.6076 },
  ];

  const first = await GeometryService.getRouteGeometry(waypoints, 'driving');
  assert.equal(first.length, 3, 'geometry OSRM (3 titik) dipakai, bukan fallback (2 titik)');
  assert.deepEqual(first[0], [-6.9, 107.6]);
  assert.equal(getCalls(), 1);

  const second = await GeometryService.getRouteGeometry(waypoints, 'driving');
  assert.deepEqual(second, first, 'hasil kedua identik dari cache');
  assert.equal(getCalls(), 1, 'cache hit: fetch tidak dipanggil lagi');
});

test('HTTP 429 → retry otomatis pada percobaan kedua', async (t) => {
  t.after(restoreFetch);
  const getCalls = stubFetch((_url, attempt) =>
    attempt === 1 ? jsonResponse({ message: 'Too Many Requests' }, 429) : jsonResponse(SUCCESS_PAYLOAD)
  );

  const waypoints = [
    { lat: -6.911, lng: 107.6211 },
    { lat: -6.9221, lng: 107.6376 },
  ];

  const geometry = await GeometryService.getRouteGeometry(waypoints, 'driving');
  assert.equal(geometry.length, 3, 'retry kedua sukses → geometry OSRM');
  assert.equal(getCalls(), 2, 'fetch dipanggil persis 2× (429 lalu sukses)');
});

test('gagal total (404) → fallback garis lurus dan TIDAK di-cache', async (t) => {
  t.after(restoreFetch);
  const getCalls = stubFetch(() => jsonResponse({ message: 'Not Found' }, 404));

  const waypoints = [
    { lat: -6.9333, lng: 107.6444 },
    { lat: -6.9444, lng: 107.6555 },
  ];

  const first = await GeometryService.getRouteGeometry(waypoints, 'driving');
  assert.deepEqual(first, [
    [-6.9333, 107.6444],
    [-6.9444, 107.6555],
  ], 'fallback = dua titik ujung apa adanya');
  assert.equal(getCalls(), 1, '404 tidak di-retry');

  const second = await GeometryService.getRouteGeometry(waypoints, 'driving');
  assert.equal(getCalls(), 2, 'fallback tidak di-cache → percobaan berikutnya fetch ulang');
  assert.deepEqual(second, first);
});

test('walk details: sukses → geometry + steps ter-cache per key "steps"', async (t) => {
  t.after(restoreFetch);
  const getCalls = stubFetch(() => jsonResponse(SUCCESS_PAYLOAD));

  const waypoints = [
    { lat: -6.9555, lng: 107.6666 },
    { lat: -6.9666, lng: 107.6777 },
  ];

  const first = await GeometryService.getWalkRouteDetails(waypoints, 'Jalan kaki ke Halte X');
  assert.equal(first.geometry.length, 3);
  assert.deepEqual(first.steps, ['Jalan kaki ke Halte X'], 'steps OSRM kosong → pakai default');
  assert.equal(getCalls(), 1);

  const second = await GeometryService.getWalkRouteDetails(waypoints, 'Jalan kaki ke Halte X');
  assert.equal(getCalls(), 1, 'cache hit walk details');
  assert.deepEqual(second.geometry, first.geometry);
});

test('walk details: < 2 titik → langsung kosong tanpa fetch', async (t) => {
  t.after(restoreFetch);
  const getCalls = stubFetch(() => jsonResponse(SUCCESS_PAYLOAD));

  const result = await GeometryService.getWalkRouteDetails([{ lat: -6.9, lng: 107.6 }], 'Instruksi');
  assert.deepEqual(result, { geometry: [], steps: ['Instruksi'] });
  assert.equal(getCalls(), 0);
});
