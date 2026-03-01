import { Router } from "express";

import { createMessageSchema, updateMessageSchema } from "@chat/shared";

import * as messageController from "../controllers/message.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

const router = Router({ mergeParams: true });

// All message routes require authentication and workspace membership
router.use(authenticate);
router.use(authorize("GUEST"));

router.post("/", validate(createMessageSchema), messageController.create);
router.get("/", messageController.list);

router.get("/:messageId/thread", messageController.getThread);
router.post("/:messageId/thread", validate(createMessageSchema), messageController.create);

router.patch("/:messageId", validate(updateMessageSchema), messageController.update);
router.delete("/:messageId", messageController.remove);

router.post("/:messageId/reactions", messageController.addReaction);
router.delete("/:messageId/reactions/:emoji", messageController.removeReaction);

export default router;
