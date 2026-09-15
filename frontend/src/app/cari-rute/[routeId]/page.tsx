'use client';

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RouteSummaryHeader } from '@/components/route-detail/RouteSummaryHeader';
import { JourneySegment, TripStepList } from '@/components/route-detail/TripStepList';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { routes } from '@/lib/mock/routes';
import { transformRouteToMapMarkers, transformRouteToMapPolylines } from '@/lib/utils/mapDataTransform';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';

// Dynamic import with SSR disabled untuk menghindari error Leaflet di server
const MapViewerNoSSR = dynamic(
  () => import('@/components/map/MapViewer').then(mod => ({ default: mod.MapViewer })),
  {
    ssr: false,
    loading: () => <MapPlaceholder />
  }
);

export default function RouteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.routeId as string;

  // Find the route by ID
  const selectedRoute = useMemo(() => {
    return routes.find(r => r.id === routeId);
  }, [routeId]);

  // Handle back navigation
  const handleBack = () => {
    router.push('/cari-rute');
  };

  // Transform route data to map markers with useMemo
  const mapMarkers = useMemo<MapViewerMarker[]>(() => {
    if (!selectedRoute) return [];
    return transformRouteToMapMarkers(selectedRoute);
  }, [selectedRoute]);

  // Transform route data to map polylines with useMemo
  const mapPolylines = useMemo<MapViewerPolyline[]>(() => {
    if (!selectedRoute) return [];
    return transformRouteToMapPolylines(selectedRoute);
  }, [selectedRoute]);

  const journeySegments: JourneySegment[] = [
    {
      id: 'walk-to-stop', type: 'WALK', startTime: '08:00', endTime: '08:06', duration: 6, distance: 300,
      steps: ['Ambil arah menuju Gg. Raden H. Saleh', 'Belok kiri ke Gg. Raden H. Saleh', 'Belok kanan untuk tetap di Gg. Raden H. Saleh', 'Tujuan ada di sebelah kanan'],
    },
    {
      id: 'bus-3d', type: 'TRANSIT', startTime: '08:06', endTime: '09:00', operator: 'Metro Jabar Trans (Baleendah - BEC - Baleendah)', routeCode: '3D', cost: 4900, duration: 54, stopCount: 24,
      stops: [{ time: '08:06', stopName: 'SD Negeri Lengkong' }, { time: '08:08', stopName: 'Puskesmas Bojongsoang' }, { time: '08:11', stopName: 'Bluebird A' }, { time: '08:12', stopName: 'Pasar Kordon A' }, { time: '08:13', stopName: 'JAPNAS' }, { time: '08:15', stopName: 'PT Medal Sekarwangi' }, { time: '08:20', stopName: 'PLN UP3 Bandung A' }, { time: '08:31', stopName: 'Alun Alun Bandung' }, { time: '08:45', stopName: 'STHB Sekolah Tinggi Hukum Bandung' }, { time: '09:00', stopName: 'Bandung Electronic Centre (BEC)' }],
    },
  ];

  // Handle route not found
  if (!selectedRoute) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Rute tidak ditemukan</h2>
          <p className="text-neutral-600 mb-6">
            Rute yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <button
            onClick={handleBack}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Kembali ke Pencarian Rute
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RouteSummaryHeader route={selectedRoute} onBack={handleBack} />

        {/* Detail perjalanan dan peta */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <TripStepList
              origin={{ time: '08:00', name: selectedRoute.originStopName, address: 'Jl. Telekomunikasi No.1, Sukapura, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40257' }}
              destination={{ time: '09:00', name: selectedRoute.destinationStopName, address: 'Istana Bandung Electronic Center, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40117' }}
              segments={journeySegments}
            />
          </div>

          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="aspect-video w-full">
                <MapViewerNoSSR
                  markers={mapMarkers}
                  polylines={mapPolylines}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
