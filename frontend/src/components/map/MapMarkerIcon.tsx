import L from 'leaflet';

export function createMarkerIcon(type: 'origin' | 'destination' | 'transit', colorHex?: string): L.DivIcon {
  const size = type === 'transit' ? 32 : 24;
  const color = type === 'origin' ? '#22c55e' : type === 'destination' ? '#ef4444' : colorHex || '#3b82f6';
  
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" 
              ${type === 'transit' ? 'stroke="white" stroke-width="2"' : ''} />
    </svg>
  `;

  return L.divIcon({
    className: 'custom-marker-icon',
    html: svgContent,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
