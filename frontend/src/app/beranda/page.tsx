'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function BerandaPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function swapLocations() {
    setOrigin(destination);
    setDestination(origin);
    setError('');
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!origin.trim() || !destination.trim()) {
      setError('Lokasi awal dan tujuan wajib diisi.');
      return;
    }

    if (origin === destination) {
      setError('Lokasi awal dan tujuan tidak boleh sama.');
      return;
    }

    setError('');
    setIsLoading(true);

    const payload = { origin, destination };
    console.log(JSON.stringify(payload));

    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/cari-rute?asal=${encodeURIComponent(origin)}&tujuan=${encodeURIComponent(destination)}`);
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-blue-50 text-neutral-900">
      <Navbar />

      <main className="relative flex flex-1 items-center">
        <div className="pointer-events-none absolute bottom-12 left-0 hidden grid-cols-4 gap-x-6 gap-y-4 p-4 md:grid">
          {Array.from({ length: 20 }).map((_, index) => <span key={index} className="h-1.5 w-1.5 rounded-full bg-primary-600" />)}
        </div>

        <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
          <div className="grid items-end gap-8 lg:grid-cols-2 lg:gap-4">
            <div className="relative z-10 lg:pb-8">
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-black sm:text-6xl">Mau Otewe ke mana?</h1>
              <svg aria-hidden="true" viewBox="0 0 310 14" className="ml-42 mt-1 h-4 w-42 min-w-48" fill="none" preserveAspectRatio="none"><path d="M3 8c70-7 205-7 304 2" stroke="#0759E8" strokeWidth="4" strokeLinecap="round" /></svg>

              <p className="mt-11 max-w-xl text-lg leading-relaxed text-neutral-900">Masukkan lokasi awal dan tujuanmu untuk menemukan pilihan<br className="hidden sm:block" /> perjalanan yang sesuai.</p>

              <form onSubmit={onSubmit} noValidate className="mt-10 max-w-2xl rounded-3xl bg-white p-8 shadow-lg sm:p-14">
                <div className="relative space-y-8">
                  <div className="absolute left-[-25px] top-8 h-14 border-l-2 border-dashed border-neutral-300 sm:left-[-28px]" />
                  <div className="relative">
                    <span className="absolute -left-9 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-neutral-400 bg-white sm:-left-10" />
                    <label htmlFor="origin" className="sr-only">Lokasi awal</label>
                    <input id="origin" value={origin} onChange={(event) => { setOrigin(event.target.value); setError(''); }} placeholder="Pilih lokasi awal ..." className="h-18 w-full rounded-2xl border border-neutral-300 px-6 text-base text-neutral-900 outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-100" />
                  </div>

                  <button type="button" onClick={swapLocations} aria-label="Tukar lokasi awal dan tujuan" className="absolute -right-10 top-17 grid h-9 w-9 place-items-center rounded-full text-neutral-900 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-600 sm:-right-12">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4v15m0 0-4-4m4 4 4-4M16 20V5m0 0 4 4m-4-4-4 4" /></svg>
                  </button>

                  <div className="relative">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute -left-9 top-1/2 h-6 w-6 -translate-y-1/2 fill-neutral-400 sm:-left-10" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg>
                    <label htmlFor="destination" className="sr-only">Lokasi tujuan</label>
                    <input id="destination" value={destination} onChange={(event) => { setDestination(event.target.value); setError(''); }} placeholder="Pilih lokasi tujuan ..." className="h-18 w-full rounded-2xl border border-neutral-300 px-6 text-base text-neutral-900 outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-100" />
                  </div>
                </div>

                {error && <p role="alert" className="mt-5 text-sm font-medium text-red-600">{error}</p>}

                <button type="submit" disabled={isLoading} className="mt-9 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 text-base font-semibold text-white transition hover:bg-primary-700 disabled:cursor-wait disabled:opacity-75">
                  {isLoading ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Mencari rute...</> : <><svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" strokeLinecap="round" /></svg> Cari Rute</>}
                </button>
              </form>
            </div>

            <div className="relative flex min-h-80 items-end justify-center lg:min-h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/ilustrasi-transportasi.png" alt="Ilustrasi bus, angkot, dan ojek di tengah kota" className="w-full max-w-3xl object-contain object-bottom" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
