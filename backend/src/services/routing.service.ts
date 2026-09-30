import { prisma } from '../config/db';
import { ROUTING_CONFIG } from '../config/routing.config';
import { GeometryService } from './geometry.service';
import { getRoutingNetwork } from './routing-network';
import { buildRouteCandidates, InternalSegment, RouteCandidate } from './route-candidates';
import { pruneAndRank, ScoredRoute } from './route-scoring';
import { applyRouteTimeline, parseClock, currentClockMinutes } from './route-timeline';
import {
  RoutingSearchRequestDTO,
  RoutingSearchResponseData,
  RoutingGeometryRequestDTO,
  RoutingGeometryResponseData,
  RouteLeg,
  RouteRecommendation,
  RouteSegment,
  SegmentType,
  LocationPoint,
} from '../types/routing.types';

/**
 * Orkestrator mesin rekomendasi rute multimodal (BUS, KERETA, OJEK).
 *
 * Alur: load jaringan (cache) -> generate kandidat (murni matematika)
 * -> pruning/ranking -> mapping ke kontrak response (legs + segmen aditif)
 * -> penyusulan geometri OSRM hanya untuk hasil final (berbudget, fallback
 * garis lurus) supaya respons tetap cepat (<2 dtk).
 */

const stripInternalSegment = ({
  passedStops: _passedStops,
  moda: _moda,
  rute: _rute,
  ruteId: _ruteId,
  ...publicFields
}: InternalSegment): RouteSegment => publicFields;

function buildLegs(
  route: RouteCandidate,
  destination: LocationPoint
): RouteLeg[] {
  const total = route.segments.length;

  return route.segments.map((segment, index) => {
    const isLast = index === total - 1;
    // "Kendaraan pertama" = tidak ada kendaraan sebelum segmen ini
    // (segmen jalan kaki/akses tidak dihitung sebagai perpindahan).
    const isFirstVehicle = route.segments
      .slice(0, index)
      .every((previous) => previous.type === 'WALK');
    const from = {
      id: segment.from.id,
      name: segment.from.name,
      lat: segment.from.lat,
      lng: segment.from.lng,
    };
    const to = {
      id: segment.to.id,
      name: segment.to.name,
      lat: segment.to.lat,
      lng: segment.to.lng,
    };

    if (segment.type === 'WALK') {
      const instruction = isLast
        ? `Jalan kaki ke titik tujuan (${destination.name})`
        : `Jalan kaki ke ${segment.to.name}`;
      return {
        step: index + 1,
        legType: 'WALK' as const,
        instruction,
        distanceMeters: segment.distanceMeters,
        durationMinutes: segment.durationMinutes,
        fare: 0,
        from: { name: segment.from.name, lat: segment.from.lat, lng: segment.from.lng },
        to: { name: segment.to.name, lat: segment.to.lat, lng: segment.to.lng },
      };
    }

    const isOjek = segment.type === 'OJEK';
    const modaInfo = segment.moda
      ? {
          id: segment.moda.id,
          nama: segment.moda.namaModa,
          tipe: segment.moda.tipeModa,
          ikon: segment.moda.ikon,
        }
      : undefined;

    let instruction: string;
    if (isOjek) {
      instruction = `Naik ojek ke ${segment.to.name}`;
    } else {
      const label = `${modaInfo?.nama ?? 'Moda'} ${segment.namaRute ?? ''}`.trim();
      instruction = isFirstVehicle ? `Naik ${label}` : `Pindah ke ${label}`;
    }

    const leg: RouteLeg = {
      step: index + 1,
      legType: 'TRANSIT',
      instruction,
      distanceMeters: segment.distanceMeters,
      durationMinutes: segment.durationMinutes,
      fare: segment.cost,
      from,
      to,
    };

    if (modaInfo) leg.moda = modaInfo;
    if (segment.rute) leg.rute = segment.rute;
    if (segment.from.id !== undefined) {
      leg.fromHalte = {
        id: segment.from.id,
        name: segment.from.name,
        lat: segment.from.lat,
        lng: segment.from.lng,
      };
    }
    if (segment.to.id !== undefined) {
      leg.toHalte = {
        id: segment.to.id,
        name: segment.to.name,
        lat: segment.to.lat,
        lng: segment.to.lng,
      };
    }
    if (segment.passedStops) {
      leg.passedStopsCount = segment.passedStops.length;
      leg.passedStops = segment.passedStops.map((stop) => ({
        id: stop.halte.id,
        namaHalte: stop.halte.nama,
        urutan: stop.urutan,
        latitude: stop.halte.lat,
        longitude: stop.halte.lng,
      }));
    }

    return leg;
  });
}

