"use client";

import type { LocationSuggestion } from "@/services/mock/locationSearch";
import { HiOutlineClock, HiOutlineMapPin } from "react-icons/hi2";

type LocationSuggestionItemProps = {
  suggestion: LocationSuggestion;
  onSelect: (suggestion: LocationSuggestion) => void;
  isCurrentLocation?: boolean;
  /** True saat lokasi perangkat sedang dideteksi (menampilkan teks "Mendeteksi..."). */
  isLoading?: boolean;
};

export function LocationSuggestionItem({ suggestion, onSelect, isCurrentLocation = false, isLoading = false }: LocationSuggestionItemProps) {
  return (
    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(suggestion)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary-50">
      {isCurrentLocation ? <HiOutlineMapPin className="h-5 w-5 shrink-0 text-neutral-900" /> : <HiOutlineClock className="h-5 w-5 shrink-0 text-neutral-400" />}
      <span className="min-w-0"><span className="block truncate text-sm font-medium text-neutral-900">{isLoading ? "Mendeteksi lokasi..." : suggestion.name}</span>{suggestion.district && <span className="block truncate text-xs text-neutral-500">{suggestion.district}</span>}</span>
      {!isCurrentLocation && <HiOutlineMapPin className="ml-auto h-4 w-4 shrink-0 text-neutral-300" />}
    </button>
  );
}
