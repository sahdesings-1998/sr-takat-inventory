/**
 * Operational error class carrying an HTTP status code.
 * Thrown from services/controllers and caught by middleware/errorHandler.js.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
