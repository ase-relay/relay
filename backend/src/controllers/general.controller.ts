import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getHealthCheck = async (req: Request, res: Response) => {
  res.json({
    status: 'online',
    message: 'Backend OTEWE (Relay ASE) siap melayani rekomendasi rute! 🚆🚌',
    timestamp: new Date().toISOString(),
  });
};

export const getModaList = async (req: Request, res: Response) => {
  try {
    const modas = await prisma.modaTransportasi.findMany({
      include: {
        tarifs: true,
      },
    });
    res.json({ success: true, data: modas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data moda' });
  }
};
