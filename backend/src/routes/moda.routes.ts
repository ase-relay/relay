import { Router } from 'express';
import { ModaController } from '../controllers/moda.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoints
router.get('/', ModaController.getAllModa);
router.get('/:id', ModaController.getModaById);

// Protected endpoints (Membutuhkan Login + Admin)
router.post('/', authenticate, requireAdmin, ModaController.createModa);
router.put('/:id', authenticate, requireAdmin, ModaController.updateModa);
router.delete('/:id', authenticate, requireAdmin, ModaController.deleteModa);

export default router;
