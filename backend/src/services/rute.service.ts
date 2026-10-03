import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import {
  RuteFilter,
  CreateRuteDTO,
  UpdateRuteDTO,
  StopInputDTO,
} from '../types/transport.types';
import { invalidateRoutingNetworkCache } from './routing-network';
import { HttpError } from '../utils/http-error';

export class RuteService {
  /**
   * Mengambil seluruh rute dengan opsi filter moda dan status aktif (admin)
   */
  static async getAll(filter: RuteFilter = {}) {
    const where: any = {};

    if (filter.search) {
      where.OR = [
        { namaRute: { contains: filter.search, mode: 'insensitive' } },
        { kodeRute: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.modaId) {
      where.modaId = Number(filter.modaId);
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    return prisma.rute.findMany({
      where,
      orderBy: { namaRute: 'asc' },
      include: {
        moda: true,
        _count: {
          select: { stops: true },
        },
      },
    });
  }

  /**
   * Mengambil detail satu rute beserta urutan stop (RuteStop) yang sudah diurutkan (ASC) (admin)
   */
  static async getById(id: number) {
    const rute = await prisma.rute.findUnique({
      where: { id },
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

    if (!rute) {
      throw new HttpError('Rute tidak ditemukan', 404);
    }

    return rute;
  }

  /**
   * Mengambil seluruh rute aktif dengan moda aktif (public)
   */
  static async getAllPublic(filter: RuteFilter = {}) {
    const where: any = {
      isActive: true,
      moda: {
        isActive: true,
      },
    };

    if (filter.search) {
      where.OR = [
        { namaRute: { contains: filter.search, mode: 'insensitive' } },
        { kodeRute: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.modaId) {
      where.modaId = Number(filter.modaId);
    }

    return prisma.rute.findMany({
      where,
      orderBy: { namaRute: 'asc' },
      include: {
        moda: true,
        _count: {
          select: { stops: true },
        },
      },
    });
  }

  /**
   * Mengambil detail rute aktif dengan moda aktif dan stops halte aktif (public)
   */
  static async getByIdPublic(id: number) {
    const rute = await prisma.rute.findUnique({
      where: { id },
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

    if (!rute) {
      throw new HttpError('Rute tidak ditemukan', 404);
    }

    if (!rute.isActive || !rute.moda.isActive) {
      throw new HttpError('Rute tidak ditemukan', 404);
    }

    // Filter stops hanya yang halte aktif
    const activeStops = rute.stops.filter((stop) => stop.halte.isActive);

    return {
      ...rute,
      stops: activeStops,
    };
  }

  /**
   * Fungsi internal untuk mengganti stop (dipakai create, update bila stops dikirim, dan PUT /:id/stops)
   */
  private static async replaceStops(ruteId: number, stops: StopInputDTO[], tx: Prisma.TransactionClient) {
    // Validasi halteId unik
    const halteIds = stops.map((s) => s.halteId);
    const uniqueHalteIds = new Set(halteIds);
    if (halteIds.length !== uniqueHalteIds.size) {
      throw new HttpError('HalteId tidak boleh duplikat dalam satu rute', 400);
    }

    // Validasi semua halteId ada di DB
    const existingHaltes = await tx.halte.findMany({
      where: { id: { in: halteIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingHaltes.map((h: { id: number }) => h.id));
    const missingIds = halteIds.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      throw new HttpError(`Halte dengan ID ${missingIds.join(', ')} tidak ditemukan`, 400);
    }

    // Validasi estimasiMenit dan jarakMeter untuk segmen non-terakhir:
    // null/undefined = hitung otomatis (disimpan null); bila terisi harus bulat > 0.
    // Dua field independen. Stop terakhir dipaksa 0/0 di bawah apa pun inputnya.
    for (let i = 0; i < stops.length - 1; i++) {
      const stop = stops[i];
      const menit = stop.estimasiMenit;
      if (menit !== undefined && menit !== null) {
        if (!Number.isInteger(menit) || menit <= 0) {
          throw new HttpError(`Segmen ${i + 1}: estimasiMenit harus bilangan bulat lebih besar dari 0`, 400);
        }
      }
      const meter = stop.jarakMeter;
      if (meter !== undefined && meter !== null) {
        if (!Number.isInteger(meter) || meter <= 0) {
          throw new HttpError(`Segmen ${i + 1}: jarakMeter harus bilangan bulat lebih besar dari 0`, 400);
        }
      }
    }

    // Hapus stop lama
    await tx.ruteStop.deleteMany({
      where: { ruteId },
    });

    // Masukkan stop baru dengan urutan dari posisi array (mulai 1)
    if (stops.length > 0) {
      await tx.ruteStop.createMany({
        data: stops.map((s, index) => ({
          ruteId,
          halteId: s.halteId,
          urutan: index + 1,
          estimasiMenit: index === stops.length - 1 ? 0 : (s.estimasiMenit ?? null),
          jarakMeter: index === stops.length - 1 ? 0 : (s.jarakMeter ?? null),
        })),
      });
    }
  }

  /**
   * Validasi modaId ada dan aktif
   */
  private static async validateModa(modaId: number, tx: Prisma.TransactionClient) {
    const moda = await tx.modaTransportasi.findUnique({
      where: { id: modaId },
      select: { id: true, isActive: true, namaModa: true },
    });

    if (!moda) {
      throw new HttpError('Moda tidak ditemukan', 404);
    }

    if (!moda.isActive) {
      throw new HttpError(`Moda ${moda.namaModa} sedang nonaktif. Aktifkan moda dulu.`, 409);
    }

    return moda;
  }

  /**
   * Membuat rute baru beserta inisialisasi stop jika disertakan
   */
  static async create(data: CreateRuteDTO) {
    const { stops, ...ruteData } = data;

    const result = await prisma.$transaction(async (tx) => {
      // Validasi moda
      await this.validateModa(Number(ruteData.modaId), tx);

      const newRute = await tx.rute.create({
        data: {
          namaRute: ruteData.namaRute,
          kodeRute: ruteData.kodeRute,
          deskripsi: ruteData.deskripsi,
          modaId: Number(ruteData.modaId),
          isActive: ruteData.isActive ?? true,
        },
      });

      if (stops && stops.length > 0) {
        await this.replaceStops(newRute.id, stops, tx);
      }

      return tx.rute.findUnique({
        where: { id: newRute.id },
        include: {
          moda: true,
          stops: {
            orderBy: { urutan: 'asc' },
            include: { halte: true },
          },
        },
      });
    });

    invalidateRoutingNetworkCache();
    return result;
  }

  /**
   * Update master data rute
   */
  static async update(id: number, data: UpdateRuteDTO) {
    const { stops, ...ruteData } = data;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rute.findUnique({
        where: { id },
        select: { id: true, modaId: true, isActive: true },
      });

      if (!existing) {
        throw new HttpError('Rute tidak ditemukan', 404);
      }

      // Tentukan moda tujuan untuk validasi aktivasi
      const targetModaId = ruteData.modaId ? Number(ruteData.modaId) : existing.modaId;

      // Validasi jika mengaktifkan rute - cek moda tujuan
      if (ruteData.isActive === true && existing.isActive === false) {
        const moda = await tx.modaTransportasi.findUnique({
          where: { id: targetModaId },
          select: { id: true, isActive: true, namaModa: true },
        });
        if (!moda) {
          throw new HttpError('Moda tidak ditemukan', 404);
        }
        if (!moda.isActive) {
          throw new HttpError(`Moda ${moda.namaModa} sedang nonaktif. Aktifkan moda dulu.`, 409);
        }
      }

      // Validasi moda jika diganti
      if (ruteData.modaId && ruteData.modaId !== existing.modaId) {
        await this.validateModa(Number(ruteData.modaId), tx);
      }

      // Update rute
      const updatedRute = await tx.rute.update({
        where: { id },
        data: {
          ...ruteData,
          modaId: ruteData.modaId ? Number(ruteData.modaId) : undefined,
        },
        include: {
          moda: true,
        },
      });

      // Update stops jika disertakan
      if (stops !== undefined) {
        if (stops.length < 2) {
          throw new HttpError('Minimal 2 halte pemberhentian', 400);
        }
        await this.replaceStops(id, stops, tx);
        return tx.rute.findUnique({
          where: { id },
          include: {
            moda: true,
            stops: {
              orderBy: { urutan: 'asc' },
              include: { halte: true },
            },
          },
        });
      }

      return updatedRute;
    });

    invalidateRoutingNetworkCache();
    return result;
  }

  /**
   * Sinkronisasi / Update daftar pemberhentian (RuteStop) dalam satu rute
   */
  static async updateStops(ruteId: number, stops: StopInputDTO[]) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rute.findUnique({
        where: { id: ruteId },
        select: { id: true },
      });

      if (!existing) {
        throw new HttpError('Rute tidak ditemukan', 404);
      }

      await this.replaceStops(ruteId, stops, tx);

      return tx.rute.findUnique({
        where: { id: ruteId },
        include: {
          moda: true,
          stops: {
            orderBy: { urutan: 'asc' },
            include: { halte: true },
          },
        },
      });
    });

    invalidateRoutingNetworkCache();
    return result;
  }

  /**
   * Menghapus rute
   */
  static async delete(id: number) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rute.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new HttpError('Rute tidak ditemukan', 404);
      }

      await tx.rute.delete({
        where: { id },
      });
    });

    invalidateRoutingNetworkCache();
  }
}
