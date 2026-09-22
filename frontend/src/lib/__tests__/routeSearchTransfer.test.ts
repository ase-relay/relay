import assert from 'node:assert/strict';
import { test, describe, beforeEach, afterEach } from 'node:test';

import { saveRouteSearchResults, readRouteSearchResults } from '../routeSearchTransfer';
import { routingSearchResponseExample } from '../mappers/__tests__/fixtures/routingSearchExample';

/**
 * Roundtrip test (Task 3.3 bugfix): data yang disimpan saveRouteSearchResults()
 * harus terbaca utuh oleh readRouteSearchResults(). Ini menutup celah yang tidak
 * tercakup test mapper — yaitu kontrak simpan/baca antara halaman cari-rute
 * (penulis) dan halaman [routeId] (pembaca), termasuk runtime validation-nya.
 */

// Polyfill sessionStorage minimal (node:test tidak punya DOM).
// Cukup untuk contract test ini — implementasinya identik perilaku browser.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

function installSessionStorage(): void {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get: () => storage,
  });
  // routeSearchTransfer menjaga SSR dengan `typeof window === 'undefined'` — shim-kan
  // window agar guard lolos di node:test (di browser guard ini tidak pernah aktif).
  (globalThis as { window?: unknown }).window = globalThis;
}

function uninstallSessionStorage(): void {
  delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
  delete (globalThis as { window?: unknown }).window;
}

describe('routeSearchTransfer: saveRouteSearchResults ↔ readRouteSearchResults (roundtrip)', () => {
  beforeEach(installSessionStorage);
  afterEach(uninstallSessionStorage);

  test('roundtrip: data tersimpan terbaca utuh oleh readRouteSearchResults()', () => {
    saveRouteSearchResults(routingSearchResponseExample.data);

    const read = readRouteSearchResults();
    assert.ok(read, 'hasil baca tidak boleh null setelah simpan');
    assert.deepEqual(read, routingSearchResponseExample.data);

    // ID rute bisa dicari persis seperti findRouteById() di halaman [routeId].
    assert.equal(
      read.routes.find((route) => route.id === 'route-direct-1')?.summary.totalFare,
      4900,
    );
    assert.equal(
      read.routes.find((route) => route.id === 'route-transit-2')?.summary.transfersCount,
      1,
    );
  });

  test('totalRoutesFound === 0 (routes kosong) tetap tersimpan & valid terbaca', () => {
    saveRouteSearchResults({
      origin: { name: 'A', lat: -6.9, lng: 107.6 },
      destination: { name: 'B', lat: -6.97, lng: 107.63 },
      totalRoutesFound: 0,
      routes: [],
    });

    const read = readRouteSearchResults();
    assert.ok(read);
    assert.equal(read.routes.length, 0);
  });

  test('baca sebelum pernah simpan → null (kasus klik "Lihat Detail" tanpa pencarian)', () => {
    assert.equal(readRouteSearchResults(), null);
  });

  test('payload korup (routes bukan array) ditolak → null', () => {
    sessionStorage.setItem(
      'otewe.route-search.results',
      JSON.stringify({ origin: {}, routes: 'bukan-array' }),
    );
    assert.equal(readRouteSearchResults(), null);
  });

  test('rute tanpa id/legs ditolak → null (runtime validation)', () => {
    sessionStorage.setItem(
      'otewe.route-search.results',
      JSON.stringify({
        origin: { name: 'A', lat: -6.9, lng: 107.6 },
        destination: { name: 'B', lat: -6.97, lng: 107.63 },
        totalRoutesFound: 1,
        routes: [{ id: 'x' }], // legs hilang
      }),
    );
    assert.equal(readRouteSearchResults(), null);
  });
});
