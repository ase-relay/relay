'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { VehicleIcon } from '@/components/icons/vehicle/VehicleIcon';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { searchRoutes } from '@/lib/api';
import { mapApiRouteToRouteResultCard, RouteRecommendation } from '@/lib/mappers/routeMapper';
import { readRouteSearchLocations, saveRouteSearchResults } from '@/lib/routeSearchTransfer';
import type { RoutingSortBy } from '@/types/api/routing';

// Task 3.2: opsi urutan diperluas dari 2 nilai lokal menjadi 4 sesuai kontrak BE.
// Nilai yang dikirim ke request mengikuti enum RoutingSortBy (kontrak BE).
type SortOption = 'termurah' | 'tercepat' | 'recommended' | 'sedikit-transit';

const SORT_BY_LABEL: Record<SortOption, string> = {
  termurah: 'Termurah',
  tercepat: 'Tercepat',
  recommended: 'Direkomendasikan',
  'sedikit-transit': 'Transit Sedikit',
};

const SORT_BY_MAP: Record<SortOption, RoutingSortBy> = {
  termurah: 'CHEAPEST',
  tercepat: 'FASTEST',
  recommended: 'RECOMMENDED',
  'sedikit-transit': 'LEAST_TRANSFERS',
};

const SORT_OPTIONS = Object.keys(SORT_BY_LABEL) as SortOption[];

// Grup 4: opsi radius jalan kaki (meter) untuk preferensi pencarian — 1500 = default BE.
const WALKING_DISTANCE_OPTIONS = [500, 1000, 1500, 2000, 3000];

function formatWalkingDistance(meters: number): string {
  if (meters % 1000 === 0) return `${meters / 1000} km`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function WalkingIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="inline-block h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="1.5" /><path d="m10 21 1-6-3-2 2-4 2 2 3-1M14 12l2 3 3 1" /></svg>;
}

export default function CariRutePage() {
  // useSearchParams wajib dibungkus Suspense saat prerender.
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CariRutePageContent />
    </Suspense>
  );
}

