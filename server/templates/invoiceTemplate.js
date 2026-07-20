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

  // ---- DATE ----
  const rawDate = sale.createdAt || sale.date || new Date();
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

  // ---- TO / ADDRESS / ATTENTION / TEL ----
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

  let addressLine1 = "";
  let addressLine2 = "";
  if (customerAddress) {
    const lines = customerAddress.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) addressLine1 = lines[0];
    if (lines.length > 1) addressLine2 = lines.slice(1).join(", ");
  }

  // ---- FOOTER FIELDS ----
  const totalParcels = sale.totalParcels || sale.parcels || "";
  const memoClearingDate = sale.memoClearingDate || "";
  const termsOfPayment = sale.termsOfPayment || sale.paymentTerms || "";

  // ---- LINE ITEMS ----
  // Each row: description, qtyGiven (PCS/CTS combined field), returnVal, keptVal,
  // pricePerCts, amount, remark
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

    const qtyGiven = item.qtyGiven || item.qtyGivenPcs || item.quantity || "";
    const returnVal = item.return || item.returnPcs || "";
    const kept = item.kept || item.keptPcs || "";
    const pricePerCts = item.pricePerCts || item.price || item.sellingPrice || "";
    const amount = item.amount || (Number(qtyGiven) && Number(pricePerCts)
      ? (Number(qtyGiven) * Number(pricePerCts)).toFixed(2)
      : "");
    const remark = item.remark || "";

    return { description, qtyGiven, returnVal, kept, pricePerCts, amount, remark };
  });

  // Fixed 15 rows, matching the reference memorandum exactly
  const TOTAL_ROWS = 15;
  const paddedItems = [...normalizedItems];
  while (paddedItems.length < TOTAL_ROWS) paddedItems.push(null);
  const displayRows = paddedItems.slice(0, TOTAL_ROWS);

  // Totals
  const totalAmount = normalizedItems.reduce((sum, i) => sum + (Number(i?.amount) || 0), 0);
  const totalAmountDisplay = totalAmount > 0
    ? totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TAKAT GEMS SR CO., LTD.</title>
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
      margin-bottom: 6px;
    }

    .header-table td {
      vertical-align: top;
    }

    .header-left {
      width: 36%;
      font-size: 10px;
      line-height: 1.35;
    }

    .company-title {
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 0.2px;
      margin-bottom: 3px;
      white-space: nowrap;
    }

    .address-line {
      font-size: 10px;
      color: #111;
    }

    .header-center {
      width: 28%;
      text-align: center;
    }

    .logo-container {
      margin: 0 auto 2px auto;
      display: inline-block;
    }

    .sr-wordmark {
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }

    .by-subtext {
      font-style: italic;
      font-size: 8px;
      color: #333;
    }

    .est-text {
      font-size: 7.5px;
      color: #444;
      margin-bottom: 4px;
    }

    .memo-heading {
      font-size: 14px;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 1.5px;
      margin-top: 3px;
    }

    .header-right {
      width: 36%;
      font-size: 10px;
      text-align: right;
      padding-top: 4px;
    }

    .field-row {
      margin-bottom: 5px;
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
      font-family: "Times New Roman", Times, serif;
      font-size: 10px;
      min-height: 12px;
      width: 165px;
    }

    /* LEGAL DISCLAIMER PARAGRAPH */
    .legal-disclaimer {
      font-size: 8px;
      text-align: justify;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    /* MAIN TABLE */
    .main-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      margin-bottom: 4px;
    }

    .main-table th, .main-table td {
      border: 1px solid #000;
      padding: 3px 2px;
      font-size: 9px;
    }

    .main-table th {
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      font-size: 8.5px;
      line-height: 1.15;
    }

    .col-no { width: 30px; text-align: center; }
    .col-desc { text-align: left; }
    .col-qty { width: 62px; text-align: center; }
    .col-price { width: 70px; text-align: center; }
    .col-amount { width: 75px; text-align: center; }
    .col-remark { width: 75px; text-align: center; }

    .main-table tbody tr {
      height: 20px;
    }

    .main-table tbody td {
      vertical-align: middle;
    }

    .cell-no {
      text-align: center;
    }

    .cell-desc {
      text-align: left;
      padding-left: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cell-num {
      text-align: center;
    }

    .cell-price {
      text-align: center;
    }

    .cell-amount {
      text-align: right;
      padding-right: 5px;
    }

    .cell-remark {
      text-align: center;
    }

    /* FOOTER TOTALS ROW (inside table) */
    .footer-total-label {
      text-align: center;
      font-weight: bold;
      font-size: 9px;
    }

    .footer-total-val {
      text-align: center;
      font-weight: bold;
      font-size: 9px;
    }

    /* BELOW-TABLE FIELDS: Total Parcels / Memo Clearing Date / Terms Of Payment */
    .below-table-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .below-field {
      display: flex;
      align-items: baseline;
    }

    .below-field-label {
      font-weight: bold;
      white-space: nowrap;
      margin-right: 4px;
    }

    .below-field-blank {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 90px;
      min-height: 12px;
      text-align: center;
    }

    /* TREATMENT DISCLAIMER */
    .treatment-disclaimer {
      font-size: 8.5px;
      text-align: justify;
      line-height: 1.3;
      margin-top: 4px;
      margin-bottom: 30px;
    }

    .treatment-disclaimer .received-line {
      font-weight: bold;
      margin-top: 2px;
    }

    /* SIGNATURE ROW */
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }

    .signature-col {
      width: 48%;
      vertical-align: bottom;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      height: 28px;
      margin-bottom: 3px;
    }

    .signature-label {
      font-size: 10px;
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
          <div class="address-line">E : info@takatsr.com</div>
        </td>

        <!-- Center Column -->
        <td class="header-center">
          <div class="logo-container">
            ${logoBase64 ? `<img
  src="${logoBase64}"
  alt="SR-TAKAT Logo"
  style="max-height: 100px; max-width: 300px; object-fit: contain;"
/>` : `
            <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" stroke="#000" stroke-width="2.5" fill="none"/>
              <text x="35" y="62" font-family="Times New Roman, serif" font-size="44" font-weight="bold" fill="#000">S</text>
              <text x="48" y="66" font-family="Times New Roman, serif" font-size="44" font-weight="bold" font-style="italic" fill="#000">R</text>
            </svg>
            <div class="sr-wordmark">TAKAT-SR</div>
            <div class="by-subtext">by Siraj Takat</div>
            <div class="est-text">Est. 1955</div>
            `}
          </div>
          <div class="memo-heading">INVOICE</div>
        </td>

        <!-- Right Column -->
        <td class="header-right">
          <div class="field-row">
            <span class="field-label">DATE:</span>
            <span class="field-blank">${formattedDate}</span>
          </div>
          <div class="field-row">
            <span class="field-label">TO:</span>
            <span class="field-blank">${customerName}</span>
          </div>
          <div class="field-row">
            <span class="field-label">ADDRESS:</span>
            <span class="field-blank">${addressLine1}</span>
          </div>
          <div class="field-row">
            <span class="field-label" style="visibility:hidden;">ADDRESS:</span>
            <span class="field-blank">${addressLine2}</span>
          </div>
          <div class="field-row">
            <span class="field-label">ATTENTION:</span>
            <span class="field-blank">${attention}</span>
          </div>
          <div class="field-row">
            <span class="field-label">TEL:</span>
            <span class="field-blank">${customerPhone}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- LEGAL DISCLAIMER PARAGRAPH (exact reference wording) -->
    <div class="legal-disclaimer">
      The goods described and valued as below are delivered to you for EXAMINATION AND INSPECTION ONLY and are the property of TAKAT GEMS SR CO., LTD.. This merchandise is subject to their order and shall be returned to them on demand. Such merchandise, until returned to them and actually received, are at your risk from all hazards. NO RIGHT OR POWER IS GIVEN TO YOU TO SELL, PLEDGE, HYPOTHECATE OR OTHERWISE DISPOSE OF THIS MERCHANDISE regardless of prior transactions. A sale of this merchandise can only be effected and title will pass only if, as and when the said TAKAT GEMS SR CO., LTD. shall agree to such a sale and a bill of sale rendered thereof.
    </div>

    <!-- MAIN TABLE (exact reference columns, 15 fixed rows) -->
    <table class="main-table">
      <thead>
        <tr>
          <th class="col-no">NO.</th>
          <th class="col-desc">DESCRIPTION</th>
          <th class="col-qty">QTY GIVEN<br/>PCS / CTS</th>
          <th class="col-qty">RETURN<br/>PCS / CTS</th>
          <th class="col-qty">KEPT<br/>PCS / CTS</th>
          <th class="col-price">PRICE<br/>PER CTS. $</th>
          <th class="col-amount">AMOUNT</th>
          <th class="col-remark">REMARK</th>
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
                <td class="cell-num"></td>
                <td class="cell-num"></td>
                <td class="cell-price"></td>
                <td class="cell-amount"></td>
                <td class="cell-remark"></td>
              </tr>`;
        }
        return `<tr>
              <td class="cell-no">${rowNo}</td>
              <td class="cell-desc">${item.description}</td>
              <td class="cell-num">${item.qtyGiven}</td>
              <td class="cell-num">${item.returnVal}</td>
              <td class="cell-num">${item.kept}</td>
              <td class="cell-price">${item.pricePerCts}</td>
              <td class="cell-amount">${item.amount}</td>
              <td class="cell-remark">${item.remark}</td>
            </tr>`;
      })
      .join("")}
        <!-- FOOTER TOTALS ROW -->
        <tr>
          <td colspan="2" class="footer-total-label">TOTAL PCS &amp; CTS</td>
          <td class="footer-total-val"></td>
          <td class="footer-total-val"></td>
          <td class="footer-total-val"></td>
          <td class="footer-total-label" style="text-align:right; padding-right:4px;">TOTAL<br/>US$</td>
          <td class="footer-total-val" colspan="2">${totalAmountDisplay}</td>
        </tr>
      </tbody>
    </table>

    <!-- BELOW-TABLE FIELDS -->
    <div class="below-table-row">
      <div class="below-field">
        <span class="below-field-label">Total Parcels :</span>
        <span class="below-field-blank">${totalParcels}</span>
      </div>
      <div class="below-field">
        <span class="below-field-label">Clearing Date :</span>
        <span class="below-field-blank">${memoClearingDate}</span>
      </div>
      <div class="below-field">
        <span class="below-field-label">Terms Of Payment :</span>
        <span class="below-field-blank">${termsOfPayment}</span>
      </div>
    </div>

    <!-- TREATMENT DISCLAIMER (exact reference wording) -->
    <div class="treatment-disclaimer">
      ALL OUR COLORED GEMSTONES ARE "E" (ENHANCED) AND/OR (TREATED). In general, some of the enhancement methods used are heating, oiling, filling, with resin agents, etc. Some of the treatment methods used are coating, diffusion, dyeing, joban oil, glass filling, irradiation, lasering, etc, we do not know the methods used prior to our import since each country uses different methods. If required, we may send the stones to a laboratory for more information prior to your purchase.
      <div class="received-line">I have received the above goods in court quantity and in order.</div>
    </div>

    <!-- SIGNATURE ROW -->
    <table class="signature-table">
      <tr>
        <td class="signature-col">
          <div class="signature-line"></div>
          <div class="signature-label">Chop/Signature of Issuer:</div>
        </td>
        <td style="width: 4%;"></td>
        <td class="signature-col">
          <div class="signature-line"></div>
          <div class="signature-label">Chop/Signature of Receiver:</div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}