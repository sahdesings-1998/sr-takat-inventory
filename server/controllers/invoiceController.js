import Invoice from "../models/Invoice.js";
import { generateInvoicePDFBuffer } from "../services/pdfService.js";
import ApiError from "../utils/ApiError.js";

/**
 * Create a new invoice document
 */
export async function createInvoice(req, res, next) {
  try {
    const invoiceData = { ...req.body };
    if (!invoiceData.invoiceNumber) {
      const count = await Invoice.countDocuments();
      const year = new Date().getFullYear();
      invoiceData.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
    }
    if (req.user) {
      invoiceData.createdBy = req.user._id;
    }

    const invoice = await Invoice.create(invoiceData);
    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get an invoice by ID
 */
export async function getInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Render PDF for an invoice (by ID or payload body)
 * Route: POST /api/invoices/:id/pdf, GET /api/invoices/:id/pdf, POST /api/invoices/pdf
 */
export async function generateInvoicePDF(req, res, next) {
  try {
    const { id } = req.params;
    let invoiceData = null;

    if (id) {
      const invoiceDoc = await Invoice.findById(id);
      if (invoiceDoc) {
        invoiceData = invoiceDoc.toObject();
      }
    }

    // Fallback or override with request body data
    if (!invoiceData && req.body && Object.keys(req.body).length > 0) {
      invoiceData = req.body;
    }

    if (!invoiceData) {
      if (id) {
        throw new ApiError(404, `Invoice not found with id: ${id}`);
      }
      throw new ApiError(400, "No invoice data provided to generate PDF");
    }

    const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);
    const buffer = Buffer.from(pdfBuffer);

    const filename = `memorandum-${invoiceData.invoiceNumber || id || "doc"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error) {
    next(error);
  }
}
