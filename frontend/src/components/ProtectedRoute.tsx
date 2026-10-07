'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, ReactNode } from 'react';
import { ForbiddenPage } from '@/components/ui/ForbiddenPage';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
  /** Tampilan pengganti saat auth masih dicek. Default: spinner tengah layar. */
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({ children, requiredRole, loadingFallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Menandai apakah sesi ini pernah authenticated. Dipakai untuk membedakan
  // "logout eksplisit" (user: ada -> null) dari "belum login sejak awal".
  // Setelah logout eksplisit, JANGAN wariskan ?redirect= ke /login — login
  // berikutnya harus ke rute default sesuai role, bukan balik ke halaman
  // milik sesi/user sebelumnya.
  const hadUserRef = useRef(false);
  useEffect(() => {
    if (user) hadUserRef.current = true;
  }, [user]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Belum login: ke /login dengan tujuan kembali. Jangan tambahkan
      // ?redirect= bila sudah di /login agar tidak duplikat/loop.
      if (pathname === '/login') return;
      // Baru saja logout dari halaman ini: ke /login polos (tanpa redirect).
      // Handler logout juga melakukan replace ke /login, jadi kedua navigasi
      // ini menuju tujuan yang sama dan tidak balapan param.
      if (hadUserRef.current) {
        router.replace('/login');
        return;
      }
      const target = `${pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Sudah login tapi role tidak cocok: tampilkan 403 di tempat,
  // URL tetap, tanpa redirect.
  if (requiredRole && user.role !== requiredRole) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
