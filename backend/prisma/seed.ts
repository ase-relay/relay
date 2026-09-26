import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient, TipeTarif } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Relay (Bandung Transport Network)...');

  // 1. Bersihkan data relasi seeder lama (jika ada)
  await prisma.ruteStop.deleteMany({});
  await prisma.tarif.deleteMany({});
  await prisma.rute.deleteMany({});
  await prisma.halte.deleteMany({});
  await prisma.modaTransportasi.deleteMany({});

  console.log('🧹 Cleaned up existing transport master data.');

  // 2. Seed Moda Transportasi
  const bus = await prisma.modaTransportasi.create({
    data: {
      namaModa: 'Bus Trans Metro Pasundan',
      tipeModa: 'BRT',
      ikon: 'bus',
      deskripsi: 'Layanan Bus Rapid Transit (BRT) Trans Metro Pasundan (Teman Bus Bandung).',
    },
  });

  const angkot = await prisma.modaTransportasi.create({
    data: {
      namaModa: 'Angkutan Kota (Angkot)',
      tipeModa: 'FEEDER',
      ikon: 'car',
      deskripsi: 'Angkutan kota mikrolet trayek Bandung Raya.',
    },
  });

  const krd = await prisma.modaTransportasi.create({
    data: {
      namaModa: 'Commuter Line Bandung Raya',
      tipeModa: 'COMMUTER_TRAIN',
      ikon: 'train',
      deskripsi: 'Kereta Rel Diesel (KRD) lokal rute Padalarang - Cicalengka via Bandung.',
    },
  });

  console.log('✅ Seeded 3 Moda Transportasi: Bus, Angkot, Kereta.');

  // 3. Seed Halte & Stasiun Strategis Bandung (Koordinat Presisi OpenStreetMap)
  const halteData = [
    {
      id: 1,
      namaHalte: 'Halte Telkom University (Dayeuhkolot)',
      latitude: -6.9732083,
      longitude: 107.6308535,
      alamat: 'Jl. Telekomunikasi No. 1, Terusan Buahbatu, Dayeuhkolot',
      kota: 'Kabupaten Bandung',
      isTransit: false,
    },
    {
      id: 2,
      namaHalte: 'Terminal Leuwipanjang',
      latitude: -6.9457258,
      longitude: 107.5942849,
      alamat: 'Jl. Soekarno Hatta No. 205, Situsaeur, Bojongloa Kidul',
      kota: 'Kota Bandung',
      isTransit: true,
    },
    {
      id: 3,
      namaHalte: 'Halte Alun-Alun Bandung',
      latitude: -6.9215165,
      longitude: 107.6076013,
      alamat: 'Jl. Asia Afrika / Alun-Alun Timur, Balonggede, Regol',
      kota: 'Kota Bandung',
      isTransit: true,
    },
    {
      id: 4,
      namaHalte: 'Halte Pasar Baru',
      latitude: -6.9174245,
      longitude: 107.6037561,
      alamat: 'Jl. Otto Iskandardinata / Pasar Utara, Andir',
      kota: 'Kota Bandung',
      isTransit: false,
    },
    {
      id: 5,
      namaHalte: 'Stasiun Hall Bandung',
      latitude: -6.9160396,
      longitude: 107.602443,
      alamat: 'Jl. Stasiun Barat / Kebon Jeruk, Andir',
      kota: 'Kota Bandung',
      isTransit: true,
    },
    {
      id: 6,
      namaHalte: 'Halte BEC (Bandung Electronic Center)',
      latitude: -6.9081566,
      longitude: 107.6094288,
      alamat: 'Jl. Purnawarman No. 13-15, Babakan Ciamis, Sumur Bandung',
      kota: 'Kota Bandung',
      isTransit: false,
    },
    {
      id: 7,
      namaHalte: 'Halte Cihampelas Walk',
      latitude: -6.8938202,
      longitude: 107.6055658,
      alamat: 'Jl. Cihampelas No. 160, Cipaganti, Coblong',
      kota: 'Kota Bandung',
      isTransit: false,
    },
    {
      id: 8,
      namaHalte: 'Halte ITB Ganesha',
      latitude: -6.8904487,
      longitude: 107.6103136,
      alamat: 'Jl. Ganesha No. 10, Lebak Siliwangi, Coblong',
      kota: 'Kota Bandung',
      isTransit: false,
    },
    {
      id: 9,
      namaHalte: 'Halte Simpang Dago',
      latitude: -6.8852279,
      longitude: 107.6137198,
      alamat: 'Jl. Ir. H. Djuanda / Simpang Dago, Lebak Gede, Coblong',
      kota: 'Kota Bandung',
      isTransit: true,
    },
    {
      id: 10,
      namaHalte: 'Stasiun Cimahi',
      latitude: -6.8857909,
      longitude: 107.5361568,
      alamat: 'Jl. Stasiun, Setiamanah, Cimahi Tengah',
      kota: 'Kota Cimahi',
      isTransit: true,
    },
    {
      id: 11,
      namaHalte: 'Stasiun Kiaracondong',
      latitude: -6.9247499,
      longitude: 107.6462773,
      alamat: 'Jl. Jembatan Opat / Ibrahim Adjie, Kiaracondong',
      kota: 'Kota Bandung',
      isTransit: true,
    },
  ];

  for (const h of halteData) {
    await prisma.halte.create({ data: h });
  }

  console.log(`✅ Seeded ${halteData.length} Halte/Stasiun strategis.`);

  // 4. Seed Rute Transportasi
  // Rute 1: TMP Koridor 3D (Baleendah - BEC via Tel-U & Leuwipanjang)
  const ruteTmp3 = await prisma.rute.create({
    data: {
      namaRute: 'TMP Koridor 3D: Baleendah - BEC (via Tel-U & Leuwipanjang)',
      kodeRute: 'TMP-3D',
      deskripsi: 'Rute menghubungkan Kabupaten Bandung selatan ke pusat kota Bandung via Tel-U dan Leuwipanjang.',
      modaId: bus.id,
      isActive: true,
      tarifs: {
        create: {
          modaId: bus.id,
          tipeTarif: TipeTarif.FLAT,
          nominalDasar: 4900,
          keterangan: 'Tarif integrasi Teman Bus Trans Metro Pasundan (Flat Rp 4.900)',
        },
      },
    },
  });

  // Rute 2: TMP Koridor 2D (Alun-Alun Bandung - Cimahi / KBP)
  const ruteTmp2 = await prisma.rute.create({
    data: {
      namaRute: 'TMP Koridor 2D: Alun-Alun Bandung - Cimahi',
      kodeRute: 'TMP-2D',
      deskripsi: 'Koridor barat menghubungkan Alun-Alun Bandung, Pasar Baru, Stasiun Hall menuju Kota Cimahi.',
      modaId: bus.id,
      isActive: true,
      tarifs: {
        create: {
          modaId: bus.id,
          tipeTarif: TipeTarif.FLAT,
          nominalDasar: 4900,
          keterangan: 'Tarif integrasi Teman Bus Trans Metro Pasundan (Flat Rp 4.900)',
        },
      },
    },
  });

  // Rute 3: Angkot Trayek Kalapa - Dago (Leuwipanjang / Alun-alun - Dago)
  const ruteAngkotDago = await prisma.rute.create({
    data: {
      namaRute: 'Angkot Kalapa - Dago (via Alun-Alun, BEC & ITB)',
      kodeRute: 'ANGKOT-KLP-DGO',
      deskripsi: 'Angkutan kota menghubungkan pusat kota (Alun-Alun), area kampus ITB hingga Simpang Dago.',
      modaId: angkot.id,
      isActive: true,
      tarifs: {
        create: {
          modaId: angkot.id,
          tipeTarif: TipeTarif.FLAT,
          nominalDasar: 5000,
          keterangan: 'Tarif flat angkot dalam kota Bandung (Rp 5.000)',
        },
      },
    },
  });

  // Rute 4: KRD Commuter Line Bandung Raya (Cimahi - Stasiun Hall - Kiaracondong)
  const ruteKrd = await prisma.rute.create({
    data: {
      namaRute: 'Commuter Line Bandung Raya (Cimahi - Bandung - Kiaracondong)',
      kodeRute: 'KRD-BDG-RAYA',
      deskripsi: 'Kereta komuter lokal menghubungkan Cimahi, Stasiun Bandung Hall, hingga Kiaracondong.',
      modaId: krd.id,
      isActive: true,
      tarifs: {
        create: {
          modaId: krd.id,
          tipeTarif: TipeTarif.FLAT,
          nominalDasar: 5000,
          keterangan: 'Tarif flat tiket KRD Commuter Line (Rp 5.000)',
        },
      },
    },
  });

  console.log('✅ Seeded 4 Rute Transportasi (TMP-3D, TMP-2D, Angkot Dago, KRD).');

  // 5. Seed RuteStops (Jalur urutan pemberhentian per rute)

  // Stops Rute TMP-3D: Tel-U (1) -> Leuwipanjang (2) -> Alun-Alun (3) -> BEC (4)
  const stopsTmp3 = [
    { halteId: 1, urutan: 1, estimasiMenit: 15, jarakMeter: 4800 },
    { halteId: 2, urutan: 2, estimasiMenit: 12, jarakMeter: 3200 },
    { halteId: 3, urutan: 3, estimasiMenit: 8, jarakMeter: 1900 },
    { halteId: 6, urutan: 4, estimasiMenit: 0, jarakMeter: 0 },
  ];
  for (const s of stopsTmp3) {
    await prisma.ruteStop.create({ data: { ruteId: ruteTmp3.id, ...s } });
  }

  // Stops Rute TMP-2D: Alun-Alun (1) -> Pasar Baru (2) -> Stasiun Hall (3) -> Cimahi (4)
  const stopsTmp2 = [
    { halteId: 3, urutan: 1, estimasiMenit: 4, jarakMeter: 950 },
    { halteId: 4, urutan: 2, estimasiMenit: 3, jarakMeter: 700 },
    { halteId: 5, urutan: 3, estimasiMenit: 25, jarakMeter: 9500 },
    { halteId: 10, urutan: 4, estimasiMenit: 0, jarakMeter: 0 },
  ];
  for (const s of stopsTmp2) {
    await prisma.ruteStop.create({ data: { ruteId: ruteTmp2.id, ...s } });
  }

  // Stops Angkot Dago: Alun-Alun (1) -> BEC (2) -> ITB (3) -> Simpang Dago (4)
  const stopsAngkot = [
    { halteId: 3, urutan: 1, estimasiMenit: 8, jarakMeter: 1900 },
    { halteId: 6, urutan: 2, estimasiMenit: 10, jarakMeter: 2400 },
    { halteId: 8, urutan: 3, estimasiMenit: 5, jarakMeter: 1100 },
    { halteId: 9, urutan: 4, estimasiMenit: 0, jarakMeter: 0 },
  ];
  for (const s of stopsAngkot) {
    await prisma.ruteStop.create({ data: { ruteId: ruteAngkotDago.id, ...s } });
  }

  // Stops KRD Bandung Raya: Cimahi (1) -> Stasiun Hall (2) -> Kiaracondong (3)
  const stopsKrd = [
    { halteId: 10, urutan: 1, estimasiMenit: 12, jarakMeter: 8200 },
    { halteId: 5, urutan: 2, estimasiMenit: 10, jarakMeter: 6100 },
    { halteId: 11, urutan: 3, estimasiMenit: 0, jarakMeter: 0 },
  ];
  for (const s of stopsKrd) {
    await prisma.ruteStop.create({ data: { ruteId: ruteKrd.id, ...s } });
  }

  console.log('✅ Seeded All RuteStops (Urutan & Interkoneksi Transit Antar Moda).');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
