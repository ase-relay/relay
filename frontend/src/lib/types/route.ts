export interface TransportMode {
  id: string;
  name: string;          // "Jalan Kaki" | "Angkot" | "Bus/BRT" | "KRL Commuter" | "Ojek Online"
  icon: string;           // nama icon/slug
  colorHex: string;       // untuk badge/marker warna per moda
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;       // kecamatan
}

export interface RouteSegment {
  id: string;
  order: number;
  modeId: string;
  fromStopName: string;
  toStopName: string;
  departureTime: string;  // "08:00"
  instruction: string;    // "Naik Bus BRT Koridor 03 arah Terminal Baruga"
  distanceMeters?: number;
  walkingDurationMinutes?: number;
}

export interface RouteOption {
  id: string;
  label: string;          // "Rute 1"
  tag: 'tercepat' | 'termurah' | 'minim_transit' | null;
  totalDurationMinutes: number;
  totalCost: number;
  transitCount: number;
  segments: RouteSegment[];
  originStopName: string;
  destinationStopName: string;
}
