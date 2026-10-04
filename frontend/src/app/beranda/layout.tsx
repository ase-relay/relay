import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

// Saat auth dicek, tampilkan rangka halaman (bukan spinner layar putih):
// judul, kartu form pencarian, dan ilustrasi dalam bentuk skeleton.
function BerandaLoadingFallback() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-clip text-neutral-900">
      <Navbar />
      <main className="relative flex flex-1 items-center overflow-x-clip">
        <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-0 lg:px-12 lg:py-16">
          <div aria-hidden="true">
            <Skeleton variant="text" className="h-10 w-4/5 sm:h-12" />
            <Skeleton variant="text" className="mt-3 h-10 w-3/5 sm:h-12" />
            <Skeleton variant="text" className="mt-6 h-5 w-full max-w-xl" />
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <Skeleton variant="text" className="h-12 w-full" />
              <Skeleton variant="text" className="mt-3 h-12 w-full" />
              <Skeleton variant="rounded" className="mt-4 h-12 w-full" />
            </div>
          </div>
          <div aria-hidden="true" className="hidden lg:block">
            <Skeleton variant="rounded" className="h-90 w-full" />
          </div>
        </section>
      </main>
      <Footer />
      <span role="status" className="sr-only">
        Memuat halaman beranda...
      </span>
    </div>
  );
}

export default function BerandaLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute loadingFallback={<BerandaLoadingFallback />}>{children}</ProtectedRoute>;
}
