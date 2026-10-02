import { Request, Response } from 'express';
import { HalteService } from '../services/halte.service';
import { RuteService } from '../services/rute.service';
import {
  createHalteSchema,
  updateHalteSchema,
  nearbyHalteSchema,
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
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Halte tidak valid' });
        return;
      }

      const parsed = updateHalteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input update halte gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      if (Object.keys(parsed.data).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Tidak ada data yang dikirim untuk diperbarui',
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
      if (error.message?.includes('tidak ditemukan')) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      res.status(400).json({ success: false, message: error.message || 'Gagal memperbarui halte' });
    }
  }

  static async deleteHalte(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Halte tidak valid' });
        return;
      }

      await HalteService.delete(id);
      res.json({
        success: true,
        message: 'Halte berhasil dihapus',
      });
    } catch (error: any) {
      if (error.message?.includes('tidak ditemukan')) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message?.includes('masih dipakai')) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      res.status(400).json({ success: false, message: error.message || 'Gagal menghapus halte' });
    }
  }

  // ================= RUTE CONTROLLERS (PUBLIC GET ONLY) =================

  static async getAllRute(req: Request, res: Response): Promise<void> {
    try {
      const { search, modaId } = req.query;
      // Ignore isActive query param for public endpoint
      const data = await RuteService.getAllPublic({
        search: search as string,
        modaId: modaId ? Number(modaId) : undefined,
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

      const data = await RuteService.getByIdPublic(id);
      res.json({
        success: true,
        message: 'Berhasil mengambil detail rute beserta urutan stop',
        data,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Rute tidak ditemukan' });
    }
  }
}
