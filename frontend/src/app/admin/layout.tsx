import { AdminShell } from '@/components/admin/AdminShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Layout admin yang menyediakan shell AdminNavbar + AdminSidebar konsisten
// untuk semua halaman di bawah /admin. State drawer mobile dan layout
// fixed/scroll dikelola di AdminShell agar sidebar tidak ikut scroll.
// Hanya user dengan role ADMIN yang dapat mengakses halaman di bawah /admin.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminShell>{children}</AdminShell>
        </ProtectedRoute>
    );
}
