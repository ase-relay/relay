import { z } from 'zod';

const finiteNumber = (pesanAngka: string) =>
  z.number({ error: pesanAngka }).refine((v) => Number.isFinite(v), { error: pesanAngka });

export const createTarifSchema = z
  .object({
    modaId: z
      .number({ error: 'Moda ID harus berupa angka' })
      .int({ error: 'Moda ID harus bilangan bulat' })
      .positive({ error: 'Moda ID harus lebih besar dari 0' }),
    tipeTarif: z.enum(['FLAT', 'PER_KM'], { error: 'Tipe tarif harus FLAT atau PER_KM' }),
    nominalDasar: finiteNumber('Nominal dasar harus berupa angka').positive({
      error: 'Nominal dasar harus lebih besar dari 0',
    }),
    nominalPerKm: finiteNumber('Nominal per km harus berupa angka')
      .positive({ error: 'Nominal per km harus lebih besar dari 0' })
      .optional(),
    jarakMinimumKm: finiteNumber('Jarak minimum harus berupa angka')
      .min(0, { error: 'Jarak minimum tidak boleh negatif' })
      .nullable()
      .optional(),
    biayaLayanan: finiteNumber('Biaya layanan harus berupa angka')
      .min(0, { error: 'Biaya layanan tidak boleh negatif' })
      .optional(),
    keterangan: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipeTarif === 'PER_KM' && data.nominalPerKm === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['nominalPerKm'],
        message: 'Nominal per km wajib diisi untuk tarif PER_KM',
      });
    }
  });

export const updateTarifSchema = z.object({
  modaId: z
    .number({ error: 'Moda ID harus berupa angka' })
    .int({ error: 'Moda ID harus bilangan bulat' })
    .positive({ error: 'Moda ID harus lebih besar dari 0' })
    .optional(),
  tipeTarif: z.enum(['FLAT', 'PER_KM'], { error: 'Tipe tarif harus FLAT atau PER_KM' }).optional(),
  nominalDasar: finiteNumber('Nominal dasar harus berupa angka')
    .positive({ error: 'Nominal dasar harus lebih besar dari 0' })
    .optional(),
  nominalPerKm: finiteNumber('Nominal per km harus berupa angka')
    .positive({ error: 'Nominal per km harus lebih besar dari 0' })
    .nullable()
    .optional(),
  jarakMinimumKm: finiteNumber('Jarak minimum harus berupa angka')
    .min(0, { error: 'Jarak minimum tidak boleh negatif' })
    .nullable()
    .optional(),
  biayaLayanan: finiteNumber('Biaya layanan harus berupa angka')
    .min(0, { error: 'Biaya layanan tidak boleh negatif' })
    .optional(),
  keterangan: z.string().nullable().optional(),
});
