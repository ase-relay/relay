/**
 * Skrip CLI untuk menerapkan titik bantu (shaping points / via points) pada segmen RuteStop.
 *
 * Penggunaan:
 *   npx tsx prisma/apply-shaping-points.ts <path/to/file.json> [--dry-run] [--apply] [--overwrite] [--force]
 *   npm run shaping-points -- prisma/shaping-points/k4-imanuel.json [--dry-run] [--apply]
 *
 * Mode:
 *   --dry-run   : (Default) Validasi & hitung via OSRM, buat preview GeoJSON, TIDAK menulis ke DB.
 *   --apply     : Terapkan hasil ke database (update RuteStop.geometri).
 *   --overwrite : Izinkan menimpa segmen yang sudah memiliki geometri di DB.
 *   --force     : Lewati peringatan kualitas (mis. rasio jarak / U-turn) saat apply.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import {
  LatLng,
  validateViaPoints,
  buildWaypoints,
  formatOsrmCoordinates,
  detectUturnWarnings,
  haversineMeters,
  generatePreviewGeoJson,
} from '../src/utils/shaping-points.utils';
import { ROUTING_CONFIG } from '../src/config/routing.config';

const prisma = new PrismaClient();

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';
const REQUEST_DELAY_MS = 1500;
const MAX_ATTEMPTS = 3;

interface SegmentConfig {
  dariHalteId: number;
  keHalteId: number;
  via: LatLng[];
  catatan?: string;
}

interface ShapingConfigFile {
  ruteId: number;
  segments: SegmentConfig[];
}

/**
 * Fetch OSRM route dengan retry untuk 429/5xx dan jeda aman.
 */
