import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { generateMemoHTML } from "../templates/memoTemplate.js";
import { generateInvoiceHTML } from "../templates/invoiceTemplate.js";

/**
 * Resolves the Chrome/Chromium executable path across environments (Windows local & Linux Render)
 */
export function getChromeExecutablePath() {
  // 1. Check process.env.PUPPETEER_EXECUTABLE_PATH if explicitly configured
  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    typeof process.env.PUPPETEER_EXECUTABLE_PATH === "string" &&
    fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    console.log(`[pdfService] Using env PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2. Check standard Linux system browser paths (Render / Ubuntu / Debian)
  const linuxSystemPaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];
  for (const p of linuxSystemPaths) {
    if (fs.existsSync(p)) {
      console.log(`[pdfService] Found system Linux browser binary at: ${p}`);
      return p;
    }
  }

  // 3. Try standard Puppeteer executablePath()
  try {
    const defaultPath = puppeteer.executablePath();
    if (defaultPath && typeof defaultPath === "string" && fs.existsSync(defaultPath)) {
      console.log(`[pdfService] Using default Puppeteer executable path: ${defaultPath}`);
      return defaultPath;
    }
  } catch (err) {
    console.warn(`[pdfService] puppeteer.executablePath() lookup warning:`, err.message);
  }

  // 4. Fallback search in user home cache directory (.cache/puppeteer)
  const userHome = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\SHAN";
  const cacheBase = path.join(userHome, ".cache", "puppeteer", "chrome");

  if (fs.existsSync(cacheBase)) {
    try {
      const dirs = fs.readdirSync(cacheBase);
      for (const dir of dirs) {
        // Check Windows path
        const winExecPath = path.join(cacheBase, dir, "chrome-win64", "chrome.exe");
        if (fs.existsSync(winExecPath)) {
          console.log(`[pdfService] Found cached Windows browser binary at: ${winExecPath}`);
          return winExecPath;
        }

        // Check Linux path
        const linuxExecPath = path.join(cacheBase, dir, "chrome-linux64", "chrome");
        if (fs.existsSync(linuxExecPath)) {
          console.log(`[pdfService] Found cached Linux browser binary at: ${linuxExecPath}`);
          return linuxExecPath;
        }
      }
    } catch (e) {
      console.warn(`[pdfService] Error inspecting cache folder:`, e.message);
    }
  }

  console.warn(`[pdfService] No explicit executable path found. Allowing Puppeteer to launch with internal default.`);
  return undefined;
}

/**
 * Renders an invoice/memorandum HTML template to a PDF Buffer using Puppeteer.
 * @param {Object} invoiceData
 * @param {String} documentType "invoice" | "memo"
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateInvoicePDFBuffer(invoiceData, documentType = "invoice") {
  console.log(`[pdfService] Starting PDF generation | documentType: ${documentType} | NODE_ENV: ${process.env.NODE_ENV}`);

  if (!invoiceData) {
    throw new Error("[pdfService] Invoice data is required for PDF generation");
  }

  let htmlContent = "";
  try {
    htmlContent = documentType === "memo"
      ? generateMemoHTML(invoiceData)
      : generateInvoiceHTML(invoiceData);
    console.log(`[pdfService] HTML template rendered successfully (${htmlContent.length} chars)`);
  } catch (templateErr) {
    console.error(`[pdfService] HTML Template Rendering Error:`, templateErr);
    throw new Error(`Failed to render HTML template: ${templateErr.message}`);
  }

  let browser = null;
  try {
    const executablePath = getChromeExecutablePath();
    console.log(`[pdfService] Launching Puppeteer with executablePath: ${executablePath || "default"}`);

    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
    ];

    const launchOptions = {
      headless: true,
      args: launchArgs,
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);
    console.log(`[pdfService] Puppeteer browser launched successfully`);

    const page = await browser.newPage();
    console.log(`[pdfService] New browser page created. Setting content...`);

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    console.log(`[pdfService] Page content loaded. Generating PDF...`);

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
    console.log(`[pdfService] PDF generation completed successfully (${buffer.length} bytes)`);

    if (!buffer || buffer.length === 0) {
      throw new Error("PDF generation produced an empty 0-byte buffer");
    }

    return buffer;
  } catch (err) {
    console.error("========== PDF SERVICE EXCEPTION ==========");
    console.error(`Message: ${err.message}`);
    console.error(`Stack:\n${err.stack}`);
    console.error("==========================================");
    throw err;
  } finally {
    if (browser) {
      try {
        const isConnected = typeof browser.isConnected === "function" ? browser.isConnected() : true;
        if (isConnected) {
          await browser.close();
          console.log(`[pdfService] Browser closed cleanly.`);
        }
      } catch (closeErr) {
        console.warn(`[pdfService] Browser close warning:`, closeErr.message);
      }
    }
  }
}