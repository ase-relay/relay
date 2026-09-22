"use client";

import type { LocationSuggestion } from "@/services/mock/locationSearch";
import { LocationSuggestionItem } from "./LocationSuggestionItem";

type LocationSuggestionsProps = {
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  onSelect: (suggestion: LocationSuggestion) => void;
  onUseCurrentLocation: () => void;
  /** True saat koordinat perangkat sedang dideteksi via navigator.geolocation. */
  isLocating?: boolean;
};

export function LocationSuggestions({ suggestions, isLoading, onSelect, onUseCurrentLocation, isLocating = false }: LocationSuggestionsProps) {
  const currentLocationLabel: Pick<LocationSuggestion, "id" | "name" | "district"> = { id: "current-location", name: "Lokasi saya", district: "Gunakan lokasi perangkat" };
  return (
    <div className="absolute top-[calc(100%+0.5rem)] left-0 z-30 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
      <LocationSuggestionItem
        suggestion={currentLocationLabel as LocationSuggestion}
        isCurrentLocation
        isLoading={isLocating}
        onSelect={() => onUseCurrentLocation()}
      />
      <div className="mx-4 border-t border-neutral-100" />
      {isLoading ? <p className="px-4 py-3 text-sm text-neutral-500">Mencari lokasi...</p> : suggestions.length > 0 ? suggestions.map((suggestion) => <LocationSuggestionItem key={suggestion.id} suggestion={suggestion} onSelect={onSelect} />) : <p className="px-4 py-3 text-sm text-neutral-500">Ketik minimal 2 huruf untuk mencari lokasi.</p>}
    </div>
  );
}
