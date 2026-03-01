import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { config } from "../config";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.auth.secret, {
    expiresIn: config.auth.accessTokenExpiry,
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, config.auth.secret, {
    expiresIn: config.auth.refreshTokenExpiry,
  });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, config.auth.secret) as { userId: string };
}
