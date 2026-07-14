import { Router } from "express";
import * as userController from "../controllers/userController.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

// GET is accessible to authenticated users (Managers need to list users to assign job cards)
router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);

// Modifications are strictly Admin only
router.post("/", requireRole("Admin"), userController.createUser);
router.put("/:id", requireRole("Admin"), userController.updateUser);
router.delete("/:id", requireRole("Admin"), userController.deleteUser);

export default router;
