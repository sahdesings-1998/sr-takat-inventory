import notificationService from "../services/notificationService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user._id);
  sendSuccess(res, { message: "Notifications retrieved successfully", data: notifications });
});

export const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id, req.user._id);
  sendSuccess(res, { message: "Notification marked as read", data: notification });
});

export default {
  getNotifications,
  markAsRead,
};
