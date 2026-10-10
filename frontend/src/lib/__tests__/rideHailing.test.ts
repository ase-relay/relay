import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  RIDE_HAILING_PROVIDERS,
  buildDropoffText,
  copyTripText,
  detectMobilePlatform,
  getProvider,
  getStoreUrl,
  openRideHailingApp,
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
    assert.equal(gojek.androidAppUrl, undefined);
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
    const grab = getProvider('grab');
    assert.ok(grab.androidAppUrl?.startsWith('intent://open?service=bike#Intent;'));
    assert.ok(grab.androidAppUrl?.includes('scheme=grab'));
    assert.ok(grab.androidAppUrl?.includes('package=com.grabtaxi.passenger'));
    assert.ok(grab.androidAppUrl?.includes('S.browser_fallback_url='));
    assert.ok(grab.androidAppUrl?.endsWith(';end'));
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
