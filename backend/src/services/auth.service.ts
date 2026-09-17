import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { RegisterInput, LoginInput } from '../middlewares/validate.middleware';
import { JwtPayload } from '../types/auth.types';

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw { status: 409, message: 'Email sudah terdaftar' };
      }
      if (existingUser.username === input.username) {
        throw { status: 409, message: 'Username sudah digunakan' };
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.identifier }, { username: input.identifier }],
      },
    });

    if (!user) {
      throw { status: 401, message: 'Email/Username atau password salah' };
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw { status: 401, message: 'Email/Username atau password salah' };
    }

    const secret = process.env.JWT_SECRET || 'otewe_default_secret_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, secret, { expiresIn: expiresIn as any });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw { status: 404, message: 'User tidak ditemukan' };
    }

    return user;
  }
}
