import express from "express";
import {
  createInvoice,
  getInvoice,
  generateInvoicePDF,
} from "../controllers/invoiceController.js";

const router = express.Router();

// Direct PDF generation from JSON payload (without saving to DB first)
router.post("/pdf", generateInvoicePDF);

// Invoice CRUD & PDF generation by ID
router.post("/", createInvoice);
router.get("/:id", getInvoice);
router.post("/:id/pdf", generateInvoicePDF);
router.get("/:id/pdf", generateInvoicePDF);

export default router;
