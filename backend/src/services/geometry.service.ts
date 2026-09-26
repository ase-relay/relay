export interface CoordinatePoint {
  lat: number;
  lng: number;
}

export class GeometryService {
  private static OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

  /**
   * Mengambil geometry rute jalan raya dari OSRM (OpenStreetMap Routing Machine)
   * Format output: Array of [latitude, longitude] untuk langsung dirender oleh Leaflet <Polyline positions={leg.geometry} />
   * @param waypoints Titik-titik koordinat urut (start -> stops -> end)
   * @param mode Mode perjalanan: 'foot' (jalan kaki) atau 'driving' (kendaraan / transit darat)
   */
  static async getRouteGeometry(
    waypoints: CoordinatePoint[],
    mode: 'driving' | 'foot' = 'driving'
  ): Promise<[number, number][]> {
    if (!waypoints || waypoints.length < 2) {
      return [];
    }

    try {
      // OSRM expects coordinates in lng,lat format joined by semicolon
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
          // GeoJSON coordinates are [longitude, latitude] -> convert to Leaflet format [latitude, longitude]
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
