import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { generateMemoHTML } from "../templates/memoTemplate.js";
import { generateInvoiceHTML } from "../templates/invoiceTemplate.js";
import { generatePurchaseInvoiceHTML } from "../templates/purchaseInvoiceTemplate.js";

/**
 * Resolves the browser executable path based on environment:
 * - Production / Linux (Render): Uses @sparticuz/chromium binary bundle.
 * - Local Development (Windows/macOS): Auto-detects local installed Chrome or Edge.
 */
async function getExecutablePath() {
  const isLinuxOrProd = process.env.NODE_ENV === "production" || process.platform === "linux";

  if (isLinuxOrProd) {
    try {
      const linuxPath = await chromium.executablePath();
      if (linuxPath && fs.existsSync(linuxPath)) {
        return linuxPath;
      }
    } catch (e) {
      console.warn("[pdfService] chromium.executablePath() resolution warning:", e.message);
    }
  }

  // Common local Chrome & Chromium-edge installation paths for local development
  const localPaths = [
    // Windows Chrome
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe"),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google\\Chrome\\Application\\chrome.exe"),
    process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], "Google\\Chrome\\Application\\chrome.exe"),
    // Windows MS Edge (Chromium engine)
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    // macOS Chrome
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    // Linux Chrome
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);

  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Check cached Puppeteer browser binary if present
  const userHome = process.env.USERPROFILE || process.env.HOME;
  if (userHome) {
    const cacheBase = path.join(userHome, ".cache", "puppeteer", "chrome");
    if (fs.existsSync(cacheBase)) {
      try {
        const dirs = fs.readdirSync(cacheBase);
        for (const dir of dirs) {
          const winExec = path.join(cacheBase, dir, "chrome-win64", "chrome.exe");
          if (fs.existsSync(winExec)) return winExec;
          const linuxExec = path.join(cacheBase, dir, "chrome-linux64", "chrome");
          if (fs.existsSync(linuxExec)) return linuxExec;
        }
      } catch (e) {}
    }
  }

  // Fallback to sparticuz chromium executable path
  try {
    return await chromium.executablePath();
  } catch (e) {
    return undefined;
  }
}

/**
 * Renders an invoice or memorandum HTML template to a PDF Buffer using puppeteer-core + @sparticuz/chromium.
 * @param {Object} invoiceData Invoice/Memo document data object
 * @param {String} documentType "invoice" | "memo" | "purchase_invoice"
 * @returns {Promise<Buffer>} PDF Binary Buffer
 */
export async function generateInvoicePDFBuffer(invoiceData, documentType = "invoice") {
  const isProduction = process.env.NODE_ENV === "production" || process.platform === "linux";
  console.log(`[pdfService] PDF generation started | documentType: ${documentType} | environment: ${process.env.NODE_ENV || "development"} | OS: ${process.platform}`);

  if (!invoiceData) {
    throw new Error("Invoice data object is required for PDF generation.");
  }

  let htmlContent = "";
  try {
    if (documentType === "purchase_invoice") {
      htmlContent = generatePurchaseInvoiceHTML(invoiceData);
    } else if (documentType === "memo") {
      htmlContent = generateMemoHTML(invoiceData);
    } else {
      htmlContent = generateInvoiceHTML(invoiceData);
    }
    console.log(`[pdfService] HTML template rendered successfully (${htmlContent.length} characters)`);
  } catch (err) {
    console.error(`[pdfService] HTML Template Rendering Error:`, err);
    throw new Error(`Failed to render HTML template: ${err.message}`);
  }

  let browser = null;
  try {
    const executablePath = await getExecutablePath();
    console.log(`[pdfService] Launching puppeteer-core | executablePath: ${executablePath || "default"}`);

    // Production-safe launch arguments
    const standardArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-software-rasterizer",
    ];

    const launchArgs = isProduction && chromium.args
      ? Array.from(new Set([...chromium.args, ...standardArgs]))
      : standardArgs;

    browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: isProduction && chromium.defaultViewport ? chromium.defaultViewport : { width: 1280, height: 800 },
      executablePath,
      headless: isProduction && typeof chromium.headless === "boolean" ? chromium.headless : true,
    });

    console.log(`[pdfService] puppeteer-core browser launched successfully`);

    const page = await browser.newPage();
    console.log(`[pdfService] New browser page opened. Setting HTML content...`);

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log(`[pdfService] Page content loaded. Generating A4 PDF buffer...`);

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "8mm",
        bottom: "8mm",
        left: "10mm",
        right: "10mm",
      },
    });

    const buffer = Buffer.from(pdfUint8Array);
    console.log(`[pdfService] PDF generated successfully (${buffer.length} bytes)`);

    if (!buffer || buffer.length === 0) {
      throw new Error("Generated PDF binary buffer is empty (0 bytes).");
    }

    return buffer;
  } catch (err) {
    console.error("========== PDF SERVICE EXCEPTION ==========");
    console.error(`Message: ${err.message}`);
    console.error(`Stack:\n${err.stack}`);
    console.error("==========================================");
    throw new Error(`PDF Generation Error: ${err.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log(`[pdfService] Browser closed cleanly.`);
      } catch (closeErr) {
        console.warn(`[pdfService] Warning closing browser:`, closeErr.message);
      }
    }
  }
}