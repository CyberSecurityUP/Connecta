import { Router } from "express";

import { createChannelSchema, updateChannelSchema } from "@chat/shared";

import * as channelController from "../controllers/channel.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

const router = Router({ mergeParams: true });

// All channel routes require authentication and workspace membership
router.use(authenticate);
router.use(authorize("GUEST"));

router.post("/", validate(createChannelSchema), channelController.create);
router.get("/", channelController.list);

router.get("/:channelId", channelController.getById);
router.patch("/:channelId", validate(updateChannelSchema), channelController.update);
router.delete("/:channelId", channelController.archive);

router.post("/:channelId/join", channelController.join);
router.post("/:channelId/leave", channelController.leave);

router.get("/:channelId/members", channelController.getMembers);
router.post("/:channelId/members", channelController.addMembers);
router.delete("/:channelId/members/:userId", channelController.removeMember);

export default router;
