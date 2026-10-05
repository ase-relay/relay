/**
 * Script helper: pastikan kolom `geometri` sudah ada di tabel "RuteStop".
 * Aman dijalankan berulang kali (idempoten via IF NOT EXISTS).
 * Dijalankan oleh migration manual karena `prisma migrate dev` membutuhkan mode interaktif.
 *
 * Usage: tsx scripts/apply-geometri-migration.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Menerapkan migration: tambah kolom geometri ke RuteStop...');

  await prisma.$executeRaw`ALTER TABLE "RuteStop" ADD COLUMN IF NOT EXISTS "geometri" JSONB`;
  console.log('✅ Kolom geometri berhasil ditambahkan (atau sudah ada).');

  // Verifikasi
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'RuteStop'
      AND column_name = 'geometri'
  `;
  if (rows.length > 0) {
    console.log('✅ Verifikasi: kolom geometri ditemukan di tabel RuteStop.');
  } else {
    console.error('❌ Verifikasi gagal: kolom geometri tidak ditemukan!');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
