/**
 * Script pre-compute geometri jalur rel (railway=rail) dari Overpass API.
 *
 * Untuk setiap RuteStop dengan moda KERETA:
 *  1. Ambil pasangan halte berurutan (stop[i] → stop[i+1]).
 *  2. Query Overpass API untuk segmen rel antara kedua stasiun.
 *  3. Simpan geometri [[lat,lng],...] ke kolom `geometri` pada RuteStop.
 *
 * Sifat: IDEMPOTEN — dapat dijalankan ulang tanpa merusak data.
 *   - Segmen yang sudah punya geometri TIDAK ditimpa (kecuali flag --force).
 *   - Segmen baru/null diisi.
 *
 * Usage:
 *   tsx scripts/compute-rail-geometry.ts            # isi segmen yang null
 *   tsx scripts/compute-rail-geometry.ts --force    # timpa semua
 *   tsx scripts/compute-rail-geometry.ts --dry-run  # tampilkan saja, tidak simpan
 *
 * Algoritma pengambilan geometri per segmen [A → B]:
 *  1. Buat bounding box yang mencakup A dan B (+ margin 2 km).
 *  2. Query Overpass: semua way dengan railway=rail dalam bbox.
 *  3. Bangun graph dari node-node way yang ada.
 *  4. Cari rute terpendek (BFS) dari node terdekat A ke node terdekat B.
 *  5. Simpan hasilnya sebagai [[lat,lng],...] dalam urutan A → B.
 *
 * Kelebihan versus OpenRailRouting:
 *  - Tidak butuh server routing terpisah.
 *  - Data langsung dari OSM (akurat).
 *  - Overpass tersedia publik (rate-limited, tapi script ini berjalan offline sekali).
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// Tipe
// ──────────────────────────────────────────────────────────────────────────────

type LatLng = [number, number];

interface GeoPoint {
  lat: number;
  lng: number;
}

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OverpassWay {
  type: 'way';
  id: number;
  nodes: number[];
}

interface OverpassResponse {
  elements: (OverpassNode | OverpassWay)[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Konfigurasi
// ──────────────────────────────────────────────────────────────────────────────

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const MARGIN_KM = 3;           // padding bbox di sekitar segmen
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_DELAY_MS = 1500; // jeda antar request ke Overpass (rate-limit)

// ──────────────────────────────────────────────────────────────────────────────
// Helpers geometri
// ──────────────────────────────────────────────────────────────────────────────

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Tambahkan margin ke bounding box (dalam derajat) supaya terpotong dengan benar */
function expandedBbox(a: GeoPoint, b: GeoPoint, marginKm: number) {
  const marginDeg = marginKm / 111.32;
  return {
    minLat: Math.min(a.lat, b.lat) - marginDeg,
    maxLat: Math.max(a.lat, b.lat) + marginDeg,
    minLng: Math.min(a.lng, b.lng) - marginDeg,
    maxLng: Math.max(a.lng, b.lng) + marginDeg,
  };
}

/** Node terdekat dengan titik koordinat dari sekumpulan node */
function nearestNode(
  nodes: Map<number, GeoPoint>,
  target: GeoPoint
): number | null {
  let bestId: number | null = null;
  let bestDist = Infinity;
  for (const [id, pt] of nodes) {
    const d = haversineMeters(pt, target);
    if (d < bestDist) {
      bestDist = d;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * BFS di graph node → [[lat, lng],...] dari fromId ke toId.
 * Return null bila tidak ada jalur.
 */
function bfsPath(
  graph: Map<number, number[]>,
  nodeCoords: Map<number, GeoPoint>,
  fromId: number,
  toId: number
): LatLng[] | null {
  if (fromId === toId) {
    const pt = nodeCoords.get(fromId);
    return pt ? [[pt.lat, pt.lng]] : null;
  }

  const visited = new Set<number>([fromId]);
  const queue: { id: number; path: number[] }[] = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of graph.get(current.id) ?? []) {
      if (neighbor === toId) {
        const fullPath = [...current.path, toId];
        return fullPath.map((id) => {
          const pt = nodeCoords.get(id)!;
          return [pt.lat, pt.lng] as LatLng;
        });
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Overpass API
// ──────────────────────────────────────────────────────────────────────────────

async function fetchOverpass(query: string): Promise<OverpassResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS * attempt));
    }
    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Otewe/1.0 (contact@otewe.com)' 
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) {
        console.warn(`  [overpass] HTTP ${response.status}, percobaan ${attempt}/${MAX_RETRIES}`);
        continue;
      }
      return (await response.json()) as OverpassResponse;
    } catch (err) {
      console.warn(`  [overpass] Error: ${(err as Error).message}, percobaan ${attempt}/${MAX_RETRIES}`);
    }
  }
  throw new Error('Overpass API tidak dapat dijangkau setelah beberapa percobaan.');
}

