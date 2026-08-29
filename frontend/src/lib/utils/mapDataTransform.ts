import { RouteOption } from '../types/route';
import { stops } from '../mock/stops';
import { transportModes } from '../mock/transportModes';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';

/**
 * Transform RouteOption ke MapViewerMarker[]
 * Mengembalikan array marker untuk origin, destination, dan transit points
 */
export function transformRouteToMapMarkers(route: RouteOption): MapViewerMarker[] {
  const markers: MapViewerMarker[] = [];
  
  // Cari koordinat untuk origin dan destination
  const originStop = stops.find(s => s.name === route.originStopName);
  const destinationStop = stops.find(s => s.name === route.destinationStopName);
  
  if (originStop) {
    markers.push({
      id: 'origin',
      position: [originStop.latitude, originStop.longitude],
      label: route.originStopName,
      type: 'origin'
    });
  }
  
  if (destinationStop) {
    markers.push({
      id: 'destination',
      position: [destinationStop.latitude, destinationStop.longitude],
      label: route.destinationStopName,
      type: 'destination'
    });
  }
  
  // Process segments untuk transit points
  route.segments.forEach((segment, index) => {
    const mode = transportModes.find(m => m.id === segment.modeId);
    const fromStop = stops.find(s => s.name === segment.fromStopName);
    
    if (fromStop && mode) {
      // Tambahkan transit point (kecuali origin dan destination yang sudah ditambah)
      if (index > 0 && index < route.segments.length) {
        markers.push({
          id: `transit-${segment.id}`,
          position: [fromStop.latitude, fromStop.longitude],
          label: segment.fromStopName,
          type: 'transit',
          colorHex: mode.colorHex
        });
      }
    }
  });
  
  return markers;
}

/**
 * Transform RouteOption ke MapViewerPolyline[]
 * Mengembalikan array polyline untuk setiap segment rute
 */
export function transformRouteToMapPolylines(route: RouteOption): MapViewerPolyline[] {
  const polylines: MapViewerPolyline[] = [];
  
  // Process segments untuk polylines
  route.segments.forEach((segment) => {
    const mode = transportModes.find(m => m.id === segment.modeId);
    const fromStop = stops.find(s => s.name === segment.fromStopName);
    const toStop = stops.find(s => s.name === segment.toStopName);
    
    if (fromStop && toStop && mode) {
      polylines.push({
        id: `polyline-${segment.id}`,
        positions: [
          [fromStop.latitude, fromStop.longitude],
          [toStop.latitude, toStop.longitude]
        ],
        colorHex: mode.colorHex
      });
    }
  });
  
  return polylines;
}
