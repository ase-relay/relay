"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { RouteSearchHistoryItem } from "@/lib/routeSearchHistory";
import { MIN_QUERY_LENGTH, type LocationSuggestion } from "@/services/locationSearch";
import MapPinIcon from "@/components/icons/home/MapPinIcon";
import InitialLocationIcon from "@/components/icons/home/InitialLocationIcon";
import { LocationSuggestions, type DropdownItem } from "./LocationSuggestions";

type LocationInputProps = {
  id: string;
  kind: "origin" | "destination";
  value: string;
  placeholder: string;
  isActive: boolean;
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  /** True saat koordinat perangkat sedang dideteksi via navigator.geolocation. */
  isLocating?: boolean;
  /** Pesan validasi yang tampil tepat di bawah input. */
  error?: string;
  /** Pesan galat layanan geocoder yang tampil di dalam dropdown. */
  searchError?: string;
  history: RouteSearchHistoryItem[];
  /** Nilai dari field lain (origin untuk destination, sebaliknya) untuk validasi. */
  otherFieldValue?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  /** Menutup dropdown (Esc/Tab/klik di luar) tanpa mengubah teks. */
  onClose: () => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  onSelectHistory: (item: RouteSearchHistoryItem) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
  onUseCurrentLocation: () => void;
  /** Dijalankan saat Enter tanpa item aktif (submit "Cari Rute"). */
  onSubmit: () => void;
};

/** Kunci stabil per opsi; message tidak punya kunci (tidak bisa aktif). */
function optionKey(item: DropdownItem): string | null {
  switch (item.type) {
    case "current-location":
      return "current-location";
    case "history":
      return `history:${item.item.id}`;
    case "suggestion":
      return `suggestion:${item.suggestion.id}`;
    default:
      return null;
  }
}

