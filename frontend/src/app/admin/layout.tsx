import { AdminShell } from '@/components/admin/AdminShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Layout admin yang menyediakan shell AdminNavbar + AdminSidebar konsisten
// untuk semua halaman di bawah /admin. State drawer mobile dan layout
// fixed/scroll dikelola di AdminShell agar sidebar tidak ikut scroll.
// Hanya user dengan role ADMIN yang dapat mengakses halaman di bawah /admin.
// Saat auth dicek, skeleton hanya untuk field data yang dimuat (baris data);
// rangka shell, judul, search, dan tombol tetap apa adanya (tanpa file terpisah).
function AdminDataLoadingFallback() {
    return (
        <AdminShell>
            <span role="status" className="sr-only">
                Memuat halaman admin...
            </span>
            <div aria-hidden="true" className="mt-9 overflow-hidden rounded-2xl border border-neutral-200">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={`admin-loading-${index}`}
                        className={`flex items-center gap-4 px-6 py-5 ${index > 0 ? 'border-t border-neutral-200' : ''}`}
                    >
                        <Skeleton variant="text" className="h-5 w-8 shrink-0" />
                        <Skeleton variant="text" className="h-5 w-44 max-w-full shrink-0" />
                        <Skeleton variant="text" className="hidden h-5 flex-1 sm:block" />
                        <Skeleton variant="rounded" className="h-8 w-24 shrink-0" />
                    </div>
                ))}
            </div>
        </AdminShell>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN" loadingFallback={<AdminDataLoadingFallback />}>
            <AdminShell>{children}</AdminShell>
        </ProtectedRoute>
    );
}
