import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

async function getAllUsers() {
  // Only return users that are not soft-deleted.
  return User.find({ isDeleted: false }).populate("roleId").sort({ createdAt: -1 });
}

async function getUserById(id) {
  const user = await User.findOne({ _id: id, isDeleted: false }).populate("roleId");
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

async function createUser(data) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new ApiError(409, "User with this email already exists");

  const user = await User.create(data);
  return getUserById(user._id);
}

async function updateUser(id, data) {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw new ApiError(404, "User not found");

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new ApiError(409, "Email already in use");
  }

  // If password is provided, pre-save hook will hash it automatically since it is modified
  Object.assign(user, data);
  await user.save();

  return getUserById(user._id);
}

/**
 * Soft-delete a user by setting their status to "inactive".
 * The User record is preserved in the database for audit trail and referential integrity.
 */
async function deleteUser(id) {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw new ApiError(404, "User not found");

  user.status = "inactive";
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();

  return user.toSafeObject();
}

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
