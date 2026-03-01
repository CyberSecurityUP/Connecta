import { RequestHandler } from "express";

import { channelService } from "../services/channel.service";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const channel = await channelService.create(
      req.params.workspaceId,
      req.body,
      req.userId!,
    );
    res.status(201).json({ data: channel });
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const channels = await channelService.getWorkspaceChannels(
      req.params.workspaceId,
      req.userId!,
      req.query.filter as string | undefined,
    );
    res.json({ data: channels });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const channel = await channelService.getById(req.params.channelId);
    res.json({ data: channel });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const channel = await channelService.update(req.params.channelId, req.body);
    res.json({ data: channel });
  } catch (error) {
    next(error);
  }
};

export const archive: RequestHandler = async (req, res, next) => {
  try {
    await channelService.archive(req.params.channelId);
    res.json({ message: "Channel archived" });
  } catch (error) {
    next(error);
  }
};

export const join: RequestHandler = async (req, res, next) => {
  try {
    const member = await channelService.join(req.params.channelId, req.userId!);
    res.json({ data: member });
  } catch (error) {
    next(error);
  }
};

export const leave: RequestHandler = async (req, res, next) => {
  try {
    await channelService.leave(req.params.channelId, req.userId!);
    res.json({ message: "Left channel" });
  } catch (error) {
    next(error);
  }
};

export const getMembers: RequestHandler = async (req, res, next) => {
  try {
    const members = await channelService.getMembers(req.params.channelId);
    res.json({ data: members });
  } catch (error) {
    next(error);
  }
};

export const addMembers: RequestHandler = async (req, res, next) => {
  try {
    await channelService.addMembers(req.params.channelId, req.body.userIds);
    res.json({ message: "Members added" });
  } catch (error) {
    next(error);
  }
};

export const removeMember: RequestHandler = async (req, res, next) => {
  try {
    await channelService.removeMember(req.params.channelId, req.params.userId);
    res.json({ message: "Member removed" });
  } catch (error) {
    next(error);
  }
};
