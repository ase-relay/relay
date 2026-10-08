// Fallback loading untuk MapViewer (dynamic import, SSR dimatikan).
// Hanya tampil sepersekian detik saat chunk Leaflet dimuat — berupa kotak
// shimmer netral, tanpa teks (bukan lagi placeholder integrasi API).

interface MapPlaceholderProps {
  originLabel?: string;
  destinationLabel?: string;
  className?: string;
}

export function MapPlaceholder({ originLabel, destinationLabel, className = '' }: MapPlaceholderProps) {
  return (
    <div className={`w-full ${className}`}>
      <div
        aria-hidden="true"
        className="aspect-video animate-pulse rounded-xl bg-neutral-100"
      />
      <span role="status" className="sr-only">
        Memuat peta...
      </span>

      {(originLabel || destinationLabel) && (
        <div className="mt-3 text-sm text-neutral-600 text-center">
          {originLabel && `Dari: ${originLabel}`}
          {originLabel && destinationLabel && ' → '}
          {destinationLabel && `Ke: ${destinationLabel}`}
        </div>
      )}
    </div>
  );
}
