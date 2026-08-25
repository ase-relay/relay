import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// 1. Buat instance adapter PrismaLibSql langsung dengan url database
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

// 2. Masukkan adapter tersebut ke constructor PrismaClient
const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 8000;

app.use(express.json());

// Tes endpoint hello world
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Halo bre! Backend RELAY TypeScript siap tempur 🤝' });
});

// Tes ambil data user dari database
app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

app.listen(PORT, () => {
  console.log(`⚡️ Server running on http://localhost:${PORT}`);
});
