import { Router } from "express";
import * as jobCardController from "../controllers/jobCardController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("production.view"), jobCardController.getJobCards);
router.get("/:id", requirePermission("production.view"), jobCardController.getJobCard);
router.post("/", requirePermission("production.update"), jobCardController.createJobCard);
router.put("/:id", requirePermission("production.update"), jobCardController.updateJobCard);
router.patch("/:id/status", requirePermission("production.update"), jobCardController.updateJobCardStage);
router.post(
  "/:id/materials-issued",
  requirePermission("production.update"),
  jobCardController.issueMaterials
);
router.post(
  "/:id/materials-returned",
  requirePermission("production.update"),
  jobCardController.returnMaterials
);

export default router;
