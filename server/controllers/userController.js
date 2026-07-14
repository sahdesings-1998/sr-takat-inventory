import userService from "../services/userService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  // Map safe objects to avoid exposing password hashes
  const safeUsers = users.map(user => user.toSafeObject());
  sendSuccess(res, { message: "Users retrieved successfully", data: safeUsers });
});

export const getUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  sendSuccess(res, { message: "User retrieved successfully", data: user.toSafeObject() });
});

export const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "User created successfully",
    data: user.toSafeObject(),
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.updateUser(id, req.body);
  sendSuccess(res, { message: "User updated successfully", data: user.toSafeObject() });
});

export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  await userService.deleteUser(id);
  sendSuccess(res, { message: "User deleted successfully" });
});

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
