import { RoutingService } from '../src/services/routing.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const res = await RoutingService.searchRoutes({
    origin: { lat: -6.8841, lng: 107.5489, name: 'Cimahi' },
    destination: { lat: -6.9143, lng: 107.6025, name: 'Bandung' },
  });

  console.log('Found', res.totalRoutesFound, 'routes');
  for (const route of res.routes) {
    console.log('================');
    console.log('Route Type:', route.type, 'Total modes:', route.modes);
    for (const leg of route.legs) {
      if (leg.legType === 'TRANSIT' && leg.moda?.tipe === 'COMMUTER_TRAIN') {
        console.log('Train leg:', leg.moda.nama, leg.from.name, '->', leg.to.name);
        console.log('  geometry points:', leg.geometry?.length);
      } else {
        console.log('Leg:', leg.legType, leg.instruction, leg.geometry?.length, 'points');
      }
    }
  }
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
