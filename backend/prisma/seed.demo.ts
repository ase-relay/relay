/**
 * ============================================================
 * SEED DEMO (OPSIONAL) — TIDAK DIJALANKAN OTOMATIS OLEH PRISMA
 * ============================================================
 * Data demo minimal wilayah Bandung–Cimahi untuk pengujian mesin
 * routing multimodal (6 halte, 2 rute bus, 1 rute kereta).
 *
 * ⚠ SEMUA KOORDINAT BERSIFAT PERKIRAAN — VERIFIKASI SEBELUM DIPAKAI.
 *
 * Jalankan manual bila diperlukan:
 *   npx tsx prisma/seed.demo.ts
 *
 * Catatan: prisma/seed.ts (utama) sudah berisi data resmi 11 halte +
 * 4 rute; file ini hanya pelengkap untuk uji coba terpisah.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient, TipeTarif } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertModa(data: {
  namaModa: string;
  tipeModa: string;
  ikon: string;
  deskripsi: string;
  rataRataKecepatanKmh: number;
}) {
  return prisma.modaTransportasi.upsert({
    where: { namaModa: data.namaModa },
    update: data,
    create: data,
  });
}

async function upsertDemoHalte(data: {
  namaHalte: string;
  latitude: number;
  longitude: number;
  kota: string;
}) {
  const existing = await prisma.halte.findFirst({ where: { namaHalte: data.namaHalte } });
  if (existing) {
    await prisma.halte.update({ where: { id: existing.id }, data: data });
    return existing.id;
  }
  const created = await prisma.halte.create({ data });
  return created.id;
}

async function upsertDemoRute(data: {
  namaRute: string;
  kodeRute: string;
  deskripsi: string;
  modaId: number;
  tarifDasar: number;
}) {
  const existing = await prisma.rute.findFirst({ where: { kodeRute: data.kodeRute } });
  const rute = existing
    ? await prisma.rute.update({
        where: { id: existing.id },
        data: { namaRute: data.namaRute, deskripsi: data.deskripsi, modaId: data.modaId, isActive: true },
      })
    : await prisma.rute.create({
        data: {
          namaRute: data.namaRute,
          kodeRute: data.kodeRute,
          deskripsi: data.deskripsi,
          modaId: data.modaId,
          isActive: true,
        },
      });

  // Tarif rute (FLAT) bila belum ada
  const tarif = await prisma.tarif.findFirst({ where: { ruteId: rute.id } });
  if (!tarif) {
    await prisma.tarif.create({
      data: {
        modaId: data.modaId,
        ruteId: rute.id,
        tipeTarif: TipeTarif.FLAT,
        nominalDasar: data.tarifDasar,
        keterangan: 'Tarif demo (verifikasi sebelum dipakai).',
      },
    });
  }

  return rute.id;
}

async function replaceDemoStops(
  ruteId: number,
  stops: Array<{ halteId: number; estimasiMenit: number; jarakMeter: number }>
) {
  await prisma.ruteStop.deleteMany({ where: { ruteId } });
  for (let i = 0; i < stops.length; i++) {
    await prisma.ruteStop.create({
      data: {
        ruteId,
        halteId: stops[i].halteId,
        urutan: i + 1,
        estimasiMenit: stops[i].estimasiMenit,
        jarakMeter: stops[i].jarakMeter,
      },
    });
  }
}

async function main() {
  console.warn('⚠️  SEED DEMO — koordinat PERKIRAAN, verifikasi sebelum dipakai.');

  const bus = await upsertModa({
    namaModa: 'Bus Trans Metro Pasundan',
    tipeModa: 'BRT',
    ikon: 'bus',
    deskripsi: 'Layanan Bus Rapid Transit (BRT) Trans Metro Pasundan (Teman Bus Bandung).',
    rataRataKecepatanKmh: 20,
  });
  const krd = await upsertModa({
    namaModa: 'Commuter Line Bandung Raya',
    tipeModa: 'COMMUTER_TRAIN',
    ikon: 'train',
    deskripsi: 'Kereta Rel Diesel (KRD) lokal rute Padalarang - Cicalengka via Bandung.',
    rataRataKecepatanKmh: 35,
  });
  await upsertModa({
    namaModa: 'Ojek Online',
    tipeModa: 'RIDE_HAILING',
    ikon: 'motorcycle',
    deskripsi: 'Ojek online (ride-hailing) untuk akses dan perjalanan langsung.',
    rataRataKecepatanKmh: 22,
  });

  // 6 halte demo (verifikasi koordinat sebelum dipakai)
  const alun = await upsertDemoHalte({
    namaHalte: 'Halte Demo Alun-Alun',
    latitude: -6.9215165,
    longitude: 107.6076013,
    kota: 'Kota Bandung',
  });
  const pasarBaru = await upsertDemoHalte({
    namaHalte: 'Halte Demo Pasar Baru',
    latitude: -6.9174245,
    longitude: 107.6037561,
    kota: 'Kota Bandung',
  });
  const stasiunHall = await upsertDemoHalte({
    namaHalte: 'Halte Demo Stasiun Hall',
    latitude: -6.9160396,
    longitude: 107.602443,
    kota: 'Kota Bandung',
  });
  const bec = await upsertDemoHalte({
    namaHalte: 'Halte Demo BEC',
    latitude: -6.9081566,
    longitude: 107.6094288,
    kota: 'Kota Bandung',
  });
  const dago = await upsertDemoHalte({
    namaHalte: 'Halte Demo Dago',
    latitude: -6.8852279,
    longitude: 107.6137198,
    kota: 'Kota Bandung',
  });
  const cimahi = await upsertDemoHalte({
    namaHalte: 'Halte Demo Stasiun Cimahi',
    latitude: -6.8857909,
    longitude: 107.5361568,
    kota: 'Kota Cimahi',
  });

  // 2 rute bus demo
  const bus1 = await upsertDemoRute({
    namaRute: 'DEMO Bus: Alun-Alun - BEC - Dago',
    kodeRute: 'DEMO-BUS-1',
    deskripsi: 'Demo rute bus pusat kota ke Dago (urutan halte mengikuti arah rute).',
    modaId: bus.id,
    tarifDasar: 4900,
  });
  await replaceDemoStops(bus1, [
    { halteId: alun, estimasiMenit: 5, jarakMeter: 900 },
    { halteId: pasarBaru, estimasiMenit: 6, jarakMeter: 1100 },
    { halteId: stasiunHall, estimasiMenit: 7, jarakMeter: 1500 },
    { halteId: bec, estimasiMenit: 9, jarakMeter: 2400 },
    { halteId: dago, estimasiMenit: 0, jarakMeter: 0 },
  ]);

  const bus2 = await upsertDemoRute({
    namaRute: 'DEMO Bus: Dago - Stasiun Hall - Cimahi',
    kodeRute: 'DEMO-BUS-2',
    deskripsi: 'Demo rute bus Dago menuju Cimahi via pusat kota.',
    modaId: bus.id,
    tarifDasar: 4900,
  });
  await replaceDemoStops(bus2, [
    { halteId: dago, estimasiMenit: 9, jarakMeter: 2400 },
    { halteId: bec, estimasiMenit: 8, jarakMeter: 2100 },
    { halteId: alun, estimasiMenit: 6, jarakMeter: 1300 },
    { halteId: stasiunHall, estimasiMenit: 25, jarakMeter: 9500 },
    { halteId: cimahi, estimasiMenit: 0, jarakMeter: 0 },
  ]);

  // 1 rute kereta demo
  const krl = await upsertDemoRute({
    namaRute: 'DEMO KRL: Cimahi - Stasiun Hall - Dago',
    kodeRute: 'DEMO-KRL-1',
    deskripsi: 'Demo rute kereta komuter Cimahi - Bandung - Dago (perkiraan, verifikasi dulu).',
    modaId: krd.id,
    tarifDasar: 5000,
  });
  await replaceDemoStops(krl, [
    { halteId: cimahi, estimasiMenit: 12, jarakMeter: 8200 },
    { halteId: stasiunHall, estimasiMenit: 10, jarakMeter: 6100 },
    { halteId: dago, estimasiMenit: 0, jarakMeter: 0 },
  ]);

  console.log('✅ Seed demo selesai: 6 halte, 2 rute bus, 1 rute kereta (opsional).');
}

main()
  .catch((e) => {
    console.error('❌ Seed demo gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
