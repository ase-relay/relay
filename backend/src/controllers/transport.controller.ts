import { Request, Response } from 'express';
import { HalteService } from '../services/halte.service';
import { RuteService } from '../services/rute.service';
import {
  createHalteSchema,
  updateHalteSchema,
  nearbyHalteSchema,
  createRuteSchema,
  updateRuteSchema,
  updateStopsSchema,
} from '../middlewares/transport-validate.middleware';

export class TransportController {
  // ================= HALTE CONTROLLERS =================

  static async getAllHalte(req: Request, res: Response): Promise<void> {
    try {
      const { search, kota, isTransit } = req.query;
      const data = await HalteService.getAll({
        search: search as string,
        kota: kota as string,
        isTransit: isTransit !== undefined ? isTransit === 'true' : undefined,
      });

      res.json({
        success: true,
        message: 'Berhasil mengambil daftar halte',
        data,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal mengambil data halte' });
    }
  }

  static async getHalteById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Halte tidak valid' });
        return;
      }

      const data = await HalteService.getById(id);
      res.json({
        success: true,
        message: 'Berhasil mengambil detail halte',
        data,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Halte tidak ditemukan' });
    }
  }

  static async getNearbyHalte(req: Request, res: Response): Promise<void> {
    try {
      const parsed = nearbyHalteSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi koordinat gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await HalteService.getNearby(parsed.data);
      res.json({
        success: true,
        message: `Berhasil menemukan ${data.length} halte di sekitar lokasi`,
        data,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal mencari halte terdekat' });
    }
  }

  static async createHalte(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createHalteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input halte gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await HalteService.create(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Halte baru berhasil ditambahkan',
        data,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal menambahkan halte' });
    }
  }

  static async updateHalte(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const parsed = updateHalteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input update halte gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await HalteService.update(id, parsed.data);
      res.json({
        success: true,
        message: 'Data halte berhasil diperbarui',
        data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Gagal memperbarui halte' });
    }
  }

  static async deleteHalte(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await HalteService.delete(id);
      res.json({
        success: true,
        message: 'Halte berhasil dihapus',
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Gagal menghapus halte' });
    }
  }

  // ================= RUTE CONTROLLERS =================

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
      res.status(500).json({ success: false, message: error.message || 'Gagal mengambil data rute' });
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
      res.status(404).json({ success: false, message: error.message || 'Rute tidak ditemukan' });
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
      res.status(500).json({ success: false, message: error.message || 'Gagal membuat rute' });
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
      res.status(400).json({ success: false, message: error.message || 'Gagal memperbarui rute' });
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
      res.status(400).json({ success: false, message: error.message || 'Gagal memperbarui stop rute' });
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
      res.status(400).json({ success: false, message: error.message || 'Gagal menghapus rute' });
    }
  }
}
