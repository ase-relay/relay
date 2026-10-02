import { Request, Response } from 'express';
import { RuteService } from '../services/rute.service';
import {
  createRuteSchema,
  updateRuteSchema,
  updateStopsSchema,
} from '../middlewares/rute-validate.middleware';
import { HttpError } from '../utils/http-error';

export class RuteController {
  static async getAllRute(req: Request, res: Response): Promise<void> {
    try {
      const { search, modaId, isActive } = req.query;
      const data = await RuteService.getAll({
        search: search as string,
        modaId: modaId ? Number(modaId) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });

      res.json({
        success: true,
        message: 'Berhasil mengambil daftar rute',
        data,
      });
    } catch (error: any) {
      const status = error instanceof HttpError ? error.status : 500;
      res.status(status).json({ success: false, message: error.message || 'Gagal mengambil data rute' });
    }
  }

  static async getRuteById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Rute tidak valid' });
        return;
      }

      const data = await RuteService.getById(id);
      res.json({
        success: true,
        message: 'Berhasil mengambil detail rute beserta urutan stop',
        data,
      });
    } catch (error: any) {
      const status = error instanceof HttpError ? error.status : (error.message?.includes('tidak ditemukan') ? 404 : 500);
      res.status(status).json({ success: false, message: error.message || 'Rute tidak ditemukan' });
    }
  }

  static async createRute(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createRuteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input rute gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await RuteService.create(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Rute baru berhasil dibuat',
        data,
      });
    } catch (error: any) {
      const status = error instanceof HttpError ? error.status : 500;
      res.status(status).json({ success: false, message: error.message || 'Gagal membuat rute' });
    }
  }

  static async updateRute(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const parsed = updateRuteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input update rute gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await RuteService.update(id, parsed.data);
      res.json({
        success: true,
        message: 'Data rute berhasil diperbarui',
        data,
      });
    } catch (error: any) {
      const status = error instanceof HttpError ? error.status : 500;
      res.status(status).json({ success: false, message: error.message || 'Gagal memperbarui rute' });
    }
  }

  static async updateRuteStops(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const parsed = updateStopsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi urutan stop gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await RuteService.updateStops(id, parsed.data.stops);
      res.json({
        success: true,
        message: 'Urutan halte/stop pada rute berhasil diperbarui',
        data,
      });
    } catch (error: any) {
      const status = error instanceof HttpError ? error.status : 500;
      res.status(status).json({ success: false, message: error.message || 'Gagal memperbarui stop rute' });
    }
  }

  static async deleteRute(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await RuteService.delete(id);
      res.json({
        success: true,
        message: 'Rute berhasil dihapus',
      });
    } catch (error: any) {
      const status = error instanceof HttpError ? error.status : 500;
      res.status(status).json({ success: false, message: error.message || 'Gagal menghapus rute' });
    }
  }
}