async function fetchOsrmWithRetry(waypoints: { lat: number; lng: number }[]): Promise<any> {
  const coordsString = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM_BASE_URL}/driving/${coordsString}?overview=full&geometries=geojson&continue_straight=true`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OteweRelayShapingCLI/1.0',
        },
      });

      if (response.status === 429 || response.status >= 500) {
        console.warn(`  ⚠️ OSRM merespons status ${response.status} (percobaan ${attempt}/${MAX_ATTEMPTS}). Menunggu...`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`OSRM HTTP error status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`OSRM response code: ${data.code ?? 'unknown'} (${data.message ?? 'no routes'})`);
      }

      return data.routes[0];
    } catch (err: any) {
      if (attempt === MAX_ATTEMPTS) throw err;
      console.warn(`  ⚠️ Gangguan jaringan: ${err.message}. Mencoba kembali...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  throw new Error('Gagal mengambil geometri dari OSRM setelah beberapa percobaan.');
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const nonFlags = args.filter((a) => !a.startsWith('--'));

  const isApply = flags.has('--apply');
  const isOverwrite = flags.has('--overwrite');
  const isForce = flags.has('--force');

  console.log('=====================================================');
  console.log('🚌 RELAY SHAPING POINTS CLI (Perbaikan Geometri Rute)');
  console.log('=====================================================');
  console.log(`Mode operasi : ${isApply ? '🚀 APPLY (Menulis ke DB)' : '🔍 DRY-RUN (Hanya simulasi & preview)'}`);
  console.log(`Opsi flags   : overwrite=${isOverwrite}, force=${isForce}`);

  if (nonFlags.length === 0) {
    console.error('\n❌ Masukkan path file JSON konfigurasi titik bantu.');
    console.error('Contoh: npm run shaping-points -- prisma/shaping-points/k4-imanuel.json [--dry-run|--apply]');
    process.exit(1);
  }

  const inputFilePath = path.resolve(process.cwd(), nonFlags[0]);
  if (!fs.existsSync(inputFilePath)) {
    console.error(`\n❌ File konfigurasi tidak ditemukan: ${inputFilePath}`);
    process.exit(1);
  }

  let config: ShapingConfigFile;
  try {
    const rawContent = fs.readFileSync(inputFilePath, 'utf-8');
    config = JSON.parse(rawContent);
  } catch (err: any) {
    console.error(`\n❌ Gagal membaca atau mem-parse JSON: ${err.message}`);
    process.exit(1);
  }

  if (!config.ruteId || !Array.isArray(config.segments) || config.segments.length === 0) {
    console.error('\n❌ Format file JSON tidak valid. Membutuhkan "ruteId" dan array "segments".');
    process.exit(1);
  }

  // 1. Ambil data rute dari DB
  console.log(`\nMemeriksa Rute ID ${config.ruteId}...`);
  const rute = await prisma.rute.findUnique({
    where: { id: config.ruteId },
    include: {
      moda: true,
      stops: {
        orderBy: { urutan: 'asc' },
        include: { halte: true },
      },
    },
  });

  if (!rute) {
    console.error(`❌ Rute dengan ID ${config.ruteId} tidak ditemukan di database.`);
    process.exit(1);
  }

  console.log(`✅ Rute ditemukan: [${rute.kodeRute ?? rute.id}] "${rute.namaRute}" (${rute.stops.length} stop)`);

  const stopMap = new Map(rute.stops.map((s) => [s.halteId, s]));
  const outDir = path.resolve(__dirname, 'shaping-points/out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let totalSegments = config.segments.length;
  let successfulSegments = 0;
  let hasWarnings = false;

  for (let sIdx = 0; sIdx < config.segments.length; sIdx++) {
    const seg = config.segments[sIdx];
    console.log(`\n-----------------------------------------------------`);
    console.log(`Segmen #${sIdx + 1}: Halte ${seg.dariHalteId} → Halte ${seg.keHalteId}`);
    if (seg.catatan) console.log(`Catatan: ${seg.catatan}`);

    const stopA = stopMap.get(seg.dariHalteId);
    const stopB = stopMap.get(seg.keHalteId);

    if (!stopA || !stopB) {
      console.error(`❌ Halte ${seg.dariHalteId} atau Halte ${seg.keHalteId} tidak terdaftar pada rute ini.`);
      process.exit(1);
    }

    if (stopB.urutan !== stopA.urutan + 1) {
      console.error(
        `❌ Halte awal (urutan ${stopA.urutan}) dan halte tujuan (urutan ${stopB.urutan}) tidak berurutan langsung (harus n dan n+1).`
      );
      process.exit(1);
    }

    console.log(`  Dari : [${stopA.halte.id}] "${stopA.halte.namaHalte}" (urutan ${stopA.urutan})`);
    console.log(`  Ke   : [${stopB.halte.id}] "${stopB.halte.namaHalte}" (urutan ${stopB.urutan})`);

    // Validasi via points
    const viaValidation = validateViaPoints(
      seg.via,
      ROUTING_CONFIG.validationBbox,
      { lat: stopA.halte.latitude, lng: stopA.halte.longitude },
      { lat: stopB.halte.latitude, lng: stopB.halte.longitude }
    );

    if (!viaValidation.valid) {
      console.error('❌ Validasi titik via gagal:');
      viaValidation.errors.forEach((e) => console.error(`   - ${e}`));
      process.exit(1);
    }

    console.log(`  Titik via valid (${seg.via.length} titik):`);
    seg.via.forEach((v, i) => console.log(`    #${i + 1}: [${v[0]}, ${v[1]}]`));

    // Periksa apakah sudah ada geometri di DB
    if (stopA.geometri !== null && !isOverwrite) {
      console.warn(`  ⚠️ PERINGATAN: Stop ${stopA.id} sudah memiliki geometri tersimpan.`);
      console.warn('     Gunakan flag --overwrite bila ingin mengganti.');
      hasWarnings = true;
      if (isApply && !isForce) {
        console.error('❌ Apply dibatalkan untuk mencegah penimpaan yang tidak disengaja.');
        process.exit(1);
      }
    }

    // Panggil OSRM
    const waypoints = buildWaypoints(
      { lat: stopA.halte.latitude, lng: stopA.halte.longitude },
      seg.via,
      { lat: stopB.halte.latitude, lng: stopB.halte.longitude }
    );

    console.log(`  Mengambil rute dari OSRM (${waypoints.length} waypoint)...`);
    const osrmRoute = await fetchOsrmWithRetry(waypoints);
    const cleanCoords = formatOsrmCoordinates(osrmRoute.geometry.coordinates);

    // Hitung metrik plausibility
    const straightDist = haversineMeters(
      { lat: stopA.halte.latitude, lng: stopA.halte.longitude },
      { lat: stopB.halte.latitude, lng: stopB.halte.longitude }
    );
    const routeDist = osrmRoute.distance;
    const ratio = straightDist > 0 ? routeDist / straightDist : 1;
    const startDist = haversineMeters(
      { lat: cleanCoords[0][0], lng: cleanCoords[0][1] },
      { lat: stopA.halte.latitude, lng: stopA.halte.longitude }
    );
    const endDist = haversineMeters(
      { lat: cleanCoords[cleanCoords.length - 1][0], lng: cleanCoords[cleanCoords.length - 1][1] },
      { lat: stopB.halte.latitude, lng: stopB.halte.longitude }
    );

    console.log(`\n  📊 Hasil Metrik Kualitas:`);
    console.log(`     - Panjang jalur rute  : ${routeDist.toFixed(1)} m`);
    console.log(`     - Jarak garis lurus   : ${straightDist.toFixed(1)} m`);
    console.log(`     - Rasio jarak (rute/A-B): ${ratio.toFixed(2)}x (referensi: 1.0 - 1.8x)`);
    console.log(`     - Jarak awal ke Halte A: ${startDist.toFixed(1)} m (toleransi < 300 m)`);
    console.log(`     - Jarak akhir ke Halte B: ${endDist.toFixed(1)} m (toleransi < 300 m)`);
    console.log(`     - Total titik tersimpan : ${cleanCoords.length} titik`);

    // Deteksi U-turn
    const uturnWarnings = detectUturnWarnings(
      cleanCoords,
      { lat: stopA.halte.latitude, lng: stopA.halte.longitude },
      150
    );

    if (ratio < 0.9 || ratio > 1.85) {
      console.warn(`  ⚠️ Rasio jarak ${ratio.toFixed(2)}x di luar rentang ideal (1.0 - 1.8x).`);
      hasWarnings = true;
    }

    if (startDist > 300 || endDist > 300) {
      console.warn(`  ⚠️ Titik awal/akhir terlalu jauh dari halte (> 300 m).`);
      hasWarnings = true;
    }

    if (uturnWarnings.length > 0) {
      console.warn(`  ⚠️ Peringatan Deteksi Putar Balik (${uturnWarnings.length}):`);
      uturnWarnings.forEach((w) => console.warn(`     - ${w}`));
      hasWarnings = true;
    } else {
      console.log(`     - Deteksi U-turn        : Bersih (0 putar balik)`);
    }

    // Buat preview GeoJSON
    const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
    const previewFileName = `${baseName}-segmen-${stopA.halte.id}-${stopB.halte.id}.geojson`;
    const previewFilePath = path.join(outDir, previewFileName);
    const geoJson = generatePreviewGeoJson(
      cleanCoords,
      { id: stopA.halte.id, nama: stopA.halte.namaHalte, lat: stopA.halte.latitude, lng: stopA.halte.longitude },
      { id: stopB.halte.id, nama: stopB.halte.namaHalte, lat: stopB.halte.latitude, lng: stopB.halte.longitude },
      seg.via,
      {
        ruteId: rute.id,
        namaRute: rute.namaRute,
        distanceMeters: routeDist,
        straightMeters: straightDist,
        ratio: Number(ratio.toFixed(2)),
      }
    );
    fs.writeFileSync(previewFilePath, JSON.stringify(geoJson, null, 2), 'utf-8');
    console.log(`  🗺️ File preview GeoJSON disimpan: ${previewFilePath}`);

    // Eksekusi Apply jika diminta
    if (isApply) {
      if (hasWarnings && !isForce) {
        console.error(`\n❌ Terdapat peringatan kualitas. Gunakan flag --force untuk tetap menyimpan.`);
        process.exit(1);
      }

      await prisma.ruteStop.update({
        where: { id: stopA.id },
        data: { geometri: cleanCoords },
      });
      console.log(`  💾 ✅ BERHASIL DISIMPAN ke RuteStop ID ${stopA.id} (geometri ${cleanCoords.length} titik)`);
    }

    successfulSegments++;
    if (sIdx < config.segments.length - 1) {
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }
  }

  console.log('\n=====================================================');
  console.log(`📊 RINGKASAN: ${successfulSegments}/${totalSegments} segmen berhasil diproses.`);
  if (isApply) {
    console.log('✅ Data berhasil diperbarui di database.');
    console.log('ℹ️ Catatan: Server backend yang sedang berjalan akan membaca data baru setelah TTL');
    console.log('   cache kedaluwarsa (60 detik) atau setelah server di-restart.');
  } else {
    console.log('🔍 DRY-RUN selesai. Tidak ada data yang diubah di database.');
    console.log('   Jalankan dengan flag --apply untuk menyimpan secara permanen.');
  }
  console.log('=====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Script gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
