import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

// Saat auth dicek, tampilkan rangka halaman hasil pencarian (bukan spinner
// layar putih): judul, kartu lokasi, dan kartu-kartu rute dalam skeleton.
function CariRuteLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col text-neutral-900">
      <Navbar />
      <main className="mx-auto w-full max-w-292.5 flex-1 px-4 pb-12 pt-8 sm:px-8 xl:px-0">
        <Skeleton variant="text" className="h-9 w-2/3 max-w-md" />
        <div aria-hidden="true" className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton variant="circle" className="h-12 w-12 shrink-0 sm:h-15 sm:w-15" />
              <div>
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="mt-2 h-5 w-44 max-w-full" />
              </div>
            </div>
            <div className="flex items-center gap-4 sm:justify-end">
              <Skeleton variant="circle" className="h-12 w-12 shrink-0 sm:h-15 sm:w-15" />
              <div>
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="mt-2 h-5 w-44 max-w-full" />
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="mt-6 space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={`cari-rute-loading-${index}`} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
              <Skeleton variant="text" className="h-6 w-1/2 max-w-sm" />
              <Skeleton variant="text" className="mt-3 h-4 w-full" />
              <div className="mt-4 flex items-center gap-6">
                <Skeleton variant="text" className="h-8 w-24" />
                <Skeleton variant="text" className="h-8 w-24" />
                <Skeleton variant="rounded" className="ml-auto h-10 w-28" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <span role="status" className="sr-only">
        Memuat hasil pencarian rute...
      </span>
    </div>
  );
}

export default function CariRuteLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute loadingFallback={<CariRuteLoadingFallback />}>{children}</ProtectedRoute>;
}
