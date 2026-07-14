import expenseService from "../services/expenseService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getExpenses = catchAsync(async (req, res) => {
  const expenses = await expenseService.getAllExpenses(req.query);
  sendSuccess(res, { message: "Expenses retrieved successfully", data: expenses });
});

export const getExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const expense = await expenseService.getExpenseById(id);
  sendSuccess(res, { message: "Expense retrieved successfully", data: expense });
});

export const createExpense = catchAsync(async (req, res) => {
  const expense = await expenseService.createExpense(req.body, req.user._id, req.ip);
  sendSuccess(res, {
    statusCode: 201,
    message: "Expense record created successfully",
    data: expense,
  });
});

export const updateExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const expense = await expenseService.updateExpense(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Expense updated successfully", data: expense });
});

export const deleteExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  await expenseService.deleteExpense(id, req.user._id, req.ip);
  sendSuccess(res, { message: "Expense deleted successfully" });
});

export const getExpenseStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await expenseService.getExpenseStats(startDate, endDate);
  sendSuccess(res, { message: "Expense statistics retrieved successfully", data: stats });
});

export default {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
};
