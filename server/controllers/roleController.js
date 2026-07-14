import roleService from "../services/roleService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles();
  sendSuccess(res, { message: "Roles retrieved successfully", data: roles });
});

export const getRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const role = await roleService.getRoleById(id);
  sendSuccess(res, { message: "Role retrieved successfully", data: role });
});

export const createRole = catchAsync(async (req, res) => {
  const role = await roleService.createRole(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "Role created successfully",
    data: role,
  });
});

export const updateRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const role = await roleService.updateRole(id, req.body);
  sendSuccess(res, { message: "Role updated successfully", data: role });
});

export const deleteRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  await roleService.deleteRole(id);
  sendSuccess(res, { message: "Role deleted successfully" });
});

export default {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
