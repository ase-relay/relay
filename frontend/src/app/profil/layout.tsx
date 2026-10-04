import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

// Saat auth dicek, tampilkan rangka kartu profil (bukan spinner layar putih),
// meniru susunan baris Email / Username / Kata Sandi pada halaman profil.
function ProfilLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col text-neutral-900">
      <Navbar />
      <main className="mx-auto w-full max-w-292.5 flex-1 px-4 py-6 sm:py-8 sm:px-8 lg:py-12 xl:px-0">
        <section aria-hidden="true" className="rounded-[20px] border border-neutral-200 bg-white px-5 pt-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
          <Skeleton variant="text" className="h-6 w-48 max-w-full" />
          <div className="mt-6 space-y-4 sm:grid sm:grid-cols-[minmax(120px,.8fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:gap-y-0">
            {[0, 1, 2].map((index) => (
              <div key={`profil-loading-${index}`} className="sm:contents">
                {index > 0 && <div className="border-t border-neutral-300 sm:col-span-full" />}
                <div className="flex items-center gap-3 py-4 sm:gap-4 sm:py-8">
                  <Skeleton variant="circle" className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Skeleton variant="text" className="h-5 w-24" />
                </div>
                <Skeleton variant="text" className="h-6 w-full py-3 sm:w-64 sm:py-3" />
                <div className="flex items-center justify-end py-4 sm:py-8">
                  <Skeleton variant="rounded" className="h-9 w-20 sm:h-10" />
                </div>
              </div>
            ))}
          </div>
          <div className="pb-6 sm:pb-8 lg:pb-10" />
        </section>
      </main>
      <Footer />
      <span role="status" className="sr-only">
        Memuat halaman profil...
      </span>
    </div>
  );
}

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute loadingFallback={<ProfilLoadingFallback />}>{children}</ProtectedRoute>;
}
