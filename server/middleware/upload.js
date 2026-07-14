import multer from "multer";
import ApiError from "../utils/ApiError.js";

// Use memory storage to stream files directly to Cloudinary without writing to local disk
const storage = multer.memoryStorage();

// Allowed file types (supporting images and PDFs for certificates)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type: ${file.mimetype}. Only JPEG, JPG, PNG, WEBP, GIF, and PDF are supported.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;
