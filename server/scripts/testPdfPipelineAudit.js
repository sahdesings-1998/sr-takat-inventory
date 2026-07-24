import dotenv from "dotenv";
dotenv.config();

import { uploadToCloudinary } from "../services/cloudinaryService.js";

// Valid 1-page minimal PDF binary buffer (%PDF-1.4 header)
const samplePdfBuffer = Buffer.from(
  "%PDF-1.4\n" +
  "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
  "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n" +
  "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n" +
  "xref\n" +
  "0 4\n" +
  "0000000000 65535 f\n" +
  "0000000009 00000 n\n" +
  "0000000052 00000 n\n" +
  "0000000101 00000 n\n" +
  "trailer<</Size 4/Root 1 0 R>>\n" +
  "startxref\n" +
  "178\n" +
  "%%EOF\n"
);

async function runAudit() {
  console.log("=== STARTING END-TO-END PDF PIPELINE AUDIT ===");
  console.log(`STEP 1: Original PDF buffer size: ${samplePdfBuffer.length} bytes`);
  console.log(`STEP 1: Magic bytes check (%PDF): ${samplePdfBuffer.slice(0, 4).toString("ascii")}`);

  if (samplePdfBuffer.slice(0, 4).toString("ascii") !== "%PDF") {
    throw new Error("Sample PDF buffer is corrupted!");
  }

  console.log("STEP 2: Uploading sample PDF to Cloudinary via cloudinaryService...");
  const uploadResult = await uploadToCloudinary(samplePdfBuffer, "audit_test", {
    mimetype: "application/pdf",
    originalname: "test_invoice_sample.pdf",
  });

  console.log("STEP 2: Cloudinary Upload Success:");
  console.log(` - Secure URL: ${uploadResult.secure_url}`);
  console.log(` - Public ID: ${uploadResult.public_id}`);
  console.log(` - Resource Type: ${uploadResult.resource_type}`);
  console.log(` - Bytes: ${uploadResult.bytes}`);

  if (!uploadResult.secure_url.toLowerCase().endsWith(".pdf")) {
    console.warn("WARNING: Public URL does not end in .pdf extension!");
  }

  console.log("STEP 3: Testing HTTP GET request to Cloudinary secure_url...");
  const resp = await fetch(uploadResult.secure_url);
  const contentType = resp.headers.get("content-type");
  console.log(` - Response Status: ${resp.status}`);
  console.log(` - Content-Type: ${contentType}`);

  const arrayBuffer = await resp.arrayBuffer();
  const downloadedBuffer = Buffer.from(arrayBuffer);
  console.log(` - Downloaded Buffer Size: ${downloadedBuffer.length} bytes`);
  console.log(` - Magic bytes check: ${downloadedBuffer.slice(0, 4).toString("ascii")}`);

  if (downloadedBuffer.slice(0, 4).toString("ascii") !== "%PDF") {
    throw new Error("Downloaded PDF buffer from Cloudinary is corrupted!");
  }

  console.log("=== END-TO-END PDF PIPELINE AUDIT PASSED 100% SUCCESSFULLY! ===");
  process.exit(0);
}

runAudit().catch((err) => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});
