import { prisma } from '../config/db';
import { calculateHaversineDistance } from './halte.service';
import { FareService } from './fare.service';
import {
  RoutingSearchRequestDTO,
  RoutingSearchResponseData,
  RouteOption,
  RouteLeg,
  PassedStopInfo,
} from '../types/routing.types';

// Kecepatan jalan kaki rata-rata: ~4.5 km/jam = 75 meter per menit
const WALKING_SPEED_METERS_PER_MINUTE = 75;
// Waktu tunggu / buffer transfer antar moda: 5 menit
const TRANSFER_BUFFER_MINUTES = 5;

export class RoutingService {
  /**
   * Menghitung durasi jalan kaki berdasarkan jarak (meter)
   */
  private static calculateWalkingMinutes(distanceMeters: number): number {
    return Math.max(1, Math.round(distanceMeters / WALKING_SPEED_METERS_PER_MINUTE));
  }

  /**
   * Menghitung total estimasi menit dan jarak antar stop rute
   */
  private static calculateLegTransitMetrics(stops: any[]): { duration: number; distance: number } {
    let totalMinutes = 0;
    let totalDistance = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const current = stops[i];
      const next = stops[i + 1];

      // Gunakan estimasiMenit / jarakMeter jika terdefinisi di DB
      if (current.estimasiMenit) {
        totalMinutes += current.estimasiMenit;
      } else {
        // Estimasi kasar transit darat: ~20 km/jam = ~3 menit per km
        const dist = calculateHaversineDistance(
          current.halte.latitude,
          current.halte.longitude,
          next.halte.latitude,
          next.halte.longitude
        );
        totalMinutes += Math.max(2, Math.round((dist / 1000) * 3));
      }

      if (current.jarakMeter) {
        totalDistance += current.jarakMeter;
      } else {
        totalDistance += calculateHaversineDistance(
          current.halte.latitude,
          current.halte.longitude,
          next.halte.latitude,
          next.halte.longitude
        );
      }
    }

