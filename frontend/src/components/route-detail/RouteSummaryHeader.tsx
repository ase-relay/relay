'use client';

import { RouteOption } from '@/lib/types/route';
import { formatDuration, formatCurrency } from '@/lib/utils';
import { VehicleIcon } from '@/components/icons/vehicle/VehicleIcon';

interface RouteSummaryHeaderProps {
  route: RouteOption;
  onBack: () => void;
}

export function RouteSummaryHeader({ route, onBack }: RouteSummaryHeaderProps) {
  const walkingMinutes = route.segments.reduce(
    (total, segment) => total + (segment.walkingDurationMinutes ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Kembali"
        >
          <svg
            className="w-5 h-5 text-neutral-700"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Detail Rute</h1>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm" aria-label="Ringkasan rute">
        <div className="grid gap-6 xl:grid-cols-[minmax(270px,1.2fr)_minmax(390px,1fr)] xl:items-center">
          <div className="flex items-center gap-4">
            <VehicleIcon type="bus" />
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-snug text-neutral-900">
                {route.originStopName} <span aria-hidden="true">→</span> {route.destinationStopName}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-700 px-2.5 py-0.5 text-xs font-semibold text-white">3D</span>
                <span className="text-sm text-neutral-500">Metro Jabar Trans</span>
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
              <dd className="mt-1 font-bold text-neutral-900">{route.transitCount} transit, {walkingMinutes} menit</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
