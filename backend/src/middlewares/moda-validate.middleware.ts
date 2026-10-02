import { z } from 'zod';

export const createModaSchema = z.object({
  namaModa: z.string().min(1, 'Nama moda wajib diisi'),
  tipeModa: z.string().optional(),
  deskripsi: z.string().optional(),
  rataRataKecepatanKmh: z
    .number({ error: 'Kecepatan rata-rata harus berupa angka' })
    .positive('Kecepatan rata-rata harus lebih besar dari 0')
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateModaSchema = z.object({
  namaModa: z.string().min(1, 'Nama moda wajib diisi').optional(),
  tipeModa: z.string().optional(),
  deskripsi: z.string().optional(),
  rataRataKecepatanKmh: z
    .number({ error: 'Kecepatan rata-rata harus berupa angka' })
    .positive('Kecepatan rata-rata harus lebih besar dari 0')
    .optional(),
  isActive: z.boolean().optional(),
});
