import { ROUTING_CONFIG } from '../config/routing.config';

export interface CoordinatePoint {
  lat: number;
  lng: number;
}

export interface RouteGeometryResult {
  geometry: [number, number][];
  steps: string[];
}

interface OsrmRouteResult {
  geometry: [number, number][];
  steps?: string[];
}

interface CachedGeometry {
  geometry: [number, number][];
  steps?: string[];
  expiresAt: number;
}

/** Jeda antar percobaan OSRM pertama→kedua. */
const OSRM_RETRY_DELAY_MS = 150;
/** Timeout internal per percobaan fetch OSRM. */
const OSRM_FETCH_TIMEOUT_MS = 3500;
/** Percobaan maksimal per URL (1 retry untuk 429/5xx/gangguan jaringan). */
const OSRM_MAX_ATTEMPTS = 2;

interface OsrmStep {
  name?: string;
  maneuver?: { type?: string; modifier?: string };
}

/**
 * Akses OSRM dengan tiga lapis ketahanan:
 * 1. Cache in-process (TTL dari config) — pencarian ulang instan & bebas flaky.
 *    Hanya hasil SUKSES yang di-cache; fallback garis lurus tidak di-cache
 *    agar pencarian berikutnya tetap mencoba lagi.
 * 2. Dedupe in-flight — URL sama yang diminta bersamaan berbagi satu promise.
 * 3. Retry 1× untuk 429/5xx/gangguan jaringan (timeout/abort tidak di-retry
 *    karena budget luar di RoutingService sudah menentukan).
 *
 * Cache tetap terisi walau pemanggil (withTimeout RoutingService) sudah
 * memakai fallback — promise fetch dibiarkan selesai di background sehingga
 * request berikutnya memakai hasil yang sudah hangat.
 */
export class GeometryService {
  private static OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

  private static cache = new Map<string, CachedGeometry>();
  private static inflight = new Map<string, Promise<OsrmRouteResult | null>>();

  /**
   * Menerjemahkan manuver OSRM ke teks instruksi bahasa Indonesia
   */
  private static translateManeuverToIndonesian(
    step: OsrmStep,
    isFirst: boolean,
    isLast: boolean
  ): string {
    const m = step.maneuver || {};
    const type = (m.type || '').toLowerCase();
    const modifier = (m.modifier || '').toLowerCase();
    const name = step.name ? step.name.trim() : '';

    if (isFirst || type === 'depart') {
      if (name) return `Mulai berjalan ke arah ${name}`;
      if (modifier.includes('left')) return 'Mulai berjalan, ambil arah ke kiri';
      if (modifier.includes('right')) return 'Mulai berjalan, ambil arah ke kanan';
      return 'Mulai berjalan ke arah tujuan';
    }

    if (isLast || type === 'arrive') {
      if (modifier === 'left') return 'Tujuan ada di sebelah kiri';
      if (modifier === 'right') return 'Tujuan ada di sebelah kanan';
      return 'Tiba di titik tujuan';
    }

    let action = '';
    if (type === 'turn' || type === 'end of road') {
      if (modifier === 'left') action = 'Belok kiri';
      else if (modifier === 'right') action = 'Belok kanan';
      else if (modifier === 'sharp left') action = 'Belok tajam ke kiri';
      else if (modifier === 'sharp right') action = 'Belok tajam ke kanan';
      else if (modifier === 'slight left') action = 'Ambil serong kiri';
      else if (modifier === 'slight right') action = 'Ambil serong kanan';
      else if (modifier === 'uturn') action = 'Putar balik';
      else action = 'Belok';
    } else if (type === 'fork') {
      if (modifier.includes('left')) action = 'Ambil percabangan ke kiri';
      else if (modifier.includes('right')) action = 'Ambil percabangan ke kanan';
      else action = 'Ambil percabangan';
    } else if (type === 'roundabout' || type === 'rotary') {
      action = 'Masuk bundaran';
    } else if (type === 'continue' || type === 'new name' || modifier === 'straight') {
      action = 'Lurus terus';
    } else {
      action = 'Lanjut berjalan';
    }

    if (name) {
      return `${action} ke ${name}`;
    }
    return action;
  }

  private static cacheKey(profile: string, waypoints: CoordinatePoint[], withSteps: boolean): string {
    const coords = waypoints.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join(';');
    return `${profile}|${withSteps ? 'steps' : 'plain'}|${coords}`;
  }

  /** Simpan hasil sukses ke cache (evict entri paling lama bila penuh). */
  private static remember(key: string, value: { geometry: [number, number][]; steps?: string[] }): void {
    if (this.cache.size >= ROUTING_CONFIG.geometryCacheMaxEntries) {
      const oldest = this.cache.keys().next();
      if (!oldest.done) this.cache.delete(oldest.value);
    }
    this.cache.set(key, {
      geometry: value.geometry,
      steps: value.steps,
      expiresAt: Date.now() + ROUTING_CONFIG.geometryCacheTtlMs,
    });
  }

  /** Ambil dari cache bila masih hidup; entri kedaluwarsa dibuang. */
  private static lookup(key: string): CachedGeometry | null {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return hit;
  }

