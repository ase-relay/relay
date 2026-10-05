import { Request } from 'express';

// Halte Interfaces
export interface HalteFilter {
  search?: string;
  kota?: string;
  isTransit?: boolean;
}

export interface NearbyHalteQuery {
  lat: number;
  lng: number;
  radius?: number; // default radius dalam meter
}

export interface CreateHalteDTO {
  namaHalte: string;
  latitude: number;
  longitude: number;
  alamat?: string;
  kota?: string;
  isTransit?: boolean;
  isActive?: boolean;
}

export interface UpdateHalteDTO {
  namaHalte?: string;
  latitude?: number;
  longitude?: number;
  alamat?: string;
  kota?: string;
  isTransit?: boolean;
  isActive?: boolean;
}

// Rute Interfaces
export interface RuteFilter {
  search?: string;
  modaId?: number;
  isActive?: boolean;
}

export interface StopInputDTO {
  halteId: number;
  estimasiMenit?: number | null;
  jarakMeter?: number | null;
  jadwalKeberangkatan?: string[];
}

export interface CreateRuteDTO {
  namaRute: string;
  kodeRute?: string;
  deskripsi?: string;
  jamMulaiOperasi?: string;
  jamSelesaiOperasi?: string;
  intervalWaktu?: string;
  modaId: number;
  isActive?: boolean;
  stops?: StopInputDTO[];
}

export interface UpdateRuteDTO {
  namaRute?: string;
  kodeRute?: string;
  deskripsi?: string;
  jamMulaiOperasi?: string | null;
  jamSelesaiOperasi?: string | null;
  intervalWaktu?: string | null;
  modaId?: number;
  isActive?: boolean;
  stops?: StopInputDTO[];
}
