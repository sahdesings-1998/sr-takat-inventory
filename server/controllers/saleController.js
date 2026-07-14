import saleService from "../services/saleService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getSales = catchAsync(async (req, res) => {
  const sales = await saleService.getAllSales(req.query);
  sendSuccess(res, { message: "Sales invoices retrieved successfully", data: sales });
});

export const getSale = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await saleService.getSaleById(id);
  sendSuccess(res, { message: "Sale invoice retrieved successfully", data: result });
});

export const createSale = catchAsync(async (req, res) => {
  const result = await saleService.createDirectSale(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Sale invoice created successfully", data: result });
});

export default {
  getSales,
  getSale,
  createSale,
};
