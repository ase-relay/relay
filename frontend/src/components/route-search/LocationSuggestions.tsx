"use client";

import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import type { RouteSearchHistoryItem } from "@/lib/routeSearchHistory";
import type { LocationSuggestion } from "@/services/locationSearch";
import { LocationSuggestionItem } from "./LocationSuggestionItem";

export type DropdownItem =
  | { type: "current-location" }
  | { type: "history"; item: RouteSearchHistoryItem }
  | { type: "suggestion"; suggestion: LocationSuggestion }
  | { type: "message"; text: string; tone?: "muted" | "error" };

type LocationSuggestionsProps = {
  id: string;
  labelId: string;
  items: DropdownItem[];
  activeIndex: number;
  optionId: (index: number) => string;
  highlightQuery: string;
  /** True saat koordinat perangkat sedang dideteksi via navigator.geolocation. */
  isLocating?: boolean;
  onSelectItem: (item: DropdownItem, index: number) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
};

export function LocationSuggestions({
  id,
  labelId,
  items,
  activeIndex,
  optionId,
  highlightQuery,
  isLocating = false,
  onSelectItem,
  onRemoveHistory,
  onClearHistory,
}: LocationSuggestionsProps) {
  const hasHistory = items.some((item) => item.type === "history");

  return (
    <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
      <ul
        id={id}
        role="listbox"
        aria-labelledby={labelId}
        className="max-h-72 overflow-y-auto overflow-x-hidden py-1 [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent]"
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          if (item.type === "message") {
            const isError = item.tone === "error";
            return (
              <li
                key={`message-${index}`}
                role="presentation"
                aria-live="polite"
                className={`px-4 py-3 text-sm ${isError ? "flex items-start gap-2 text-red-600" : "text-neutral-500"}`}
              >
                {isError && <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span className="min-w-0">{item.text}</span>
              </li>
            );
          }

          if (item.type === "current-location") {
            return (
              <LocationSuggestionItem
                key="current-location"
                id={optionId(index)}
                variant="current-location"
                name="Lokasi saya"
                district="Gunakan lokasi perangkat"
                isActive={isActive}
                isLoading={isLocating}
                onSelect={() => onSelectItem(item, index)}
              />
            );
          }

          if (item.type === "history") {
            return (
              <LocationSuggestionItem
                key={item.item.id}
                id={optionId(index)}
                variant="history"
                name={item.item.name}
                district={item.item.district}
                isActive={isActive}
                onSelect={() => onSelectItem(item, index)}
                onDelete={() => onRemoveHistory(item.item.id)}
              />
            );
          }

          return (
            <LocationSuggestionItem
              key={item.suggestion.id}
              id={optionId(index)}
              variant="suggestion"
              name={item.suggestion.name}
              district={item.suggestion.district}
              tag={item.suggestion.tag}
              highlightQuery={highlightQuery}
              isActive={isActive}
              onSelect={() => onSelectItem(item, index)}
            />
          );
        })}

        {hasHistory && (
          <li role="presentation" className="border-t border-neutral-100 px-4 py-2">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClearHistory}
              className="text-xs font-medium text-neutral-500 transition hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-600"
            >
              Hapus riwayat
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
