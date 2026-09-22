/**
 * Debug script untuk validasi kontrak API routing search
 * 
 * Script ini mengobservasi kontrak API antara FE dan BE tanpa mengubah kode production:
 * 1. Membuat request payload FE yang realistis (dari data stops.ts)
 * 2. Membandingkan dengan kontrak BE (routing_search_request.json)
 * 3. Mapping response BE ke format FE via routeMapper
 * 4. Optional: live test ke endpoint asli jika LIVE_TEST=true
 */

import { stops } from '../src/lib/mock/stops';
import type { RoutingSearchRequest } from '../src/types/api/routing';
import { mapApiRouteToRouteResultCard, mapApiRouteToJourneySegments } from '../src/lib/mappers/routeMapper';
import { searchRoutes } from '../src/lib/api';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  // ============================================================================
  // 1. REQUEST PAYLOAD FE (realistis dari data stops.ts)
  // ============================================================================

  // Pilih 2 stop asli dari stops.ts untuk origin dan destination
  const originStop = stops.find(s => s.name === 'Halte Alun-Alun') || stops[0];
  const destinationStop = stops.find(s => s.name === 'Halte Cibiru') || stops[stops.length - 1];

  const requestPayload: RoutingSearchRequest = {
    origin: {
      name: originStop.name,
      lat: originStop.latitude,
      lng: originStop.longitude,
    },
    destination: {
      name: destinationStop.name,
      lat: destinationStop.latitude,
      lng: destinationStop.longitude,
    },
    preferences: {
      sortBy: 'RECOMMENDED',
      maxWalkingDistance: 1500,
      allowedModa: [], // kosong = semua moda diperhitungkan
    },
  };

  console.log('=== REQUEST PAYLOAD (FE) ===');
  console.log(JSON.stringify(requestPayload, null, 2));
  console.log('');

  // ============================================================================
  // 2. RAW RESPONSE BE CONTRACT EXAMPLE
  // ============================================================================

  // Baca file kontrak response dari folder relay (root project)
  const contractPath = join(__dirname, '../../routing_search_response.json');
  const contractContent = readFileSync(contractPath, 'utf-8');
  const contractJson = JSON.parse(contractContent);
  const exampleResponse = contractJson.example;

  console.log('=== RAW RESPONSE (BE contract example) ===');
  console.log(JSON.stringify(exampleResponse, null, 2));
  console.log('');

  // ============================================================================
  // 3. MAPPING RESPONSE BE → FORMAT FE
  // ============================================================================

  const mappedResults = {
    routeResultCards: exampleResponse.data.routes.map((route: any) => mapApiRouteToRouteResultCard(route)),
    journeySegments: exampleResponse.data.routes.map((route: any) => mapApiRouteToJourneySegments(route)),
  };

  console.log('=== MAPPED OUTPUT (FE, dari contoh response BE) ===');
  console.log(JSON.stringify(mappedResults, null, 2));
  console.log('');

  // ============================================================================
  // 4. OPTIONAL LIVE TEST (jika LIVE_TEST=true)
  // ============================================================================

  const liveTest = process.env.LIVE_TEST === 'true';

  if (liveTest) {
    console.log('=== LIVE TEST MODE: Panggil endpoint asli ===');
    console.log(`Base URL: ${process.env.NEXT_PUBLIC_API_URL || 'tidak di-set'}`);
    console.log('');

    try {
      const liveResponse = await searchRoutes(requestPayload);
      console.log('=== RAW RESPONSE (BE, live call) ===');
      console.log(JSON.stringify(liveResponse, null, 2));
      console.log('');

      // Mapping live response juga
      const liveMappedResults = {
        routeResultCards: liveResponse.data.routes.map((route: any) => mapApiRouteToRouteResultCard(route)),
        journeySegments: liveResponse.data.routes.map((route: any) => mapApiRouteToJourneySegments(route)),
      };

      console.log('=== MAPPED OUTPUT (FE, dari live response BE) ===');
      console.log(JSON.stringify(liveMappedResults, null, 2));
    } catch (error) {
      console.error('=== LIVE TEST ERROR ===');
      console.error('BE belum live atau gagal connect. Error:');
      console.error(error instanceof Error ? error.message : String(error));
      console.log('');
      console.log('Skip live test — hanya contract example yang dijalankan.');
    }
  } else {
    console.log('=== LIVE TEST MODE: OFF ===');
    console.log('Untuk menjalankan live test ke endpoint asli, set env var:');
    console.log('LIVE_TEST=true npm run debug:contract');
    console.log('');
  }

  console.log('=== SELESAI ===');
}

main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
