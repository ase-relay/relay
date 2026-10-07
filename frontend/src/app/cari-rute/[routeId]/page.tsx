'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RouteSummaryHeader } from '@/components/route-detail/RouteSummaryHeader';
import { JourneySegment, JourneyStopTarget, TripStepList } from '@/components/route-detail/TripStepList';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { mapApiRouteToJourneySegments, mapApiRouteToRouteResultCard } from '@/lib/mappers/routeMapper';
import { readRouteSearchLocations, readRouteSearchResults, saveRouteSearchLocations, saveRouteSearchResults, RouteSearchLocations } from '@/lib/routeSearchTransfer';
import { parseRouteSearchQuery, SORT_SLUG_TO_ENUM, isRouteSearchInServiceArea } from '@/lib/routeSearchParams';
import { fetchRouteGeometry, searchRoutes } from '@/lib/api';
import {
  transformApiRouteToMapMarkers,
  transformApiRouteToMapPolylines,
  transformApiRouteToMapStops,
} from '@/lib/utils/mapDataTransform';
import { MapFocusTarget, MapViewerMarker, MapViewerPolyline, MapViewerStop } from '@/components/map/MapViewer';
import BackArrowIcon from '@/components/icons/cari-rute/BackArrowIcon';
import ExpandIcon from '@/components/icons/cari-rute/ExpandIcon';
import CollapseIcon from '@/components/icons/cari-rute/CollapseIcon';
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
 * Detail rute: data dibaca dari query pencarian di URL (link shareable —
 * diulang pencariannya dengan parameter yang sama, lalu rute dipilih by ID).
 * Kontrak BE belum menyediakan endpoint detail-by-ID, jadi tanpa query lengkap
 * halaman ini fallback ke hasil pencarian di sessionStorage tab yang sama
 * (aliran lama): membuka link detail polos di tab baru tetap menampilkan
 * state "rute tidak ditemukan".
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
  // useSearchParams wajib dibungkus Suspense saat prerender.
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <RouteDetailPageContent />
    </Suspense>
  );
}

