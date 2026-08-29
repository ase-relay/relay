'use client';

import React from 'react';
import { RouteSegment } from '@/lib/types/route';
import { transportModes } from '@/lib/mock/transportModes';

interface TripStepListProps {
  segments: RouteSegment[];
  originStopName: string;
  destinationStopName: string;
}

export function TripStepList({ segments, originStopName, destinationStopName }: TripStepListProps) {
  const getDotColor = (index: number, totalSteps: number, modeId?: string | null): string => {
    // First step (origin) - green
    if (index === 0) return '#10b981';
    // Last step (destination) - red
    if (index === totalSteps - 1) return '#ef4444';
    // Transit points - use mode color
    if (modeId) {
      const mode = transportModes.find(m => m.id === modeId);
      return mode?.colorHex || '#64748b';
    }
    return '#64748b';
  };

  // Build timeline steps: origin + each segment's destination
  const timelineSteps = [
    {
      id: 'origin',
      time: segments[0]?.departureTime || '--:--',
      location: originStopName,
      instruction: 'Titik keberangkatan',
      modeId: null,
      isOrigin: true,
      isDestination: false
    },
    ...segments.map((segment) => ({
      id: segment.id,
      time: segment.departureTime,
      location: segment.toStopName,
      instruction: segment.instruction,
      modeId: segment.modeId,
      isOrigin: false,
      isDestination: segment.toStopName === destinationStopName
    }))
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Rincian Perjalanan</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-neutral-200" />

        {/* Timeline steps */}
        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const dotColor = getDotColor(index, timelineSteps.length, step.modeId);

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Dot */}
                <div
                  className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: dotColor }}
                >
                  {step.isOrigin && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {step.isDestination && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {!step.isOrigin && !step.isDestination && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-neutral-900">
                      {step.location}
                    </span>
                    <span className="text-sm text-neutral-600 whitespace-nowrap">
                      {step.time}
                    </span>
                  </div>
                  {step.instruction && !step.isOrigin && !step.isDestination && (
                    <p className="text-sm text-neutral-500">
                      {step.instruction}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footnote */}
      <div className="pt-4 mt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500 italic">
          *Estimasi waktu dan biaya dapat berubah tergantung kondisi lalu lintas.
        </p>
      </div>
    </div>
  );
}
