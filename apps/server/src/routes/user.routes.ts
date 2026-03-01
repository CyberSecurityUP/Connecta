import { Router } from "express";

import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);
router.patch("/me/status", userController.updateStatus);
router.post("/me/change-password", userController.changePassword);
router.get("/:userId", userController.getUser);

export default router;
