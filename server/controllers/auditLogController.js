import AuditLog from "../models/AuditLog.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getAuditLogs = catchAsync(async (req, res) => {
  const logs = await AuditLog.find({}).sort({ timestamp: -1 }).populate("userId").limit(100);
  sendSuccess(res, { message: "Audit logs retrieved successfully", data: logs });
});

export default {
  getAuditLogs,
};
