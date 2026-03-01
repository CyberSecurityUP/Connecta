import { RequestHandler } from "express";

import { authService } from "../services/auth.service";
import { verifyToken } from "../utils/crypto";
import { UnauthorizedError } from "../utils/errors";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const refreshToken: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      throw new UnauthorizedError("Refresh token is required");
    }

    const decoded = verifyToken(token);
    const result = await authService.refreshToken(decoded.userId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};