  /** Jalankan factory sekali per key — permintaan paralel berbagi promise yang sama. */
  private static async withInflight(
    key: string,
    factory: () => Promise<OsrmRouteResult | null>
  ): Promise<OsrmRouteResult | null> {
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const promise = factory().finally(() => {
      this.inflight.delete(key);
    });
    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * Fetch JSON dari OSRM dengan maksimal 2 percobaan.
   * Retry hanya untuk 429/5xx/gangguan jaringan; timeout/abort berhenti.
   */
  private static async fetchOsrmJson(url: string): Promise<unknown | null> {
    for (let attempt = 1; attempt <= OSRM_MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, OSRM_RETRY_DELAY_MS));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OSRM_FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'RelayApp/1.0 (https://github.com/ase-relay/relay)',
          },
        });
        if (response.status === 429 || response.status >= 500) {
          continue; // gangguan sementara → percobaan berikutnya
        }
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null; // timeout internal → jangan retry, serahkan ke budget luar
        }
        // gangguan jaringan selain timeout → percobaan berikutnya
      } finally {
        clearTimeout(timeoutId);
      }
    }
    return null;
  }

  /** Parse respons OSRM → koordinat [lat,lng] + langkah kaki; null bila tidak valid. */
  private static parseOsrmRoute(data: unknown): OsrmRouteResult | null {
    const payload = data as {
      code?: string;
      routes?: Array<{
        geometry?: { coordinates?: [number, number][] };
        legs?: Array<{ steps?: OsrmStep[] }>;
      }>;
    } | null;
    if (
      !payload ||
      payload.code !== 'Ok' ||
      !payload.routes ||
      payload.routes.length === 0 ||
      !payload.routes[0].geometry ||
      !payload.routes[0].geometry.coordinates
    ) {
      return null;
    }
    const rawCoords: [number, number][] = payload.routes[0].geometry.coordinates;
    const geometry: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);
    return { geometry };
  }

  /**
   * Mengambil geometry rute jalan raya dan instruksi langkah belokan dari OSRM
   */
  static async getWalkRouteDetails(
    waypoints: CoordinatePoint[],
    defaultInstruction?: string
  ): Promise<RouteGeometryResult> {
    if (!waypoints || waypoints.length < 2) {
      return {
        geometry: [],
        steps: defaultInstruction ? [defaultInstruction] : [],
      };
    }

    const fallbackSteps = [defaultInstruction ?? 'Jalan kaki menuju lokasi'];
    const fallback: RouteGeometryResult = {
      geometry: waypoints.map((point) => [point.lat, point.lng]),
      steps: fallbackSteps,
    };

    const key = this.cacheKey('foot', waypoints, true);
    const cached = this.lookup(key);
    if (cached) {
      return { geometry: [...cached.geometry], steps: cached.steps ?? [...fallbackSteps] };
    }

    const result = await this.withInflight(key, async () => {
      const coordsString = waypoints.map((point) => `${point.lng},${point.lat}`).join(';');
      const url = `${this.OSRM_BASE_URL}/foot/${coordsString}?steps=true&overview=full&geometries=geojson`;
      const data = await this.fetchOsrmJson(url);
      const parsed = this.parseOsrmRoute(data);
      if (!parsed) {
        console.warn('[GeometryService] OSRM walk fetch gagal. Using fallback.');
        return null;
      }

      const osrmSteps: OsrmStep[] =
        (data as { routes?: Array<{ legs?: Array<{ steps?: OsrmStep[] }> }> })?.routes?.[0]?.legs?.[0]
          ?.steps ?? [];
      let steps: string[] =
        osrmSteps.length > 0
          ? osrmSteps.map((step, index) =>
              this.translateManeuverToIndonesian(step, index === 0, index === osrmSteps.length - 1)
            )
          : [...fallbackSteps];

      this.remember(key, { geometry: parsed.geometry, steps });
      return { geometry: parsed.geometry, steps };
    });

    if (result) {
      return { geometry: [...result.geometry], steps: result.steps ?? [...fallbackSteps] };
    }
    return fallback;
  }

  /**
   * Mengambil geometry rute jalan raya dari OSRM (OpenStreetMap Routing Machine)
   * Format output: Array of [latitude, longitude] untuk langsung dirender oleh Leaflet <Polyline positions={leg.geometry} />
   */
  static async getRouteGeometry(
    waypoints: CoordinatePoint[],
    mode: 'driving' | 'foot' = 'driving'
  ): Promise<[number, number][]> {
    if (!waypoints || waypoints.length < 2) {
      return [];
    }

    const profile = mode === 'foot' ? 'foot' : 'driving';
    const key = this.cacheKey(profile, waypoints, false);
    const cached = this.lookup(key);
    if (cached) {
      return [...cached.geometry];
    }

    const result = await this.withInflight(key, async () => {
      const coordsString = waypoints.map((point) => `${point.lng},${point.lat}`).join(';');
      const url = `${this.OSRM_BASE_URL}/${profile}/${coordsString}?overview=full&geometries=geojson`;
      const data = await this.fetchOsrmJson(url);
      const parsed = this.parseOsrmRoute(data);
      if (!parsed) {
        console.warn('[GeometryService] OSRM geometry fetch gagal. Using fallback.');
        return null;
      }
      this.remember(key, { geometry: parsed.geometry });
      return parsed;
    });

    if (result) {
      return [...result.geometry];
    }

    // Fallback: garis lurus antar waypoints (tidak di-cache — coba lagi nanti)
    return waypoints.map((point) => [point.lat, point.lng]);
  }
}
