import { ROUTING_CONFIG } from '../config/routing.config';

/**
 * Kalkulator tarif murni (tanpa query database).
 * Dipakai mesin routing agar kandidat dihitung serentak dan cepat;
 * sumber datanya adalah jaringan (tabel Tarif) yang sudah dimuat ke memori.
 *
 * Aturan Gate T1-B: SATU rumus untuk SEMUA tarif PER_KM apa pun modanya
 * (tidak ada percabangan khusus ojek), biayaLayanan ditambahkan SETELAH
 * pembulatan ke atas (biayaLayanan sendiri tidak dibulatkan), per leg.
 * FLAT = nominalDasar dan mengabaikan kolom lainnya.
 */

/** Nilai string enum Prisma TipeTarif (tanpa import runtime @prisma/client). */
export type TipeTarifValue = 'FLAT' | 'PER_KM';

export interface FareTarif {
  tipeTarif: TipeTarifValue;
  nominalDasar: number;
  nominalPerKm: number | null;
  jarakMinimumKm: number | null;
  biayaLayanan: number;
}

/** Pembulatan ke atas ke kelipatan `step` (mis. Rp 500). */
export function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.ceil(value / step) * step;
}

/**
 * Sanitasi biayaLayanan: bukan angka berhingga atau negatif -> 0.
 */
export function sanitizeBiayaLayanan(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Satu-satunya fungsi kalkulasi tarif (dipakai transit, ojek langsung,
 * maupun ojek penghubung — tepat satu kali per leg).
 * `tarif` null -> fallback tarif default (konfigurasi).
 */
export function calculateFare(
  tarif: FareTarif | null | undefined,
  distanceMeters: number
): number {
  if (!tarif) {
    return ROUTING_CONFIG.defaultTransitFare;
  }

  if (tarif.tipeTarif === 'FLAT') {
    return tarif.nominalDasar || ROUTING_CONFIG.defaultTransitFare;
  }

  const minimumKm =
    typeof tarif.jarakMinimumKm === 'number' &&
    Number.isFinite(tarif.jarakMinimumKm) &&
    tarif.jarakMinimumKm > 0
      ? tarif.jarakMinimumKm
      : 0;
  const ratePerKm =
    typeof tarif.nominalPerKm === 'number' && Number.isFinite(tarif.nominalPerKm)
      ? tarif.nominalPerKm
      : 0;
  const distanceKm = distanceMeters / 1000;
  const raw =
    distanceKm <= minimumKm
      ? tarif.nominalDasar
      : tarif.nominalDasar + (distanceKm - minimumKm) * ratePerKm;

  return roundUpToStep(raw, ROUTING_CONFIG.fareRoundUpStep) + sanitizeBiayaLayanan(tarif.biayaLayanan);
}
