import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateInvoicePDFBuffer } from "../services/pdfService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log("Generating sample PDF memorandum...");

  const sampleData = {
    invoiceNumber: "INV-2026-0001",
    date: "09/07/2026",
    to: "BKK GEM & JEWELRY BUILDING",
    address: "BKK GEM & JEWELRY BUILDING",
    attention: "VATSAL JI",
    tel: "",
    lineItems: [
      {
        description: "EMERALD OV/PS 4x3 AB2M 11TRKH",
        qtyGivenCts: 21.46,
        pricePerCts: "130/ct",
        amount: 2789.80,
        remark: "",
      },
      {
        description: "EMERALD OV/PS 4x3 AB2MR 11TRKH",
        qtyGivenCts: 40.03,
        pricePerCts: "150/ct",
        amount: 6004.50,
        remark: "",
      },
    ],
    totalParcels: "2",
    memoClearingDate: "",
    termsOfPayment: "",
  };

  try {
    const pdfBuffer = await generateInvoicePDFBuffer(sampleData);
    const outputPath = path.join(__dirname, "../uploads/sample_memorandum.pdf");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`Successfully generated sample PDF at: ${outputPath}`);
    console.log(`File size: ${pdfBuffer.length} bytes`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    process.exit(1);
  }
}

runTest();
