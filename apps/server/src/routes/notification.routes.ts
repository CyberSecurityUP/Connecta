import { Router } from "express";

import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/:notificationId/read", notificationController.markAsRead);
router.post("/read-all", notificationController.markAllAsRead);

export default router;
