import purchaseInvoiceService from "../services/purchaseInvoiceService.js";
import { generateInvoicePDFBuffer } from "../services/pdfService.js";
import ApiError from "../utils/ApiError.js";

async function getAllPurchaseInvoices(req, res, next) {
  try {
    const invoices = await purchaseInvoiceService.getAllPurchaseInvoices(req.query);
    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
}

async function getPurchaseInvoiceById(req, res, next) {
  try {
    const invoice = await purchaseInvoiceService.getPurchaseInvoiceById(req.params.id);
    res.json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

async function createPurchaseInvoice(req, res, next) {
  try {
    const invoice = await purchaseInvoiceService.createPurchaseInvoice(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: "Purchase invoice created successfully",
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

async function updatePurchaseInvoice(req, res, next) {
  try {
    const invoice = await purchaseInvoiceService.updatePurchaseInvoice(req.params.id, req.body, req.user._id);
    res.json({
      success: true,
      message: "Purchase invoice updated successfully",
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

async function confirmPurchaseInvoice(req, res, next) {
  try {
    const invoice = await purchaseInvoiceService.confirmPurchaseInvoice(
      req.params.id,
      req.user._id,
      req.ip
    );
    res.json({
      success: true,
      message: "Purchase invoice confirmed and stock inward processed successfully",
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

async function cancelPurchaseInvoice(req, res, next) {
  try {
    const { reason } = req.body;
    const invoice = await purchaseInvoiceService.cancelPurchaseInvoice(
      req.params.id,
      reason,
      req.user._id,
      req.ip
    );
    res.json({
      success: true,
      message: "Purchase invoice cancelled and stock reversed successfully",
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

async function recordInvoicePayment(req, res, next) {
  try {
    const invoice = await purchaseInvoiceService.recordInvoicePayment(
      req.params.id,
      req.body,
      req.user._id,
      req.ip
    );
    res.json({
      success: true,
      message: "Payment recorded against purchase invoice successfully",
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

async function deletePurchaseInvoice(req, res, next) {
  try {
    await purchaseInvoiceService.deletePurchaseInvoice(req.params.id, req.user._id);
    res.json({
      success: true,
      message: "Purchase invoice deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function downloadPurchaseInvoicePDF(req, res, next) {
  try {
    const invoice = await purchaseInvoiceService.getPurchaseInvoiceById(req.params.id);
    const pdfBuffer = await generateInvoicePDFBuffer(invoice, "purchase_invoice");

    const fileName = `Purchase_Invoice_${invoice.invoiceNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export default {
  getAllPurchaseInvoices,
  getPurchaseInvoiceById,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  confirmPurchaseInvoice,
  cancelPurchaseInvoice,
  recordInvoicePayment,
  deletePurchaseInvoice,
  downloadPurchaseInvoicePDF,
};
