import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import {
  RegisterInput,
  LoginInput,
  GoogleAuthInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '../middlewares/validate.middleware';
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

  static async googleAuth(input: GoogleAuthInput) {
    // Cari user berdasarkan email
    let user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Buat username default dari email / name
      const baseUsername = (input.name || input.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || 'user';
      
      let username = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter++}`;
      }

      // Random secure password hash untuk akun Google
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-12) + 'Ab1!';
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await prisma.user.create({
        data: {
          username,
          email: input.email,
          password: hashedPassword,
          role: 'USER',
        },
      });
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

  static async updateProfile(userId: number, input: UpdateProfileInput) {
    // Validasi duplikasi username atau email jika diedit
    if (input.username || input.email) {
      const existing = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(input.username ? [{ username: input.username }] : []),
                ...(input.email ? [{ email: input.email }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        if (input.email && existing.email === input.email) {
          throw { status: 409, message: 'Email sudah terdaftar oleh pengguna lain' };
        }
        if (input.username && existing.username === input.username) {
          throw { status: 409, message: 'Username sudah digunakan' };
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.username ? { username: input.username } : {}),
        ...(input.email ? { email: input.email } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  static async changePassword(userId: number, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { status: 404, message: 'User tidak ditemukan' };
    }

    const isMatch = await bcrypt.compare(input.oldPassword, user.password);
    if (!isMatch) {
      throw { status: 400, message: 'Password lama tidak sesuai' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil diperbarui' };
  }

  static async deleteAccount(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { status: 404, message: 'User tidak ditemukan' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Akun berhasil dihapus' };
  }
}
