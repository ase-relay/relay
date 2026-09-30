import { ROUTING_CONFIG } from '../config/routing.config';

/**
 * Kalkulator tarif murni (tanpa query database).
 * Dipakai mesin routing agar kandidat dihitung serentak dan cepat;
 * sumber datanya adalah jaringan (tabel Tarif) yang sudah dimuat ke memori.
 */

/** Nilai string enum Prisma TipeTarif (tanpa import runtime @prisma/client). */
export type TipeTarifValue = 'FLAT' | 'PER_KM' | 'PER_STASIUN';

export interface TransitFareTarif {
  tipeTarif: TipeTarifValue;
  nominalDasar: number;
  nominalPerKm: number | null;
}

export interface OjekFareTarif {
  nominalDasar: number;
  nominalPerKm: number | null;
  jarakMinimumKm: number | null;
}

/** Pembulatan ke atas ke kelipatan `step` (mis. Rp 500). */
export function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.ceil(value / step) * step;
}

/**
 * Tarif transit (BUS/KERETA).
 * Logika identik dengan FareService (konsumen lain tidak berubah),
 * tetapi versi sinkron dari baris tarif yang sudah dimuat.
 * `tarif` null -> fallback tarif default (konfigurasi).
 */
export function calculateTransitFare(
  tarif: TransitFareTarif | null | undefined,
  opts: { distanceMeters: number; passedStopsCount: number }
): number {
  if (!tarif) {
    return ROUTING_CONFIG.defaultTransitFare;
  }

  switch (tarif.tipeTarif) {
    case 'FLAT':
      return tarif.nominalDasar || ROUTING_CONFIG.defaultTransitFare;

    case 'PER_KM': {
      const distanceKm = Math.max(1, opts.distanceMeters / 1000);
      const ratePerKm = tarif.nominalPerKm || 2500;
      return Math.round(tarif.nominalDasar + distanceKm * ratePerKm);
    }

    case 'PER_STASIUN': {
      const extraStops = Math.max(0, opts.passedStopsCount - 1);
      const ratePerStop = tarif.nominalPerKm || 1000;
      return Math.round(tarif.nominalDasar + extraStops * ratePerStop);
    }

    default:
      return tarif.nominalDasar || ROUTING_CONFIG.defaultTransitFare;
  }
}

/**
 * Tarif ojek (langsung maupun penghubung first/last-mile).
 *
 * Rumus dari data Tarif (bukan hardcode):
 *   jarak <= jarakMinimum -> tarifMinimum (nominalDasar)
 *   selainnya             -> nominalDasar + (jarak - jarakMinimum) * nominalPerKm
 * Hasil selalu dibulatkan KE ATAS ke kelipatan konfigurasi (Rp 500).
 */
export function calculateOjekFare(distanceMeters: number, tarif: OjekFareTarif): number {
  const distanceKm = distanceMeters / 1000;
  const jarakMinimumKm = tarif.jarakMinimumKm ?? 0;
  const nominalPerKm = tarif.nominalPerKm ?? 0;

  const raw =
    distanceKm <= jarakMinimumKm
      ? tarif.nominalDasar
      : tarif.nominalDasar + (distanceKm - jarakMinimumKm) * nominalPerKm;

  return roundUpToStep(raw, ROUTING_CONFIG.fareRoundUpStep);
}
