import { Router } from 'express';
import { RoutingController } from '../controllers/routing.controller';
import { validateRoutingSearch } from '../middlewares/routing-validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Pencarian Rute (Public / Optional Auth for history tracking)
router.post('/search', validateRoutingSearch, RoutingController.searchRoutes);

// Riwayat Pencarian (Protected Auth)
router.get('/history', authenticate as any, RoutingController.getUserHistory);
router.delete('/history/:id', authenticate as any, RoutingController.deleteUserHistory);

export default router;
