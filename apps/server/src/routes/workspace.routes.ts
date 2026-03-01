import { Router } from "express";

import { createWorkspaceSchema, updateWorkspaceSchema } from "@chat/shared";

import * as workspaceController from "../controllers/workspace.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

router.post("/", validate(createWorkspaceSchema), workspaceController.create);
router.get("/", workspaceController.list);

router.get("/:workspaceId", authorize("GUEST"), workspaceController.getById);
router.patch(
  "/:workspaceId",
  authorize("ADMIN"),
  validate(updateWorkspaceSchema),
  workspaceController.update,
);
router.delete("/:workspaceId", authorize("OWNER"), workspaceController.remove);

// Members
router.get("/:workspaceId/members", authorize("GUEST"), workspaceController.getMembers);
router.patch(
  "/:workspaceId/members/:userId",
  authorize("OWNER"),
  workspaceController.updateMemberRole,
);
router.delete(
  "/:workspaceId/members/:userId",
  authorize("ADMIN"),
  workspaceController.removeMember,
);
router.post("/:workspaceId/leave", authorize("GUEST"), workspaceController.leave);

export default router;
