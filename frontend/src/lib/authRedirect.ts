import type { User } from '@/lib/types/auth';

type Role = User['role'];

/** Halaman default setelah login berdasarkan role. */
export function getDefaultRouteForRole(role: Role): string {
  return role === 'ADMIN' ? '/admin' : '/beranda';
}

/**
 * Apakah target redirect boleh dituju oleh role tersebut?
 * - /admin* hanya untuk ADMIN.
 * - Halaman auth tidak boleh jadi target (mencegah loop /login?redirect=/login).
 */
export function isRedirectAllowedForRole(target: string, role: Role): boolean {
  if (
    target === '/login' ||
    target.startsWith('/login?') ||
    target.startsWith('/login/') ||
    target === '/register' ||
    target.startsWith('/register?') ||
    target.startsWith('/register/')
  ) {
    return false;
  }
  if (target === '/admin' || target.startsWith('/admin/')) {
    return role === 'ADMIN';
  }
  return true;
}

/**
 * Tujuan kembali dari ?redirect=: hanya path internal yang aman
 * (diawali "/", bukan "//", tanpa "://" dan backslash) DAN
 * boleh diakses oleh role user yang baru login. Selain itu pakai fallback.
 */
export function resolvePostLoginRedirect(role: Role): string {
  const fallback = getDefaultRouteForRole(role);
  if (typeof window === 'undefined') return fallback;
  const target = new URLSearchParams(window.location.search).get('redirect');
  if (!target || !target.startsWith('/') || target.startsWith('//')) return fallback;
  if (target.includes('://') || target.includes('\\')) return fallback;
  if (!isRedirectAllowedForRole(target, role)) return fallback;
  return target;
}
