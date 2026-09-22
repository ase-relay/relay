import { prisma } from '../config/db';
import {
  HalteFilter,
  NearbyHalteQuery,
  CreateHalteDTO,
  UpdateHalteDTO,
} from '../types/transport.types';

/**
 * Menghitung jarak antar 2 koordinat (lat, lng) menggunakan Formula Haversine.
 * Mengembalikan jarak dalam satuan meter.
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Radius bumi dalam satuan meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Pembulatan jarak dalam meter
};

export class HalteService {
  /**
   * Mengambil semua halte dengan opsi filter pencarian, kota, dan status transit
   */
  static async getAll(filter: HalteFilter = {}) {
    const where: any = {};

    if (filter.search) {
      where.OR = [
        { namaHalte: { contains: filter.search, mode: 'insensitive' } },
        { alamat: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.kota) {
      where.kota = { equals: filter.kota, mode: 'insensitive' };
    }

    if (filter.isTransit !== undefined) {
      where.isTransit = filter.isTransit;
    }

    return prisma.halte.findMany({
      where,
      orderBy: { namaHalte: 'asc' },
      include: {
        _count: {
          select: { ruteStops: true },
        },
      },
    });
  }

  /**
   * Mengambil detail halte berdasarkan ID beserta rute-rute yang melewatinya
   */
  static async getById(id: number) {
    const halte = await prisma.halte.findUnique({
      where: { id },
      include: {
        ruteStops: {
          orderBy: { urutan: 'asc' },
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

    if (!halte) {
      throw new Error('Halte tidak ditemukan');
    }

    return halte;
  }

  /**
   * Mencari halte terdekat berdasarkan koordinat GPS (lat, lng) menggunakan Haversine Formula
   */
  static async getNearby(query: NearbyHalteQuery) {
    const { lat, lng, radius = 2000 } = query; // default radius 2km (2000m)

    // Ambil seluruh halte untuk filtering spasial
    const allHalte = await prisma.halte.findMany({
      include: {
        ruteStops: {
          include: {
            rute: {
              include: { moda: true },
            },
          },
        },
      },
    });

    const nearby = allHalte
      .map((halte) => {
        const distanceMeter = calculateHaversineDistance(lat, lng, halte.latitude, halte.longitude);
        return {
          ...halte,
          distanceMeter,
        };
      })
      .filter((h) => h.distanceMeter <= radius)
      .sort((a, b) => a.distanceMeter - b.distanceMeter);

    return nearby;
  }

  /**
   * Menambahkan data halte baru
   */
  static async create(data: CreateHalteDTO) {
    return prisma.halte.create({
      data: {
        namaHalte: data.namaHalte,
        latitude: data.latitude,
        longitude: data.longitude,
        alamat: data.alamat,
        kota: data.kota || 'Bandung',
        isTransit: data.isTransit || false,
      },
    });
  }

  /**
   * Mengubah data halte
   */
  static async update(id: number, data: UpdateHalteDTO) {
    await this.getById(id);

    return prisma.halte.update({
      where: { id },
      data,
    });
  }

  /**
   * Menghapus halte
   */
  static async delete(id: number) {
    await this.getById(id);

    return prisma.halte.delete({
      where: { id },
    });
  }
}
