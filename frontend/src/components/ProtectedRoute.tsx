'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Belum login: ke /login dengan tujuan kembali. Jangan tambahkan
      // ?redirect= bila sudah di /login agar tidak duplikat/loop.
      if (pathname === '/login') return;
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
