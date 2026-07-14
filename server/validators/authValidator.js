import { body, validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * Runs after the express-validator chains below; converts accumulated
 * validation errors into a single ApiError(422).
 */
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ApiError(422, "Validation failed", errors));
  }
  next();
}

export const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage("Phone number is too long"),
  body("roleName")
    .optional({ checkFalsy: true })
    .isIn(["Admin", "Manager", "Workshop-Staff"])
    .withMessage("Invalid role"),
  handleValidation,
];

export const loginValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

export const forgotPasswordValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
  handleValidation,
];

export const resetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  handleValidation,
];

export default {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  handleValidation,
};
