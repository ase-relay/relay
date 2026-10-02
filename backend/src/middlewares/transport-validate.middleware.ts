import { z } from 'zod';

// Schema Validasi Halte
export const createHalteSchema = z.object({
  namaHalte: z.string({ error: 'Nama halte harus berupa teks' }).trim().min(1, 'Nama halte wajib diisi'),
  latitude: z
    .number({ error: 'Latitude harus berupa angka' })
    .min(-90, 'Latitude minimal -90')
    .max(90, 'Latitude maksimal 90'),
  longitude: z
    .number({ error: 'Longitude harus berupa angka' })
    .min(-180, 'Longitude minimal -180')
    .max(180, 'Longitude maksimal 180'),
  alamat: z.string({ error: 'Alamat harus berupa teks' }).optional(),
  kota: z.string({ error: 'Kota harus berupa teks' }).optional(),
  isTransit: z.boolean({ error: 'Status transit harus berupa boolean' }).optional(),
  isActive: z.boolean({ error: 'Status aktif harus berupa boolean' }).optional(),
});

export const updateHalteSchema = createHalteSchema.partial();

export const nearbyHalteSchema = z.object({
  lat: z.coerce.number({ error: 'Parameter lat harus berupa angka' }),
  lng: z.coerce.number({ error: 'Parameter lng harus berupa angka' }),
  radius: z.coerce.number().optional(),
});
