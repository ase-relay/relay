import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';

const router = Router();

// ================= RUTE ENDPOINTS (PUBLIC GET ONLY) =================
// Public endpoints only - admin CRUD moved to /api/transport/rute
router.get('/rute', TransportController.getAllRute);
router.get('/rute/:id', TransportController.getRuteById);

export default router;
