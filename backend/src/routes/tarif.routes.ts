import { Router } from 'express';
import { TarifController } from '../controllers/tarif.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All endpoints require Login + Admin
router.get('/', authenticate, requireAdmin, TarifController.getAllTarif);
router.get('/:id', authenticate, requireAdmin, TarifController.getTarifById);
router.post('/', authenticate, requireAdmin, TarifController.createTarif);
router.put('/:id', authenticate, requireAdmin, TarifController.updateTarif);
router.delete('/:id', authenticate, requireAdmin, TarifController.deleteTarif);

export default router;
