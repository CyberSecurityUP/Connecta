import { Router } from "express";

import * as searchController from "../controllers/search.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorize("GUEST"));

router.get("/messages", searchController.searchMessages);
router.get("/channels", searchController.searchChannels);
router.get("/members", searchController.searchMembers);
router.get("/files", searchController.searchFiles);

export default router;