function toRouteRecommendation(
  route: ScoredRoute,
  origin: LocationPoint,
  destination: LocationPoint
): RouteRecommendation {
  const vehicleSegments = route.segments.filter((segment) => segment.type !== 'WALK');
  const modes: SegmentType[] = [];
  for (const segment of route.segments) {
    if (!modes.includes(segment.type)) modes.push(segment.type);
  }

  return {
    id: route.id,
    type: route.transfersCount === 0 ? 'DIRECT' : 'TRANSIT',
    summary: {
      totalDurationMinutes: route.totalDurationMinutes,
      totalDistanceMeters: route.totalDistanceMeters,
      totalFare: route.totalCost,
      transfersCount: route.transfersCount,
      departureHalte:
        vehicleSegments.length > 0 ? vehicleSegments[0].from.name : origin.name,
      arrivalHalte: vehicleSegments.length > 0
        ? vehicleSegments[vehicleSegments.length - 1].to.name
        : destination.name,
    },
    legs: buildLegs(route, destination),
    totalCost: route.totalCost,
    totalDurationMinutes: route.totalDurationMinutes,
    transfersCount: route.transfersCount,
    tags: route.tags,
    modes,
    segments: route.segments.map(stripInternalSegment),
    category: route.category,
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: () => T
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback());
      }
    }, timeoutMs);

    promise.then(
      (value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback());
        }
      }
    );
  });
}

const straightGeometry = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): [number, number][] => [
  [a.lat, a.lng],
  [b.lat, b.lng],
];

/** Susul geometri OSRM untuk satu rute final (berbudget, tidak pernah melempar). */
async function enrichRouteGeometry(route: RouteRecommendation, budgetMs: number): Promise<void> {
  await Promise.all(
    route.legs.map(async (leg) => {
      const endpoints = [
        { lat: leg.from.lat, lng: leg.from.lng },
        { lat: leg.to.lat, lng: leg.to.lng },
      ];

      if (leg.legType === 'WALK') {
        const detail = await withTimeout(
          GeometryService.getWalkRouteDetails(endpoints, leg.instruction),
          budgetMs,
          () => ({
            geometry: straightGeometry(endpoints[0], endpoints[1]),
            steps: [leg.instruction],
          })
        );
        leg.geometry = detail.geometry;
        leg.steps = detail.steps;
        return;
      }

      const points =
        leg.passedStops && leg.passedStops.length >= 2
          ? leg.passedStops.map((stop) => ({ lat: stop.latitude, lng: stop.longitude }))
          : endpoints;

      leg.geometry = await withTimeout(
        GeometryService.getRouteGeometry(points, 'driving'),
        budgetMs,
        () => points.map((point) => [point.lat, point.lng] as [number, number])
      );
    })
  );
}

