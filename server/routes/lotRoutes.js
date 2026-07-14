import { Router } from "express";
import * as lotController from "../controllers/lotController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), lotController.getLots);
router.get("/:id", requirePermission("inventory.view"), lotController.getLot);
router.post("/", requirePermission("inventory.create"), lotController.createLot);
router.put("/:id", requirePermission("inventory.update"), lotController.updateLot);
router.patch("/:id/issue", requirePermission("inventory.update"), lotController.issueFromLot);

export default router;
