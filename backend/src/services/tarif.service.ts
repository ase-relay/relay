import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { invalidateRoutingNetworkCache } from './routing-network';
import { HttpError } from '../utils/http-error';

export type TarifTipeInput = 'FLAT' | 'PER_KM';

export interface CreateTarifDTO {
  modaId: number;
  tipeTarif: TarifTipeInput;
  nominalDasar: number;
  nominalPerKm?: number | null;
  jarakMinimumKm?: number | null;
  biayaLayanan?: number;
  keterangan?: string;
}

export interface UpdateTarifDTO {
  modaId?: number;
  tipeTarif?: TarifTipeInput;
  nominalDasar?: number;
  nominalPerKm?: number | null;
  jarakMinimumKm?: number | null;
  biayaLayanan?: number;
  keterangan?: string | null;
}

const modaInclude = {
  moda: {
    select: {
      id: true,
      namaModa: true,
      isActive: true,
    },
  },
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateNominalDasar(value: unknown): void {
  if (!isFiniteNumber(value) || value <= 0) {
    throw new HttpError('Nominal dasar harus lebih besar dari 0', 400);
  }
}

function validateNominalPerKm(value: unknown): void {
  if (!isFiniteNumber(value) || value <= 0) {
    throw new HttpError('Nominal per km harus lebih besar dari 0', 400);
  }
}

function validateJarakMinimumKm(value: unknown): void {
  if (value === undefined || value === null) return;
  if (!isFiniteNumber(value) || value < 0) {
    throw new HttpError('Jarak minimum tidak boleh negatif', 400);
  }
}

function validateBiayaLayanan(value: unknown): void {
  if (value === undefined) return;
  if (!isFiniteNumber(value) || value < 0) {
    throw new HttpError('Biaya layanan tidak boleh negatif', 400);
  }
}

export class TarifService {
  /**
   * Mengambil seluruh tarif beserta moda pemiliknya (admin)
   */
  static async getAll() {
    return prisma.tarif.findMany({
      orderBy: { modaId: 'asc' },
      include: modaInclude,
    });
  }

  /**
   * Mengambil detail satu tarif (admin)
   */
  static async getById(id: number) {
    const tarif = await prisma.tarif.findUnique({
      where: { id },
      include: modaInclude,
    });

    if (!tarif) {
      throw new HttpError('Tarif tidak ditemukan', 404);
    }

    return tarif;
  }

  /**
   * Validasi modaId ada dan aktif
   */
  private static async validateModa(modaId: number) {
    const moda = await prisma.modaTransportasi.findUnique({
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
   * Membuat tarif baru untuk satu moda (satu moda satu tarif)
   */
  static async create(data: CreateTarifDTO) {
    await this.validateModa(Number(data.modaId));

    const existing = await prisma.tarif.findUnique({
      where: { modaId: Number(data.modaId) },
    });
    if (existing) {
      throw new HttpError('Moda sudah punya tarif, ubah tarif yang ada', 409);
    }

    validateNominalDasar(data.nominalDasar);
    if (data.tipeTarif === 'PER_KM') {
      validateNominalPerKm(data.nominalPerKm);
    }
    validateJarakMinimumKm(data.jarakMinimumKm);
    validateBiayaLayanan(data.biayaLayanan);

    const isFlat = data.tipeTarif === 'FLAT';
    let created;
    try {
      created = await prisma.tarif.create({
        data: {
          modaId: Number(data.modaId),
          tipeTarif: data.tipeTarif,
          nominalDasar: data.nominalDasar,
          nominalPerKm: isFlat ? 0 : (data.nominalPerKm ?? null),
          jarakMinimumKm: isFlat ? null : (data.jarakMinimumKm ?? null),
          biayaLayanan: isFlat ? 0 : (data.biayaLayanan ?? 0),
          keterangan: data.keterangan,
        },
        include: modaInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpError('Moda sudah punya tarif, ubah tarif yang ada', 409);
      }
      throw error;
    }

    invalidateRoutingNetworkCache();
    return created;
  }

  /**
   * Memperbarui tarif (modaId tidak boleh diganti)
   */
  static async update(id: number, data: UpdateTarifDTO) {
    const existing = await prisma.tarif.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new HttpError('Tarif tidak ditemukan', 404);
    }

    if (data.modaId !== undefined && Number(data.modaId) !== existing.modaId) {
      throw new HttpError('Moda tarif tidak dapat diganti', 400);
    }

    const finalTipe = data.tipeTarif ?? existing.tipeTarif;
    const finalDasar = data.nominalDasar ?? existing.nominalDasar;
    validateNominalDasar(finalDasar);

    const finalPerKm = data.nominalPerKm !== undefined ? data.nominalPerKm : existing.nominalPerKm;
    if (finalTipe === 'PER_KM') {
      validateNominalPerKm(finalPerKm);
    }
    const finalMinimum =
      data.jarakMinimumKm !== undefined ? data.jarakMinimumKm : existing.jarakMinimumKm;
    validateJarakMinimumKm(finalMinimum);
    const finalLayanan = data.biayaLayanan !== undefined ? data.biayaLayanan : existing.biayaLayanan;
    validateBiayaLayanan(finalLayanan);

    const isFlat = finalTipe === 'FLAT';
    const updated = await prisma.tarif.update({
      where: { id },
      data: {
        tipeTarif: data.tipeTarif ?? undefined,
        nominalDasar: data.nominalDasar ?? undefined,
        nominalPerKm: isFlat ? 0 : (data.nominalPerKm !== undefined ? data.nominalPerKm : undefined),
        jarakMinimumKm: isFlat ? null : (data.jarakMinimumKm !== undefined ? data.jarakMinimumKm : undefined),
        biayaLayanan: isFlat ? 0 : (data.biayaLayanan ?? undefined),
        keterangan: data.keterangan !== undefined ? data.keterangan : undefined,
      },
      include: modaInclude,
    });

    invalidateRoutingNetworkCache();
    return updated;
  }

  /**
   * Menghapus tarif (hapus sungguhan, tidak ada dependensi)
   */
  static async delete(id: number) {
    const existing = await prisma.tarif.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpError('Tarif tidak ditemukan', 404);
    }

    await prisma.tarif.delete({
      where: { id },
    });

    invalidateRoutingNetworkCache();
  }
}
