import { Router } from 'express';
import { RoutingController } from '../controllers/routing.controller';
import { validateRoutingSearch, validateRoutingGeometry } from '../middlewares/routing-validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Pencarian Rute (Public / Optional Auth for history tracking)
router.post('/search', validateRoutingSearch, RoutingController.searchRoutes);

// Susulan geometri OSRM per leg (Public; meniru pola /search)
router.post('/geometry', validateRoutingGeometry, RoutingController.getGeometry);

// Riwayat Pencarian (Protected Auth)
router.get('/history', authenticate as any, RoutingController.getUserHistory);
router.delete('/history/:id', authenticate as any, RoutingController.deleteUserHistory);

export default router;
