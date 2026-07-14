import { Router } from "express";
import * as saleController from "../controllers/saleController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("sales.view"), saleController.getSales);
router.get("/:id", requirePermission("sales.view"), saleController.getSale);
router.post("/", requirePermission("sales.create"), saleController.createSale);

export default router;
