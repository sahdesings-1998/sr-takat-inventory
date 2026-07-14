import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import incomeController from "../controllers/incomeController.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Income routes
router.get("/", incomeController.getIncomes);
router.get("/stats", incomeController.getIncomeStats);
router.get("/:id", incomeController.getIncome);
router.post("/", incomeController.createIncome);
router.put("/:id", incomeController.updateIncome);
router.delete("/:id", incomeController.deleteIncome);

export default router;
