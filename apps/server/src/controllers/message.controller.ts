import { RequestHandler } from "express";

import { messageService } from "../services/message.service";
import { parsePagination } from "../utils/pagination";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const message = await messageService.create(
      req.params.channelId,
      req.body,
      req.userId!,
    );
    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const { cursor, limit } = parsePagination(req.query as { cursor?: string; limit?: string });
    const result = await messageService.getChannelMessages(
      req.params.channelId,
      cursor,
      limit,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getThread: RequestHandler = async (req, res, next) => {
  try {
    const { cursor, limit } = parsePagination(req.query as { cursor?: string; limit?: string });
    const result = await messageService.getThreadReplies(
      req.params.messageId,
      cursor,
      limit,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const message = await messageService.update(
      req.params.messageId,
      req.body,
      req.userId!,
    );
    res.json({ data: message });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await messageService.delete(req.params.messageId, req.userId!);
    res.json({ message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

export const addReaction: RequestHandler = async (req, res, next) => {
  try {
    const reactions = await messageService.addReaction(
      req.params.messageId,
      req.body.emoji,
      req.userId!,
    );
    res.json({ data: reactions });
  } catch (error) {
    next(error);
  }
};

export const removeReaction: RequestHandler = async (req, res, next) => {
  try {
    const reactions = await messageService.removeReaction(
      req.params.messageId,
      req.params.emoji,
      req.userId!,
    );
    res.json({ data: reactions });
  } catch (error) {
    next(error);
  }
};
