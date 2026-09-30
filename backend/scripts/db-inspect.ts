import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  console.log('MODA:', JSON.stringify(await p.modaTransportasi.findMany(), null, 1));
  console.log('TARIF:', JSON.stringify(await p.tarif.findMany(), null, 1));
  console.log(
    'counts: halte=',
    await p.halte.count(),
    'rute=',
    await p.rute.count(),
    'ruteStop=',
    await p.ruteStop.count()
  );
  console.log('rutes:', JSON.stringify(await p.rute.findMany({ select: { id: true, namaRute: true, kodeRute: true, modaId: true, isActive: true } }), null, 1));
}

main().finally(() => p.$disconnect());
