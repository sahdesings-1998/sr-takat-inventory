import { Router } from "express";
import * as certificateController from "../controllers/certificateController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import upload from "../middleware/upload.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), certificateController.getCertificates);
router.get("/:id", requirePermission("inventory.view"), certificateController.getCertificate);
router.get("/:id/file", requirePermission("inventory.view"), certificateController.getCertificateFile);
router.post(
  "/",
  requirePermission("inventory.create"),
  upload.single("file"),
  certificateController.createCertificate
);
router.delete("/:id", requirePermission("inventory.update"), certificateController.deleteCertificate);

export default router;
