export type SortByPreference = 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'LEAST_TRANSFERS';

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

export interface RoutingPreferences {
  sortBy?: SortByPreference;
  maxWalkingDistance?: number; // meter (default 1500m)
  allowedModa?: number[]; // array of moda IDs
}

export interface RoutingSearchRequestDTO {
  origin: LocationPoint;
  destination: LocationPoint;
  preferences?: RoutingPreferences;
}

export type LegType = 'WALK' | 'TRANSIT';

export interface PassedStopInfo {
  id: number;
  namaHalte: string;
  urutan: number;
  latitude: number;
  longitude: number;
}

export interface RouteLeg {
  step: number;
  legType: LegType;
  instruction: string;
  distanceMeters: number;
  durationMinutes: number;
  fare: number;
  from: {
    id?: number;
    name: string;
    lat: number;
    lng: number;
  };
  to: {
    id?: number;
    name: string;
    lat: number;
    lng: number;
  };
  moda?: {
    id: number;
    nama: string;
    tipe: string | null;
    ikon: string | null;
  };
  rute?: {
    id: number;
    kode: string | null;
    nama: string;
  };
  fromHalte?: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  toHalte?: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  passedStopsCount?: number;
  passedStops?: PassedStopInfo[];
  geometry?: [number, number][]; // Array of [lat, lng] coordinates following actual road network for Leaflet <Polyline>
}

export interface RouteOptionSummary {
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalFare: number;
  transfersCount: number;
  departureHalte: string;
  arrivalHalte: string;
}

export interface RouteOption {
  id: string;
  type: 'DIRECT' | 'TRANSIT';
  summary: RouteOptionSummary;
  legs: RouteLeg[];
}

export interface RoutingSearchResponseData {
  origin: LocationPoint;
  destination: LocationPoint;
  totalRoutesFound: number;
  routes: RouteOption[];
}
