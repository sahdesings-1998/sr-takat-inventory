import { Router } from "express";
import * as movementController from "../controllers/movementController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), movementController.getMovements);

export default router;