function CariRutePageContent() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>('termurah');

  // Task 1.3: data lokasi lengkap (name + lat + lng) ditulis RouteSearchForm ke sessionStorage
  // sebelum navigasi. Query string hanya membawa nama lokasi sebagai fallback tampilan.
  const [originName, setOriginName] = useState('Lokasi awal');
  const [destinationName, setDestinationName] = useState('Tujuan');

  // Task 3.2: hasil pencarian dari BE (bukan lagi array statis).
  const [routes, setRoutes] = useState<RouteRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Grup 4: preferensi pencarian tambahan sesuai kontrak BE.
  // - maxWalkingDistance: radius jalan kaki ke halte (meter); 1500 = default BE.
  // - includedModa: ID moda yang diizinkan; array kosong = semua moda (default BE).
  const [maxWalkingDistance, setMaxWalkingDistance] = useState(1500);
  const [includedModa, setIncludedModa] = useState<number[]>([]);
  // Katalog moda yang pernah terlihat dari response BE (id + nama), akumulatif.
  const [modaCatalog, setModaCatalog] = useState<Array<{ id: number; nama: string }>>([]);

  useEffect(() => {
    const stored = readRouteSearchLocations();
    setOriginName(stored?.origin.name ?? searchParams.get('origin') ?? 'Lokasi awal');
    setDestinationName(stored?.destination.name ?? searchParams.get('destination') ?? 'Tujuan');

    // Tanpa data koordinat lengkap (mis. user membuka URL ini langsung), request ke BE
    // tidak bisa dibentuk sesuai kontrak — tampilkan pesan, bukan fetch dengan data bohong.
    if (!stored) {
      setErrorMessage('Data lokasi pencarian tidak ditemukan. Silakan cari rute dari halaman beranda.');
      setIsLoading(false);
      setRoutes([]);
      return;
    }

    let didCancel = false;
    setIsLoading(true);
    setErrorMessage('');
    setRoutes([]);

    searchRoutes({
      origin: { name: stored.origin.name, lat: stored.origin.lat, lng: stored.origin.lng },
      destination: { name: stored.destination.name, lat: stored.destination.lat, lng: stored.destination.lng },
      // Grup 4: preferensi tambahan sesuai kontrak BE. allowedModa kosong = semua moda.
      preferences: {
        sortBy: SORT_BY_MAP[sortBy],
        maxWalkingDistance,
        allowedModa: includedModa,
      },
    })
      .then((response) => {
        if (didCancel) return;
        // Task 3.3: simpan hasil pencarian SEBELUM state di-update — halaman detail
        // (/cari-rute/[routeId]) membaca rute via readRouteSearchResults() dari sini.
        // Tanpa ini, klik "Lihat Detail" selalu menemui "Rute tidak ditemukan".
        saveRouteSearchResults(response.data);
        // Grup 4: akumulasi katalog moda (id + nama) dari leg TRANSIT response — dipakai
        // untuk chip filter allowedModa tanpa meng-hardcode asumsi ID moda. Katalog
        // akumulatif agar chip tidak hilang saat moda-nya sedang difilter keluar.
        setModaCatalog((prev) => {
          const seen = new Map(prev.map((moda) => [moda.id, moda.nama]));
          response.data.routes.forEach((route) =>
            route.legs.forEach((leg) => {
              if (leg.moda) seen.set(leg.moda.id, leg.moda.nama);
            }),
          );
          // Tidak ada moda baru → return referensi lama agar tidak re-render sia-sia.
          return seen.size === prev.length ? prev : Array.from(seen, ([id, nama]) => ({ id, nama }));
        });
        setRoutes(response.data.routes.map(mapApiRouteToRouteResultCard));
        setIsLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (didCancel) return;
        setErrorMessage(fetchError instanceof Error ? fetchError.message : 'Gagal mencari rute. Silakan coba lagi.');
        setIsLoading(false);
      });

    return () => { didCancel = true; };
  }, [sortBy, maxWalkingDistance, includedModa, searchParams, reloadKey]);

  return (
    <div className="min-h-screen pb-12 text-neutral-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <Link href="/beranda" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">
          <span aria-hidden="true">←</span> Kembali ke Beranda
        </Link>

        <h1 className="mt-7 text-3xl font-bold tracking-tight text-black">Rekomendasi Rute</h1>

        <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm" aria-labelledby="route-list-heading">
          <header className="grid items-center gap-6 border-b border-neutral-200 p-7 md:grid-cols-[1fr_minmax(160px,0.7fr)_1fr] md:p-8">
            <div className="flex items-center gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-100"><span className="h-5 w-5 rounded-full border-[3px] border-primary-600 bg-white" /></span>
              <div><p className="text-sm text-neutral-500">Lokasi awal</p><p className="mt-1 font-bold text-black">{originName}</p></div>
            </div>

            <div className="hidden items-center gap-2 text-neutral-400 md:flex" aria-hidden="true"><span className="w-full border-t-2 border-dashed border-neutral-300" /><span>→</span></div>

            <div className="flex items-center gap-5 md:justify-self-end">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500"><svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg></span>
              <div><p className="text-sm text-neutral-500">Tujuan</p><p className="mt-1 font-bold text-black">{destinationName}</p></div>
            </div>
          </header>

          <div className="p-7 md:p-8">
            <div className="mb-8">
              <p className="text-sm font-bold text-black">Urutkan rute berdasarkan</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Urutkan rute">
                {SORT_OPTIONS.map((option) => {
                  const isActive = sortBy === option;
                  return <button key={option} type="button" onClick={() => setSortBy(option)} aria-pressed={isActive} className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${isActive ? 'border-neutral-200 bg-neutral-100 text-neutral-900' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'}`}>{SORT_BY_LABEL[option]}</button>;
                })}
              </div>
            </div>

            {/* Grup 4: preferensi pencarian tambahan sesuai kontrak BE */}
            <div className="mb-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="max-walking-distance" className="text-sm font-bold text-black">Jarak jalan kaki maksimal</label>
                <select
                  id="max-walking-distance"
                  value={maxWalkingDistance}
                  onChange={(event) => setMaxWalkingDistance(Number(event.target.value))}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-primary-600"
                >
                  {WALKING_DISTANCE_OPTIONS.map((meters) => (
                    <option key={meters} value={meters}>
                      {formatWalkingDistance(meters)}{meters === 1500 ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {modaCatalog.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-black">Moda transportasi</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter moda transportasi">
                    {modaCatalog.map((moda) => {
                      const isIncluded = includedModa.includes(moda.id);
                      return (
                        <button
                          key={moda.id}
                          type="button"
                          onClick={() =>
                            setIncludedModa((prev) =>
                              isIncluded ? prev.filter((id) => id !== moda.id) : [...prev, moda.id],
                            )
                          }
                          aria-pressed={isIncluded}
                          className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${isIncluded ? 'border-neutral-200 bg-neutral-100 text-neutral-900' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'}`}
                        >
                          {moda.nama}
                        </button>
                      );
                    })}
                    <span className="text-xs text-neutral-400">Tanpa pilihan = semua moda diperhitungkan</span>
                  </div>
                </div>
              )}
            </div>

            <h2 id="route-list-heading" className="sr-only">Daftar rekomendasi rute</h2>

            {errorMessage && (
              <div className="mb-6 space-y-4">
                <Alert status="error" title="Pencarian rute gagal" description={errorMessage} onClose={() => setErrorMessage('')} />
                <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700">Coba Lagi</button>
              </div>
            )}

            {isLoading && (
              <div aria-hidden="true" className="space-y-8">
                {[0, 1, 2].map((index) => (
                  <div key={index} className={`flex flex-wrap items-center gap-6 py-4 ${index < 2 ? 'border-b border-neutral-200' : ''}`}>
                    <Skeleton variant="circle" className="h-12 w-12" />
                    <div className="min-w-[180px] flex-1 space-y-2"><Skeleton variant="text" className="h-5 w-40" /><Skeleton variant="text" className="h-4 w-64 max-w-full" /></div>
                    <Skeleton variant="text" className="h-5 w-24" />
                    <Skeleton variant="text" className="h-5 w-24" />
                    <Skeleton variant="rounded" className="h-9 w-32" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !errorMessage && routes.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-base font-semibold text-neutral-900">Tidak ada rute ditemukan</p>
                <p className="mt-2 text-sm text-neutral-500">Coba ubah lokasi awal/tujuan atau kurangi filter pencarian, lalu cari lagi dari beranda.</p>
              </div>
            )}

            {!isLoading && !errorMessage && routes.length > 0 && (
              <div>
                {routes.map((route, index) => (
                  <article key={route.id} className={`grid gap-6 py-7 md:grid-cols-[minmax(220px,1.45fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(150px,0.9fr)_auto] md:items-center ${index < routes.length - 1 ? 'border-b border-neutral-200' : ''}`}>
                    <div className="flex items-center gap-4"><VehicleIcon type={route.type} /><div><p className="font-bold text-black">{route.transportName}</p><div className="mt-2 flex flex-wrap items-center gap-2">{route.badges.map((badge) => <span key={badge} className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${badge === 'FD-1' ? 'bg-emerald-500' : 'bg-purple-700'}`}>{badge}</span>)}{route.operator && <span className="text-sm text-neutral-500">{route.operator}</span>}</div></div></div>
                    <div><p className="text-sm text-neutral-500">Estimasi Biaya</p><p className="mt-2 font-bold text-black">{route.priceLabel}</p></div>
                    <div><p className="text-sm text-neutral-500">Estimasi Waktu</p><p className="mt-2 font-bold text-black">{route.durationLabel}</p></div>
                    <div><p className="text-sm text-neutral-500">Transit &amp; Jalan Kaki</p><p className="mt-2 flex items-center gap-1 font-bold text-black">{route.transits} transit, <WalkingIcon /> {route.walkingTime} menit</p></div>
                    <Link href={`/cari-rute/${route.id}`} className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700">Lihat Detail <span aria-hidden="true">›</span></Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
