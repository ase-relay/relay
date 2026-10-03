import { z } from 'zod';

// Nilai segmen per halte: bilangan bulat > 0 bila terisi; null/undefined = hitung otomatis.
// Angka 0 diizinkan di level Zod agar stop terakhir 0/0 (round-trip GET -> PUT) lolos;
// penegakan "0 ditolak pada segmen non-terakhir" dilakukan di RuteService.replaceStops
// per posisi (lihat J3-d/J3-e).
const segmenMenitSchema = z.union([
  z
    .number({ error: 'Estimasi menit harus berupa angka' })
    .int({ error: 'Estimasi menit harus bilangan bulat' })
    .positive({ error: 'Estimasi menit harus bilangan bulat lebih besar dari 0' }),
  z.null(),
  z.undefined(),
  z.literal(0),
]);

const segmenMeterSchema = z.union([
  z
    .number({ error: 'Jarak meter harus berupa angka' })
    .int({ error: 'Jarak meter harus bilangan bulat' })
    .positive({ error: 'Jarak meter harus bilangan bulat lebih besar dari 0' }),
  z.null(),
  z.undefined(),
  z.literal(0),
]);

export const stopInputSchema = z.object({
  halteId: z.number({ error: 'ID Halte harus berupa angka' }).int({ error: 'ID Halte harus integer' }).positive('ID Halte harus positif'),
  estimasiMenit: segmenMenitSchema.optional(),
  jarakMeter: segmenMeterSchema.optional(),
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
