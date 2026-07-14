import { Router } from "express";
import * as supplierController from "../controllers/supplierController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { supplierValidator } from "../validators/supplierValidator.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), supplierController.getSuppliers);
router.get("/:id", requirePermission("inventory.view"), supplierController.getSupplier);
router.post("/", requirePermission("inventory.create"), supplierValidator, supplierController.createSupplier);
router.put("/:id", requirePermission("inventory.update"), supplierValidator, supplierController.updateSupplier);
router.delete("/:id", requirePermission("inventory.update"), supplierController.deleteSupplier);

export default router;
