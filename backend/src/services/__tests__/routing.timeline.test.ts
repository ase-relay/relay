import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatClock,
  parseClock,
  currentClockMinutes,
  applyRouteTimeline,
} from '../route-timeline';
import type { RouteLeg, PassedStopInfo } from '../../types/routing.types';

function makeWalkLeg(durationMinutes: number): RouteLeg {
  return {
    step: 1,
    legType: 'WALK',
    instruction: 'Jalan kaki ke Halte A',
    distanceMeters: 400,
    durationMinutes,
    fare: 0,
    from: { name: 'Titik Asal', lat: -6.9175, lng: 107.6191 },
    to: { name: 'Halte A', lat: -6.918, lng: 107.62 },
  };
}

function makeStoppedStops(): PassedStopInfo[] {
  // 4 halte segaris (jarak antar halte sama besar → interpolasi proporsional rapi)
  const latitudes = [-6.9, -6.905, -6.91, -6.915];
  return latitudes.map((latitude, index) => ({
    id: index + 1,
    namaHalte: `Halte ${index + 1}`,
    urutan: index,
    latitude,
    longitude: 107.6,
  }));
}

function makeBusLeg(durationMinutes: number, stops: PassedStopInfo[]): RouteLeg {
  return {
    step: 2,
    legType: 'TRANSIT',
    instruction: 'Naik Bus TMP-3D',
    distanceMeters: 5400,
    durationMinutes,
    fare: 4900,
    from: { id: 1, name: 'Halte 1', lat: -6.9, lng: 107.6 },
    to: { id: 4, name: 'Halte 4', lat: -6.915, lng: 107.6 },
    moda: { id: 1, nama: 'Bus', tipe: 'BRT', ikon: 'bus-icon' },
    passedStopsCount: stops.length,
    passedStops: stops,
  };
}

test('formatClock: menit → HH:MM (wrap 24 jam)', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(455), '07:35');
  assert.equal(formatClock(23 * 60 + 59), '23:59');
  // 25:00 ≡ 01:00 (dibulatkan per menit)
  assert.equal(formatClock(1500), '01:00');
  assert.equal(formatClock(-1), '23:59');
});

test('parseClock: HH:MM valid → menit; format salah → null', () => {
  assert.equal(parseClock('07:30'), 450);
  assert.equal(parseClock('00:00'), 0);
  assert.equal(parseClock('23:59'), 23 * 60 + 59);
  assert.equal(parseClock('7:30'), null);
  assert.equal(parseClock('24:00'), null);
  assert.equal(parseClock('07:60'), null);
  assert.equal(parseClock('07.30'), null);
});

test('currentClockMinutes: berada di rentang 0..1439', () => {
  const minutes = currentClockMinutes(new Date('2026-01-01T07:30:00'));
  assert.ok(minutes >= 0 && minutes < 1440);
});

test('applyRouteTimeline: jam kumulatif per leg konsisten dengan total durasi', () => {
  const legs: RouteLeg[] = [makeWalkLeg(5), makeBusLeg(31, makeStoppedStops())];

  const timeline = applyRouteTimeline(legs, 7 * 60 + 30); // 07:30

  assert.equal(timeline.departureTime, '07:30');
  // 07:30 + 5 + 31 = 08:06
  assert.equal(timeline.arrivalTime, '08:06');

  assert.equal(legs[0].departureTime, '07:30');
  assert.equal(legs[0].arrivalTime, '07:35');
  // leg transit dimulai persis saat leg sebelumnya selesai
  assert.equal(legs[1].departureTime, '07:35');
  assert.equal(legs[1].arrivalTime, '08:06');
});

test('applyRouteTimeline: estimasi per halte terurut & berujung di jam tiba leg', () => {
  const stops = makeStoppedStops();
  const legs: RouteLeg[] = [makeBusLeg(31, stops)];

  applyRouteTimeline(legs, 455); // 07:35

  const times = stops.map((stop) => stop.estimatedTime);
  assert.ok(times.every((time): time is string => typeof time === 'string'));
  // Halte pertama = jam mulai leg (tiba & mulai menunggu)
  assert.equal(times[0], '07:35');
  // Halte terakhir = jam tiba leg (07:35 + 31 = 08:06)
  assert.equal(times[3], '08:06');
  // Monoton naik
  const asMinutes = times.map((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  });
  for (let index = 1; index < asMinutes.length; index++) {
    assert.ok(
      asMinutes[index] >= asMinutes[index - 1],
      `waktu halte tidak monoton: ${times.join(', ')}`
    );
  }
  // Waktu tunggu bus (8 menit) disertakan sebelum tempuh antar-halte:
  // halte kedua tidak boleh langsung di jam berangkat.
  assert.notEqual(times[1], times[0]);
});

test('applyRouteTimeline: leg tanpa passedStops (ojek) tetap punya jam', () => {
  const ojekLeg: RouteLeg = {
    step: 1,
    legType: 'TRANSIT',
    instruction: 'Naik ojek ke tujuan',
    distanceMeters: 7000,
    durationMinutes: 25,
    fare: 22500,
    from: { name: 'Titik Asal', lat: -6.9175, lng: 107.6191 },
    to: { name: 'Tujuan', lat: -6.9215, lng: 107.6076 },
    moda: { id: 2, nama: 'Ojek Online', tipe: 'OJEK', ikon: 'ojek-icon' },
  };

  const timeline = applyRouteTimeline([ojekLeg], 18 * 60); // 18:00

  assert.equal(ojekLeg.departureTime, '18:00');
  assert.equal(ojekLeg.arrivalTime, '18:25');
  assert.equal(timeline.departureTime, '18:00');
  assert.equal(timeline.arrivalTime, '18:25');
});

test('applyRouteTimeline: daftar kosong → aman (tanpa throw)', () => {
  const timeline = applyRouteTimeline([], 8 * 60);
  assert.equal(timeline.departureTime, '08:00');
  assert.equal(timeline.arrivalTime, '08:00');
});
