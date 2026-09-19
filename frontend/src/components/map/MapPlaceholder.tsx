// Placeholder untuk MapViewer.tsx — akan diisi Google Maps JavaScript API + Directions Service saat tahap integrasi final. 
// Saat itu terjadi, isolasi komponen ini penting agar re-render induk (misal saat form berubah) tidak memicu re-init instance Google Maps yang boros kuota.

interface MapPlaceholderProps {
  originLabel?: string;
  destinationLabel?: string;
  className?: string;
}

export function MapPlaceholder({ originLabel, destinationLabel, className = '' }: MapPlaceholderProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="aspect-video bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">Peta Interaktif</h3>
        <p className="text-sm text-neutral-500">(Preview — integrasi Google Maps API menyusul)</p>
      </div>
      
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
