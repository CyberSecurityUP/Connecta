import { Router } from "express";

import { invitationController } from "../controllers/invitation.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Get invitation info by token (authenticated)
router.get("/:token", authenticate, invitationController.getByToken);

// Accept invitation (authenticated)
router.post("/:token/accept", authenticate, invitationController.accept);

export default router;
