import { Router } from 'express';
import { getHealthCheck, getModaList } from '../controllers/general.controller';
import authRoutes from './auth.routes';

const router = Router();

// General & Health
router.get('/health', getHealthCheck);
router.get('/moda', getModaList);

// Auth Routes (FR-REG-01, FR-LGN-01)
router.use('/auth', authRoutes);

export default router;
