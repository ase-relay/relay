import { prisma } from '../config/db';
import { TipeTarif } from '@prisma/client';

export interface FareCalculationInput {
  modaId: number;
  ruteId?: number;
  distanceMeters: number;
  passedStopsCount: number;
}

export class FareService {
  /**
   * Menghitung tarif perjalanan berdasarkan moda, rute spesifik, jarak, dan jumlah stop
   */
  static async calculateFare(input: FareCalculationInput): Promise<number> {
    const { modaId, ruteId, distanceMeters, passedStopsCount } = input;

    // 1. Cari tarif khusus rute jika ada, jika tidak ada fallback ke tarif default moda
    let tarif = null;
    if (ruteId) {
      tarif = await prisma.tarif.findFirst({
        where: { ruteId },
      });
    }

    if (!tarif) {
      tarif = await prisma.tarif.findFirst({
        where: { modaId, ruteId: null },
      });
    }

    // Default fallback jika belum disetting di database
    if (!tarif) {
      // Standar default tarif bus/angkot Bandung
      return 5000;
    }

    const { tipeTarif, nominalDasar, nominalPerKm } = tarif;

    switch (tipeTarif) {
      case TipeTarif.FLAT:
        return nominalDasar;

      case TipeTarif.PER_KM: {
        const distanceKm = Math.max(1, distanceMeters / 1000);
        const ratePerKm = nominalPerKm || 2500;
        return Math.round(nominalDasar + distanceKm * ratePerKm);
      }

      case TipeTarif.PER_STASIUN: {
        // Contoh: nominalDasar (misal 3000 untuk 1-3 stop pertama) + nominalPerKm per stop tambahan
        const extraStops = Math.max(0, passedStopsCount - 1);
        const ratePerStop = nominalPerKm || 1000;
        return Math.round(nominalDasar + extraStops * ratePerStop);
      }

      default:
        return nominalDasar || 5000;
    }
  }
}
