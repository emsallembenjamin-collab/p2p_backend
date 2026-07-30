function includesPermission(role, permission) {
  return Array.isArray(role?.permissions) && role.permissions.includes(permission);
}

async function hasPermission(admin, permission, options) {
  if (!admin || typeof admin !== 'object') {
    return false;
  }

  if (admin.role === options.superAdminRole) {
    return true;
  }

  if (!admin.subRole) {
    return false;
  }

  const role = await options.getRole(admin.subRole);
  return includesPermission(role, permission);
}

function createPermissionMiddleware(permission, options) {
  if (!permission) {
    throw new TypeError('permission is required');
  }

  if (typeof options?.getRole !== 'function') {
    throw new TypeError('options.getRole must be a function');
  }

  return async function requirePermission(req, res, next) {
    try {
      const allowed = await hasPermission(req.admin, permission, options);

      if (!allowed) {
        return res.status(403).send({
          error: 'Forbidden request',
          requiredPermission: permission,
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  createPermissionMiddleware,
  hasPermission,
  includesPermission,
};
