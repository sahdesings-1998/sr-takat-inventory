import saleService from "../services/saleService.js";
import { generateInvoicePDFBuffer } from "../services/pdfService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";

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

export const generateSalePDF = catchAsync(async (req, res) => {
  const { id } = req.params;
  const saleData = await saleService.getSaleById(id);
  if (!saleData || !saleData.sale) {
    throw new ApiError(404, "Sale invoice not found");
  }

  const pdfBuffer = await generateInvoicePDFBuffer(saleData, "invoice");
  const buffer = Buffer.from(pdfBuffer);

  const filename = `Invoice-${saleData.sale.invoiceNo || id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);

  res.send(buffer);
});

export default {
  getSales,
  getSale,
  createSale,
  generateSalePDF,
};
