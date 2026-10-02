import { Router } from 'express';
import { getHealthCheck, getModaList } from '../controllers/general.controller';
import authRoutes from './auth.routes';
import transportRoutes from './transport.routes';
import routingRoutes from './routing.routes';
import modaRoutes from './moda.routes';
import halteRoutes from './halte.routes';
import ruteRoutes from './rute.routes';

const router = Router();

// General & Health
router.get('/health', getHealthCheck);
router.get('/moda', getModaList);

// Moda Routes (Admin CRUD)
router.use('/transport/moda', modaRoutes);

// Halte Routes (Admin CRUD + nearby publik, pola Moda)
router.use('/transport/halte', halteRoutes);

// Rute Routes (Admin CRUD)
router.use('/transport/rute', ruteRoutes);

// Auth Routes (FR-REG-01, FR-LGN-01)
router.use('/auth', authRoutes);

// Transport Routes (Halte, Rute, Stops - public GET only)
router.use('/', transportRoutes);

// Routing Engine Routes (Pencarian Rute & Riwayat)
router.use('/routing', routingRoutes);

export default router;
