import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService.js";

// Load env relative to script location
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testCloudinary() {
  console.log("Checking CLOUDINARY_URL in environment...");
  if (!process.env.CLOUDINARY_URL) {
    console.error("ERROR: CLOUDINARY_URL is NOT set in server/.env or environment variables!");
    process.exit(1);
  }
  console.log("Success: CLOUDINARY_URL environment variable is set.");

  // Create a 1x1 transparent PNG buffer
  const mockImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );

  console.log("Uploading 1x1 mock PNG image to Cloudinary...");
  try {
    const result = await uploadToCloudinary(mockImageBuffer, "testing_verification");
    console.log("SUCCESS: Uploaded to Cloudinary successfully!");
    console.log("Cloudinary Secure URL:", result.secure_url);
    console.log("Cloudinary Public ID:", result.public_id);

    console.log("Cleaning up: Deleting uploaded asset from Cloudinary...");
    const deleteResult = await deleteFromCloudinary(result.public_id);
    console.log("SUCCESS: Deleted asset from Cloudinary.", deleteResult);
  } catch (err) {
    console.error("FAILURE: Cloudinary operation failed:", err.message || err);
  }
}

testCloudinary();
