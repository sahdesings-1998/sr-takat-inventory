import { Router } from "express";
import * as settingController from "../controllers/settingController.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("Admin"), settingController.getSettings);
router.put("/", requireRole("Admin"), settingController.updateSettings);

export default router;
