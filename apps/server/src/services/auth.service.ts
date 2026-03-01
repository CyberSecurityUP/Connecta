import { RegisterInput, LoginInput } from "@chat/shared";

import { prisma } from "../config/database";
import { ConflictError, UnauthorizedError } from "../utils/errors";
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from "../utils/crypto";

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        displayName: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        isAdmin: true,
        passwordHash: true,
        deactivatedAt: true,
        createdAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.deactivatedAt) {
      throw new UnauthorizedError("Account has been deactivated");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        isAdmin: true,
        phone: true,
        title: true,
        bio: true,
        timezone: true,
        status: true,
        customStatus: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return user;
  }

  async refreshToken(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deactivatedAt: true },
    });

    if (!user || user.deactivatedAt) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const accessToken = generateAccessToken(user.id);
    return { accessToken };
  }
}

export const authService = new AuthService();
