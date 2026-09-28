import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// ================= HALTE ENDPOINTS =================
// Public endpoints
router.get('/halte', TransportController.getAllHalte);
router.get('/halte/nearby', TransportController.getNearbyHalte);
router.get('/halte/:id', TransportController.getHalteById);

// Protected endpoints (Membutuhkan Login + Admin)
// Setiap endpoint yang mengubah data master (halte, rute, moda, tarif) wajib memakai authenticate + requireAdmin
router.post('/halte', authenticate, requireAdmin, TransportController.createHalte);
router.put('/halte/:id', authenticate, requireAdmin, TransportController.updateHalte);
router.delete('/halte/:id', authenticate, requireAdmin, TransportController.deleteHalte);

// ================= RUTE ENDPOINTS =================
// Public endpoints
router.get('/rute', TransportController.getAllRute);
router.get('/rute/:id', TransportController.getRuteById);

// Protected endpoints (Membutuhkan Login + Admin)
// Setiap endpoint yang mengubah data master (halte, rute, moda, tarif) wajib memakai authenticate + requireAdmin
router.post('/rute', authenticate, requireAdmin, TransportController.createRute);
router.put('/rute/:id', authenticate, requireAdmin, TransportController.updateRute);
router.put('/rute/:id/stops', authenticate, requireAdmin, TransportController.updateRuteStops);
router.delete('/rute/:id', authenticate, requireAdmin, TransportController.deleteRute);

export default router;
