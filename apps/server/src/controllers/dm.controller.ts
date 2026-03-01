import { RequestHandler } from "express";

import { dmService } from "../services/dm.service";
import { parsePagination } from "../utils/pagination";

export const createConversation: RequestHandler = async (req, res, next) => {
  try {
    const conversation = await dmService.createOrGetConversation(
      req.params.workspaceId,
      req.body.participantIds,
      req.userId!,
      req.body.name,
    );
    res.status(201).json({ data: conversation });
  } catch (error) {
    next(error);
  }
};

export const listConversations: RequestHandler = async (req, res, next) => {
  try {
    const conversations = await dmService.getUserConversations(
      req.params.workspaceId,
      req.userId!,
    );
    res.json({ data: conversations });
  } catch (error) {
    next(error);
  }
};

export const getConversation: RequestHandler = async (req, res, next) => {
  try {
    const conversation = await dmService.getConversation(
      req.params.conversationId,
      req.userId!,
    );
    res.json({ data: conversation });
  } catch (error) {
    next(error);
  }
};

export const getMessages: RequestHandler = async (req, res, next) => {
  try {
    const { cursor, limit } = parsePagination(req.query as { cursor?: string; limit?: string });
    const result = await dmService.getMessages(req.params.conversationId, cursor, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const sendMessage: RequestHandler = async (req, res, next) => {
  try {
    const message = await dmService.sendMessage(
      req.params.conversationId,
      req.body,
      req.userId!,
    );
    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
};
