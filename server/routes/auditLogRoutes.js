import { Router } from "express";
import * as auditLogController from "../controllers/auditLogController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("audit.view"), auditLogController.getAuditLogs);

export default router;
