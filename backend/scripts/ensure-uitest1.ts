import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Memastikan akun uji `uitest1` (id 11, sesuai kunci riwayat pencarian di FE)
 * ada di database. Akun ini dipakai skrip uji browser, bukan produksi.
 */
async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const existing = await prisma.user.findFirst({ where: { username: 'uitest1' } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: passwordHash, email: 'uitest1@relay.test' },
    });
    console.log(`✅ uitest1 sudah ada (id=${existing.id}), password di-reset.`);
  } else {
    await prisma.user.create({
      data: {
        id: 11,
        username: 'uitest1',
        email: 'uitest1@relay.test',
        password: passwordHash,
        role: 'USER',
      },
    });
    console.log('✅ uitest1 dibuat ulang dengan id=11.');
  }

  // Pastikan sequence id melewati id eksplisit agar insert berikutnya tidak bentrok
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"User"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "User"), 11));`
  );
  console.log('✅ Sequence id User disesuaikan.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
