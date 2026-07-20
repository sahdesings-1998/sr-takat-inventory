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
  } catch (e) {}
  try {
    const fallbackPath = path.resolve(process.cwd(), "client/src/assets/logo.png");
    if (fs.existsSync(fallbackPath)) {
      return `data:image/png;base64,${fs.readFileSync(fallbackPath).toString("base64")}`;
    }
  } catch (e) {}
  return "";
}

export function generateMemoHTML(data = {}) {
  const logoBase64 = getLogoBase64();
  const {
    date = "",
    to = "",
    address = "",
    attention = "",
    tel = "",
    lineItems = [],
    totalParcels = "",
    memoClearingDate = "",
    termsOfPayment = "",
  } = data;

  // Format date helper if ISO or Date object passed
  let formattedDate = date;
  if (date && !isNaN(new Date(date).getTime()) && typeof date !== "number") {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    formattedDate = `${day}/${month}/${year}`;
  }

  // Address lines (handles multi-line input or string)
  let addressLines = ["", ""];
  if (address) {
    const lines = address.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) addressLines[0] = lines[0];
    if (lines.length > 1) addressLines[1] = lines.slice(1).join(", ");
  }

  // Ensure exactly 15 rows
  const paddedItems = [...lineItems];
  while (paddedItems.length < 15) {
    paddedItems.push(null);
  }
  const displayRows = paddedItems.slice(0, 15);

  // Compute totals
  let totalQtyGivenCts = 0;
  let totalQtyGivenPcs = 0;
  let hasQtyGivenCts = false;
  let hasQtyGivenPcs = false;

  let totalAmount = 0;
  let hasAmount = false;

  lineItems.forEach((item) => {
    if (item) {
      if (item.qtyGivenCts !== undefined && item.qtyGivenCts !== null && item.qtyGivenCts !== "") {
        totalQtyGivenCts += Number(item.qtyGivenCts) || 0;
        hasQtyGivenCts = true;
      }
      if (item.qtyGivenPcs !== undefined && item.qtyGivenPcs !== null && item.qtyGivenPcs !== "") {
        totalQtyGivenPcs += Number(item.qtyGivenPcs) || 0;
        hasQtyGivenPcs = true;
      }
      if (item.amount !== undefined && item.amount !== null && item.amount !== "") {
        totalAmount += Number(item.amount) || 0;
        hasAmount = true;
      }
    }
  });

  let totalQtyDisplay = "";
  if (hasQtyGivenCts && hasQtyGivenPcs) {
    totalQtyDisplay = `${totalQtyGivenPcs} Pcs / ${totalQtyGivenCts.toFixed(2)}`;
  } else if (hasQtyGivenCts) {
    totalQtyDisplay = totalQtyGivenCts.toFixed(2);
  } else if (hasQtyGivenPcs) {
    totalQtyDisplay = `${totalQtyGivenPcs} Pcs`;
  }

  const totalAmountDisplay = hasAmount ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TAKAT GEMS SR CO., LTD. - MEMORANDUM</title>
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

    .memo-heading {
      font-size: 12px;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 1px;
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

    /* LEGAL PARAGRAPH */
    .legal-disclaimer {
      font-size: 7.5px;
      text-align: justify;
      line-height: 1.15;
      margin-bottom: 4px;
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
      padding: 3px 2px;
      font-size: 9px;
    }

    .main-table th {
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      font-size: 8.5px;
      line-height: 1.1;
      background-color: #fff;
    }

    .col-no { width: 32px; text-align: center; }
    .col-desc { text-align: left; }
    .col-qty { width: 75px; text-align: center; }
    .col-return { width: 70px; text-align: center; }
    .col-kept { width: 70px; text-align: center; }
    .col-price { width: 80px; text-align: center; }
    .col-amount { width: 75px; text-align: right; }
    .col-remark { width: 70px; text-align: left; }

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
      padding-left: 4px;
      font-family: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cell-num {
      text-align: center;
    }

    .cell-amount {
      text-align: right;
      padding-right: 4px;
    }

    /* FOOTER ROW */
    .main-table tfoot td {
      font-weight: bold;
      height: 20px;
      vertical-align: middle;
      font-size: 9px;
    }

    .footer-total-label {
      text-align: right;
      padding-right: 8px;
    }

    /* BELOW TABLE ROW */
    .below-table-row {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 9.5px;
    }

    .below-table-row td {
      vertical-align: middle;
    }

    .parcel-circle {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 1px solid #000;
      border-radius: 50%;
      text-align: center;
      line-height: 19px;
      font-weight: bold;
      margin-left: 4px;
    }

    .line-blank {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 140px;
      padding-left: 4px;
    }

    /* TREATMENT DISCLAIMER */
    .treatment-disclaimer {
      font-size: 7.5px;
      text-align: justify;
      line-height: 1.15;
      margin-bottom: 24px;
    }

    /* SIGNATURE ROW */
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .signature-col {
      width: 48%;
      vertical-align: bottom;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      height: 25px;
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
          <div class="sr-wordmark">TAKAT-SR</div>
          <div class="by-subtext">by Siraj Takat</div>
          <div class="est-text">Est. 1955</div>
          <div class="memo-heading">MEMORANDUM</div>
        </td>

        <!-- Right Column -->
        <td class="header-right">
          <div class="field-row">
            <span class="field-label">DATE:</span>
            <span class="field-blank" style="width: 170px;">${formattedDate}</span>
          </div>
          <div class="field-row">
            <span class="field-label">TO:</span>
            <span class="field-blank" style="width: 170px;">${to}</span>
          </div>
          <div class="field-row">
            <span class="field-label">ADDRESS:</span>
            <span class="field-blank" style="width: 170px;">${addressLines[0]}</span>
          </div>
          <div class="field-row">
            <span class="field-label"></span>
            <span class="field-blank" style="width: 170px;">${addressLines[1]}</span>
          </div>
          <div class="field-row">
            <span class="field-label">ATTENTION:</span>
            <span class="field-blank" style="width: 170px;">${attention}</span>
          </div>
          <div class="field-row">
            <span class="field-label">TEL:</span>
            <span class="field-blank" style="width: 170px;">${tel}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- LEGAL PARAGRAPH -->
    <div class="legal-disclaimer">
      The goods described and valued as below are delivered to you for EXAMINATION AND INSPECTION ONLY and are the property of TAKAT GEMS SR CO., LTD.. This merchandise is subject to their order and shall be returned to them on demand. Such merchandise, until returned to them and actually received, are at your risk from all hazards. NO RIGHT OR POWER IS GIVEN TO YOU TO SELL, PLEDGE, HYPOTHECATE OR OTHERWISE DISPOSE OF THIS MERCHANDISE regardless of prior transactions. A sale of this merchandise can only be effected and title will pass only if, as and when the said TAKAT GEMS SR CO., LTD. shall agree to such a sale and a bill of sale rendered thereof.
    </div>

    <!-- MAIN TABLE -->
    <table class="main-table">
      <thead>
        <tr>
          <th class="col-no">NO.</th>
          <th class="col-desc">DESCRIPTION</th>
          <th class="col-qty">QTY GIVEN<br>PCS / CTS</th>
          <th class="col-return">RETURN<br>PCS / CTS</th>
          <th class="col-kept">KEPT<br>PCS / CTS</th>
          <th class="col-price">PRICE<br>PER CTS. $</th>
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
                <td class="cell-num"></td>
                <td class="cell-amount"></td>
                <td class="cell-desc"></td>
              </tr>`;
            }

            // Format values for populated row
            let qtyDisplay = "";
            if (item.qtyGivenCts !== undefined && item.qtyGivenCts !== null && item.qtyGivenCts !== "") {
              qtyDisplay = item.qtyGivenCts;
            } else if (item.qtyGivenPcs !== undefined && item.qtyGivenPcs !== null && item.qtyGivenPcs !== "") {
              qtyDisplay = `${item.qtyGivenPcs} Pcs`;
            }

            let returnDisplay = item.returnCts || (item.returnPcs ? `${item.returnPcs} Pcs` : "");
            let keptDisplay = item.keptCts || (item.keptPcs ? `${item.keptPcs} Pcs` : "");
            let priceDisplay = item.pricePerCts !== undefined && item.pricePerCts !== null && item.pricePerCts !== "" ? item.pricePerCts : "";
            let amountDisplay = item.amount !== undefined && item.amount !== null && item.amount !== "" ? Number(item.amount).toFixed(2) : "";

            return `<tr>
              <td class="cell-no">${rowNo}</td>
              <td class="cell-desc">${item.description || ""}</td>
              <td class="cell-num">${qtyDisplay}</td>
              <td class="cell-num">${returnDisplay}</td>
              <td class="cell-num">${keptDisplay}</td>
              <td class="cell-num">${priceDisplay}</td>
              <td class="cell-amount">${amountDisplay}</td>
              <td class="cell-desc">${item.remark || ""}</td>
            </tr>`;
          })
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" class="footer-total-label">TOTAL PCS & CTS</td>
          <td class="cell-num">${totalQtyDisplay}</td>
          <td></td>
          <td></td>
          <td class="footer-total-label">TOTAL US$</td>
          <td class="cell-amount">${totalAmountDisplay}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <!-- BELOW TABLE ROW -->
    <table class="below-table-row">
      <tr>
        <td style="width: 28%;">
          Total Parcels :
          ${totalParcels ? `<span class="parcel-circle">${totalParcels}</span>` : `<span class="line-blank" style="min-width: 80px;"></span>`}
        </td>
        <td style="width: 38%; text-align: center;">
          Memo Clearing Date : <span class="line-blank" style="min-width: 140px;">${memoClearingDate}</span>
        </td>
        <td style="width: 34%; text-align: right;">
          Terms Of Payment : <span class="line-blank" style="min-width: 130px;">${termsOfPayment}</span>
        </td>
      </tr>
    </table>

    <!-- TREATMENT DISCLAIMER -->
    <div class="treatment-disclaimer">
      ALL OUR COLORED GEMSTONES ARE "E" (ENHANCED) AND/OR (TREATED). In general, some of the enhancement methods used are heating, oiling, filling, with resin agents, etc. Some of the treatment methods used are coating, diffusion, dyeing, joban oil, glass filling, irradiation, lasering, etc, we do not know the methods used prior to our import since each country uses different methods. If required, we may send the stones to a laboratory for more information prior to your purchase.<br>
      <strong>I have received the above goods in court quantity and in order.</strong>
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
