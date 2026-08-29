'use client';

import { useRouter } from 'next/navigation';
import { useRouteSearchInput } from '@/hooks/useRouteSearchInput';

export function RouteSearchForm() {
  const router = useRouter();
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
    handleSelectSuggestion,
    handleSwap,
  } = useRouteSearchInput();

  const handleSearch = () => {
    if (selectedOrigin && selectedDestination) {
      router.push(`/cari-rute?origin=${selectedOrigin.id}&destination=${selectedDestination.id}`);
    }
  };

  const isSearchDisabled = !selectedOrigin || !selectedDestination;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        {/* Origin Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full" />
            <input
              type="text"
              placeholder="Dari mana?"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              onFocus={() => setActiveField('origin')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {activeField === 'origin' && originSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {originSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion, 'origin')}
                  className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-neutral-800">{suggestion.name}</div>
                  <div className="text-sm text-neutral-500">{suggestion.district}</div>
                </div>
              ))}
            </div>
          )}

          {isLoadingOrigin && activeField === 'origin' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-4 py-3 text-sm text-neutral-500">
              Mencari...
            </div>
          )}
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="shrink-0 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Tukar lokasi"
        >
          <svg
            className="w-6 h-6 text-neutral-600"
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
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
            <input
              type="text"
              placeholder="Ke mana?"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              onFocus={() => setActiveField('destination')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {activeField === 'destination' && destinationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {destinationSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion, 'destination')}
                  className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-neutral-800">{suggestion.name}</div>
                  <div className="text-sm text-neutral-500">{suggestion.district}</div>
                </div>
              ))}
            </div>
          )}

          {isLoadingDestination && activeField === 'destination' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-4 py-3 text-sm text-neutral-500">
              Mencari...
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearchDisabled}
          className="shrink-0 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed font-medium"
        >
          Cari Rute
        </button>
      </div>
    </div>
  );
}
