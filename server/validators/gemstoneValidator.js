import { body } from "express-validator";
import { handleValidation } from "./authValidator.js";

export const gemstoneValidator = [
  body("stockNo").trim().notEmpty().withMessage("Stock number is required"),
  body("gemstone").trim().notEmpty().withMessage("Gemstone type is required"),
  body("variety").optional({ checkFalsy: true }).trim(),
  body("origin").optional({ checkFalsy: true }).trim(),
  body("shape").optional({ checkFalsy: true }).trim(),
  body("carat").isFloat({ min: 0.0001 }).withMessage("Carat weight must be greater than zero"),
  body("pieces").isInt({ min: 1 }).withMessage("Pieces must be at least 1"),
  body("color").optional({ checkFalsy: true }).trim(),
  body("clarity").optional({ checkFalsy: true }).trim(),
  body("treatment").optional({ checkFalsy: true }).trim().default("None"),
  body("purchasePrice").isFloat({ min: 0 }).withMessage("Purchase price must be positive"),
  body("supplierId").isMongoId().withMessage("Invalid supplier ID"),
  body("location").optional({ checkFalsy: true }).trim().default("Vault"),
  body("status")
    .optional()
    .isIn(["In Stock", "Reserved", "In Production", "On Memo", "Sold", "Damaged", "Missing"])
    .withMessage("Invalid status"),
  body("notes").optional({ checkFalsy: true }).trim(),
  body("images").optional().isArray(),
  handleValidation,
];

export default {
  gemstoneValidator,
};
