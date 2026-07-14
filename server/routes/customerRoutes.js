import { Router } from "express";
import * as customerController from "../controllers/customerController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { customerValidator } from "../validators/customerValidator.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), customerController.getCustomers);
router.get("/:id", requirePermission("inventory.view"), customerController.getCustomer);
router.post("/", requirePermission("inventory.create"), customerValidator, customerController.createCustomer);
router.put("/:id", requirePermission("inventory.create"), customerValidator, customerController.updateCustomer);
router.delete("/:id", requirePermission("inventory.create"), customerController.deleteCustomer);
router.get("/:id/history", requirePermission("inventory.view"), customerController.getCustomerHistory);

export default router;
