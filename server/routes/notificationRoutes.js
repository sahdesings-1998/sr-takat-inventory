import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
