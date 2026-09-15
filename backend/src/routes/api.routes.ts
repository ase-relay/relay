import { Router } from 'express';
import { getHealthCheck, getModaList } from '../controllers/general.controller';

const router = Router();

router.get('/health', getHealthCheck);
router.get('/moda', getModaList);

export default router;
