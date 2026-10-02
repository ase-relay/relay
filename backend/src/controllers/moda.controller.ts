import { Request, Response } from 'express';
import { ModaService } from '../services/moda.service';
import {
  createModaSchema,
  updateModaSchema,
} from '../middlewares/moda-validate.middleware';

export class ModaController {
  static async getAllModa(req: Request, res: Response): Promise<void> {
    try {
      const data = await ModaService.getAll();
      res.json({
        success: true,
        message: 'Berhasil mengambil daftar moda',
        data,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal mengambil data moda' });
    }
  }

  static async getModaById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Moda tidak valid' });
        return;
      }

      const data = await ModaService.getById(id);
      res.json({
        success: true,
        message: 'Berhasil mengambil detail moda',
        data,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Moda tidak ditemukan' });
    }
  }

  static async createModa(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createModaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input moda gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await ModaService.create(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Moda baru berhasil ditambahkan',
        data,
      });
    } catch (error: any) {
      const status = error.message?.includes('sudah ada') ? 400 : 500;
      res.status(status).json({ success: false, message: error.message || 'Gagal menambahkan moda' });
    }
  }

  static async updateModa(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const parsed = updateModaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validasi input update moda gagal',
          errors: parsed.error.format(),
        });
        return;
      }

      const data = await ModaService.update(id, parsed.data);
      res.json({
        success: true,
        message: 'Data moda berhasil diperbarui',
        data,
      });
    } catch (error: any) {
      const status = error.message?.includes('masih dipakai') ? 409 : (error.message?.includes('sudah ada') ? 400 : (error.message?.includes('tidak ditemukan') ? 404 : 400));
      res.status(status).json({
        success: false,
        message: error.message || 'Gagal memperbarui moda',
      });
    }
  }

  static async deleteModa(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await ModaService.delete(id);
      res.json({
        success: true,
        message: 'Moda berhasil dihapus',
      });
    } catch (error: any) {
      const status = error.message?.includes('masih dipakai') ? 409 : (error.message?.includes('tidak ditemukan') ? 404 : 400);
      res.status(status).json({
        success: false,
        message: error.message || 'Gagal menghapus moda',
      });
    }
  }
}
