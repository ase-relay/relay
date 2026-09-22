import { Request, Response } from 'express';
import { RoutingService } from '../services/routing.service';
import { RoutingSearchRequestDTO } from '../types/routing.types';
import jwt from 'jsonwebtoken';

/**
 * Helper untuk extract optional user ID dari token JWT jika disertakan
 */
const getOptionalUserId = (req: Request): number | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: number };
    return decoded.id;
  } catch {
    return undefined;
  }
};

export class RoutingController {
  /**
   * POST /api/routing/search
   * Mencari rekomendasi rute multimodal (Direct & Transit)
   */
  static async searchRoutes(req: Request, res: Response): Promise<void> {
    try {
      const requestDTO: RoutingSearchRequestDTO = req.body;
      const userId = (req as any).user?.id || getOptionalUserId(req);

      const result = await RoutingService.searchRoutes(requestDTO, userId);

      res.status(200).json({
        status: 'success',
        message:
          result.totalRoutesFound > 0
            ? 'Berhasil menemukan rute perjalanan'
            : 'Tidak ditemukan rute publik yang mencakup titik ini',
        data: result,
      });
    } catch (error: any) {
      console.error('Routing search error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Gagal melakukan pencarian rute',
      });
    }
  }

  /**
   * GET /api/routing/history
   * Mengambil riwayat pencarian rute user yang terautentikasi
   */
  static async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const history = await RoutingService.getUserHistory(userId);
      res.status(200).json({
        status: 'success',
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Gagal mengambil riwayat pencarian',
      });
    }
  }

  /**
   * DELETE /api/routing/history/:id
   * Menghapus riwayat pencarian tertentu
   */
  static async deleteUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const historyIdParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const historyId = parseInt(historyIdParam, 10);

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (isNaN(historyId)) {
        res.status(400).json({ status: 'error', message: 'ID riwayat tidak valid' });
        return;
      }

      await RoutingService.deleteUserHistory(userId, historyId);
      res.status(200).json({
        status: 'success',
        message: 'Riwayat pencarian berhasil dihapus',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Gagal menghapus riwayat pencarian',
      });
    }
  }
}
