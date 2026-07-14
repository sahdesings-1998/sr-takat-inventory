import ApiError from "../utils/ApiError.js";

/**
 * Enforces role-based permissions server-side (Section 7: permissions must
 * never be trusted from the frontend alone). Must run after `auth`
 * middleware, since it relies on req.user.roleId being populated.
 *
 * Usage: router.post("/", auth, requirePermission("inventory.create"), handler)
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    const role = req.user?.roleId;

    if (!role) {
      throw new ApiError(403, "No role assigned to this account");
    }

    // Admins implicitly hold every permission.
    if (role.name === "Admin") return next();

    const granted = role.permissions || [];
    const hasAll = requiredPermissions.every((perm) => granted.includes(perm));

    if (!hasAll) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }

    next();
  };
}

/**
 * Restricts access to a specific set of role names, e.g.
 * requireRole("Admin", "Manager").
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roleName = req.user?.roleId?.name;

    if (!roleName || !allowedRoles.includes(roleName)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }

    next();
  };
}

export default { requirePermission, requireRole };
