import settingService from "../services/settingService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getSettings = catchAsync(async (req, res) => {
  const settings = await settingService.getSettings();
  sendSuccess(res, { message: "Settings retrieved successfully", data: settings });
});

export const updateSettings = catchAsync(async (req, res) => {
  const settings = await settingService.updateSettings(req.body);
  sendSuccess(res, { message: "Settings updated successfully", data: settings });
});

export default {
  getSettings,
  updateSettings,
};
