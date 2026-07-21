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
 * Uploads a file buffer directly to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object>} - The Cloudinary upload result containing secure_url, public_id, etc.
 */
export const uploadToCloudinary = (fileBuffer, folder = "sr_takat", resourceType = "auto") => {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, `Cloudinary Upload Error: ${error.message}`));
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a file from Cloudinary by its public ID.
 * @param {string} publicId - The Cloudinary public ID of the resource
 * @returns {Promise<object>} - The Cloudinary destruction result
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  ensureConfig();
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    throw new ApiError(500, `Cloudinary Deletion Error: ${error.message}`);
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
};
