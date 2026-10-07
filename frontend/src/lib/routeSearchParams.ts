import type { RoutingSortBy } from '@/types/api/routing';
import { isWithinServiceArea } from '@/lib/serviceArea';

/**
 * Query string shareable untuk pencarian rute.
 *
 * Masalah yang diselesaikan: halaman /cari-rute & /cari-rute/[routeId] dulu hanya
 * mengandalkan sessionStorage untuk koordinat (query URL cuma membawa nama lokasi),
 * sehingga refresh / buka di tab baru / share link selalu gagal ("data tidak
 * ditemukan") dan parameter hilang saat navigasi.
 *
 * Sekarang URL adalah sumber kebenaran:
 *   /cari-rute?origin=<nama>&olat=<lat>&olng=<lng>&destination=<nama>&dlat=<lat>&dlng=<lng>[&sort=..&walk=..&moda=1,2]
 *   /cari-rute/<routeId>?<query-yang-sama>
 * sessionStorage dipertahankan sebagai fallback (kompatibilitas) & suplementer.
 */

// Slug sort di URL — nilainya konsisten dengan opsi di halaman cari-rute.
export const ROUTE_SEARCH_SORT_SLUGS = ['termurah', 'tercepat', 'recommended', 'sedikit-transit'] as const;
export type RouteSearchSortSlug = (typeof ROUTE_SEARCH_SORT_SLUGS)[number];

export const ROUTE_SEARCH_SORT_DEFAULT: RouteSearchSortSlug = 'termurah';

export const SORT_SLUG_TO_ENUM: Record<RouteSearchSortSlug, RoutingSortBy> = {
  termurah: 'CHEAPEST',
  tercepat: 'FASTEST',
  recommended: 'RECOMMENDED',
  'sedikit-transit': 'LEAST_TRANSFERS',
};

// Opsi radius jalan kaki (meter) sesuai UI — 1500 = default BE.
export const WALKING_DISTANCE_DEFAULT = 1500;
export const WALKING_DISTANCE_OPTIONS = [500, 1000, 1500, 2000, 3000];

const MAX_NAME_LENGTH = 200;

export interface RouteSearchUrlLocation {
  name: string;
  /** Label wilayah (tampilan saja, opsional di URL). */
  district: string;
  lat: number;
  lng: number;
}

export interface RouteSearchUrlState {
  origin: RouteSearchUrlLocation;
  destination: RouteSearchUrlLocation;
  sort: RouteSearchSortSlug;
  maxWalkingDistance: number;
  includedModa: number[];
}

function parseLocationName(value: string | null): string | null {
  if (value === null) return null;
  const name = value.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) return null;
  return num;
}

function isSortSlug(value: string | null): value is RouteSearchSortSlug {
  return value !== null && (ROUTE_SEARCH_SORT_SLUGS as readonly string[]).includes(value);
}

/** Teks opsional (label tampilan): kosong bila tidak ada, dipotong agar URL tetap wajar. */
function parseOptionalText(value: string | null): string {
  if (value === null) return '';
  return value.trim().slice(0, 120);
}

/**
 * Bangun query string pencarian dari state. Nilai default (sort termurah,
 * walk 1500, moda kosong) tidak ditulis agar URL tetap ringkas.
 */
export function buildRouteSearchQuery(state: RouteSearchUrlState): string {
  const params = new URLSearchParams();
  params.set('origin', state.origin.name);
  params.set('olat', String(state.origin.lat));
  params.set('olng', String(state.origin.lng));
  if (state.origin.district.trim() !== '') params.set('odist', state.origin.district.trim());
  params.set('destination', state.destination.name);
  params.set('dlat', String(state.destination.lat));
  params.set('dlng', String(state.destination.lng));
  if (state.destination.district.trim() !== '') params.set('ddist', state.destination.district.trim());
  if (state.sort !== ROUTE_SEARCH_SORT_DEFAULT) params.set('sort', state.sort);
  if (state.maxWalkingDistance !== WALKING_DISTANCE_DEFAULT) {
    params.set('walk', String(state.maxWalkingDistance));
  }
  if (state.includedModa.length > 0) params.set('moda', state.includedModa.join(','));
  return params.toString();
}

/**
 * Parse query string menjadi state pencarian. Mengembalikan null bila nama atau
 * koordinat tidak lengkap/valid — pemanggil lalu fallback ke sessionStorage
 * (aliran lama) atau state "data tidak ditemukan".
 */
export function parseRouteSearchQuery(searchParams: URLSearchParams): RouteSearchUrlState | null {
  const originName = parseLocationName(searchParams.get('origin'));
  const destinationName = parseLocationName(searchParams.get('destination'));
  const olat = parseCoordinate(searchParams.get('olat'), -90, 90);
  const olng = parseCoordinate(searchParams.get('olng'), -180, 180);
  const dlat = parseCoordinate(searchParams.get('dlat'), -90, 90);
  const dlng = parseCoordinate(searchParams.get('dlng'), -180, 180);

  if (
    originName === null ||
    destinationName === null ||
    olat === null ||
    olng === null ||
    dlat === null ||
    dlng === null
  ) {
    return null;
  }

  const sortRaw = searchParams.get('sort');
  const sort: RouteSearchSortSlug = isSortSlug(sortRaw) ? sortRaw : ROUTE_SEARCH_SORT_DEFAULT;

  const walkRaw = Number(searchParams.get('walk'));
  const maxWalkingDistance = WALKING_DISTANCE_OPTIONS.includes(walkRaw)
    ? walkRaw
    : WALKING_DISTANCE_DEFAULT;

  const modaRaw = searchParams.get('moda');
  const includedModa = modaRaw
    ? Array.from(
        new Set(
          modaRaw
            .split(',')
            .map((part) => Number(part.trim()))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      )
    : [];

  return {
    origin: { name: originName, district: parseOptionalText(searchParams.get('odist')), lat: olat, lng: olng },
    destination: { name: destinationName, district: parseOptionalText(searchParams.get('ddist')), lat: dlat, lng: dlng },
    sort,
    maxWalkingDistance,
    includedModa,
  };
}

/**
 * Apakah kedua titik pencarian berada dalam wilayah layanan (Bandung metropolitan)?
 * Koordinat hasil edit URL manual bisa lolos validasi angka global tapi berada
 * di luar jangkauan layanan — backend menolaknya (400/kosong). Pemanggil memakai
 * ini untuk menampilkan pesan spesifik TANPA memanggil backend dan TANPA
 * menimpa sessionStorage dengan koordinat rusak tersebut.
 */
export function isRouteSearchInServiceArea(state: RouteSearchUrlState): boolean {
  return (
    isWithinServiceArea(state.origin.lat, state.origin.lng) &&
    isWithinServiceArea(state.destination.lat, state.destination.lng)
  );
}
