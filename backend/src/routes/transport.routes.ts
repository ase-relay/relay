import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// ================= HALTE ENDPOINTS =================
// Public endpoints
router.get('/halte', TransportController.getAllHalte);
router.get('/halte/nearby', TransportController.getNearbyHalte);
router.get('/halte/:id', TransportController.getHalteById);

// Protected endpoints (Membutuhkan Login / Admin)
router.post('/halte', authenticate, TransportController.createHalte);
router.put('/halte/:id', authenticate, TransportController.updateHalte);
router.delete('/halte/:id', authenticate, TransportController.deleteHalte);

// ================= RUTE ENDPOINTS =================
// Public endpoints
router.get('/rute', TransportController.getAllRute);
router.get('/rute/:id', TransportController.getRuteById);

// Protected endpoints (Membutuhkan Login / Admin)
router.post('/rute', authenticate, TransportController.createRute);
router.put('/rute/:id', authenticate, TransportController.updateRute);
router.put('/rute/:id/stops', authenticate, TransportController.updateRuteStops);
router.delete('/rute/:id', authenticate, TransportController.deleteRute);

export default router;
