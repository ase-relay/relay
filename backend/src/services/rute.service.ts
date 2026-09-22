import { prisma } from '../config/db';
import {
  RuteFilter,
  CreateRuteDTO,
  UpdateRuteDTO,
  StopInputDTO,
} from '../types/transport.types';

export class RuteService {
  /**
   * Mengambil seluruh rute dengan opsi filter moda dan status aktif
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
        tarifs: true,
        _count: {
          select: { stops: true },
        },
      },
    });
  }

  /**
   * Mengambil detail satu rute beserta urutan stop (RuteStop) yang sudah diurutkan (ASC)
   */
  static async getById(id: number) {
    const rute = await prisma.rute.findUnique({
      where: { id },
      include: {
        moda: true,
        tarifs: true,
        stops: {
          orderBy: { urutan: 'asc' },
          include: {
            halte: true,
          },
        },
      },
    });

    if (!rute) {
      throw new Error('Rute tidak ditemukan');
    }

    return rute;
  }

  /**
   * Membuat rute baru beserta inisialisasi stop jika disertakan
   */
  static async create(data: CreateRuteDTO) {
    const { stops, ...ruteData } = data;

    return prisma.$transaction(async (tx) => {
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
        await tx.ruteStop.createMany({
          data: stops.map((s) => ({
            ruteId: newRute.id,
            halteId: s.halteId,
            urutan: s.urutan,
            estimasiMenit: s.estimasiMenit,
            jarakMeter: s.jarakMeter,
          })),
        });
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
  }

  /**
   * Update master data rute
   */
  static async update(id: number, data: UpdateRuteDTO) {
    await this.getById(id);

    return prisma.rute.update({
      where: { id },
      data: {
        ...data,
        modaId: data.modaId ? Number(data.modaId) : undefined,
      },
      include: {
        moda: true,
      },
    });
  }

  /**
   * Sinkronisasi / Update daftar pemberhentian (RuteStop) dalam satu rute
   */
  static async updateStops(ruteId: number, stops: StopInputDTO[]) {
    await this.getById(ruteId);

    return prisma.$transaction(async (tx) => {
      // Hapus stop lama untuk rute ini
      await tx.ruteStop.deleteMany({
        where: { ruteId },
      });

      // Masukkan stop urutan baru
      if (stops.length > 0) {
        await tx.ruteStop.createMany({
          data: stops.map((s) => ({
            ruteId,
            halteId: s.halteId,
            urutan: s.urutan,
            estimasiMenit: s.estimasiMenit,
            jarakMeter: s.jarakMeter,
          })),
        });
      }

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
  }

  /**
   * Menghapus rute
   */
  static async delete(id: number) {
    await this.getById(id);

    return prisma.rute.delete({
      where: { id },
    });
  }
}
