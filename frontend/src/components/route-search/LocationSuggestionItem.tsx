"use client";

import { HiOutlineMapPin, HiOutlineXMark } from "react-icons/hi2";
import SearchHistoryIcon from "@/components/icons/home/SearchHistoryIcon";

type LocationSuggestionVariant = "current-location" | "history" | "suggestion";

type LocationSuggestionItemProps = {
  id: string;
  variant: LocationSuggestionVariant;
  name: string;
  district?: string;
  /** Label kecil "Halte"/"Stasiun" untuk tempat dari data lokal. */
  tag?: "Halte" | "Stasiun";
  /** Teks yang bagian cocoknya disorot pada nama. */
  highlightQuery?: string;
  isActive: boolean;
  /** True saat lokasi perangkat sedang dideteksi (menampilkan teks "Mendeteksi..."). */
  isLoading?: boolean;
  onSelect: () => void;
  onDelete?: () => void;
};

/** Ikon target untuk opsi "Lokasi saya" (ikon ini tidak tersedia di react-icons/hi2). */
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return <>{text}</>;

  const matchIndex = text.toLowerCase().indexOf(normalizedQuery);
  if (matchIndex < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, matchIndex)}
      <mark className="bg-transparent font-semibold text-primary-600">
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </mark>
      {text.slice(matchIndex + normalizedQuery.length)}
    </>
  );
}

export function LocationSuggestionItem({
  id,
  variant,
  name,
  district,
  tag,
  highlightQuery = "",
  isActive,
  isLoading = false,
  onSelect,
  onDelete,
}: LocationSuggestionItemProps) {
  const icon =
    variant === "current-location" ? (
      <TargetIcon className="h-5 w-5 text-neutral-900" />
    ) : variant === "history" ? (
      <SearchHistoryIcon className="h-5 w-5 shrink-0" />
    ) : (
      <HiOutlineMapPin className="h-5 w-5 text-neutral-400" />
    );
  const title = district ? `${name} — ${district}` : name;

  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition ${isActive ? "bg-primary-50" : "hover:bg-primary-50"}`}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-semibold text-neutral-900" title={title}>
            {isLoading ? "Mendeteksi lokasi..." : <HighlightedText text={name} query={variant === "suggestion" ? highlightQuery : ""} />}
          </span>
          {tag && !isLoading && (
            <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-1.5 py-px text-[10px] font-medium text-neutral-500">{tag}</span>
          )}
        </span>
        {district && <span className="mt-0.5 block truncate text-xs text-neutral-500" title={district}>{district}</span>}
      </span>
      {onDelete && (
        <button
          type="button"
          aria-label={`Hapus ${name} dari riwayat`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-600"
        >
          <HiOutlineXMark className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
