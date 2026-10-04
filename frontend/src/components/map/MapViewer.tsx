'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, ZoomControl } from 'react-leaflet';
import { createMarkerIcon, type MarkerIconType } from './MapMarkerIcon';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, OSM_TILE_URL, OSM_ATTRIBUTION } from '@/constants/mapConfig';
import 'leaflet/dist/leaflet.css';

// PENTING: Jangan kirim array markers/polylines yang di-generate ulang setiap render 
// (misal langsung `.map()` inline di JSX parent tanpa useMemo) — ini akan memicu 
// re-render MapContainer terus-menerus dan bisa berat di device low-end.

export interface MapViewerMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  label: string;
  /**
   * origin = lokasi awal (bulat abu-abu), current-location = "Lokasi saya" (bulat biru),
   * destination = pin merah, transit = halte naik/turun/transit (bulat warna rute).
   */
  type: MarkerIconType;
  colorHex?: string;
}

/** Target zoom dari luar (mis. user klik nama halte di daftar perhentian). */
export interface MapFocusTarget {
  name: string;
  position: [number, number]; // [lat, lng]
  /** Ubah tiap klik (mis. Date.now()) supaya klik halte yang sama dua kali tetap memicu zoom. */
  nonce: number;
}

/** Titik perhentian halte yang dilewati di sepanjang rute (bulat putih kecil, bisa diklik). */
export interface MapViewerStop {
  id: string;
  position: [number, number]; // [lat, lng]
  label: string; // nama halte, tampil di popup saat diklik
  colorHex?: string; // warna garis tepi titik (warna rute)
}

export interface MapViewerPolyline {
  id: string;
  positions: [number, number][];
  colorHex: string;
  /** true = digambar sebagai titik-titik (dipakai untuk rute jalan kaki). */
  dashed?: boolean;
}

interface MapViewerProps {
  markers: MapViewerMarker[];
  stops?: MapViewerStop[];
  /** Bila berubah, peta terbang ke posisi ini dan membuka popup nama halte. */
  focusTarget?: MapFocusTarget | null;
  polylines?: MapViewerPolyline[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  /** Posisi kontrol zoom Leaflet. Default 'topleft' (perilaku lama); design halaman detail memakai 'bottomright'. */
  zoomControlPosition?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  /**
   * Beri tahu peta bahwa container-nya sedang diperbesar/diperkecil (animasi expand/collapse).
   * Saat nilainya berubah, peta di-fit ulang ke semua marker dengan animasi zoom halus
   * setelah transisi ukuran container selesai.
   */
  expanded?: boolean;
}

/** Level zoom minimum saat memfokuskan satu halte (level jalan). */
const FOCUS_ZOOM = 17;

// Zoom ke halte yang dipilih dari luar, lalu tampilkan popup nama halte di titik itu.
function FocusHandler({ target }: { target: MapFocusTarget | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    map.invalidateSize({ animate: false });
    // Jangan zoom-out kalau user sudah lebih dekat dari FOCUS_ZOOM.
    map.flyTo(target.position, Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 0.8 });

    const openPopup = () => {
      // Nama dari BE disisipkan sebagai textContent (bukan HTML) agar aman dari injeksi.
      const content = document.createElement('div');
      content.textContent = target.name;
      L.popup({ offset: [0, -6] }).setLatLng(target.position).setContent(content).openOn(map);
    };
    map.once('moveend', openPopup);
    return () => {
      map.off('moveend', openPopup);
    };
  }, [target, map]);

  return null;
}

/** Harus >= durasi transisi CSS pada container peta (page detail: 500ms). */
const RESIZE_TRANSITION_MS = 520;

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

// Menjaga tile Leaflet tetap terisi selama container berubah ukuran (CSS transition),
// lalu fit ulang bounds dengan animasi zoom saat `expanded` berubah.
function MapResizeHandler({ markers, expanded }: { markers: MapViewerMarker[]; expanded: boolean }) {
  const map = useMap();
  const markersRef = useRef(markers);
  const isFirstRun = useRef(true);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  // Setiap frame animasi ukuran -> hitung ulang ukuran peta agar tidak ada area abu-abu.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  // Setelah transisi selesai, zoom in/out halus supaya rute pas dengan ukuran baru.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
      const current = markersRef.current;
      if (current.length > 1) {
        const bounds = L.latLngBounds(current.map((marker) => marker.position));
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.6 });
      }
    }, RESIZE_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [expanded, map]);

  return null;
}

function MapViewerComponent({
  markers,
  stops = [],
  focusTarget = null,
  polylines = [],
  center = MAP_DEFAULT_CENTER,
  zoom = MAP_DEFAULT_ZOOM,
  className = '',
  zoomControlPosition = 'topleft',
  expanded = false
}: MapViewerProps) {
  return (
    // isolate + z-0: kurung z-index internal Leaflet (pane 400, kontrol 800-1000) di dalam
    // komponen ini supaya tidak menimpa navbar/sidebar/dropdown halaman.
    <div className={`relative isolate z-0 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <ZoomControl position={zoomControlPosition} />
        <TileLayer
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIBUTION}
          crossOrigin="anonymous"
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
            pathOptions={
              polyline.dashed
                ? {
                    // dashArray "0.1 10" + lineCap round = deretan titik bulat
                    color: polyline.colorHex,
                    weight: 5,
                    opacity: 1,
                    dashArray: '0.1 10',
                    lineCap: 'round',
                  }
                : {
                    color: polyline.colorHex,
                    weight: 6,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }
            }
          />
        ))}

        {stops.map((stop) => (
          <CircleMarker
            key={stop.id}
            center={stop.position}
            radius={5}
            pathOptions={{
              color: stop.colorHex ?? '#562B63',
              weight: 2,
              fillColor: '#ffffff',
              fillOpacity: 1,
            }}
          >
            <Popup>{stop.label}</Popup>
          </CircleMarker>
        ))}

        <FitBoundsHandler markers={markers} />
        <MapResizeHandler markers={markers} expanded={expanded} />
        <FocusHandler target={focusTarget} />
      </MapContainer>
    </div>
  );
}

export const MapViewer = React.memo(MapViewerComponent);