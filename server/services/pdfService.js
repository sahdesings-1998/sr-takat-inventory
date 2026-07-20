import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { generateMemoHTML } from "../templates/memoTemplate.js";
import { generateInvoiceHTML } from "../templates/invoiceTemplate.js";

/**
 * Resolves the Chrome executable path
 */
function getChromeExecutablePath() {
  if (process.env.NODE_ENV === "production") {
    return puppeteer.executablePath();
  }

  try {
    const defaultPath = puppeteer.executablePath();

    if (
      defaultPath &&
      typeof defaultPath === "string" &&
      fs.existsSync(defaultPath)
    ) {
      return defaultPath;
    }
  } catch (err) {
    // Ignore and continue
  }

  const userHome =
    process.env.USERPROFILE ||
    process.env.HOME ||
    "C:\\Users\\SHAN";

  const cacheBase = path.join(
    userHome,
    ".cache",
    "puppeteer",
    "chrome"
  );

  if (fs.existsSync(cacheBase)) {
    const dirs = fs.readdirSync(cacheBase);

    for (const dir of dirs) {
      const execPath = path.join(
        cacheBase,
        dir,
        "chrome-win64",
        "chrome.exe"
      );

      if (fs.existsSync(execPath)) {
        return execPath;
      }
    }
  }

  return undefined;
}

export async function generateInvoicePDFBuffer(
  invoiceData,
  documentType = "invoice"
) {
  const htmlContent =
    documentType === "memo"
      ? generateMemoHTML(invoiceData)
      : generateInvoiceHTML(invoiceData);

  let browser;

  try {
    const executablePath =
      process.env.NODE_ENV === "production"
        ? await puppeteer.executablePath()
        : getChromeExecutablePath();

    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("Executable Path:", executablePath);

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
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
  } catch (err) {
    console.error("========== PDF ERROR ==========");
    console.error(err);
    console.error(err.stack);
    console.error("===============================");

    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}