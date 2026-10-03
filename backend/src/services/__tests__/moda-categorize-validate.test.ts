import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorizeModa } from '../routing-network';
import { createModaSchema, updateModaSchema } from '../../middlewares/moda-validate.middleware';

test('M1: categorizeModa tipe baru OJEK_ONLINE -> OJEK', () => {
  assert.equal(categorizeModa('Apa saja', 'OJEK_ONLINE'), 'OJEK');
});

test('M1: categorizeModa tipe baru KERETA -> KERETA', () => {
  assert.equal(categorizeModa('Apa saja', 'KERETA'), 'KERETA');
});

test('M1: categorizeModa tipe baru BUS -> BUS', () => {
  assert.equal(categorizeModa('Apa saja', 'BUS'), 'BUS');
});

test('M1: skema create menolak tipe ANGKOT', () => {
  const parsed = createModaSchema.safeParse({ namaModa: 'Moda Tes', tipeModa: 'ANGKOT' });
  assert.equal(parsed.success, false);
});

test('M1: categorizeModa nilai lama tetap (RIDE_HAILING, COMMUTER_TRAIN, BRT)', () => {
  assert.equal(categorizeModa('Apa saja', 'RIDE_HAILING'), 'OJEK');
  assert.equal(categorizeModa('Apa saja', 'COMMUTER_TRAIN'), 'KERETA');
  assert.equal(categorizeModa('Apa saja', 'BRT'), 'BUS');
});

test('M1: categorizeModa tipe null dengan nama Ojek Online -> OJEK', () => {
  assert.equal(categorizeModa('Ojek Online', null), 'OJEK');
});

test('M1: skema create menolak tipe salah', () => {
  const parsed = createModaSchema.safeParse({ namaModa: 'Moda Tes', tipeModa: 'RIDE_HAILING' });
  assert.equal(parsed.success, false);
});

test('M1: skema create menolak kecepatan 0, -1, dan 201', () => {
  for (const kecepatan of [0, -1, 201]) {
    const parsed = createModaSchema.safeParse({
      namaModa: 'Moda Tes',
      tipeModa: 'BUS',
      rataRataKecepatanKmh: kecepatan,
    });
    assert.equal(parsed.success, false, `kecepatan ${kecepatan} harus ditolak`);
  }
});

test('M1: skema create menerima kecepatan null dan deskripsi null', () => {
  const parsed = createModaSchema.safeParse({
    namaModa: 'Moda Tes',
    tipeModa: 'BUS',
    rataRataKecepatanKmh: null,
    deskripsi: null,
  });
  assert.equal(parsed.success, true);
});

test('M1: skema update menerima tipe dan kecepatan yang valid', () => {
  const parsed = updateModaSchema.safeParse({ tipeModa: 'OJEK_ONLINE', rataRataKecepatanKmh: 22 });
  assert.equal(parsed.success, true);
});
