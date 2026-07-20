import ApiError from "../utils/ApiError.js";

/**
 * Centralized error handler. Normalizes Mongoose/JWT/validation errors into
 * the same { success:false, message, errors } envelope as ApiError.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal server error";
    let errors = [];

    if (error.name === "ValidationError") {
      // Mongoose schema validation error
      statusCode = 400;
      errors = Object.values(error.errors).map((e) => e.message);
      message = "Validation failed";
    } else if (error.code === 11000) {
      // Mongo duplicate key
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0];
      message = field ? `${field} already exists` : "Duplicate value";
    } else if (error.name === "CastError") {
      statusCode = 400;
      message = `Invalid value for ${error.path}`;
    } else if (error.name === "MulterError") {
      statusCode = 400;
      if (error.code === "LIMIT_FILE_SIZE") {
        message = "File is too large. Maximum size allowed is 10MB.";
      } else {
        message = `Upload error: ${error.message}`;
      }
    }

    error = new ApiError(statusCode, message, errors);
  }

  // Always log error details in server logs for debugging
  console.error(`[API ERROR] ${req.method} ${req.originalUrl} - Status ${error.statusCode || 500}: ${err.message || error.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    errors: error.errors || [],
  });
}
