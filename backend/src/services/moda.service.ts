import { prisma } from '../config/db';
import { invalidateRoutingNetworkCache } from './routing-network';

/** Ikon otomatis per tipe moda (ditentukan server, tidak diterima dari klien). */
export const MODA_IKON: Record<string, string> = {
  BUS: 'bus',
  KERETA: 'train',
  OJEK_ONLINE: 'motorcycle',
};

export class ModaService {
  static async getAll() {
    return prisma.modaTransportasi.findMany({
      include: {
        _count: {
          select: { rutes: true },
        },
      },
      orderBy: { namaModa: 'asc' },
    });
  }

  static async getById(id: number) {
    const moda = await prisma.modaTransportasi.findUnique({
      where: { id },
      include: {
        rutes: {
          include: {
            stops: {
              include: { halte: true },
              orderBy: { urutan: 'asc' },
            },
          },
        },
        tarif: true,
      },
    });

    if (!moda) {
      throw new Error('Moda tidak ditemukan');
    }

    return moda;
  }

  static async create(data: {
    namaModa: string;
    tipeModa: string;
    deskripsi?: string | null;
    rataRataKecepatanKmh?: number | null;
    isActive?: boolean;
  }) {
    const newModa = await prisma.$transaction(async (tx) => {
      const existing = await tx.modaTransportasi.findFirst({
        where: {
          namaModa: {
            equals: data.namaModa,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        throw new Error('Nama moda sudah ada (case-insensitive)');
      }

      const trimmedDeskripsi = data.deskripsi?.trim() ?? '';
      const newModa = await tx.modaTransportasi.create({
        data: {
          namaModa: data.namaModa,
          tipeModa: data.tipeModa,
          ikon: MODA_IKON[data.tipeModa],
          deskripsi: trimmedDeskripsi === '' ? null : trimmedDeskripsi,
          rataRataKecepatanKmh: data.rataRataKecepatanKmh ?? null,
          isActive: data.isActive ?? true,
        },
      });

      return newModa;
    });

    invalidateRoutingNetworkCache();
    return newModa;
  }

  static async update(
    id: number,
    data: {
      namaModa?: string;
      tipeModa?: string;
      deskripsi?: string | null;
      rataRataKecepatanKmh?: number | null;
      isActive?: boolean;
    }
  ) {
    await this.getById(id);

    const updated = await prisma.$transaction(async (tx) => {
      if (data.namaModa) {
        const existing = await tx.modaTransportasi.findFirst({
          where: {
            namaModa: {
              equals: data.namaModa,
              mode: 'insensitive',
            },
            id: { not: id },
          },
        });

        if (existing) {
          throw new Error('Nama moda sudah ada (case-insensitive)');
        }
      }

      const updated = await tx.modaTransportasi.update({
        where: { id },
        data: {
          ...(data.namaModa && { namaModa: data.namaModa }),
          ...(data.tipeModa !== undefined && { tipeModa: data.tipeModa, ikon: MODA_IKON[data.tipeModa] }),
          ...(data.deskripsi !== undefined && {
            deskripsi: data.deskripsi === null || data.deskripsi.trim() === '' ? null : data.deskripsi.trim(),
          }),
          ...(data.rataRataKecepatanKmh !== undefined && { rataRataKecepatanKmh: data.rataRataKecepatanKmh }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      return updated;
    });

    invalidateRoutingNetworkCache();
    return updated;
  }

  static async delete(id: number) {
    const moda = await this.getById(id);

    const ruteCount = await prisma.rute.count({
      where: { modaId: id },
    });

    const tarifCount = await prisma.tarif.count({
      where: { modaId: id },
    });

    if (ruteCount > 0 || tarifCount > 0) {
      throw new Error(
        `Moda masih dipakai oleh ${ruteCount} rute dan ${tarifCount} tarif. Nonaktifkan saja.`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.modaTransportasi.delete({
        where: { id },
      });
    });

    invalidateRoutingNetworkCache();
  }
}
