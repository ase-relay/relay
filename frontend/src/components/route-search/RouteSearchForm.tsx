"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useRouteSearchInput } from "@/hooks/useRouteSearchInput";
import type { LocationSuggestion } from "@/services/mock/locationSearch";
import { LocationInput } from "./LocationInput";
import { SwapLocationsButton } from "./SwapLocationsButton";

export function RouteSearchForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { originQuery, destinationQuery, originSuggestions, destinationSuggestions, activeField, isLoadingOrigin, isLoadingDestination, selectedOrigin, selectedDestination, setOriginQuery, setDestinationQuery, setActiveField, setSelectedOrigin, setSelectedDestination, handleSelectSuggestion, handleSwap } = useRouteSearchInput();
  const currentLocation: LocationSuggestion = { id: "current-location", name: "Lokasi saya", district: "Lokasi saat ini" };

  function select(suggestion: LocationSuggestion, field: "origin" | "destination") {
    handleSelectSuggestion(suggestion, field);
    setError("");
  }
  function setCurrentLocation(field: "origin" | "destination") { select(currentLocation, field); }
  function search() {
    if (!selectedOrigin || !selectedDestination) { setError("Pilih lokasi awal dan tujuan dari daftar saran."); return; }
    if (selectedOrigin.id === selectedDestination.id) { setError("Lokasi awal dan tujuan tidak boleh sama."); return; }
    router.push(`/cari-rute?origin=${encodeURIComponent(selectedOrigin.id)}&destination=${encodeURIComponent(selectedDestination.id)}`);
  }

  return <div className="w-full max-w-[652px] rounded-3xl bg-white p-7 shadow-[0_8px_22px_rgba(15,23,42,0.12)] sm:p-14">
    <div className="relative space-y-7">
      <div className="absolute top-8 -left-6 h-13 border-l-2 border-dashed border-neutral-300" />
      <LocationInput id="origin" kind="origin" value={originQuery} placeholder="Pilih lokasi awal ..." isActive={activeField === "origin"} suggestions={originSuggestions} isLoading={isLoadingOrigin} onChange={(value) => { setOriginQuery(value); setSelectedOrigin(null); setError(""); }} onFocus={() => setActiveField("origin")} onBlur={() => setTimeout(() => setActiveField(null), 180)} onSelect={(item) => select(item, "origin")} onUseCurrentLocation={() => setCurrentLocation("origin")} />
      <SwapLocationsButton onClick={() => { handleSwap(); setError(""); }} />
      <LocationInput id="destination" kind="destination" value={destinationQuery} placeholder="Pilih lokasi tujuan ..." isActive={activeField === "destination"} suggestions={destinationSuggestions} isLoading={isLoadingDestination} onChange={(value) => { setDestinationQuery(value); setSelectedDestination(null); setError(""); }} onFocus={() => setActiveField("destination")} onBlur={() => setTimeout(() => setActiveField(null), 180)} onSelect={(item) => select(item, "destination")} onUseCurrentLocation={() => setCurrentLocation("destination")} />
    </div>
    {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
    <button type="button" onClick={search} className="mt-9 flex h-15 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary-600 text-base font-semibold text-white transition hover:bg-primary-700"><HiOutlineMagnifyingGlass className="h-6 w-6" />Cari Rute</button>
  </div>;
}
