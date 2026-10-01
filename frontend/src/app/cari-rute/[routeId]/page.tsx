'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RouteSummaryHeader } from '@/components/route-detail/RouteSummaryHeader';
import { JourneySegment, TripStepList } from '@/components/route-detail/TripStepList';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { mapApiRouteToJourneySegments, mapApiRouteToRouteResultCard } from '@/lib/mappers/routeMapper';
import { readRouteSearchLocations, readRouteSearchResults, RouteSearchLocations } from '@/lib/routeSearchTransfer';
import { fetchRouteGeometry } from '@/lib/api';
import { transformApiRouteToMapMarkers, transformApiRouteToMapPolylines } from '@/lib/utils/mapDataTransform';
import { MapViewerMarker, MapViewerPolyline } from '@/components/map/MapViewer';
import BackArrowIcon from '@/components/icons/cari-rute/BackArrowIcon';
import ExpandIcon from '@/components/icons/cari-rute/ExpandIcon';
import CloseIcon from '@/components/icons/common/CloseIcon';
import type { ApiRoute, ApiRouteLeg, RoutingGeometryLegInput } from '@/types/api/routing';
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

/** Konversi leg → input endpoint geometry; null bila koordinat ujung tidak lengkap. */
function toGeometryInput(leg: ApiRouteLeg): RoutingGeometryLegInput | null {
  const from = leg.from ?? leg.fromHalte;
  const to = leg.to ?? leg.toHalte;
  if (!from || !to) return null;

  const passedStops =
    leg.legType === 'TRANSIT' && leg.passedStops
      ? leg.passedStops
          .filter(
            (stop) => typeof stop.latitude === 'number' && typeof stop.longitude === 'number',
          )
          .map((stop) => ({ lat: stop.latitude as number, lng: stop.longitude as number }))
      : undefined;

  return {
    step: leg.step,
    legType: leg.legType,
    from: { lat: from.lat, lng: from.lng },
    to: { lat: to.lat, lng: to.lng },
    passedStops,
    instruction: leg.instruction,
  };
}

/**
 * Adapter shape: `ApiRoute` (kontrak BE) → `RouteOption` (props RouteSummaryHeader).
 * Statistik (biaya/waktu/transit), ikon moda, badge kode rute, operator, dan total
 * menit jalan kaki dihitung lewat mapper kartu rute yang sama dengan halaman daftar —
 * tanpa hardcode. Judul memakai nama lokasi pencarian (design), fallback nama halte.
 */
