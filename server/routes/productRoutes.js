import { Router } from "express";
import * as productController from "../controllers/productController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), productController.getProducts);
router.get("/scan/:code", requirePermission("inventory.view"), productController.scanProduct);
router.get("/:id", requirePermission("inventory.view"), productController.getProduct);
router.post("/", requirePermission("inventory.create"), productController.createProduct);
router.put("/:id", requirePermission("inventory.update"), productController.updateProduct);
router.delete("/:id", requirePermission("inventory.delete"), productController.deleteProduct);
router.post(
  "/:id/components",
  requirePermission("inventory.update"),
  productController.addComponent
);
router.delete(
  "/:id/components/:componentId",
  requirePermission("inventory.update"),
  productController.deleteComponent
);

export default router;
