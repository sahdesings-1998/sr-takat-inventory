import { Router } from "express";
import * as reportController from "../controllers/reportController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

// Dashboard Summary
router.get("/dashboard", requirePermission("reports.view"), reportController.getDashboardSummary);

// Master Report Endpoints (PRD Section 6)
router.get("/inventory-valuation", requirePermission("reports.view"), reportController.getValuationReport);
router.get("/gemstone-stock", requirePermission("reports.view"), reportController.getGemstoneStockReport);
router.get("/jewellery-stock", requirePermission("reports.view"), reportController.getJewelleryStockReport);
router.get("/memo", requirePermission("reports.view"), reportController.getMemoReport);
router.get("/sales", requirePermission("reports.view"), reportController.getSalesReport);
router.get("/profit", requirePermission("reports.view"), reportController.getRevenuesSummary); // Net & Gross profits
router.get("/charity", requirePermission("reports.view"), reportController.getRevenuesSummary); // Charity allocations
router.get("/product-cost", requirePermission("reports.view"), reportController.getProductCostReport);
router.get("/stock-movement", requirePermission("reports.view"), reportController.getStockMovementReport);
router.get("/supplier-purchase", requirePermission("reports.view"), reportController.getSupplierPurchaseReport);

// Keep legacy endpoints for compatibility
router.get("/valuation", requirePermission("reports.view"), reportController.getValuationReport);
router.get("/revenues", requirePermission("reports.view"), reportController.getRevenuesSummary);

export default router;
