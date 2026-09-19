'use client';

import { useEffect } from 'react';
import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { createMarkerIcon } from './MapMarkerIcon';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, OSM_TILE_URL, OSM_ATTRIBUTION } from '@/constants/mapConfig';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';

// PENTING: Jangan kirim array markers/polylines yang di-generate ulang setiap render 
// (misal langsung `.map()` inline di JSX parent tanpa useMemo) — ini akan memicu 
// re-render MapContainer terus-menerus dan bisa berat di device low-end.

export interface MapViewerMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  label: string;
  type: 'origin' | 'destination' | 'transit';
  colorHex?: string;
}

export interface MapViewerPolyline {
  id: string;
  positions: [number, number][];
  colorHex: string;
}

interface MapViewerProps {
  markers: MapViewerMarker[];
  polylines?: MapViewerPolyline[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Helper component untuk auto-fit bounds
function FitBoundsHandler({ markers }: { markers: MapViewerMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(marker => marker.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
}

function MapViewerComponent({
  markers,
  polylines = [],
  center = MAP_DEFAULT_CENTER,
  zoom = MAP_DEFAULT_ZOOM,
  className = ''
}: MapViewerProps) {
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIBUTION}
        />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createMarkerIcon(marker.type, marker.colorHex)}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}

        {polylines.map((polyline) => (
          <Polyline
            key={polyline.id}
            positions={polyline.positions}
            color={polyline.colorHex}
            weight={4}
            opacity={0.8}
          />
        ))}

        <FitBoundsHandler markers={markers} />
      </MapContainer>
    </div>
  );
}

export const MapViewer = React.memo(MapViewerComponent);
