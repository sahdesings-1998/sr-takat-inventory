import { Router } from "express";
import * as roleController from "../controllers/roleController.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", roleController.getRoles);
router.get("/:id", roleController.getRole);

router.post("/", requireRole("Admin"), roleController.createRole);
router.put("/:id", requireRole("Admin"), roleController.updateRole);
router.delete("/:id", requireRole("Admin"), roleController.deleteRole);

export default router;
