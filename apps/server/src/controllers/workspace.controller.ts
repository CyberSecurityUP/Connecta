import { RequestHandler } from "express";

import { workspaceService } from "../services/workspace.service";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const workspace = await workspaceService.create(req.body, req.userId!);
    res.status(201).json({ data: workspace });
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.userId!);
    res.json({ data: workspaces });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getById(req.params.workspaceId);
    res.json({ data: workspace });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const workspace = await workspaceService.update(req.params.workspaceId, req.body);
    res.json({ data: workspace });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await workspaceService.delete(req.params.workspaceId, req.userId!);
    res.json({ message: "Workspace deleted" });
  } catch (error) {
    next(error);
  }
};

export const getMembers: RequestHandler = async (req, res, next) => {
  try {
    const members = await workspaceService.getMembers(
      req.params.workspaceId,
      req.query.search as string | undefined,
    );
    res.json({ data: members });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole: RequestHandler = async (req, res, next) => {
  try {
    const member = await workspaceService.updateMemberRole(
      req.params.workspaceId,
      req.params.userId,
      req.body.role,
    );
    res.json({ data: member });
  } catch (error) {
    next(error);
  }
};

export const removeMember: RequestHandler = async (req, res, next) => {
  try {
    await workspaceService.removeMember(req.params.workspaceId, req.params.userId);
    res.json({ message: "Member removed" });
  } catch (error) {
    next(error);
  }
};

export const leave: RequestHandler = async (req, res, next) => {
  try {
    await workspaceService.leave(req.params.workspaceId, req.userId!);
    res.json({ message: "Left workspace" });
  } catch (error) {
    next(error);
  }
};
