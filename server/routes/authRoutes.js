import { Router } from "express";
import * as authController from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/authValidator.js";

const router = Router();

router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", auth, authController.getMe);
router.post("/forgot-password", forgotPasswordValidator, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidator, authController.resetPassword);

export default router;
