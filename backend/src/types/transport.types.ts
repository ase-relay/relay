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
}

export interface UpdateHalteDTO {
  namaHalte?: string;
  latitude?: number;
  longitude?: number;
  alamat?: string;
  kota?: string;
  isTransit?: boolean;
}

// Rute Interfaces
export interface RuteFilter {
  search?: string;
  modaId?: number;
  isActive?: boolean;
}

export interface StopInputDTO {
  halteId: number;
  urutan: number;
  estimasiMenit?: number;
  jarakMeter?: number;
}

export interface CreateRuteDTO {
  namaRute: string;
  kodeRute?: string;
  deskripsi?: string;
  modaId: number;
  isActive?: boolean;
  stops?: StopInputDTO[];
}

export interface UpdateRuteDTO {
  namaRute?: string;
  kodeRute?: string;
  deskripsi?: string;
  modaId?: number;
  isActive?: boolean;
}
