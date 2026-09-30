import { ROUTING_CONFIG } from '../config/routing.config';
import { RouteCandidate } from './route-candidates';
import { RouteTag, SortByPreference } from '../types/routing.types';

/**
 * Pruning + ranking kandidat rute:
 *  1. Dedupe kandidat identik.
 *  2. Dominasi Pareto (biaya, durasi, jumlah transit, jarak jalan kaki —
 *     semua dimaksimalkan ke nilai kecil; kandidat "kalah telak" dibuang).
 *  3. Skor "direkomendasikan" = bobot 0,35 biaya + 0,35 durasi +
 *     0,15 transit + 0,15 jarak jalan kaki (dinormalisasi 0..1, makin kecil makin baik).
 *  4. Keberagaman: jaminan minimal satu kandidat per kategori sebelum dipotong.
 *  5. Potong ke maks hasil, urutkan sesuai sortBy, tempelkan tag.
 */

export interface ScoredRoute extends RouteCandidate {
  score: number;
  tags: RouteTag[];
}

const WEIGHTS = ROUTING_CONFIG.scoreWeights;

const normalize = (value: number, min: number, max: number): number =>
  max === min ? 0 : (value - min) / (max - min);

function dominates(a: RouteCandidate, b: RouteCandidate): boolean {
  const le =
    a.totalCost <= b.totalCost &&
    a.totalDurationMinutes <= b.totalDurationMinutes &&
    a.transfersCount <= b.transfersCount &&
    a.walkingDistanceMeters <= b.walkingDistanceMeters;
  const strict =
    a.totalCost < b.totalCost ||
    a.totalDurationMinutes < b.totalDurationMinutes ||
    a.transfersCount < b.transfersCount ||
    a.walkingDistanceMeters < b.walkingDistanceMeters;
  return le && strict;
}

function removeDominated(pool: RouteCandidate[]): RouteCandidate[] {
  return pool.filter(
    (a, index) => !pool.some((b, otherIndex) => otherIndex !== index && dominates(b, a))
  );
}

function computeScore(candidate: RouteCandidate, pool: RouteCandidate[]): number {
  const costs = pool.map((c) => c.totalCost);
  const durations = pool.map((c) => c.totalDurationMinutes);
  const transfers = pool.map((c) => c.transfersCount);
  const walkings = pool.map((c) => c.walkingDistanceMeters);

  return (
    WEIGHTS.cost * normalize(candidate.totalCost, Math.min(...costs), Math.max(...costs)) +
    WEIGHTS.duration *
      normalize(candidate.totalDurationMinutes, Math.min(...durations), Math.max(...durations)) +
    WEIGHTS.transfers *
      normalize(candidate.transfersCount, Math.min(...transfers), Math.max(...transfers)) +
    WEIGHTS.walking *
      normalize(candidate.walkingDistanceMeters, Math.min(...walkings), Math.max(...walkings))
  );
}

function comparator(sortBy: SortByPreference): (a: ScoredRoute, b: ScoredRoute) => number {
  const byDuration = (a: ScoredRoute, b: ScoredRoute): number =>
    a.totalDurationMinutes - b.totalDurationMinutes;
  const byCost = (a: ScoredRoute, b: ScoredRoute): number => a.totalCost - b.totalCost;
  const byTransfers = (a: ScoredRoute, b: ScoredRoute): number =>
    a.transfersCount - b.transfersCount;
  const byScore = (a: ScoredRoute, b: ScoredRoute): number => a.score - b.score;
  const byId = (a: ScoredRoute, b: ScoredRoute): number => a.id.localeCompare(b.id);

  switch (sortBy) {
    case 'FASTEST':
      return (a, b) => byDuration(a, b) || byTransfers(a, b) || byCost(a, b) || byScore(a, b) || byId(a, b);
    case 'CHEAPEST':
      return (a, b) => byCost(a, b) || byDuration(a, b) || byTransfers(a, b) || byScore(a, b) || byId(a, b);
    case 'LEAST_TRANSFERS':
      return (a, b) => byTransfers(a, b) || byDuration(a, b) || byCost(a, b) || byScore(a, b) || byId(a, b);
    case 'RECOMMENDED':
    default:
      return (a, b) => byScore(a, b) || byDuration(a, b) || byCost(a, b) || byTransfers(a, b) || byId(a, b);
  }
}

export function pruneAndRank(
  candidates: RouteCandidate[],
  sortBy: SortByPreference
): ScoredRoute[] {
  if (candidates.length === 0) return [];

  // 1. Dedupe
  const unique = new Map<string, RouteCandidate>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.dedupeKey)) unique.set(candidate.dedupeKey, candidate);
  }

  // 2. Dominasi Pareto
  const pool = removeDominated(Array.from(unique.values()));
  if (pool.length === 0) return [];

  // 3. Skor
  const scored: ScoredRoute[] = pool.map((candidate) => ({
    ...candidate,
    score: computeScore(candidate, pool),
    tags: [],
  }));

  const sortComparator = comparator(sortBy);

  // 4. Keberagaman kategori (ambil skor terbaik tiap kategori)
  const bestPerCategory = new Map<string, ScoredRoute>();
  for (const route of [...scored].sort(
    (a, b) => a.score - b.score || a.totalDurationMinutes - b.totalDurationMinutes || a.id.localeCompare(b.id)
  )) {
    if (!bestPerCategory.has(route.category)) bestPerCategory.set(route.category, route);
  }
  const selected: ScoredRoute[] = Array.from(bestPerCategory.values());

  // 5. Isi sisa kuota sesuai urutan sortBy, lalu potong maks hasil
  for (const route of [...scored].sort(sortComparator)) {
    if (selected.length >= ROUTING_CONFIG.maxResults) break;
    if (!selected.some((existing) => existing.id === route.id)) selected.push(route);
  }

  // 6. Urutan akhir sesuai preferensi
  selected.sort(sortComparator);

  // 7. Tag (satu kandidat pertama yang cocok per label)
  const minCost = Math.min(...selected.map((r) => r.totalCost));
  const minDuration = Math.min(...selected.map((r) => r.totalDurationMinutes));
  const minTransfers = Math.min(...selected.map((r) => r.transfersCount));
  const bestScore = Math.min(...selected.map((r) => r.score));

  selected.find((r) => r.totalCost === minCost)?.tags.push('termurah');
  selected.find((r) => r.totalDurationMinutes === minDuration)?.tags.push('tercepat');
  selected.find((r) => r.transfersCount === minTransfers)?.tags.push('minim_transit');
  selected.find((r) => r.score === bestScore)?.tags.push('direkomendasikan');

  return selected;
}
