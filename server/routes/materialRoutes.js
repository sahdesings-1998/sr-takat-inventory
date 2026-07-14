import { Router } from "express";
import * as materialController from "../controllers/materialController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), materialController.getMaterials);
router.get("/:id", requirePermission("inventory.view"), materialController.getMaterial);
router.post("/", requirePermission("inventory.create"), materialController.createMaterial);
router.put("/:id", requirePermission("inventory.update"), materialController.updateMaterial);
router.patch("/:id/adjust", requirePermission("inventory.update"), materialController.adjustMaterialStock);

export default router;
