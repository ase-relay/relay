export interface CoordinatePoint {
  lat: number;
  lng: number;
}

export interface RouteGeometryResult {
  geometry: [number, number][];
  steps: string[];
}

export class GeometryService {
  private static OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

  /**
   * Menerjemahkan manuver OSRM ke teks instruksi bahasa Indonesia
   */
  private static translateManeuverToIndonesian(step: any, isFirst: boolean, isLast: boolean): string {
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

    try {
      const coordsString = waypoints.map((pt) => `${pt.lng},${pt.lat}`).join(';');
      const url = `${this.OSRM_BASE_URL}/foot/${coordsString}?steps=true&overview=full&geometries=geojson`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RelayApp/1.0 (https://github.com/ase-relay/relay)',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: any = await response.json();
        if (
          data &&
          data.code === 'Ok' &&
          data.routes &&
          data.routes.length > 0 &&
          data.routes[0].geometry &&
          data.routes[0].geometry.coordinates
        ) {
          const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
          const geometry: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

          // Parse turn-by-turn steps
          const osrmSteps: any[] = data.routes[0].legs?.[0]?.steps || [];
          let steps: string[] = [];

          if (osrmSteps.length > 0) {
            steps = osrmSteps.map((step, idx) =>
              this.translateManeuverToIndonesian(step, idx === 0, idx === osrmSteps.length - 1)
            );
          }

          if (steps.length === 0 && defaultInstruction) {
            steps = [defaultInstruction];
          }

          return { geometry, steps };
        }
      }
    } catch (err: any) {
      console.warn(`[GeometryService] OSRM walk details fetch skipped/failed (${err.message}). Using fallback.`);
    }

    return {
      geometry: waypoints.map((pt) => [pt.lat, pt.lng]),
      steps: defaultInstruction ? [defaultInstruction] : ['Jalan kaki menuju lokasi'],
    };
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

    try {
      const coordsString = waypoints.map((pt) => `${pt.lng},${pt.lat}`).join(';');
      const profile = mode === 'foot' ? 'foot' : 'driving';
      const url = `${this.OSRM_BASE_URL}/${profile}/${coordsString}?overview=full&geometries=geojson`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RelayApp/1.0 (https://github.com/ase-relay/relay)',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: any = await response.json();
        if (
          data &&
          data.code === 'Ok' &&
          data.routes &&
          data.routes.length > 0 &&
          data.routes[0].geometry &&
          data.routes[0].geometry.coordinates
        ) {
          const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
          return rawCoords.map(([lng, lat]) => [lat, lng]);
        }
      }
    } catch (err: any) {
      console.warn(`[GeometryService] OSRM geometry fetch skipped/failed (${err.message}). Using straight-line fallback.`);
    }

    // Fallback: garis lurus antar waypoints
    return waypoints.map((pt) => [pt.lat, pt.lng]);
  }
}
