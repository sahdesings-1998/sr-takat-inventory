import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getLogoBase64() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.resolve(__dirname, "../../client/src/assets/logo.png");
    if (fs.existsSync(logoPath)) {
      return `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
    }
  } catch (e) { }
  try {
    const fallbackPath = path.resolve(process.cwd(), "client/src/assets/logo.png");
    if (fs.existsSync(fallbackPath)) {
      return `data:image/png;base64,${fs.readFileSync(fallbackPath).toString("base64")}`;
    }
  } catch (e) { }
  return "";
}

export function generateInvoiceHTML(data = {}) {
  const logoBase64 = getLogoBase64();
  const sale = data.sale || data;
  const items = data.items || sale.items || sale.lineItems || [];

  const invoiceNo = sale.invoiceNo || sale.invoiceNumber || "";
  const rawDate = sale.createdAt || sale.date || new Date();

  // Format date helper (DD/MM/YYYY)
  let formattedDate = "";
  if (rawDate && !isNaN(new Date(rawDate).getTime())) {
    const d = new Date(rawDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    formattedDate = `${day}/${month}/${year}`;
  } else {
    formattedDate = String(rawDate || "");
  }

  // Customer info extraction
  const customer = sale.customerId || {};
  const customerName =
    typeof customer === "object" && customer !== null
      ? customer.fullName || customer.name || sale.to || ""
      : sale.to || "";
  const customerAddress =
    typeof customer === "object" && customer !== null
      ? customer.address || sale.address || ""
      : sale.address || "";
  const customerPhone =
    typeof customer === "object" && customer !== null
      ? customer.phone || customer.tel || sale.tel || ""
      : sale.tel || "";
  const attention =
    sale.attention ||
    (typeof customer === "object" && customer !== null ? customer.contactPerson : "") ||
    "";

  // Address lines (handles multi-line input or string)
  let addressLines = ["", ""];
  if (customerAddress) {
    const lines = customerAddress.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) addressLines[0] = lines[0];
    if (lines.length > 1) addressLines[1] = lines.slice(1).join(", ");
  }

  // Financials
  const paymentStatus = sale.paymentStatus || "Paid";
  const paymentMethod = sale.paymentMethod || "Cash";
  const subtotal = Number(sale.subtotal || 0);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const total = Number(sale.total || 0);
  const charityAmount = Number(sale.charityAmount || 0);
  const charityPercentage = Number(sale.charityPercentage || 0);
  const notes = sale.notes || "";

  // Normalize line items
  const normalizedItems = items.map((item) => {
    if (!item) return null;
    let description = item.description || "";
    if (!description) {
      if (item.inventoryType === "Product") {
        const p = item.inventoryId || {};
        description = p.name ? `${p.productCode ? `[${p.productCode}] ` : ""}${p.name}` : "Product Item";
      } else if (item.inventoryType === "Gemstone") {
        const g = item.inventoryId || {};
        description = g.gemstone
          ? `${g.stoneId ? `[${g.stoneId}] ` : ""}${g.gemstone}${g.carat ? ` (${g.carat} ct)` : ""}`
          : "Gemstone Item";
      } else {
        description = "Sale Item";
      }
    }

    const qty = Number(item.quantity || item.qtyGivenPcs || item.keptPcs || 1);
    const unitPrice = Number(item.sellingPrice || item.pricePerCts || item.price || 0);
    const lineDiscount = Number(item.discount || 0);
    const lineAmount = Number(item.amount || (qty * unitPrice) - lineDiscount);

    return {
      description,
      qty,
      unitPrice,
      discount: lineDiscount,
      amount: lineAmount,
      remark: item.remark || "",
    };
  });

  // Ensure minimum 12 display rows for balanced A4 presentation
  const paddedItems = [...normalizedItems];
  while (paddedItems.length < 12) {
    paddedItems.push(null);
  }
  const displayRows = paddedItems.slice(0, 12);

  const subtotalDisplay = subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const discountDisplay = discount > 0 ? discount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
  const taxDisplay = tax > 0 ? tax.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
  const totalDisplay = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TAKAT GEMS SR CO., LTD. - INVOICE ${invoiceNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      line-height: 1.2;
      -webkit-print-color-adjust: exact;
    }

    .container {
      width: 100%;
      max-width: 100%;
    }

    /* HEADER */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }

    .header-table td {
      vertical-align: top;
    }

    .header-left {
      width: 35%;
      font-size: 9px;
      line-height: 1.25;
    }

    .company-title {
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.2px;
      margin-bottom: 2px;
      white-space: nowrap;
    }

    .address-line {
      font-size: 9px;
      color: #111;
    }

    .header-center {
      width: 30%;
      text-align: center;
    }

    .logo-container {
      margin: 0 auto 1px auto;
      display: inline-block;
    }

    .sr-wordmark {
      font-size: 14px;
      font-weight: bold;
      font-family: "Times New Roman", Times, serif;
      letter-spacing: 1px;
      margin-top: 1px;
    }

    .by-subtext {
      font-style: italic;
      font-size: 8px;
      color: #333;
    }

    .est-text {
      font-size: 7.5px;
      color: #444;
      margin-bottom: 3px;
    }

    .invoice-heading {
      font-size: 13px;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }

    .header-right {
      width: 35%;
      font-size: 9.5px;
      text-align: right;
      padding-top: 2px;
    }

    .field-row {
      margin-bottom: 3px;
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
    }

    .field-label {
      font-weight: bold;
      margin-right: 4px;
      white-space: nowrap;
    }

    .field-blank {
      border-bottom: 1px solid #000;
      display: inline-block;
      text-align: left;
      padding-left: 4px;
      font-family: "Courier New", Courier, monospace, serif;
      font-size: 10px;
      min-height: 12px;
    }

    /* LEGAL DISCLAIMER */
    .legal-disclaimer {
      font-size: 7.5px;
      text-align: justify;
      line-height: 1.15;
      margin-bottom: 6px;
      letter-spacing: -0.05px;
    }

    /* MAIN TABLE */
    .main-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      margin-bottom: 6px;
    }

    .main-table th, .main-table td {
      border: 1px solid #000;
      padding: 4px 3px;
      font-size: 9px;
    }

    .main-table th {
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      font-size: 8.5px;
      line-height: 1.1;
      background-color: #f8f8f8;
    }

    .col-no { width: 35px; text-align: center; }
    .col-desc { text-align: left; }
    .col-qty { width: 60px; text-align: center; }
    .col-price { width: 90px; text-align: right; }
    .col-amount { width: 95px; text-align: right; }

    .main-table tbody tr {
      height: 22px;
    }

    .main-table tbody td {
      vertical-align: middle;
    }

    .cell-no {
      text-align: center;
      font-weight: normal;
    }

    .cell-desc {
      text-align: left;
      padding-left: 5px;
      font-family: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cell-num {
      text-align: center;
    }

    .cell-price {
      text-align: right;
      padding-right: 5px;
    }

    .cell-amount {
      text-align: right;
      padding-right: 5px;
    }

    /* SUMMARY / TOTALS TABLE */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }

    .summary-table td {
      vertical-align: top;
      font-size: 9px;
    }

    .summary-left {
      width: 55%;
      padding-right: 15px;
    }

    .summary-right {
      width: 45%;
    }

    .totals-box {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
    }

    .totals-box td {
      padding: 3px 6px;
      border-bottom: 1px solid #ddd;
    }

    .totals-box tr:last-child td {
      border-bottom: none;
    }

    .totals-label {
      font-weight: bold;
      text-align: left;
    }

    .totals-val {
      text-align: right;
      font-weight: bold;
      font-family: "Courier New", Courier, monospace, serif;
    }

    .grand-total-row td {
      background-color: #f0f0f0;
      font-size: 10px;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
    }

    .charity-badge {
      border: 1px dashed #b45309;
      background-color: #fffbeb;
      color: #92400e;
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 8px;
      line-height: 1.25;
      margin-top: 4px;
    }

    .notes-box {
      font-size: 8.5px;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .notes-title {
      font-weight: bold;
      text-decoration: underline;
    }

    /* TREATMENT DISCLAIMER */
    .treatment-disclaimer {
      font-size: 7.5px;
      text-align: justify;
      line-height: 1.15;
      margin-top: 6px;
      margin-bottom: 16px;
      border-top: 1px solid #ccc;
      padding-top: 4px;
    }

    /* SIGNATURE ROW */
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .signature-col {
      width: 48%;
      vertical-align: bottom;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      height: 24px;
      margin-bottom: 3px;
    }

    .signature-label {
      font-size: 9px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <table class="header-table">
      <tr>
        <!-- Left Column -->
        <td class="header-left">
          <div class="company-title">TAKAT GEMS SR CO., LTD.</div>
          <div class="address-line">919/336, 26th Floor</div>
          <div class="address-line">JTC, Silom Rd, Bangrak</div>
          <div class="address-line">Bangkok 10500, Thailand</div>
          <div class="address-line">T: +662 126 6759</div>
          <div class="address-line">M: +852 5538 0785 (Rehman Ahmed Takat)</div>
          <div class="address-line">M: +91 9587867863 (Ruman Ahmed Takat)</div>
          <div class="address-line">E: info@takatsr.com</div>
        </td>

        <!-- Center Column -->
        <td class="header-center">
          <div class="logo-container">
            ${logoBase64 ? `<img src="${logoBase64}" alt="TAKAT-SR Logo" style="max-height: 55px; max-width: 140px; object-fit: contain;" />` : `
            <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" stroke="#000" stroke-width="2.5" fill="none"/>
              <text x="35" y="62" font-family="Times New Roman, serif" font-size="44" font-weight="bold" fill="#000">S</text>
              <text x="48" y="66" font-family="Times New Roman, serif" font-size="44" font-weight="bold" font-style="italic" fill="#000">R</text>
            </svg>
            `}
          </div>
          <div class="invoice-heading">INVOICE</div>
        </td>

        <!-- Right Column -->
        <td class="header-right">
          <div class="field-row">
            <span class="field-label">INVOICE NO:</span>
            <span class="field-blank" style="width: 150px; font-weight: bold;">${invoiceNo}</span>
          </div>
          <div class="field-row">
            <span class="field-label">DATE:</span>
            <span class="field-blank" style="width: 150px;">${formattedDate}</span>
          </div>
          <div class="field-row">
            <span class="field-label">TO:</span>
            <span class="field-blank" style="width: 150px;">${customerName}</span>
          </div>
          <div class="field-row">
            <span class="field-label">ADDRESS:</span>
            <span class="field-blank" style="width: 150px;">${addressLines[0]}</span>
          </div>
          <div class="field-row">
            <span class="field-label"></span>
            <span class="field-blank" style="width: 150px;">${addressLines[1]}</span>
          </div>
          <div class="field-row">
            <span class="field-label">TEL / PHONE:</span>
            <span class="field-blank" style="width: 150px;">${customerPhone}</span>
          </div>
          ${attention ? `<div class="field-row"><span class="field-label">ATTENTION:</span><span class="field-blank" style="width: 150px;">${attention}</span></div>` : ""}
        </td>
      </tr>
    </table>

    <!-- LEGAL PARAGRAPH -->
    <div class="legal-disclaimer">
      All sales are final. Goods sold remain the property of TAKAT GEMS SR CO., LTD. until full payment is received. Payment method: <strong>${paymentMethod}</strong> | Status: <strong>${paymentStatus}</strong>.
    </div>

    <!-- MAIN TABLE -->
    <table class="main-table">
      <thead>
        <tr>
          <th class="col-no">NO.</th>
          <th class="col-desc">ITEM DESCRIPTION</th>
          <th class="col-qty">QTY</th>
          <th class="col-price">UNIT PRICE ($)</th>
          <th class="col-amount">TOTAL ($)</th>
        </tr>
      </thead>
      <tbody>
        ${displayRows
      .map((item, index) => {
        const rowNo = index + 1;
        if (!item) {
          return `<tr>
                <td class="cell-no">${rowNo}</td>
                <td class="cell-desc"></td>
                <td class="cell-num"></td>
                <td class="cell-price"></td>
                <td class="cell-amount"></td>
              </tr>`;
        }

        const unitPriceStr = item.unitPrice > 0 ? item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";
        const amountStr = item.amount > 0 ? item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

        return `<tr>
              <td class="cell-no">${rowNo}</td>
              <td class="cell-desc">${item.description}</td>
              <td class="cell-num">${item.qty}</td>
              <td class="cell-price">${unitPriceStr}</td>
              <td class="cell-amount">${amountStr}</td>
            </tr>`;
      })
      .join("")}
      </tbody>
    </table>

    <!-- SUMMARY & TOTALS SECTION -->
    <table class="summary-table">
      <tr>
        <td class="summary-left">
          ${notes ? `
          <div class="notes-box">
            <span class="notes-title">Special Notes:</span> ${notes}
          </div>
          ` : ""}

          ${charityAmount > 0 ? `
          <div class="charity-badge">
            <strong>Charity Contribution (${charityPercentage}%):</strong> A gross donation of <strong>$${charityAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> has been contributed to our community program from this transaction.
          </div>
          ` : ""}
        </td>
        <td class="summary-right">
          <table class="totals-box">
            <tr>
              <td class="totals-label">SUBTOTAL:</td>
              <td class="totals-val">$${subtotalDisplay}</td>
            </tr>
            ${discount > 0 ? `
            <tr>
              <td class="totals-label">DISCOUNT:</td>
              <td class="totals-val" style="color: #b91c1c;">-$${discountDisplay}</td>
            </tr>
            ` : ""}
            ${tax > 0 ? `
            <tr>
              <td class="totals-label">TAX / VAT:</td>
              <td class="totals-val">+$${taxDisplay}</td>
            </tr>
            ` : ""}
            <tr class="grand-total-row">
              <td class="totals-label">TOTAL US$:</td>
              <td class="totals-val">$${totalDisplay}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- TREATMENT DISCLAIMER -->
    <div class="treatment-disclaimer">
      ALL OUR COLORED GEMSTONES ARE GUARANTEED AUTHENTIC FINE GEMSTONES. In general, some enhancement methods used in colored gemstones include heating, oiling, or resin treatment. We operate with full transparency. Thank you for doing business with TAKAT GEMS SR CO., LTD.<br>
      <strong>Received goods in good order and condition.</strong>
    </div>

    <!-- SIGNATURE ROW -->
    <table class="signature-table">
      <tr>
        <td class="signature-col">
          <div class="signature-line"></div>
          <div class="signature-label">Authorized Signature (Issuer):</div>
        </td>
        <td style="width: 4%;"></td>
        <td class="signature-col">
          <div class="signature-line"></div>
          <div class="signature-label">Customer Signature (Receiver):</div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
