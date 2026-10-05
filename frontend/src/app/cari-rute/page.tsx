'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, useCallback, type ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VehicleIcon } from '@/components/icons/vehicle/VehicleIcon';
import { Alert } from '@/components/ui/Alert';
import { AlertViewport } from '@/components/ui/AlertViewport';
import { Skeleton } from '@/components/ui/Skeleton';
import { searchRoutes } from '@/lib/api';
import { mapApiRouteToRouteResultCard, RouteRecommendation } from '@/lib/mappers/routeMapper';
import { readRouteSearchLocations, saveRouteSearchResults } from '@/lib/routeSearchTransfer';
import type { RoutingSortBy } from '@/types/api/routing';
import CurrentLocationIcon from '@/components/icons/cari-rute/CurrentLocationIcon';
import DestinationLocationIcon from '@/components/icons/cari-rute/DestinationLocationIcon';
import DashedArrowRightIcon from '@/components/icons/cari-rute/DashedArrowRightIcon';
import WalkingGlyphIcon from '@/components/icons/cari-rute/WalkingIcon';
import BackArrowIcon from '@/components/icons/cari-rute/BackArrowIcon';
import RightArrowIcon from '@/components/icons/home/RightArrowIcon';
import SortWalletIcon from '@/components/icons/cari-rute/SortWalletIcon';
import SortClockIcon from '@/components/icons/cari-rute/SortClockIcon';
import SortStarIcon from '@/components/icons/cari-rute/SortStarIcon';
import SortTransitIcon from '@/components/icons/cari-rute/SortTransitIcon';

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

// Ikon kecil di dalam chip urutan — mengikuti design (wallet, jam, bintang, transit).
const SORT_ICON: Record<SortOption, (props: { className?: string }) => ReactElement> = {
  termurah: SortWalletIcon,
  tercepat: SortClockIcon,
  recommended: SortStarIcon,
  'sedikit-transit': SortTransitIcon,
};

// Grup 4: opsi radius jalan kaki (meter) untuk preferensi pencarian — 1500 = default BE.
const WALKING_DISTANCE_OPTIONS = [500, 1000, 1500, 2000, 3000];

