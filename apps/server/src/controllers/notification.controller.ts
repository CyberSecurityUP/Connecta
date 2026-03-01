import { RequestHandler } from "express";

import { notificationService } from "../services/notification.service";

export const list: RequestHandler = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.userId!, {
      isRead: req.query.isRead === "true" ? true : req.query.isRead === "false" ? false : undefined,
      limit: parseInt((req.query.limit as string) || "30", 10),
      cursor: req.query.cursor as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const unreadCount: RequestHandler = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    res.json({ data: { count } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead: RequestHandler = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.notificationId, req.userId!);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead: RequestHandler = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
