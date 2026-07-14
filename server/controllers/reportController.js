import reportService from "../services/reportService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getValuationReport = catchAsync(async (req, res) => {
  const valuation = await reportService.getStockValuation();
  sendSuccess(res, { message: "Stock valuation calculated successfully", data: valuation });
});

export const getRevenuesSummary = catchAsync(async (req, res) => {
  const summary = await reportService.getRevenuesSummary();
  sendSuccess(res, { message: "Revenues summary compiled successfully", data: summary });
});

export const getDashboardSummary = catchAsync(async (req, res) => {
  const summary = await reportService.getDashboardSummary();
  sendSuccess(res, { message: "Dashboard summary compiled successfully", data: summary });
});

export const getGemstoneStockReport = catchAsync(async (req, res) => {
  const report = await reportService.getGemstoneStockReport();
  sendSuccess(res, { message: "Gemstone stock report retrieved", data: report });
});

export const getJewelleryStockReport = catchAsync(async (req, res) => {
  const report = await reportService.getJewelleryStockReport();
  sendSuccess(res, { message: "Jewellery stock report retrieved", data: report });
});

export const getMemoReport = catchAsync(async (req, res) => {
  const report = await reportService.getMemoReport();
  sendSuccess(res, { message: "Memo consignment report retrieved", data: report });
});

export const getSalesReport = catchAsync(async (req, res) => {
  const report = await reportService.getSalesReport();
  sendSuccess(res, { message: "Sales report retrieved", data: report });
});

export const getProductCostReport = catchAsync(async (req, res) => {
  const report = await reportService.getProductCostReport();
  sendSuccess(res, { message: "Product cost report retrieved", data: report });
});

export const getStockMovementReport = catchAsync(async (req, res) => {
  const report = await reportService.getStockMovementReport();
  sendSuccess(res, { message: "Inventory stock movement report retrieved", data: report });
});

export const getSupplierPurchaseReport = catchAsync(async (req, res) => {
  const report = await reportService.getSupplierPurchaseReport();
  sendSuccess(res, { message: "Supplier purchases summary report retrieved", data: report });
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
};
