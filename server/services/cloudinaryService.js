import { v2 as cloudinary } from "cloudinary";
import ApiError from "../utils/ApiError.js";

/**
 * Ensures Cloudinary is properly configured using process.env.CLOUDINARY_URL
 */
function ensureConfig() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) {
    throw new ApiError(500, "Cloudinary configuration error: CLOUDINARY_URL environment variable is missing.");
  }
  const matches = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (!matches) {
    throw new ApiError(500, "Cloudinary configuration error: Invalid CLOUDINARY_URL format.");
  }
  cloudinary.config({
    cloud_name: matches[3],
    api_key: matches[1],
    api_secret: matches[2],
    secure: true,
  });
}

/**
 * Generates a signed, authenticated download/view URL for Cloudinary assets.
 * Bypasses 401 Unauthorized restriction on restricted Cloudinary PDF/raw assets.
 */
export function getAccessibleUrl(publicId, resourceType = "image", format = "") {
  ensureConfig();
  if (!publicId) return "";

  try {
    const cleanPublicId = publicId.replace(/\.[^/.]+$/, "");
    const ext = format || (publicId.toLowerCase().includes("pdf") ? "pdf" : "");

    if (ext === "pdf" || resourceType === "raw" || resourceType === "image") {
      const signedUrl = cloudinary.utils.private_download_url(cleanPublicId, ext || "pdf", {
        resource_type: resourceType || "image",
        type: "upload",
      });
      if (signedUrl) return signedUrl;
    }
  } catch (err) {
    console.warn("[CloudinaryService] Failed to generate signed private download URL:", err);
  }

  return cloudinary.url(publicId, { secure: true });
}

/**
 * Uploads a file buffer directly to Cloudinary with explicit PDF and MIME handling.
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {string|object} folder - Folder name or options object
 * @param {object} options - Custom options (mimetype, originalname, resourceType)
 * @returns {Promise<object>} - Cloudinary upload result containing secure_url, public_id, bytes, etc.
 */
export const uploadToCloudinary = (fileBuffer, folder = "sr_takat", options = {}) => {
  ensureConfig();

  let folderName = folder;
  let customOptions = {};

  if (typeof folder === "object" && folder !== null) {
    customOptions = folder;
    folderName = customOptions.folder || "sr_takat";
  } else if (typeof options === "object" && options !== null) {
    customOptions = options;
  }

  const mimeType = customOptions.mimetype || customOptions.mimeType || "";
  const originalName = customOptions.originalname || customOptions.originalName || "";

  // Check magic bytes (%PDF is 0x25 0x50 0x44 0x46)
  const isMagicPdf =
    fileBuffer &&
    fileBuffer.length >= 4 &&
    fileBuffer[0] === 0x25 &&
    fileBuffer[1] === 0x50 &&
    fileBuffer[2] === 0x44 &&
    fileBuffer[3] === 0x46;

  const isPdf =
    isMagicPdf ||
    mimeType === "application/pdf" ||
    originalName.toLowerCase().endsWith(".pdf");

  const resourceType = customOptions.resourceType || customOptions.resource_type || (isPdf ? "image" : "auto");
  const cleanName = (originalName ? originalName.replace(/\.[^/.]+$/, "") : "file")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = Date.now();
  const publicId = `${cleanName}_${timestamp}`;

  const uploadParams = {
    folder: folderName,
    public_id: publicId,
    resource_type: resourceType,
    ...(isPdf ? { format: "pdf" } : {}),
    use_filename: true,
    unique_filename: false,
    ...customOptions,
  };

  delete uploadParams.mimetype;
  delete uploadParams.mimeType;
  delete uploadParams.originalname;
  delete uploadParams.originalName;
  delete uploadParams.resourceType;

  return new Promise((resolve, reject) => {
    console.log(`[CloudinaryService] Uploading file to folder "${folderName}". IsPDF: ${isPdf}, ResourceType: "${resourceType}", PublicID: "${publicId}"`);

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadParams,
      (error, result) => {
        if (error) {
          console.error("[CloudinaryService] Upload error:", error);
          return reject(new ApiError(500, `Cloudinary Upload Error: ${error.message}`));
        }

        const fullPublicId = result.public_id;
        const accessibleUrl = isPdf ? getAccessibleUrl(fullPublicId, resourceType, "pdf") : result.secure_url;

        console.log(`[CloudinaryService] Upload successful. PublicID: "${fullPublicId}", Accessible URL: "${accessibleUrl}"`);

        resolve({
          ...result,
          accessible_url: accessibleUrl,
          secure_url: accessibleUrl || result.secure_url,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a file from Cloudinary by its public ID.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  ensureConfig();
  try {
    const isPdf = publicId.toLowerCase().includes("pdf");
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: isPdf ? "image" : "image",
    });
    return result;
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    throw new ApiError(500, `Cloudinary Deletion Error: ${error.message}`);
  }
};

export default {
  getAccessibleUrl,
  uploadToCloudinary,
  deleteFromCloudinary,
};
