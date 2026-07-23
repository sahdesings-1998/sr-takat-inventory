import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getLogoBase64() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logoPath)) {
      return `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
    }
  } catch (e) {}
  try {
    const fallbackPath = path.resolve(process.cwd(), "client/src/assets/logo.png");
    if (fs.existsSync(fallbackPath)) {
      return `data:image/png;base64,${fs.readFileSync(fallbackPath).toString("base64")}`;
    }
  } catch (e) {}
  return "";
}

export function generatePurchaseInvoiceHTML(data = {}) {
  const logoBase64 = getLogoBase64();
  const invoice = data.invoice || data;
  const supplier = invoice.supplierId || {};
  const items = invoice.items || [];
  const payments = data.payments || invoice.payments || [];

  const invoiceNo = invoice.invoiceNumber || "PINV-00000";
  const supplierInvNo = invoice.supplierInvoiceNumber || "N/A";
  const status = invoice.status || "Draft";
  const paymentStatus = invoice.paymentStatus || "Unpaid";

  const formatDate = (rawDate) => {
    if (!rawDate) return "N/A";
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "N/A";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const invoiceDate = formatDate(invoice.invoiceDate);
  const purchaseDate = formatDate(invoice.purchaseDate);
  const dueDate = formatDate(invoice.dueDate);

  const supplierName = supplier.companyName || supplier.contactName || "N/A";
  const supplierContact = supplier.contactName || "";
  const supplierPhone = supplier.phone || "N/A";
  const supplierEmail = supplier.email || "N/A";
  const supplierAddress = supplier.address || "N/A";

  const subtotal = (Number(invoice.subtotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const discountTotal = (Number(invoice.discountTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const taxTotal = (Number(invoice.taxTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const finalTotal = (Number(invoice.finalTotal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paidAmount = (Number(invoice.paidAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const outstandingBalance = (Number(invoice.outstandingBalance) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Purchase Invoice ${invoiceNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
    }
    .container { width: 100%; max-width: 100%; padding: 10px; }

    /* Header */
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #0d3545; padding-bottom: 12px; }
    .header-table td { vertical-align: top; }
    .logo-td { width: 45%; }
    .title-td { width: 55%; text-align: right; }
    
    .company-title { font-size: 18px; font-weight: 800; color: #0d3545; letter-spacing: 0.5px; }
    .company-sub { font-size: 9px; text-transform: uppercase; color: #64748b; tracking: 1px; font-weight: 600; margin-bottom: 6px; }
    .company-info { font-size: 9.5px; color: #475569; line-height: 1.35; }

    .doc-heading { font-size: 22px; font-weight: 900; color: #0d3545; text-transform: uppercase; letter-spacing: 1px; }
    .badge { display: inline-block; padding: 3px 8px; font-size: 9px; font-weight: 800; border-radius: 4px; text-transform: uppercase; margin-top: 4px; }
    .badge-confirmed { bg: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-draft { bg: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .badge-cancelled { bg: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }

    /* Info Cards Grid */
    .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .info-grid td { vertical-align: top; width: 50%; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .card-title { font-size: 10px; font-weight: 800; color: #0d3545; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .info-line { margin-bottom: 4px; font-size: 10px; }
    .info-label { font-weight: 700; color: #64748b; display: inline-block; width: 120px; }
    .info-val { font-weight: 600; color: #0f172a; }

    /* Items Table */
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #0d3545; color: #ffffff; font-size: 9.5px; font-weight: 700; text-transform: uppercase; padding: 8px 6px; text-align: left; }
    .items-table td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155; }
    .items-table tr:nth-child(even) td { background: #f8fafc; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; font-size: 10.5px; }

    /* Summary & Totals */
    .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .summary-table td { vertical-align: top; }
    .notes-td { width: 55%; padding-right: 20px; }
    .totals-td { width: 45%; }
    
    .totals-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
    .tot-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 10.5px; }
    .tot-label { font-weight: 600; color: #64748b; }
    .tot-val { font-weight: 700; color: #0f172a; }
    .tot-grand { border-bottom: 2px solid #0d3545; border-top: 2px solid #0d3545; padding: 8px 0; margin-top: 4px; font-size: 13px; color: #0d3545; }

    .notes-box { background: #fffbe6; border: 1px solid #ffe58f; padding: 10px; border-radius: 6px; font-size: 9.5px; color: #734a00; }

    /* Signatures */
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
    .sig-td { width: 45%; text-align: center; vertical-align: bottom; }
    .sig-line { border-bottom: 1.5px dashed #64748b; height: 40px; margin-bottom: 6px; }
    .sig-title { font-size: 10px; font-weight: 700; color: #334155; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <table class="header-table">
      <tr>
        <td class="logo-td">
          ${logoBase64 ? `<img src="${logoBase64}" alt="SR TAKAT" style="height: 55px; margin-bottom: 6px;" />` : ''}
          <div class="company-title">SR TAKAT GEMS & JEWELLERY</div>
          <div class="company-sub">Inventory & Manufacturing Division</div>
          <div class="company-info">
            919/336, 26th Floor, JTC Building, Silom Rd, Bangrak, Bangkok 10500<br/>
            Phone: +662 126 6759 | Email: info@takatsr.com
          </div>
        </td>
        <td class="title-td">
          <div class="doc-heading">PURCHASE INVOICE</div>
          <div style="margin-top: 4px; font-size: 12px; font-weight: 800; color: #0d3545;" class="font-mono">${invoiceNo}</div>
          <div style="margin-top: 6px;">
            <span class="badge" style="background: ${status === 'Confirmed' ? '#dcfce7' : status === 'Cancelled' ? '#ffe4e6' : '#f1f5f9'}; color: ${status === 'Confirmed' ? '#15803d' : status === 'Cancelled' ? '#be123c' : '#475569'};">
              Status: ${status}
            </span>
            <span class="badge" style="background: ${paymentStatus === 'Paid' ? '#dcfce7' : paymentStatus === 'Partially Paid' ? '#fef3c7' : '#ffe4e6'}; color: ${paymentStatus === 'Paid' ? '#15803d' : paymentStatus === 'Partially Paid' ? '#b45309' : '#be123c'};">
              Payment: ${paymentStatus}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- INFO CARDS -->
    <table class="info-grid">
      <tr>
        <td style="padding-right: 10px;">
          <div class="info-card">
            <div class="card-title">Supplier Details</div>
            <div class="info-line"><span class="info-label">Company Name:</span> <span class="info-val">${supplierName}</span></div>
            ${supplierContact ? `<div class="info-line"><span class="info-label">Contact Person:</span> <span class="info-val">${supplierContact}</span></div>` : ''}
            <div class="info-line"><span class="info-label">Phone / WhatsApp:</span> <span class="info-val">${supplierPhone}</span></div>
            <div class="info-line"><span class="info-label">Email Address:</span> <span class="info-val">${supplierEmail}</span></div>
            <div class="info-line"><span class="info-label">Address:</span> <span class="info-val">${supplierAddress}</span></div>
          </div>
        </td>
        <td style="padding-left: 10px;">
          <div class="info-card">
            <div class="card-title">Invoice & Purchase Details</div>
            <div class="info-line"><span class="info-label">System Invoice #:</span> <span class="info-val font-mono">${invoiceNo}</span></div>
            <div class="info-line"><span class="info-label">Supplier Invoice #:</span> <span class="info-val font-mono">${supplierInvNo}</span></div>
            <div class="info-line"><span class="info-label">Invoice Date:</span> <span class="info-val">${invoiceDate}</span></div>
            <div class="info-line"><span class="info-label">Purchase Date:</span> <span class="info-val">${purchaseDate}</span></div>
            ${invoice.dueDate ? `<div class="info-line"><span class="info-label">Due Date:</span> <span class="info-val">${dueDate}</span></div>` : ''}
          </div>
        </td>
      </tr>
    </table>

    <!-- ITEMS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;" class="text-center">#</th>
          <th style="width: 35%;">Item / Material Description</th>
          <th style="width: 15%;">Type</th>
          <th style="width: 10%;" class="text-center">Qty</th>
          <th style="width: 8%;" class="text-center">Unit</th>
          <th style="width: 13%;" class="text-right">Unit Price ($)</th>
          <th style="width: 14%;" class="text-right">Total ($)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td class="text-center font-mono">${idx + 1}</td>
            <td style="font-weight: 700;">${item.name || "Item"}</td>
            <td>${item.itemType || item.inventoryType || "Material"}</td>
            <td class="text-center font-mono" style="font-weight: 700;">${item.quantity}</td>
            <td class="text-center">${item.unit || "pcs"}</td>
            <td class="text-right font-mono">$${(Number(item.purchasePrice) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-right font-mono" style="font-weight: 700;">$${(Number(item.totalAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- SUMMARY & TOTALS -->
    <table class="summary-table">
      <tr>
        <td class="notes-td">
          ${invoice.notes ? `
            <div class="notes-box">
              <strong>Notes / Instructions:</strong><br/>
              ${invoice.notes}
            </div>
          ` : ''}
        </td>
        <td class="totals-td">
          <div class="totals-card">
            <div class="tot-row">
              <span class="tot-label">Subtotal:</span>
              <span class="tot-val font-mono">$${subtotal}</span>
            </div>
            ${Number(invoice.discountTotal) > 0 ? `
              <div class="tot-row">
                <span class="tot-label">Discount:</span>
                <span class="tot-val font-mono">-$${discountTotal}</span>
              </div>
            ` : ''}
            ${Number(invoice.taxTotal) > 0 ? `
              <div class="tot-row">
                <span class="tot-label">Tax:</span>
                <span class="tot-val font-mono">+$${taxTotal}</span>
              </div>
            ` : ''}
            <div class="tot-row tot-grand">
              <span style="font-weight: 800;">Final Total:</span>
              <span class="font-mono" style="font-weight: 900;">$${finalTotal}</span>
            </div>
            <div class="tot-row" style="margin-top: 6px;">
              <span class="tot-label" style="color: #15803d;">Total Amount Paid:</span>
              <span class="tot-val font-mono" style="color: #15803d;">$${paidAmount}</span>
            </div>
            <div class="tot-row">
              <span class="tot-label" style="color: #be123c;">Outstanding Balance:</span>
              <span class="tot-val font-mono" style="color: #be123c; font-size: 11px;">$${outstandingBalance}</span>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- SIGNATURES -->
    <table class="sig-table">
      <tr>
        <td class="sig-td">
          <div class="sig-line"></div>
          <div class="sig-title">Authorized Supplier Signature</div>
        </td>
        <td style="width: 10%;"></td>
        <td class="sig-td">
          <div class="sig-line"></div>
          <div class="sig-title">Received & Checked By (SR TAKAT)</div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
