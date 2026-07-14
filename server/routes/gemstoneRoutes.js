import { Router } from "express";
import * as gemstoneController from "../controllers/gemstoneController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { gemstoneValidator } from "../validators/gemstoneValidator.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), gemstoneController.getGemstones);
router.get("/:id", requirePermission("inventory.view"), gemstoneController.getGemstone);
router.post(
  "/",
  requirePermission("inventory.create"),
  gemstoneValidator,
  gemstoneController.createGemstone
);
router.put(
  "/:id",
  requirePermission("inventory.update"),
  gemstoneValidator,
  gemstoneController.updateGemstone
);
router.patch(
  "/:id/status",
  requirePermission("inventory.update"),
  gemstoneController.updateGemstoneStatus
);
router.delete("/:id", requirePermission("inventory.update"), gemstoneController.deleteGemstone);

export default router;
