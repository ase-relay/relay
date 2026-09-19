"use client";

import type { LocationSuggestion } from "@/services/mock/locationSearch";
import { HiOutlineMapPin } from "react-icons/hi2";
import { LocationSuggestions } from "./LocationSuggestions";

type LocationInputProps = {
  id: string;
  kind: "origin" | "destination";
  value: string;
  placeholder: string;
  isActive: boolean;
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  onUseCurrentLocation: () => void;
};

export function LocationInput({ id, kind, value, placeholder, isActive, suggestions, isLoading, onChange, onFocus, onBlur, onSelect, onUseCurrentLocation }: LocationInputProps) {
  const isOrigin = kind === "origin";
  return (
    <div className="relative">
      {isOrigin ? <span className="absolute top-1/2 -left-9 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-neutral-400 bg-white" /> : <HiOutlineMapPin className="absolute top-1/2 -left-9 h-6 w-6 -translate-y-1/2 text-neutral-400" />}
      <label htmlFor={id} className="sr-only">{isOrigin ? "Lokasi awal" : "Lokasi tujuan"}</label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder} autoComplete="off" className="h-15 w-full rounded-2xl border border-neutral-300 bg-white px-5 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100" />
      {isActive && <LocationSuggestions suggestions={suggestions} isLoading={isLoading} onSelect={onSelect} onUseCurrentLocation={onUseCurrentLocation} />}
    </div>
  );
}
