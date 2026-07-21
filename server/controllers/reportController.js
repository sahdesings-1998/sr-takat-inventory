import reportService from "../services/reportService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getValuationReport = catchAsync(async (req, res) => {
  const valuation = await reportService.getStockValuation(req.query);
  sendSuccess(res, { message: "Stock valuation calculated successfully", data: valuation });
});

export const getRevenuesSummary = catchAsync(async (req, res) => {
  const summary = await reportService.getRevenuesSummary(req.query);
  sendSuccess(res, { message: "Revenues summary compiled successfully", data: summary });
});

export const getDashboardSummary = catchAsync(async (req, res) => {
  const summary = await reportService.getDashboardSummary(req.query);
  sendSuccess(res, { message: "Dashboard summary compiled successfully", data: summary });
});

export const getGemstoneStockReport = catchAsync(async (req, res) => {
  const report = await reportService.getGemstoneStockReport(req.query);
  sendSuccess(res, { message: "Gemstone stock report retrieved", data: report });
});

export const getJewelleryStockReport = catchAsync(async (req, res) => {
  const report = await reportService.getJewelleryStockReport(req.query);
  sendSuccess(res, { message: "Jewellery stock report retrieved", data: report });
});

export const getMemoReport = catchAsync(async (req, res) => {
  const report = await reportService.getMemoReport(req.query);
  sendSuccess(res, { message: "Memo consignment report retrieved", data: report });
});

export const getSalesReport = catchAsync(async (req, res) => {
  const report = await reportService.getSalesReport(req.query);
  sendSuccess(res, { message: "Sales report retrieved", data: report });
});

export const getProductCostReport = catchAsync(async (req, res) => {
  const report = await reportService.getProductCostReport(req.query);
  sendSuccess(res, { message: "Product cost report retrieved", data: report });
});

export const getStockMovementReport = catchAsync(async (req, res) => {
  const report = await reportService.getStockMovementReport(req.query);
  sendSuccess(res, { message: "Inventory stock movement report retrieved", data: report });
});

export const getSupplierPurchaseReport = catchAsync(async (req, res) => {
  const report = await reportService.getSupplierPurchaseReport(req.query);
  sendSuccess(res, { message: "Supplier purchases summary report retrieved", data: report });
});

export const getIncomeReport = catchAsync(async (req, res) => {
  const report = await reportService.getIncomeReport(req.query);
  sendSuccess(res, { message: "Income report retrieved successfully", data: report });
});

export const getExpenseReport = catchAsync(async (req, res) => {
  const report = await reportService.getExpenseReport(req.query);
  sendSuccess(res, { message: "Expenses report retrieved successfully", data: report });
});

export default {
  getValuationReport,
  getRevenuesSummary,
  getDashboardSummary,
  getGemstoneStockReport,
  getJewelleryStockReport,
  getMemoReport,
  getSalesReport,
  getProductCostReport,
  getStockMovementReport,
  getSupplierPurchaseReport,
  getIncomeReport,
  getExpenseReport,
};
