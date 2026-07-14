import Role from "../models/Role.js";
import ApiError from "../utils/ApiError.js";

async function getAllRoles() {
  return Role.find({ isDeleted: false }).sort({ createdAt: 1 });
}

async function getRoleById(id) {
  const role = await Role.findOne({ _id: id, isDeleted: false });
  if (!role) throw new ApiError(404, "Role not found");
  return role;
}

async function createRole(data) {
  const existing = await Role.findOne({ name: data.name, isDeleted: false });
  if (existing) throw new ApiError(409, "Role with this name already exists");

  return Role.create(data);
}

async function updateRole(id, data) {
  const role = await getRoleById(id);
  Object.assign(role, data);
  await role.save();
  return role;
}

async function deleteRole(id) {
  const role = await getRoleById(id);

  // Soft delete — mark as deleted, do not remove from DB
  await Role.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return role;
}

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
