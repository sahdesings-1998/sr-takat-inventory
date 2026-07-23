import { Router } from "express";
import purchaseInvoiceController from "../controllers/purchaseInvoiceController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("inventory.view"), purchaseInvoiceController.getAllPurchaseInvoices);
router.post("/", requirePermission("inventory.create"), purchaseInvoiceController.createPurchaseInvoice);
router.get("/:id", requirePermission("inventory.view"), purchaseInvoiceController.getPurchaseInvoiceById);
router.put("/:id", requirePermission("inventory.update"), purchaseInvoiceController.updatePurchaseInvoice);
router.delete("/:id", requirePermission("inventory.update"), purchaseInvoiceController.deletePurchaseInvoice);

router.post("/:id/confirm", requirePermission("inventory.update"), purchaseInvoiceController.confirmPurchaseInvoice);
router.post("/:id/cancel", requirePermission("inventory.update"), purchaseInvoiceController.cancelPurchaseInvoice);
router.post("/:id/payment", requirePermission("inventory.update"), purchaseInvoiceController.recordInvoicePayment);
router.get("/:id/pdf", requirePermission("inventory.view"), purchaseInvoiceController.downloadPurchaseInvoicePDF);

export default router;
