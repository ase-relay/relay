import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  getServiceAreaBbox,
  getServiceAreaOutline,
  isWithinServiceArea,
} from '../serviceArea';

/**
 * Poligon layanan = union(4 kab/kota + 5 kecamatan Sumedang) + buffer 3 km.
 * Koordinat uji di bawah diverifikasi terhadap poligon final saat pembuatannya.
 */
describe('serviceArea: point-in-polygon', () => {
  test('halte tepi DB (Padalarang, Cicalengka, Jatinangor, Majalaya, KBP) di dalam', () => {
    const inside: Array<[number, number, string]> = [
      [107.497277138967, -6.84289738687868, 'Stasiun Padalarang'],
      [107.832855118819, -6.98146273611168, 'Stasiun Cicalengka'],
      [107.773320302051, -6.93224496166983, 'Halte UNPAD Jatinangor'],
      [107.7601717, -7.0478024, 'Terminal Majalaya'],
      [107.465541950027, -6.86525966498748, 'Halte Wahoo Waterworld'],
      [107.2, -7.0, 'barat KBB dalam buffer (dulu di luar bbox persegi)'],
    ];
    for (const [lng, lat, label] of inside) {
      assert.equal(isWithinServiceArea(lat, lng), true, label);
    }
  });

  test('sampah & luar area ditolak', () => {
    const outside: Array<[number, number, string]> = [
      [101.51474016816, -6.946152849890214, 'typo edit manual olng 101'],
      [106.8283, -6.1754, 'Jakarta'],
      [107.9183, -6.8574, 'Kota Sumedang (luar 5 kecamatan)'],
      [107.96, -6.9, 'timur batas buffer'],
      [107.5, -6.66, 'utara batas buffer'],
    ];
    for (const [lng, lat, label] of outside) {
      assert.equal(isWithinServiceArea(lat, lng), false, label);
    }
  });

  test('input non-finite ditolak', () => {
    assert.equal(isWithinServiceArea(NaN, 107.6), false);
    assert.equal(isWithinServiceArea(-6.9, Infinity), false);
  });

  test('bbox & outline konsisten untuk peta', () => {
    const [minLng, minLat, maxLng, maxLat] = getServiceAreaBbox();
    assert.ok(minLng < 107.2 && maxLng > 107.9 && minLat < -7.3 && maxLat > -6.7);
    const outline = getServiceAreaOutline();
    assert.ok(outline.length >= 1 && outline[0].length > 100);
    // Format Leaflet [lat, lng].
    const [lat, lng] = outline[0][0];
    assert.ok(lat > -8 && lat < -6 && lng > 107 && lng < 108);
  });
});