/**
 * Ambil geometri jalur rel antara dua titik menggunakan Overpass API.
 * Return [[lat,lng],...] dari A ke B, atau null bila tidak ada jalur rel.
 */
async function fetchRailGeometry(
  from: GeoPoint,
  to: GeoPoint,
  label: string
): Promise<LatLng[] | null> {
  const bbox = expandedBbox(from, to, MARGIN_KM);
  const bboxStr = `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;

  // Query semua way railway=rail + node-nya dalam bbox
  const query = `
[out:json][timeout:60];
(
  way["railway"="rail"](${bboxStr});
  way["railway"="light_rail"](${bboxStr});
  way["railway"="subway"](${bboxStr});
);
out body;
>;
out skel qt;
`;

  console.log(`  → Query Overpass untuk "${label}" (bbox: ${bboxStr.slice(0, 60)}...)`);
  const data = await fetchOverpass(query);

  const nodeCoords = new Map<number, GeoPoint>();
  const graph = new Map<number, number[]>();

  for (const el of data.elements) {
    if (el.type === 'node') {
      nodeCoords.set(el.id, { lat: el.lat, lng: el.lon });
    }
  }

  for (const el of data.elements) {
    if (el.type === 'way') {
      for (let i = 0; i < el.nodes.length - 1; i++) {
        const a = el.nodes[i];
        const b = el.nodes[i + 1];
        // Graf tidak berarah (rel bisa dilalui dua arah)
        if (!graph.has(a)) graph.set(a, []);
        if (!graph.has(b)) graph.set(b, []);
        graph.get(a)!.push(b);
        graph.get(b)!.push(a);
      }
    }
  }

  if (nodeCoords.size === 0) {
    console.warn(`  [warn] Tidak ada node rel ditemukan untuk "${label}"`);
    return null;
  }

  const fromNodeId = nearestNode(nodeCoords, from);
  const toNodeId = nearestNode(nodeCoords, to);

  if (!fromNodeId || !toNodeId) {
    console.warn(`  [warn] Tidak bisa menemukan node terdekat untuk "${label}"`);
    return null;
  }

  const fromNode = nodeCoords.get(fromNodeId)!;
  const toNode = nodeCoords.get(toNodeId)!;
  const distFromA = haversineMeters(from, fromNode);
  const distFromB = haversineMeters(to, toNode);
  console.log(
    `  → Node terdekat: from=${fromNodeId} (${distFromA.toFixed(0)}m), to=${toNodeId} (${distFromB.toFixed(0)}m)`
  );

  // Warn bila node terdekat terlalu jauh dari stasiun (>500m = mungkin rel salah)
  if (distFromA > 500) {
    console.warn(`  [warn] Node "from" terlalu jauh dari stasiun: ${distFromA.toFixed(0)}m`);
  }
  if (distFromB > 500) {
    console.warn(`  [warn] Node "to" terlalu jauh dari stasiun: ${distFromB.toFixed(0)}m`);
  }

  const path = bfsPath(graph, nodeCoords, fromNodeId, toNodeId);
  if (!path) {
    console.warn(`  [warn] Tidak ada jalur BFS antara node untuk "${label}"`);
    return null;
  }

  console.log(`  ✓ Geometri ditemukan: ${path.length} titik untuk "${label}"`);
  return path;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  console.log('🛤️  Pre-compute Rail Geometry (Overpass API)');
  console.log(`   Mode: ${dryRun ? 'DRY-RUN' : force ? 'FORCE (timpa semua)' : 'NORMAL (isi yang null)'}`);
  console.log('');

  // Ambil semua rute kereta aktif beserta stop-nya
  const keretaRutes = await prisma.rute.findMany({
    where: {
      isActive: true,
      moda: {
        OR: [
          { tipeModa: 'COMMUTER_TRAIN' },
          { tipeModa: 'KERETA' },
          { namaModa: { contains: 'kereta', mode: 'insensitive' } },
          { namaModa: { contains: 'krl', mode: 'insensitive' } },
          { namaModa: { contains: 'commuter', mode: 'insensitive' } },
        ],
      },
    },
    include: {
      moda: true,
      stops: {
        orderBy: { urutan: 'asc' },
        include: { halte: true },
      },
    },
  });

  if (keretaRutes.length === 0) {
    console.log('ℹ️  Tidak ada rute kereta aktif ditemukan.');
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 Ditemukan ${keretaRutes.length} rute kereta:`);
  for (const r of keretaRutes) {
    console.log(`   - [${r.kodeRute ?? r.id}] ${r.namaRute} (${r.stops.length} stops)`);
  }
  console.log('');

  let totalSegments = 0;
  let skipped = 0;
  let filled = 0;
  let failed = 0;

  for (const rute of keretaRutes) {
    console.log(`\n▶ Rute: ${rute.namaRute} (${rute.kodeRute ?? rute.id})`);

    const stops = rute.stops;

    for (let i = 0; i < stops.length - 1; i++) {
      const stopA = stops[i];
      const stopB = stops[i + 1];

      const label = `${stopA.halte.namaHalte} → ${stopB.halte.namaHalte}`;
      totalSegments++;

      // Skip jika sudah ada geometri dan bukan mode force
      if (!force && stopA.geometri !== null) {
        console.log(`  [skip] "${label}" — sudah punya geometri`);
        skipped++;
        continue;
      }

      console.log(`  [compute] "${label}"`);

      try {
        const from: GeoPoint = { lat: stopA.halte.latitude, lng: stopA.halte.longitude };
        const to: GeoPoint = { lat: stopB.halte.latitude, lng: stopB.halte.longitude };

        const geometry = await fetchRailGeometry(from, to, label);

        if (geometry === null) {
          console.warn(`  [fail] Tidak bisa mendapat geometri untuk "${label}"`);
          failed++;
        } else if (dryRun) {
          console.log(`  [dry-run] Akan menyimpan ${geometry.length} titik untuk "${label}"`);
          filled++;
        } else {
          await prisma.ruteStop.update({
            where: { id: stopA.id },
            data: { geometri: geometry },
          });
          console.log(`  ✅ Disimpan: ${geometry.length} titik → RuteStop.id=${stopA.id}`);
          filled++;
        }

        // Jeda antar request Overpass
        await new Promise((res) => setTimeout(res, REQUEST_DELAY_MS));
      } catch (err) {
        console.error(`  [error] "${label}": ${(err as Error).message}`);
        failed++;
      }
    }
  }

  console.log('\n──────────────────────────────────────');
  console.log('📊 Ringkasan pre-compute:');
  console.log(`   Total segmen   : ${totalSegments}`);
  console.log(`   Dilewati       : ${skipped} (sudah ada)`);
  console.log(`   Diisi          : ${filled}${dryRun ? ' (dry-run, tidak disimpan)' : ''}`);
  console.log(`   Gagal          : ${failed}`);
  console.log('──────────────────────────────────────');

  if (failed > 0) {
    console.log('\n⚠️  Beberapa segmen gagal. Jalankan ulang script untuk mencoba lagi.');
    console.log('   Segmen yang gagal akan diisi dengan null → fallback ke OSRM saat routing.');
  } else if (filled > 0) {
    console.log('\n✅ Semua segmen berhasil diisi. Restart backend agar cache jaringan diperbaharui.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Script gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
