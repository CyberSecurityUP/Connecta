import { RequestHandler } from "express";
import { webhookService } from "../services/webhook.service";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const webhook = await webhookService.create(
      req.params.workspaceId,
      req.body,
      req.userId!,
    );
    // Don't expose full secret in create response - show it once
    res.status(201).json({ data: webhook });
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const webhooks = await webhookService.list(req.params.workspaceId);
    // Mask secrets in list response
    const masked = webhooks.map((w) => ({
      ...w,
      secret: w.secret.substring(0, 8) + "..." + w.secret.substring(w.secret.length - 4),
    }));
    res.json({ data: masked });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const webhook = await webhookService.getById(req.params.webhookId, req.params.workspaceId);
    res.json({
      data: {
        ...webhook,
        secret: webhook.secret.substring(0, 8) + "..." + webhook.secret.substring(webhook.secret.length - 4),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const webhook = await webhookService.update(
      req.params.webhookId,
      req.params.workspaceId,
      req.body,
    );
    res.json({ data: webhook });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await webhookService.delete(req.params.webhookId, req.params.workspaceId);
    res.json({ message: "Webhook deleted" });
  } catch (error) {
    next(error);
  }
};

export const regenerateSecret: RequestHandler = async (req, res, next) => {
  try {
    const webhook = await webhookService.regenerateSecret(
      req.params.webhookId,
      req.params.workspaceId,
    );
    // Show full new secret once
    res.json({ data: { secret: webhook.secret } });
  } catch (error) {
    next(error);
  }
};

export const getLogs: RequestHandler = async (req, res, next) => {
  try {
    const logs = await webhookService.getLogs(
      req.params.webhookId,
      req.params.workspaceId,
    );
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
};
