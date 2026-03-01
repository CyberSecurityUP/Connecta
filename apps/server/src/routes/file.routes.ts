import { Router } from "express";

import * as fileController from "../controllers/file.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { uploadMiddleware } from "../middleware/upload";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorize("GUEST"));

router.post("/", uploadMiddleware.single("file"), fileController.upload);
router.get("/", fileController.list);
router.get("/:fileId", fileController.getById);
router.delete("/:fileId", fileController.remove);

export default router;
