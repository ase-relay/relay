import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import { getNextDeparture, getWibNowMinutes, parseClockToMinutes } from '../schedule';

describe('schedule: parseClockToMinutes', () => {
  test('"07:14" -> 434; entri rusak -> null', () => {
    assert.equal(parseClockToMinutes('07:14'), 7 * 60 + 14);
    assert.equal(parseClockToMinutes('00:00'), 0);
    assert.equal(parseClockToMinutes('23:31'), 23 * 60 + 31);
    assert.equal(parseClockToMinutes('24:00'), null);
    assert.equal(parseClockToMinutes('07:60'), null);
    assert.equal(parseClockToMinutes('pagi'), null);
    assert.equal(parseClockToMinutes(''), null);
  });
});

describe('schedule: getNextDeparture', () => {
  const schedules = ['05:43', '06:50', '07:14', '08:57', '23:31'];

  test('jam sekarang 07:00 -> 07:14 hari ini', () => {
    assert.deepEqual(getNextDeparture(schedules, 7 * 60), {
      time: '07:14',
      isTomorrow: false,
      totalCount: 5,
    });
  });

  test('tepat di menit jadwal -> jadwal itu (masih hari ini)', () => {
    assert.equal(getNextDeparture(schedules, 7 * 60 + 14)?.time, '07:14');
    assert.equal(getNextDeparture(schedules, 7 * 60 + 14)?.isTomorrow, false);
  });

  test('semua lewat (23:32) -> jadwal pertama besok', () => {
    assert.deepEqual(getNextDeparture(schedules, 23 * 60 + 32), {
      time: '05:43',
      isTomorrow: true,
      totalCount: 5,
    });
  });

  test('input acak + entri rusak: diurutkan & dibuang', () => {
    const result = getNextDeparture(['23:31', 'bogus', '05:43', '', '08:57'], 6 * 60);
    assert.deepEqual(result, { time: '08:57', isTomorrow: false, totalCount: 3 });
  });

  test('kosong / semua rusak -> null', () => {
    assert.equal(getNextDeparture([], 600), null);
    assert.equal(getNextDeparture(['x', '25:00'], 600), null);
  });
});

describe('schedule: getWibNowMinutes', () => {
  test('07:00 UTC = 14:00 WIB', () => {
    assert.equal(getWibNowMinutes(new Date('2026-01-01T07:00:00Z')), 14 * 60);
  });

  test('hasil selalu dalam rentang 1 hari', () => {
    const now = getWibNowMinutes();
    assert.ok(now >= 0 && now < 24 * 60);
  });
});
