import incomeService from "../services/incomeService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getIncomes = catchAsync(async (req, res) => {
  const incomes = await incomeService.getAllIncomes(req.query);
  sendSuccess(res, { message: "Incomes retrieved successfully", data: incomes });
});

export const getIncome = catchAsync(async (req, res) => {
  const { id } = req.params;
  const income = await incomeService.getIncomeById(id);
  sendSuccess(res, { message: "Income retrieved successfully", data: income });
});

export const createIncome = catchAsync(async (req, res) => {
  const income = await incomeService.createIncome(req.body, req.user._id, req.ip);
  sendSuccess(res, {
    statusCode: 201,
    message: "Income record created successfully",
    data: income,
  });
});

export const updateIncome = catchAsync(async (req, res) => {
  const { id } = req.params;
  const income = await incomeService.updateIncome(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Income updated successfully", data: income });
});

export const deleteIncome = catchAsync(async (req, res) => {
  const { id } = req.params;
  await incomeService.deleteIncome(id, req.user._id, req.ip);
  sendSuccess(res, { message: "Income deleted successfully" });
});

export const getIncomeStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await incomeService.getIncomeStats(startDate, endDate);
  sendSuccess(res, { message: "Income statistics retrieved successfully", data: stats });
});

export default {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats,
};
