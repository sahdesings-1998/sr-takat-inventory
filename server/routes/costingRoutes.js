import { Router } from "express";
import * as costingController from "../controllers/costingController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/:productId", requirePermission("costing.view"), costingController.getCosting);
router.post("/:productId", requirePermission("costing.view"), costingController.saveCosting);
router.post(
  "/:productId/approve",
  requirePermission("costing.approve"),
  costingController.approveCosting
);

export default router;
