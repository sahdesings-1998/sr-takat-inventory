import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

const url = process.env.CLOUDINARY_URL;
const matches = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
cloudinary.config({
  cloud_name: matches[3],
  api_key: matches[1],
  api_secret: matches[2],
  secure: true,
});

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

async function testTypes() {
  console.log("--- TEST 1: Uploading as resource_type: image with format: pdf ---");
  const resImage = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "test_type", resource_type: "image", format: "pdf" },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(samplePdfBuffer);
  });
  console.log("Uploaded as IMAGE:", resImage.secure_url);

  const getImg = await fetch(resImage.secure_url);
  console.log(`Fetch IMAGE status: ${getImg.status}, Content-Type: ${getImg.headers.get("content-type")}, Length: ${getImg.headers.get("content-length")}`);
  const imgBuf = Buffer.from(await getImg.arrayBuffer());
  console.log(`IMAGE magic bytes: "${imgBuf.slice(0, 4).toString("ascii")}"`);

  console.log("\n--- TEST 2: Uploading as resource_type: auto ---");
  const resAuto = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "test_type", resource_type: "auto", format: "pdf" },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(samplePdfBuffer);
  });
  console.log("Uploaded as AUTO:", resAuto.secure_url);

  const getAuto = await fetch(resAuto.secure_url);
  console.log(`Fetch AUTO status: ${getAuto.status}, Content-Type: ${getAuto.headers.get("content-type")}, Length: ${getAuto.headers.get("content-length")}`);
  const autoBuf = Buffer.from(await getAuto.arrayBuffer());
  console.log(`AUTO magic bytes: "${autoBuf.slice(0, 4).toString("ascii")}"`);

  process.exit(0);
}

testTypes().catch(console.error);
