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

async function testSignedUrl() {
  const publicId = "test_type/q96magydjam46a6exmzk";

  // Test 1: Signed private download URL
  const signedUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
    resource_type: "image",
    type: "upload",
  });
  console.log("Signed Private Download URL:\n", signedUrl);

  const getSigned = await fetch(signedUrl);
  console.log(`Fetch Signed Status: ${getSigned.status}, Content-Type: ${getSigned.headers.get("content-type")}, Length: ${getSigned.headers.get("content-length")}`);
  const buf = Buffer.from(await getSigned.arrayBuffer());
  console.log(`Magic bytes: "${buf.slice(0, 4).toString("ascii")}"`);

  // Test 2: Standard signed URL with sign_url: true
  const urlSigned = cloudinary.url(publicId + ".pdf", {
    resource_type: "image",
    type: "upload",
    sign_url: true,
    secure: true,
  });
  console.log("\nCloudinary signed URL:\n", urlSigned);

  const getUrlSigned = await fetch(urlSigned);
  console.log(`Fetch urlSigned Status: ${getUrlSigned.status}, Content-Type: ${getUrlSigned.headers.get("content-type")}, Length: ${getUrlSigned.headers.get("content-length")}`);
  const buf2 = Buffer.from(await getUrlSigned.arrayBuffer());
  console.log(`Magic bytes 2: "${buf2.slice(0, 4).toString("ascii")}"`);

  process.exit(0);
}

testSignedUrl().catch(console.error);
