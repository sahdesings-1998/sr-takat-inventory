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

export const generateSalePDF = async (req, res, next) => {
  const { id } = req.params;
  console.log(`[saleController] generateSalePDF request received for sale ID: ${id}`);

  // Validate Mongo ID format
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    console.warn(`[saleController] Invalid sale ID format received: ${id}`);
    return res.status(400).json({
      success: false,
      message: `Invalid sale ID format: ${id}`,
    });
  }

  let saleData;
  try {
    saleData = await saleService.getSaleById(id);
  } catch (dbErr) {
    console.error(`[saleController] Database error fetching sale ID ${id}:`, dbErr);
    return res.status(dbErr.statusCode || 500).json({
      success: false,
      message: dbErr.message || "Failed to retrieve sale record from database",
    });
  }

  if (!saleData || !saleData.sale) {
    console.warn(`[saleController] Sale document not found for ID: ${id}`);
    return res.status(404).json({
      success: false,
      message: `Sale invoice not found for ID: ${id}`,
    });
  }

  console.log(`[saleController] Sale invoice retrieved: ${saleData.sale.invoiceNo} (${saleData.items?.length || 0} items). Invoking PDF generator...`);

  try {
    const pdfBuffer = await generateInvoicePDFBuffer(saleData, "invoice");
    const buffer = Buffer.from(pdfBuffer);

    if (!buffer || buffer.length === 0) {
      throw new Error("Generated PDF binary buffer is empty");
    }

    const filename = `Invoice-${saleData.sale.invoiceNo || id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    console.log(`[saleController] Successfully generated PDF for invoice ${saleData.sale.invoiceNo} (${buffer.length} bytes). Sending response...`);
    return res.send(buffer);
  } catch (pdfErr) {
    console.error(`========== SALE PDF CONTROLLER EXCEPTION ==========`);
    console.error(`Sale ID: ${id}`);
    console.error(`Error Message: ${pdfErr.message}`);
    console.error(`Stack Trace:\n${pdfErr.stack}`);
    console.error(`===================================================`);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: `PDF Generation Error: ${pdfErr.message}`,
        error: pdfErr.message,
      });
    }
  }
};

export const recordPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await saleService.recordPayment(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Payment recorded successfully", data: result });
});

export default {
  getSales,
  getSale,
  createSale,
  generateSalePDF,
  recordPayment,
};
