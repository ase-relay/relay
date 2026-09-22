import { Request, Response, NextFunction } from 'express';

export const validateRoutingSearch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { origin, destination } = req.body;

  if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
    res.status(400).json({
      status: 'error',
      message: 'Field origin (dengan lat dan lng valid) wajib diisi',
    });
    return;
  }

  if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
    res.status(400).json({
      status: 'error',
      message: 'Field destination (dengan lat dan lng valid) wajib diisi',
    });
    return;
  }

  if (!origin.name) origin.name = 'Titik Asal';
  if (!destination.name) destination.name = 'Titik Tujuan';

  next();
};
