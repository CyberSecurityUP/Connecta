import { Router } from "express";

import authRoutes from "./auth.routes";
import channelRoutes from "./channel.routes";
import dmRoutes from "./dm.routes";
import fileRoutes from "./file.routes";
import adminRoutes from "./admin.routes";
import invitationRoutes from "./invitation.routes";
import messageRoutes from "./message.routes";
import notificationRoutes from "./notification.routes";
import searchRoutes from "./search.routes";
import userRoutes from "./user.routes";
import webhookRoutes from "./webhook.routes";
import workspaceRoutes from "./workspace.routes";

const router = Router();

// Health check
router.get("/", (_req, res) => {
  res.json({ message: "Connecta API v1" });
});

// Auth & Users
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Workspaces
router.use("/workspaces", workspaceRoutes);

// Channels & Messages (nested under workspace)
router.use("/workspaces/:workspaceId/channels", channelRoutes);
router.use("/workspaces/:workspaceId/channels/:channelId/messages", messageRoutes);

// DMs / Conversations
router.use("/workspaces/:workspaceId/conversations", dmRoutes);

// Files
router.use("/workspaces/:workspaceId/files", fileRoutes);

// Search
router.use("/workspaces/:workspaceId/search", searchRoutes);

// Webhooks
router.use("/workspaces/:workspaceId/webhooks", webhookRoutes);

// Notifications (global, not workspace-scoped)
router.use("/notifications", notificationRoutes);

// Invitations
router.use("/invitations", invitationRoutes);

// Admin
router.use("/admin", adminRoutes);

export default router;
