import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import expenseController from "../controllers/expenseController.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Expense routes
router.get("/", expenseController.getExpenses);
router.get("/stats", expenseController.getExpenseStats);
router.get("/:id", expenseController.getExpense);
router.post("/", expenseController.createExpense);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

export default router;
