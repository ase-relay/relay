import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Protected user profile & management routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

export default router;
