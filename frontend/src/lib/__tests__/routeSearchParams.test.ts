import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  buildRouteSearchQuery,
  isRouteSearchInServiceArea,
  parseRouteSearchQuery,
  type RouteSearchUrlState,
} from '../routeSearchParams';

/**
 * Contract test: query string pencarian rute harus roundtrip utuh
 * (build → parse). Ini menutup celah link shareable antara halaman cari-rute
 * (penulis) dan halaman [routeId] / tab lain (pembaca).
 */

const FULL_STATE: RouteSearchUrlState = {
  origin: { name: 'Terminal Leuwipanjang', district: 'Kota Bandung', lat: -6.9401146, lng: 107.5894727 },
  destination: { name: 'Halte UNPAD Dipatiukur', district: 'Kota Bandung', lat: -6.885, lng: 107.6133 },
  sort: 'tercepat',
  maxWalkingDistance: 1000,
  includedModa: [2, 1],
};

describe('routeSearchParams: build ↔ parse (roundtrip link shareable)', () => {
  test('roundtrip: state penuh kembali utuh', () => {
    const query = buildRouteSearchQuery(FULL_STATE);
    const parsed = parseRouteSearchQuery(new URLSearchParams(query));
    assert.ok(parsed, 'query lengkap harus ter-parse');
    assert.deepEqual(parsed, {
      ...FULL_STATE,
      // urutan moda tidak dijamin (dedupe via Set, urutan kemunculan dipertahankan)
      includedModa: [2, 1],
    });
  });

  test('nilai default tidak ditulis ke URL, parse mengembalikan default', () => {
    const query = buildRouteSearchQuery({
      origin: { name: 'A', district: '', lat: -6.9, lng: 107.6 },
      destination: { name: 'B', district: '', lat: -6.97, lng: 107.63 },
      sort: 'termurah',
      maxWalkingDistance: 1500,
      includedModa: [],
    });
    assert.ok(!query.includes('sort='), `sort default tidak ditulis: ${query}`);
    assert.ok(!query.includes('walk='), `walk default tidak ditulis: ${query}`);
    assert.ok(!query.includes('moda='), `moda kosong tidak ditulis: ${query}`);

    const parsed = parseRouteSearchQuery(new URLSearchParams(query));
    assert.ok(parsed);
    assert.equal(parsed.sort, 'termurah');
    assert.equal(parsed.maxWalkingDistance, 1500);
    assert.deepEqual(parsed.includedModa, []);
  });

  test('URL lama (cuma nama, tanpa koordinat) → null (fallback storage)', () => {
    const parsed = parseRouteSearchQuery(new URLSearchParams('origin=A&destination=B'));
    assert.equal(parsed, null);
  });

  test('koordinat rusak/diakali → null', () => {
    const base = 'origin=A&destination=B&dlat=-6.97&dlng=107.63';
    for (const bad of [
      'origin=A&destination=B', // tanpa koordinat sama sekali
      `${base}&olat=bukan-angka&olng=107.6`,
      `${base}&olat=-6.9&olng=`, // kosong
      `${base}&olat=-91&olng=107.6`, // di luar rentang lintang
      `${base}&olat=-6.9&olng=181`, // di luar rentang bujur
      `origin=%20%20&destination=B&olat=-6.9&olng=107.6&dlat=-6.97&dlng=107.63`, // nama kosong
    ]) {
      assert.equal(parseRouteSearchQuery(new URLSearchParams(bad)), null, bad);
    }
  });

  test('sort/walk tak dikenal → default; moda dibersihkan (dedupe, buang invalid)', () => {
    const parsed = parseRouteSearchQuery(
      new URLSearchParams(
        'origin=A&olat=-6.9&olng=107.6&destination=B&dlat=-6.97&dlng=107.63&sort=asal&walk=999&moda=2,abc,2,-1,0',
      ),
    );
    assert.ok(parsed);
    assert.equal(parsed.sort, 'termurah');
    assert.equal(parsed.maxWalkingDistance, 1500);
    assert.deepEqual(parsed.includedModa, [2]);
  });

  test('koordinat Bandung (kasus normal) → dalam area layanan', () => {
    assert.equal(isRouteSearchInServiceArea(FULL_STATE), true);
  });

  test('koordinat hasil edit manual di luar Bandung (mis. olng 101) → luar area', () => {
    assert.equal(
      isRouteSearchInServiceArea({
        ...FULL_STATE,
        origin: { ...FULL_STATE.origin, lat: -6.946152849890214, lng: 101.51474016816 },
      }),
      false,
    );
  });

  test('regresi: Padalarang → Cicalengka (data DB riil) dalam area metropolitan', () => {
    const query = buildRouteSearchQuery({
      origin: { name: 'Stasiun Padalarang', district: 'Bandung', lat: -6.842897378687863, lng: 107.49727713896668 },
      destination: { name: 'Stasiun Cicalengka', district: 'Bandung', lat: -6.981462736111676, lng: 107.8328551188189 },
      sort: 'termurah',
      maxWalkingDistance: 1500,
      includedModa: [],
    });
    const parsed = parseRouteSearchQuery(new URLSearchParams(query));
    assert.ok(parsed, 'query Padalarang–Cicalengka harus ter-parse');
    assert.equal(isRouteSearchInServiceArea(parsed), true);
  });
});
