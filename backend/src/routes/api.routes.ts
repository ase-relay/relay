import { Router } from 'express';
import { getHealthCheck, getModaList } from '../controllers/general.controller';
import authRoutes from './auth.routes';
import transportRoutes from './transport.routes';
import routingRoutes from './routing.routes';

const router = Router();

// General & Health
router.get('/health', getHealthCheck);
router.get('/moda', getModaList);

// Auth Routes (FR-REG-01, FR-LGN-01)
router.use('/auth', authRoutes);

// Transport Routes (Halte, Rute, Stops)
router.use('/', transportRoutes);

// Routing Engine Routes (Pencarian Rute & Riwayat)
router.use('/routing', routingRoutes);

export default router;