function toRouteOption(
  apiRoute: ApiRoute,
  originName: string,
  destinationName: string,
): RouteOption {
  const card = mapApiRouteToRouteResultCard(apiRoute);
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
    originStopName: originName || firstLeg?.from?.name || firstLeg?.fromHalte?.name || 'Lokasi awal',
    destinationStopName: destinationName || lastLeg?.to?.name || lastLeg?.toHalte?.name || 'Tujuan',
    vehicleType: card.type,
    badges: card.badges,
    operator: card.operator,
    walkingMinutes: card.walkingTime,
  };
}

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params.routeId as string;

  // sessionStorage hanya ada di client — baca setelah mount agar tidak hydration mismatch.
  const [selectedRoute, setSelectedRoute] = useState<ApiRoute | null>(null);
  const [searchLocations, setSearchLocations] = useState<RouteSearchLocations | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    setSelectedRoute(findRouteById(routeId));
    setSearchLocations(readRouteSearchLocations());
    setHasLoaded(true);
  }, [routeId]);

  // Tutup overlay peta dengan Escape.
  useEffect(() => {
    if (!mapExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMapExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapExpanded]);

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

  // Self-heal geometri (stale-while-revalidate): bila ada leg yang jatuh ke
  // fallback garis lurus (<= 2 titik) saat pencarian pertama (OSRM cold/429),
  // minta geometri sebenarnya ke endpoint /routing/geometry dan perbarui
  // polyline. Garis lurus tetap tampil instan — hasilnya menyusul di background.
  // Dibatasi satu kali per mount (ref) agar tidak loop.
  const geometryRetriedRef = useRef(false);
  useEffect(() => {
    if (!selectedRoute || geometryRetriedRef.current) return;

    const pending = selectedRoute.legs
      .map((leg) => ({ leg, input: toGeometryInput(leg) }))
      .filter(
        (entry): entry is { leg: ApiRouteLeg; input: RoutingGeometryLegInput } =>
          entry.input !== null &&
          (!entry.leg.geometry || entry.leg.geometry.length <= 2),
      );
    if (pending.length === 0) return;

    geometryRetriedRef.current = true;
    let cancelled = false;

    fetchRouteGeometry({ legs: pending.map((entry) => entry.input) })
      .then((response) => {
        if (cancelled) return;
        const byStep = new Map(response.data.legs.map((item) => [item.step, item]));
        setSelectedRoute((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            legs: previous.legs.map((leg) => {
              const fresh = byStep.get(leg.step);
              if (!fresh || !fresh.geometry || fresh.geometry.length <= 2) return leg;
              return { ...leg, geometry: fresh.geometry, steps: fresh.steps ?? leg.steps };
            }),
          };
        });
      })
      .catch(() => {
        // Senyap: garis lurus tetap tampil; pencarian berikutnya membawa geometry
        // dari cache BE.
      });

    return () => {
      cancelled = true;
    };
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
          <Link
            href="/cari-rute"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Kembali ke Pencarian Rute
          </Link>
        </div>
      </div>
    );
  }

  const firstLeg = selectedRoute.legs[0];
  const lastLeg = selectedRoute.legs[selectedRoute.legs.length - 1];
  const originPoint = firstLeg?.from ?? firstLeg?.fromHalte;
  const destinationPoint = lastLeg?.to ?? lastLeg?.toHalte;

  // Nama tempat (design) dari penyimpanan pencarian; fallback nama halte rute.
  const originName = searchLocations?.origin.name ?? originPoint?.name ?? 'Lokasi awal';
  const destinationName = searchLocations?.destination.name ?? destinationPoint?.name ?? 'Tujuan';
  const originAddress = searchLocations?.origin.district ?? '';
  const destinationAddress = searchLocations?.destination.district ?? '';

  return (
    <div className="flex min-h-screen flex-col text-neutral-900">
      <Navbar />

      <main className="mx-auto w-full max-w-292.5 flex-1 px-4 pb-12 pt-6 sm:px-8 xl:px-0">
        <Link
          href="/cari-rute"
          className="inline-flex items-center gap-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          <BackArrowIcon className="h-2.5 w-auto" />
          Kembali ke Rekomendasi Rute
        </Link>

        <div className="mt-6">
          <RouteSummaryHeader route={toRouteOption(selectedRoute, originName, destinationName)} />
        </div>

        {/* Detail perjalanan dan peta */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <TripStepList
            origin={{
              time: selectedRoute.summary.departureTime ?? '--:--',
              name: originName,
              address: originAddress,
            }}
            destination={{
              time: selectedRoute.summary.arrivalTime ?? '--:--',
              name: destinationName,
              address: destinationAddress,
            }}
            segments={journeySegments}
          />

          <div className="h-fit lg:sticky lg:top-32">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Peta">
              <h2 className="text-lg font-bold text-neutral-900">Peta</h2>
              <div className="relative mt-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <MapViewerNoSSR
                    markers={mapMarkers}
                    polylines={mapPolylines}
                    className="w-full h-full"
                    zoomControlPosition="bottomright"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMapExpanded(true)}
                  aria-label="Perbesar peta"
                  className="absolute right-3 top-3 z-[1000] grid h-9 w-9 place-items-center rounded-lg bg-white shadow-md transition-colors hover:bg-neutral-50 cursor-pointer"
                >
                  <ExpandIcon className="h-5 w-5" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Overlay peta fullscreen */}
      {mapExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Peta ukuran penuh"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMapExpanded(false);
          }}
        >
          <div className="flex h-[88vh] w-full max-w-6xl flex-col rounded-2xl bg-white p-4 shadow-xl sm:p-5">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Peta</h2>
              <button
                type="button"
                onClick={() => setMapExpanded(false)}
                aria-label="Tutup peta"
                className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl">
              <MapViewerNoSSR
                markers={mapMarkers}
                polylines={mapPolylines}
                className="h-full w-full"
                zoomControlPosition="bottomright"
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
