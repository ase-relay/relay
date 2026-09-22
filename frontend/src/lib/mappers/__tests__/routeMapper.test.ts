import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  mapApiRouteToJourneySegments,
  mapApiRouteToRouteResultCard,
  mapModaNamaToVehicleType,
} from '../routeMapper';
import { routingSearchResponseExample } from './fixtures/routingSearchExample';

describe('mapModaNamaToVehicleType', () => {
  test('case-insensitive dan toleran spasi', () => {
    assert.equal(mapModaNamaToVehicleType('Bus'), 'bus');
    assert.equal(mapModaNamaToVehicleType('ANGKOT'), 'angkot');
    assert.equal(mapModaNamaToVehicleType('Kereta'), 'train');
    assert.equal(mapModaNamaToVehicleType('Ojek Online'), 'motorcycle');
    assert.equal(mapModaNamaToVehicleType('Jalan Kaki'), 'walking');
  });

  test('fallback default ke bus bila nama tidak dikenali', () => {
    assert.equal(mapModaNamaToVehicleType('Kendaraan Misterius'), 'bus');
    assert.equal(mapModaNamaToVehicleType(''), 'bus');
    assert.equal(mapModaNamaToVehicleType(undefined), 'bus');
  });
});

describe('mapApiRouteToRouteResultCard', () => {
  const [directRoute, transitRoute] = routingSearchResponseExample.data.routes;

  test('rute DIRECT: fare, durasi, transit, dan ikon dari moda leg TRANSIT pertama', () => {
    const card = mapApiRouteToRouteResultCard(directRoute);

    assert.equal(card.id, 'route-direct-1');
    assert.equal(card.type, 'bus'); // moda.nama "Bus" → slug 'bus'
    assert.equal(card.price, 4900);
    assert.equal(card.priceLabel, 'Rp4.900');
    assert.equal(card.duration, 35);
    assert.equal(card.durationLabel, '35 menit');
    assert.equal(card.transits, 0); // summary.transfersCount
    // Jalan kaki: leg 1 (2 menit) + leg 3 (3 menit)
    assert.equal(card.walkingTime, 5);
    assert.deepEqual(card.badges, ['TMP-03']);
  });

  test('rute TRANSIT: transfersCount dan ikon angkot dari leg pertama', () => {
    const card = mapApiRouteToRouteResultCard(transitRoute);

    assert.equal(card.id, 'route-transit-2');
    assert.equal(card.type, 'angkot'); // moda leg TRANSIT pertama = Angkot
    assert.equal(card.price, 9900);
    assert.equal(card.transits, 1);
    // Jalan kaki: 2 + 3 + 3 menit
    assert.equal(card.walkingTime, 8);
    assert.deepEqual(card.badges, ['AK-01', 'TMP-03']);
  });
});

describe('mapApiRouteToJourneySegments', () => {
  const directRoute = routingSearchResponseExample.data.routes[0];

  test('jumlah segment sama dengan jumlah legs', () => {
    const segments = mapApiRouteToJourneySegments(directRoute);
    assert.equal(segments.length, directRoute.legs.length);
  });

  test('leg WALK dipetakan dengan durasi & jarak BE', () => {
    const segments = mapApiRouteToJourneySegments(directRoute);
    const walk = segments[0];

    assert.equal(walk.type, 'WALK');
    assert.ok(walk.type === 'WALK');
    if (walk.type === 'WALK') {
      assert.equal(walk.duration, 2);
      assert.equal(walk.distance, 120);
      assert.deepEqual(walk.steps, ['Jalan kaki ke Halte Alun-Alun']);
    }
  });

  test('leg TRANSIT dipetakan dengan operator, kode rute, biaya, dan stops terurut', () => {
    const segments = mapApiRouteToJourneySegments(directRoute);
    const transit = segments[1];

    assert.ok(transit.type === 'TRANSIT');
    if (transit.type === 'TRANSIT') {
      assert.equal(transit.operator, 'Kebon Kalapa - Telkom University'); // rute.nama
      assert.equal(transit.routeCode, 'TMP-03'); // rute.kode
      assert.equal(transit.cost, 4900); // fare
      assert.equal(transit.stopCount, 8); // passedStopsCount
      assert.equal(transit.stops.length, 3); // passedStops di example cuma 3 dari 8
      assert.deepEqual(
        transit.stops.map((stop) => stop.stopName),
        ['Halte Alun-Alun', 'Halte Karapitan', 'Halte Telkom University'], // urut per urutan
      );
    }
  });
});
