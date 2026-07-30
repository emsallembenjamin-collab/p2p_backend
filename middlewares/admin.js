const jwt = require('jsonwebtoken');

const config = require('../config/auth');
const { AccountRole, AdminRole } = require('../controllers/constant');
const RoleService = require('../controllers/Database/role');
const { extractBearerToken } = require('../utils/authorization');
const { createPermissionMiddleware, hasPermission } = require('../utils/permissions');

function decodeAdmin(req) {
  try {
    const token = extractBearerToken(req.get('authorization'));
    return jwt.verify(token, config.secret);
  } catch (error) {
    return null;
  }
}

function attachAdmin(req, admin) {
  req.email = admin.email;
  req.adminUuid = admin.adminUuid;
  req.role = admin.role;
  req.admin = admin;
}

function authenticateAdmin({ requireTwoFactor = true } = {}) {
  return function adminAuthentication(req, res, next) {
    const admin = decodeAdmin(req);

    if (!admin) {
      return res.status(401).send({ error: 'Unauthorized user' });
    }

    if (requireTwoFactor && admin.enable2FA && !admin.verified_2fa) {
      return res.status(403).send({ error: 'Two-factor verification is required' });
    }

    attachAdmin(req, admin);
    return next();
  };
}

const permissionOptions = {
  getRole: (roleId) => RoleService.getRole(roleId),
  superAdminRole: AccountRole.SUPER_ADMIN,
};

const checkAdmin = authenticateAdmin();
const checkAdminWithout2FA = authenticateAdmin({ requireTwoFactor: false });

const checkUpdateAdmin = createPermissionMiddleware(
  AdminRole.UPDATE_ADMIN,
  permissionOptions,
);
const checkUpdateSetting = createPermissionMiddleware(
  AdminRole.UPDATE_SETTING,
  permissionOptions,
);
const checkUpdateCommissionSetup = createPermissionMiddleware(
  AdminRole.UPDATE_COMMISSION_SETUP,
  permissionOptions,
);
const checkUpdateWithdrawStatus = createPermissionMiddleware(
  AdminRole.APPROVE_WITHDRAW,
  permissionOptions,
);
const checkUpdateUser = createPermissionMiddleware(
  AdminRole.UPDATE_USER,
  permissionOptions,
);
const checkUpdateIBUser = createPermissionMiddleware(
  AdminRole.UPDATE_IBUSER,
  permissionOptions,
);

const checkRole = (permission, admin) => hasPermission(
  admin,
  permission,
  permissionOptions,
);

module.exports = {
  authenticateAdmin,
  checkAdmin,
  checkAdminWithout2FA,
  checkRole,
  checkUpdateAdmin,
  checkUpdateCommissionSetup,
  checkUpdateIBUser,
  checkUpdateSetting,
  checkUpdateUser,
  checkUpdateWithdrawStatus,
};
