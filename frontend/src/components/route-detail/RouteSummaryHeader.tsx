'use client';

import { RouteOption } from '@/lib/types/route';
import { formatDuration, formatCurrency } from '@/lib/utils';
import { getRouteBadgeColor } from '@/lib/routeBadgeColor';
import { VehicleIcon } from '@/components/icons/vehicle/VehicleIcon';
import WalkingGlyphIcon from '@/components/icons/cari-rute/WalkingIcon';
import RightArrowIcon from '@/components/icons/cari-rute/RightArrowIcon';

interface RouteSummaryHeaderProps {
  route: RouteOption;
}

/**
 * Kartu ringkasan rute (design "Detail Rute"): ikon moda + judul asal → tujuan +
 * badge kode rute/operator, lalu tiga statistik (biaya, waktu, transit & jalan kaki).
 * Tautan kembali diproduksi halaman induk (di atas kartu ini).
 */
export function RouteSummaryHeader({ route }: RouteSummaryHeaderProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7" aria-label="Ringkasan rute">
      <div className="grid gap-6 lg:grid-cols-[minmax(240px,1fr)_minmax(380px,1.4fr)] lg:items-center">
        <div className="flex items-center gap-4">
          <VehicleIcon type={route.vehicleType} className="h-[54px] w-[54px] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-snug text-neutral-900">
              {route.originStopName} <RightArrowIcon className="inline-block h-2.5 w-auto align-middle mx-1" /> {route.destinationStopName}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {route.badges.map((badge) => (
                            <span key={badge} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${getRouteBadgeColor(badge)}`}>{badge}</span>
              ))}
              {route.operator && <span className="text-sm text-neutral-500">{route.operator}</span>}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          <div>
            <dt className="text-sm text-neutral-500">Estimasi Biaya</dt>
            <dd className="mt-1 font-bold text-neutral-900">{formatCurrency(route.totalCost)}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Estimasi Waktu</dt>
            <dd className="mt-1 font-bold text-neutral-900">{formatDuration(route.totalDurationMinutes)}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Transit &amp; Jalan Kaki</dt>
            <dd className="mt-1 whitespace-nowrap font-bold text-neutral-900">
              {route.transitCount} transit, <WalkingGlyphIcon className="inline-block h-3.5 w-auto align-middle" /> {route.walkingMinutes} menit
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
