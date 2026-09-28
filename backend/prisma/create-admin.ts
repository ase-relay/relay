import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Validasi environment variables
  if (!adminEmail) {
    console.error('❌ Error: ADMIN_EMAIL environment variable wajib diisi');
    console.error('Contoh: ADMIN_EMAIL=admin@example.com npm run create-admin');
    process.exit(1);
  }

  // Cek apakah user sudah ada
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, username: true, role: true },
  });

  if (existingUser) {
    // Update role ke ADMIN jika user sudah ada
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: Role.ADMIN },
    });
    console.log(`✅ User ${adminEmail} (${existingUser.username}) sekarang berperan ADMIN`);
    return;
  }

  // Jika user belum ada, username dan password wajib
  if (!adminUsername) {
    console.error('❌ Error: ADMIN_USERNAME environment variable wajib diisi untuk user baru');
    console.error('Contoh: ADMIN_USERNAME=admin ADMIN_PASSWORD=securepassword npm run create-admin');
    process.exit(1);
  }

  if (!adminPassword) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable wajib diisi untuk user baru');
    console.error('Contoh: ADMIN_USERNAME=admin ADMIN_PASSWORD=securepassword npm run create-admin');
    process.exit(1);
  }

  // Hash password dengan salt rounds yang sama dengan auth.service.ts (10)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  // Buat user baru dengan role ADMIN
  const newUser = await prisma.user.create({
    data: {
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  console.log(`✅ User ${adminEmail} (${adminUsername}) berhasil dibuat dengan role ADMIN`);
}

main()
  .catch((e) => {
    console.error('❌ Create admin failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