export class RoutingService {
  /**
   * Pencarian rekomendasi rute multimodal (BUS, KERETA, OJEK).
   * Kontrak lama (summary/legs) dipertahankan; field baru bersifat aditif.
   */
  static async searchRoutes(
    request: RoutingSearchRequestDTO,
    userId?: number
  ): Promise<RoutingSearchResponseData> {
    const startedAt = Date.now();
    const { origin, destination, preferences = {} } = request;
    const maxWalkingDistance =
      preferences.maxWalkingDistance || ROUTING_CONFIG.defaultWalkingDistanceMeters;
    const allowedModa =
      preferences.allowedModa && preferences.allowedModa.length > 0
        ? preferences.allowedModa
        : undefined;
    const sortBy = preferences.sortBy || 'RECOMMENDED';

    // 1. Jaringan (halte/rute/tarif) dari cache memori
    const network = await getRoutingNetwork(allowedModa);

    // 2. Generate kandidat (OJEK_LANGSUNG + transit round 0/1/2 + akses ojek)
    const { candidates, notices } = buildRouteCandidates({
      origin,
      destination,
      maxWalkingDistanceMeters: maxWalkingDistance,
      network,
    });

    // 3. Pruning (dedupe/dominasi/keberagaman) + ranking sesuai sortBy
    const ranked = pruneAndRank(candidates, sortBy);

    // ID akhir dirapikan sesuai urutan hasil (route-1 = rekomendasi teratas)
    ranked.forEach((route, index) => {
      route.id = `route-${index + 1}`;
    });

    // 4. Mapping ke kontrak response
    const routes = ranked.map((route) => toRouteRecommendation(route, origin, destination));

    // 4b. Jam perkiraan berangkat/tiba per leg + per halte (aditif).
    //     Default = saat ini; request boleh memaksa jam lewat departureTime.
    const startMinutes =
      request.departureTime !== undefined
        ? parseClock(request.departureTime) ?? currentClockMinutes()
        : currentClockMinutes();
    routes.forEach((route) => {
      const timeline = applyRouteTimeline(route.legs, startMinutes);
      route.summary.departureTime = timeline.departureTime;
      route.summary.arrivalTime = timeline.arrivalTime;
    });

    // 5. Susul geometri OSRM hanya untuk hasil final (paralel + budget timeout)
    await Promise.all(
      routes.map((route) => enrichRouteGeometry(route, ROUTING_CONFIG.geometryBudgetMs))
    );

    const processingMs = Date.now() - startedAt;
    console.log(
      `[routing] selesai dalam ${processingMs}ms — kandidat=${candidates.length} hasil=${routes.length} sortBy=${sortBy}`
    );

    // 6. Simpan riwayat pencarian jika ada user id (gagal tidak membatalkan respons)
    if (userId) {
      try {
        const top = ranked.length > 0 ? ranked[0] : null;
        await prisma.searchHistory.create({
          data: {
            userId,
            originName: origin.name,
            originLat: origin.lat,
            originLng: origin.lng,
            destName: destination.name,
            destLat: destination.lat,
            destLng: destination.lng,
            selectedRuteId: top && top.rideRuteIds.length > 0 ? top.rideRuteIds[0] : null,
          },
        });
      } catch (err) {
        console.error('Failed to record search history:', err);
      }
    }

    return {
      origin,
      destination,
      totalRoutesFound: routes.length,
      routes,
      meta: {
        notices: Array.from(new Set(notices)),
        processingMs,
      },
    };
  }

  /**
   * Susulan geometri OSRM untuk leg-leg tertentu (endpoint aditif
   * POST /api/routing/geometry). Dipakai halaman detail FE saat ada leg
   * yang jatuh ke fallback garis lurus (stale-while-revalidate).
   * Tidak pernah melempar kecuali error tak terduga dari service.
   */
  static async getLegGeometry(
    request: RoutingGeometryRequestDTO
  ): Promise<RoutingGeometryResponseData> {
    const budgetMs = ROUTING_CONFIG.geometryBudgetMs;

    const legs = await Promise.all(
      request.legs.map(async (leg, index) => {
        const step = leg.step ?? index + 1;
        const endpoints = [
          { lat: leg.from.lat, lng: leg.from.lng },
          { lat: leg.to.lat, lng: leg.to.lng },
        ];

        if (leg.legType === 'WALK') {
          const detail = await withTimeout(
            GeometryService.getWalkRouteDetails(endpoints, leg.instruction),
            budgetMs,
            () => ({
              geometry: straightGeometry(endpoints[0], endpoints[1]),
              steps: leg.instruction ? [leg.instruction] : ['Jalan kaki menuju lokasi'],
            })
          );
          return { step, geometry: detail.geometry, steps: detail.steps };
        }

        const points =
          leg.passedStops && leg.passedStops.length >= 2 ? leg.passedStops : endpoints;
        const geometry = await withTimeout(
          GeometryService.getRouteGeometry(points, 'driving'),
          budgetMs,
          () => points.map((point) => [point.lat, point.lng] as [number, number])
        );
        return { step, geometry };
      })
    );

    return { legs };
  }

  /**
   * Mengambil riwayat pencarian user
   */
  static async getUserHistory(userId: number) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Menghapus riwayat pencarian user
   */
  static async deleteUserHistory(userId: number, historyId: number) {
    const history = await prisma.searchHistory.findFirst({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new Error('Riwayat pencarian tidak ditemukan');
    }

    return prisma.searchHistory.delete({
      where: { id: historyId },
    });
  }
}
