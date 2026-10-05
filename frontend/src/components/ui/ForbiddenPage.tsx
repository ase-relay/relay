import { ErrorPage } from '@/components/ui/ErrorPage';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <ErrorPage
        kode="403"
        judul="Akses ditolak"
        deskripsi="Kamu tidak punya akses ke halaman ini."
        aksiUtama={{ label: 'Ke Beranda', href: '/beranda' }}
        fullScreen={false}
      />
    </div>
  );
}

export default ForbiddenPage;
