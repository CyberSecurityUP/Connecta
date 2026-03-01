import { RequestHandler } from "express";

import { fileService } from "../services/file.service";
import { AppError } from "../utils/errors";
import { parsePagination } from "../utils/pagination";

export const upload: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const file = await fileService.upload(
      req.file,
      req.params.workspaceId,
      req.userId!,
      req.body.messageId,
    );

    res.status(201).json({ data: file });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const file = await fileService.getById(req.params.fileId);
    res.json({ data: file });
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const { cursor, limit } = parsePagination(req.query as { cursor?: string; limit?: string });
    const result = await fileService.getWorkspaceFiles(
      req.params.workspaceId,
      cursor,
      limit,
      req.query.search as string | undefined,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await fileService.delete(req.params.fileId, req.userId!);
    res.json({ message: "File deleted" });
  } catch (error) {
    next(error);
  }
};
