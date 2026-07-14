import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";

async function getNotifications(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 });
}

async function markAsRead(id, userId) {
  const notif = await Notification.findOne({ _id: id, userId });
  if (!notif) throw new ApiError(404, "Notification not found");
  notif.isRead = true;
  return notif.save();
}

async function createNotification({
  title,
  message,
  type = "info",
  userId,
  referenceType = "None",
  referenceId = null,
}) {
  return Notification.create({
    title,
    message,
    type,
    userId,
    referenceType,
    referenceId,
    isRead: false,
  });
}

export default {
  getNotifications,
  markAsRead,
  createNotification,
};
