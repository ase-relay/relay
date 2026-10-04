import L from 'leaflet';

export type MarkerIconType = 'origin' | 'current-location' | 'destination' | 'transit';

/** Warna default per jenis marker. */
const ORIGIN_COLOR = '#8E8E93'; // abu-abu (lokasi awal selain "Lokasi saya")
const CURRENT_LOCATION_COLOR = '#004BDC'; // biru (primary-600) untuk "Lokasi saya"
const DESTINATION_COLOR = '#EF4444'; // merah untuk pin tujuan
const TRANSIT_FALLBACK_COLOR = '#562B63';

// Path pin sama persis dengan MapPinIcon.tsx (viewBox 20x29). Di-inline sebagai string karena
// divIcon Leaflet membutuhkan HTML string, bukan React component.
const PIN_PATH =
  'M10 0.5C12.5191 0.503118 14.934 1.5021 16.7148 3.27734C18.3843 4.94168 19.3683 7.16099 19.4873 9.5L19.5 9.96973C19.5019 12.0184 18.8309 14.0118 17.5889 15.6445L17.5381 15.71L17.5361 15.7139C17.5112 15.7464 17.4796 15.7871 17.4473 15.8291C17.4107 15.8765 17.3734 15.9255 17.3428 15.9648C17.3275 15.9845 17.3141 16.0015 17.3037 16.0146C17.2986 16.0212 17.2942 16.0264 17.291 16.0303C17.2892 16.0326 17.2886 16.0345 17.2881 16.0352L17.2637 16.0635L17.2441 16.0957L10 28.0352L2.75977 16.1006L2.7373 16.0645L2.71094 16.0332L2.69629 16.0156C2.68612 16.0028 2.67333 15.9862 2.6582 15.9668C2.62744 15.9274 2.58931 15.8786 2.55273 15.8311C2.51623 15.7836 2.48117 15.7373 2.45508 15.7031C2.44205 15.6861 2.4313 15.6719 2.42383 15.6621C2.42022 15.6574 2.417 15.6539 2.41504 15.6514C2.41421 15.6503 2.41357 15.6491 2.41309 15.6484L2.41211 15.6475C1.16911 14.0141 0.497777 12.0195 0.5 9.96973C0.50297 7.45977 1.50434 5.05266 3.28516 3.27734C5.06596 1.5021 7.48091 0.503118 10 0.5ZM11.582 6.15723C10.8265 5.84537 9.99526 5.76385 9.19336 5.92285C8.3913 6.08189 7.65475 6.47501 7.07617 7.05176C6.49757 7.62855 6.10308 8.36359 5.94336 9.16406C5.78372 9.96445 5.86548 10.794 6.17871 11.5479C6.49196 12.3017 7.02199 12.9463 7.70215 13.3994C8.38233 13.8525 9.18225 14.0938 10 14.0938H10.001C11.0968 14.0923 12.1475 13.6577 12.9229 12.8848C13.6982 12.1118 14.1353 11.0635 14.1367 9.96973V9.96875C14.1367 9.15258 13.8932 8.35514 13.4385 7.67676C12.9838 6.99838 12.3377 6.46925 11.582 6.15723Z';

const iconCache = new Map<string, L.DivIcon>();

function circleIcon(size: number, fill: string, border: number, halo = false): L.DivIcon {
  const shadow = halo
    ? `0 0 0 6px ${fill}33, 0 1px 4px rgba(0,0,0,0.35)`
    : '0 1px 4px rgba(0,0,0,0.35)';
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:${border}px solid #fff;box-sizing:border-box;box-shadow:${shadow};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function pinIcon(color: string): L.DivIcon {
  const width = 26;
  const height = Math.round((29 / 20) * width); // jaga rasio asli 20x29
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<svg width="${width}" height="${height}" viewBox="0 0 20 29" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));"><path d="${PIN_PATH}" fill="${color}" stroke="white"/></svg>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height], // ujung bawah pin = titik lokasi
    popupAnchor: [0, -height],
  });
}

/**
 * Ukuran: origin = halte/transit = 20px (sama besar), "Lokasi saya" = 16px (sedikit lebih kecil),
 * tujuan = pin merah. Icon di-cache per (tipe, warna) agar tidak dibuat ulang tiap render.
 */
export function createMarkerIcon(type: MarkerIconType, colorHex?: string): L.DivIcon {
  const key = `${type}|${colorHex ?? ''}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  let icon: L.DivIcon;
  switch (type) {
    case 'origin':
      icon = circleIcon(20, ORIGIN_COLOR, 3);
      break;
    case 'current-location':
      icon = circleIcon(16, CURRENT_LOCATION_COLOR, 3, true);
      break;
    case 'destination':
      icon = pinIcon(DESTINATION_COLOR);
      break;
    case 'transit':
    default:
      icon = circleIcon(20, colorHex || TRANSIT_FALLBACK_COLOR, 3);
      break;
  }

  iconCache.set(key, icon);
  return icon;
}