    return {
      duration: Math.max(3, totalMinutes),
      distance: totalDistance,
    };
  }

  /**
   * Core routing search method: mencari rekomendasi rute direct dan 1-transit
   */
  static async searchRoutes(
    request: RoutingSearchRequestDTO,
    userId?: number
  ): Promise<RoutingSearchResponseData> {
    const { origin, destination, preferences = {} } = request;
    const maxWalkingDistance = preferences.maxWalkingDistance || 1500;
    const allowedModa = preferences.allowedModa && preferences.allowedModa.length > 0 ? preferences.allowedModa : undefined;
    const sortBy = preferences.sortBy || 'RECOMMENDED';

    // 1. Ambil semua halte untuk mencari halte terdekat dari origin & destination
    const allHalte = await prisma.halte.findMany({
      include: {
        ruteStops: {
          include: {
            rute: {
              include: {
                moda: true,
              },
            },
          },
        },
      },
    });

    // Cari halte dalam radius maxWalkingDistance dari origin
    const originCandidateHalte = allHalte
      .map((h) => ({
        halte: h,
        distance: calculateHaversineDistance(origin.lat, origin.lng, h.latitude, h.longitude),
      }))
      .filter((item) => item.distance <= maxWalkingDistance)
      .sort((a, b) => a.distance - b.distance);

    // Cari halte dalam radius maxWalkingDistance dari destination
    const destCandidateHalte = allHalte
      .map((h) => ({
        halte: h,
        distance: calculateHaversineDistance(destination.lat, destination.lng, h.latitude, h.longitude),
      }))
      .filter((item) => item.distance <= maxWalkingDistance)
      .sort((a, b) => a.distance - b.distance);

    // Ambil seluruh rute aktif dengan stops terurut
    const allRutes = await prisma.rute.findMany({
      where: {
        isActive: true,
        ...(allowedModa ? { modaId: { in: allowedModa } } : {}),
      },
      include: {
        moda: true,
        stops: {
          orderBy: { urutan: 'asc' },
          include: {
            halte: true,
          },
        },
      },
    });

    const routeOptions: RouteOption[] = [];
    const directRouteTracker = new Set<number>(); // ruteId yang sudah dipakai direct

    // ==========================================
    // 2. SEARCH DIRECT ROUTES (0 Transit)
    // ==========================================
    for (const orig of originCandidateHalte) {
      for (const dest of destCandidateHalte) {
        if (orig.halte.id === dest.halte.id) continue;

        for (const rute of allRutes) {
          const originStopIndex = rute.stops.findIndex((s) => s.halteId === orig.halte.id);
          const destStopIndex = rute.stops.findIndex((s) => s.halteId === dest.halte.id);

          // Validasi: Rute harus melewati kedua halte dan urutannya searah (origin duluan sebelum dest)
          if (originStopIndex !== -1 && destStopIndex !== -1 && originStopIndex < destStopIndex) {
            if (directRouteTracker.has(rute.id)) continue;
            directRouteTracker.add(rute.id);

            const passedStopsSlice = rute.stops.slice(originStopIndex, destStopIndex + 1);
            const transitMetrics = this.calculateLegTransitMetrics(passedStopsSlice);

            const walkOriginDist = orig.distance;
            const walkOriginDur = this.calculateWalkingMinutes(walkOriginDist);

            const walkDestDist = dest.distance;
            const walkDestDur = this.calculateWalkingMinutes(walkDestDist);

            const fare = await FareService.calculateFare({
              modaId: rute.modaId,
              ruteId: rute.id,
              distanceMeters: transitMetrics.distance,
              passedStopsCount: passedStopsSlice.length,
            });

            const passedStopsInfo: PassedStopInfo[] = passedStopsSlice.map((s) => ({
              id: s.halte.id,
              namaHalte: s.halte.namaHalte,
              urutan: s.urutan,
              latitude: s.halte.latitude,
              longitude: s.halte.longitude,
            }));

            const legs: RouteLeg[] = [
              {
                step: 1,
                legType: 'WALK',
                instruction: `Jalan kaki ke ${orig.halte.namaHalte}`,
                distanceMeters: walkOriginDist,
                durationMinutes: walkOriginDur,
                fare: 0,
                from: { name: origin.name, lat: origin.lat, lng: origin.lng },
                to: {
                  id: orig.halte.id,
                  name: orig.halte.namaHalte,
                  lat: orig.halte.latitude,
                  lng: orig.halte.longitude,
                },
              },
              {
                step: 2,
                legType: 'TRANSIT',
                instruction: `Naik ${rute.moda.namaModa} ${rute.namaRute}`,
                distanceMeters: transitMetrics.distance,
                durationMinutes: transitMetrics.duration,
                fare,
                moda: {
                  id: rute.moda.id,
                  nama: rute.moda.namaModa,
                  tipe: rute.moda.tipeModa,
                  ikon: rute.moda.ikon,
                },
                rute: {
                  id: rute.id,
                  kode: rute.kodeRute,
                  nama: rute.namaRute,
                },
                fromHalte: {
                  id: orig.halte.id,
                  name: orig.halte.namaHalte,
                  lat: orig.halte.latitude,
                  lng: orig.halte.longitude,
                },
                toHalte: {
                  id: dest.halte.id,
                  name: dest.halte.namaHalte,
                  lat: dest.halte.latitude,
                  lng: dest.halte.longitude,
                },
                passedStopsCount: passedStopsSlice.length,
                passedStops: passedStopsInfo,
                from: {
                  id: orig.halte.id,
                  name: orig.halte.namaHalte,
                  lat: orig.halte.latitude,
                  lng: orig.halte.longitude,
                },
                to: {
                  id: dest.halte.id,
                  name: dest.halte.namaHalte,
                  lat: dest.halte.latitude,
                  lng: dest.halte.longitude,
                },
              },
              {
                step: 3,
                legType: 'WALK',
                instruction: `Jalan kaki ke titik tujuan (${destination.name})`,
                distanceMeters: walkDestDist,
                durationMinutes: walkDestDur,
                fare: 0,
                from: {
                  id: dest.halte.id,
                  name: dest.halte.namaHalte,
                  lat: dest.halte.latitude,
                  lng: dest.halte.longitude,
                },
                to: { name: destination.name, lat: destination.lat, lng: destination.lng },
              },
            ];

            const totalDuration = walkOriginDur + transitMetrics.duration + walkDestDur;
            const totalDistance = walkOriginDist + transitMetrics.distance + walkDestDist;

            routeOptions.push({
              id: `route-direct-${rute.id}`,
              type: 'DIRECT',
              summary: {
                totalDurationMinutes: totalDuration,
                totalDistanceMeters: totalDistance,
                totalFare: fare,
                transfersCount: 0,
                departureHalte: orig.halte.namaHalte,
                arrivalHalte: dest.halte.namaHalte,
              },
              legs,
            });
          }
        }
      }
    }

    // ==========================================
    // 3. SEARCH TRANSIT ROUTES (1-Transit / 2 Legs)
    // ==========================================
    const transitCombinationTracker = new Set<string>();

    for (const orig of originCandidateHalte) {
      for (const dest of destCandidateHalte) {
        if (orig.halte.id === dest.halte.id) continue;

        // Ambil rute-rute yang melewati halte origin
        const rutesFromOrigin = allRutes.filter((r) =>
          r.stops.some((s) => s.halteId === orig.halte.id)
        );

        // Ambil rute-rute yang melewati halte destination
        const rutesToDest = allRutes.filter((r) =>
          r.stops.some((s) => s.halteId === dest.halte.id)
        );

        for (const rute1 of rutesFromOrigin) {
          const origIndex1 = rute1.stops.findIndex((s) => s.halteId === orig.halte.id);

          for (const rute2 of rutesToDest) {
            if (rute1.id === rute2.id) continue; // Jangan pakai rute yang sama untuk transit

            const destIndex2 = rute2.stops.findIndex((s) => s.halteId === dest.halte.id);

            // Cari Halte Transit (T) yang ada di rute1 (setelah origin) dan rute2 (sebelum destination)
            for (let i = origIndex1 + 1; i < rute1.stops.length; i++) {
              const transitStopRute1 = rute1.stops[i];
              const transitIndex2 = rute2.stops.findIndex(
                (s) => s.halteId === transitStopRute1.halteId
              );

              if (transitIndex2 !== -1 && transitIndex2 < destIndex2) {
                const combinationKey = `${rute1.id}-${transitStopRute1.halteId}-${rute2.id}`;
                if (transitCombinationTracker.has(combinationKey)) continue;
                transitCombinationTracker.add(combinationKey);

                const transitHalte = transitStopRute1.halte;

                // Hitung Leg 1 (Rute 1)
                const slice1 = rute1.stops.slice(origIndex1, i + 1);
                const metrics1 = this.calculateLegTransitMetrics(slice1);
                const fare1 = await FareService.calculateFare({
                  modaId: rute1.modaId,
                  ruteId: rute1.id,
                  distanceMeters: metrics1.distance,
                  passedStopsCount: slice1.length,
                });

                // Hitung Leg 2 (Rute 2)
                const slice2 = rute2.stops.slice(transitIndex2, destIndex2 + 1);
                const metrics2 = this.calculateLegTransitMetrics(slice2);
                const fare2 = await FareService.calculateFare({
                  modaId: rute2.modaId,
                  ruteId: rute2.id,
                  distanceMeters: metrics2.distance,
                  passedStopsCount: slice2.length,
                });

                const walkOriginDist = orig.distance;
                const walkOriginDur = this.calculateWalkingMinutes(walkOriginDist);

                const walkDestDist = dest.distance;
                const walkDestDur = this.calculateWalkingMinutes(walkDestDist);

                const legs: RouteLeg[] = [
                  {
                    step: 1,
                    legType: 'WALK',
                    instruction: `Jalan kaki ke ${orig.halte.namaHalte}`,
                    distanceMeters: walkOriginDist,
                    durationMinutes: walkOriginDur,
                    fare: 0,
                    from: { name: origin.name, lat: origin.lat, lng: origin.lng },
                    to: {
                      id: orig.halte.id,
                      name: orig.halte.namaHalte,
                      lat: orig.halte.latitude,
                      lng: orig.halte.longitude,
                    },
                  },
                  {
                    step: 2,
                    legType: 'TRANSIT',
                    instruction: `Naik ${rute1.moda.namaModa} ${rute1.namaRute} menuju ${transitHalte.namaHalte}`,
                    distanceMeters: metrics1.distance,
                    durationMinutes: metrics1.duration,
                    fare: fare1,
                    moda: {
                      id: rute1.moda.id,
                      nama: rute1.moda.namaModa,
                      tipe: rute1.moda.tipeModa,
                      ikon: rute1.moda.ikon,
                    },
                    rute: {
                      id: rute1.id,
                      kode: rute1.kodeRute,
                      nama: rute1.namaRute,
                    },
                    fromHalte: {
                      id: orig.halte.id,
                      name: orig.halte.namaHalte,
                      lat: orig.halte.latitude,
                      lng: orig.halte.longitude,
                    },
                    toHalte: {
                      id: transitHalte.id,
                      name: transitHalte.namaHalte,
                      lat: transitHalte.latitude,
                      lng: transitHalte.longitude,
                    },
                    passedStopsCount: slice1.length,
                    passedStops: slice1.map((s) => ({
                      id: s.halte.id,
                      namaHalte: s.halte.namaHalte,
                      urutan: s.urutan,
                      latitude: s.halte.latitude,
                      longitude: s.halte.longitude,
                    })),
                    from: {
                      id: orig.halte.id,
                      name: orig.halte.namaHalte,
                      lat: orig.halte.latitude,
                      lng: orig.halte.longitude,
                    },
                    to: {
                      id: transitHalte.id,
                      name: transitHalte.namaHalte,
                      lat: transitHalte.latitude,
                      lng: transitHalte.longitude,
                    },
                  },
                  {
                    step: 3,
                    legType: 'WALK',
                    instruction: `Transit di ${transitHalte.namaHalte}`,
                    distanceMeters: 30,
                    durationMinutes: TRANSFER_BUFFER_MINUTES,
                    fare: 0,
                    from: {
                      id: transitHalte.id,
                      name: transitHalte.namaHalte,
                      lat: transitHalte.latitude,
                      lng: transitHalte.longitude,
                    },
                    to: {
                      id: transitHalte.id,
                      name: transitHalte.namaHalte,
                      lat: transitHalte.latitude,
                      lng: transitHalte.longitude,
                    },
                  },
                  {
                    step: 4,
                    legType: 'TRANSIT',
                    instruction: `Transfer naik ${rute2.moda.namaModa} ${rute2.namaRute} ke ${dest.halte.namaHalte}`,
                    distanceMeters: metrics2.distance,
                    durationMinutes: metrics2.duration,
                    fare: fare2,
                    moda: {
                      id: rute2.moda.id,
                      nama: rute2.moda.namaModa,
                      tipe: rute2.moda.tipeModa,
                      ikon: rute2.moda.ikon,
                    },
                    rute: {
                      id: rute2.id,
                      kode: rute2.kodeRute,
                      nama: rute2.namaRute,
                    },
                    fromHalte: {
                      id: transitHalte.id,
                      name: transitHalte.namaHalte,
                      lat: transitHalte.latitude,
                      lng: transitHalte.longitude,
                    },
                    toHalte: {
                      id: dest.halte.id,
                      name: dest.halte.namaHalte,
                      lat: dest.halte.latitude,
                      lng: dest.halte.longitude,
                    },
                    passedStopsCount: slice2.length,
                    passedStops: slice2.map((s) => ({
                      id: s.halte.id,
                      namaHalte: s.halte.namaHalte,
                      urutan: s.urutan,
                      latitude: s.halte.latitude,
                      longitude: s.halte.longitude,
                    })),
                    from: {
                      id: transitHalte.id,
                      name: transitHalte.namaHalte,
                      lat: transitHalte.latitude,
                      lng: transitHalte.longitude,
                    },
                    to: {
                      id: dest.halte.id,
                      name: dest.halte.namaHalte,
                      lat: dest.halte.latitude,
                      lng: dest.halte.longitude,
                    },
                  },
                  {
                    step: 5,
                    legType: 'WALK',
                    instruction: `Jalan kaki ke titik tujuan (${destination.name})`,
                    distanceMeters: walkDestDist,
                    durationMinutes: walkDestDur,
                    fare: 0,
                    from: {
                      id: dest.halte.id,
                      name: dest.halte.namaHalte,
                      lat: dest.halte.latitude,
                      lng: dest.halte.longitude,
                    },
                    to: { name: destination.name, lat: destination.lat, lng: destination.lng },
                  },
                ];

                const totalDuration =
                  walkOriginDur + metrics1.duration + TRANSFER_BUFFER_MINUTES + metrics2.duration + walkDestDur;
                const totalDistance = walkOriginDist + metrics1.distance + 30 + metrics2.distance + walkDestDist;
                const totalFare = fare1 + fare2;

                routeOptions.push({
                  id: `route-transit-${rute1.id}-${transitHalte.id}-${rute2.id}`,
                  type: 'TRANSIT',
                  summary: {
                    totalDurationMinutes: totalDuration,
                    totalDistanceMeters: totalDistance,
                    totalFare,
                    transfersCount: 1,
                    departureHalte: orig.halte.namaHalte,
                    arrivalHalte: dest.halte.namaHalte,
                  },
                  legs,
                });
              }
            }
          }
        }
      }
    }

    // ==========================================
    // 4. SORTING SESUAI PREFERENSI
    // ==========================================
    switch (sortBy) {
      case 'FASTEST':
        routeOptions.sort((a, b) => a.summary.totalDurationMinutes - b.summary.totalDurationMinutes);
        break;
      case 'CHEAPEST':
        routeOptions.sort((a, b) => a.summary.totalFare - b.summary.totalFare);
        break;
      case 'LEAST_TRANSFERS':
        routeOptions.sort((a, b) => a.summary.transfersCount - b.summary.transfersCount);
        break;
      case 'RECOMMENDED':
      default:
        // Bobot: Utamakan direct route lebih dulu, baru durasi tercepat
        routeOptions.sort((a, b) => {
          if (a.summary.transfersCount !== b.summary.transfersCount) {
            return a.summary.transfersCount - b.summary.transfersCount;
          }
          return a.summary.totalDurationMinutes - b.summary.totalDurationMinutes;
        });
        break;
    }

    // ==========================================
    // 5. SIMPAN RIWAYAT PENCARIAN JIKA ADA USER ID
    // ==========================================
    if (userId) {
      try {
        await prisma.searchHistory.create({
          data: {
            userId,
            originName: origin.name,
            originLat: origin.lat,
            originLng: origin.lng,
            destName: destination.name,
            destLat: destination.lat,
            destLng: destination.lng,
            selectedRuteId: routeOptions.length > 0 ? (routeOptions[0].type === 'DIRECT' ? parseInt(routeOptions[0].id.replace('route-direct-', '')) : null) : null,
          },
        });
      } catch (err) {
        // Jangan gagalkan response routing jika create history ada issue
        console.error('Failed to record search history:', err);
      }
    }

    return {
      origin,
      destination,
      totalRoutesFound: routeOptions.length,
      routes: routeOptions,
    };
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
