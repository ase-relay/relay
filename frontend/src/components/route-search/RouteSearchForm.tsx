"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useRouteSearchInput } from "@/hooks/useRouteSearchInput";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { saveRouteSearchLocations } from "@/lib/routeSearchTransfer";
import type { LocationSuggestion } from "@/services/mock/locationSearch";
import { LocationInput } from "./LocationInput";
import { SwapLocationsButton } from "./SwapLocationsButton";

export function RouteSearchForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { originQuery, destinationQuery, originSuggestions, destinationSuggestions, activeField, isLoadingOrigin, isLoadingDestination, selectedOrigin, selectedDestination, setOriginQuery, setDestinationQuery, setActiveField, setSelectedOrigin, setSelectedDestination, handleSelectSuggestion, handleSwap } = useRouteSearchInput();
  const { isLocating, getCurrentLocation } = useCurrentLocation();

  function select(suggestion: LocationSuggestion, field: "origin" | "destination") {
    handleSelectSuggestion(suggestion, field);
    setError("");
  }

  // Koordinat ASLI perangkat via navigator.geolocation — bukan lagi placeholder (0,0).
  // Lihat "⚠️ Catatan Tambahan" di TODO-integrasi-routing-search.md.
  async function setCurrentLocation(field: "origin" | "destination") {
    setError("");
    try {
      const location = await getCurrentLocation();
      select(location, field);
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : "Lokasi perangkat tidak dapat dideteksi.");
    }
  }

  function search() {
    if (!selectedOrigin || !selectedDestination) { setError("Pilih lokasi awal dan tujuan dari daftar saran."); return; }
    if (selectedOrigin.id === selectedDestination.id) { setError("Lokasi awal dan tujuan tidak boleh sama."); return; }
    // Bawa objek lokasi lengkap (name + lat + lng) via sessionStorage agar halaman cari-rute
    // punya data koordinat yang dibutuhkan kontrak request BE. Nama lokasi ikut di query string
    // sebagai fallback tampilan bila storage tidak tersedia.
    saveRouteSearchLocations(selectedOrigin, selectedDestination);
    router.push(`/cari-rute?origin=${encodeURIComponent(selectedOrigin.name)}&destination=${encodeURIComponent(selectedDestination.name)}`);
  }

  return <div className="w-full max-w-163 rounded-3xl bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.12)] sm:p-7 lg:p-14">
    <div className="relative space-y-5 sm:space-y-7">
      <div className="absolute top-6 -left-4 h-12 border-l-2 border-dashed border-neutral-300 sm:top-8 sm:-left-6 sm:h-13" />
      <LocationInput id="origin" kind="origin" value={originQuery} placeholder="Pilih lokasi awal ..." isActive={activeField === "origin"} suggestions={originSuggestions} isLoading={isLoadingOrigin} onChange={(value) => { setOriginQuery(value); setSelectedOrigin(null); setError(""); }} onFocus={() => setActiveField("origin")} onBlur={() => setTimeout(() => setActiveField(null), 180)} onSelect={(item) => select(item, "origin")} onUseCurrentLocation={() => setCurrentLocation("origin")} />
      <SwapLocationsButton onClick={() => { handleSwap(); setError(""); }} />
      <LocationInput id="destination" kind="destination" value={destinationQuery} placeholder="Pilih lokasi tujuan ..." isActive={activeField === "destination"} suggestions={destinationSuggestions} isLoading={isLoadingDestination} onChange={(value) => { setDestinationQuery(value); setSelectedDestination(null); setError(""); }} onFocus={() => setActiveField("destination")} onBlur={() => setTimeout(() => setActiveField(null), 180)} onSelect={(item) => select(item, "destination")} onUseCurrentLocation={() => setCurrentLocation("destination")} />
    </div>
    {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
    <button type="button" onClick={search} className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary-600 text-sm font-semibold text-white transition hover:bg-primary-700 sm:mt-9 sm:h-15 sm:text-base"><HiOutlineMagnifyingGlass className="h-5 w-5 sm:h-6 sm:w-6" />Cari Rute</button>
  </div>;
}
