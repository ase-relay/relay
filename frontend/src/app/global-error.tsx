'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function GlobalError({
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
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden font-sans">
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
          <div className="max-w-md text-center">
            <p className="text-7xl font-bold tracking-tight text-primary-600 sm:text-8xl">500</p>
            <h1 className="mt-4 mb-3 text-3xl font-bold text-neutral-900">Terjadi kesalahan</h1>
            <p className="mb-8 text-lg text-neutral-600">
              Maaf, ada gangguan di sisi kami. Coba muat ulang halaman ini atau kembali lagi nanti.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-block w-full cursor-pointer rounded-full bg-primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-700 sm:w-auto"
              >
                Coba Lagi
              </button>
              <a
                href="/beranda"
                className="inline-block w-full rounded-full border border-neutral-300 px-8 py-3 font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 sm:w-auto"
              >
                Ke Beranda
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
