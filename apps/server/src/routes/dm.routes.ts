import { Router } from "express";

import { createMessageSchema } from "@chat/shared";

import * as dmController from "../controllers/dm.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorize("GUEST"));

router.post("/", dmController.createConversation);
router.get("/", dmController.listConversations);
router.get("/:conversationId", dmController.getConversation);
router.get("/:conversationId/messages", dmController.getMessages);
router.post(
  "/:conversationId/messages",
  validate(createMessageSchema),
  dmController.sendMessage,
);

export default router;
