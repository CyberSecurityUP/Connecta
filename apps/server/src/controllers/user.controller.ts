import { RequestHandler } from "express";

import { userService } from "../services/user.service";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.userId!);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.userId!, req.body);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.params.userId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    await userService.updateStatus(req.userId!, req.body.status, req.body.customStatus);
    res.json({ message: "Status updated" });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    await userService.changePassword(
      req.userId!,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json({ message: "Password changed" });
  } catch (error) {
    next(error);
  }
};
