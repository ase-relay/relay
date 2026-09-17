import { Request } from 'express';

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
