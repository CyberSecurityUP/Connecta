import { RequestHandler } from "express";

import { searchService } from "../services/search.service";

export const searchMessages: RequestHandler = async (req, res, next) => {
  try {
    const result = await searchService.searchMessages(
      req.params.workspaceId,
      req.userId!,
      req.query.q as string,
      {
        channelId: req.query.channelId as string | undefined,
        authorId: req.query.authorId as string | undefined,
        before: req.query.before as string | undefined,
        after: req.query.after as string | undefined,
        hasFile: req.query.hasFile === "true",
        limit: parseInt((req.query.limit as string) || "20", 10),
        cursor: req.query.cursor as string | undefined,
      },
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const searchChannels: RequestHandler = async (req, res, next) => {
  try {
    const channels = await searchService.searchChannels(
      req.params.workspaceId,
      req.query.q as string,
    );
    res.json({ data: channels });
  } catch (error) {
    next(error);
  }
};

export const searchMembers: RequestHandler = async (req, res, next) => {
  try {
    const members = await searchService.searchMembers(
      req.params.workspaceId,
      req.query.q as string,
    );
    res.json({ data: members });
  } catch (error) {
    next(error);
  }
};

export const searchFiles: RequestHandler = async (req, res, next) => {
  try {
    const result = await searchService.searchFiles(
      req.params.workspaceId,
      req.query.q as string,
      req.query.cursor as string | undefined,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
