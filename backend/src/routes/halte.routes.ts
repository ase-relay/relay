import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoints
router.get('/', TransportController.getAllHalte);
router.get('/nearby', TransportController.getNearbyHalte);
router.get('/:id', TransportController.getHalteById);

// Protected endpoints (Membutuhkan Login + Admin)
router.post('/', authenticate, requireAdmin, TransportController.createHalte);
router.put('/:id', authenticate, requireAdmin, TransportController.updateHalte);
router.delete('/:id', authenticate, requireAdmin, TransportController.deleteHalte);

export default router;
