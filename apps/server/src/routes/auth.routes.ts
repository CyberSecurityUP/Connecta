import { Router } from "express";

import { loginSchema, registerSchema } from "@chat/shared";

import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refreshToken);
router.get("/me", authenticate, authController.getMe);

export default router;