export function LocationInput({
  id,
  kind,
  value,
  placeholder,
  isActive,
  suggestions,
  isLoading,
  isLocating = false,
  error,
  searchError = "",
  history,
  otherFieldValue = "",
  onChange,
  onFocus,
  onClose,
  onSelect,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
  onUseCurrentLocation,
  onSubmit,
}: LocationInputProps) {
  const isOrigin = kind === "origin";
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Item aktif disimpan sebagai kunci stabil; indeksnya diturunkan saat render
  // sehingga otomatis "hilang" bila daftar opsi berubah (tanpa reset via effect).
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const items = useMemo<DropdownItem[]>(() => {
    const query = value.trim();

    // Input kosong: "Lokasi saya" (awal dan tujuan) lalu riwayat pencarian.
    // Sembunyikan "Lokasi saya" di destination jika origin sudah berisi "Lokasi saya".
    if (query.length === 0) {
      const isOtherFieldCurrentLocation = otherFieldValue === 'Lokasi saya';
      const idleItems: DropdownItem[] = (!isOrigin && isOtherFieldCurrentLocation) ? [] : [{ type: "current-location" }];
      for (const item of history) idleItems.push({ type: "history", item });
      if (idleItems.length === 0) {
        idleItems.push({ type: "message", text: "Ketik nama tempat, jalan, atau halte." });
      }
      return idleItems;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      return [{ type: "message", text: "Ketik minimal 2 karakter untuk mencari lokasi." }];
    }

    const suggestionItems: DropdownItem[] = [];
    if (searchError) suggestionItems.push({ type: "message", text: searchError, tone: "error" });
    for (const suggestion of suggestions) suggestionItems.push({ type: "suggestion", suggestion });
    if (isLoading && suggestions.length === 0) {
      suggestionItems.push({ type: "message", text: "Mencari lokasi..." });
    }
    if (!isLoading && !searchError && suggestions.length === 0) {
      suggestionItems.push({
        type: "message",
        text: "Lokasi tidak ditemukan. Coba kata kunci lain.",
      });
    }
    return suggestionItems;
  }, [value, isOrigin, history, suggestions, isLoading, searchError, otherFieldValue]);

  const activeIndex = useMemo(() => {
    if (activeKey === null) return -1;
    return items.findIndex((item) => optionKey(item) === activeKey);
  }, [items, activeKey]);

  // Klik di luar wrapper menutup dropdown (pengganti hack onBlur + setTimeout).
  useEffect(() => {
    if (!isActive) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current && !wrapperRef.current.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isActive, onClose]);

  // Pastikan item aktif selalu ter-scroll ke area yang terlihat.
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id]);

  function selectItem(item: DropdownItem) {
    if (item.type === "current-location") {
      onUseCurrentLocation();
      return;
    }
    if (item.type === "history") {
      onSelectHistory(item.item);
      return;
    }
    if (item.type === "suggestion") onSelect(item.suggestion);
  }

  function moveActive(direction: 1 | -1) {
    const selectableIndexes = items.reduce<number[]>((indexes, item, index) => {
      if (item.type !== "message") indexes.push(index);
      return indexes;
    }, []);
    if (selectableIndexes.length === 0) {
      setActiveKey(null);
      return;
    }

    const currentPosition = selectableIndexes.indexOf(activeIndex);
    const nextPosition =
      currentPosition === -1
        ? direction === 1
          ? 0
          : selectableIndexes.length - 1
        : (currentPosition + direction + selectableIndexes.length) % selectableIndexes.length;
    setActiveKey(optionKey(items[selectableIndexes[nextPosition]]));
  }

  function handleFocus() {
    setActiveKey(null);
    onFocus();
  }

  // Klik pada input yang sudah fokus (dropdown tertutup) tetap harus membuka dropdown;
  // event focus tidak berulang untuk elemen yang sudah fokus.
  function handlePointerDownOpen() {
    if (!isActive) handleFocus();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isActive) handleFocus();
        moveActive(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!isActive) handleFocus();
        moveActive(-1);
        return;
      case "Enter": {
        event.preventDefault();
        const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
        // Dropdown terbuka + ada item aktif → pilih item. Selain itu → submit.
        if (isActive && activeItem && activeItem.type !== "message") selectItem(activeItem);
        else onSubmit();
        return;
      }
      case "Escape":
        if (isActive) {
          event.preventDefault();
          setActiveKey(null);
          onClose();
        }
        return;
      case "Tab":
        if (isActive) {
          setActiveKey(null);
          onClose();
        }
        return;
      default:
        return;
    }
  }

  // Ikon rail kiri mengikuti isi field: kosong → outline abu; terisi →
  // lokasi awal jadi lingkaran biru berisi, tujuan jadi pin kuning/oranye.
  const hasValue = value.trim().length > 0;

  // Ketiga varian ikon memakai kotak & offset yang SAMA sehingga sumbu
  // tengahnya selalu segaris (acuan garis putus-putus di RouteSearchForm):
  // mobile → kotak 24px di -left-6 (sumbu x = -12px);
  // sm → kotak 28px di -left-9 (sumbu x = -22px).
  const railBox =
    "absolute top-1/2 -left-6 grid h-6 w-6 -translate-y-1/2 place-items-center sm:-left-9 sm:h-7 sm:w-7";

  return (
    <div ref={wrapperRef} className="relative w-full">
      {isOrigin ? (
        hasValue ? (
          <span className={railBox}>
            <InitialLocationIcon className="absolute left-1/2 top-1/2 h-4.5 w-4.5 max-w-none -translate-x-1/2 -translate-y-1/2 sm:h-5.5 sm:w-5.5" />
          </span>
        ) : (
          <span className={railBox}>
            <span className="block h-4 w-4 rounded-full border-2 border-neutral-400 bg-white sm:h-5 sm:w-5" />
          </span>
        )
      ) : (
        <MapPinIcon
          className="absolute top-1/2 -left-6 h-6 w-6 -translate-y-1/2 sm:-left-9 sm:h-7 sm:w-7"
          color={hasValue ? "#F58220" : "#9CA3AF"}
        />
      )}
      <label htmlFor={id} id={labelId} className="sr-only">
        {isOrigin ? "Lokasi awal" : "Lokasi tujuan"}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={isActive}
        aria-controls={isActive ? listboxId : undefined}
        aria-activedescendant={isActive && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-autocomplete="list"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        onPointerDown={handlePointerDownOpen}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`h-12 w-full rounded-2xl border bg-white px-4 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 sm:h-15 sm:px-5 ${error ? "border-red-500" : "border-neutral-300"}`}
      />
      {isActive && (
        <LocationSuggestions
          id={listboxId}
          labelId={labelId}
          items={items}
          activeIndex={activeIndex}
          optionId={optionId}
          highlightQuery={value}
          isLocating={isLocating}
          onSelectItem={(item) => selectItem(item)}
          onRemoveHistory={onRemoveHistory}
          onClearHistory={onClearHistory}
        />
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
