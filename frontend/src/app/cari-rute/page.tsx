'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { VehicleIcon, VehicleType } from '@/components/icons/vehicle/VehicleIcon';

type SortOption = 'termurah' | 'tercepat';

type RouteRecommendation = {
  id: string;
  type: VehicleType;
  transportName: string;
  operator: string;
  badges: string[];
  price: number;
  priceLabel: string;
  duration: number;
  durationLabel: string;
  transits: number;
  walkingTime: number;
};

const routeRecommendations: RouteRecommendation[] = [
  { id: 'route-2', type: 'bus', transportName: 'Bus', operator: 'Metro Jabar Trans', badges: ['3D'], price: 4900, priceLabel: 'Rp4.900', duration: 60, durationLabel: '60 menit', transits: 0, walkingTime: 6 },
  { id: 'route-4', type: 'bus', transportName: 'Bus', operator: 'Metro Jabar Trans', badges: ['3D', 'FD-1'], price: 9800, priceLabel: 'Rp9.800', duration: 90, durationLabel: '90 menit', transits: 1, walkingTime: 20 },
  { id: 'route-3', type: 'train', transportName: 'Kereta', operator: 'KRL Commuter Line', badges: [], price: 7000, priceLabel: 'Rp7.000', duration: 40, durationLabel: '40 menit', transits: 2, walkingTime: 5 },
  { id: 'route-3', type: 'motorcycle', transportName: 'Ojek Online', operator: 'GrabBike / GoRide', badges: [], price: 16000, priceLabel: 'Rp16.000', duration: 25, durationLabel: '25 menit', transits: 0, walkingTime: 0 },
];

function WalkingIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="inline-block h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="1.5" /><path d="m10 21 1-6-3-2 2-4 2 2 3-1M14 12l2 3 3 1" /></svg>;
}

export default function CariRutePage() {
  const [sortBy, setSortBy] = useState<SortOption>('termurah');

  const sortedRoutes = useMemo(() => [...routeRecommendations].sort((first, second) => sortBy === 'termurah' ? first.price - second.price : first.duration - second.duration), [sortBy]);

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
              <div><p className="text-sm text-neutral-500">Lokasi awal</p><p className="mt-1 font-bold text-black">Telkom University</p></div>
            </div>

            <div className="hidden items-center gap-2 text-neutral-400 md:flex" aria-hidden="true"><span className="w-full border-t-2 border-dashed border-neutral-300" /><span>→</span></div>

            <div className="flex items-center gap-5 md:justify-self-end">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500"><svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg></span>
              <div><p className="text-sm text-neutral-500">Tujuan</p><p className="mt-1 font-bold text-black">Bandung Electronic Center (BEC)</p></div>
            </div>
          </header>

          <div className="p-7 md:p-8">
            <div className="mb-8">
              <p className="text-sm font-bold text-black">Urutkan rute berdasarkan</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Urutkan rute">
                {(['termurah', 'tercepat'] as const).map((option) => {
                  const isActive = sortBy === option;
                  const label = option === 'termurah' ? 'Termurah' : 'Tercepat';
                  return <button key={option} type="button" onClick={() => setSortBy(option)} aria-pressed={isActive} className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${isActive ? 'border-neutral-200 bg-neutral-100 text-neutral-900' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'}`}>{label}</button>;
                })}
              </div>
            </div>

            <h2 id="route-list-heading" className="sr-only">Daftar rekomendasi rute</h2>
            <div>
              {sortedRoutes.map((route, index) => (
                <article key={`${route.type}-${route.id}-${index}`} className={`grid gap-6 py-7 md:grid-cols-[minmax(220px,1.45fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)_minmax(150px,0.9fr)_auto] md:items-center ${index < sortedRoutes.length - 1 ? 'border-b border-neutral-200' : ''}`}>
                  <div className="flex items-center gap-4"><VehicleIcon type={route.type} /><div><p className="font-bold text-black">{route.transportName}</p><div className="mt-2 flex flex-wrap items-center gap-2">{route.badges.map((badge) => <span key={badge} className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${badge === 'FD-1' ? 'bg-emerald-500' : 'bg-purple-700'}`}>{badge}</span>)}<span className="text-sm text-neutral-500">{route.operator}</span></div></div></div>
                  <div><p className="text-sm text-neutral-500">Estimasi Biaya</p><p className="mt-2 font-bold text-black">{route.priceLabel}</p></div>
                  <div><p className="text-sm text-neutral-500">Estimasi Waktu</p><p className="mt-2 font-bold text-black">{route.durationLabel}</p></div>
                  <div><p className="text-sm text-neutral-500">Transit &amp; Jalan Kaki</p><p className="mt-2 flex items-center gap-1 font-bold text-black">{route.transits} transit, <WalkingIcon /> {route.walkingTime} menit</p></div>
                  <Link href={`/cari-rute/${route.id}`} className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700">Lihat Detail <span aria-hidden="true">›</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
