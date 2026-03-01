import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorize("ADMIN"));

router.post("/", webhookController.create);
router.get("/", webhookController.list);
router.get("/:webhookId", webhookController.getById);
router.patch("/:webhookId", webhookController.update);
router.delete("/:webhookId", webhookController.remove);
router.post("/:webhookId/regenerate-secret", webhookController.regenerateSecret);
router.get("/:webhookId/logs", webhookController.getLogs);

export default router;
