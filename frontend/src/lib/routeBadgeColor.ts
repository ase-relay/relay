// Warna badge kode rute. Nilai warnanya dideklarasikan di globals.css sebagai
// token --color-route-* (otomatis jadi utilitas bg-route-*).
export const ROUTE_BADGE_COLOR: Record<string, string> = {
  'FD-1': 'bg-route-fd-1',
  'FD-2': 'bg-route-fd-2',
  K1: 'bg-route-k1',
  K2: 'bg-route-k2',
  K3: 'bg-route-k3',
  K4: 'bg-route-k4',
  K5: 'bg-route-k5',
  K6: 'bg-route-k6',
  CL: 'bg-route-cl',
  'CL-B': 'bg-route-cl',
};

// Kode di luar daftar di atas tetap memakai warna lama.
export const ROUTE_BADGE_FALLBACK_COLOR = 'bg-purple-700';

// Badge bisa berbentuk "MJT K3" atau "K3" — awalan "MJT" diabaikan saat mencari warna.
export function getRouteBadgeColor(badge: string): string {
  const code = badge.replace(/^MJT[\s-]*/i, '').trim().toUpperCase();
  return ROUTE_BADGE_COLOR[code] ?? ROUTE_BADGE_FALLBACK_COLOR;
}
