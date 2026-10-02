import { Router } from 'express';
import { RuteController } from '../controllers/rute.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All endpoints require Login + Admin
router.get('/', authenticate, requireAdmin, RuteController.getAllRute);
router.get('/:id', authenticate, requireAdmin, RuteController.getRuteById);
router.post('/', authenticate, requireAdmin, RuteController.createRute);
router.put('/:id', authenticate, requireAdmin, RuteController.updateRute);
router.put('/:id/stops', authenticate, requireAdmin, RuteController.updateRuteStops);
router.delete('/:id', authenticate, requireAdmin, RuteController.deleteRute);

export default router;
