import { z } from 'zod';

const finiteNumber = (pesanAngka: string) =>
  z.number({ error: pesanAngka }).refine((v) => Number.isFinite(v), { error: pesanAngka });

export const tipeModaSchema = z.enum(['BUS', 'KERETA', 'OJEK_ONLINE'], {
  error: 'Tipe moda harus BUS, KERETA, atau OJEK_ONLINE',
});

export const createModaSchema = z.object({
  namaModa: z.string().min(1, 'Nama moda wajib diisi'),
  tipeModa: tipeModaSchema,
  deskripsi: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter').nullable().optional(),
  rataRataKecepatanKmh: finiteNumber('Kecepatan rata-rata harus berupa angka')
    .positive({ error: 'Kecepatan rata-rata harus lebih besar dari 0' })
    .max(200, { error: 'Kecepatan rata-rata maksimal 200 km/jam' })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateModaSchema = z.object({
  namaModa: z.string().min(1, 'Nama moda wajib diisi').optional(),
  tipeModa: tipeModaSchema.optional(),
  deskripsi: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter').nullable().optional(),
  rataRataKecepatanKmh: finiteNumber('Kecepatan rata-rata harus berupa angka')
    .positive({ error: 'Kecepatan rata-rata harus lebih besar dari 0' })
    .max(200, { error: 'Kecepatan rata-rata maksimal 200 km/jam' })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});
