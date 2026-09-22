'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RouteSummaryHeader } from '@/components/route-detail/RouteSummaryHeader';
import { JourneySegment, TripStepList } from '@/components/route-detail/TripStepList';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { mapApiRouteToJourneySegments } from '@/lib/mappers/routeMapper';
import { readRouteSearchResults } from '@/lib/routeSearchTransfer';
import { transformApiRouteToMapMarkers, transformApiRouteToMapPolylines } from '@/lib/utils/mapDataTransform';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';
import type { ApiRoute } from '@/types/api/routing';
import type { RouteOption } from '@/lib/types/route';

// Dynamic import with SSR disabled untuk menghindari error Leaflet di server
const MapViewerNoSSR = dynamic(
  () => import('@/components/map/MapViewer').then(mod => ({ default: mod.MapViewer })),
  {
    ssr: false,
    loading: () => <MapPlaceholder />
  }
);

/**
 * Task 3.3: detail rute diambil dari hasil pencarian (Task 3.2) yang disimpan ke
 * sessionStorage — kontrak BE belum menyediakan endpoint detail-by-ID, jadi tidak
 * ada fetch ulang. Konsekuensinya: membuka halaman ini di tab baru / tanpa hasil
 * pencarian sebelumnya akan menampilkan state "rute tidak ditemukan".
 */
function findRouteById(routeId: string): ApiRoute | null {
  const results = readRouteSearchResults();
  if (!results) return null;
  return results.routes.find((route) => route.id === routeId) ?? null;
}

/**
 * Adapter shape: `ApiRoute` (kontrak BE) → `RouteOption` (props RouteSummaryHeader).
 * Header komponen ini masih berbasis shape mock lama; adapter menjaga komponen
 * tetap tidak berubah. Jadwal jam belum disediakan kontrak BE → placeholder '--:--'.
 */
function toRouteOption(apiRoute: ApiRoute, originName: string, destinationName: string): RouteOption {
  const firstLeg = apiRoute.legs[0];
  const lastLeg = apiRoute.legs[apiRoute.legs.length - 1];

  return {
    id: apiRoute.id,
    label: 'Rute',
    tag: null,
    totalDurationMinutes: apiRoute.summary.totalDurationMinutes,
    totalCost: apiRoute.summary.totalFare,
    transitCount: apiRoute.summary.transfersCount,
    segments: [],
    originStopName: firstLeg?.from?.name ?? firstLeg?.fromHalte?.name ?? originName,
    destinationStopName: lastLeg?.to?.name ?? lastLeg?.toHalte?.name ?? destinationName,
  };
}

export default function RouteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.routeId as string;

  // sessionStorage hanya ada di client — baca setelah mount agar tidak hydration mismatch.
  const [selectedRoute, setSelectedRoute] = useState<ApiRoute | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setSelectedRoute(findRouteById(routeId));
    setHasLoaded(true);
  }, [routeId]);

  // Handle back navigation
  const handleBack = () => {
    router.push('/cari-rute');
  };

  // Transform route data to map markers with useMemo (versi baru berbasis ApiRoute)
  const mapMarkers = useMemo<MapViewerMarker[]>(() => {
    if (!selectedRoute) return [];
    return transformApiRouteToMapMarkers(selectedRoute);
  }, [selectedRoute]);

  // Transform route data to map polylines with useMemo (versi baru berbasis ApiRoute)
  const mapPolylines = useMemo<MapViewerPolyline[]>(() => {
    if (!selectedRoute) return [];
    return transformApiRouteToMapPolylines(selectedRoute);
  }, [selectedRoute]);

  // Segmen perjalanan dari response BE (bukan lagi hardcoded)
  const journeySegments = useMemo<JourneySegment[]>(() => {
    if (!selectedRoute) return [];
    return mapApiRouteToJourneySegments(selectedRoute);
  }, [selectedRoute]);

  // Handle route not found
  if (!selectedRoute) {
    // Hindari kedip layar "rute tidak ditemukan" saat data sessionStorage belum dibaca.
    if (!hasLoaded) {
      return <div className="min-h-screen" />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
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
            Data rute tidak tersedia. Cari ulang rute dari halaman pencarian untuk memuat detailnya.
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

  const firstLeg = selectedRoute.legs[0];
  const lastLeg = selectedRoute.legs[selectedRoute.legs.length - 1];
  const originPoint = firstLeg?.from ?? firstLeg?.fromHalte;
  const destinationPoint = lastLeg?.to ?? lastLeg?.toHalte;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RouteSummaryHeader route={toRouteOption(selectedRoute, originPoint?.name ?? '', destinationPoint?.name ?? '')} onBack={handleBack} />

        {/* Detail perjalanan dan peta */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <TripStepList
              origin={{ time: '--:--', name: originPoint?.name ?? 'Lokasi awal', address: '' }}
              destination={{ time: '--:--', name: destinationPoint?.name ?? 'Tujuan', address: '' }}
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
