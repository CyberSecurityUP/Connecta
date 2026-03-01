import { RequestHandler } from "express";
import { adminService } from "../services/admin.service";

// Dashboard
export const getStats: RequestHandler = async (_req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
};

// Users
export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string | undefined;
    const result = await adminService.listUsers(page, limit, search);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const toggleAdmin: RequestHandler = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserAdmin(req.params.userId, req.body.isAdmin);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await adminService.deactivateUser(req.params.userId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const reactivateUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await adminService.reactivateUser(req.params.userId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

// Workspaces
export const listWorkspaces: RequestHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string | undefined;
    const result = await adminService.listWorkspaces(page, limit, search);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceDetail: RequestHandler = async (req, res, next) => {
  try {
    const workspace = await adminService.getWorkspaceDetail(req.params.workspaceId);
    res.json({ data: workspace });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace: RequestHandler = async (req, res, next) => {
  try {
    await adminService.deleteWorkspace(req.params.workspaceId);
    res.json({ message: "Workspace deleted" });
  } catch (error) {
    next(error);
  }
};

// Check if current user is admin
export const checkAdmin: RequestHandler = async (req, res, next) => {
  try {
    // If we got here, requireAdmin middleware already passed
    res.json({ data: { isAdmin: true } });
  } catch (error) {
    next(error);
  }
};
