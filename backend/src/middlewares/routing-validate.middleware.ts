import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ROUTING_CONFIG } from '../config/routing.config';

/**
 * Validasi request POST /api/routing/search (format error dipertahankan:
 * { status: 'error', message } dengan HTTP 400).
 */

const bbox = ROUTING_CONFIG.validationBbox;
const walkingOptions = ROUTING_CONFIG.allowedWalkingDistanceMeters;

const locationPointSchema = (label: string) =>
  z
    .object({
      name: z.string().min(1, `Nama ${label} tidak boleh kosong`).optional(),
      lat: z.number({ message: `Koordinat lat ${label} harus berupa angka` }),
      lng: z.number({ message: `Koordinat lng ${label} harus berupa angka` }),
    })
    .superRefine((point, ctx) => {
      const outOfRange =
        point.lat < bbox.minLat ||
        point.lat > bbox.maxLat ||
        point.lng < bbox.minLng ||
        point.lng > bbox.maxLng;
      if (outOfRange) {
        ctx.addIssue({
          code: 'custom',
          message: `Koordinat ${label} berada di luar wilayah Bandung-Cimahi`,
        });
      }
    });

const routingSearchSchema = z
  .object({
    origin: locationPointSchema('origin').optional(),
    destination: locationPointSchema('destination').optional(),
    departureTime: z
      .string({ message: 'departureTime harus berupa teks "HH:MM"' })
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'departureTime harus berformat HH:MM (contoh: 07:30)'
      )
      .optional(),
    preferences: z
      .object({
        sortBy: z
          .enum(['RECOMMENDED', 'FASTEST', 'CHEAPEST', 'LEAST_TRANSFERS'], {
            message:
              'sortBy harus salah satu dari RECOMMENDED, FASTEST, CHEAPEST, LEAST_TRANSFERS',
          })
          .optional(),
        maxWalkingDistance: z
          .number({ message: 'maxWalkingDistance harus berupa angka (meter)' })
          .refine(
            (value) => walkingOptions.includes(value),
            `maxWalkingDistance harus salah satu dari ${walkingOptions.join(', ')} meter`
          )
          .optional(),
        allowedModa: z
          .array(
            z
              .number({ message: 'allowedModa harus berupa array ID angka' })
              .int('ID moda harus bilangan bulat')
              .positive('ID moda harus lebih besar dari 0')
          )
          .max(100, 'allowedModa maksimal 100 entri')
          .optional(),
      })
      .optional(),
  })
  .superRefine((body, ctx) => {
    if (!body.origin) {
      ctx.addIssue({
        code: 'custom',
        path: ['origin'],
        message: 'Field origin (dengan lat dan lng valid) wajib diisi',
      });
    }
    if (!body.destination) {
      ctx.addIssue({
        code: 'custom',
        path: ['destination'],
        message: 'Field destination (dengan lat dan lng valid) wajib diisi',
      });
    }
  });

export const validateRoutingSearch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const parsed = routingSearchSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({
      status: 'error',
      message: issue?.message || 'Request tidak valid',
    });
    return;
  }

  const body = parsed.data;
  if (body.origin && !body.origin.name) body.origin.name = 'Titik Asal';
  if (body.destination && !body.destination.name) body.destination.name = 'Titik Tujuan';
  if (body.preferences) {
    if (body.preferences.maxWalkingDistance === undefined) {
      delete body.preferences.maxWalkingDistance;
    }
    if (body.preferences.sortBy === undefined) delete body.preferences.sortBy;
    if (body.preferences.allowedModa === undefined) delete body.preferences.allowedModa;
  }

  req.body = body;
  next();
};

/* ---------------------------------------------------------------------------
 * POST /api/routing/geometry (aditif) — susulan geometri OSRM per leg.
 * Format error sama: { status: 'error', message } + HTTP 400.
 * ------------------------------------------------------------------------- */

const geometryPointSchema = z.object({
  lat: z
    .number({ message: 'lat harus berupa angka' })
    .min(-90, 'lat minimal -90')
    .max(90, 'lat maksimal 90'),
  lng: z
    .number({ message: 'lng harus berupa angka' })
    .min(-180, 'lng minimal -180')
    .max(180, 'lng maksimal 180'),
});

const routingGeometrySchema = z.object({
  legs: z
    .array(
      z.object({
        step: z
          .number({ message: 'step harus berupa angka' })
          .int('step harus bilangan bulat')
          .positive('step harus lebih besar dari 0')
          .optional(),
        legType: z.enum(['WALK', 'TRANSIT'], {
          message: 'legType harus salah satu dari WALK, TRANSIT',
        }),
        from: geometryPointSchema,
        to: geometryPointSchema,
        passedStops: z
          .array(geometryPointSchema)
          .max(50, 'passedStops maksimal 50 titik')
          .optional(),
        instruction: z
          .string({ message: 'instruction harus berupa teks' })
          .max(300, 'instruction maksimal 300 karakter')
          .optional(),
      })
    )
    .min(1, 'legs minimal berisi 1 leg')
    .max(20, 'legs maksimal 20 leg'),
});

export const validateRoutingGeometry = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const parsed = routingGeometrySchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({
      status: 'error',
      message: issue?.message || 'Request tidak valid',
    });
    return;
  }

  req.body = parsed.data;
  next();
};
