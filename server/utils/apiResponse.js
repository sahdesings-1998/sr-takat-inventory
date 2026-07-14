/**
 * Standard success envelope for all API responses.
 * { success: true, message, data }
 */
export function sendSuccess(res, { statusCode = 200, message = "OK", data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export default sendSuccess;
