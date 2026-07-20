import puppeteer from "puppeteer";
import { generateMemoHTML } from "../templates/memoTemplate.js";
import { generateInvoiceHTML } from "../templates/invoiceTemplate.js";

export async function generateInvoicePDFBuffer(
  invoiceData,
  documentType = "invoice"
) {
  if (!invoiceData) {
    throw new Error("Invoice data is required.");
  }

  const html =
    documentType === "memo"
      ? generateMemoHTML(invoiceData)
      : generateInvoiceHTML(invoiceData);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-software-rasterizer",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "8mm",
        bottom: "8mm",
        left: "10mm",
        right: "10mm",
      },
    });

    return Buffer.from(pdf);
  } catch (err) {
    console.error("=========== PDF ERROR ===========");
    console.error(err);
    console.error(err.stack);
    console.error("================================");

    throw new Error(`PDF Generation Error: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}