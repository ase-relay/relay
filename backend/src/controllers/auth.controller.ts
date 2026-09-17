import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../middlewares/validate.middleware';
import { AuthRequest } from '../types/auth.types';
import { ZodError } from 'zod';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await AuthService.register(validatedData);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: user,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    const status = error.status || 500;
    const message = error.message || 'Terjadi kesalahan pada server saat registrasi';
    res.status(status).json({ success: false, message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    const status = error.status || 500;
    const message = error.message || 'Terjadi kesalahan pada server saat login';
    res.status(status).json({ success: false, message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await AuthService.getMe(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Data user berhasil diambil',
      data: user,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Terjadi kesalahan saat mengambil data user';
    res.status(status).json({ success: false, message });
  }
};
