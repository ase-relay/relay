import { z } from 'zod';

export const stopInputSchema = z.object({
  halteId: z.number({ error: 'ID Halte harus berupa angka' }).int({ error: 'ID Halte harus integer' }).positive('ID Halte harus positif'),
  estimasiMenit: z.number({ error: 'Estimasi menit harus berupa angka' }).int({ error: 'Estimasi menit harus integer' }).nonnegative('Estimasi menit tidak boleh negatif').optional(),
  jarakMeter: z.number({ error: 'Jarak meter harus berupa angka' }).int({ error: 'Jarak meter harus integer' }).nonnegative('Jarak meter tidak boleh negatif').optional(),
});

export const createRuteSchema = z.object({
  namaRute: z.string().min(3, 'Nama rute minimal 3 karakter'),
  kodeRute: z.string().optional(),
  deskripsi: z.string().optional(),
  modaId: z.number().int().positive('Moda ID harus positif'),
  isActive: z.boolean().optional(),
  stops: z.array(stopInputSchema).min(2, 'Minimal 2 halte pemberhentian'),
});

export const updateRuteSchema = z.object({
  namaRute: z.string().min(3, 'Nama rute minimal 3 karakter').optional(),
  kodeRute: z.string().optional(),
  deskripsi: z.string().optional(),
  modaId: z.number().int().positive('Moda ID harus positif').optional(),
  isActive: z.boolean().optional(),
  stops: z.array(stopInputSchema).min(2, 'Minimal 2 halte pemberhentian').optional(),
});

export const updateStopsSchema = z.object({
  stops: z.array(stopInputSchema).min(2, 'Minimal 2 halte pemberhentian'),
});
