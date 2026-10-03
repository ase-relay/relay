import { Request, Response } from 'express';
import { TarifService } from '../services/tarif.service';
import { createTarifSchema, updateTarifSchema } from '../middlewares/tarif-validate.middleware';
import { HttpError } from '../utils/http-error';

export class TarifController {
  static async getAllTarif(req: Request, res: Response): Promise<void> {
    try {
      const data = await TarifService.getAll();
      res.json({
        success: true,
        message: 'Berhasil mengambil daftar tarif',
        data,
      });
    } catch (error: unknown) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Gagal mengambil data tarif';
      res.status(status).json({ success: false, message });
    }
  }

  static async getTarifById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Tarif tidak valid' });
        return;
      }

      const data = await TarifService.getById(id);
      res.json({
        success: true,
        message: 'Berhasil mengambil detail tarif',
        data,
      });
    } catch (error: unknown) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Tarif tidak ditemukan';
      res.status(status).json({ success: false, message });
    }
  }

  static async createTarif(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createTarifSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input tarif gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await TarifService.create(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Tarif baru berhasil dibuat',
        data,
      });
    } catch (error: unknown) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Gagal membuat tarif';
      res.status(status).json({ success: false, message });
    }
  }

  static async updateTarif(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Tarif tidak valid' });
        return;
      }

      const parsed = updateTarifSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input update tarif gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await TarifService.update(id, parsed.data);
      res.json({
        success: true,
        message: 'Data tarif berhasil diperbarui',
        data,
      });
    } catch (error: unknown) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Gagal memperbarui tarif';
      res.status(status).json({ success: false, message });
    }
  }

  static async deleteTarif(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Tarif tidak valid' });
        return;
      }

      await TarifService.delete(id);
      res.json({
        success: true,
        message: 'Tarif berhasil dihapus',
      });
    } catch (error: unknown) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Gagal menghapus tarif';
      res.status(status).json({ success: false, message });
    }
  }
}
