import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { generateMemoHTML } from "../templates/memoTemplate.js";
import { generateInvoiceHTML } from "../templates/invoiceTemplate.js";

/**
 * Resolves the Chrome executable path if default lookup fails
 */
// function getChromeExecutablePath() {
//   if (process.env.PUPPETEER_EXECUTABLE_PATH && typeof process.env.PUPPETEER_EXECUTABLE_PATH === "string" && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
//     return process.env.PUPPETEER_EXECUTABLE_PATH;
//   }

function getChromeExecutablePath() {
  if (process.env.NODE_ENV === "production") {
    return puppeteer.executablePath();
  }

  try {
    const defaultPath = puppeteer.executablePath();
    if (defaultPath && typeof defaultPath === "string" && fs.existsSync(defaultPath)) return defaultPath;
  } catch (e) {
    // Continue fallback search
  }

  const userHome = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\SHAN";
  const cacheBase = path.join(userHome, ".cache", "puppeteer", "chrome");

  if (fs.existsSync(cacheBase)) {
    const dirs = fs.readdirSync(cacheBase);
    for (const dir of dirs) {
      const execPath = path.join(cacheBase, dir, "chrome-win64", "chrome.exe");
      if (fs.existsSync(execPath)) {
        return execPath;
      }
    }
  }

  return undefined;
}

/**
 * Renders an invoice/memorandum HTML template to a PDF Buffer using Puppeteer.
 * @param {Object} invoiceData
 * @param {String} documentType "invoice" | "memo"
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateInvoicePDFBuffer(invoiceData, documentType = "invoice") {
  const htmlContent = documentType === "memo"
    ? generateMemoHTML(invoiceData)
    : generateInvoiceHTML(invoiceData);

  let browser = null;
  try {
    // const launchOptions = {
    //   headless: "new",
    //   args: [
    //     "--no-sandbox",
    //     "--disable-setuid-sandbox",
    //     "--disable-dev-shm-usage",
    //     "--disable-gpu",
    //   ],
    // };



    // const execPath = getChromeExecutablePath();
    // if (execPath) {
    //   launchOptions.executablePath = execPath;
    // }

    // browser = await puppeteer.launch(launchOptions);

    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.NODE_ENV === "production"
          ? puppeteer.executablePath()
          : getChromeExecutablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "8mm",
        bottom: "8mm",
        left: "10mm",
        right: "10mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Executable Path:", launchOptions.executablePath);
console.log("Puppeteer Path:", puppeteer.executablePath());
