import { prisma } from '../config/db';
import { calculateFare } from './fare-calculator';

export interface FareCalculationInput {
  modaId: number;
  distanceMeters: number;
}

export class FareService {
  /**
   * Menghitung tarif perjalanan berdasarkan moda dan jarak
   * (satu moda satu tarif; tanpa tarif khusus rute).
   */
  static async calculateFare(input: FareCalculationInput): Promise<number> {
    const { modaId, distanceMeters } = input;

    const tarif = await prisma.tarif.findUnique({
      where: { modaId },
    });

    return calculateFare(tarif, distanceMeters);
  }
}
