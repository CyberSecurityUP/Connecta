import crypto from "crypto";
import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { logger } from "../utils/logger";

export class WebhookService {
  async create(workspaceId: string, data: {
    name: string;
    url: string;
    events: string[];
    description?: string;
  }, userId: string) {
    const secret = crypto.randomBytes(32).toString("hex");

    return prisma.webhook.create({
      data: {
        workspaceId,
        name: data.name,
        url: data.url,
        secret,
        events: data.events as any[],
        description: data.description,
        createdById: userId,
      },
    });
  }

  async list(workspaceId: string) {
    return prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string, workspaceId: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id, workspaceId },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!webhook) throw new NotFoundError("Webhook");
    return webhook;
  }

  async update(id: string, workspaceId: string, data: {
    name?: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
    description?: string;
  }) {
    const webhook = await prisma.webhook.findFirst({ where: { id, workspaceId } });
    if (!webhook) throw new NotFoundError("Webhook");

    return prisma.webhook.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.events !== undefined && { events: data.events as any[] }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async delete(id: string, workspaceId: string) {
    const webhook = await prisma.webhook.findFirst({ where: { id, workspaceId } });
    if (!webhook) throw new NotFoundError("Webhook");
    return prisma.webhook.delete({ where: { id } });
  }

  async regenerateSecret(id: string, workspaceId: string) {
    const webhook = await prisma.webhook.findFirst({ where: { id, workspaceId } });
    if (!webhook) throw new NotFoundError("Webhook");

    const secret = crypto.randomBytes(32).toString("hex");
    return prisma.webhook.update({
      where: { id },
      data: { secret },
    });
  }

  async trigger(workspaceId: string, event: string, payload: Record<string, any>) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        workspaceId,
        isActive: true,
        events: { has: event as any },
      },
    });

    for (const webhook of webhooks) {
      this.deliver(webhook, event, payload).catch((err) => {
        logger.error(`Webhook delivery failed for ${webhook.id}:`, err);
      });
    }
  }

  private async deliver(
    webhook: { id: string; url: string; secret: string },
    event: string,
    payload: Record<string, any>,
  ) {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");

    const startTime = Date.now();
    let statusCode: number | undefined;
    let responseText: string | undefined;
    let success = false;
    let error: string | undefined;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": event,
          "User-Agent": "Connecta-Webhooks/1.0",
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      responseText = await res.text().catch(() => "");
      success = res.ok;

      if (!success) {
        error = `HTTP ${statusCode}`;
      }
    } catch (err: any) {
      error = err.message || "Delivery failed";
    }

    const duration = Date.now() - startTime;

    // Log the delivery
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: body,
        statusCode,
        response: responseText?.substring(0, 1000),
        success,
        duration,
        error,
      },
    });

    // Update webhook stats
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: success ? 0 : { increment: 1 },
      },
    });

    // Auto-disable after 10 consecutive failures
    if (!success) {
      const wh = await prisma.webhook.findUnique({ where: { id: webhook.id }, select: { failureCount: true } });
      if (wh && wh.failureCount >= 10) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { isActive: false },
        });
        logger.warn(`Webhook ${webhook.id} auto-disabled after 10 consecutive failures`);
      }
    }
  }

  async getLogs(webhookId: string, workspaceId: string, limit = 50) {
    const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, workspaceId } });
    if (!webhook) throw new NotFoundError("Webhook");

    return prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const webhookService = new WebhookService();
