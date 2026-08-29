'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useRouteSearchInput } from '@/hooks/useRouteSearchInput';
import { searchLocationMock, LocationSuggestion } from '@/services/mock/locationSearch';
import { stops } from '@/lib/mock/stops';

function CompactSearchBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    originQuery,
    destinationQuery,
    originSuggestions,
    destinationSuggestions,
    activeField,
    isLoadingOrigin,
    isLoadingDestination,
    selectedOrigin,
    selectedDestination,
    setOriginQuery,
    setDestinationQuery,
    setActiveField,
    setSelectedOrigin,
    setSelectedDestination,
    handleSelectSuggestion,
    handleSwap,
    handleReset,
  } = useRouteSearchInput();

  // Initialize from query params
  useEffect(() => {
    const originId = searchParams.get('origin');
    const destinationId = searchParams.get('destination');

    if (originId) {
      const originStop = stops.find(s => s.id === originId);
      if (originStop) {
        setOriginQuery(originStop.name);
        setSelectedOrigin({
          id: originStop.id,
          name: originStop.name,
          district: originStop.district,
        });
      }
    }

    if (destinationId) {
      const destinationStop = stops.find(s => s.id === destinationId);
      if (destinationStop) {
        setDestinationQuery(destinationStop.name);
        setSelectedDestination({
          id: destinationStop.id,
          name: destinationStop.name,
          district: destinationStop.district,
        });
      }
    }
  }, [searchParams, setOriginQuery, setDestinationQuery, setSelectedOrigin, setSelectedDestination]);

  const handleSearch = () => {
    if (selectedOrigin && selectedDestination) {
      router.push(`/cari-rute?origin=${selectedOrigin.id}&destination=${selectedDestination.id}`);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const isSearchDisabled = !selectedOrigin || !selectedDestination;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="shrink-0 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Kembali"
        >
          <svg
            className="w-5 h-5 text-neutral-600"
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

        {/* Origin Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full" />
            <input
              type="text"
              placeholder="Dari"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              onFocus={() => setActiveField('origin')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              className="w-full pl-6 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {activeField === 'origin' && originSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {originSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion, 'origin')}
                  className="px-3 py-2 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-neutral-800 text-sm">{suggestion.name}</div>
                  <div className="text-xs text-neutral-500">{suggestion.district}</div>
                </div>
              ))}
            </div>
          )}

          {isLoadingOrigin && activeField === 'origin' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2 text-xs text-neutral-500">
              Mencari...
            </div>
          )}
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="shrink-0 p-1 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Tukar lokasi"
        >
          <svg
            className="w-4 h-4 text-neutral-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        {/* Destination Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
            <input
              type="text"
              placeholder="Ke"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              onFocus={() => setActiveField('destination')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              className="w-full pl-6 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {activeField === 'destination' && destinationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {destinationSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion, 'destination')}
                  className="px-3 py-2 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-neutral-800 text-sm">{suggestion.name}</div>
                  <div className="text-xs text-neutral-500">{suggestion.district}</div>
                </div>
              ))}
            </div>
          )}

          {isLoadingDestination && activeField === 'destination' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2 text-xs text-neutral-500">
              Mencari...
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearchDisabled}
          className="shrink-0 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          Cari
        </button>
      </div>
    </div>
  );
}

export function CompactSearchBar() {
  return (
    <Suspense fallback={<div className="bg-white rounded-lg shadow p-4">Loading...</div>}>
      <CompactSearchBarContent />
    </Suspense>
  );
}