function formatWalkingDistance(meters: number): string {
  if (meters % 1000 === 0) return `${meters / 1000} km`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

import { getRouteBadgeColor } from '@/lib/routeBadgeColor';

// Keterangan operator untuk moda Ojek Online (tidak datang dari BE).
const OJEK_OPERATOR_LABEL = 'GrabBike / GoRide';

function isOjekRoute(transportName: string): boolean {
  return transportName.toLowerCase().includes('ojek');
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
  const handleCloseAlert = useCallback(() => setErrorMessage(''), []);
  // Data lokasi tidak ada/rusak (mis. refresh atau buka URL langsung) → state khusus
  // dengan tombol kembali, tanpa memanggil backend sama sekali.
  const [missingLocations, setMissingLocations] = useState(false);
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

    // Tanpa data koordinat lengkap (mis. user membuka URL ini langsung atau refresh
    // setelah storage kosong), request ke BE tidak bisa dibentuk sesuai kontrak —
    // tampilkan state jelas dengan jalan kembali, bukan fetch dengan data bohong.
    if (!stored) {
      setMissingLocations(true);
      setErrorMessage('');
      setIsLoading(false);
      setRoutes([]);
      return;
    }

    let didCancel = false;
    setMissingLocations(false);
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
    <div className="flex min-h-screen flex-col text-neutral-900">
      <Navbar />
      <AlertViewport>
        {errorMessage && (
          <Alert status="error" title="Pencarian rute gagal" description={errorMessage} onClose={handleCloseAlert} />
        )}
      </AlertViewport>

      <main className="mx-auto w-full max-w-292.5 flex-1 px-4 pb-12 pt-8 sm:px-8 xl:px-0">
        <Link href="/beranda" className="inline-flex items-center gap-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">
          <BackArrowIcon /> Kembali ke Beranda
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-black">Rekomendasi Rute</h1>

        {/* Kartu lokasi awal → tujuan (design: kartu terpisah dari daftar rute) */}
        <section className="relative z-1 mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7" aria-label="Lokasi awal dan tujuan">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <CurrentLocationIcon className="h-12 w-12 shrink-0 sm:h-15 sm:w-15" />
              <div className="min-w-0">
                <p className="text-sm text-neutral-500">Lokasi awal</p>
                <p className="mt-1 truncate font-bold text-black">{originName}</p>
              </div>
            </div>

            <span className="hidden flex-1 items-center justify-center px-8 md:flex" aria-hidden="true">
              <DashedArrowRightIcon className="h-auto w-full" />
            </span>

            <div className="flex items-center gap-4 sm:justify-end">
              <DestinationLocationIcon className="h-12 w-12 shrink-0 sm:h-15 sm:w-15" />
              <div className="min-w-0">
                <p className="text-sm text-neutral-500">Tujuan</p>
                <p className="mt-1 truncate font-bold text-black">{destinationName}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Kartu filter + daftar rute: menyambung di bawah kartu lokasi. Sisi atasnya
            terselip 32px di balik kartu lokasi (-mt-8), jadi padding atas ditambah 32px. */}
        <section className="-mt-8 rounded-2xl border border-neutral-200 bg-white p-6 pt-17.5 shadow-sm sm:p-7 sm:pt-17.5" aria-labelledby="route-list-heading">
          <div className="mb-6">
            <p className="text-sm font-bold text-black">Urutkan rute berdasarkan</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Urutkan rute">
              {SORT_OPTIONS.map((option) => {
                const isActive = sortBy === option;
                const SortIcon = SORT_ICON[option];
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSortBy(option)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2 rounded-full border cursor-pointer px-4 py-2 text-sm font-medium transition-colors sm:px-5 ${isActive ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'}`}
                  >
                    <SortIcon />
                    {SORT_BY_LABEL[option]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grup 4: preferensi pencarian tambahan sesuai kontrak BE — tetap ada, ditata rapi
              dalam satu baris wrap (label di atas kontrol) agar ringkas seperti design. */}
          <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
            <div>
              <label htmlFor="max-walking-distance" className="text-sm font-bold text-black">Jarak jalan kaki maksimal</label>
              <select
                id="max-walking-distance"
                value={maxWalkingDistance}
                onChange={(event) => setMaxWalkingDistance(Number(event.target.value))}
                className="mt-3 block w-full cursor-pointer rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-primary-600 sm:w-auto"
              >
                {WALKING_DISTANCE_OPTIONS.map((meters) => (
                  <option key={meters} value={meters} >
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
                        className={`rounded-full border px-4 py-2 cursor-pointer text-sm font-medium transition-colors sm:px-5 ${isIncluded ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'}`}
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

          {missingLocations && (
            <div className="py-10 text-center">
              <p className="text-base font-semibold text-neutral-900">Data lokasi pencarian tidak ditemukan</p>
              <p className="mt-2 text-sm text-neutral-500">Halaman ini membutuhkan lokasi awal dan tujuan dari hasil pencarian. Silakan cari rute lagi dari halaman beranda.</p>
              <Link href="/beranda" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700">Kembali ke Beranda</Link>
            </div>
          )}

          {errorMessage && (
            <div className="mt-6">
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700">Coba Lagi</button>
            </div>
          )}

          {isLoading && (
            <div aria-hidden="true" className="mt-6 space-y-8">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex flex-wrap items-center gap-6 py-4">
                  <Skeleton variant="circle" className="h-12 w-12" />
                  <div className="min-w-45 flex-1 space-y-2"><Skeleton variant="text" className="h-5 w-40" /><Skeleton variant="text" className="h-4 w-64 max-w-full" /></div>
                  <Skeleton variant="text" className="h-5 w-24" />
                  <Skeleton variant="text" className="h-5 w-24" />
                  <Skeleton variant="rounded" className="h-9 w-32" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !errorMessage && !missingLocations && routes.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-base font-semibold text-neutral-900">Tidak ada rute ditemukan</p>
              <p className="mt-2 text-sm text-neutral-500">Coba ubah lokasi awal/tujuan atau kurangi filter pencarian, lalu cari lagi dari beranda.</p>
            </div>
          )}

          {!isLoading && !errorMessage && routes.length > 0 && (
            <div className="mt-4">
              {routes.map((route, index) => (
                <article
                  key={route.id}
                  className={`grid gap-5 py-6 md:grid-cols-[minmax(220px,1.45fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(150px,0.9fr)_auto] md:items-center md:gap-6 ${index > 0 ? 'border-t border-neutral-200' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <VehicleIcon type={route.type} className="h-13.5 w-13.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-black">{route.transportName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {route.badges.map((badge) => (
                          <span key={badge} className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${getRouteBadgeColor(badge)}`}>{badge}</span>
                        ))}
                        {(route.operator || (isOjekRoute(route.transportName) ? OJEK_OPERATOR_LABEL : '')) && (
                          <span className="text-sm text-neutral-500">
                            {route.operator || OJEK_OPERATOR_LABEL}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile: statistik jadi baris 3 kolom; desktop: kembali jadi kolom grid utama */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 md:contents">
                    <div>
                      <p className="text-sm text-neutral-500">Estimasi Biaya</p>
                      <p className="mt-1 font-bold text-black">{route.priceLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Estimasi Waktu</p>
                      <p className="mt-1 font-bold text-black">{route.durationLabel}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm text-neutral-500">Transit &amp; Jalan Kaki</p>
                      <p className="mt-1 flex items-center gap-1 whitespace-nowrap font-bold text-black">{route.transits} transit, <WalkingGlyphIcon className="h-3.5 w-auto" /> {route.walkingTime} menit</p>
                    </div>
                  </div>

                  <Link
                    href={`/cari-rute/${route.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:w-fit"
                  >
                    Lihat Detail <RightArrowIcon className="h-2.5 w-auto" color="white" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