function RouteDetailPageContent() {
  const params = useParams();
  const routeId = params.routeId as string;
  const searchParams = useSearchParams();

  // Query pencarian yang sama dengan halaman daftar (dibawa link "Lihat Detail").
  const urlState = useMemo(() => parseRouteSearchQuery(searchParams), [searchParams]);
  // Tombol kembali mempertahankan query agar parameter tidak hilang.
  const backHref = useMemo(() => {
    const raw = searchParams.toString();
    return raw ? `/cari-rute?${raw}` : '/cari-rute';
  }, [searchParams]);

  // sessionStorage hanya ada di client — baca setelah mount agar tidak hydration mismatch.
  const [selectedRoute, setSelectedRoute] = useState<ApiRoute | null>(null);
  const [searchLocations, setSearchLocations] = useState<RouteSearchLocations | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapFocusTarget, setMapFocusTarget] = useState<MapFocusTarget | null>(null);
  const mapSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Ada query lengkap (link share / refresh / dibuka di browser lain):
    // ulangi pencarian yang sama persis (termasuk sort & filter dari URL agar
    // urutan/ID rute konsisten), lalu pilih rute berdasarkan routeId.
    if (urlState) {
      // Koordinat hasil edit manual di luar wilayah layanan: jangan fetch
      // (backend 400), jangan cerminkan ke storage — tampilkan pesan jelas.
      if (!isRouteSearchInServiceArea(urlState)) {
        setSelectedRoute(null);
        setSearchLocations({
          origin: {
            id: 'shared:origin',
            name: urlState.origin.name,
            district: urlState.origin.district,
            lat: urlState.origin.lat,
            lng: urlState.origin.lng,
          },
          destination: {
            id: 'shared:destination',
            name: urlState.destination.name,
            district: urlState.destination.district,
            lat: urlState.destination.lat,
            lng: urlState.destination.lng,
          },
        });
        setSearchError(
          'Lokasi di tautan ini berada di luar wilayah layanan (Bandung metropolitan). Periksa kembali tautan atau cari ulang dari halaman beranda.',
        );
        setIsSearching(false);
        setHasLoaded(true);
        return;
      }

      let cancelled = false;
      setHasLoaded(false);
      setIsSearching(true);
      setSearchError('');
      setSelectedRoute(null);
      const locations: RouteSearchLocations = {
        origin: {
          id: 'shared:origin',
          name: urlState.origin.name,
          district: urlState.origin.district,
          lat: urlState.origin.lat,
          lng: urlState.origin.lng,
        },
        destination: {
          id: 'shared:destination',
          name: urlState.destination.name,
          district: urlState.destination.district,
          lat: urlState.destination.lat,
          lng: urlState.destination.lng,
        },
      };
      setSearchLocations(locations);
      // Cerminkan ke storage (kompatibilitas aliran lama + restore form beranda).
      saveRouteSearchLocations(locations.origin, locations.destination);

      searchRoutes({
        origin: { name: locations.origin.name, lat: locations.origin.lat, lng: locations.origin.lng },
        destination: { name: locations.destination.name, lat: locations.destination.lat, lng: locations.destination.lng },
        preferences: {
          sortBy: SORT_SLUG_TO_ENUM[urlState.sort],
          maxWalkingDistance: urlState.maxWalkingDistance,
          allowedModa: urlState.includedModa,
        },
      })
        .then((response) => {
          if (cancelled) return;
          saveRouteSearchResults(response.data);
          setSelectedRoute(response.data.routes.find((route) => route.id === routeId) ?? null);
          setIsSearching(false);
          setHasLoaded(true);
        })
        .catch((fetchError: unknown) => {
          if (cancelled) return;
          setSearchError(
            fetchError instanceof Error ? fetchError.message : 'Gagal memuat rute. Silakan coba lagi.',
          );
          setIsSearching(false);
          setHasLoaded(true);
        });

      return () => {
        cancelled = true;
      };
    }

    // Fallback aliran lama: link detail polos tanpa query — baca hasil
    // pencarian di sessionStorage tab yang sama.
    setSelectedRoute(findRouteById(routeId));
    setSearchLocations(readRouteSearchLocations());
    setHasLoaded(true);
  }, [routeId, urlState]);

  // Perkecil peta dengan Escape.
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
    // Titik awal "Lokasi saya" (GPS perangkat) tampil sebagai bulat biru, lainnya bulat abu-abu.
    const originIsCurrentLocation =
      searchLocations?.origin.name.trim().toLowerCase() === 'lokasi saya';
    return transformApiRouteToMapMarkers(selectedRoute, { originIsCurrentLocation });
  }, [selectedRoute, searchLocations]);

  // Titik perhentian halte yang dilewati (bulat putih kecil, klik -> nama halte)
  const mapStops = useMemo<MapViewerStop[]>(() => {
    if (!selectedRoute) return [];
    return transformApiRouteToMapStops(selectedRoute);
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

  // Klik nama halte di daftar perhentian -> peta zoom ke halte itu.
  // Di mobile (peta ada di atas daftar) halaman di-scroll dulu ke kartu Peta, baru peta zoom
  // supaya animasinya terlihat. Di desktop peta sticky sehingga langsung zoom.
  const handleStopSelect = useCallback((stop: JourneyStopTarget) => {
    const target: MapFocusTarget = {
      name: stop.name,
      position: [stop.lat, stop.lng],
      nonce: Date.now(),
    };

    const isSingleColumn = !window.matchMedia('(min-width: 1024px)').matches;
    if (isSingleColumn) {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => setMapFocusTarget(target), 450);
    } else {
      setMapFocusTarget(target);
    }
  }, []);

  // Handle route not found
  if (!selectedRoute) {
    // Hindari kedip layar "rute tidak ditemukan" saat data belum dibaca /
    // pencarian ulang dari query URL masih berjalan.
    if (!hasLoaded || isSearching) {
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
            {searchError ||
              'Data rute tidak tersedia. Cari ulang rute dari halaman pencarian untuk memuat detailnya.'}
          </p>
          <Link
            href={backHref}
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
          href={backHref}
          className="inline-flex items-center gap-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          <BackArrowIcon className="h-2.5 w-auto" />
          Kembali ke Rekomendasi Rute
        </Link>

        <div className="mt-6">
          <RouteSummaryHeader route={toRouteOption(selectedRoute, originName, destinationName)} />
        </div>

        {/* Detail perjalanan dan peta */}
        <div
          className={`mt-6 grid grid-cols-1 gap-6 motion-reduce:transition-none lg:transition-[grid-template-columns] lg:duration-500 lg:ease-[cubic-bezier(0.4,0,0.2,1)] ${
            mapExpanded ? 'lg:grid-cols-[2fr_3fr]' : 'lg:grid-cols-[3fr_2fr]'
          }`}
        >
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
            onStopSelect={handleStopSelect}
          />

          <div className="order-first h-fit lg:sticky lg:top-32 lg:order-none">
            <section
              ref={mapSectionRef}
              className="scroll-mt-32 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
              aria-label="Peta"
            >
              <h2 className="text-lg font-bold text-neutral-900">Peta</h2>
              <div className="relative isolate z-0 mt-4">
                <div
                  className={`w-full overflow-hidden rounded-xl transition-[height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                    mapExpanded
                      ? 'h-112 lg:h-[min(36rem,calc(100vh_-_14rem))]'
                      : 'h-64 sm:h-72'
                  }`}
                >
                  <MapViewerNoSSR
                    markers={mapMarkers}
                    stops={mapStops}
                    focusTarget={mapFocusTarget}
                    polylines={mapPolylines}
                    className="h-full w-full"
                    zoomControlPosition="bottomright"
                    expanded={mapExpanded}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMapExpanded((value) => !value)}
                  aria-label={mapExpanded ? 'Perkecil peta' : 'Perbesar peta'}
                  aria-expanded={mapExpanded}
                  className="absolute right-3 top-3 z-[1000] grid h-9 w-9 place-items-center rounded-lg bg-white shadow-md transition-colors hover:bg-neutral-50 cursor-pointer"
                >
                  {mapExpanded ? <CollapseIcon className="h-5 w-5" /> : <ExpandIcon className="h-5 w-5" />}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
