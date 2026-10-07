import { ROUTING_CONFIG } from '../config/routing.config';
import { categorizeModa } from './routing-network';
import { haversineMeters, GeoPoint } from '../utils/geo';
import { RouteLeg, PassedStopInfo } from '../types/routing.types';

/**
 * Timeline jam perkiraan perjalanan (aditif untuk kontrak response).
 *
 * Semua durasi (termasuk waktu tunggu) sudah dihitung mesin rute; service ini
 * hanya menjumlahkannya secara kumulatif dari jam keberangkatan → jam tiba
 * per leg, plus interpolasi jam tiba di tiap halte yang dilewati.
 * Format tampilan "HH:MM" (24 jam, WIB).
 */

/** Menit sejak tengah malam → "HH:MM" (dibulatkan per menit). */
export function formatClock(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** "HH:MM" → menit sejak tengah malam; null bila format tidak valid. */
export function parseClock(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Offset WIB dari UTC dalam menit (WIB tidak memakai daylight saving time). */
export const WIB_OFFSET_MINUTES = 7 * 60;

/** Menit sejak tengah malam WIB dari waktu saat ini (bila request tanpa departureTime). */
export function currentClockMinutes(now: Date = new Date()): number {
  const wibTime = new Date(now.getTime() + WIB_OFFSET_MINUTES * 60 * 1000);
  return wibTime.getUTCHours() * 60 + wibTime.getUTCMinutes();
}

/** Waktu tunggu (menit) untuk leg transit, sesuai kategori moda leg tersebut. */
function waitMinutesForLeg(leg: RouteLeg): number {
  if (leg.legType !== 'TRANSIT' || !leg.moda) return 0;
  const category = categorizeModa(leg.moda.nama, leg.moda.tipe);
  if (category === 'KERETA') return ROUTING_CONFIG.keretaWaitMinutes;
  if (category === 'OJEK') return ROUTING_CONFIG.ojekPickupWaitMinutes;
  return ROUTING_CONFIG.busWaitMinutes;
}

/**
 * Isi jam tiba tiap halte yang dilewati:
 * - stop pertama (halte keberangkatan) = jam mulai leg (tiba & mulai menunggu);
 * - stop berikutnya = legStart + waktu tunggu + proporsi waktu tempuh
 *   berdasarkan jarak kumulatif antar halte.
 * Koordinat halte dipakai untuk proporsi (jarak haversine antar titik).
 */
function assignStopTimes(
  stops: PassedStopInfo[],
  legStartMinutes: number,
  waitMinutes: number,
  travelMinutes: number
): void {
  const cumulative: number[] = [0];
  for (let index = 1; index < stops.length; index++) {
    const previous: GeoPoint = { lat: stops[index - 1].latitude, lng: stops[index - 1].longitude };
    const current: GeoPoint = { lat: stops[index].latitude, lng: stops[index].longitude };
    cumulative.push(cumulative[index - 1] + haversineMeters(previous, current));
  }
  const totalDistance = cumulative[cumulative.length - 1];

  stops.forEach((stop, index) => {
    if (index === 0 || stops.length === 1) {
      stop.estimatedTime = formatClock(legStartMinutes);
      return;
    }
    const fraction =
      totalDistance > 0
        ? cumulative[index] / totalDistance
        : index / (stops.length - 1);
    stop.estimatedTime = formatClock(
      legStartMinutes + waitMinutes + travelMinutes * fraction
    );
  });
}

export interface RouteTimeline {
  departureTime: string;
  arrivalTime: string;
}

/**
 * Mengisi `departureTime`/`arrivalTime` per leg dan `estimatedTime` per halte
 * yang dilewati, berdasarkan jam mulai (menit sejak tengah malam).
 * Mengembalikan jam berangkat/tiba ringkas untuk summary.
 */
export function applyRouteTimeline(
  legs: RouteLeg[],
  startMinutes: number
): RouteTimeline {
  let cursor = startMinutes;

  for (const leg of legs) {
    const legStart = cursor;
    leg.departureTime = formatClock(legStart);
    cursor += leg.durationMinutes;
    leg.arrivalTime = formatClock(cursor);

    if (leg.passedStops && leg.passedStops.length > 0) {
      const waitMinutes = waitMinutesForLeg(leg);
      const travelMinutes = Math.max(0, leg.durationMinutes - waitMinutes);
      assignStopTimes(leg.passedStops, legStart, waitMinutes, travelMinutes);
    }
  }

  return {
    departureTime: legs[0]?.departureTime ?? formatClock(startMinutes),
    arrivalTime: formatClock(cursor),
  };
}
