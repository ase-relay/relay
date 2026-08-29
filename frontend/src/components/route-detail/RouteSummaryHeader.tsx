'use client';

import React from 'react';
import { RouteOption } from '@/lib/types/route';
import { formatDuration, formatCurrency } from '@/lib/utils';
import { RouteTagBadge } from '@/components/route-search/RouteTagBadge';

interface RouteSummaryHeaderProps {
  route: RouteOption;
  onBack: () => void;
}

export function RouteSummaryHeader({ route, onBack }: RouteSummaryHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Header with back button */}
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

      {/* Route summary card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
        {/* Route label and tag */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">{route.label}</h2>
          <RouteTagBadge tag={route.tag} />
        </div>

        {/* Large info cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-900 mb-1">
              {formatDuration(route.totalDurationMinutes)}
            </div>
            <div className="text-sm text-neutral-600 font-medium">Durasi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-900 mb-1">
              {formatCurrency(route.totalCost)}
            </div>
            <div className="text-sm text-neutral-600 font-medium">Estimasi Biaya</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-900 mb-1">
              {route.transitCount}
            </div>
            <div className="text-sm text-neutral-600 font-medium">Jumlah Transit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
