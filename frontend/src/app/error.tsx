'use client';

import { useEffect } from 'react';
import { ErrorPage } from '@/components/ui/ErrorPage';

export default function ErrorPage500({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      kode="500"
      judul="Terjadi kesalahan"
      deskripsi="Maaf, ada gangguan di sisi kami. Coba muat ulang halaman ini atau kembali lagi nanti."
      aksiUtama={{ label: 'Coba Lagi', onClick: reset }}
      aksiSekunder={{ label: 'Ke Beranda', href: '/beranda' }}
      fullScreen={false}
    />
  );
}
