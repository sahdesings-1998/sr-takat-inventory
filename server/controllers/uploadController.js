import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";
import { uploadToCloudinary, getAccessibleUrl } from "../services/cloudinaryService.js";
import ApiError from "../utils/ApiError.js";

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  console.log(`[uploadController] Received file: "${req.file.originalname}", MIME: "${req.file.mimetype}", Size: ${req.file.size} bytes`);

  // Upload memory buffer to Cloudinary with original file metadata
  const result = await uploadToCloudinary(req.file.buffer, "uploads", {
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
  });

  const isPdf =
    req.file.mimetype === "application/pdf" ||
    req.file.originalname.toLowerCase().endsWith(".pdf") ||
    (req.file.buffer.length >= 4 &&
      req.file.buffer[0] === 0x25 &&
      req.file.buffer[1] === 0x50);

  const accessibleUrl = result.accessible_url || result.secure_url;

  sendSuccess(res, {
    message: "File uploaded successfully",
    data: {
      url: accessibleUrl,
      secureUrl: accessibleUrl,
      rawCloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      format: isPdf ? "pdf" : (result.format || req.file.mimetype.split("/")[1]),
      bytes: result.bytes || req.file.size,
    },
  });
});

/**
 * Proxy endpoint to serve binary PDF files directly with correct Content-Type headers.
 * Resolves restricted Cloudinary URLs via signed private download URLs if 401 occurs.
 * GET /api/v1/upload/proxy?url=...&publicId=...&name=...&download=true
 */
export const proxyFile = catchAsync(async (req, res) => {
  const { url, publicId, name, download } = req.query;

  if (!url && !publicId) {
    throw new ApiError(400, "Missing file URL or publicId parameter.");
  }

  let targetUrl = url;

  // If publicId is provided or URL is Cloudinary, construct accessible signed URL
  if (publicId) {
    targetUrl = getAccessibleUrl(publicId, "image", "pdf");
  }

  try {
    console.log(`[uploadController/proxy] Attempting to fetch remote file: ${targetUrl}`);
    let remoteResp = await fetch(targetUrl);

    // If initial fetch returned 401 / 403, attempt signed URL extraction
    if (!remoteResp.ok && (remoteResp.status === 401 || remoteResp.status === 403) && targetUrl.includes("cloudinary.com")) {
      console.warn(`[uploadController/proxy] Direct fetch returned ${remoteResp.status}, generating signed private download URL...`);
      
      // Extract public ID from Cloudinary URL if possible
      const match = targetUrl.match(/\/(?:v\d+\/)?([^?]+)$/);
      if (match) {
        const extractedPublicId = match[1].replace(/\.pdf$/, "");
        const signedUrl = getAccessibleUrl(extractedPublicId, "image", "pdf");
        if (signedUrl) {
          console.log(`[uploadController/proxy] Retrying fetch with signed URL: ${signedUrl}`);
          remoteResp = await fetch(signedUrl);
        }
      }
    }

    if (!remoteResp.ok) {
      throw new ApiError(remoteResp.status, `Failed to retrieve file from storage (${remoteResp.statusText})`);
    }

    const arrayBuffer = await remoteResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Inspect magic bytes for PDF (%PDF -> 0x25 0x50 0x44 0x46)
    const isMagicPdf =
      buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    const isPdf = isMagicPdf || (targetUrl && targetUrl.toLowerCase().includes(".pdf")) || (name && name.toLowerCase().endsWith(".pdf"));

    const contentType = isPdf ? "application/pdf" : (remoteResp.headers.get("content-type") || "application/octet-stream");
    const cleanFileName = (name || "file").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const filenameWithExt = isPdf && !cleanFileName.toLowerCase().endsWith(".pdf") ? `${cleanFileName}.pdf` : cleanFileName;

    const dispositionType = download === "true" ? "attachment" : "inline";

    console.log(`[uploadController/proxy] Successfully proxied file: Size=${buffer.length} bytes, Content-Type="${contentType}", Disposition="${dispositionType}"`);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `${dispositionType}; filename="${filenameWithExt}"`);
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.send(buffer);
  } catch (err) {
    console.error("[uploadController/proxy] Error proxying file:", err);
    throw new ApiError(500, `Error retrieving file: ${err.message}`);
  }
});

export default {
  uploadFile,
  proxyFile,
};
