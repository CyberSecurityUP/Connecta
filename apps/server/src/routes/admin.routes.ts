import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate } from "../middleware/authenticate";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get("/stats", adminController.getStats);
router.get("/check", adminController.checkAdmin);

// Users
router.get("/users", adminController.listUsers);
router.patch("/users/:userId/admin", adminController.toggleAdmin);
router.post("/users/:userId/deactivate", adminController.deactivateUser);
router.post("/users/:userId/reactivate", adminController.reactivateUser);

// Workspaces
router.get("/workspaces", adminController.listWorkspaces);
router.get("/workspaces/:workspaceId", adminController.getWorkspaceDetail);
router.delete("/workspaces/:workspaceId", adminController.deleteWorkspace);

export default router;
