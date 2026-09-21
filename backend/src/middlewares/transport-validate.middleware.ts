import { z } from 'zod';

// Schema Validasi Halte
export const createHalteSchema = z.object({
  namaHalte: z.string().min(2, 'Nama halte minimal 2 karakter'),
  latitude: z.number({ error: 'Latitude harus berupa angka float' }),
  longitude: z.number({ error: 'Longitude harus berupa angka float' }),
  alamat: z.string().optional(),
  kota: z.string().optional(),
  isTransit: z.boolean().optional(),
});

export const updateHalteSchema = createHalteSchema.partial();

export const nearbyHalteSchema = z.object({
  lat: z.coerce.number({ error: 'Parameter lat harus berupa angka' }),
  lng: z.coerce.number({ error: 'Parameter lng harus berupa angka' }),
  radius: z.coerce.number().optional(),
});

// Schema Validasi Rute
export const stopInputSchema = z.object({
  halteId: z.number().int().positive('ID Halte harus integer positif'),
  urutan: z.number().int().positive('Urutan harus integer positif (1, 2, ...)'),
  estimasiMenit: z.number().int().nonnegative().optional(),
  jarakMeter: z.number().int().nonnegative().optional(),
});

export const createRuteSchema = z.object({
  namaRute: z.string().min(3, 'Nama rute minimal 3 karakter'),
  kodeRute: z.string().optional(),
  deskripsi: z.string().optional(),
  modaId: z.number().int().positive('Moda ID harus integer positif'),
  isActive: z.boolean().optional(),
  stops: z.array(stopInputSchema).optional(),
});

export const updateRuteSchema = z.object({
  namaRute: z.string().min(3).optional(),
  kodeRute: z.string().optional(),
  deskripsi: z.string().optional(),
  modaId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const updateStopsSchema = z.object({
  stops: z.array(stopInputSchema).min(1, 'Minimal sertakan 1 halte pemberhentian'),
});
