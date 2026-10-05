import { ErrorPage } from '@/components/ui/ErrorPage';

export default function NotFoundPage() {
  return (
    <ErrorPage
      kode="404"
      judul="Halaman tidak ditemukan"
      deskripsi="Alamat yang kamu tuju tidak ada atau sudah dipindahkan. Yuk kembali mencari rute perjalananmu."
      aksiUtama={{ label: 'Ke Beranda', href: '/beranda' }}
      aksiSekunder={{ label: 'Cari Rute', href: '/cari-rute' }}
    />
  );
}
