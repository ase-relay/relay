import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOjekFare, calculateTransitFare, roundUpToStep } from '../fare-calculator';

test('7a. Tarif ojek: jarak <= jarakMinimum tetap tarif minimum', () => {
  const tarif = { nominalDasar: 10000, nominalPerKm: 2500, jarakMinimumKm: 2 };
  assert.equal(calculateOjekFare(1500, tarif), 10000);
  assert.equal(calculateOjekFare(2000, tarif), 10000); // tepat di batas
});

test('7b. Tarif ojek: di atas jarakMinimum memakai nominalDasar + selisih x perKm', () => {
  const tarif = { nominalDasar: 10000, nominalPerKm: 2500, jarakMinimumKm: 2 };
  assert.equal(calculateOjekFare(5000, tarif), 17500); // 10000 + 3 x 2500
  assert.equal(calculateOjekFare(3100, tarif), 13000); // 12750 -> dibulatkan ke atas Rp 500
});

test('7c. Pembulatan tarif ojek selalu ke atas ke kelipatan Rp 500', () => {
  assert.equal(roundUpToStep(12301, 500), 12500);
  assert.equal(roundUpToStep(17000, 500), 17000);
  const tarif = { nominalDasar: 10100, nominalPerKm: 0, jarakMinimumKm: 1 };
  assert.equal(calculateOjekFare(500, tarif), 10500);
});

test('7d. Tarif transit: FLAT, PER_KM, PER_STASIUN, dan fallback', () => {
  // FLAT
  assert.equal(
    calculateTransitFare(
      { tipeTarif: 'FLAT', nominalDasar: 4900, nominalPerKm: 0 },
      { distanceMeters: 5000, passedStopsCount: 4 }
    ),
    4900
  );

  // PER_KM: 5000 + max(1, 2 km) x 2000
  assert.equal(
    calculateTransitFare(
      { tipeTarif: 'PER_KM', nominalDasar: 5000, nominalPerKm: 2000 },
      { distanceMeters: 2000, passedStopsCount: 2 }
    ),
    9000
  );

  // PER_STASIUN: 3000 + (4 - 1) x 1000
  assert.equal(
    calculateTransitFare(
      { tipeTarif: 'PER_STASIUN', nominalDasar: 3000, nominalPerKm: 1000 },
      { distanceMeters: 4000, passedStopsCount: 4 }
    ),
    6000
  );

  // Tanpa baris tarif -> fallback konfigurasi
  assert.equal(calculateTransitFare(null, { distanceMeters: 1000, passedStopsCount: 2 }), 5000);
});
