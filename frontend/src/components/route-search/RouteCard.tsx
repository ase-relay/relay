'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RouteOption } from '@/lib/types/route';
import { transportModes } from '@/lib/mock/transportModes';
import { formatDuration, formatCurrency } from '@/lib/utils';
import { RouteTagBadge } from './RouteTagBadge';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: (routeId: string) => void;
}

const getModeIcon = (modeId: string): string => {
  const iconMap: Record<string, string> = {
    walking: '🚶',
    angkot: '🚐',
    bus: '🚌',
    krl: '🚆',
    ojek: '🏍️',
  };
  return iconMap[modeId] || '🚌';
};

export function RouteCard({ route, isSelected, onSelect }: RouteCardProps) {
  const router = useRouter();

  const handleNavigateToDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/cari-rute/${route.id}`);
  };

  return (
    <div
      onClick={() => onSelect(route.id)}
      className={`
        bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-primary-600 border-primary-600' : 'border border-neutral-200 hover:shadow-md'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-neutral-900">{route.label}</h3>
        <RouteTagBadge tag={route.tag} />
      </div>

      {/* Transport Mode Icons */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {route.segments.map((segment, index) => {
          const mode = transportModes.find(m => m.id === segment.modeId);
          return (
            <div key={segment.id} className="flex items-center gap-1">
              <span
                className="text-lg"
                title={mode?.name || segment.modeId}
              >
                {getModeIcon(segment.modeId)}
              </span>
              {index < route.segments.length - 1 && (
                <span className="text-neutral-400 text-sm">→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">
            {formatDuration(route.totalDurationMinutes)}
          </div>
          <div className="text-xs text-neutral-500">Durasi</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">
            {formatCurrency(route.totalCost)}
          </div>
          <div className="text-xs text-neutral-500">Biaya</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">
            {route.transitCount}
          </div>
          <div className="text-xs text-neutral-500">Transit</div>
        </div>
      </div>

      {/* Chevron */}
      <div className="flex justify-end">
        <button
          onClick={handleNavigateToDetail}
          className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Lihat detail rute"
        >
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
