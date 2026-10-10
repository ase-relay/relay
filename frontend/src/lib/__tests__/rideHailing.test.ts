import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  RIDE_HAILING_PROVIDERS,
  buildDropoffText,
  buildGojekUrl,
  buildGrabIntentUrl,
  buildGrabSchemeUrl,
  buildOpenUrl,
  copyTripText,
  detectMobilePlatform,
  getProvider,
  getStoreUrl,
  openRideHailingApp,
  type TripCoords,
} from '../rideHailing';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

describe('rideHailing: konfigurasi provider', () => {
  test('dua provider dengan URL pembuka + store terverifikasi', () => {
    assert.equal(RIDE_HAILING_PROVIDERS.length, 2);
    const gojek = getProvider('gojek');
    assert.equal(gojek.appUrl, 'gojek://goride');
    assert.ok(gojek.playStoreUrl.includes('com.gojek.app'));
    assert.ok(gojek.appStoreUrl.includes('/id944875099'));
    const grab = getProvider('grab');
    // grab:// tidak didaftarkan app consumer -> pakai applink resmi Grab
    // (terverifikasi di assetlinks + apple-app-site-association).
    assert.equal(grab.appUrl, 'https://applink.grab.com/open');
    assert.ok(grab.playStoreUrl.includes('com.grabtaxi.passenger'));
    assert.ok(grab.appStoreUrl.includes('/id647268330'));
  });

  test('intent Android Grab: skema + package + fallback native', () => {
    const url = buildGrabIntentUrl();
    assert.ok(url.startsWith('intent://open?service=bike#Intent;'));
    assert.ok(url.includes('scheme=grab'));
    assert.ok(url.includes('package=com.grabtaxi.passenger'));
    assert.ok(url.includes('S.browser_fallback_url='));
    assert.ok(url.endsWith(';end'));
  });

  test('prefill koordinat sesuai format temuan (rollback-safe, dikunci test)', () => {
    const trip: TripCoords = { pickupLat: -6.97833228, pickupLng: 107.63013229, destLat: -6.89306624, destLng: 107.61799203 };
    assert.equal(
      buildGojekUrl(trip),
      'gojek://goride?pLat=-6.97833228&pLng=107.63013229&dLat=-6.89306624&dLng=107.61799203',
    );
    assert.equal(
      buildGrabSchemeUrl(trip),
      'grab://open?service=bike&pickup_lat=-6.97833228&pickup_lng=107.63013229&dest_lat=-6.89306624&dest_lng=107.61799203',
    );
    const intent = buildGrabIntentUrl(trip);
    assert.ok(intent.includes('pickup_lat=-6.97833228') && intent.includes('dest_lng=107.61799203'));
  });

  test('tanpa/koordinat rusak -> URL dasar (tanpa param)', () => {
    assert.equal(buildGojekUrl(), 'gojek://goride');
    assert.equal(buildGojekUrl(null), 'gojek://goride');
    assert.equal(
      buildGojekUrl({ pickupLat: NaN, pickupLng: 107.6, destLat: -6.9, destLng: 107.6 }),
      'gojek://goride',
    );
    assert.equal(buildGrabSchemeUrl(), 'grab://open?service=bike');
  });

  test('buildOpenUrl: gojek semua platform param; grab android intent, ios skema', () => {
    const trip: TripCoords = { pickupLat: -6.9, pickupLng: 107.6, destLat: -6.89, destLng: 107.61 };
    const gojek = getProvider('gojek');
    assert.ok(buildOpenUrl(gojek, 'android', trip).url.startsWith('gojek://goride?pLat='));
    assert.equal(buildOpenUrl(gojek, 'ios', trip).nativeFallback, false);
    const grab = getProvider('grab');
    const android = buildOpenUrl(grab, 'android', trip);
    assert.ok(android.url.startsWith('intent://') && android.nativeFallback);
    const ios = buildOpenUrl(grab, 'ios', trip);
    assert.ok(ios.url.startsWith('grab://open?service=bike&') && !ios.nativeFallback);
    const iosNoTrip = buildOpenUrl(grab, 'ios');
    assert.equal(iosNoTrip.url, grab.appUrl);
  });

  test('provider tak dikenal melempar error jelas', () => {
    assert.throws(
      () => getProvider('maxim' as 'gojek'),
      /Provider ojek tidak dikenal/,
    );
  });
});

describe('rideHailing: platform & store URL', () => {
  test('deteksi android / ios / desktop dari UA', () => {
    assert.equal(detectMobilePlatform(ANDROID_UA), 'android');
    assert.equal(detectMobilePlatform(IOS_UA), 'ios');
    assert.equal(detectMobilePlatform(DESKTOP_UA), 'desktop');
    assert.equal(detectMobilePlatform(''), 'desktop');
  });

  test('store URL mengikuti platform (ios -> App Store, selainnya Play Store)', () => {
    const grab = getProvider('grab');
    assert.ok(getStoreUrl(grab, 'ios').includes('apps.apple.com'));
    assert.ok(getStoreUrl(grab, 'android').includes('play.google.com'));
    assert.ok(getStoreUrl(grab, 'desktop').includes('play.google.com'));
  });

  test('tanpa window/document: aman dipanggil (no-op, tidak throw)', () => {
    assert.doesNotThrow(() => openRideHailingApp('gojek'));
  });
});

describe('rideHailing: salin alamat tujuan', () => {
  test('nama + alamat digabung koma; yang kosong dibuang', () => {
    assert.equal(buildDropoffText('Stasiun Padalarang', 'Jl. Cikampek No. 1'), 'Stasiun Padalarang, Jl. Cikampek No. 1');
    assert.equal(buildDropoffText('Stasiun Padalarang', ''), 'Stasiun Padalarang');
    assert.equal(buildDropoffText('', 'Jl. Cikampek No. 1'), 'Jl. Cikampek No. 1');
    assert.equal(buildDropoffText('', '  '), '');
  });

  test('tanpa Clipboard API: false (pemanggil tetap buka aplikasi)', async () => {
    assert.equal(await copyTripText('Stasiun Padalarang'), false);
    assert.equal(await copyTripText(''), false);
  });
});
