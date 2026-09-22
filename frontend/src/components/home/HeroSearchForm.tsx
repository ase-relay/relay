'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRouteSearchInput } from '@/hooks/useRouteSearchInput';
import { saveRouteSearchLocations } from '@/lib/routeSearchTransfer';

export function HeroSearchForm() {
  const router = useRouter();
  const [error, setError] = useState('');
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
  } = useRouteSearchInput();

  const handleSearch = () => {
    if (!selectedOrigin || !selectedDestination) {
      setError('Pilih lokasi awal dan tujuan dari daftar saran.');
      return;
    }
    if (selectedOrigin.id === selectedDestination.id) {
      setError('Lokasi awal dan tujuan tidak boleh sama.');
      return;
    }
    // Bawa objek lokasi lengkap (name + lat + lng) via sessionStorage agar halaman cari-rute
    // punya data koordinat yang dibutuhkan kontrak request BE. Nama lokasi ikut di query string
    // sebagai fallback tampilan bila storage tidak tersedia.
    saveRouteSearchLocations(selectedOrigin, selectedDestination);
    router.push(`/cari-rute?origin=${encodeURIComponent(selectedOrigin.name)}&destination=${encodeURIComponent(selectedDestination.name)}`);
  };

  const isSearchDisabled = !selectedOrigin || !selectedDestination;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
      <div className="relative">
        {/* Garis putus-putus penghubung */}
        <div className="absolute left-3 top-6 bottom-19 w-px border-l-2 border-dashed border-neutral-300" />

        {/* Input lokasi awal */}
        <div className="relative mb-3">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-neutral-400 bg-white" />
          <input
            type="text"
            placeholder="Pilih lokasi awal ..."
            value={originQuery}
            onChange={(e) => { setOriginQuery(e.target.value); setSelectedOrigin(null); setError(''); }}
            onFocus={() => setActiveField('origin')}
            onBlur={() => setTimeout(() => setActiveField(null), 200)}
            className="w-full pl-9 pr-4 py-3.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
          />

          {activeField === 'origin' && originSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {originSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion, 'origin')}
                  className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-neutral-800 text-sm">{suggestion.name}</div>
                  <div className="text-xs text-neutral-500">{suggestion.district}</div>
                </div>
              ))}
            </div>
          )}

          {isLoadingOrigin && activeField === 'origin' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-4 py-2.5 text-xs text-neutral-500">
              Mencari...
            </div>
          )}
        </div>

        {/* Tombol tukar lokasi */}
        <button
          type="button"
          onClick={() => { handleSwap(); setError(''); }}
          aria-label="Tukar lokasi"
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        {/* Input lokasi tujuan */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.69 18.933a.75.75 0 00.62 0c.058-.026.155-.07.286-.138a17.62 17.62 0 002.712-1.688A16.28 16.28 0 0016 12.988c.99-1.532 1.75-3.235 1.75-5A7.75 7.75 0 002 7.987c0 1.766.76 3.469 1.75 5a16.28 16.28 0 003.692 4.119 17.618 17.618 0 002.712 1.688 9.36 9.36 0 00.286.138zM10 10.362a2.375 2.375 0 100-4.75 2.375 2.375 0 000 4.75z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Pilih tujuan ..."
            value={destinationQuery}
            onChange={(e) => { setDestinationQuery(e.target.value); setSelectedDestination(null); setError(''); }}
            onFocus={() => setActiveField('destination')}
            onBlur={() => setTimeout(() => setActiveField(null), 200)}
            className="w-full pl-9 pr-4 py-3.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
          />

          {activeField === 'destination' && destinationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {destinationSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion, 'destination')}
                  className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-neutral-800 text-sm">{suggestion.name}</div>
                  <div className="text-xs text-neutral-500">{suggestion.district}</div>
                </div>
              ))}
            </div>
          )}

          {isLoadingDestination && activeField === 'destination' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg px-4 py-2.5 text-xs text-neutral-500">
              Mencari...
            </div>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <button
        onClick={handleSearch}
        disabled={isSearchDisabled}
        className="w-full flex items-center justify-center gap-2 bg-accent-blue text-white py-3.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:bg-neutral-300 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        Cari Rute
      </button>
    </div>
  );
}