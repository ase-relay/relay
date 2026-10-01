import type { VehicleType } from '@/components/icons/vehicle/VehicleIcon';

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
  /** Nama tempat asal untuk judul ringkasan (fallback: nama halte). */
  originStopName: string;
  /** Nama tempat tujuan untuk judul ringkasan (fallback: nama halte). */
  destinationStopName: string;
  /** Ikon lingkaran kendaraan utama — diturunkan dari moda leg TRANSIT pertama. */
  vehicleType: VehicleType;
  /** Badge kode rute (mis. "TMP-3D"); bisa kosong. */
  badges: string[];
  /** Nama operator/rute untuk teks abu-abu di samping badge; bisa kosong. */
  operator: string;
  /** Total menit berjalan kaki dari semua leg WALK. */
  walkingMinutes: number;
}
