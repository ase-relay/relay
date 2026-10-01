"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { HiArrowPath, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { useRouteSearchInput } from "@/hooks/useRouteSearchInput";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { RouteSearchHistoryItem } from "@/lib/routeSearchHistory";
import { saveRouteSearchLocations } from "@/lib/routeSearchTransfer";
import { distanceMeters } from "@/lib/utils";
import {
  isAbortError,
  locationErrorMessage,
  resolveTypedLocation,
  type LocationSuggestion,
} from "@/services/locationSearch";
import { LocationInput } from "./LocationInput";
import { SwapLocationsButton } from "./SwapLocationsButton";

type Field = "origin" | "destination";
type FieldErrors = { origin?: string; destination?: string };

/** Dua lokasi dengan jarak < 50 m dianggap lokasi yang sama. */
const SAME_LOCATION_METERS = 50;

export function RouteSearchForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    originQuery,
    destinationQuery,
    originSuggestions,
    destinationSuggestions,
    activeField,
    isLoadingOrigin,
    isLoadingDestination,
    originSearchError,
    destinationSearchError,
    selectedOrigin,
    selectedDestination,
    history,
    setOriginQuery,
    setDestinationQuery,
    setActiveField,
    setSelectedOrigin,
    setSelectedDestination,
    handleSelectSuggestion,
    handleSwap,
    saveLocationsToHistory,
    removeHistoryItem,
    clearHistory,
  } = useRouteSearchInput(user?.id ?? null);
  const { isLocating, getCurrentLocation } = useCurrentLocation();

  const closeDropdown = useCallback(() => setActiveField(null), [setActiveField]);

  function clearFieldError(field: Field) {
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function select(suggestion: LocationSuggestion, field: Field) {
    handleSelectSuggestion(suggestion, field);
    clearFieldError(field);
    setFormError("");
  }

  function selectHistory(item: RouteSearchHistoryItem, field: Field) {
    select(
      { id: item.id, name: item.name, district: item.district, lat: item.lat, lng: item.lng },
      field,
    );
  }

  // Koordinat ASLI perangkat via navigator.geolocation (tanpa cache lama).
  async function setCurrentLocation(field: Field) {
    if (isLocating) return;
    clearFieldError(field);
    setFormError("");
    try {
      const location = await getCurrentLocation();
      select(location, field);
    } catch (locationError) {
      setFieldErrors((previous) => ({
        ...previous,
        [field]:
          locationError instanceof Error
            ? locationError.message
            : "Lokasi perangkat tidak dapat dideteksi.",
      }));
    }
  }

  async function search() {
    if (isSubmitting) return;
    setFormError("");

    const originText = originQuery.trim();
    const destinationText = destinationQuery.trim();
    const nextErrors: FieldErrors = {};
    if (!originText) nextErrors.origin = "Lokasi awal belum diisi.";
    if (!destinationText) nextErrors.destination = "Lokasi tujuan belum diisi.";
    if (nextErrors.origin || nextErrors.destination) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    setActiveField(null);
    try {
      let origin = selectedOrigin;
      let destination = selectedDestination;

      // User boleh langsung menekan "Cari Rute" tanpa memilih saran:
      // teks yang belum terpilih di-resolve ke lokasi teratas geocoder.
      if (!origin) {
        try {
          origin = await resolveTypedLocation(originText);
        } catch (resolveError) {
          if (isAbortError(resolveError)) return;
          setFieldErrors({ origin: locationErrorMessage(resolveError) });
          return;
        }
        handleSelectSuggestion(origin, "origin");
      }

      if (!destination) {
        try {
          destination = await resolveTypedLocation(destinationText);
        } catch (resolveError) {
          if (isAbortError(resolveError)) return;
          setFieldErrors({ destination: locationErrorMessage(resolveError) });
          return;
        }
        handleSelectSuggestion(destination, "destination");
      }

      if (distanceMeters(origin, destination) < SAME_LOCATION_METERS) {
        setFormError("Lokasi awal dan tujuan tidak boleh sama.");
        return;
      }

      // Simpan riwayat (tanpa "Lokasi saya"), lalu bawa objek lokasi lengkap
      // (name + lat + lng) ke halaman cari-rute lewat sessionStorage.
      saveLocationsToHistory(origin, destination);
      saveRouteSearchLocations(origin, destination);
      router.push(
        `/cari-rute?origin=${encodeURIComponent(origin.name)}&destination=${encodeURIComponent(destination.name)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-163 rounded-3xl bg-white p-8 shadow-[0_8px_22px_rgba(15,23,42,0.12)] sm:p-11 lg:p-14">
      <div className="relative space-y-5 sm:space-y-7">
        {/* Penghubung tepat di sumbu ikon rail (mobile x = -12px, sm x = -22px),
            membentang dari bawah ikon origin ke atas ikon destination.
            Mobile: input h-12 & ikon 24px → 36→80. sm: input h-15 & ikon 28px → 44→104. */}
        <div
          aria-hidden="true"
          className="absolute top-9 -left-3 h-11 -translate-x-1/2 border-l-2 border-dashed border-neutral-300 sm:top-11 sm:-left-[22px] sm:h-15"
        />
        <LocationInput
          id="origin"
          kind="origin"
          value={originQuery}
          placeholder="Pilih lokasi awal ..."
          isActive={activeField === "origin"}
          suggestions={originSuggestions}
          isLoading={isLoadingOrigin}
          isLocating={isLocating}
          error={fieldErrors.origin}
          searchError={originSearchError}
          history={history}
          otherFieldValue={destinationQuery}
          onChange={(value) => {
            setOriginQuery(value);
            setSelectedOrigin(null);
            clearFieldError("origin");
            setFormError("");
          }}
          onFocus={() => setActiveField("origin")}
          onClose={closeDropdown}
          onSelect={(item) => select(item, "origin")}
          onSelectHistory={(item) => selectHistory(item, "origin")}
          onRemoveHistory={removeHistoryItem}
          onClearHistory={clearHistory}
          onUseCurrentLocation={() => setCurrentLocation("origin")}
          onSubmit={search}
        />
        <SwapLocationsButton
          onClick={() => {
            handleSwap();
            setFieldErrors({});
            setFormError("");
          }}
        />
        <LocationInput
          id="destination"
          kind="destination"
          value={destinationQuery}
          placeholder="Pilih lokasi tujuan ..."
          isActive={activeField === "destination"}
          suggestions={destinationSuggestions}
          isLoading={isLoadingDestination}
          error={fieldErrors.destination}
          searchError={destinationSearchError}
          history={history}
          otherFieldValue={originQuery}
          onChange={(value) => {
            setDestinationQuery(value);
            setSelectedDestination(null);
            clearFieldError("destination");
            setFormError("");
          }}
          onFocus={() => setActiveField("destination")}
          onClose={closeDropdown}
          onSelect={(item) => select(item, "destination")}
          onSelectHistory={(item) => selectHistory(item, "destination")}
          onRemoveHistory={removeHistoryItem}
          onClearHistory={clearHistory}
          onUseCurrentLocation={() => setCurrentLocation("destination")}
          onSubmit={search}
        />
      </div>
      {formError && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {formError}
        </p>
      )}
      <button
        type="button"
        onClick={search}
        disabled={isSubmitting}
        className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary-600 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-9 sm:h-15 sm:text-base"
      >
        {isSubmitting ? (
          <HiArrowPath className="h-5 w-5 animate-spin sm:h-6 sm:w-6" aria-hidden="true" />
        ) : (
          <HiOutlineMagnifyingGlass className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
        Cari Rute
      </button>
    </div>
  );
}
